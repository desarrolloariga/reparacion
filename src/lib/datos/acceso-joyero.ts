import "server-only";

import { db } from "@/lib/supabase/server";

/**
 * ¿Tiene este joyero alguna asignación sobre la orden? Decide qué archivos
 * y qué órdenes puede ver desde su portal.
 */
export async function joyeroTieneOrden(joyeroId: number, ordenId: number): Promise<boolean> {
  const { count } = await db()
    .from("asignaciones")
    .select("id", { count: "exact", head: true })
    .eq("orden_id", ordenId)
    .eq("joyero_id", joyeroId);
  return (count ?? 0) > 0;
}
