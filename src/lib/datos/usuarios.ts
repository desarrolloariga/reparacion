import "server-only";

import { db } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/supabase/modelo";

/** Cuentas del sistema. */

export type UsuarioListado = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  ultimo_acceso: string | null;
  creado_en: string;
  /** Nombre del joyero enlazado, si la cuenta es de un joyero. */
  joyero: string | null;
};

export async function listarUsuarios(): Promise<UsuarioListado[]> {
  const { data, error } = await db()
    .from("usuarios")
    .select("id, nombre, correo, telefono, rol, activo, ultimo_acceso, creado_en, joyeros!joyeros_usuario_id_fkey(nombre)")
    .order("activo", { ascending: false })
    .order("nombre");

  if (error) throw new Error(`No se pudieron leer los usuarios: ${error.message}`);

  return (data ?? []).map((u) => {
    const joyero = Array.isArray(u.joyeros) ? u.joyeros[0] : u.joyeros;
    return {
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol,
      activo: u.activo,
      ultimo_acceso: u.ultimo_acceso,
      creado_en: u.creado_en,
      joyero: joyero?.nombre ?? null,
    };
  });
}

export async function usuarioPorId(id: number) {
  const { data, error } = await db()
    .from("usuarios")
    .select("id, nombre, correo, rol, activo")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Cuentas con rol joyero que todavía no están enlazadas a ningún joyero,
 * más la del joyero indicado (para que el selector de su ficha la muestre).
 */
export async function usuariosJoyeroDisponibles(joyeroId?: number) {
  const [cuentas, enlazados] = await Promise.all([
    db()
      .from("usuarios")
      .select("id, nombre, correo")
      .eq("rol", "joyero")
      .eq("activo", true)
      .order("nombre"),
    db().from("joyeros").select("id, usuario_id").not("usuario_id", "is", null),
  ]);

  if (cuentas.error) throw new Error(cuentas.error.message);
  if (enlazados.error) throw new Error(enlazados.error.message);

  const ocupados = new Set(
    (enlazados.data ?? [])
      .filter((j) => j.id !== joyeroId)
      .map((j) => j.usuario_id),
  );

  return (cuentas.data ?? []).filter((u) => !ocupados.has(u.id));
}
