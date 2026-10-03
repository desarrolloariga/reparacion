"use client";

import { useActionState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Casilla, Rotulo } from "@/components/ui/campo";
import { guardarParametros } from "@/lib/acciones/parametros";
import { DIAS_SEMANA_ISO, NOMBRE_DIA_SEMANA } from "@/lib/reparaciones/dias-habiles";
import {
  analizarDias,
  analizarParametros,
  CLAVES_PARAMETROS,
  DEFINICION_PARAMETROS,
  ETIQUETA_GRUPO,
  type DefinicionParametro,
} from "@/lib/reparaciones/parametros";
import type { EstadoAccion } from "@/lib/validacion";

/**
 * El formulario se genera desde la definición del módulo puro: añadir un
 * parámetro es añadirlo ahí (y sembrarlo); esta pantalla no cambia.
 */
export function FormularioParametros({ valores }: { valores: Record<string, string> }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(guardarParametros, null);
  const tipados = analizarParametros(valores);
  const dias = analizarDias(valores.dias_semana_habiles ?? "") ?? tipados.dias_semana_habiles;

  const grupos = [...new Set(CLAVES_PARAMETROS.map((c) => DEFINICION_PARAMETROS[c].grupo))];

  return (
    <form action={accion}>
      {grupos.map((grupo) => (
        <fieldset key={grupo} className="border-ink/6 m-0 border-t px-[22px] py-5 first:border-t-0">
          <legend className="text-gold-dark px-0 text-[9px] font-medium tracking-[0.2em] uppercase">
            {ETIQUETA_GRUPO[grupo]}
          </legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {CLAVES_PARAMETROS.filter((c) => DEFINICION_PARAMETROS[c].grupo === grupo).map((clave) => {
              const def: DefinicionParametro = DEFINICION_PARAMETROS[clave];
              const error = estado?.campos?.[clave];

              if (def.tipo === "booleano") {
                return (
                  <Casilla
                    key={clave}
                    name={clave}
                    defaultChecked={Boolean(tipados[clave])}
                    etiqueta={def.etiqueta}
                    ayuda={def.ayuda}
                    className="sm:col-span-2"
                  />
                );
              }

              if (def.tipo === "json_dias") {
                return (
                  <div key={clave} className="flex flex-col gap-2 sm:col-span-2">
                    <Rotulo>{def.etiqueta.toUpperCase()}</Rotulo>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {DIAS_SEMANA_ISO.map((d) => (
                        <label key={d} className="text-ink/70 flex cursor-pointer items-center gap-2 text-[12.5px]">
                          <input type="checkbox" name="dias" value={d} defaultChecked={dias.includes(d)} className="accent-gold size-[14px] cursor-pointer" />
                          {NOMBRE_DIA_SEMANA[d]}
                        </label>
                      ))}
                    </div>
                    <span className={error ? "text-clay text-[11px]" : "text-ink/40 text-[11px] leading-relaxed"}>
                      {error ?? def.ayuda}
                    </span>
                  </div>
                );
              }

              return (
                <Campo
                  key={clave}
                  etiqueta={def.etiqueta.toUpperCase()}
                  name={clave}
                  type={def.tipo === "entero" ? "number" : "text"}
                  min={def.min}
                  max={def.max}
                  defaultValue={valores[clave] ?? String(tipados[clave])}
                  disabled={def.soloLectura}
                  ayuda={def.ayuda}
                  error={error}
                />
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="border-ink/7 flex flex-wrap items-center justify-between gap-3 border-t px-[22px] py-4">
        <div className="flex-1">
          <Aviso>{estado?.error}</Aviso>
          <Aviso tono="ok">{estado?.ok}</Aviso>
        </div>
        <Boton type="submit" disabled={enviando} tamano="sm">
          {enviando ? "GUARDANDO…" : "GUARDAR PARÁMETROS"}
        </Boton>
      </div>
    </form>
  );
}
