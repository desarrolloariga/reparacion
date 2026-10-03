"use client";

import { useActionState, useEffect, useRef } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { agregarTarifa } from "@/lib/acciones/joyeros";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioTarifa({
  joyeroId,
  tipos,
  complejidades,
  hoy,
}: {
  joyeroId: number;
  tipos: { id: number; nombre: string; categoria: CategoriaTrabajo }[];
  complejidades: { id: number; nombre: string }[];
  hoy: string;
}) {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(agregarTarifa, null);
  const campo = (n: string) => estado?.campos?.[n];

  useEffect(() => {
    if (estado?.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="joyero_id" value={joyeroId} />

      <Selector etiqueta="TIPO DE TRABAJO" name="tipo_trabajo_id" defaultValue="" error={campo("tipo_trabajo_id")} required>
        <option value="" disabled>Elige un trabajo</option>
        {CATEGORIAS.map((c) => (
          <optgroup key={c} label={ETIQUETA_CATEGORIA[c]}>
            {tipos.filter((t) => t.categoria === c).map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </optgroup>
        ))}
      </Selector>

      <div className="grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="COMPLEJIDAD" name="complejidad_id" defaultValue="" ayuda="«Todas» aplica si no hay una específica." error={campo("complejidad_id")}>
          <option value="">Todas</option>
          {complejidades.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </Selector>
        <Campo etiqueta="COSTO (Q)" name="costo_acordado" type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" error={campo("costo_acordado")} required />
      </div>

      <Campo etiqueta="VIGENTE DESDE" name="vigente_desde" type="date" defaultValue={hoy} error={campo("vigente_desde")} required />

      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>

      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "GUARDANDO…" : "AGREGAR TARIFA"}
      </Boton>
    </form>
  );
}
