"use client";

import { useActionState, useMemo, useState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { guardarMatriz } from "@/lib/acciones/catalogos";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";
import { cn } from "@/lib/utils";

type Tipo = { id: number; nombre: string; categoria: CategoriaTrabajo; activo: boolean };
type ComplejidadMin = { id: number; nombre: string };

/**
 * Un solo formulario para toda la grilla: la operación mental del
 * administrador es «calibrar la tabla», no cambiar una celda. El contador
 * de cambios sin guardar evita que se vaya con ediciones a medias.
 */
export function Matriz({
  tipos,
  complejidades,
  valores,
}: {
  tipos: Tipo[];
  complejidades: ComplejidadMin[];
  /** `tipo:complejidad` → días. */
  valores: Record<string, number>;
}) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(guardarMatriz, null);
  const [actuales, setActuales] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, String(v)])),
  );

  const cambios = useMemo(() => {
    let n = 0;
    const claves = new Set([...Object.keys(valores), ...Object.keys(actuales)]);
    for (const k of claves) {
      const original = valores[k] !== undefined ? String(valores[k]) : "";
      if ((actuales[k] ?? "") !== original) n += 1;
    }
    return n;
  }, [actuales, valores]);

  const nombreCampo = (tipoId: number, complejidadId: number) => `t_${tipoId}_${complejidadId}`;
  const clave = (tipoId: number, complejidadId: number) => `${tipoId}:${complejidadId}`;

  return (
    <form action={accion}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-ink/7 text-ink/42 border-b text-left text-[9px] tracking-[0.16em]">
              <th className="px-5 py-3 font-medium uppercase">Tipo de trabajo</th>
              {complejidades.map((c) => (
                <th key={c.id} className="px-4 py-3 text-center font-medium uppercase">{c.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS.map((categoria) => {
              const lista = tipos.filter((t) => t.categoria === categoria);
              if (lista.length === 0) return null;
              return [
                <tr key={`cat-${categoria}`} className="bg-bone/70">
                  <td colSpan={complejidades.length + 1} className="text-gold-dark px-5 py-2 text-[9px] font-medium tracking-[0.2em] uppercase">
                    {ETIQUETA_CATEGORIA[categoria]}
                  </td>
                </tr>,
                ...lista.map((t) => (
                  <tr key={t.id} className="border-ink/6 border-b last:border-b-0">
                    <td className={cn("px-5 py-2", !t.activo && "text-ink/35")}>
                      {t.nombre}
                      {!t.activo ? <span className="text-ink/30 ml-2 text-[10px]">inactivo</span> : null}
                    </td>
                    {complejidades.map((c) => {
                      const k = clave(t.id, c.id);
                      const nombre = nombreCampo(t.id, c.id);
                      const valor = actuales[k] ?? "";
                      const error = estado?.campos?.[nombre];
                      return (
                        <td key={c.id} className="px-4 py-2 text-center">
                          <input
                            name={nombre}
                            inputMode="numeric"
                            value={valor}
                            disabled={!t.activo}
                            onChange={(e) => setActuales((s) => ({ ...s, [k]: e.target.value }))}
                            aria-label={`${t.nombre}, ${c.nombre}`}
                            placeholder="—"
                            title={error}
                            className={cn(
                              "rounded-field border-ink/14 bg-paper w-[72px] border px-2 py-[8px] text-center text-sm tabular-nums",
                              "focus:border-gold focus:shadow-[0_0_0_3px_rgba(198,161,91,0.16)] focus:outline-none",
                              "disabled:bg-ink/3 disabled:text-ink/30",
                              valor === "" && t.activo && "border-gold/50 bg-gold/6",
                              error && "border-clay bg-clay/6",
                            )}
                          />
                        </td>
                      );
                    })}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="border-ink/7 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
        <span className={cn("text-[12px]", cambios > 0 ? "text-gold-deep font-medium" : "text-ink/45")}>
          {cambios === 0 ? "Sin cambios pendientes" : `${cambios} ${cambios === 1 ? "cambio" : "cambios"} sin guardar`}
        </span>
        <Boton type="submit" disabled={enviando} tamano="sm">
          {enviando ? "GUARDANDO…" : "GUARDAR MATRIZ"}
        </Boton>
      </div>

      {estado?.error || estado?.ok ? (
        <div className="px-5 pb-4">
          <Aviso>{estado?.error}</Aviso>
          <Aviso tono="ok">{estado?.ok}</Aviso>
        </div>
      ) : null}
    </form>
  );
}
