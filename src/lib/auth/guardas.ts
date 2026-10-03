import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { RolUsuario } from "@/lib/supabase/modelo";

import { hayCookieDeSesion, leerSesion, type SesionActiva } from "./sesion";

/**
 * La sesión se resuelve una sola vez por request aunque el layout y varias
 * páginas la pidan: `cache()` deduplica la consulta dentro del mismo render.
 */
const obtenerSesion = cache(leerSesion);

/**
 * Guardas de autorización.
 *
 * Sin Supabase Auth no hay `auth.uid()`, así que RLS no puede decidir quién
 * ve qué: **esta es la única frontera de autorización de la aplicación**.
 * Toda página, Server Action y Route Handler que toque datos debe empezar
 * llamando a una de estas funciones.
 */

/** Exige sesión válida. Redirige a /login si no la hay. */
export async function requerirSesion(destino?: string): Promise<SesionActiva> {
  const sesion = await obtenerSesion();
  if (sesion) return sesion;

  const parametros = new URLSearchParams();
  if (destino) parametros.set("redirect", destino);

  // Traer cookie pero no sesión significa que caducó o se revocó. Merece un
  // mensaje distinto al de quien simplemente no ha entrado nunca.
  if (await hayCookieDeSesion()) parametros.set("expirada", "1");

  const cadena = parametros.toString();
  redirect(`/login${cadena ? `?${cadena}` : ""}`);
}

/**
 * Exige uno de los roles indicados. Quien no lo tiene va a su inicio, no a
 * una pantalla vacía ni a un error.
 */
export async function requerirRol(...roles: RolUsuario[]): Promise<SesionActiva> {
  const sesion = await requerirSesion();
  if (!roles.includes(sesion.rol)) redirect(inicioDe(sesion));
  return sesion;
}

/** Solo administración: catálogos, parámetros, cuentas. */
export const requerirAdmin = () => requerirRol("admin");

/** Quien opera el taller: toda mutación de la operación. */
export const requerirTaller = () => requerirRol("admin", "taller");

/** Páginas que gerencia también puede ver (solo lectura). */
export const requerirLectura = () => requerirRol("admin", "taller", "gerencia");

/**
 * Datos y acciones del portal del joyero: exige rol joyero Y cuenta enlazada
 * a un joyero. La página de inicio del joyero usa `requerirRol("joyero")` y
 * explica ella misma el caso «sin enlazar», para no entrar en bucle con el
 * acceso.
 */
export async function requerirJoyero(): Promise<SesionActiva & { joyeroId: number }> {
  const sesion = await requerirRol("joyero");
  if (sesion.joyeroId === null) redirect("/panel/mis-trabajos");
  return { ...sesion, joyeroId: sesion.joyeroId };
}

/**
 * Variante para Server Actions y Route Handlers, donde `redirect()` no
 * siempre es la respuesta correcta: devuelve `null` en vez de navegar.
 */
export async function sesionOpcional(): Promise<SesionActiva | null> {
  return obtenerSesion();
}

export function esAdmin(sesion: SesionActiva) {
  return sesion.rol === "admin";
}

/** Gerencia ve, pero no toca: las páginas ocultan formularios y botones. */
export function soloLectura(sesion: SesionActiva) {
  return sesion.rol === "gerencia";
}

/** Dónde empieza cada rol al entrar. */
export function inicioDe(sesion: Pick<SesionActiva, "rol">) {
  return sesion.rol === "joyero" ? "/panel/mis-trabajos" : "/panel";
}
