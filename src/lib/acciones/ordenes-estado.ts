"use server";

import { revalidatePath } from "next/cache";

import { requerirTaller } from "@/lib/auth/guardas";
import { ESTADOS_ORDEN, ETIQUETA_ESTADO, puedeTransitar, type EstadoOrden } from "@/lib/reparaciones/estados";
import { db } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/lib/validacion";

/**
 * Única puerta de cambio de estado de una orden desde la aplicación.
 *
 * Ninguna pantalla ni acción escribe `ordenes.estado`: todas pasan por aquí,
 * y esto llama a `fn_cambiar_estado_orden`, que valida la transición, las
 * precondiciones y escribe el historial en una sola transacción. Un trigger
 * en la base rechaza cualquier otro camino.
 */

export type ResultadoEstado = { ok: true; estado: EstadoOrden } | { ok: false; error: string };

/** Mensaje humano de un error de PostgREST/plpgsql. */
export async function mensajeDeBase(error: { message?: string; details?: string } | null | undefined, porDefecto: string) {
  const m = error?.message?.trim();
  if (!m) return porDefecto;
  return m.replace(/^(ERROR|P0001|P0002):\s*/i, "");
}

export async function cambiarEstadoOrden(
  ordenId: number,
  estadoNuevo: EstadoOrden,
  comentario?: string | null,
): Promise<ResultadoEstado> {
  const sesion = await requerirTaller();

  const { data: actual, error: errorLectura } = await db()
    .from("ordenes")
    .select("estado")
    .eq("id", ordenId)
    .maybeSingle();
  if (errorLectura || !actual) return { ok: false, error: "La orden no existe." };

  // Comprobación previa para dar un mensaje claro; la base vuelve a validar.
  if (!puedeTransitar(actual.estado as EstadoOrden, estadoNuevo)) {
    return {
      ok: false,
      error: `Una orden ${ETIQUETA_ESTADO[actual.estado as EstadoOrden].toLowerCase()} no puede pasar a ${ETIQUETA_ESTADO[estadoNuevo].toLowerCase()}.`,
    };
  }

  const { data, error } = await db().rpc("fn_cambiar_estado_orden", {
    p_orden_id: ordenId,
    p_estado_nuevo: estadoNuevo,
    p_usuario_id: sesion.usuarioId,
    p_comentario: comentario?.trim() || undefined,
  });

  if (error) return { ok: false, error: await mensajeDeBase(error, "No se pudo cambiar el estado.") };

  revalidarOrden(ordenId);
  return { ok: true, estado: (data as { estado: EstadoOrden }).estado };
}

/** Versión para formularios: `estado` y `comentario` en el FormData. */
export async function transicionarOrden(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const ordenId = Number(formData.get("orden_id"));
  const estado = String(formData.get("estado") ?? "");
  const comentario = String(formData.get("comentario") ?? "");

  if (!Number.isInteger(ordenId) || ordenId <= 0) return { error: "Orden inválida." };
  if (!ESTADOS_ORDEN.includes(estado as EstadoOrden)) return { error: "Estado inválido." };

  const r = await cambiarEstadoOrden(ordenId, estado as EstadoOrden, comentario);
  if (!r.ok) return { error: r.error };
  return { ok: `La orden pasó a ${ETIQUETA_ESTADO[r.estado].toLowerCase()}.` };
}

/** Anotación en el historial sin cambio de estado. */
export async function anotarOrden(ordenId: number, comentario: string) {
  const sesion = await requerirTaller();
  const { error } = await db().rpc("fn_anotar_orden", {
    p_orden_id: ordenId,
    p_usuario_id: sesion.usuarioId,
    p_comentario: comentario,
  });
  if (error) throw new Error(await mensajeDeBase(error, "No se pudo anotar la orden."));
  revalidarOrden(ordenId);
}

export async function revalidarOrden(ordenId?: number) {
  revalidatePath("/panel");
  revalidatePath("/panel/ordenes");
  revalidatePath("/panel/tablero");
  revalidatePath("/panel/alertas");
  if (ordenId) revalidatePath(`/panel/ordenes/${ordenId}`, "layout");
}
