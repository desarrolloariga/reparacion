import {
  diasHabilesEntre,
  sumarDiasHabiles,
  type Calendario,
  type FechaISO,
} from "./dias-habiles";

/**
 * Cálculo automático de tiempos y fechas de una orden.
 *
 * Reglas (sección 5 del documento):
 *   dias_estimados          = Σ días hábiles de la matriz por cada línea (suma, no máximo)
 *   fecha_estimada_entrega  = sumarDiasHabiles(base, dias_estimados)
 *   fecha_prometida_cliente = sumarDiasHabiles(fecha_estimada_entrega, holgura_cliente_dias)
 *
 * Si falta una combinación en la matriz se bloquea con la lista de lo que
 * falta: nunca se asume un valor.
 */

export type LineaTrabajo = {
  tipo_trabajo_id: number;
  complejidad_id: number;
};

export type Combinacion = { tipo_trabajo_id: number; complejidad_id: number };

export const claveCombinacion = (tipoId: number, complejidadId: number) => `${tipoId}:${complejidadId}`;

export class FaltaTiempoEstandar extends Error {
  readonly faltantes: Combinacion[];

  constructor(faltantes: Combinacion[], describir?: (c: Combinacion) => string) {
    const lista = faltantes.map(describir ?? ((c) => `tipo ${c.tipo_trabajo_id} × complejidad ${c.complejidad_id}`));
    super(
      `Falta parametrizar el tiempo estándar de: ${lista.join("; ")}. Defínelo en Catálogos → Tiempos estándar.`,
    );
    this.name = "FaltaTiempoEstandar";
    this.faltantes = faltantes;
  }
}

/** Días de cada línea según la matriz; lanza si alguna combinación falta. */
export function diasPorLinea(
  lineas: readonly LineaTrabajo[],
  matriz: ReadonlyMap<string, number>,
  describir?: (c: Combinacion) => string,
): number[] {
  const faltantes: Combinacion[] = [];
  const vistos = new Set<string>();
  const dias: number[] = [];

  for (const l of lineas) {
    const clave = claveCombinacion(l.tipo_trabajo_id, l.complejidad_id);
    const d = matriz.get(clave);
    if (d === undefined) {
      if (!vistos.has(clave)) {
        vistos.add(clave);
        faltantes.push({ tipo_trabajo_id: l.tipo_trabajo_id, complejidad_id: l.complejidad_id });
      }
      dias.push(0);
    } else {
      dias.push(d);
    }
  }

  if (faltantes.length > 0) throw new FaltaTiempoEstandar(faltantes, describir);
  return dias;
}

/** Suma de días hábiles de todas las líneas. */
export function diasEstimadosOrden(
  lineas: readonly LineaTrabajo[],
  matriz: ReadonlyMap<string, number>,
  describir?: (c: Combinacion) => string,
): number {
  return diasPorLinea(lineas, matriz, describir).reduce((s, d) => s + d, 0);
}

export type FechasOrden = {
  fecha_estimada_entrega: FechaISO;
  fecha_prometida_cliente: FechaISO;
};

/**
 * Fechas derivadas a partir de una fecha base (la de recepción al recibir;
 * la de aprobación al aprobar la cotización, porque el joyero no puede
 * empezar antes).
 */
export function fechasDeOrden(
  base: FechaISO,
  diasEstimados: number,
  parametros: { holgura_cliente_dias: number },
  calendario: Calendario,
): FechasOrden {
  const fecha_estimada_entrega = sumarDiasHabiles(base, diasEstimados, calendario);
  const fecha_prometida_cliente = sumarDiasHabiles(
    fecha_estimada_entrega,
    parametros.holgura_cliente_dias,
    calendario,
  );
  return { fecha_estimada_entrega, fecha_prometida_cliente };
}

/**
 * Recalcula respetando una fecha prometida fijada a mano: devuelve la
 * estimada nueva y conserva la prometida manual.
 */
export function recalcularRespetandoManual(
  base: FechaISO,
  diasEstimados: number,
  parametros: { holgura_cliente_dias: number },
  calendario: Calendario,
  actual: { fecha_prometida_cliente: FechaISO | null; fecha_prometida_manual: boolean },
): FechasOrden {
  const nuevas = fechasDeOrden(base, diasEstimados, parametros, calendario);
  if (actual.fecha_prometida_manual && actual.fecha_prometida_cliente) {
    return { ...nuevas, fecha_prometida_cliente: actual.fecha_prometida_cliente };
  }
  return nuevas;
}

/** Días hábiles que quedan hasta la fecha de control (negativo = atraso). */
export function diasRestantes(hoy: FechaISO, fechaControl: FechaISO, calendario: Calendario): number {
  return diasHabilesEntre(hoy, fechaControl, calendario);
}
