/**
 * Numeración de órdenes: REP-2026-00001 (reparación) y CRE-2026-00001
 * (creación), correlativo anual por prefijo. El número lo emite la base
 * (`fn_siguiente_numero`); aquí solo se formatea y se reconoce.
 */

export type TipoOrden = "reparacion" | "creacion";

export const PREFIJO_ORDEN: Record<TipoOrden, string> = {
  reparacion: "REP",
  creacion: "CRE",
};

const PATRON = /^(REP|CRE)-(\d{4})-(\d{5})$/i;

export function formatearNumero(tipo: TipoOrden, anio: number, correlativo: number) {
  return `${PREFIJO_ORDEN[tipo]}-${anio}-${String(correlativo).padStart(5, "0")}`;
}

export function analizarNumero(texto: string): { tipo: TipoOrden; anio: number; correlativo: number } | null {
  const m = PATRON.exec(texto.trim());
  if (!m) return null;
  return {
    tipo: m[1].toUpperCase() === "REP" ? "reparacion" : "creacion",
    anio: Number(m[2]),
    correlativo: Number(m[3]),
  };
}

export function esNumeroOrden(texto: string) {
  return analizarNumero(texto) !== null;
}

/** Normaliza lo que escribe alguien en el buscador: "rep 2026 12" → "REP-2026-00012". */
export function normalizarNumero(texto: string): string | null {
  const limpio = texto.trim().toUpperCase().replace(/[\s_/.]+/g, "-");
  const m = /^(REP|CRE)-?(\d{4})-?(\d{1,5})$/.exec(limpio);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3].padStart(5, "0")}`;
}
