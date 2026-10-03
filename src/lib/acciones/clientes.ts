"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
import { normalizarIdentificador } from "@/lib/auth/identificador";
import { db } from "@/lib/supabase/server";
import {
  erroresDeZod,
  idOpcional,
  texto,
  textoOpcional,
  textoRequerido,
  type EstadoAccion,
} from "@/lib/validacion";

/** Directorio de clientes. Admin y taller. */

const EsquemaCliente = z.object({
  id: idOpcional,
  nombre: textoRequerido("Escribe el nombre del cliente.", 160),
  telefono: textoOpcional(40),
  correo: z
    .string()
    .trim()
    .max(160)
    .transform((v) => (v === "" ? null : normalizarIdentificador(v))),
  direccion: textoOpcional(300),
  notas: textoOpcional(1000),
});

export async function guardarCliente(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const r = EsquemaCliente.safeParse({
    id: texto(formData, "id"),
    nombre: texto(formData, "nombre"),
    telefono: texto(formData, "telefono"),
    correo: texto(formData, "correo"),
    direccion: texto(formData, "direccion"),
    notas: texto(formData, "notas"),
  });
  if (!r.success) return erroresDeZod(r.error);

  const { id, ...datos } = r.data;
  if (id) {
    const { error } = await db().from("clientes").update(datos).eq("id", id);
    if (error) return { error: `No se pudo guardar: ${error.message}` };
    revalidatePath("/panel/clientes", "layout");
    return { ok: "Cliente guardado." };
  }

  const { data, error } = await db()
    .from("clientes")
    .insert({ ...datos, creado_por: sesion.usuarioId })
    .select("id")
    .single();
  if (error) return { error: `No se pudo crear el cliente: ${error.message}` };

  revalidatePath("/panel/clientes", "layout");
  const volverA = texto(formData, "volver_a");
  if (volverA.startsWith("/")) redirect(`${volverA}${volverA.includes("?") ? "&" : "?"}cliente=${data.id}`);
  redirect(`/panel/clientes/${data.id}?creado=1`);
}

export async function alternarCliente(formData: FormData) {
  await requerirTaller();
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  if (!Number.isInteger(id) || id <= 0) return;
  await db().from("clientes").update({ activo: !activo }).eq("id", id);
  revalidatePath("/panel/clientes", "layout");
}

/**
 * Alta rápida desde el asistente de recepción. Devuelve el cliente creado
 * para seleccionarlo sin salir del asistente.
 */
export async function crearClienteRapido(
  datos: { nombre: string; telefono?: string; correo?: string },
): Promise<{ ok: true; cliente: { id: number; nombre: string; telefono: string | null } } | { ok: false; error: string }> {
  const sesion = await requerirTaller();
  const r = EsquemaCliente.safeParse({
    id: "",
    nombre: datos.nombre ?? "",
    telefono: datos.telefono ?? "",
    correo: datos.correo ?? "",
    direccion: "",
    notas: "",
  });
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Datos inválidos." };
  const { id: _id, ...valores } = r.data;
  void _id;
  const { data, error } = await db()
    .from("clientes")
    .insert({ ...valores, creado_por: sesion.usuarioId })
    .select("id, nombre, telefono")
    .single();
  if (error) return { ok: false, error: `No se pudo crear el cliente: ${error.message}` };
  revalidatePath("/panel/clientes");
  return { ok: true, cliente: data };
}

/** Búsqueda para el asistente (acción llamable desde el cliente). */
export async function buscarClientesAccion(texto: string) {
  await requerirTaller();
  const { buscarClientes } = await import("@/lib/datos/clientes");
  const filas = await buscarClientes(texto, 8);
  return filas.map((c) => ({ id: c.id, nombre: c.nombre, telefono: c.telefono, correo: c.correo }));
}
