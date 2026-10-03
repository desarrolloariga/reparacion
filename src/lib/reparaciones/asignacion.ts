import {
  diasHabilesEntre,
  restarDiasHabiles,
  sumarDiasHabiles,
  type Calendario,
  type FechaISO,
} from "./dias-habiles";

/**
 * Reglas de asignación a joyeros (sección 5.3 y 7.1 del documento).
 *
 *   fecha_compromiso_sugerida = sumarDiasHabiles(fecha_asignacion, dias_estimados)
 *   tope                      = restarDiasHabiles(fecha_prometida_cliente, holgura_joyero_dias)
 *
 * Si la sugerida supera el tope se advierte; no se bloquea.
 */

export function fechaCompromisoSugerida(fechaAsignacion: FechaISO, diasEstimados: number, calendario: Calendario): FechaISO {
  return sumarDiasHabiles(fechaAsignacion, Math.max(0, diasEstimados), calendario);
}

export function topeJoyero(fechaPrometida: FechaISO, holguraJoyeroDias: number, calendario: Calendario): FechaISO {
  return restarDiasHabiles(fechaPrometida, Math.max(0, holguraJoyeroDias), calendario);
}

export function excedeTope(fechaCompromiso: FechaISO, tope: FechaISO): boolean {
  return fechaCompromiso > tope;
}

/** Días hábiles reales y desviación contra lo estimado (positivo = tardó más). */
export function desviacion(
  fechaAsignacion: FechaISO,
  fechaTerminado: FechaISO,
  diasEstimados: number,
  calendario: Calendario,
): { dias_reales: number; desviacion_dias: number } {
  const dias_reales = Math.max(0, diasHabilesEntre(fechaAsignacion, fechaTerminado, calendario));
  return { dias_reales, desviacion_dias: dias_reales - diasEstimados };
}

export type Candidato = {
  id: number;
  nombre: string;
  activo: boolean;
  capacidad_maxima: number;
  especialidades: number[];
  activas: number;
  terminadas: number;
  a_tiempo: number;
  retrabajos: number;
};

export type CandidatoEvaluado = Candidato & {
  coincidencias: number;
  cumplimiento_pct: number | null;
  retrabajo_pct: number | null;
  capacidad_llena: boolean;
};

/**
 * Ordena joyeros para el diálogo de asignación: primero los que cubren más
 * especialidades de la orden; a igualdad, menos carga, mejor cumplimiento y
 * menos retrabajo.
 */
export function ordenarCandidatos(joyeros: readonly Candidato[], especialidadesOrden: readonly number[]): CandidatoEvaluado[] {
  const requeridas = new Set(especialidadesOrden);
  return joyeros
    .filter((j) => j.activo)
    .map((j) => {
      const coincidencias = j.especialidades.filter((e) => requeridas.has(e)).length;
      const cumplimiento_pct = j.terminadas > 0 ? Math.round((j.a_tiempo / j.terminadas) * 1000) / 10 : null;
      const retrabajo_pct = j.terminadas > 0 ? Math.round((j.retrabajos / j.terminadas) * 1000) / 10 : null;
      return { ...j, coincidencias, cumplimiento_pct, retrabajo_pct, capacidad_llena: j.activas >= j.capacidad_maxima };
    })
    .sort(
      (a, b) =>
        b.coincidencias - a.coincidencias ||
        Number(a.capacidad_llena) - Number(b.capacidad_llena) ||
        a.activas - b.activas ||
        (b.cumplimiento_pct ?? -1) - (a.cumplimiento_pct ?? -1) ||
        (a.retrabajo_pct ?? 101) - (b.retrabajo_pct ?? 101) ||
        a.nombre.localeCompare(b.nombre, "es"),
    );
}

export type Tarifa = { tipo_trabajo_id: number; complejidad_id: number | null; costo_acordado: number };

/** Tarifa específica (tipo + complejidad) sobre la general (tipo, «todas»). */
export function costoDeLinea(tarifas: readonly Tarifa[], tipoId: number, complejidadId: number): number | null {
  const especifica = tarifas.find((t) => t.tipo_trabajo_id === tipoId && t.complejidad_id === complejidadId);
  if (especifica) return Number(especifica.costo_acordado);
  const general = tarifas.find((t) => t.tipo_trabajo_id === tipoId && t.complejidad_id === null);
  return general ? Number(general.costo_acordado) : null;
}

/**
 * Costo sugerido para una orden: suma de las tarifas por línea × cantidad.
 * Devuelve también qué líneas no tienen tarifa, para avisar.
 */
export function costoSugerido(
  tarifas: readonly Tarifa[],
  lineas: readonly { tipo_trabajo_id: number; complejidad_id: number; cantidad: number }[],
): { total: number | null; sinTarifa: number } {
  let total = 0;
  let sinTarifa = 0;
  for (const l of lineas) {
    const c = costoDeLinea(tarifas, l.tipo_trabajo_id, l.complejidad_id);
    if (c === null) sinTarifa += 1;
    else total += c * l.cantidad;
  }
  if (sinTarifa === lineas.length) return { total: null, sinTarifa };
  return { total: Math.round(total * 100) / 100, sinTarifa };
}
