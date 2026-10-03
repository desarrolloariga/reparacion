import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  destinosDesde,
  ESTADOS_ACTIVOS,
  ESTADOS_KANBAN,
  ESTADOS_ORDEN,
  ESTADOS_TERMINALES,
  fechaControlDe,
  puedeTransitar,
  tipoMoraDe,
  TRANSICIONES,
} from "./estados";

describe("transiciones", () => {
  it("coinciden con la semilla SQL de joyeria.transiciones_estado", () => {
    const sql = readFileSync(
      path.resolve(__dirname, "../../../supabase/migrations/20261004100000_ordenes.sql"),
      "utf8",
    );
    const bloque = sql.slice(sql.indexOf("insert into joyeria.transiciones_estado"));
    const enSql = [...bloque.matchAll(/\('([a-z_]+)',\s*'([a-z_]+)',/g)].map((m) => `${m[1]}>${m[2]}`).sort();
    const enTs = TRANSICIONES.map(([d, h]) => `${d}>${h}`).sort();
    expect(enTs).toEqual(enSql);
  });

  it("permite el flujo principal y rechaza saltos", () => {
    expect(puedeTransitar("recibida", "cotizada")).toBe(true);
    expect(puedeTransitar("cotizada", "aprobada")).toBe(true);
    expect(puedeTransitar("aprobada", "asignada")).toBe(true);
    expect(puedeTransitar("lista_entrega", "entregada")).toBe(true);
    expect(puedeTransitar("recibida", "asignada")).toBe(false);
    expect(puedeTransitar("recibida", "aprobada")).toBe(false);
    expect(puedeTransitar("entregada", "recibida")).toBe(false);
  });

  it("todo salvo entregada y anulada puede anularse", () => {
    for (const e of ESTADOS_ORDEN) {
      expect(puedeTransitar(e, "anulada")).toBe(e !== "entregada" && e !== "anulada");
    }
  });

  it("cotizada → cotizada existe (nueva versión)", () => {
    expect(puedeTransitar("cotizada", "cotizada")).toBe(true);
  });

  it("destinosDesde excluye el propio estado", () => {
    expect(destinosDesde("aprobada")).toEqual(["asignada", "anulada"]);
    expect(destinosDesde("entregada")).toEqual([]);
  });
});

describe("conjuntos", () => {
  it("activos + terminales = todos", () => {
    expect([...ESTADOS_ACTIVOS, ...ESTADOS_TERMINALES].sort()).toEqual([...ESTADOS_ORDEN].sort());
    expect(ESTADOS_KANBAN.every((e) => ESTADOS_ACTIVOS.includes(e))).toBe(true);
  });
});

describe("fecha de control", () => {
  const orden = { estado: "asignada" as const, fecha_prometida_cliente: "2026-10-20" };

  it("en manos del joyero usa su compromiso", () => {
    expect(tipoMoraDe("asignada")).toBe("joyero");
    expect(tipoMoraDe("en_proceso")).toBe("joyero");
    expect(fechaControlDe(orden, { fecha_compromiso: "2026-10-17" })).toBe("2026-10-17");
  });

  it("sin asignación activa cae a la promesa al cliente", () => {
    expect(fechaControlDe(orden, null)).toBe("2026-10-20");
  });

  it("en otros estados usa la promesa al cliente", () => {
    expect(tipoMoraDe("en_control_calidad")).toBe("cliente");
    expect(fechaControlDe({ ...orden, estado: "en_control_calidad" }, { fecha_compromiso: "2026-10-17" })).toBe("2026-10-20");
  });

  it("los terminales no tienen semáforo", () => {
    expect(fechaControlDe({ ...orden, estado: "entregada" })).toBeNull();
    expect(fechaControlDe({ ...orden, estado: "anulada" })).toBeNull();
  });
});
