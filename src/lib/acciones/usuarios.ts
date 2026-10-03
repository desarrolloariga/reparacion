"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requerirAdmin } from "@/lib/auth/guardas";
import {
  generarContrasena,
  hashearContrasena,
  revisarFortaleza,
} from "@/lib/auth/contrasena";
import {
  esIdentificadorValido,
  MENSAJE_IDENTIFICADOR,
  normalizarIdentificador,
} from "@/lib/auth/identificador";
import { revocarSesionesDe } from "@/lib/auth/sesion";
import { ROLES } from "@/lib/supabase/modelo";
import { db } from "@/lib/supabase/server";

/** Alta y mantenimiento de cuentas. Solo administradores. */

const EsquemaUsuario = z.object({
  nombre: z.string().trim().min(3, "Escribe el nombre completo.").max(120),
  correo: z
    .string()
    .transform(normalizarIdentificador)
    .refine(esIdentificadorValido, MENSAJE_IDENTIFICADOR),
  telefono: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v === "" ? null : v)),
  rol: z.enum(ROLES, "Rol inválido."),
  clave: z.string(),
});

export type EstadoUsuario = {
  error?: string;
  campos?: Record<string, string>;
  /** Se muestra una sola vez: no queda guardada en ningún sitio en claro. */
  credencial?: { nombre: string; correo: string; clave: string };
} | null;

export async function crearUsuario(
  _previo: EstadoUsuario,
  formData: FormData,
): Promise<EstadoUsuario> {
  await requerirAdmin();

  const r = EsquemaUsuario.safeParse({
    nombre: formData.get("nombre") ?? "",
    correo: formData.get("correo") ?? "",
    telefono: formData.get("telefono") ?? "",
    rol: formData.get("rol") ?? "taller",
    clave: String(formData.get("clave") ?? ""),
  });

  if (!r.success) {
    const campos: Record<string, string> = {};
    for (const i of r.error.issues) {
      const c = String(i.path[0] ?? "");
      if (c && !campos[c]) campos[c] = i.message;
    }
    return { error: r.error.issues[0]?.message ?? "Revisa los datos.", campos };
  }

  const d = r.data;
  const generada = d.clave.trim() === "";
  const clave = generada ? generarContrasena() : d.clave.trim();

  if (!generada) {
    const problema = revisarFortaleza(clave);
    if (problema) return { error: problema, campos: { clave: problema } };
  }

  const { data: creado, error } = await db()
    .from("usuarios")
    .insert({
      nombre: d.nombre,
      correo: d.correo,
      telefono: d.telefono,
      rol: d.rol,
      contrasena_hash: await hashearContrasena(clave),
    })
    .select("id, nombre, correo")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: `Ya existe una cuenta con el acceso "${d.correo}".`,
        campos: { correo: "Acceso ocupado" },
      };
    }
    return { error: `No se pudo crear la cuenta: ${error.message}` };
  }

  revalidatePath("/panel/usuarios");
  revalidatePath("/panel/joyeros");

  return { credencial: { nombre: creado.nombre, correo: creado.correo, clave } };
}

/**
 * Activa o desactiva una cuenta. Al desactivarla se revocan sus sesiones:
 * de lo contrario seguiría dentro hasta que caducara la cookie.
 */
export async function alternarUsuario(formData: FormData) {
  const sesion = await requerirAdmin();

  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  if (!Number.isInteger(id) || id <= 0) return;

  // Desactivarse a uno mismo dejaría el panel sin acceso.
  if (id === sesion.usuarioId) return;

  await db().from("usuarios").update({ activo: !activo }).eq("id", id);
  if (activo) await revocarSesionesDe(id);

  revalidatePath("/panel/usuarios");
}

export type EstadoClave = {
  error?: string;
  credencial?: { nombre: string; correo: string; clave: string };
} | null;

/**
 * Restablece la contraseña y devuelve la nueva una sola vez.
 * No hay correo de recuperación: el administrador se la entrega en persona.
 */
export async function restablecerClave(
  _previo: EstadoClave,
  formData: FormData,
): Promise<EstadoClave> {
  await requerirAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Cuenta inválida." };

  const clave = generarContrasena();

  const { data, error } = await db()
    .from("usuarios")
    .update({ contrasena_hash: await hashearContrasena(clave) })
    .eq("id", id)
    .select("nombre, correo")
    .single();

  if (error || !data) {
    return { error: `No se pudo restablecer la contraseña: ${error?.message}` };
  }

  // Las sesiones abiertas con la clave anterior dejan de valer.
  await revocarSesionesDe(id);

  revalidatePath("/panel/usuarios");
  return { credencial: { nombre: data.nombre, correo: data.correo, clave } };
}

export type EstadoMiClave = { error?: string; ok?: string } | null;

/** Cambio de la propia contraseña, desde el menú de la cuenta. */
export async function cambiarMiClave(
  _previo: EstadoMiClave,
  formData: FormData,
): Promise<EstadoMiClave> {
  const { requerirSesion } = await import("@/lib/auth/guardas");
  const { verificarContrasena } = await import("@/lib/auth/contrasena");
  const sesion = await requerirSesion();

  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "").trim();
  const repetida = String(formData.get("repetida") ?? "").trim();

  if (nueva !== repetida) return { error: "Las contraseñas nuevas no coinciden." };
  const problema = revisarFortaleza(nueva);
  if (problema) return { error: problema };

  const { data } = await db()
    .from("usuarios")
    .select("contrasena_hash")
    .eq("id", sesion.usuarioId)
    .single();

  if (!data || !(await verificarContrasena(actual, data.contrasena_hash))) {
    return { error: "La contraseña actual no es correcta." };
  }

  const { error } = await db()
    .from("usuarios")
    .update({ contrasena_hash: await hashearContrasena(nueva) })
    .eq("id", sesion.usuarioId);

  if (error) return { error: `No se pudo cambiar la contraseña: ${error.message}` };
  return { ok: "Contraseña actualizada." };
}
