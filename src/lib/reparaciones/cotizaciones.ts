import type { FechaISO } from "./dias-habiles";

/**
 * Totales y margen de una cotización. Mismo cálculo que
 * `joyeria.fn_recalcular_cotizacion`; aquí se usa para mostrar el margen en
 * vivo mientras se escribe, antes de guardar.
 */

export type LineaCotizacion = {
  cantidad: number;
  precio_unitario: number;
  costo_joyero: number;
};

export type TotalesCotizacion = {
  total_cliente: number;
  total_costo_joyero: number;
  utilidad_estimada: number;
  /** Porcentaje sobre el total al cliente; null si el total es cero. */
  margen_estimado: number | null;
};

/** Umbral por debajo del cual el margen se pinta en rojo. No bloquea. */
export const UMBRAL_MARGEN = 25;

export const redondear2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcularTotales(lineas: readonly LineaCotizacion[]): TotalesCotizacion {
  let total_cliente = 0;
  let total_costo_joyero = 0;
  for (const l of lineas) {
    const cantidad = Number.isFinite(l.cantidad) && l.cantidad > 0 ? l.cantidad : 0;
    total_cliente += cantidad * (Number.isFinite(l.precio_unitario) ? l.precio_unitario : 0);
    total_costo_joyero += cantidad * (Number.isFinite(l.costo_joyero) ? l.costo_joyero : 0);
  }
  total_cliente = redondear2(total_cliente);
  total_costo_joyero = redondear2(total_costo_joyero);
  const utilidad_estimada = redondear2(total_cliente - total_costo_joyero);
  const margen_estimado = total_cliente > 0 ? redondear2((utilidad_estimada / total_cliente) * 100) : null;
  return { total_cliente, total_costo_joyero, utilidad_estimada, margen_estimado };
}

export function margenBajo(margen: number | null, umbral = UMBRAL_MARGEN) {
  return margen !== null && margen < umbral;
}

export type EstadoCotizacion = "borrador" | "enviada" | "aprobada" | "rechazada" | "vencida" | "reemplazada";

/**
 * Estado tal como debe verse hoy: una enviada cuya validez ya pasó se muestra
 * vencida aunque el job diario todavía no la haya marcado.
 */
export function estadoEfectivo(
  cotizacion: { estado: EstadoCotizacion; valido_hasta: FechaISO | null },
  hoy: FechaISO,
): EstadoCotizacion {
  if (cotizacion.estado === "enviada" && cotizacion.valido_hasta && cotizacion.valido_hasta < hoy) {
    return "vencida";
  }
  return cotizacion.estado;
}

export const ETIQUETA_COTIZACION: Record<EstadoCotizacion, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  vencida: "Vencida",
  reemplazada: "Reemplazada",
};

export const TONO_COTIZACION: Record<EstadoCotizacion, "neutro" | "oro" | "exito" | "error" | "oscuro" | "tenue"> = {
  borrador: "neutro",
  enviada: "oro",
  aprobada: "exito",
  rechazada: "error",
  vencida: "error",
  reemplazada: "tenue",
};
