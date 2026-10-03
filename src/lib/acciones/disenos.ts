"use server";

import { requerirTaller } from "@/lib/auth/guardas";
import { db } from "@/lib/supabase/server";
import { texto, type EstadoAccion } from "@/lib/validacion";

import { anotarOrden, mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/**
 * Diseños de una creación. El archivo se sube por /api/archivos (destino
 * "diseno"), que crea la fila; aquí van la aprobación y los comentarios.
 */

export async function aprobarDiseno(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requerirTaller();
  const id = Number(texto(formData, "diseno_id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Diseño inválido." };
  const comentarios = texto(formData, "comentarios_cliente").trim() || null;

  const { data, error } = await db()
    .from("disenos")
    .update({ aprobado: true, aprobado_en: new Date().toISOString(), comentarios_cliente: comentarios })
    .eq("id", id)
    .select("orden_id, version")
    .maybeSingle();
  if (error || !data) return { error: await mensajeDeBase(error, "No se pudo aprobar el diseño.") };

  // Solo una versión aprobada: las demás quedan como historial.
  await db().from("disenos").update({ aprobado: false }).eq("orden_id", data.orden_id).neq("id", id);
  await anotarOrden(data.orden_id, `Diseño v${data.version} aprobado por el cliente${comentarios ? `: ${comentarios}` : ""}`);
  revalidarOrden(data.orden_id);
  return { ok: `Diseño v${data.version} aprobado.` };
}

export async function comentarDiseno(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requerirTaller();
  const id = Number(texto(formData, "diseno_id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Diseño inválido." };
  const comentarios = texto(formData, "comentarios_cliente").trim() || null;
  const descripcion = texto(formData, "descripcion").trim() || null;

  const { data, error } = await db()
    .from("disenos")
    .update({ comentarios_cliente: comentarios, descripcion })
    .eq("id", id)
    .select("orden_id")
    .maybeSingle();
  if (error || !data) return { error: await mensajeDeBase(error, "No se pudo guardar.") };
  revalidarOrden(data.orden_id);
  return { ok: "Diseño actualizado." };
}

export async function eliminarDiseno(formData: FormData) {
  await requerirTaller();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const { data } = await db().from("disenos").select("id, orden_id, ruta_storage, aprobado").eq("id", id).maybeSingle();
  if (!data || data.aprobado) return;
  await db().from("disenos").delete().eq("id", id);
  if (data.ruta_storage) {
    const { eliminarArchivos } = await import("@/lib/storage");
    try {
      await eliminarArchivos([data.ruta_storage]);
    } catch {
      /* lo limpia el cron */
    }
  }
  revalidarOrden(data.orden_id);
}
