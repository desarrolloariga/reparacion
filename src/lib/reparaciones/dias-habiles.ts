/**
 * Aritmética de días hábiles.
 *
 * Módulo puro: sin base de datos, sin date-fns y sin depender de la zona
 * horaria del proceso. Las fechas son de calendario (`YYYY-MM-DD`) y se
 * operan en UTC a mediodía, así que un día es siempre un día, corra donde
 * corra el código.
 *
 * Toda suma o resta de días del sistema pasa por aquí.
 */

/** Fecha de calendario en formato ISO `YYYY-MM-DD`. */
export type FechaISO = string;

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export type DiaSemanaISO = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ExcepcionCalendario = { fecha: FechaISO; es_habil: boolean };

export type Calendario = {
  diasSemanaHabiles: ReadonlySet<DiaSemanaISO>;
  /** Excepciones a la regla semanal: feriados (false) o días abiertos (true). */
  excepciones: ReadonlyMap<FechaISO, boolean>;
};

export const DIAS_SEMANA_ISO: readonly DiaSemanaISO[] = [1, 2, 3, 4, 5, 6, 7];

export const NOMBRE_DIA_SEMANA: Record<DiaSemanaISO, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

/** Cinturón contra bucles: ningún cálculo real recorre tantos días. */
const TOPE_ITERACIONES = 10_000;

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function esFechaISO(valor: unknown): valor is FechaISO {
  if (typeof valor !== "string") return false;
  const m = PATRON_FECHA.exec(valor);
  if (!m) return false;
  const [, a, me, d] = m.map(Number);
  const fecha = new Date(Date.UTC(a, me - 1, d, 12));
  // Ida y vuelta: 2026-02-31 se convierte en marzo y deja de coincidir.
  return (
    fecha.getUTCFullYear() === a &&
    fecha.getUTCMonth() === me - 1 &&
    fecha.getUTCDate() === d
  );
}

function aUTC(fecha: FechaISO): Date {
  if (!esFechaISO(fecha)) throw new RangeError(`Fecha inválida: "${fecha}"`);
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12));
}

function aISO(fecha: Date): FechaISO {
  return fecha.toISOString().slice(0, 10);
}

function desplazar(fecha: Date, dias: number): Date {
  const copia = new Date(fecha.getTime());
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

/** Día de la semana ISO de una fecha. */
export function diaSemanaISO(fecha: FechaISO): DiaSemanaISO {
  const js = aUTC(fecha).getUTCDay(); // 0 = domingo … 6 = sábado
  return (((js + 6) % 7) + 1) as DiaSemanaISO;
}

/**
 * Construye un calendario. Lanza si la regla semanal no deja ningún día
 * hábil y tampoco hay excepciones que abran alguno: con ese calendario
 * cualquier suma sería infinita.
 */
export function crearCalendario(
  diasSemana: readonly DiaSemanaISO[],
  excepciones: readonly ExcepcionCalendario[] = [],
): Calendario {
  const dias = new Set<DiaSemanaISO>();
  for (const d of diasSemana) {
    if (!Number.isInteger(d) || d < 1 || d > 7) {
      throw new RangeError(`Día de la semana inválido: ${d}`);
    }
    dias.add(d);
  }

  const mapa = new Map<FechaISO, boolean>();
  for (const e of excepciones) {
    if (!esFechaISO(e.fecha)) throw new RangeError(`Fecha inválida: "${e.fecha}"`);
    mapa.set(e.fecha, e.es_habil);
  }

  const hayAlgunoAbierto = [...mapa.values()].some(Boolean);
  if (dias.size === 0 && !hayAlgunoAbierto) {
    throw new RangeError("El calendario no tiene ningún día hábil.");
  }

  return { diasSemanaHabiles: dias, excepciones: mapa };
}

/** Lunes a sábado, sin excepciones. */
export const CALENDARIO_POR_DEFECTO: Calendario = crearCalendario([1, 2, 3, 4, 5, 6]);

/**
 * ¿Es hábil esta fecha? La excepción manda: un feriado cierra aunque sea
 * martes y un domingo marcado abierto cuenta aunque la regla lo excluya.
 */
export function esDiaHabil(fecha: FechaISO, calendario: Calendario): boolean {
  const excepcion = calendario.excepciones.get(fecha);
  if (excepcion !== undefined) return excepcion;
  return calendario.diasSemanaHabiles.has(diaSemanaISO(fecha));
}

/**
 * El n-ésimo día hábil estrictamente después de `fecha`. Con n = 0 devuelve
 * la misma fecha, sea hábil o no. Con n < 0 resta.
 */
export function sumarDiasHabiles(
  fecha: FechaISO,
  n: number,
  calendario: Calendario,
): FechaISO {
  if (!Number.isInteger(n)) throw new RangeError(`Cantidad de días inválida: ${n}`);
  let actual = aUTC(fecha);
  if (n === 0) return aISO(actual);

  const paso = n > 0 ? 1 : -1;
  let faltan = Math.abs(n);
  let iteraciones = 0;

  while (faltan > 0) {
    actual = desplazar(actual, paso);
    if (esDiaHabil(aISO(actual), calendario)) faltan -= 1;
    if (++iteraciones > TOPE_ITERACIONES) {
      throw new RangeError("El calendario no permite avanzar: demasiados días no hábiles.");
    }
  }

  return aISO(actual);
}

/** El n-ésimo día hábil estrictamente antes de `fecha`. */
export function restarDiasHabiles(
  fecha: FechaISO,
  n: number,
  calendario: Calendario,
): FechaISO {
  return sumarDiasHabiles(fecha, -n, calendario);
}

/**
 * Días hábiles en el intervalo (desde, hasta]: cuántos días hábiles hay que
 * avanzar desde `desde` para llegar a `hasta`. Negativo si `hasta` es
 * anterior. Invariante: `diasHabilesEntre(f, sumarDiasHabiles(f, n)) === n`.
 */
export function diasHabilesEntre(
  desde: FechaISO,
  hasta: FechaISO,
  calendario: Calendario,
): number {
  const inicio = aUTC(desde);
  const fin = aUTC(hasta);
  if (inicio.getTime() === fin.getTime()) return 0;

  const paso = fin > inicio ? 1 : -1;
  let actual = inicio;
  let cuenta = 0;
  let iteraciones = 0;

  while (actual.getTime() !== fin.getTime()) {
    actual = desplazar(actual, paso);
    if (esDiaHabil(aISO(actual), calendario)) cuenta += 1;
    if (++iteraciones > TOPE_ITERACIONES) {
      throw new RangeError("Intervalo demasiado largo para contar días hábiles.");
    }
  }

  return paso * cuenta;
}

/** La misma fecha si es hábil; si no, el siguiente día hábil. */
export function siguienteDiaHabil(fecha: FechaISO, calendario: Calendario): FechaISO {
  return esDiaHabil(fecha, calendario) ? fecha : sumarDiasHabiles(fecha, 1, calendario);
}

/** Fecha + n días naturales (n puede ser negativo). */
export function sumarDiasNaturales(fecha: FechaISO, n: number): FechaISO {
  return aISO(desplazar(aUTC(fecha), n));
}

/** Días naturales entre dos fechas (hasta − desde), con signo. */
export function diasNaturalesEntre(desde: FechaISO, hasta: FechaISO): number {
  return Math.round((aUTC(hasta).getTime() - aUTC(desde).getTime()) / 86_400_000);
}

/** Hoy como fecha de calendario en una zona horaria (por defecto Guatemala). */
export function hoyISO(zona = "America/Guatemala", ahora = new Date()): FechaISO {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}
