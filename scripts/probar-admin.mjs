/**
 * Pruebas de las correcciones del administrador contra la base real.
 *
 *   npm run test:admin
 *
 * Crea datos `zz-prueba-*`, los corrige y elimina, y limpia al final
 * (incluidos los registros de auditoría de prueba).
 */
const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const cab = { apikey: clave, Authorization: `Bearer ${clave}`, "Accept-Profile": "joyeria", "Content-Profile": "joyeria", "Content-Type": "application/json", Prefer: "return=representation" };
let pasan = 0, fallan = 0;
const comprobar = (d, c, x = "") => (c ? (pasan++, console.log(`  [ok] ${d}`)) : (fallan++, console.log(`  [!!] ${d}${x ? ` — ${x}` : ""}`)));
async function rest(metodo, ruta, cuerpo) {
  const r = await fetch(`${url}/rest/v1/${ruta}`, { method: metodo, headers: cab, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const t = await r.text(); let json = null; try { json = t ? JSON.parse(t) : null; } catch { json = t; }
  return { ok: r.ok, status: r.status, json };
}
const get = (r) => rest("GET", r), post = (r, c) => rest("POST", r, c), del = (r) => rest("DELETE", r);
const rpc = (fn, a) => rest("POST", `rpc/${fn}`, a);
const msg = (r) => (r.json && typeof r.json === "object" ? r.json.message ?? JSON.stringify(r.json) : String(r.json));

const usuarioId = (await get("usuarios?select=id&correo=eq.admin")).json?.[0]?.id;
const tiempos = [];
let inicioAuditoria = 0;

async function limpiar() {
  const joyeros = (await get("joyeros?select=id&nombre=like.zz-prueba-*")).json ?? [];
  for (const j of joyeros) await del(`liquidaciones_joyero?joyero_id=eq.${j.id}`);
  await del("ordenes?descripcion_pieza=like.zz-prueba-*");
  await del("joyeros?nombre=like.zz-prueba-*");
  await del("clientes?nombre=like.zz-prueba-*");
  await del(`auditoria_admin?id=gt.${inicioAuditoria}`);
  for (const t of tiempos) await del(`tiempos_estandar?tipo_trabajo_id=eq.${t.tipo}&complejidad_id=eq.${t.comp}`);
}

try {
  inicioAuditoria = (await get("auditoria_admin?select=id&order=id.desc&limit=1")).json?.[0]?.id ?? 0;
  const tA = (await get("tipos_trabajo?select=id&categoria=eq.reparacion&activo=eq.true&order=id&limit=1")).json[0];
  const cBaja = (await get("complejidades?select=id&order=orden&limit=1")).json[0];
  if (!(await get(`tiempos_estandar?select=id&tipo_trabajo_id=eq.${tA.id}&complejidad_id=eq.${cBaja.id}`)).json?.length) {
    await post("tiempos_estandar", { tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, dias_habiles: 2 });
    tiempos.push({ tipo: tA.id, comp: cBaja.id });
  }
  const cliente = (await post("clientes", { nombre: "zz-prueba-cliente-admin" })).json[0];
  const joyero = (await post("joyeros", { nombre: "zz-prueba-joyero-admin" })).json[0];
  const linea = { tipo_trabajo_id: tA.id, complejidad_id: cBaja.id, cantidad: 1, dias_estimados: 2, orden: 1 };

  // Orden entregada completa
  const o = (await rpc("fn_crear_orden", { p_cliente_id: cliente.id, p_tipo: "reparacion", p_pieza: { descripcion_pieza: "zz-prueba-admin" }, p_lineas: [linea], p_dias_estimados: 2, p_fecha_estimada: "2026-10-08", p_fecha_prometida: "2099-12-31", p_fecha_prometida_manual: false, p_usuario_id: usuarioId })).json;
  const c = (await rpc("fn_nueva_version_cotizacion", { p_orden_id: o.id, p_usuario_id: usuarioId })).json;
  await rpc("fn_guardar_cotizacion", { p_cotizacion_id: c.id, p_lineas: [{ ...linea, precio_unitario: 500, costo_joyero: 100 }] });
  await rpc("fn_enviar_cotizacion", { p_cotizacion_id: c.id, p_usuario_id: usuarioId, p_valido_hasta: "2099-01-01" });
  await rpc("fn_aprobar_cotizacion", { p_cotizacion_id: c.id, p_aprobada_por_nombre: "X", p_usuario_id: usuarioId, p_lineas: [{ ...linea, precio_cliente: 500, costo_joyero_estimado: 100 }], p_dias_estimados: 2, p_fecha_estimada: "2026-10-08", p_fecha_prometida: "2099-12-31" });
  const a = (await rpc("fn_asignar_joyero", { p_orden_id: o.id, p_joyero_id: joyero.id, p_costo: 100, p_instrucciones: "", p_fecha_compromiso: "2099-12-30", p_excede: false, p_usuario_id: usuarioId, p_comentario: "" })).json;
  await rpc("fn_iniciar_trabajo", { p_asignacion_id: a.id, p_usuario_id: usuarioId });
  await rpc("fn_terminar_trabajo", { p_asignacion_id: a.id, p_usuario_id: usuarioId, p_notas: "", p_dias_reales: 1, p_desviacion_dias: -1 });
  await rpc("fn_cambiar_estado_orden", { p_orden_id: o.id, p_estado_nuevo: "en_control_calidad", p_usuario_id: usuarioId, p_comentario: null });
  await rpc("fn_registrar_calidad", { p_orden_id: o.id, p_resultado: "aprobado", p_observaciones: "", p_usuario_id: usuarioId, p_fecha_compromiso_retrabajo: null });
  await post("fotografias", { orden_id: o.id, momento: "salida", ruta_storage: `zz-prueba/admin-${Date.now()}.webp` });
  await post("pagos_cliente", { orden_id: o.id, tipo: "total", monto: 500, forma_pago: "efectivo", fecha: "2026-10-01" });
  const ent = await rpc("fn_entregar_orden", { p_orden_id: o.id, p_usuario_id: usuarioId, p_con_saldo: false, p_comentario: "" });
  comprobar("orden de prueba entregada", ent.ok && ent.json?.estado === "entregada", msg(ent));

  console.log("\nEditar orden entregada");
  const directo = await rest("PATCH", `ordenes?id=eq.${o.id}`, { precio_cliente: 450 });
  comprobar("sin la función de admin, la orden entregada sigue siendo inmutable", !directo.ok);
  const ed = await rpc("fn_admin_editar_orden", { p_orden_id: o.id, p_cambios: { precio_cliente: "450", fecha_entrega_real: "2026-10-02", material: "oro" }, p_usuario_id: usuarioId, p_motivo: "error de captura" });
  comprobar("fn_admin_editar_orden corrige precio, fecha de entrega y material", ed.ok && Number(ed.json?.precio_cliente) === 450 && ed.json?.fecha_entrega_real === "2026-10-02" && ed.json?.material === "oro" && ed.json?.estado === "entregada", msg(ed));
  const aud = (await get(`auditoria_admin?select=accion,antes,despues,motivo&entidad=eq.orden&entidad_id=eq.${o.id}`)).json;
  comprobar("la auditoría guarda antes (500) y después (450) con el motivo", aud?.length === 1 && Number(aud[0].antes.precio_cliente) === 500 && Number(aud[0].despues.precio_cliente) === 450 && aud[0].motivo === "error de captura", JSON.stringify(aud?.[0]?.motivo));
  const nota = (await get(`orden_estados_historial?select=comentario&orden_id=eq.${o.id}&comentario=like.Correcci*`)).json;
  comprobar("el historial de la orden registra la corrección", nota?.length === 1);
  const negativo = await rpc("fn_admin_editar_orden", { p_orden_id: o.id, p_cambios: { precio_cliente: "-1" }, p_usuario_id: usuarioId, p_motivo: "x" });
  comprobar("precio negativo rechazado", !negativo.ok);

  console.log("\nLiquidación pagada y bloqueos");
  const hoy = new Date().toISOString().slice(0, 10);
  const liq = (await rpc("fn_generar_liquidacion", { p_joyero_id: joyero.id, p_desde: "2026-01-01", p_hasta: hoy, p_usuario_id: usuarioId })).json;
  await rpc("fn_confirmar_liquidacion", { p_liquidacion_id: liq.id, p_fecha_pago: hoy, p_forma_pago: "efectivo", p_referencia: "", p_usuario_id: usuarioId });
  const bloqueo = await rpc("fn_admin_eliminar_orden", { p_orden_id: o.id, p_usuario_id: usuarioId, p_motivo: "prueba" });
  comprobar("no se elimina una orden con trabajos liquidados al joyero", !bloqueo.ok && /liquidaci/.test(msg(bloqueo)), msg(bloqueo));
  const elimLiq = await rpc("fn_admin_eliminar_liquidacion", { p_liquidacion_id: liq.id, p_usuario_id: usuarioId, p_motivo: "pago duplicado" });
  comprobar("eliminar la liquidación pagada", elimLiq.ok, msg(elimLiq));
  const asig = (await get(`asignaciones?select=estado,pagada&id=eq.${a.id}`)).json[0];
  comprobar("el trabajo vuelve a terminada y pendiente de pago", asig.estado === "terminada" && asig.pagada === false, JSON.stringify(asig));
  const regen = await rpc("fn_generar_liquidacion", { p_joyero_id: joyero.id, p_desde: "2026-01-01", p_hasta: hoy, p_usuario_id: usuarioId });
  comprobar("se puede volver a liquidar (100)", regen.ok && Number(regen.json?.total) === 100, msg(regen));
  await rpc("fn_anular_liquidacion", { p_liquidacion_id: regen.json.id });

  console.log("\nHistorial unificado (vw_movimientos)");
  {
    const liq2 = (await rpc("fn_generar_liquidacion", { p_joyero_id: joyero.id, p_desde: "2026-01-01", p_hasta: hoy, p_usuario_id: usuarioId })).json;
    await rpc("fn_confirmar_liquidacion", { p_liquidacion_id: liq2.id, p_fecha_pago: hoy, p_forma_pago: "transferencia", p_referencia: "zz-ref", p_usuario_id: usuarioId });
    const movs = (await get(`vw_movimientos?select=tipo,monto,signo,usuario,registro_id&orden_id=eq.${o.id}`)).json ?? [];
    const tipos = new Set(movs.map((m) => m.tipo));
    comprobar("la orden aparece como recepción, cotización, venta, cobro, costo de joyero y cambios de estado", ["recepcion", "cotizacion", "venta", "cobro", "costo_joyero", "estado"].every((t) => tipos.has(t)), [...tipos].join(","));
    const venta = movs.find((m) => m.tipo === "venta");
    comprobar("la venta lleva el precio corregido (450) y quién entregó", Number(venta?.monto) === 450 && Boolean(venta?.usuario), JSON.stringify(venta));
    const cobro = movs.find((m) => m.tipo === "cobro");
    comprobar("el cobro entra con signo +1", cobro?.signo === 1 && Number(cobro?.monto) === 500);
    const pago = (await get(`vw_movimientos?select=tipo,monto,signo,joyero&tipo=eq.pago_joyero&registro_id=eq.${liq2.id}`)).json?.[0];
    comprobar("el pago al joyero sale con signo −1", pago?.signo === -1 && Number(pago?.monto) === 100 && pago?.joyero === "zz-prueba-joyero-admin", JSON.stringify(pago));
    const porJoyero = (await get(`vw_movimientos?select=tipo&joyero_id=eq.${joyero.id}`)).json ?? [];
    comprobar("filtrar por joyero trae sus costos, ventas y pagos", ["costo_joyero", "venta", "pago_joyero"].every((t) => porJoyero.some((m) => m.tipo === t)));
    const porUsuario = (await get(`vw_movimientos?select=tipo&usuario_id=eq.${usuarioId}&orden_id=eq.${o.id}`)).json ?? [];
    comprobar("filtrar por vendedor/usuario funciona", porUsuario.length > 0);

    // Página real, si el servidor está corriendo.
    const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
    const vivo = await fetch(`${sitio}/login`).then((r) => r.ok).catch(() => false);
    if (vivo) {
      const { createHash, randomBytes } = await import("node:crypto");
      const token = randomBytes(32).toString("base64url");
      const token_hash = createHash("sha256").update(token).digest("hex");
      await post("sesiones", { usuario_id: usuarioId, token_hash, expira_en: new Date(Date.now() + 600000).toISOString(), user_agent: "test-admin" });
      const pedir = (ruta) => fetch(`${sitio}${ruta}`, { headers: { cookie: `ariga_joyeria_sesion=${token}` } }).then(async (r) => ({ status: r.status, html: await r.text() }));
      const lista = await pedir(`/panel/historiales?tipo=todos&periodo=todo&q=${encodeURIComponent(o.numero)}`);
      comprobar("la página de Historiales muestra los movimientos de la orden con sus botones de corrección", lista.status === 200 && lista.html.includes(o.numero) && lista.html.includes("Editar orden") && lista.html.includes("Eliminar"), `status ${lista.status}`);
      const joy = await pedir(`/panel/historiales?tipo=pago_joyero&periodo=todo&joyero=${joyero.id}`);
      comprobar("filtro por joyero y tipo en la página", joy.status === 200 && joy.html.includes("Pago a joyero") && joy.html.includes("zz-ref"));
      const saldos = await pedir(`/panel/historiales?vista=saldos`);
      comprobar("la vista de saldos carga", saldos.status === 200 && saldos.html.includes("POR COBRAR A CLIENTES"));
      await del(`sesiones?token_hash=eq.${token_hash}`);
    } else {
      console.log("  (servidor apagado: se omite la prueba de la página)");
    }
    await rpc("fn_admin_eliminar_liquidacion", { p_liquidacion_id: liq2.id, p_usuario_id: usuarioId, p_motivo: "prueba" });
  }

  console.log("\nEliminar orden");
  const gar = (await rpc("fn_crear_garantia", { p_orden_origen_id: o.id, p_cobra: false, p_joyero_responsable_id: joyero.id, p_descripcion_pieza: "zz-prueba-admin-gar", p_observaciones: "", p_lineas: [linea], p_dias_estimados: 2, p_fecha_estimada: "2026-10-20", p_fecha_prometida: "2099-12-31", p_usuario_id: usuarioId })).json;
  const conGar = await rpc("fn_admin_eliminar_orden", { p_orden_id: o.id, p_usuario_id: usuarioId, p_motivo: "prueba" });
  comprobar("no se elimina una orden con garantías ligadas", !conGar.ok && /garant/.test(msg(conGar)), msg(conGar));
  const elimGar = await rpc("fn_admin_eliminar_orden", { p_orden_id: gar.id, p_usuario_id: usuarioId, p_motivo: "prueba" });
  comprobar("se elimina la garantía", elimGar.ok, msg(elimGar));
  const elim = await rpc("fn_admin_eliminar_orden", { p_orden_id: o.id, p_usuario_id: usuarioId, p_motivo: "orden duplicada" });
  comprobar("se elimina la orden y devuelve las rutas de sus archivos", elim.ok && Array.isArray(elim.json) && elim.json.length === 1, msg(elim));
  const quedan = await Promise.all(["ordenes?id=eq." + o.id, "pagos_cliente?orden_id=eq." + o.id, "asignaciones?orden_id=eq." + o.id, "orden_estados_historial?orden_id=eq." + o.id].map((r) => get(r + "&select=id")));
  comprobar("no quedan pagos, asignaciones ni historial de la orden", quedan.every((q) => q.json?.length === 0));
  const copia = (await get(`auditoria_admin?select=antes&entidad=eq.orden&entidad_id=eq.${o.id}&accion=eq.eliminar`)).json?.[0];
  comprobar("la auditoría conserva una copia con la orden, sus pagos y asignaciones", copia?.antes?.orden?.numero === o.numero && copia.antes.pagos.length === 1 && copia.antes.asignaciones.length === 1);
} finally {
  await limpiar();
}

console.log(`\n${pasan} correctas, ${fallan} fallidas.\n`);
process.exit(fallan ? 1 : 0);
