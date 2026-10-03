import "server-only";

import { db } from "@/lib/supabase/server";
import type { Tabla } from "@/lib/supabase/modelo";

export type Cotizacion = Tabla<"cotizaciones">;
export type LineaCotizacionFila = Tabla<"cotizacion_detalle"> & { tipo_trabajo: string; complejidad: string };

export type CotizacionCompleta = {
  cotizacion: Cotizacion;
  lineas: LineaCotizacionFila[];
};

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export async function cotizacionPorId(id: number): Promise<CotizacionCompleta | null> {
  const [cot, lineas] = await Promise.all([
    db().from("cotizaciones").select("*").eq("id", id).maybeSingle(),
    db()
      .from("cotizacion_detalle")
      .select("*, tipos_trabajo(nombre), complejidades(nombre)")
      .eq("cotizacion_id", id)
      .order("orden")
      .order("id"),
  ]);
  if (cot.error) throw new Error(`No se pudo leer la cotización: ${cot.error.message}`);
  if (lineas.error) throw new Error(lineas.error.message);
  if (!cot.data) return null;

  return {
    cotizacion: cot.data,
    lineas: (lineas.data ?? []).map(({ tipos_trabajo, complejidades, ...l }) => ({
      ...l,
      tipo_trabajo: uno(tipos_trabajo)?.nombre ?? "—",
      complejidad: uno(complejidades)?.nombre ?? "—",
    })),
  };
}

export async function cotizacionesDeOrden(ordenId: number): Promise<Cotizacion[]> {
  const { data, error } = await db()
    .from("cotizaciones")
    .select("*")
    .eq("orden_id", ordenId)
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Costo sugerido por tipo/complejidad desde las tarifas activas de un joyero. */
export async function costosSugeridosDe(joyeroId: number): Promise<Map<string, number>> {
  const { data, error } = await db()
    .from("tarifas_joyero")
    .select("tipo_trabajo_id, complejidad_id, costo_acordado")
    .eq("joyero_id", joyeroId)
    .eq("activo", true);
  if (error) throw new Error(error.message);
  const mapa = new Map<string, number>();
  for (const t of data ?? []) {
    mapa.set(`${t.tipo_trabajo_id}:${t.complejidad_id ?? "*"}`, Number(t.costo_acordado));
  }
  return mapa;
}
