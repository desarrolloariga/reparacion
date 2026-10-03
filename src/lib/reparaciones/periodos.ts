import { esFechaISO, sumarDiasNaturales, type FechaISO } from "./dias-habiles";

/** Rangos de fechas para los reportes, en fechas de calendario de Guatemala. */

export const CLAVES_PERIODO = ["mes", "mes_anterior", "trimestre", "anio", "30d", "90d", "todo"] as const;
export type ClavePeriodo = (typeof CLAVES_PERIODO)[number];

export const ETIQUETA_PERIODO: Record<ClavePeriodo, string> = {
  mes: "Este mes",
  mes_anterior: "Mes anterior",
  trimestre: "Este trimestre",
  anio: "Este año",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  todo: "Todo",
};

export type Rango = { desde: FechaISO; hasta: FechaISO };

function ultimoDiaDelMes(anio: number, mes1a12: number): FechaISO {
  const d = new Date(Date.UTC(anio, mes1a12, 0, 12));
  return d.toISOString().slice(0, 10);
}

export function rangoPredefinido(clave: ClavePeriodo, hoy: FechaISO): Rango {
  const [a, m] = hoy.split("-").map(Number);
  switch (clave) {
    case "mes":
      return { desde: `${a}-${String(m).padStart(2, "0")}-01`, hasta: hoy };
    case "mes_anterior": {
      const am = m === 1 ? a - 1 : a;
      const mm = m === 1 ? 12 : m - 1;
      return { desde: `${am}-${String(mm).padStart(2, "0")}-01`, hasta: ultimoDiaDelMes(am, mm) };
    }
    case "trimestre": {
      const inicio = Math.floor((m - 1) / 3) * 3 + 1;
      return { desde: `${a}-${String(inicio).padStart(2, "0")}-01`, hasta: hoy };
    }
    case "anio":
      return { desde: `${a}-01-01`, hasta: hoy };
    case "30d":
      return { desde: sumarDiasNaturales(hoy, -29), hasta: hoy };
    case "90d":
      return { desde: sumarDiasNaturales(hoy, -89), hasta: hoy };
    case "todo":
      return { desde: "2000-01-01", hasta: hoy };
  }
}

/**
 * Lee el rango de los parámetros de la URL: `periodo=<clave>` o
 * `desde`/`hasta` explícitos. Sin nada, este mes.
 */
export function leerRango(params: Record<string, string | string[] | undefined>, hoy: FechaISO): Rango & { clave: ClavePeriodo | "personalizado" } {
  const desde = typeof params.desde === "string" ? params.desde : "";
  const hasta = typeof params.hasta === "string" ? params.hasta : "";
  if (esFechaISO(desde) && esFechaISO(hasta) && desde <= hasta) return { desde, hasta, clave: "personalizado" };
  const clave = typeof params.periodo === "string" && (CLAVES_PERIODO as readonly string[]).includes(params.periodo) ? (params.periodo as ClavePeriodo) : "mes";
  return { ...rangoPredefinido(clave, hoy), clave };
}
