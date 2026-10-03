import "server-only";

import { db } from "@/lib/supabase/server";
import type { Joyero, TarifaJoyero } from "@/lib/supabase/modelo";

/** Lecturas de joyeros, sus especialidades y sus tarifas. */

export type JoyeroListado = Joyero & {
  especialidades: { id: number; nombre: string }[];
  tarifas_activas: number;
  usuario: { id: number; nombre: string; correo: string } | null;
};

function normalizar(fila: {
  joyeros_especialidades: { especialidades: { id: number; nombre: string } | { id: number; nombre: string }[] | null }[] | null;
  usuarios: { id: number; nombre: string; correo: string } | { id: number; nombre: string; correo: string }[] | null;
}) {
  const especialidades = (fila.joyeros_especialidades ?? [])
    .map((je) => (Array.isArray(je.especialidades) ? je.especialidades[0] : je.especialidades))
    .filter((e): e is { id: number; nombre: string } => Boolean(e))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const usuario = Array.isArray(fila.usuarios) ? (fila.usuarios[0] ?? null) : fila.usuarios;
  return { especialidades, usuario };
}

export async function listarJoyeros(soloActivos = false): Promise<JoyeroListado[]> {
  let consulta = db()
    .from("joyeros")
    .select(
      "*, joyeros_especialidades(especialidades(id, nombre)), usuarios!joyeros_usuario_id_fkey(id, nombre, correo), tarifas_joyero(id, activo)",
    )
    .order("activo", { ascending: false })
    .order("nombre");
  if (soloActivos) consulta = consulta.eq("activo", true);

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron leer los joyeros: ${error.message}`);

  return (data ?? []).map(({ joyeros_especialidades, usuarios, tarifas_joyero, ...j }) => ({
    ...j,
    ...normalizar({ joyeros_especialidades, usuarios }),
    tarifas_activas: (tarifas_joyero ?? []).filter((t) => t.activo).length,
  }));
}

export type TarifaListada = TarifaJoyero & {
  tipo_trabajo: string;
  complejidad: string | null;
};

export type JoyeroFicha = Joyero & {
  especialidades: { id: number; nombre: string }[];
  usuario: { id: number; nombre: string; correo: string } | null;
  tarifas: TarifaListada[];
};

export async function joyeroPorId(id: number): Promise<JoyeroFicha | null> {
  const [joyero, tarifas] = await Promise.all([
    db()
      .from("joyeros")
      .select("*, joyeros_especialidades(especialidades(id, nombre)), usuarios!joyeros_usuario_id_fkey(id, nombre, correo)")
      .eq("id", id)
      .maybeSingle(),
    db()
      .from("tarifas_joyero")
      .select("*, tipos_trabajo(nombre), complejidades(nombre)")
      .eq("joyero_id", id)
      .order("activo", { ascending: false })
      .order("vigente_desde", { ascending: false }),
  ]);

  if (joyero.error) throw new Error(`No se pudo leer el joyero: ${joyero.error.message}`);
  if (tarifas.error) throw new Error(`No se pudieron leer las tarifas: ${tarifas.error.message}`);
  if (!joyero.data) return null;

  const { joyeros_especialidades, usuarios, ...j } = joyero.data;

  return {
    ...j,
    ...normalizar({ joyeros_especialidades, usuarios }),
    tarifas: (tarifas.data ?? []).map(({ tipos_trabajo, complejidades, ...t }) => {
      const tipo = Array.isArray(tipos_trabajo) ? tipos_trabajo[0] : tipos_trabajo;
      const complejidad = Array.isArray(complejidades) ? complejidades[0] : complejidades;
      return { ...t, tipo_trabajo: tipo?.nombre ?? "—", complejidad: complejidad?.nombre ?? null };
    }),
  };
}

/** Tarifas activas de un joyero, para proponer costos al asignar (Fase 3). */
export async function tarifasActivasDe(joyeroId: number): Promise<TarifaJoyero[]> {
  const { data, error } = await db()
    .from("tarifas_joyero")
    .select("*")
    .eq("joyero_id", joyeroId)
    .eq("activo", true);
  if (error) throw new Error(error.message);
  return data ?? [];
}
