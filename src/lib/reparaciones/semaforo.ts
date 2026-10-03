/**
 * Semáforo de una fecha de control.
 *
 * Se calcula contra días hábiles restantes (ver dias-habiles.ts). La regla
 * de contra qué fecha se mide —compromiso del joyero o promesa al cliente—
 * vive en `estados.ts` (Fase 2+); aquí solo se colorea.
 */

export type Semaforo = "a_tiempo" | "por_vencer" | "vencido";

export const ETIQUETA_SEMAFORO: Record<Semaforo, string> = {
  a_tiempo: "A tiempo",
  por_vencer: "Por vencer",
  vencido: "Vencido",
};

/** Clases de Tailwind por color, para chips y puntos. */
export const CLASE_SEMAFORO: Record<Semaforo, string> = {
  a_tiempo: "bg-sage/14 text-sage",
  por_vencer: "bg-gold/18 text-gold-deep",
  vencido: "bg-clay/12 text-clay",
};

export const PUNTO_SEMAFORO: Record<Semaforo, string> = {
  a_tiempo: "bg-sage",
  por_vencer: "bg-gold",
  vencido: "bg-clay",
};

/**
 * `diasRestantes` = días hábiles entre hoy y la fecha de control.
 * `umbral` = parámetro `umbral_por_vencer_dias`.
 */
export function semaforo(diasRestantes: number, umbral: number): Semaforo {
  if (diasRestantes < 0) return "vencido";
  if (diasRestantes <= umbral) return "por_vencer";
  return "a_tiempo";
}

/** Texto corto para listados: "vence en 3 días", "vence hoy", "3 días de atraso". */
export function describirRestantes(diasRestantes: number): string {
  if (diasRestantes < 0) {
    const n = -diasRestantes;
    return n === 1 ? "1 día de atraso" : `${n} días de atraso`;
  }
  if (diasRestantes === 0) return "vence hoy";
  return diasRestantes === 1 ? "vence mañana hábil" : `vence en ${diasRestantes} días`;
}
