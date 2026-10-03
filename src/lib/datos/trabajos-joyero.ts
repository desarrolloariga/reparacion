import "server-only";

import type { EstadoOrden } from "@/lib/reparaciones/estados";
import { db } from "@/lib/supabase/server";
import type { CategoriaTrabajo, Enumerado } from "@/lib/supabase/modelo";

/**
 * Lo que ve el joyero. Sale de `vw_trabajos_joyero`, que no tiene columnas
 * de dinero del cliente: el filtro es la vista, no el componente.
 */

export type TrabajoJoyero = {
  asignacion_id: number;
  joyero_id: number;
  orden_id: number;
  numero: string;
  tipo: CategoriaTrabajo;
  estado_orden: EstadoOrden;
  estado_asignacion: Enumerado<"estado_asignacion">;
  descripcion_pieza: string;
  material: string | null;
  quilataje: string | null;
  piedras: string | null;
  trabajos: string | null;
  instrucciones: string | null;
  es_retrabajo: boolean;
  fecha_asignacion: string;
  fecha_compromiso: string;
  fecha_inicio_real: string | null;
  fecha_terminado_real: string | null;
  notas_joyero: string | null;
  dias_estimados: number | null;
  fotos_entrada: number;
  creado_en: string;
};

export async function trabajosDeJoyero(joyeroId: number): Promise<TrabajoJoyero[]> {
  const { data, error } = await db()
    .from("vw_trabajos_joyero")
    .select("*")
    .eq("joyero_id", joyeroId)
    .order("fecha_compromiso", { ascending: true })
    .limit(200);
  if (error) throw new Error(`No se pudieron leer los trabajos: ${error.message}`);
  return (data ?? []) as unknown as TrabajoJoyero[];
}

export async function trabajoDeJoyero(joyeroId: number, asignacionId: number): Promise<(TrabajoJoyero & { fotos: { id: number; momento: string }[] }) | null> {
  const { data, error } = await db()
    .from("vw_trabajos_joyero")
    .select("*")
    .eq("joyero_id", joyeroId)
    .eq("asignacion_id", asignacionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const t = data as unknown as TrabajoJoyero;
  const fotos = await db().from("fotografias").select("id, momento").eq("orden_id", t.orden_id).in("momento", ["entrada", "diseno"]).order("creado_en");
  return { ...t, fotos: fotos.data ?? [] };
}
