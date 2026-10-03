/**
 * Pruebas de la Fase 3 contra la base real: asignación, portal del joyero
 * (iniciar/terminar), control de calidad con retrabajo, entrega con sus
 * precondiciones, garantía sin cobro, vista del joyero sin precios y
 * desempeño.
 *
 *   npm run test:fase3
 *
 * Crea datos `zz-prueba-*` y los elimina al final.
 */
const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const cab = { apikey: clave, Authorization: `Bearer ${clave}`, "Accept-Profile": "joyeria", "Content-Profile": "joyeria", "Content-Type": "application/json", Prefer: "return=representation" };
let pasan = 0, fallan = 0;
const ok = (d) => { pasan++; console.log(`  [ok] ${d}`); };
const mal = (d, x = "") => { fallan++; console.log(`  [!!] ${d}${x ? ` — ${x}` : ""}`); };
const comprobar = (d, c, x) => (c ? ok(d) : mal(d, x));
async function rest(metodo, ruta, cuerpo) {
  const r = await fetch(`${url}/rest/v1/${ruta}`, { method: metodo, headers: cab, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const t = await r.text(); let json = null; try { json = t ? JSON.parse(t) : null; } catch { json = t; }
  return { ok: r.ok, status: r.status, json };
}
const get = (r) => rest("GET", r), post = (r, c) => rest("POST", r, c), patch = (r, c) => rest("PATCH", r, c), del = (r) => rest("DELETE", r);
const rpc = (fn, args) => rest("POST", `rpc/${fn}`, args);
const msg = (r) => (r.json && typeof r.json === "object" ? r.json.message ?? JSON.stringify(r.json) : String(r.json));

const usuarioId = (await get("usuarios?select=id&correo=eq.admin")).json?.[0]?.id;
const limpieza = { ordenes: [], clientes: [], joyeros: [], tiempos: [] };
async function limpiar() {
  await del("ordenes?descripcion_pieza=like.zz-prueba-*");
  await del("joyeros?nombre=like.zz-prueba-*");
  await del("clientes?nombre=like.zz-prueba-*");
  for (const t of limpieza.tiempos) await del(`tiempos_estandar?tipo_trabajo_id=eq.${t.tipo}&complejidad_id=eq.${t.comp}`);
}

try {
  const tipos = (await get("tipos_trabajo?select=id,categoria&activo=eq.true&order=id")).json.filter((t) => t.categoria === "reparacion");
  const comps = (await get("complejidades?select=id&order=orden")).json;
  const tA = tipos[0], cBaja = comps[0];
  if (!(await get(`tiempos_estandar?select=id&tipo_trabajo_id=eq.${tA.id}&complejidad_id=eq.${cBaja.id}`)).json?.length) {
    await post("tiempos_estandar", { tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, dias_habiles: 2 });
    limpieza.tiempos.push({ tipo: tA.id, comp: cBaja.id });
  }
  const cliente = (await post("clientes", { nombre: "zz-prueba-cliente3", telefono: "55551111" })).json[0];
  const joyero = (await post("joyeros", { nombre: "zz-prueba-joyero3", capacidad_maxima: 2 })).json[0];
  await post("tarifas_joyero", { joyero_id: joyero.id, tipo_trabajo_id: tA.id, complejidad_id: null, costo_acordado: 120, vigente_desde: "2026-10-01" });

  async function ordenAprobada(desc) {
    const o = (await rpc("fn_crear_orden", { p_cliente_id: cliente.id, p_tipo: "reparacion", p_pieza: { descripcion_pieza: desc }, p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, dias_estimados: 2, orden: 1 }], p_dias_estimados: 2, p_fecha_estimada: "2026-10-08", p_fecha_prometida: "2026-10-12", p_fecha_prometida_manual: false, p_usuario_id: usuarioId })).json;
    const c = (await rpc("fn_nueva_version_cotizacion", { p_orden_id: o.id, p_usuario_id: usuarioId })).json;
    await rpc("fn_guardar_cotizacion", { p_cotizacion_id: c.id, p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, precio_unitario: 500, costo_joyero: 120, orden: 1 }] });
    await rpc("fn_enviar_cotizacion", { p_cotizacion_id: c.id, p_usuario_id: usuarioId, p_valido_hasta: "2099-01-01" });
    const a = await rpc("fn_aprobar_cotizacion", { p_cotizacion_id: c.id, p_aprobada_por_nombre: "Cliente", p_usuario_id: usuarioId, p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, dias_estimados: 2, precio_cliente: 500, costo_joyero_estimado: 120, orden: 1 }], p_dias_estimados: 2, p_fecha_estimada: "2026-10-08", p_fecha_prometida: "2026-10-12" });
    return a.json;
  }

  console.log("\nAsignación");
  const orden = await ordenAprobada("zz-prueba-pieza3");
  comprobar("orden aprobada con precio 500", orden?.estado === "aprobada" && Number(orden.precio_cliente) === 500);
  const sinCosto = await rpc("fn_asignar_joyero", { p_orden_id: orden.id, p_joyero_id: joyero.id, p_costo: 0, p_instrucciones: "", p_fecha_compromiso: "2026-10-10", p_excede: false, p_usuario_id: usuarioId, p_comentario: "" });
  comprobar("asignar con costo 0 se rechaza", !sinCosto.ok && /mayor que cero/.test(msg(sinCosto)), msg(sinCosto));
  const asig = await rpc("fn_asignar_joyero", { p_orden_id: orden.id, p_joyero_id: joyero.id, p_costo: 120, p_instrucciones: "cuidado con la piedra", p_fecha_compromiso: "2026-10-13", p_excede: true, p_usuario_id: usuarioId, p_comentario: "" });
  comprobar("asignación creada (estado asignada, excede registrado)", asig.ok && asig.json?.estado === "asignada" && asig.json?.excede_fecha_cliente === true, msg(asig));
  const ordenAsig = (await get(`ordenes?select=estado&id=eq.${orden.id}`)).json[0];
  comprobar("la orden pasó a asignada", ordenAsig.estado === "asignada");
  const hist = (await get(`orden_estados_historial?select=comentario&orden_id=eq.${orden.id}&estado_nuevo=eq.asignada`)).json;
  comprobar("el historial registra la decisión de superar la fecha prometida", hist?.some((h) => /supera la fecha prometida/.test(h.comentario ?? "")), JSON.stringify(hist));
  const segunda = await rpc("fn_asignar_joyero", { p_orden_id: orden.id, p_joyero_id: joyero.id, p_costo: 120, p_instrucciones: "", p_fecha_compromiso: "2026-10-13", p_excede: false, p_usuario_id: usuarioId, p_comentario: "" });
  comprobar("no se asigna dos veces (orden ya asignada)", !segunda.ok);
  const vista = (await get(`vw_ordenes_tablero?select=joyero,fecha_control,fecha_compromiso_joyero&id=eq.${orden.id}`)).json[0];
  comprobar("la vista usa la fecha de compromiso del joyero como fecha de control", vista.joyero === "zz-prueba-joyero3" && vista.fecha_control === "2026-10-13", JSON.stringify(vista));

  console.log("\nPortal del joyero");
  const vj = (await get(`vw_trabajos_joyero?select=*&joyero_id=eq.${joyero.id}`)).json;
  comprobar("vw_trabajos_joyero devuelve el trabajo", vj?.length === 1 && vj[0].instrucciones === "cuidado con la piedra");
  const columnas = Object.keys(vj?.[0] ?? {});
  comprobar("la vista del joyero NO tiene precio_cliente, utilidad ni margen", !columnas.some((c) => /precio|utilidad|margen|costo/.test(c)), columnas.join(","));
  const terminarSinIniciar = await rpc("fn_terminar_trabajo", { p_asignacion_id: asig.json.id, p_usuario_id: usuarioId, p_notas: "", p_dias_reales: 1, p_desviacion_dias: -1 });
  comprobar("no se termina sin iniciar", !terminarSinIniciar.ok);
  const ini = await rpc("fn_iniciar_trabajo", { p_asignacion_id: asig.json.id, p_usuario_id: usuarioId });
  comprobar("iniciar → en_proceso con fecha de inicio del servidor", ini.ok && ini.json?.estado === "en_proceso" && Boolean(ini.json?.fecha_inicio_real), msg(ini));
  const fin = await rpc("fn_terminar_trabajo", { p_asignacion_id: asig.json.id, p_usuario_id: usuarioId, p_notas: "listo", p_dias_reales: 3, p_desviacion_dias: 1 });
  comprobar("terminar → terminada con desviación guardada; orden terminada_joyero", fin.ok && fin.json?.estado === "terminada" && fin.json?.desviacion_dias === 1 && (await get(`ordenes?select=estado&id=eq.${orden.id}`)).json[0].estado === "terminada_joyero", msg(fin));

  console.log("\nControl de calidad y retrabajo");
  const antesDeRecibir = await rpc("fn_registrar_calidad", { p_orden_id: orden.id, p_resultado: "aprobado", p_observaciones: "", p_usuario_id: usuarioId, p_fecha_compromiso_retrabajo: null });
  comprobar("no se revisa antes de recibir la pieza", !antesDeRecibir.ok);
  await rpc("fn_cambiar_estado_orden", { p_orden_id: orden.id, p_estado_nuevo: "en_control_calidad", p_usuario_id: usuarioId, p_comentario: "recibida" });
  const rechazo = await rpc("fn_registrar_calidad", { p_orden_id: orden.id, p_resultado: "rechazado", p_observaciones: "piedra floja", p_usuario_id: usuarioId, p_fecha_compromiso_retrabajo: "2026-10-16" });
  comprobar("rechazo → orden vuelve a asignada", rechazo.ok && rechazo.json?.estado === "asignada", msg(rechazo));
  const asigs = (await get(`asignaciones?select=id,estado,costo_pactado,es_retrabajo,joyero_id&orden_id=eq.${orden.id}&order=id`)).json;
  comprobar("la original queda rechazada_calidad y hay un retrabajo al mismo joyero con costo 0", asigs?.length === 2 && asigs[0].estado === "rechazada_calidad" && asigs[1].es_retrabajo === true && Number(asigs[1].costo_pactado) === 0 && asigs[1].joyero_id === joyero.id, JSON.stringify(asigs));
  const carga = (await rpc("fn_carga_joyeros", {})).json.find((c) => c.joyero_id === joyero.id);
  comprobar("fn_carga_joyeros cuenta el retrabajo", carga?.retrabajos === 1, JSON.stringify(carga));
  await rpc("fn_iniciar_trabajo", { p_asignacion_id: asigs[1].id, p_usuario_id: usuarioId });
  await rpc("fn_terminar_trabajo", { p_asignacion_id: asigs[1].id, p_usuario_id: usuarioId, p_notas: "", p_dias_reales: 1, p_desviacion_dias: -1 });
  await rpc("fn_cambiar_estado_orden", { p_orden_id: orden.id, p_estado_nuevo: "en_control_calidad", p_usuario_id: usuarioId, p_comentario: null });
  const aprob = await rpc("fn_registrar_calidad", { p_orden_id: orden.id, p_resultado: "aprobado", p_observaciones: "ok", p_usuario_id: usuarioId, p_fecha_compromiso_retrabajo: null });
  comprobar("calidad aprobada → lista_entrega", aprob.ok && aprob.json?.estado === "lista_entrega", msg(aprob));

  console.log("\nEntrega");
  const sinFoto = await rpc("fn_entregar_orden", { p_orden_id: orden.id, p_usuario_id: usuarioId, p_con_saldo: true, p_comentario: "" });
  comprobar("no se entrega sin fotografía de salida", !sinFoto.ok && /salida/.test(msg(sinFoto)), msg(sinFoto));
  await post("fotografias", { orden_id: orden.id, momento: "salida", ruta_storage: `zz-prueba/${Date.now()}.webp` });
  const conSaldo = await rpc("fn_entregar_orden", { p_orden_id: orden.id, p_usuario_id: usuarioId, p_con_saldo: false, p_comentario: "" });
  comprobar("no se entrega con saldo pendiente sin marcarlo", !conSaldo.ok && /saldo/.test(msg(conSaldo)), msg(conSaldo));
  await post("pagos_cliente", { orden_id: orden.id, tipo: "anticipo", monto: 200, forma_pago: "efectivo", fecha: "2026-10-05" });
  await post("pagos_cliente", { orden_id: orden.id, tipo: "saldo", monto: 300, forma_pago: "tarjeta", fecha: "2026-10-12" });
  const entregada = await rpc("fn_entregar_orden", { p_orden_id: orden.id, p_usuario_id: usuarioId, p_con_saldo: false, p_comentario: "recogió la hija" });
  comprobar("con saldo cero, foto y calidad: entregada con fecha real", entregada.ok && entregada.json?.estado === "entregada" && Boolean(entregada.json?.fecha_entrega_real), msg(entregada));
  const inmutable = await patch(`ordenes?id=eq.${orden.id}`, { descripcion_pieza: "zz-prueba-cambio" });
  comprobar("una orden entregada es inmutable", !inmutable.ok, msg(inmutable));
  const saldoVista = (await get(`vw_ordenes_tablero?select=cobrado,saldo&id=eq.${orden.id}`)).json[0];
  comprobar("la vista calcula cobrado 500 y saldo 0", Number(saldoVista.cobrado) === 500 && Number(saldoVista.saldo) === 0, JSON.stringify(saldoVista));

  console.log("\nGarantía");
  const gar = await rpc("fn_crear_garantia", { p_orden_origen_id: orden.id, p_cobra: false, p_joyero_responsable_id: joyero.id, p_descripcion_pieza: "zz-prueba-pieza3 (garantía)", p_observaciones: "se volvió a soltar", p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, dias_estimados: 2, orden: 1 }], p_dias_estimados: 2, p_fecha_estimada: "2026-10-20", p_fecha_prometida: "2026-10-22", p_usuario_id: usuarioId });
  comprobar("garantía sin cobro nace aprobada, precio 0, ligada a la original", gar.ok && gar.json?.estado === "aprobada" && Number(gar.json?.precio_cliente) === 0 && gar.json?.orden_origen_id === orden.id && gar.json?.es_garantia === true, msg(gar));
  const garAsig = await rpc("fn_asignar_joyero", { p_orden_id: gar.json.id, p_joyero_id: joyero.id, p_costo: 80, p_instrucciones: "", p_fecha_compromiso: "2026-10-21", p_excede: false, p_usuario_id: usuarioId, p_comentario: "" });
  comprobar("la garantía se asigna con costo (utilidad negativa: 0 − 80)", garAsig.ok, msg(garAsig));
  const garSobreGar = await rpc("fn_crear_garantia", { p_orden_origen_id: gar.json.id, p_cobra: false, p_joyero_responsable_id: null, p_descripcion_pieza: "", p_observaciones: "", p_lineas: [], p_dias_estimados: 0, p_fecha_estimada: null, p_fecha_prometida: null, p_usuario_id: usuarioId });
  comprobar("no se abre garantía sobre una orden no entregada", !garSobreGar.ok);

  console.log("\nDesempeño");
  const des = (await rpc("fn_desempeno_joyeros", { p_desde: "2026-01-01", p_hasta: "2099-12-31" })).json.find((d) => d.joyero_id === joyero.id);
  comprobar("fn_desempeno_joyeros: 2 terminados, retrabajo 50 %, pendiente de pago 120", des && des.terminados === 2 && Number(des.retrabajo_pct) === 50 && Number(des.pendiente_pago) === 120, JSON.stringify(des));
} finally {
  await limpiar();
}

console.log(`\n${pasan} correctas, ${fallan} fallidas.\n`);
process.exit(fallan ? 1 : 0);
