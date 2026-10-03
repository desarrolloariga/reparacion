import { describe, expect, it } from "vitest";

import {
  CALENDARIO_POR_DEFECTO,
  crearCalendario,
  diaSemanaISO,
  diasHabilesEntre,
  diasNaturalesEntre,
  esDiaHabil,
  esFechaISO,
  hoyISO,
  restarDiasHabiles,
  siguienteDiaHabil,
  sumarDiasHabiles,
} from "./dias-habiles";

// Referencias: 2026-10-02 viernes · 10-03 sábado · 10-04 domingo ·
// 10-05 lunes · 10-19 lunes · 10-20 martes · 12-31 jueves · 2027-01-01 viernes.

const LS = CALENDARIO_POR_DEFECTO;
const LV = crearCalendario([1, 2, 3, 4, 5]);
const FERIADO_20 = crearCalendario([1, 2, 3, 4, 5, 6], [{ fecha: "2026-10-20", es_habil: false }]);
const DOMINGO_ABIERTO = crearCalendario([1, 2, 3, 4, 5, 6], [{ fecha: "2026-10-04", es_habil: true }]);

describe("esFechaISO", () => {
  it("acepta fechas válidas y rechaza las inválidas", () => {
    expect(esFechaISO("2026-10-03")).toBe(true);
    expect(esFechaISO("2026-02-28")).toBe(true);
    expect(esFechaISO("2026-02-31")).toBe(false);
    expect(esFechaISO("2026-2-3")).toBe(false);
    expect(esFechaISO("hoy")).toBe(false);
    expect(esFechaISO(20261003)).toBe(false);
  });

  it("las operaciones lanzan con fechas inválidas", () => {
    expect(() => sumarDiasHabiles("2026-02-31", 1, LS)).toThrow(RangeError);
    expect(() => diasHabilesEntre("x", "2026-10-03", LS)).toThrow(RangeError);
  });
});

describe("diaSemanaISO", () => {
  it("numera lunes = 1 y domingo = 7", () => {
    expect(diaSemanaISO("2026-10-05")).toBe(1);
    expect(diaSemanaISO("2026-10-03")).toBe(6);
    expect(diaSemanaISO("2026-10-04")).toBe(7);
  });
});

describe("crearCalendario", () => {
  it("lanza si no puede haber ningún día hábil", () => {
    expect(() => crearCalendario([])).toThrow(RangeError);
    expect(() => crearCalendario([], [{ fecha: "2026-10-04", es_habil: false }])).toThrow(RangeError);
  });

  it("acepta un calendario que solo abre por excepción", () => {
    const solo = crearCalendario([], [{ fecha: "2026-10-04", es_habil: true }]);
    expect(sumarDiasHabiles("2026-10-03", 1, solo)).toBe("2026-10-04");
  });

  it("rechaza días de semana fuera de 1..7", () => {
    expect(() => crearCalendario([0 as never])).toThrow(RangeError);
    expect(() => crearCalendario([8 as never])).toThrow(RangeError);
  });
});

describe("esDiaHabil", () => {
  it("sigue la regla semanal", () => {
    expect(esDiaHabil("2026-10-05", LS)).toBe(true);
    expect(esDiaHabil("2026-10-04", LS)).toBe(false);
    expect(esDiaHabil("2026-10-03", LS)).toBe(true);
    expect(esDiaHabil("2026-10-03", LV)).toBe(false);
  });

  it("un feriado cierra aunque sea martes", () => {
    expect(esDiaHabil("2026-10-20", FERIADO_20)).toBe(false);
  });

  it("un domingo marcado hábil cuenta", () => {
    expect(esDiaHabil("2026-10-04", DOMINGO_ABIERTO)).toBe(true);
  });
});

