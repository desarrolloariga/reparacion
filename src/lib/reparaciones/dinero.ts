/**
 * Dinero de la orden y de la liquidación, en puro.
 *
 *   cobrado  = Σ pagos
 *   saldo    = precio_cliente − cobrado
 *   costo    = Σ costo_pactado de asignaciones no anuladas
 *   utilidad = precio_cliente − costo
 *   margen   = utilidad / precio_cliente (null si el precio es 0)
 *
 * Es el espejo tipado de `vw_ordenes_economia` y de `fn_generar_liquidacion`:
 * sirve para mostrar cifras en vivo y para previsualizar una liquidación
 * exactamente como la generará la base.
 */

export const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function cobradoDe(pagos: readonly { monto: number | string }[]) {
  return redondear(pagos.reduce((s, p) => s + Number(p.monto), 0));
}

export function saldoOrden(precioCliente: number | string, pagos: readonly { monto: number | string }[]) {
  return redondear(Number(precioCliente) - cobradoDe(pagos));
}

export function costoOrden(asignaciones: readonly { costo_pactado: number | string; estado: string }[]) {
  return redondear(asignaciones.filter((a) => a.estado !== "anulada").reduce((s, a) => s + Number(a.costo_pactado), 0));
}

export function utilidadOrden(precioCliente: number | string, asignaciones: readonly { costo_pactado: number | string; estado: string }[]) {
  return redondear(Number(precioCliente) - costoOrden(asignaciones));
}

export function margenOrden(precioCliente: number | string, costo: number): number | null {
  const precio = Number(precioCliente);
  if (precio <= 0) return null;
  return redondear(((precio - costo) / precio) * 100);
}

// ── Liquidación ──────────────────────────────────────────────────────────

/** Estados de asignación que cuentan como trabajo hecho y pagable. */
export const ESTADOS_LIQUIDABLES = ["terminada", "rechazada_calidad", "cerrada"] as const;

export type AsignacionLiquidable = {
  id: number;
  numero: string;
  descripcion_pieza: string;
  costo_pactado: number | string;
  estado: string;
  pagada: boolean;
  es_retrabajo: boolean;
  fecha_terminado_real: string | null;
  /** Ya figura como pago en alguna liquidación (borrador o pagada). */
  ya_liquidada: boolean;
};

export type GarantiaDescontable = {
  asignacion_id: number;
  numero_garantia: string;
  numero_origen: string;
  costo_pactado: number | string;
  estado: string;
  fecha_terminado_real: string | null;
  /** Ya figura como descuento en alguna liquidación. */
  ya_descontada: boolean;
};

export type LineaLiquidacion = {
  asignacion_id: number;
  concepto: string;
  monto: number;
  es_descuento: boolean;
  fecha: string | null;
};

function enRango(fecha: string | null, desde: string, hasta: string) {
  return fecha !== null && fecha >= desde && fecha <= hasta;
}

/**
 * Previsualización de una liquidación: pagos y descuentos que entrarían
 * para un joyero en un rango. Misma lógica que `fn_generar_liquidacion`.
 */
export function lineasDeLiquidacion(
  asignaciones: readonly AsignacionLiquidable[],
  garantias: readonly GarantiaDescontable[],
  parametros: { descontar_garantia_al_joyero: boolean },
  rango: { desde: string; hasta: string },
): { pagos: LineaLiquidacion[]; descuentos: LineaLiquidacion[]; total: number } {
  const pagos = asignaciones
    .filter(
      (a) =>
        (ESTADOS_LIQUIDABLES as readonly string[]).includes(a.estado) &&
        !a.pagada &&
        !a.ya_liquidada &&
        Number(a.costo_pactado) > 0 &&
        enRango(a.fecha_terminado_real, rango.desde, rango.hasta),
    )
    .sort((a, b) => (a.fecha_terminado_real ?? "").localeCompare(b.fecha_terminado_real ?? "") || a.id - b.id)
    .map((a) => ({
      asignacion_id: a.id,
      concepto: `${a.numero} · ${a.descripcion_pieza}${a.es_retrabajo ? " (retrabajo)" : ""}`,
      monto: redondear(Number(a.costo_pactado)),
      es_descuento: false,
      fecha: a.fecha_terminado_real,
    }));

  const descuentos = parametros.descontar_garantia_al_joyero
    ? garantias
        .filter(
          (g) =>
            (ESTADOS_LIQUIDABLES as readonly string[]).includes(g.estado) &&
            !g.ya_descontada &&
            Number(g.costo_pactado) > 0 &&
            enRango(g.fecha_terminado_real, rango.desde, rango.hasta),
        )
        .sort((a, b) => (a.fecha_terminado_real ?? "").localeCompare(b.fecha_terminado_real ?? "") || a.asignacion_id - b.asignacion_id)
        .map((g) => ({
          asignacion_id: g.asignacion_id,
          concepto: `Descuento por garantía ${g.numero_garantia} (origen ${g.numero_origen})`,
          monto: -redondear(Number(g.costo_pactado)),
          es_descuento: true,
          fecha: g.fecha_terminado_real,
        }))
    : [];

  const total = redondear([...pagos, ...descuentos].reduce((s, l) => s + l.monto, 0));
  return { pagos, descuentos, total };
}
