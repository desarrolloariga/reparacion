"use client";

import { useActionState, useEffect, useRef } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { guardarDia } from "@/lib/acciones/calendario";
import type { DiaCalendario } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioDia({ inicial }: { inicial: DiaCalendario | null }) {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(guardarDia, null);

  useEffect(() => {
    if (estado?.ok && !inicial) formulario.current?.reset();
  }, [estado, inicial]);

  const campo = (n: string) => estado?.campos?.[n];

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={inicial?.id ?? ""} />
      <Campo etiqueta="FECHA" name="fecha" type="date" defaultValue={inicial?.fecha ?? ""} error={campo("fecha")} required />
      <Selector etiqueta="EL TALLER" name="es_habil" defaultValue={inicial ? String(inicial.es_habil) : "false"} error={campo("es_habil")}>
        <option value="false">Cierra (feriado)</option>
        <option value="true">Abre (día extraordinario)</option>
      </Selector>
      <Campo etiqueta="DESCRIPCIÓN (OPCIONAL)" name="descripcion" defaultValue={inicial?.descripcion ?? ""} placeholder="Semana Santa, inventario…" error={campo("descripcion")} />

      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>

      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "GUARDANDO…" : inicial ? "GUARDAR CAMBIOS" : "AGREGAR AL CALENDARIO"}
      </Boton>
    </form>
  );
}