describe("sumarDiasHabiles", () => {
  it("n = 0 devuelve la misma fecha, incluso en domingo", () => {
    expect(sumarDiasHabiles("2026-10-04", 0, LS)).toBe("2026-10-04");
  });

  it("cuenta el sábado según el calendario", () => {
    expect(sumarDiasHabiles("2026-10-02", 1, LS)).toBe("2026-10-03");
    expect(sumarDiasHabiles("2026-10-02", 1, LV)).toBe("2026-10-05");
  });

  it("cruza el domingo", () => {
    expect(sumarDiasHabiles("2026-10-03", 1, LS)).toBe("2026-10-05");
  });

  it("salta el feriado", () => {
    expect(sumarDiasHabiles("2026-10-19", 1, FERIADO_20)).toBe("2026-10-21");
    expect(sumarDiasHabiles("2026-10-19", 2, FERIADO_20)).toBe("2026-10-22");
  });

  it("cuenta el domingo abierto", () => {
    expect(sumarDiasHabiles("2026-10-03", 1, DOMINGO_ABIERTO)).toBe("2026-10-04");
  });

  it("cruza el año y respeta el feriado del 1 de enero", () => {
    expect(sumarDiasHabiles("2026-12-31", 2, LS)).toBe("2027-01-02");
    const conFeriado = crearCalendario([1, 2, 3, 4, 5, 6], [{ fecha: "2027-01-01", es_habil: false }]);
    expect(sumarDiasHabiles("2026-12-31", 2, conFeriado)).toBe("2027-01-04");
  });

  it("arrancar en día no hábil no cuenta ese día", () => {
    expect(sumarDiasHabiles("2026-10-04", 1, LS)).toBe("2026-10-05");
  });

  it("n negativo equivale a restar", () => {
    expect(sumarDiasHabiles("2026-10-05", -1, LS)).toBe(restarDiasHabiles("2026-10-05", 1, LS));
  });

  it("rechaza cantidades no enteras", () => {
    expect(() => sumarDiasHabiles("2026-10-05", 1.5, LS)).toThrow(RangeError);
  });
});

describe("restarDiasHabiles", () => {
  it("retrocede saltando domingos y feriados", () => {
    expect(restarDiasHabiles("2026-10-05", 1, LS)).toBe("2026-10-03");
    expect(restarDiasHabiles("2026-10-05", 1, LV)).toBe("2026-10-02");
    expect(restarDiasHabiles("2026-10-21", 1, FERIADO_20)).toBe("2026-10-19");
  });
});

describe("diasHabilesEntre", () => {
  it("mismo día = 0", () => {
    expect(diasHabilesEntre("2026-10-05", "2026-10-05", LS)).toBe(0);
  });

  it("cuenta hacia adelante y hacia atrás", () => {
    expect(diasHabilesEntre("2026-10-02", "2026-10-03", LS)).toBe(1);
    expect(diasHabilesEntre("2026-10-03", "2026-10-05", LS)).toBe(1);
    expect(diasHabilesEntre("2026-10-05", "2026-10-03", LS)).toBe(-1);
    expect(diasHabilesEntre("2026-10-19", "2026-10-21", FERIADO_20)).toBe(1);
  });

  it("propiedad: entre(f, sumar(f, n)) === n y restar deshace sumar", () => {
    const semillas = ["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-19", "2026-12-24", "2026-12-31"];
    for (const f of semillas) {
      for (let n = 0; n <= 30; n++) {
        const destino = sumarDiasHabiles(f, n, FERIADO_20);
        expect(diasHabilesEntre(f, destino, FERIADO_20)).toBe(n);
        if (esDiaHabil(f, FERIADO_20)) {
          expect(restarDiasHabiles(destino, n, FERIADO_20)).toBe(f);
        }
      }
    }
  });
});

describe("siguienteDiaHabil", () => {
  it("devuelve la misma fecha si es hábil y la siguiente si no", () => {
    expect(siguienteDiaHabil("2026-10-05", LS)).toBe("2026-10-05");
    expect(siguienteDiaHabil("2026-10-04", LS)).toBe("2026-10-05");
    expect(siguienteDiaHabil("2026-10-20", FERIADO_20)).toBe("2026-10-21");
  });
});

describe("utilidades", () => {
  it("diasNaturalesEntre tiene signo", () => {
    expect(diasNaturalesEntre("2026-10-01", "2026-10-04")).toBe(3);
    expect(diasNaturalesEntre("2026-10-04", "2026-10-01")).toBe(-3);
  });

  it("hoyISO respeta la zona horaria", () => {
    // 2026-10-04 03:00 UTC es todavía 2026-10-03 en Guatemala (UTC−6).
    const instante = new Date("2026-10-04T03:00:00Z");
    expect(hoyISO("America/Guatemala", instante)).toBe("2026-10-03");
    expect(hoyISO("UTC", instante)).toBe("2026-10-04");
  });
});
