import "server-only";

import { db } from "@/lib/supabase/server";
import type {
  CategoriaTrabajo,
  Complejidad,
  Especialidad,
  TiempoEstandar,
  TipoTrabajo,
} from "@/lib/supabase/modelo";

/** Lecturas de los catálogos del taller. */

// ── Especialidades ───────────────────────────────────────────────────────
export async function listarEspecialidades(soloActivas = false): Promise<Especialidad[]> {
  let consulta = db().from("especialidades").select("*").order("nombre");
  if (soloActivas) consulta = consulta.eq("activo", true);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron leer las especialidades: ${error.message}`);
  return data ?? [];
}

export async function especialidadPorId(id: number) {
  const { data, error } = await db().from("especialidades").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ── Tipos de trabajo ─────────────────────────────────────────────────────
export type TipoTrabajoListado = TipoTrabajo & { especialidad: string | null };

export async function listarTiposTrabajo(opciones: {
  soloActivos?: boolean;
  categoria?: CategoriaTrabajo;
} = {}): Promise<TipoTrabajoListado[]> {
  let consulta = db()
    .from("tipos_trabajo")
    .select("*, especialidades(nombre)")
    .order("categoria")
    .order("nombre");
  if (opciones.soloActivos) consulta = consulta.eq("activo", true);
  if (opciones.categoria) consulta = consulta.eq("categoria", opciones.categoria);

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron leer los tipos de trabajo: ${error.message}`);

  return (data ?? []).map(({ especialidades, ...t }) => {
    const e = Array.isArray(especialidades) ? especialidades[0] : especialidades;
    return { ...t, especialidad: e?.nombre ?? null };
  });
}

export async function tipoTrabajoPorId(id: number) {
  const { data, error } = await db().from("tipos_trabajo").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ── Complejidades ────────────────────────────────────────────────────────
export async function listarComplejidades(): Promise<Complejidad[]> {
  const { data, error } = await db().from("complejidades").select("*").order("orden");
  if (error) throw new Error(`No se pudieron leer las complejidades: ${error.message}`);
  return data ?? [];
}

// ── Tiempos estándar ─────────────────────────────────────────────────────
export async function listarTiemposEstandar(): Promise<TiempoEstandar[]> {
  const { data, error } = await db().from("tiempos_estandar").select("*");
  if (error) throw new Error(`No se pudieron leer los tiempos estándar: ${error.message}`);
  return data ?? [];
}

/** Clave de una celda de la matriz. */
export const claveMatriz = (tipoId: number, complejidadId: number) => `${tipoId}:${complejidadId}`;

export type MatrizTiempos = ReadonlyMap<string, number>;

/** La matriz completa como mapa `tipo:complejidad → días hábiles`. */
export async function matrizTiempos(): Promise<MatrizTiempos> {
  const filas = await listarTiemposEstandar();
  return new Map(filas.map((f) => [claveMatriz(f.tipo_trabajo_id, f.complejidad_id), f.dias_habiles]));
}

/** Combinaciones activas que todavía no tienen tiempo definido. */
export async function combinacionesSinTiempo(): Promise<
  { tipo: TipoTrabajoListado; complejidad: Complejidad }[]
> {
  const [tipos, complejidades, matriz] = await Promise.all([
    listarTiposTrabajo({ soloActivos: true }),
    listarComplejidades(),
    matrizTiempos(),
  ]);
  const faltantes: { tipo: TipoTrabajoListado; complejidad: Complejidad }[] = [];
  for (const tipo of tipos) {
    for (const complejidad of complejidades) {
      if (!matriz.has(claveMatriz(tipo.id, complejidad.id))) faltantes.push({ tipo, complejidad });
    }
  }
  return faltantes;
}
