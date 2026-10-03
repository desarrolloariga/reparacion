"use client";

import { useActionState, useEffect, useRef } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo, Selector } from "@/components/ui/campo";
import { guardarTipoTrabajo } from "@/lib/acciones/catalogos";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type TipoTrabajo } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioTipoTrabajo({
  inicial,
  especialidades,
}: {
  inicial: TipoTrabajo | null;
  especialidades: { id: number; nombre: string }[];
}) {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(guardarTipoTrabajo, null);

  useEffect(() => {
    if (estado?.ok && !inicial) formulario.current?.reset();
  }, [estado, inicial]);

  const campo = (n: string) => estado?.campos?.[n];

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={inicial?.id ?? ""} />

      <Campo
        etiqueta="NOMBRE"
        name="nombre"
        defaultValue={inicial?.nombre ?? ""}
        placeholder="Cambio de medida"
        error={campo("nombre")}
        required
      />

      <Selector etiqueta="CATEGORÍA" name="categoria" defaultValue={inicial?.categoria ?? "reparacion"} error={campo("categoria")}>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>{ETIQUETA_CATEGORIA[c]}</option>
        ))}
      </Selector>

      <Selector
        etiqueta="ESPECIALIDAD"
        name="especialidad_id"
        defaultValue={inicial?.especialidad_id ?? ""}
        ayuda="Sirve para sugerir joyeros al asignar."
      >
        <option value="">Sin especialidad</option>
        {especialidades.map((e) => (
          <option key={e.id} value={e.id}>{e.nombre}</option>
        ))}
      </Selector>

      <Area
        etiqueta="DESCRIPCIÓN (OPCIONAL)"
        name="descripcion"
        defaultValue={inicial?.descripcion ?? ""}
        placeholder="Qué incluye y qué no."
        error={campo("descripcion")}
      />

      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>

      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "GUARDANDO…" : inicial ? "GUARDAR CAMBIOS" : "CREAR TIPO"}
      </Boton>
    </form>
  );
}
