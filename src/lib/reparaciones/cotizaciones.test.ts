import { describe, expect, it } from "vitest";

import { calcularTotales, estadoEfectivo, margenBajo, UMBRAL_MARGEN } from "./cotizaciones";

describe("calcularTotales", () => {
  it("multiplica por cantidad y resta costos", () => {
    const t = calcularTotales([
      { cantidad: 2, precio_unitario: 150, costo_joyero: 60 },
      { cantidad: 1, precio_unitario: 400, costo_joyero: 250 },
    ]);
    expect(t).toEqual({
      total_cliente: 700,
      total_costo_joyero: 370,
      utilidad_estimada: 330,
      margen_estimado: 47.14,
    });
  });

  it("sin líneas o sin precio el margen es null", () => {
    expect(calcularTotales([]).margen_estimado).toBeNull();
    expect(calcularTotales([{ cantidad: 1, precio_unitario: 0, costo_joyero: 50 }])).toEqual({
      total_cliente: 0,
      total_costo_joyero: 50,
      utilidad_estimada: -50,
      margen_estimado: null,
    });
  });

  it("ignora cantidades y valores no numéricos", () => {
    const t = calcularTotales([{ cantidad: Number.NaN, precio_unitario: 10, costo_joyero: 1 }]);
    expect(t.total_cliente).toBe(0);
  });

  it("redondea a dos decimales", () => {
    const t = calcularTotales([{ cantidad: 3, precio_unitario: 0.1, costo_joyero: 0.03 }]);
    expect(t.total_cliente).toBe(0.3);
    expect(t.total_costo_joyero).toBe(0.09);
  });

  it("margen bajo según umbral", () => {
    expect(UMBRAL_MARGEN).toBe(25);
    expect(margenBajo(24.99)).toBe(true);
    expect(margenBajo(25)).toBe(false);
    expect(margenBajo(null)).toBe(false);
  });
});

describe("estadoEfectivo", () => {
  it("una enviada con validez pasada se ve vencida", () => {
    expect(estadoEfectivo({ estado: "enviada", valido_hasta: "2026-10-01" }, "2026-10-02")).toBe("vencida");
    expect(estadoEfectivo({ estado: "enviada", valido_hasta: "2026-10-02" }, "2026-10-02")).toBe("enviada");
    expect(estadoEfectivo({ estado: "enviada", valido_hasta: null }, "2026-10-02")).toBe("enviada");
  });

  it("los demás estados no cambian", () => {
    expect(estadoEfectivo({ estado: "aprobada", valido_hasta: "2026-01-01" }, "2026-10-02")).toBe("aprobada");
    expect(estadoEfectivo({ estado: "borrador", valido_hasta: "2026-01-01" }, "2026-10-02")).toBe("borrador");
  });
});
