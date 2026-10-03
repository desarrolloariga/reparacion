import "server-only";

import { db } from "@/lib/supabase/server";
import type { Tabla } from "@/lib/supabase/modelo";

/** Lecturas de calidad, pagos y desempeño de joyeros. */

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export type ControlCalidad = Tabla<"control_calidad"> & { revisor: string | null };

export async function controlesDeOrden(ordenId: number): Promise<ControlCalidad[]> {
  const { data, error } = await db()
    .from("control_calidad")
    .select("*, usuarios(nombre)")
    .eq("orden_id", ordenId)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ usuarios, ...c }) => ({ ...c, revisor: uno(usuarios)?.nombre ?? null }));
}

export type Pago = Tabla<"pagos_cliente"> & { registrado: string | null };

export async function pagosDeOrden(ordenId: number): Promise<Pago[]> {
  const { data, error } = await db()
    .from("pagos_cliente")
    .select("*, usuarios(nombre)")
    .eq("orden_id", ordenId)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ usuarios, ...p }) => ({ ...p, registrado: uno(usuarios)?.nombre ?? null }));
}

export function saldoDe(precioCliente: number, pagos: readonly { monto: number }[]) {
  const cobrado = Math.round(pagos.reduce((s, p) => s + Number(p.monto), 0) * 100) / 100;
  return { cobrado, saldo: Math.round((Number(precioCliente) - cobrado) * 100) / 100 };
}

export type DesempenoJoyero = {
  joyero_id: number;
  joyero: string;
  activo: boolean;
  asignados: number;
  en_proceso: number;
  terminados: number;
  atrasados: number;
  dias_promedio_respuesta: number | null;
  cumplimiento_pct: number | null;
  retrabajo_pct: number | null;
  costo_total: number;
  pendiente_pago: number;
};

export async function desempenoJoyeros(desde: string, hasta: string): Promise<DesempenoJoyero[]> {
  const { data, error } = await db().rpc("fn_desempeno_joyeros", { p_desde: desde, p_hasta: hasta });
  if (error) throw new Error(`No se pudo leer el desempeño: ${error.message}`);
  return (data ?? []).map((d) => ({
    ...d,
    dias_promedio_respuesta: d.dias_promedio_respuesta === null ? null : Number(d.dias_promedio_respuesta),
    cumplimiento_pct: d.cumplimiento_pct === null ? null : Number(d.cumplimiento_pct),
    retrabajo_pct: d.retrabajo_pct === null ? null : Number(d.retrabajo_pct),
    costo_total: Number(d.costo_total),
    pendiente_pago: Number(d.pendiente_pago),
  }));
}

export type AsignacionDeJoyero = Tabla<"asignaciones"> & { numero: string; descripcion_pieza: string; estado_orden: string };

export async function asignacionesDeJoyero(joyeroId: number, limite = 50): Promise<AsignacionDeJoyero[]> {
  const { data, error } = await db()
    .from("asignaciones")
    .select("*, ordenes(numero, descripcion_pieza, estado)")
    .eq("joyero_id", joyeroId)
    .order("id", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ ordenes, ...a }) => {
    const o = uno(ordenes);
    return { ...a, numero: o?.numero ?? "—", descripcion_pieza: o?.descripcion_pieza ?? "", estado_orden: o?.estado ?? "" };
  });
}
