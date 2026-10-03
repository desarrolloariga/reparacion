import { describe, expect, it } from "vitest";

import {
  cobradoDe,
  costoOrden,
  lineasDeLiquidacion,
  margenOrden,
  saldoOrden,
  utilidadOrden,
  type AsignacionLiquidable,
  type GarantiaDescontable,
} from "./dinero";

describe("dinero de la orden", () => {
  const pagos = [{ monto: 200 }, { monto: "150.50" }];
  const asignaciones = [
    { costo_pactado: 120, estado: "cerrada" },
    { costo_pactado: "30", estado: "rechazada_calidad" },
    { costo_pactado: 999, estado: "anulada" },
  ];

  it("cobrado, saldo, costo, utilidad y margen", () => {
    expect(cobradoDe(pagos)).toBe(350.5);
    expect(saldoOrden(500, pagos)).toBe(149.5);
    expect(costoOrden(asignaciones)).toBe(150);
    expect(utilidadOrden("500", asignaciones)).toBe(350);
    expect(margenOrden(500, 150)).toBe(70);
  });

  it("margen null sin precio; utilidad negativa en garantía sin cobro", () => {
    expect(margenOrden(0, 80)).toBeNull();
    expect(utilidadOrden(0, [{ costo_pactado: 80, estado: "terminada" }])).toBe(-80);
  });
});

describe("lineasDeLiquidacion", () => {
  const base: AsignacionLiquidable = { id: 0, numero: "", descripcion_pieza: "", costo_pactado: 0, estado: "terminada", pagada: false, es_retrabajo: false, fecha_terminado_real: "2026-10-10", ya_liquidada: false };
  const asignaciones: AsignacionLiquidable[] = [
    { ...base, id: 1, numero: "REP-2026-00001", descripcion_pieza: "anillo", costo_pactado: 120 },
    { ...base, id: 2, numero: "REP-2026-00002", descripcion_pieza: "cadena", costo_pactado: 80, estado: "rechazada_calidad" },
    { ...base, id: 3, numero: "REP-2026-00002", descripcion_pieza: "cadena", costo_pactado: 0, es_retrabajo: true },
    { ...base, id: 4, numero: "REP-2026-00003", descripcion_pieza: "pagada", costo_pactado: 50, pagada: true },
    { ...base, id: 5, numero: "REP-2026-00004", descripcion_pieza: "ya en borrador", costo_pactado: 50, ya_liquidada: true },
    { ...base, id: 6, numero: "REP-2026-00005", descripcion_pieza: "fuera de rango", costo_pactado: 50, fecha_terminado_real: "2026-11-02" },
    { ...base, id: 7, numero: "REP-2026-00006", descripcion_pieza: "en proceso", costo_pactado: 50, estado: "en_proceso", fecha_terminado_real: null },
  ];
  const garantias: GarantiaDescontable[] = [
    { asignacion_id: 20, numero_garantia: "REP-2026-00010", numero_origen: "REP-2026-00001", costo_pactado: 60, estado: "terminada", fecha_terminado_real: "2026-10-20", ya_descontada: false },
    { asignacion_id: 21, numero_garantia: "REP-2026-00011", numero_origen: "REP-2026-00002", costo_pactado: 40, estado: "terminada", fecha_terminado_real: "2026-10-21", ya_descontada: true },
  ];
  const rango = { desde: "2026-10-01", hasta: "2026-10-31" };

  it("incluye terminadas y rechazadas con costo, excluye pagadas, liquidadas, fuera de rango, en proceso y costo 0", () => {
    const r = lineasDeLiquidacion(asignaciones, [], { descontar_garantia_al_joyero: true }, rango);
    expect(r.pagos.map((p) => p.asignacion_id)).toEqual([1, 2]);
    expect(r.pagos[1].concepto).toBe("REP-2026-00002 · cadena");
    expect(r.total).toBe(200);
  });

  it("descuenta garantías no descontadas cuando el parámetro está activo", () => {
    const r = lineasDeLiquidacion(asignaciones, garantias, { descontar_garantia_al_joyero: true }, rango);
    expect(r.descuentos).toHaveLength(1);
    expect(r.descuentos[0].monto).toBe(-60);
    expect(r.descuentos[0].es_descuento).toBe(true);
    expect(r.total).toBe(140);
  });

  it("sin el parámetro no hay descuentos", () => {
    const r = lineasDeLiquidacion(asignaciones, garantias, { descontar_garantia_al_joyero: false }, rango);
    expect(r.descuentos).toHaveLength(0);
    expect(r.total).toBe(200);
  });

  it("marca retrabajos en el concepto cuando tienen costo", () => {
    const r = lineasDeLiquidacion([{ ...base, id: 9, numero: "X", descripcion_pieza: "p", costo_pactado: 10, es_retrabajo: true }], [], { descontar_garantia_al_joyero: true }, rango);
    expect(r.pagos[0].concepto).toContain("(retrabajo)");
  });
});
