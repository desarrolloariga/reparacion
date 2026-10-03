"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirAdmin } from "@/lib/auth/guardas";
import { listarComplejidades, listarTiposTrabajo } from "@/lib/datos/catalogos";
import { CATEGORIAS } from "@/lib/supabase/modelo";
import { db } from "@/lib/supabase/server";
import {
  erroresDeZod,
  esDuplicado,
  idOpcional,
  leerActivo,
  texto,
  textoOpcional,
  textoRequerido,
  type EstadoAccion,
} from "@/lib/validacion";

/**
 * Catálogos: especialidades, tipos de trabajo, complejidades y la matriz de
 * tiempos estándar. Solo administración. Nada se borra: lo que ya se usó en
 * una orden se desactiva.
 */

function revalidarCatalogos() {
  revalidatePath("/panel/catalogos", "layout");
  revalidatePath("/panel");
}

// ── Especialidades ───────────────────────────────────────────────────────
const EsquemaEspecialidad = z.object({
  id: idOpcional,
  nombre: textoRequerido("Escribe el nombre de la especialidad.", 80),
});

export async function guardarEspecialidad(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();
  const r = EsquemaEspecialidad.safeParse({ id: texto(formData, "id"), nombre: texto(formData, "nombre") });
  if (!r.success) return erroresDeZod(r.error);

  const { id, nombre } = r.data;
  const { error } = id
    ? await db().from("especialidades").update({ nombre }).eq("id", id)
    : await db().from("especialidades").insert({ nombre });

  if (error) {
    if (esDuplicado(error)) return { error: `Ya existe la especialidad "${nombre}".`, campos: { nombre: "Nombre repetido" } };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidarCatalogos();
  if (id) redirect("/panel/catalogos/especialidades?guardado=1");
  return { ok: `Especialidad "${nombre}" creada.` };
}

export async function alternarEspecialidad(formData: FormData) {
  await requerirAdmin();
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  if (!Number.isInteger(id) || id <= 0) return;
  await db().from("especialidades").update({ activo: !activo }).eq("id", id);
  revalidarCatalogos();
}

// ── Tipos de trabajo ─────────────────────────────────────────────────────
const EsquemaTipo = z.object({
  id: idOpcional,
  nombre: textoRequerido("Escribe el nombre del tipo de trabajo.", 120),
  categoria: z.enum(CATEGORIAS, "Elige reparación o creación."),
  especialidad_id: idOpcional,
  descripcion: textoOpcional(500),
});

export async function guardarTipoTrabajo(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const r = EsquemaTipo.safeParse({
    id: texto(formData, "id"),
    nombre: texto(formData, "nombre"),
    categoria: texto(formData, "categoria"),
    especialidad_id: texto(formData, "especialidad_id"),
    descripcion: texto(formData, "descripcion"),
  });
  if (!r.success) return erroresDeZod(r.error);

  const { id, ...datos } = r.data;
  const { error } = id
    ? await db().from("tipos_trabajo").update(datos).eq("id", id)
    : await db().from("tipos_trabajo").insert({ ...datos, creado_por: sesion.usuarioId });

  if (error) {
    if (esDuplicado(error)) return { error: `Ya existe un tipo de trabajo llamado "${datos.nombre}".`, campos: { nombre: "Nombre repetido" } };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidarCatalogos();
  if (id) redirect("/panel/catalogos/tipos-trabajo?guardado=1");
  return { ok: `Tipo de trabajo "${datos.nombre}" creado. Recuerda definir sus tiempos en la matriz.` };
}

export async function alternarTipoTrabajo(formData: FormData) {
  await requerirAdmin();
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  if (!Number.isInteger(id) || id <= 0) return;
  await db().from("tipos_trabajo").update({ activo: !activo }).eq("id", id);
  revalidarCatalogos();
}

// ── Complejidades ────────────────────────────────────────────────────────
const EsquemaComplejidad = z.object({
  id: z.coerce.number().int().positive(),
  nombre: textoRequerido("Escribe el nombre.", 40),
  orden: z.coerce.number().int().min(1, "El orden empieza en 1.").max(20),
  descripcion: textoOpcional(300),
});

export async function guardarComplejidad(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();
  const r = EsquemaComplejidad.safeParse({
    id: texto(formData, "id"),
    nombre: texto(formData, "nombre"),
    orden: texto(formData, "orden"),
    descripcion: texto(formData, "descripcion"),
  });
  if (!r.success) return erroresDeZod(r.error);

  const { id, ...datos } = r.data;
  const { error } = await db().from("complejidades").update(datos).eq("id", id);
  if (error) {
    if (esDuplicado(error)) return { error: "Ya hay otra complejidad con ese nombre o ese orden." };
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidarCatalogos();
  return { ok: `"${datos.nombre}" guardada.` };
}

// ── Matriz de tiempos estándar ───────────────────────────────────────────
/**
 * Guarda toda la grilla de una vez. Las celdas llegan como
 * `t_<tipoId>_<complejidadId>`; solo se aceptan ids que existen (lista
 * blanca desde la base), vacío significa "sin tiempo definido" y se borra,
 * y cualquier valor que no sea un entero positivo se marca en su celda.
 */
export async function guardarMatriz(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();

  const [tipos, complejidades] = await Promise.all([listarTiposTrabajo(), listarComplejidades()]);
  const tiposValidos = new Set(tipos.map((t) => t.id));
  const complejidadesValidas = new Set(complejidades.map((c) => c.id));

  const campos: Record<string, string> = {};
  const guardar: { tipo_trabajo_id: number; complejidad_id: number; dias_habiles: number }[] = [];
  const borrar: { tipo_trabajo_id: number; complejidad_id: number }[] = [];

  for (const [nombre, valor] of formData.entries()) {
    const m = /^t_(\d+)_(\d+)$/.exec(nombre);
    if (!m || typeof valor !== "string") continue;
    const tipoId = Number(m[1]);
    const complejidadId = Number(m[2]);
    if (!tiposValidos.has(tipoId) || !complejidadesValidas.has(complejidadId)) continue;

    const crudo = valor.trim();
    if (crudo === "") {
      borrar.push({ tipo_trabajo_id: tipoId, complejidad_id: complejidadId });
      continue;
    }
    if (!/^\d+$/.test(crudo) || Number(crudo) <= 0 || Number(crudo) > 365) {
      campos[nombre] = "Entero de 1 a 365";
      continue;
    }
    guardar.push({ tipo_trabajo_id: tipoId, complejidad_id: complejidadId, dias_habiles: Number(crudo) });
  }

  if (Object.keys(campos).length > 0) {
    return { error: "Hay celdas con valores inválidos: deben ser días hábiles enteros, de 1 a 365.", campos };
  }

  if (guardar.length > 0) {
    const { error } = await db()
      .from("tiempos_estandar")
      .upsert(guardar, { onConflict: "tipo_trabajo_id,complejidad_id" });
    if (error) return { error: `No se pudo guardar la matriz: ${error.message}` };
  }

  for (const b of borrar) {
    const { error } = await db()
      .from("tiempos_estandar")
      .delete()
      .eq("tipo_trabajo_id", b.tipo_trabajo_id)
      .eq("complejidad_id", b.complejidad_id);
    if (error) return { error: `No se pudo limpiar una celda: ${error.message}` };
  }

  revalidarCatalogos();
  return { ok: `Matriz guardada: ${guardar.length} celdas con tiempo.` };
}

export { leerActivo };
