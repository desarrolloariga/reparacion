import { describe, expect, it } from "vitest";

import { crearCalendario } from "./dias-habiles";
import {
  claveCombinacion,
  diasEstimadosOrden,
  diasPorLinea,
  diasRestantes,
  FaltaTiempoEstandar,
  fechasDeOrden,
  recalcularRespetandoManual,
} from "./tiempos";

// Lunes a sábado con el 20 de octubre (martes) feriado.
const CAL = crearCalendario([1, 2, 3, 4, 5, 6], [{ fecha: "2026-10-20", es_habil: false }]);

const MATRIZ = new Map<string, number>([
  [claveCombinacion(1, 1), 2], // cambio de medida · baja
  [claveCombinacion(1, 3), 5], // cambio de medida · alta
  [claveCombinacion(2, 2), 4], // engaste · media
]);

describe("diasEstimadosOrden", () => {
  it("suma los días de cada línea (no el máximo)", () => {
    expect(
      diasEstimadosOrden(
        [
          { tipo_trabajo_id: 1, complejidad_id: 1 },
          { tipo_trabajo_id: 2, complejidad_id: 2 },
        ],
        MATRIZ,
      ),
    ).toBe(6);
  });

  it("bloquea cuando falta una combinación, nombrando lo que falta", () => {
    const lineas = [
      { tipo_trabajo_id: 1, complejidad_id: 1 },
      { tipo_trabajo_id: 2, complejidad_id: 3 },
      { tipo_trabajo_id: 2, complejidad_id: 3 },
    ];
    expect(() => diasEstimadosOrden(lineas, MATRIZ)).toThrow(FaltaTiempoEstandar);
    try {
      diasPorLinea(lineas, MATRIZ, (c) => `T${c.tipo_trabajo_id}/C${c.complejidad_id}`);
    } catch (e) {
      const err = e as FaltaTiempoEstandar;
      expect(err.faltantes).toEqual([{ tipo_trabajo_id: 2, complejidad_id: 3 }]);
      expect(err.message).toContain("T2/C3");
      expect(err.message).toContain("Tiempos estándar");
    }
  });

  it("una orden sin líneas estima 0 días", () => {
    expect(diasEstimadosOrden([], MATRIZ)).toBe(0);
  });
});

describe("fechasDeOrden", () => {
  it("estimada = base + días; prometida = estimada + holgura, saltando feriados", () => {
    // Lunes 19 de octubre + 2 días hábiles: martes 20 es feriado → miércoles 21 y jueves 22.
    const f = fechasDeOrden("2026-10-19", 2, { holgura_cliente_dias: 2 }, CAL);
    expect(f.fecha_estimada_entrega).toBe("2026-10-22");
    expect(f.fecha_prometida_cliente).toBe("2026-10-24");
  });

  it("cruza el domingo", () => {
    const f = fechasDeOrden("2026-10-02", 2, { holgura_cliente_dias: 1 }, CAL);
    expect(f.fecha_estimada_entrega).toBe("2026-10-05");
    expect(f.fecha_prometida_cliente).toBe("2026-10-06");
  });

  it("holgura 0 deja la prometida igual a la estimada", () => {
    const f = fechasDeOrden("2026-10-05", 1, { holgura_cliente_dias: 0 }, CAL);
    expect(f.fecha_prometida_cliente).toBe(f.fecha_estimada_entrega);
  });
});

describe("recalcularRespetandoManual", () => {
  it("conserva la prometida fijada a mano", () => {
    const f = recalcularRespetandoManual("2026-10-05", 3, { holgura_cliente_dias: 2 }, CAL, {
      fecha_prometida_cliente: "2026-10-31",
      fecha_prometida_manual: true,
    });
    expect(f.fecha_estimada_entrega).toBe("2026-10-08");
    expect(f.fecha_prometida_cliente).toBe("2026-10-31");
  });

  it("recalcula la prometida si no era manual", () => {
    const f = recalcularRespetandoManual("2026-10-05", 3, { holgura_cliente_dias: 2 }, CAL, {
      fecha_prometida_cliente: "2026-10-31",
      fecha_prometida_manual: false,
    });
    expect(f.fecha_prometida_cliente).toBe("2026-10-10");
  });
});

describe("diasRestantes", () => {
  it("positivo antes, cero el día, negativo después", () => {
    expect(diasRestantes("2026-10-05", "2026-10-07", CAL)).toBe(2);
    expect(diasRestantes("2026-10-07", "2026-10-07", CAL)).toBe(0);
    expect(diasRestantes("2026-10-09", "2026-10-07", CAL)).toBe(-2);
  });
});
