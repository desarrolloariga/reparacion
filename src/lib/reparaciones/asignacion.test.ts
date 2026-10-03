import { describe, expect, it } from "vitest";

import {
  costoDeLinea,
  costoSugerido,
  desviacion,
  excedeTope,
  fechaCompromisoSugerida,
  ordenarCandidatos,
  topeJoyero,
  type Candidato,
} from "./asignacion";
import { crearCalendario } from "./dias-habiles";

const CAL = crearCalendario([1, 2, 3, 4, 5, 6], [{ fecha: "2026-10-20", es_habil: false }]);

describe("fechas de compromiso", () => {
  it("sugerida = asignación + días hábiles", () => {
    expect(fechaCompromisoSugerida("2026-10-19", 2, CAL)).toBe("2026-10-22");
  });

  it("tope = prometida − holgura del joyero", () => {
    expect(topeJoyero("2026-10-24", 1, CAL)).toBe("2026-10-23");
    expect(topeJoyero("2026-10-21", 1, CAL)).toBe("2026-10-19");
  });

  it("advierte cuando la sugerida supera el tope", () => {
    expect(excedeTope("2026-10-22", "2026-10-23")).toBe(false);
    expect(excedeTope("2026-10-23", "2026-10-23")).toBe(false);
    expect(excedeTope("2026-10-24", "2026-10-23")).toBe(true);
  });
});

describe("desviación", () => {
  it("días reales en hábiles y desviación con signo", () => {
    expect(desviacion("2026-10-05", "2026-10-08", 2, CAL)).toEqual({ dias_reales: 3, desviacion_dias: 1 });
    expect(desviacion("2026-10-05", "2026-10-06", 2, CAL)).toEqual({ dias_reales: 1, desviacion_dias: -1 });
    expect(desviacion("2026-10-05", "2026-10-05", 2, CAL)).toEqual({ dias_reales: 0, desviacion_dias: -2 });
  });
});

describe("ordenarCandidatos", () => {
  const base: Candidato = { id: 0, nombre: "", activo: true, capacidad_maxima: 5, especialidades: [], activas: 0, terminadas: 0, a_tiempo: 0, retrabajos: 0 };
  const joyeros: Candidato[] = [
    { ...base, id: 1, nombre: "Ana", especialidades: [1], activas: 1, terminadas: 10, a_tiempo: 9, retrabajos: 1 },
    { ...base, id: 2, nombre: "Beto", especialidades: [1, 2], activas: 5, terminadas: 4, a_tiempo: 4, retrabajos: 0 },
    { ...base, id: 3, nombre: "Carla", especialidades: [1, 2], activas: 2, terminadas: 0, a_tiempo: 0, retrabajos: 0 },
    { ...base, id: 4, nombre: "Dino", especialidades: [3], activas: 0 },
    { ...base, id: 5, nombre: "Inactivo", activo: false, especialidades: [1, 2] },
  ];

  it("coincidencias primero, luego capacidad y carga; excluye inactivos", () => {
    const orden = ordenarCandidatos(joyeros, [1, 2]).map((j) => j.nombre);
    expect(orden).toEqual(["Carla", "Beto", "Ana", "Dino"]);
  });

  it("calcula porcentajes y capacidad llena", () => {
    const beto = ordenarCandidatos(joyeros, [1, 2]).find((j) => j.id === 2)!;
    expect(beto.capacidad_llena).toBe(true);
    expect(beto.cumplimiento_pct).toBe(100);
    const ana = ordenarCandidatos(joyeros, [1, 2]).find((j) => j.id === 1)!;
    expect(ana.cumplimiento_pct).toBe(90);
    expect(ana.retrabajo_pct).toBe(10);
    const carla = ordenarCandidatos(joyeros, [1, 2]).find((j) => j.id === 3)!;
    expect(carla.cumplimiento_pct).toBeNull();
  });
});

describe("costo sugerido", () => {
  const tarifas = [
    { tipo_trabajo_id: 1, complejidad_id: null, costo_acordado: 100 },
    { tipo_trabajo_id: 1, complejidad_id: 3, costo_acordado: 180 },
    { tipo_trabajo_id: 2, complejidad_id: 2, costo_acordado: 250 },
  ];

  it("la específica gana a la general", () => {
    expect(costoDeLinea(tarifas, 1, 3)).toBe(180);
    expect(costoDeLinea(tarifas, 1, 1)).toBe(100);
    expect(costoDeLinea(tarifas, 2, 1)).toBeNull();
  });

  it("suma por cantidad y cuenta las líneas sin tarifa", () => {
    expect(costoSugerido(tarifas, [
      { tipo_trabajo_id: 1, complejidad_id: 3, cantidad: 2 },
      { tipo_trabajo_id: 2, complejidad_id: 2, cantidad: 1 },
      { tipo_trabajo_id: 2, complejidad_id: 1, cantidad: 1 },
    ])).toEqual({ total: 610, sinTarifa: 1 });
    expect(costoSugerido(tarifas, [{ tipo_trabajo_id: 9, complejidad_id: 1, cantidad: 1 }])).toEqual({ total: null, sinTarifa: 1 });
  });
});
