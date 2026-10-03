import "server-only";

import { db } from "@/lib/supabase/server";
import type { CategoriaTrabajo } from "@/lib/supabase/modelo";

/**
 * Indicadores de operación, joyeros, dinero y clientes. Todo sale de vistas y
 * funciones SQL del esquema; aquí solo se tipifica (las funciones devuelven
 * numeric como texto).
 */

const n = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
const nn = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export type Rango = { desde: string; hasta: string };

export async function indicadoresOperacion(r: Rango) {
  const { data, error } = await db().rpc("fn_indicadores_operacion", { p_desde: r.desde, p_hasta: r.hasta });
  if (error) throw new Error(error.message);
  const d = data?.[0];
  return {
    recibidas: n(d?.recibidas),
    activas: n(d?.activas),
    entregadas: n(d?.entregadas),
    entregadas_a_tiempo: n(d?.entregadas_a_tiempo),
    pct_a_tiempo: nn(d?.pct_a_tiempo),
    dias_promedio_total: nn(d?.dias_promedio_total),
    desviacion_promedio: nn(d?.desviacion_promedio),
    cotizaciones_enviadas: n(d?.cotizaciones_enviadas),
    cotizaciones_aprobadas: n(d?.cotizaciones_aprobadas),
    conversion_pct: nn(d?.conversion_pct),
  };
}

export async function tiempoPorTipo(r: Rango) {
  const { data, error } = await db().rpc("fn_tiempo_por_tipo", { p_desde: r.desde, p_hasta: r.hasta });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ tipo_trabajo_id: d.tipo_trabajo_id, tipo_trabajo: d.tipo_trabajo, categoria: d.categoria as CategoriaTrabajo, ordenes: n(d.ordenes), dias_promedio: nn(d.dias_promedio) }));
}

export async function economiaResumen(r: Rango) {
  const { data, error } = await db().rpc("fn_economia_resumen", { p_desde: r.desde, p_hasta: r.hasta });
  if (error) throw new Error(error.message);
  const d = data?.[0];
  return {
    ordenes: n(d?.ordenes),
    ingreso: n(d?.ingreso),
    costo: n(d?.costo),
    utilidad: n(d?.utilidad),
    margen: nn(d?.margen),
    cobrado_en_periodo: n(d?.cobrado_en_periodo),
    saldo_pendiente_total: n(d?.saldo_pendiente_total),
    pendiente_pago_joyeros: n(d?.pendiente_pago_joyeros),
    garantias: n(d?.garantias),
    costo_garantias: n(d?.costo_garantias),
  };
}

export async function economiaPorJoyero(r: Rango) {
  const { data, error } = await db().rpc("fn_economia_por_joyero", { p_desde: r.desde, p_hasta: r.hasta });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ joyero_id: d.joyero_id, joyero: d.joyero, ordenes: n(d.ordenes), ingreso: n(d.ingreso), costo: n(d.costo), utilidad: n(d.utilidad), margen: nn(d.margen) }));
}

export async function economiaPorTipo(r: Rango) {
  const { data, error } = await db().rpc("fn_economia_por_tipo", { p_desde: r.desde, p_hasta: r.hasta });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ tipo_trabajo_id: d.tipo_trabajo_id, tipo_trabajo: d.tipo_trabajo, categoria: d.categoria as CategoriaTrabajo, lineas: n(d.lineas), ingreso: n(d.ingreso), costo_estimado: n(d.costo_estimado), utilidad: n(d.utilidad), margen: nn(d.margen) }));
}

export async function utilidadMensual(meses = 12) {
  const { data, error } = await db().rpc("fn_utilidad_mensual", { p_meses: meses });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ mes: d.mes, entregadas: n(d.entregadas), ingreso: n(d.ingreso), costo: n(d.costo), utilidad: n(d.utilidad) }));
}

export async function ticketPromedio(r: Rango) {
  const { data, error } = await db().rpc("fn_ticket_promedio", { p_desde: r.desde, p_hasta: r.hasta });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ tipo: d.tipo as CategoriaTrabajo, ordenes: n(d.ordenes), ticket_promedio: n(d.ticket_promedio), utilidad_promedio: n(d.utilidad_promedio) }));
}

