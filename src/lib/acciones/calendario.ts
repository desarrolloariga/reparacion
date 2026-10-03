"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requerirAdmin } from "@/lib/auth/guardas";
import { db } from "@/lib/supabase/server";
import {
  erroresDeZod,
  esDuplicado,
  fechaISO,
  idOpcional,
  texto,
  textoOpcional,
  type EstadoAccion,
} from "@/lib/validacion";

/** Excepciones del calendario laboral: feriados y días abiertos. */

const EsquemaDia = z.object({
  id: idOpcional,
  fecha: fechaISO("La fecha"),
  es_habil: z.enum(["true", "false"], "Indica si el día es hábil o no."),
  descripcion: textoOpcional(120),
});

export async function guardarDia(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const r = EsquemaDia.safeParse({
    id: texto(formData, "id"),
    fecha: texto(formData, "fecha"),
    es_habil: texto(formData, "es_habil"),
    descripcion: texto(formData, "descripcion"),
  });
  if (!r.success) return erroresDeZod(r.error);

  const { id, fecha, descripcion } = r.data;
  const es_habil = r.data.es_habil === "true";

  const { error } = id
    ? await db().from("calendario_laboral").update({ fecha, es_habil, descripcion }).eq("id", id)
    : await db()
        .from("calendario_laboral")
        .insert({ fecha, es_habil, descripcion, creado_por: sesion.usuarioId });

  if (error) {
    if (esDuplicado(error)) return { error: `El ${fecha} ya está en el calendario. Edítalo desde la lista.`, campos: { fecha: "Fecha repetida" } };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath("/panel", "layout");
  return { ok: `${fecha} guardado como ${es_habil ? "día hábil" : "día no hábil"}.` };
}

/** Las excepciones no tienen dependencias: sí se pueden borrar. */
export async function eliminarDia(formData: FormData) {
  await requerirAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await db().from("calendario_laboral").delete().eq("id", id);
  revalidatePath("/panel", "layout");
}
