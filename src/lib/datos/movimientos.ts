import "server-only";

import { db } from "@/lib/supabase/server";
import type { CategoriaTrabajo, Tabla } from "@/lib/supabase/modelo";

/**
 * Historial unificado de movimientos (`vw_movimientos`) con filtros por
 * tipo, período, usuario que registró, joyero, cliente y tipo de orden.
 */

export const TIPOS_MOVIMIENTO = ["venta", "cobro", "costo_joyero", "pago_joyero", "recepcion", "cotizacion", "estado"] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export const ETIQUETA_MOVIMIENTO: Record<TipoMovimiento, string> = {
  venta: "Venta (entrega)",
  cobro: "Cobro a cliente",
  costo_joyero: "Costo de joyero",
  pago_joyero: "Pago a joyero",
  recepcion: "Recepción",
  cotizacion: "Cotización",
  estado: "Cambio de estado",
};

export const TONO_MOVIMIENTO: Record<TipoMovimiento, "neutro" | "oro" | "exito" | "error" | "oscuro" | "tenue"> = {
  venta: "exito",
  cobro: "oro",
  costo_joyero: "oscuro",
  pago_joyero: "error",
  recepcion: "neutro",
  cotizacion: "neutro",
  estado: "tenue",
};

export type Movimiento = {
  tipo: TipoMovimiento;
  registro_id: number;
  fecha: string;
  momento: string | null;
  orden_id: number | null;
  numero: string | null;
  categoria: CategoriaTrabajo | null;
  cliente_id: number | null;
  cliente: string | null;
  joyero_id: number | null;
  joyero: string | null;
  usuario_id: number | null;
  usuario: string | null;
  monto: number | null;
  signo: number | null;
  detalle: string | null;
  referencia: string | null;
};

export type FiltroMovimientos = {
  tipos: TipoMovimiento[];
  desde: string;
  hasta: string;
  usuarioId?: number;
  joyeroId?: number;
  categoria?: CategoriaTrabajo;
  busqueda?: string;
};

export const POR_PAGINA_MOVIMIENTOS = [50, 100, 200] as const;

function filtrar<T extends { in: (c: string, v: readonly string[]) => T; gte: (c: string, v: string) => T; lte: (c: string, v: string) => T; eq: (c: string, v: string | number) => T; or: (f: string) => T }>(q: T, f: FiltroMovimientos): T {
  let r = q.gte("fecha", f.desde).lte("fecha", f.hasta);
  if (f.tipos.length > 0 && f.tipos.length < TIPOS_MOVIMIENTO.length) r = r.in("tipo", f.tipos);
  if (f.usuarioId) r = r.eq("usuario_id", f.usuarioId);
  if (f.joyeroId) r = r.eq("joyero_id", f.joyeroId);
  if (f.categoria) r = r.eq("categoria", f.categoria);
  if (f.busqueda?.trim()) {
    const b = f.busqueda.trim().replace(/[%,()]/g, " ");
    r = r.or(`numero.ilike.%${b}%,cliente.ilike.%${b}%,detalle.ilike.%${b}%,referencia.ilike.%${b}%`);
  }
  return r;
}

export async function listarMovimientos(f: FiltroMovimientos, pagina: number, porPagina: number): Promise<{ filas: Movimiento[]; total: number }> {
  const desde = (pagina - 1) * porPagina;
  const consulta = filtrar(db().from("vw_movimientos").select("*", { count: "exact" }), f)
    .order("fecha", { ascending: false })
    .order("momento", { ascending: false, nullsFirst: false })
    .range(desde, desde + porPagina - 1);
  const { data, error, count } = await consulta;
  if (error) throw new Error(`No se pudo leer el historial: ${error.message}`);
  return {
    filas: (data ?? []).map((m) => ({ ...m, monto: m.monto === null ? null : Number(m.monto) }) as Movimiento),
    total: count ?? 0,
  };
}

/** Totales por tipo con los mismos filtros (sin paginar). */
export async function resumenMovimientos(f: FiltroMovimientos): Promise<Record<TipoMovimiento, { cantidad: number; monto: number }>> {
  const { data, error } = await filtrar(db().from("vw_movimientos").select("tipo, monto"), f).limit(50000);
  if (error) throw new Error(error.message);
  const salida = Object.fromEntries(TIPOS_MOVIMIENTO.map((t) => [t, { cantidad: 0, monto: 0 }])) as Record<TipoMovimiento, { cantidad: number; monto: number }>;
  for (const m of data ?? []) {
    const t = m.tipo as TipoMovimiento;
    if (!salida[t]) continue;
    salida[t].cantidad += 1;
    salida[t].monto += Number(m.monto ?? 0);
  }
  return salida;
}