export async function tasaRecompra() {
  const { data, error } = await db().rpc("fn_tasa_recompra");
  if (error) throw new Error(error.message);
  const d = data?.[0];
  return { clientes_con_servicio: n(d?.clientes_con_servicio), clientes_recurrentes: n(d?.clientes_recurrentes), tasa_recompra_pct: nn(d?.tasa_recompra_pct) };
}

export async function rankingClientes(r: Rango, criterio: "facturacion" | "utilidad" = "facturacion", limite = 10) {
  const { data, error } = await db().rpc("fn_ranking_clientes", { p_desde: r.desde, p_hasta: r.hasta, p_criterio: criterio, p_limite: limite });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ cliente_id: d.cliente_id, cliente: d.cliente, ordenes: n(d.ordenes), facturado: n(d.facturado), utilidad: n(d.utilidad) }));
}

export async function nuevosVsRecurrentes(r: Rango) {
  const { data, error } = await db().rpc("fn_ingresos_nuevos_vs_recurrentes", { p_desde: r.desde, p_hasta: r.hasta });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ segmento: d.segmento as "nuevos" | "recurrentes", clientes: n(d.clientes), ordenes: n(d.ordenes), ingreso: n(d.ingreso), utilidad: n(d.utilidad) }));
}

export type Cliente360 = {
  id: number;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
  total_ordenes: number;
  total_facturado: number;
  utilidad_generada: number;
  ticket_promedio: number | null;
  utilidad_promedio: number | null;
  fecha_primer_servicio: string | null;
  fecha_ultimo_servicio: string | null;
  dias_desde_ultimo_servicio: number | null;
  frecuencia_promedio_dias: number | null;
  tipo_trabajo_mas_frecuente: string | null;
  precio_minimo: number | null;
  precio_maximo: number | null;
  es_recurrente: boolean;
  inactivo: boolean;
  ordenes_activas: number;
  garantias: number;
};

function a360(d: Record<string, unknown>): Cliente360 {
  return {
    id: Number(d.id),
    nombre: String(d.nombre ?? ""),
    telefono: (d.telefono as string | null) ?? null,
    correo: (d.correo as string | null) ?? null,
    activo: Boolean(d.activo),
    total_ordenes: n(d.total_ordenes),
    total_facturado: n(d.total_facturado),
    utilidad_generada: n(d.utilidad_generada),
    ticket_promedio: nn(d.ticket_promedio),
    utilidad_promedio: nn(d.utilidad_promedio),
    fecha_primer_servicio: (d.fecha_primer_servicio as string | null) ?? null,
    fecha_ultimo_servicio: (d.fecha_ultimo_servicio as string | null) ?? null,
    dias_desde_ultimo_servicio: nn(d.dias_desde_ultimo_servicio),
    frecuencia_promedio_dias: nn(d.frecuencia_promedio_dias),
    tipo_trabajo_mas_frecuente: (d.tipo_trabajo_mas_frecuente as string | null) ?? null,
    precio_minimo: nn(d.precio_minimo),
    precio_maximo: nn(d.precio_maximo),
    es_recurrente: Boolean(d.es_recurrente),
    inactivo: Boolean(d.inactivo),
    ordenes_activas: n(d.ordenes_activas),
    garantias: n(d.garantias),
  };
}

export async function cliente360(id: number): Promise<Cliente360 | null> {
  const { data, error } = await db().from("vw_cliente_360").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? a360(data as Record<string, unknown>) : null;
}

export async function clientes360(orden: "facturado" | "utilidad" | "recientes" | "inactivos" = "facturado", limite = 20): Promise<Cliente360[]> {
  let q = db().from("vw_cliente_360").select("*").gt("total_ordenes", 0).limit(limite);
  q =
    orden === "utilidad" ? q.order("utilidad_generada", { ascending: false })
    : orden === "recientes" ? q.order("fecha_ultimo_servicio", { ascending: false })
    : orden === "inactivos" ? q.eq("inactivo", true).order("dias_desde_ultimo_servicio", { ascending: false })
    : q.order("total_facturado", { ascending: false });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => a360(d as Record<string, unknown>));
}
