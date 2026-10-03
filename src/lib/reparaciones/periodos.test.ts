import { describe, expect, it } from "vitest";

import { leerRango, rangoPredefinido } from "./periodos";

const HOY = "2026-10-03";

describe("rangoPredefinido", () => {
  it("mes, mes anterior, trimestre, año", () => {
    expect(rangoPredefinido("mes", HOY)).toEqual({ desde: "2026-10-01", hasta: HOY });
    expect(rangoPredefinido("mes_anterior", HOY)).toEqual({ desde: "2026-09-01", hasta: "2026-09-30" });
    expect(rangoPredefinido("trimestre", HOY)).toEqual({ desde: "2026-10-01", hasta: HOY });
    expect(rangoPredefinido("anio", HOY)).toEqual({ desde: "2026-01-01", hasta: HOY });
  });

  it("mes anterior cruza el año y febrero bisiesto", () => {
    expect(rangoPredefinido("mes_anterior", "2027-01-15")).toEqual({ desde: "2026-12-01", hasta: "2026-12-31" });
    expect(rangoPredefinido("mes_anterior", "2028-03-01")).toEqual({ desde: "2028-02-01", hasta: "2028-02-29" });
  });

  it("ventanas móviles", () => {
    expect(rangoPredefinido("30d", HOY)).toEqual({ desde: "2026-09-04", hasta: HOY });
    expect(rangoPredefinido("90d", HOY).desde).toBe("2026-07-06");
  });
});

describe("leerRango", () => {
  it("por defecto este mes", () => {
    expect(leerRango({}, HOY)).toEqual({ desde: "2026-10-01", hasta: HOY, clave: "mes" });
  });

  it("acepta clave y rango personalizado válido", () => {
    expect(leerRango({ periodo: "anio" }, HOY).clave).toBe("anio");
    expect(leerRango({ desde: "2026-05-01", hasta: "2026-05-31" }, HOY)).toEqual({ desde: "2026-05-01", hasta: "2026-05-31", clave: "personalizado" });
  });

  it("ignora rangos inválidos o invertidos", () => {
    expect(leerRango({ desde: "2026-05-31", hasta: "2026-05-01" }, HOY).clave).toBe("mes");
    expect(leerRango({ desde: "ayer", hasta: "hoy", periodo: "noexiste" }, HOY).clave).toBe("mes");
  });
});
