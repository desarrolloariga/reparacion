import "server-only";

import { cache } from "react";

import { analizarParametros, type Parametros } from "@/lib/reparaciones/parametros";
import { db } from "@/lib/supabase/server";
import type { Parametro } from "@/lib/supabase/modelo";

/** Filas crudas, para la pantalla de administración. */
export async function listarParametros(): Promise<Parametro[]> {
  const { data, error } = await db().from("parametros").select("*").order("grupo").order("clave");
  if (error) throw new Error(`No se pudieron leer los parámetros: ${error.message}`);
  return data ?? [];
}

/**
 * Parámetros tipados. Una lectura por request aunque lo pidan varias
 * funciones: `cache()` deduplica dentro del mismo render.
 */
export const leerParametros = cache(async (): Promise<Parametros> => {
  const filas = await listarParametros();
  const mapa: Record<string, string> = {};
  for (const f of filas) mapa[f.clave] = f.valor;
  return analizarParametros(mapa);
});
