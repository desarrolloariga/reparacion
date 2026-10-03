import { describe, expect, it } from "vitest";

import { describirRestantes, semaforo } from "./semaforo";

describe("semaforo", () => {
  it("negativo es vencido", () => {
    expect(semaforo(-1, 1)).toBe("vencido");
    expect(semaforo(-10, 3)).toBe("vencido");
  });

  it("dentro del umbral es por vencer (incluido hoy)", () => {
    expect(semaforo(0, 1)).toBe("por_vencer");
    expect(semaforo(1, 1)).toBe("por_vencer");
  });

  it("por encima del umbral es a tiempo", () => {
    expect(semaforo(2, 1)).toBe("a_tiempo");
    expect(semaforo(30, 1)).toBe("a_tiempo");
  });

  it("con umbral 0 solo hoy es por vencer", () => {
    expect(semaforo(0, 0)).toBe("por_vencer");
    expect(semaforo(1, 0)).toBe("a_tiempo");
  });
});

describe("describirRestantes", () => {
  it("describe atraso, hoy y días por venir", () => {
    expect(describirRestantes(-1)).toBe("1 día de atraso");
    expect(describirRestantes(-3)).toBe("3 días de atraso");
    expect(describirRestantes(0)).toBe("vence hoy");
    expect(describirRestantes(1)).toBe("vence mañana hábil");
    expect(describirRestantes(4)).toBe("vence en 4 días");
  });
});
