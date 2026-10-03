import "server-only";

import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { semaforo, type Semaforo } from "@/lib/reparaciones/semaforo";
import { diasRestantes } from "@/lib/reparaciones/tiempos";

import { calendarioVigente } from "./calendario";
import { leerParametros } from "./parametros";

export type EvaluacionSemaforo = {
  semaforo: Semaforo | null;
  dias: number | null;
  fecha: string | null;
};

/**
 * Evalúa el semáforo de varias órdenes con el calendario y el umbral
 * vigentes. Devuelve un mapa id → evaluación; las que no tienen fecha de
 * control (estados terminales) quedan en null.
 */
export async function evaluarSemaforos<T extends { id: number; fecha_control: string | null }>(
  ordenes: readonly T[],
): Promise<Map<number, EvaluacionSemaforo>> {
  const [calendario, parametros] = await Promise.all([calendarioVigente(), leerParametros()]);
  const hoy = hoyISO();
  const mapa = new Map<number, EvaluacionSemaforo>();
  for (const o of ordenes) {
    if (!o.fecha_control) {
      mapa.set(o.id, { semaforo: null, dias: null, fecha: null });
      continue;
    }
    const dias = diasRestantes(hoy, o.fecha_control, calendario);
    mapa.set(o.id, { semaforo: semaforo(dias, parametros.umbral_por_vencer_dias), dias, fecha: o.fecha_control });
  }
  return mapa;
}
