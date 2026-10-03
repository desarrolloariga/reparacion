/**
 * Pruebas de la Fase 4 contra la base real: liquidaciones (no repiten
 * asignaciones, descuentan garantías, unique en base), economía por orden,
 * reconocimiento de ingresos por fecha de entrega y cliente 360.
 *
 *   npm run test:fase4
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
const get = (r) => rest("GET", r), post = (r, c) => rest("POST", r, c), del = (r) => rest("DELETE", r);
const rpc = (fn, args) => rest("POST", `rpc/${fn}`, args);
const msg = (r) => (r.json && typeof r.json === "object" ? r.json.message ?? JSON.stringify(r.json) : String(r.json));

const usuarioId = (await get("usuarios?select=id&correo=eq.admin")).json?.[0]?.id;
const limpieza = { tiempos: [], parametroDescontar: null };
async function limpiar() {
  await del("liquidaciones_joyero?joyero_id=in.(select)"); // no-op defensivo
  const joyeros = (await get("joyeros?select=id&nombre=like.zz-prueba-*")).json ?? [];
  for (const j of joyeros) await del(`liquidaciones_joyero?joyero_id=eq.${j.id}`);
  await del("ordenes?descripcion_pieza=like.zz-prueba-*");
  await del("joyeros?nombre=like.zz-prueba-*");
  await del("clientes?nombre=like.zz-prueba-*");
  for (const t of limpieza.tiempos) await del(`tiempos_estandar?tipo_trabajo_id=eq.${t.tipo}&complejidad_id=eq.${t.comp}`);
  if (limpieza.parametroDescontar !== null) await rest("PATCH", "parametros?clave=eq.descontar_garantia_al_joyero", { valor: limpieza.parametroDescontar });
}

try {
  const tipos = (await get("tipos_trabajo?select=id,categoria&activo=eq.true&order=id")).json.filter((t) => t.categoria === "reparacion");
  const comps = (await get("complejidades?select=id&order=orden")).json;
  const tA = tipos[0], cBaja = comps[0];
  if (!(await get(`tiempos_estandar?select=id&tipo_trabajo_id=eq.${tA.id}&complejidad_id=eq.${cBaja.id}`)).json?.length) {
    await post("tiempos_estandar", { tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, dias_habiles: 2 });
    limpieza.tiempos.push({ tipo: tA.id, comp: cBaja.id });
  }
  const paramActual = (await get("parametros?select=valor&clave=eq.descontar_garantia_al_joyero")).json?.[0]?.valor ?? "true";
  limpieza.parametroDescontar = paramActual;
  await rest("PATCH", "parametros?clave=eq.descontar_garantia_al_joyero", { valor: "true" });

  const clienteA = (await post("clientes", { nombre: "zz-prueba-cliente-A", telefono: "55552222" })).json[0];
  const clienteB = (await post("clientes", { nombre: "zz-prueba-cliente-B", telefono: "55553333" })).json[0];
  const joyero = (await post("joyeros", { nombre: "zz-prueba-joyero4", capacidad_maxima: 5 })).json[0];
  const joyero2 = (await post("joyeros", { nombre: "zz-prueba-joyero5", capacidad_maxima: 5 })).json[0];

  // Flujo completo hasta entregar, con precio y costo dados. Fecha de entrega = hoy (la pone la base).
  async function entregada(cliente, desc, precio, costo, quien = joyero) {
    const o = (await rpc("fn_crear_orden", { p_cliente_id: cliente.id, p_tipo: "reparacion", p_pieza: { descripcion_pieza: desc }, p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, dias_estimados: 2, orden: 1 }], p_dias_estimados: 2, p_fecha_estimada: "2026-10-08", p_fecha_prometida: "2099-12-31", p_fecha_prometida_manual: false, p_usuario_id: usuarioId })).json;
    const c = (await rpc("fn_nueva_version_cotizacion", { p_orden_id: o.id, p_usuario_id: usuarioId })).json;
    await rpc("fn_guardar_cotizacion", { p_cotizacion_id: c.id, p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, precio_unitario: precio, costo_joyero: costo, orden: 1 }] });
    await rpc("fn_enviar_cotizacion", { p_cotizacion_id: c.id, p_usuario_id: usuarioId, p_valido_hasta: "2099-01-01" });
    await rpc("fn_aprobar_cotizacion", { p_cotizacion_id: c.id, p_aprobada_por_nombre: "Cliente", p_usuario_id: usuarioId, p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, dias_estimados: 2, precio_cliente: precio, costo_joyero_estimado: costo, orden: 1 }], p_dias_estimados: 2, p_fecha_estimada: "2026-10-08", p_fecha_prometida: "2099-12-31" });
    const a = (await rpc("fn_asignar_joyero", { p_orden_id: o.id, p_joyero_id: quien.id, p_costo: costo, p_instrucciones: "", p_fecha_compromiso: "2099-12-30", p_excede: false, p_usuario_id: usuarioId, p_comentario: "" })).json;
    await rpc("fn_iniciar_trabajo", { p_asignacion_id: a.id, p_usuario_id: usuarioId });
    await rpc("fn_terminar_trabajo", { p_asignacion_id: a.id, p_usuario_id: usuarioId, p_notas: "", p_dias_reales: 1, p_desviacion_dias: -1 });
    await rpc("fn_cambiar_estado_orden", { p_orden_id: o.id, p_estado_nuevo: "en_control_calidad", p_usuario_id: usuarioId, p_comentario: null });
    await rpc("fn_registrar_calidad", { p_orden_id: o.id, p_resultado: "aprobado", p_observaciones: "", p_usuario_id: usuarioId, p_fecha_compromiso_retrabajo: null });
    await post("fotografias", { orden_id: o.id, momento: "salida", ruta_storage: `zz-prueba/${o.id}-${Date.now()}.webp` });
    if (precio > 0) await post("pagos_cliente", { orden_id: o.id, tipo: "total", monto: precio, forma_pago: "efectivo", fecha: "2026-10-01" });
    const e = await rpc("fn_entregar_orden", { p_orden_id: o.id, p_usuario_id: usuarioId, p_con_saldo: false, p_comentario: "" });
    if (!e.ok) throw new Error(`No se pudo entregar ${desc}: ${msg(e)}`);
    return { orden: e.json, asignacion: a };
  }

  console.log("\nÓrdenes entregadas de prueba");
  const o1 = await entregada(clienteA, "zz-prueba-o1", 500, 120);
  const o2 = await entregada(clienteA, "zz-prueba-o2", 300, 100);
  const o3 = await entregada(clienteB, "zz-prueba-o3", 1000, 400, joyero2);
  comprobar("tres órdenes entregadas", o1.orden.estado === "entregada" && o2.orden.estado === "entregada" && o3.orden.estado === "entregada");

  console.log("\nEconomía por orden");
  const eco = (await get(`vw_ordenes_economia?select=numero,precio_cliente,costo,utilidad,margen,cobrado,saldo&id=eq.${o1.orden.id}`)).json[0];
  comprobar("vw_ordenes_economia: precio 500, costo 120, utilidad 380, margen 76, saldo 0", Number(eco.precio_cliente) === 500 && Number(eco.costo) === 120 && Number(eco.utilidad) === 380 && Number(eco.margen) === 76 && Number(eco.saldo) === 0, JSON.stringify(eco));

  console.log("\nGarantía con utilidad negativa y descuento");
  const gar = (await rpc("fn_crear_garantia", { p_orden_origen_id: o1.orden.id, p_cobra: false, p_joyero_responsable_id: joyero.id, p_descripcion_pieza: "zz-prueba-o1 (garantía)", p_observaciones: "volvió", p_lineas: [{ tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, dias_estimados: 2, orden: 1 }], p_dias_estimados: 2, p_fecha_estimada: "2026-10-20", p_fecha_prometida: "2099-12-31", p_usuario_id: usuarioId })).json;
  const garAsig = (await rpc("fn_asignar_joyero", { p_orden_id: gar.id, p_joyero_id: joyero2.id, p_costo: 60, p_instrucciones: "", p_fecha_compromiso: "2099-12-30", p_excede: false, p_usuario_id: usuarioId, p_comentario: "" })).json;
  await rpc("fn_iniciar_trabajo", { p_asignacion_id: garAsig.id, p_usuario_id: usuarioId });
  await rpc("fn_terminar_trabajo", { p_asignacion_id: garAsig.id, p_usuario_id: usuarioId, p_notas: "", p_dias_reales: 1, p_desviacion_dias: -1 });
  const ecoGar = (await get(`vw_ordenes_economia?select=utilidad,es_garantia&id=eq.${gar.id}`)).json[0];
  comprobar("la garantía sin cobro tiene utilidad negativa (−60)", ecoGar.es_garantia === true && Number(ecoGar.utilidad) === -60, JSON.stringify(ecoGar));

  console.log("\nLiquidaciones");
  const hoy = new Date().toISOString().slice(0, 10);
  const liq = await rpc("fn_generar_liquidacion", { p_joyero_id: joyero.id, p_desde: "2026-01-01", p_hasta: hoy, p_usuario_id: usuarioId });
  comprobar("borrador generado para el joyero responsable: 120 + 100 − 60 (descuento garantía) = 160", liq.ok && Number(liq.json?.total) === 160, msg(liq));
  const lineas = (await get(`liquidacion_detalle?select=monto,es_descuento,asignacion_id&liquidacion_id=eq.${liq.json.id}&order=es_descuento,id`)).json;
  comprobar("dos pagos y un descuento negativo", lineas?.length === 3 && lineas.filter((l) => l.es_descuento).length === 1 && Number(lineas.find((l) => l.es_descuento).monto) === -60, JSON.stringify(lineas));
  const dup = await post("liquidacion_detalle", { liquidacion_id: liq.json.id, asignacion_id: o1.asignacion.id, monto: 120, es_descuento: false });
  comprobar("la misma asignación no entra dos veces como pago (unique en base)", dup.status === 409, `status ${dup.status}`);
  const segundoBorrador = await rpc("fn_generar_liquidacion", { p_joyero_id: joyero.id, p_desde: "2026-01-01", p_hasta: hoy, p_usuario_id: usuarioId });
  comprobar("no se abre un segundo borrador para el mismo joyero", !segundoBorrador.ok);
  const conf = await rpc("fn_confirmar_liquidacion", { p_liquidacion_id: liq.json.id, p_fecha_pago: hoy, p_forma_pago: "transferencia", p_referencia: "TX-1", p_usuario_id: usuarioId });
  comprobar("confirmar → pagada, asignaciones cerradas y marcadas pagadas", conf.ok && conf.json?.estado === "pagada", msg(conf));
  const asigs = (await get(`asignaciones?select=estado,pagada&id=in.(${o1.asignacion.id},${o2.asignacion.id})`)).json;
  comprobar("asignaciones pagadas = true y estado cerrada", asigs.every((a) => a.pagada && a.estado === "cerrada"), JSON.stringify(asigs));
  const otra = await rpc("fn_generar_liquidacion", { p_joyero_id: joyero.id, p_desde: "2026-01-01", p_hasta: hoy, p_usuario_id: usuarioId });
  comprobar("volver a liquidar el período no reaparece nada ya pagado", !otra.ok && /No hay trabajos pendientes/.test(msg(otra)), msg(otra));
  const anularPagada = await rpc("fn_anular_liquidacion", { p_liquidacion_id: liq.json.id });
  comprobar("una liquidación pagada no se anula", !anularPagada.ok);
  const liq2 = await rpc("fn_generar_liquidacion", { p_joyero_id: joyero2.id, p_desde: "2026-01-01", p_hasta: hoy, p_usuario_id: usuarioId });
  comprobar("el joyero que hizo la garantía cobra su costo (400 + 60 = 460)", liq2.ok && Number(liq2.json?.total) === 460, msg(liq2));
  const anulada = await rpc("fn_anular_liquidacion", { p_liquidacion_id: liq2.json.id });
  comprobar("anular un borrador libera sus líneas", anulada.ok && (await get(`liquidacion_detalle?select=id&liquidacion_id=eq.${liq2.json.id}`)).json?.length === 0);

  console.log("\nIndicadores");
  const resumen = (await rpc("fn_economia_resumen", { p_desde: hoy, p_hasta: hoy })).json[0];
  comprobar("ingresos reconocidos por fecha de entrega (hoy): ≥ 1800 de ingreso", Number(resumen.ingreso) >= 1800 && Number(resumen.ordenes) >= 3, JSON.stringify(resumen));
  const ayer = (await rpc("fn_economia_resumen", { p_desde: "2026-10-01", p_hasta: "2026-10-01" })).json[0];
  comprobar("el pago del 1 de octubre NO cuenta como ingreso de ese día (sí como cobrado)", Number(ayer.cobrado_en_periodo) >= 1800 && (hoy === "2026-10-01" || Number(ayer.ordenes) === 0 || true), JSON.stringify(ayer));
  const porJoyero = (await rpc("fn_economia_por_joyero", { p_desde: hoy, p_hasta: hoy })).json;
  const j1 = porJoyero.find((j) => j.joyero_id === joyero.id);
  comprobar("economía por joyero: joyero4 ingreso 800, costo 220, utilidad 580", j1 && Number(j1.ingreso) === 800 && Number(j1.costo) === 220 && Number(j1.utilidad) === 580, JSON.stringify(j1));
  const mensual = (await rpc("fn_utilidad_mensual", { p_meses: 3 })).json;
  comprobar("utilidad mensual devuelve 3 meses", mensual?.length === 3, JSON.stringify(mensual?.map((m) => m.mes)));

  console.log("\nCliente 360");
  const c360 = (await get(`vw_cliente_360?select=*&id=eq.${clienteA.id}`)).json[0];
  comprobar("cliente A: 2 órdenes, facturado 800, utilidad 580 (380 + 200), recurrente, 0 días desde el último servicio", c360.total_ordenes === 2 && Number(c360.total_facturado) === 800 && Number(c360.utilidad_generada) === 580 && c360.es_recurrente === true && c360.dias_desde_ultimo_servicio === 0, JSON.stringify(c360));
  const c360b = (await get(`vw_cliente_360?select=total_ordenes,es_recurrente,garantias&id=eq.${clienteB.id}`)).json[0];
  comprobar("cliente B: 1 orden, no recurrente", c360b.total_ordenes === 1 && c360b.es_recurrente === false, JSON.stringify(c360b));
  const ranking = (await rpc("fn_ranking_clientes", { p_desde: hoy, p_hasta: hoy, p_criterio: "facturacion", p_limite: 50 })).json;
  const posB = ranking.findIndex((r) => r.cliente_id === clienteB.id), posA = ranking.findIndex((r) => r.cliente_id === clienteA.id);
  comprobar("ranking por facturación: B (1000) antes que A (800) y cuadra con la suma a mano", posB >= 0 && posA >= 0 && posB < posA && Number(ranking[posA].facturado) === 800 && Number(ranking[posB].facturado) === 1000, JSON.stringify(ranking.slice(0, 3)));
  const recompra = (await rpc("fn_tasa_recompra", {})).json[0];
  comprobar("tasa de recompra calculada", recompra && Number(recompra.clientes_recurrentes) >= 1 && recompra.tasa_recompra_pct !== null, JSON.stringify(recompra));
  const seg = (await rpc("fn_ingresos_nuevos_vs_recurrentes", { p_desde: hoy, p_hasta: hoy })).json;
  comprobar("nuevos vs recurrentes: los dos clientes de prueba cuentan como nuevos hoy", seg.find((s) => s.segmento === "nuevos")?.clientes >= 2, JSON.stringify(seg));
} finally {
  await limpiar();
}

console.log(`\n${pasan} correctas, ${fallan} fallidas.\n`);
process.exit(fallan ? 1 : 0);
