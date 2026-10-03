"use client";

import { useActionState, useEffect, useRef } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { guardarEspecialidad } from "@/lib/acciones/catalogos";
import type { Especialidad } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioEspecialidad({ inicial }: { inicial: Especialidad | null }) {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(guardarEspecialidad, null);

  useEffect(() => {
    if (estado?.ok && !inicial) formulario.current?.reset();
  }, [estado, inicial]);

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={inicial?.id ?? ""} />
      <Campo
        etiqueta="NOMBRE"
        name="nombre"
        defaultValue={inicial?.nombre ?? ""}
        placeholder="Engaste, Soldadura…"
        error={estado?.campos?.nombre}
        required
        autoFocus={Boolean(inicial)}
      />
      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>
      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "GUARDANDO…" : inicial ? "GUARDAR CAMBIOS" : "CREAR ESPECIALIDAD"}
      </Boton>
    </form>
  );
}
