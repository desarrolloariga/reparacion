import { describe, expect, it } from "vitest";

import { analizarNumero, esNumeroOrden, formatearNumero, normalizarNumero } from "./numero-orden";

describe("numero de orden", () => {
  it("formatea con prefijo, año y cinco dígitos", () => {
    expect(formatearNumero("reparacion", 2026, 1)).toBe("REP-2026-00001");
    expect(formatearNumero("creacion", 2026, 123)).toBe("CRE-2026-00123");
  });

  it("analiza y reconoce", () => {
    expect(analizarNumero("REP-2026-00007")).toEqual({ tipo: "reparacion", anio: 2026, correlativo: 7 });
    expect(analizarNumero("cre-2026-00007")?.tipo).toBe("creacion");
    expect(analizarNumero("REP-26-7")).toBeNull();
    expect(esNumeroOrden("REP-2026-00007")).toBe(true);
    expect(esNumeroOrden("anillo")).toBe(false);
  });

  it("normaliza lo que escribe el usuario", () => {
    expect(normalizarNumero("rep 2026 12")).toBe("REP-2026-00012");
    expect(normalizarNumero("CRE-2026-00012")).toBe("CRE-2026-00012");
    expect(normalizarNumero("REP202612")).toBe("REP-2026-00012");
    expect(normalizarNumero("hola")).toBeNull();
  });
});