/** Las filas originales de la página, para abrir su corrección. */
export async function registrosOriginales(filas: Movimiento[]) {
  const ids = (t: TipoMovimiento) => [...new Set(filas.filter((f) => f.tipo === t).map((f) => f.registro_id))];
  const ordenesIds = [...new Set(filas.filter((f) => f.tipo === "venta" || f.tipo === "recepcion").map((f) => f.registro_id))];
  const consulta = async <T,>(tabla: "pagos_cliente" | "asignaciones" | "liquidaciones_joyero" | "orden_estados_historial" | "ordenes", lista: number[]) => {
    if (lista.length === 0) return new Map<number, T>();
    const { data, error } = await db().from(tabla).select("*").in("id", lista);
    if (error) throw new Error(error.message);
    return new Map(((data ?? []) as unknown as (T & { id: number })[]).map((r) => [r.id, r as T]));
  };
  const [pagos, asignaciones, liquidaciones, historial, ordenes] = await Promise.all([
    consulta<Tabla<"pagos_cliente">>("pagos_cliente", ids("cobro")),
    consulta<Tabla<"asignaciones">>("asignaciones", ids("costo_joyero")),
    consulta<Tabla<"liquidaciones_joyero">>("liquidaciones_joyero", ids("pago_joyero")),
    consulta<Tabla<"orden_estados_historial">>("orden_estados_historial", ids("estado")),
    consulta<Tabla<"ordenes">>("ordenes", ordenesIds),
  ]);
  return { pagos, asignaciones, liquidaciones, historial, ordenes };
}

// ── Saldos ───────────────────────────────────────────────────────────────
export type SaldoCliente = {
  id: number;
  numero: string;
  estado: string;
  cliente_id: number;
  cliente: string;
  precio_cliente: number;
  cobrado: number;
  saldo: number;
  fecha_recepcion: string;
  fecha_entrega_real: string | null;
};

export async function saldosClientes(f: { busqueda?: string; categoria?: CategoriaTrabajo }): Promise<SaldoCliente[]> {
  let q = db()
    .from("vw_ordenes_economia")
    .select("id, numero, estado, cliente_id, cliente, precio_cliente, cobrado, saldo, fecha_recepcion, fecha_entrega_real")
    .gt("saldo", 0)
    .not("estado", "in", "(rechazada,anulada)")
    .order("saldo", { ascending: false })
    .limit(500);
  if (f.categoria) q = q.eq("tipo", f.categoria);
  if (f.busqueda?.trim()) {
    const b = f.busqueda.trim().replace(/[%,()]/g, " ");
    q = q.or(`numero.ilike.%${b}%,cliente.ilike.%${b}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    ...r,
    precio_cliente: Number(r.precio_cliente),
    cobrado: Number(r.cobrado),
    saldo: Number(r.saldo),
  })) as SaldoCliente[];
}

export type SaldoJoyero = { joyero_id: number; joyero: string; trabajos: number; pendiente: number };

/** Trabajos terminados no pagados, por joyero. */
export async function saldosJoyeros(joyeroId?: number): Promise<SaldoJoyero[]> {
  let q = db()
    .from("asignaciones")
    .select("joyero_id, costo_pactado, joyeros(nombre)")
    .in("estado", ["terminada", "rechazada_calidad"])
    .eq("pagada", false)
    .gt("costo_pactado", 0);
  if (joyeroId) q = q.eq("joyero_id", joyeroId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const mapa = new Map<number, SaldoJoyero>();
  for (const a of data ?? []) {
    const nombre = (Array.isArray(a.joyeros) ? a.joyeros[0] : a.joyeros)?.nombre ?? "—";
    const s = mapa.get(a.joyero_id) ?? { joyero_id: a.joyero_id, joyero: nombre, trabajos: 0, pendiente: 0 };
    s.trabajos += 1;
    s.pendiente += Number(a.costo_pactado);
    mapa.set(a.joyero_id, s);
  }
  return [...mapa.values()].sort((a, b) => b.pendiente - a.pendiente);
}
