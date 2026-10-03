"use server";

import { revalidatePath } from "next/cache";

import { requerirJoyero } from "@/lib/auth/guardas";
import { asignacionPorId } from "@/lib/datos/asignaciones";
import { calendarioVigente } from "@/lib/datos/calendario";
import { notificar } from "@/lib/notificaciones";
import { desviacion } from "@/lib/reparaciones/asignacion";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { db } from "@/lib/supabase/server";
import { texto, type EstadoAccion } from "@/lib/validacion";

import { mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/**
 * Portal del joyero: iniciar, terminar y anotar. Solo sobre asignaciones
 * propias; las fechas las pone el servidor.
 */

async function asignacionPropia(formData: FormData) {
  const sesion = await requerirJoyero();
  const id = Number(texto(formData, "asignacion_id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Trabajo inválido." as const };
  const asignacion = await asignacionPorId(id);
  if (!asignacion || asignacion.joyero_id !== sesion.joyeroId) return { error: "Ese trabajo no es tuyo." as const };
  return { sesion, asignacion };
}

function revalidarTrabajos(ordenId: number) {
  revalidatePath("/panel/mis-trabajos", "layout");
  revalidarOrden(ordenId);
}

export async function iniciarTrabajo(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const r = await asignacionPropia(formData);
  if ("error" in r) return { error: r.error };

  const { error } = await db().rpc("fn_iniciar_trabajo", { p_asignacion_id: r.asignacion.id, p_usuario_id: r.sesion.usuarioId });
  if (error) return { error: await mensajeDeBase(error, "No se pudo iniciar el trabajo.") };
  revalidarTrabajos(r.asignacion.orden_id);
  return { ok: "Trabajo iniciado." };
}

export async function terminarTrabajo(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const r = await asignacionPropia(formData);
  if ("error" in r) return { error: r.error };
  const notas = texto(formData, "notas_joyero").trim();

  const [{ data: orden }, calendario] = await Promise.all([
    db().from("ordenes").select("numero, dias_estimados, descripcion_pieza").eq("id", r.asignacion.orden_id).single(),
    calendarioVigente(),
  ]);
  const d = desviacion(r.asignacion.fecha_asignacion, hoyISO(), orden?.dias_estimados ?? 0, calendario);

  const { error } = await db().rpc("fn_terminar_trabajo", {
    p_asignacion_id: r.asignacion.id,
    p_usuario_id: r.sesion.usuarioId,
    p_notas: notas,
    p_dias_reales: d.dias_reales,
    p_desviacion_dias: d.desviacion_dias,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo marcar como terminado.") };

  await notificar({
    tipo: "trabajo_terminado",
    titulo: `${r.sesion.nombre} terminó ${orden?.numero ?? "un trabajo"}`,
    cuerpo: `${orden?.descripcion_pieza ?? ""}${notas ? ` · ${notas}` : ""}`,
    enlace: `/panel/ordenes/${r.asignacion.orden_id}?tab=calidad`,
    roles: ["admin", "taller"],
  });

  revalidarTrabajos(r.asignacion.orden_id);
  return { ok: "Marcado como terminado. El taller recibirá la pieza para revisarla." };
}

export async function guardarNotasJoyero(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const r = await asignacionPropia(formData);
  if ("error" in r) return { error: r.error };
  const notas = texto(formData, "notas_joyero").trim().slice(0, 1000) || null;
  const { error } = await db().from("asignaciones").update({ notas_joyero: notas }).eq("id", r.asignacion.id);
  if (error) return { error: error.message };
  revalidarTrabajos(r.asignacion.orden_id);
  return { ok: "Notas guardadas." };
}
