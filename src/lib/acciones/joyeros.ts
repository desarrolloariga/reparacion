"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
import { normalizarIdentificador } from "@/lib/auth/identificador";
import { db } from "@/lib/supabase/server";
import {
  enteroEntre,
  erroresDeZod,
  esDuplicado,
  fechaISO,
  idEntero,
  idOpcional,
  importe,
  leerIds,
  texto,
  textoOpcional,
  textoRequerido,
  type EstadoAccion,
} from "@/lib/validacion";

/** Joyeros, sus especialidades y sus tarifas. Admin y taller. */

function revalidarJoyeros(id?: number) {
  revalidatePath("/panel/joyeros");
  if (id) revalidatePath(`/panel/joyeros/${id}`);
  revalidatePath("/panel/usuarios");
}

const EsquemaJoyero = z.object({
  nombre: textoRequerido("Escribe el nombre del joyero.", 120),
  documento: textoOpcional(40),
  telefono: textoOpcional(40),
  correo: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v === "" ? null : normalizarIdentificador(v))),
  usuario_id: idOpcional,
  capacidad_maxima: enteroEntre(1, 100, "La capacidad"),
  notas: textoOpcional(1000),
});

function leerJoyero(formData: FormData) {
  return EsquemaJoyero.safeParse({
    nombre: texto(formData, "nombre"),
    documento: texto(formData, "documento"),
    telefono: texto(formData, "telefono"),
    correo: texto(formData, "correo"),
    usuario_id: texto(formData, "usuario_id"),
    capacidad_maxima: texto(formData, "capacidad_maxima") || "5",
    notas: texto(formData, "notas"),
  });
}

async function guardarEspecialidades(joyeroId: number, ids: number[]) {
  // Primero se añaden las nuevas y luego se quitan las sobrantes: nunca hay
  // un instante en que el joyero se queda sin ninguna por error.
  if (ids.length > 0) {
    const { error } = await db()
      .from("joyeros_especialidades")
      .upsert(
        ids.map((especialidad_id) => ({ joyero_id: joyeroId, especialidad_id })),
        { onConflict: "joyero_id,especialidad_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
  }
  let borrado = db().from("joyeros_especialidades").delete().eq("joyero_id", joyeroId);
  if (ids.length > 0) borrado = borrado.not("especialidad_id", "in", `(${ids.join(",")})`);
  const { error } = await borrado;
  if (error) throw new Error(error.message);
}

function mensajeDeError(error: { code?: string; message: string }) {
  if (esDuplicado(error)) {
    return { error: "Esa cuenta de acceso ya está enlazada a otro joyero.", campos: { usuario_id: "Cuenta ocupada" } };
  }
  return { error: `No se pudo guardar: ${error.message}` };
}

export async function crearJoyero(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const r = leerJoyero(formData);
  if (!r.success) return erroresDeZod(r.error);

  const { data, error } = await db()
    .from("joyeros")
    .insert({ ...r.data, creado_por: sesion.usuarioId })
    .select("id")
    .single();
  if (error) return mensajeDeError(error);

  try {
    await guardarEspecialidades(data.id, leerIds(formData, "especialidades"));
  } catch (e) {
    return { error: `El joyero se creó pero no se guardaron sus especialidades: ${(e as Error).message}` };
  }

  revalidarJoyeros(data.id);
  redirect(`/panel/joyeros/${data.id}?creado=1`);
}

export async function editarJoyero(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirTaller();
  const id = idEntero.safeParse(texto(formData, "id"));
  if (!id.success) return { error: "Joyero inválido." };
  const r = leerJoyero(formData);
  if (!r.success) return erroresDeZod(r.error);

  const { error } = await db().from("joyeros").update(r.data).eq("id", id.data);
  if (error) return mensajeDeError(error);

  try {
    await guardarEspecialidades(id.data, leerIds(formData, "especialidades"));
  } catch (e) {
    return { error: `Se guardaron los datos pero no las especialidades: ${(e as Error).message}` };
  }

  revalidarJoyeros(id.data);
  return { ok: "Joyero guardado." };
}

export async function alternarJoyero(formData: FormData) {
  await requerirTaller();
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  if (!Number.isInteger(id) || id <= 0) return;
  await db().from("joyeros").update({ activo: !activo }).eq("id", id);
  revalidarJoyeros(id);
}

// ── Tarifas ──────────────────────────────────────────────────────────────
const EsquemaTarifa = z.object({
  joyero_id: idEntero,
  tipo_trabajo_id: idEntero,
  complejidad_id: idOpcional,
  costo_acordado: importe("El costo"),
  vigente_desde: fechaISO("La fecha de vigencia"),
});

/**
 * Las tarifas no se editan: una nueva desactiva la vigente de la misma
 * clave (joyero, tipo, complejidad) y queda el historial para liquidar.
 */
export async function agregarTarifa(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const r = EsquemaTarifa.safeParse({
    joyero_id: texto(formData, "joyero_id"),
    tipo_trabajo_id: texto(formData, "tipo_trabajo_id"),
    complejidad_id: texto(formData, "complejidad_id"),
    costo_acordado: texto(formData, "costo_acordado"),
    vigente_desde: texto(formData, "vigente_desde"),
  });
  if (!r.success) return erroresDeZod(r.error);
  const d = r.data;

  let anterior = db()
    .from("tarifas_joyero")
    .update({ activo: false })
    .eq("joyero_id", d.joyero_id)
    .eq("tipo_trabajo_id", d.tipo_trabajo_id)
    .eq("activo", true);
  anterior = d.complejidad_id === null
    ? anterior.is("complejidad_id", null)
    : anterior.eq("complejidad_id", d.complejidad_id);
  const { error: errorAnterior } = await anterior;
  if (errorAnterior) return { error: `No se pudo cerrar la tarifa anterior: ${errorAnterior.message}` };

  const { error } = await db()
    .from("tarifas_joyero")
    .insert({ ...d, creado_por: sesion.usuarioId });
  if (error) {
    if (esDuplicado(error)) return { error: "Ya hay una tarifa vigente para esa combinación." };
    return { error: `No se pudo guardar la tarifa: ${error.message}` };
  }

  revalidarJoyeros(d.joyero_id);
  return { ok: "Tarifa guardada. La anterior de la misma combinación quedó como historial." };
}

export async function desactivarTarifa(formData: FormData) {
  await requerirTaller();
  const id = Number(formData.get("id"));
  const joyeroId = Number(formData.get("joyero_id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await db().from("tarifas_joyero").update({ activo: false }).eq("id", id);
  revalidarJoyeros(joyeroId);
}
