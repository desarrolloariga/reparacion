/**
 * Pruebas de la Fase 2 contra la base real, por PostgREST con la clave de
 * servicio: numeración, creación de órdenes, máquina de estados (tabla,
 * función única y trigger guardián), cotizaciones versionadas y aprobación.
 *
 *   npm run test:fase2
 *
 * Crea un cliente `zz-prueba-*` y órdenes de prueba; elimina todo al final.
 * Si la matriz no tiene la combinación que necesita, inserta una celda
 * temporal y la borra al terminar.
 */
const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const cab = { apikey: clave, Authorization: `Bearer ${clave}`, "Accept-Profile": "joyeria", "Content-Profile": "joyeria", "Content-Type": "application/json", Prefer: "return=representation" };
let pasan = 0;
let fallan = 0;
const ok = (d) => { pasan++; console.log(`  [ok] ${d}`); };
const mal = (d, x = "") => { fallan++; console.log(`  [!!] ${d}${x ? ` — ${x}` : ""}`); };
const comprobar = (d, c, x) => (c ? ok(d) : mal(d, x));

async function rest(metodo, ruta, cuerpo) {
  const r = await fetch(`${url}/rest/v1/${ruta}`, { method: metodo, headers: cab, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const t = await r.text();
  let json = null;
  try { json = t ? JSON.parse(t) : null; } catch { json = t; }
  return { ok: r.ok, status: r.status, json };
}
const get = (ruta) => rest("GET", ruta);
const post = (ruta, cuerpo) => rest("POST", ruta, cuerpo);
const patch = (ruta, cuerpo) => rest("PATCH", ruta, cuerpo);
const del = (ruta) => rest("DELETE", ruta);
const rpc = (fn, args) => rest("POST", `rpc/${fn}`, args);
const mensaje = (r) => (r.json && typeof r.json === "object" ? r.json.message ?? JSON.stringify(r.json) : String(r.json));

const limpieza = { ordenes: [], clientes: [], tiempos: [] };
const usuarioId = (await get("usuarios?select=id&correo=eq.admin")).json?.[0]?.id ?? null;

async function limpiar() {
  for (const id of limpieza.ordenes) await del(`ordenes?id=eq.${id}`);
  await del("ordenes?descripcion_pieza=like.zz-prueba-*");
  for (const id of limpieza.clientes) await del(`clientes?id=eq.${id}`);
  await del("clientes?nombre=like.zz-prueba-*");
  for (const t of limpieza.tiempos) await del(`tiempos_estandar?tipo_trabajo_id=eq.${t.tipo}&complejidad_id=eq.${t.comp}`);
}

try {
  // Datos base
  const tipos = (await get("tipos_trabajo?select=id,nombre,categoria&activo=eq.true&order=id")).json;
  const comps = (await get("complejidades?select=id,nombre&order=orden")).json;
  const rep = tipos.filter((t) => t.categoria === "reparacion");
  const [tA, tB] = [rep[0], rep[1]];
  const [cBaja, cMedia] = [comps[0], comps[1]];

  for (const [t, c, d] of [[tA, cBaja, 2], [tB, cMedia, 4]]) {
    const existe = (await get(`tiempos_estandar?select=id&tipo_trabajo_id=eq.${t.id}&complejidad_id=eq.${c.id}`)).json;
    if (!existe?.length) {
      await post("tiempos_estandar", { tipo_trabajo_id: t.id, complejidad_id: c.id, dias_habiles: d });
      limpieza.tiempos.push({ tipo: t.id, comp: c.id });
    }
  }

  const cliente = (await post("clientes", { nombre: "zz-prueba-cliente", telefono: "55550000" })).json?.[0];
  limpieza.clientes.push(cliente.id);

  console.log("\nNumeración");
  const n1 = (await rpc("fn_siguiente_numero", { p_prefijo: "ZZP" })).json;
  const n2 = (await rpc("fn_siguiente_numero", { p_prefijo: "ZZP" })).json;
  comprobar("formato PREFIJO-AAAA-00001", /^ZZP-\d{4}-\d{5}$/.test(n1), n1);
  comprobar("correlativo consecutivo", Number(n2.slice(-5)) === Number(n1.slice(-5)) + 1, `${n1} → ${n2}`);
  const paralelos = await Promise.all(Array.from({ length: 6 }, () => rpc("fn_siguiente_numero", { p_prefijo: "ZZP" })));
  const nums = paralelos.map((r) => r.json);
  comprobar("seis llamadas simultáneas no repiten número", new Set(nums).size === 6, nums.join(","));
  await del("correlativos?prefijo=eq.ZZP");

  console.log("\nCreación de la orden");
  const lineas = [
    { tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, descripcion: "primera", cantidad: 1, dias_estimados: 2, orden: 1 },
    { tipo_trabajo_id: tB.id, complejidad_id: cMedia.id, descripcion: "segunda", cantidad: 1, dias_estimados: 4, orden: 2 },
  ];
  const creada = await rpc("fn_crear_orden", {
    p_cliente_id: cliente.id, p_tipo: "reparacion",
    p_pieza: { descripcion_pieza: "zz-prueba-anillo", material: "oro", fecha_recepcion: "2026-10-05" },
    p_lineas: lineas, p_dias_estimados: 6, p_fecha_estimada: "2026-10-12", p_fecha_prometida: "2026-10-14", p_fecha_prometida_manual: false, p_usuario_id: usuarioId,
  });
  comprobar("fn_crear_orden devuelve la orden en estado recibida", creada.ok && creada.json?.estado === "recibida", mensaje(creada));
  const orden = creada.json;
  limpieza.ordenes.push(orden.id);
  comprobar("número REP-AAAA-NNNNN", /^REP-\d{4}-\d{5}$/.test(orden.numero ?? ""), orden.numero);
  const detalle = (await get(`orden_detalle?select=id,dias_estimados&orden_id=eq.${orden.id}&order=orden`)).json;
  comprobar("dos líneas con sus días copiados", detalle?.length === 2 && detalle[0].dias_estimados === 2 && detalle[1].dias_estimados === 4);
  const hist = (await get(`orden_estados_historial?select=estado_anterior,estado_nuevo&orden_id=eq.${orden.id}`)).json;
  comprobar("historial inicial (null → recibida)", hist?.length === 1 && hist[0].estado_anterior === null && hist[0].estado_nuevo === "recibida");
  const sinLineas = await rpc("fn_crear_orden", { p_cliente_id: cliente.id, p_tipo: "reparacion", p_pieza: { descripcion_pieza: "zz-prueba-x" }, p_lineas: [], p_dias_estimados: 0, p_fecha_estimada: null, p_fecha_prometida: null, p_fecha_prometida_manual: false, p_usuario_id: usuarioId });
  comprobar("sin líneas se rechaza", !sinLineas.ok);

  console.log("\nMáquina de estados");
  const directo = await patch(`ordenes?id=eq.${orden.id}`, { estado: "aprobada" });
  comprobar("UPDATE directo de estado rechazado por el trigger guardián", !directo.ok && /fn_cambiar_estado_orden/.test(mensaje(directo)), mensaje(directo));
  const salto = await rpc("fn_cambiar_estado_orden", { p_orden_id: orden.id, p_estado_nuevo: "asignada", p_usuario_id: usuarioId, p_comentario: null });
  comprobar("recibida → asignada rechazada (transición no permitida)", !salto.ok && /no permitida/.test(mensaje(salto)), mensaje(salto));
  const sinMotivo = await rpc("fn_cambiar_estado_orden", { p_orden_id: orden.id, p_estado_nuevo: "anulada", p_usuario_id: usuarioId, p_comentario: "" });
  comprobar("anular sin motivo rechazado", !sinMotivo.ok && /motivo/.test(mensaje(sinMotivo)), mensaje(sinMotivo));
  const aprobarSinCot = await rpc("fn_cambiar_estado_orden", { p_orden_id: orden.id, p_estado_nuevo: "cotizada", p_usuario_id: usuarioId, p_comentario: null });
  comprobar("recibida → cotizada permitida", aprobarSinCot.ok && aprobarSinCot.json?.estado === "cotizada", mensaje(aprobarSinCot));
  const sinCot = await rpc("fn_cambiar_estado_orden", { p_orden_id: orden.id, p_estado_nuevo: "aprobada", p_usuario_id: usuarioId, p_comentario: null });
  comprobar("cotizada → aprobada sin cotización aprobada se rechaza (precondición)", !sinCot.ok && /cotización aprobada/.test(mensaje(sinCot)), mensaje(sinCot));
  const nota = await rpc("fn_anotar_orden", { p_orden_id: orden.id, p_usuario_id: usuarioId, p_comentario: "nota de prueba" });
  comprobar("fn_anotar_orden escribe sin cambiar estado", nota.ok);

  console.log("\nCotizaciones");
  const v1 = await rpc("fn_nueva_version_cotizacion", { p_orden_id: orden.id, p_usuario_id: usuarioId });
  comprobar("versión 1 creada como borrador desde los trabajos", v1.ok && v1.json?.version === 1 && v1.json?.estado === "borrador", mensaje(v1));
  const lineasV1 = (await get(`cotizacion_detalle?select=id&cotizacion_id=eq.${v1.json.id}`)).json;
  comprobar("el borrador arranca con las 2 líneas de la orden", lineasV1?.length === 2);
  const otroBorrador = await rpc("fn_nueva_version_cotizacion", { p_orden_id: orden.id, p_usuario_id: usuarioId });
  comprobar("no se puede abrir un segundo borrador", !otroBorrador.ok);

  const guardada = await rpc("fn_guardar_cotizacion", { p_cotizacion_id: v1.json.id, p_lineas: [
    { tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, descripcion: "primera", cantidad: 2, precio_unitario: 150, costo_joyero: 60, orden: 1 },
    { tipo_trabajo_id: tB.id, complejidad_id: cMedia.id, descripcion: "segunda", cantidad: 1, precio_unitario: 400, costo_joyero: 250, orden: 2 },
  ], p_notas: "sin garantía de piedras" });
  comprobar("totales: 700 al cliente, 370 costo, margen 47.14", guardada.ok && Number(guardada.json.total_cliente) === 700 && Number(guardada.json.total_costo_joyero) === 370 && Number(guardada.json.margen_estimado) === 47.14, mensaje(guardada));

  const aprobarBorrador = await rpc("fn_aprobar_cotizacion", { p_cotizacion_id: v1.json.id, p_aprobada_por_nombre: "Cliente", p_usuario_id: usuarioId, p_lineas: [], p_dias_estimados: 6, p_fecha_estimada: "2026-10-12", p_fecha_prometida: "2026-10-14" });
  comprobar("un borrador no se aprueba (hay que enviarlo)", !aprobarBorrador.ok);

  const enviada = await rpc("fn_enviar_cotizacion", { p_cotizacion_id: v1.json.id, p_usuario_id: usuarioId, p_valido_hasta: "2026-10-20" });
  comprobar("v1 enviada con validez", enviada.ok && enviada.json?.estado === "enviada" && enviada.json?.valido_hasta === "2026-10-20", mensaje(enviada));

  const v2 = await rpc("fn_nueva_version_cotizacion", { p_orden_id: orden.id, p_usuario_id: usuarioId });
  comprobar("v2 clona las líneas y v1 pasa a reemplazada", v2.ok && v2.json?.version === 2 && Number(v2.json.total_cliente) === 700, mensaje(v2));
  const v1Despues = (await get(`cotizaciones?select=estado&id=eq.${v1.json.id}`)).json?.[0];
  comprobar("v1 reemplazada", v1Despues?.estado === "reemplazada", v1Despues?.estado);
  await rpc("fn_enviar_cotizacion", { p_cotizacion_id: v2.json.id, p_usuario_id: usuarioId, p_valido_hasta: "2026-01-01" });
  const vencidaAprobar = await rpc("fn_aprobar_cotizacion", { p_cotizacion_id: v2.json.id, p_aprobada_por_nombre: "Cliente", p_usuario_id: usuarioId, p_lineas: [], p_dias_estimados: 6, p_fecha_estimada: "2026-10-12", p_fecha_prometida: "2026-10-14" });
  comprobar("una cotización con validez pasada no se aprueba y queda vencida", !vencidaAprobar.ok && /venció/.test(mensaje(vencidaAprobar)), mensaje(vencidaAprobar));
  await rpc("fn_vencer_cotizaciones", {});
  const v2Estado = (await get(`cotizaciones?select=estado&id=eq.${v2.json.id}`)).json?.[0]?.estado;
  comprobar("v2 queda vencida tras el job diario", v2Estado === "vencida", v2Estado);

  const v3 = await rpc("fn_nueva_version_cotizacion", { p_orden_id: orden.id, p_usuario_id: usuarioId });
  comprobar("v3 creada", v3.ok && v3.json?.version === 3, mensaje(v3));
  const envV3 = await rpc("fn_enviar_cotizacion", { p_cotizacion_id: v3.json.id, p_usuario_id: usuarioId, p_valido_hasta: "2099-12-31" });
  comprobar("v3 enviada", envV3.ok, mensaje(envV3));
  const versiones = (await get(`cotizaciones?select=version,estado,margen_estimado&orden_id=eq.${orden.id}&order=version`)).json;
  comprobar("tres versiones con margen cada una", versiones?.length === 3 && versiones.every((v) => v.margen_estimado !== null), JSON.stringify(versiones));

  const aprobada = await rpc("fn_aprobar_cotizacion", {
    p_cotizacion_id: v3.json.id, p_aprobada_por_nombre: "María Cliente", p_usuario_id: usuarioId,
    p_lineas: [
      { tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, descripcion: "primera", cantidad: 2, dias_estimados: 2, precio_cliente: 300, costo_joyero_estimado: 120, orden: 1 },
      { tipo_trabajo_id: tB.id, complejidad_id: cMedia.id, descripcion: "segunda", cantidad: 1, dias_estimados: 4, precio_cliente: 400, costo_joyero_estimado: 250, orden: 2 },
    ],
    p_dias_estimados: 6, p_fecha_estimada: "2026-10-13", p_fecha_prometida: "2026-10-15",
  });
  comprobar("aprobar v3 deja la orden aprobada con precio 700", aprobada.ok && aprobada.json?.estado === "aprobada" && Number(aprobada.json.precio_cliente) === 700 && aprobada.json.fecha_prometida_cliente === "2026-10-15", mensaje(aprobada));
  const detalleFinal = (await get(`orden_detalle?select=precio_cliente,cantidad&orden_id=eq.${orden.id}&order=orden`)).json;
  comprobar("orden_detalle reemplazado desde la cotización sin redigitar", detalleFinal?.length === 2 && Number(detalleFinal[0].precio_cliente) === 300 && detalleFinal[0].cantidad === 2, JSON.stringify(detalleFinal));
  const historial = (await get(`orden_estados_historial?select=estado_nuevo,comentario&orden_id=eq.${orden.id}&order=id`)).json;
  comprobar("el historial registra la aprobación con quién aprobó", historial?.some((h) => h.estado_nuevo === "aprobada" && /María Cliente/.test(h.comentario ?? "")), JSON.stringify(historial?.slice(-1)));

  console.log("\nVencimiento, rechazo y anulación");
  const orden2 = (await rpc("fn_crear_orden", { p_cliente_id: cliente.id, p_tipo: "reparacion", p_pieza: { descripcion_pieza: "zz-prueba-cadena" }, p_lineas: [lineas[0]], p_dias_estimados: 2, p_fecha_estimada: "2026-10-07", p_fecha_prometida: "2026-10-09", p_fecha_prometida_manual: false, p_usuario_id: usuarioId })).json;
  limpieza.ordenes.push(orden2.id);
  const c2 = (await rpc("fn_nueva_version_cotizacion", { p_orden_id: orden2.id, p_usuario_id: usuarioId })).json;
  await rpc("fn_guardar_cotizacion", { p_cotizacion_id: c2.id, p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, precio_unitario: 100, costo_joyero: 80, orden: 1 }] });
  await rpc("fn_enviar_cotizacion", { p_cotizacion_id: c2.id, p_usuario_id: usuarioId, p_valido_hasta: "2000-01-01" });
  const vencidas = await rpc("fn_vencer_cotizaciones", {});
  comprobar("fn_vencer_cotizaciones marca al menos la vencida", vencidas.ok && Number(vencidas.json) >= 1, mensaje(vencidas));
  const rechazo = await rpc("fn_rechazar_cotizacion", { p_cotizacion_id: c2.id, p_motivo: "muy caro", p_usuario_id: usuarioId });
  comprobar("rechazar deja la orden rechazada", rechazo.ok && rechazo.json?.estado === "rechazada", mensaje(rechazo));
  const anulada = await rpc("fn_cambiar_estado_orden", { p_orden_id: orden2.id, p_estado_nuevo: "anulada", p_usuario_id: usuarioId, p_comentario: "retiró la pieza" });
  comprobar("rechazada → anulada con motivo", anulada.ok && anulada.json?.motivo_anulacion === "retiró la pieza", mensaje(anulada));
  const reAnular = await rpc("fn_cambiar_estado_orden", { p_orden_id: orden2.id, p_estado_nuevo: "anulada", p_usuario_id: usuarioId, p_comentario: "otra vez" });
  comprobar("una anulada no se vuelve a anular", !reAnular.ok);

  console.log("\nVista");
  const vista = (await get(`vw_ordenes_tablero?select=numero,cliente,trabajos,lineas,cotizacion_estado,fecha_control&id=eq.${orden.id}`)).json?.[0];
  comprobar("vw_ordenes_tablero agrega cliente, trabajos y cotización vigente", vista && vista.cliente === "zz-prueba-cliente" && vista.lineas === 2 && vista.cotizacion_estado === "aprobada" && vista.fecha_control === "2026-10-15", JSON.stringify(vista));
} finally {
  await limpiar();
}

console.log(`\n${pasan} correctas, ${fallan} fallidas.\n`);
process.exit(fallan ? 1 : 0);
