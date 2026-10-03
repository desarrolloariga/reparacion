import { describe, expect, it } from "vitest";

import {
  analizarDias,
  analizarParametros,
  CLAVES_PARAMETROS,
  DEFINICION_PARAMETROS,
  PARAMETROS_POR_DEFECTO,
  serializarParametro,
  validarParametro,
} from "./parametros";

describe("analizarParametros", () => {
  it("mapa vacío devuelve los valores por defecto", () => {
    expect(analizarParametros({})).toEqual(PARAMETROS_POR_DEFECTO);
  });

  it("lee enteros válidos y descarta los inválidos", () => {
    const p = analizarParametros({ holgura_cliente_dias: "5", holgura_joyero_dias: "abc" });
    expect(p.holgura_cliente_dias).toBe(5);
    expect(p.holgura_joyero_dias).toBe(PARAMETROS_POR_DEFECTO.holgura_joyero_dias);
  });

  it("descarta enteros fuera de rango", () => {
    expect(analizarParametros({ holgura_cliente_dias: "-1" }).holgura_cliente_dias).toBe(2);
    expect(analizarParametros({ holgura_cliente_dias: "999" }).holgura_cliente_dias).toBe(2);
  });

  it("lee booleanos en varias grafías", () => {
    expect(analizarParametros({ bloquear_por_capacidad: "true" }).bloquear_por_capacidad).toBe(true);
    expect(analizarParametros({ bloquear_por_capacidad: "1" }).bloquear_por_capacidad).toBe(true);
    expect(analizarParametros({ descontar_garantia_al_joyero: "false" }).descontar_garantia_al_joyero).toBe(false);
    expect(analizarParametros({ descontar_garantia_al_joyero: "quizás" }).descontar_garantia_al_joyero).toBe(true);
  });

  it("lee los días de la semana y cae al default si son inválidos", () => {
    expect(analizarParametros({ dias_semana_habiles: "[1,2,3]" }).dias_semana_habiles).toEqual([1, 2, 3]);
    expect(analizarParametros({ dias_semana_habiles: "[1,2,8]" }).dias_semana_habiles).toEqual([1, 2, 3, 4, 5, 6]);
    expect(analizarParametros({ dias_semana_habiles: "[]" }).dias_semana_habiles).toEqual([1, 2, 3, 4, 5, 6]);
    expect(analizarParametros({ dias_semana_habiles: "no json" }).dias_semana_habiles).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ignora claves desconocidas", () => {
    expect(analizarParametros({ otra_cosa: "1" })).toEqual(PARAMETROS_POR_DEFECTO);
  });

  it("no comparte el arreglo de días con los valores por defecto", () => {
    const p = analizarParametros({});
    p.dias_semana_habiles.push(7);
    expect(PARAMETROS_POR_DEFECTO.dias_semana_habiles).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("analizarDias", () => {
  it("ordena y deduplica", () => {
    expect(analizarDias("[6,1,1,3]")).toEqual([1, 3, 6]);
  });
});

describe("validarParametro", () => {
  it("rechaza enteros inválidos con mensaje", () => {
    expect(validarParametro("holgura_cliente_dias", "-1")).toEqual({
      error: expect.stringContaining("entre 0 y 60"),
    });
    expect(validarParametro("holgura_cliente_dias", "3")).toEqual({ valor: "3" });
  });

  it("normaliza booleanos", () => {
    expect(validarParametro("bloquear_por_capacidad", "on")).toEqual({ valor: "true" });
    expect(validarParametro("bloquear_por_capacidad", "")).toEqual({ valor: "false" });
  });

  it("exige al menos un día hábil", () => {
    expect(validarParametro("dias_semana_habiles", "[]")).toEqual({ error: expect.any(String) });
    expect(validarParametro("dias_semana_habiles", "[1,7]")).toEqual({ valor: "[1,7]" });
  });

  it("no deja editar los de solo lectura", () => {
    expect(validarParametro("moneda", "USD")).toEqual({ error: expect.any(String) });
  });
});

describe("definición", () => {
  it("toda clave tiene definición, default y se serializa a texto", () => {
    for (const clave of CLAVES_PARAMETROS) {
      expect(DEFINICION_PARAMETROS[clave].etiqueta).toBeTruthy();
      expect(PARAMETROS_POR_DEFECTO[clave]).toBeDefined();
      expect(typeof serializarParametro(clave, PARAMETROS_POR_DEFECTO[clave])).toBe("string");
    }
    expect(serializarParametro("dias_semana_habiles", [1, 2])).toBe("[1,2]");
  });
});
