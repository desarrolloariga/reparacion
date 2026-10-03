import "server-only";

import { cache } from "react";

import {
  crearCalendario,
  esDiaHabil,
  sumarDiasNaturales,
  type Calendario,
  type FechaISO,
} from "@/lib/reparaciones/dias-habiles";
import { db } from "@/lib/supabase/server";
import type { DiaCalendario } from "@/lib/supabase/modelo";

import { leerParametros } from "./parametros";

/** Excepciones del calendario, opcionalmente de un año. */
export async function listarExcepciones(anio?: number): Promise<DiaCalendario[]> {
  let consulta = db().from("calendario_laboral").select("*").order("fecha");
  if (anio) consulta = consulta.gte("fecha", `${anio}-01-01`).lte("fecha", `${anio}-12-31`);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo leer el calendario laboral: ${error.message}`);
  return data ?? [];
}

/** Años con excepciones registradas, para el selector de la pantalla. */
export async function aniosConExcepciones(): Promise<number[]> {
  const filas = await listarExcepciones();
  return [...new Set(filas.map((f) => Number(f.fecha.slice(0, 4))))].sort();
}

/**
 * El calendario vigente: regla semanal (parámetro) + excepciones (tabla).
 * Es el puente entre la base y el módulo puro `dias-habiles.ts`; toda suma
 * de días del sistema usa este objeto.
 */
export const calendarioVigente = cache(async (): Promise<Calendario> => {
  const [parametros, excepciones] = await Promise.all([leerParametros(), listarExcepciones()]);
  return crearCalendario(
    parametros.dias_semana_habiles,
    excepciones.map((e) => ({ fecha: e.fecha, es_habil: e.es_habil })),
  );
});

/** Próximo día no hábil a partir de una fecha (incluida), con su motivo. */
export async function proximoDiaNoHabil(
  desde: FechaISO,
  calendario: Calendario,
  excepciones?: DiaCalendario[],
): Promise<{ fecha: FechaISO; motivo: string } | null> {
  const lista = excepciones ?? (await listarExcepciones());
  let fecha = desde;
  for (let i = 0; i < 400; i++) {
    if (!esDiaHabil(fecha, calendario)) {
      const excepcion = lista.find((e) => e.fecha === fecha);
      return { fecha, motivo: excepcion?.descripcion ?? "Fin de semana" };
    }
    fecha = sumarDiasNaturales(fecha, 1);
  }
  return null;
}
