"use client";

import { useActionState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { guardarComplejidad } from "@/lib/acciones/catalogos";
import type { Complejidad } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";

export function FilaComplejidad({ complejidad }: { complejidad: Complejidad }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(guardarComplejidad, null);
  const campo = (n: string) => estado?.campos?.[n];

  return (
    <form action={accion} className="grid items-end gap-3 sm:grid-cols-[72px_160px_minmax(0,1fr)_auto]">
      <input type="hidden" name="id" value={complejidad.id} />
      <Campo etiqueta="ORDEN" name="orden" type="number" min={1} max={20} defaultValue={complejidad.orden} error={campo("orden")} required />
      <Campo etiqueta="NOMBRE" name="nombre" defaultValue={complejidad.nombre} error={campo("nombre")} required />
      <Campo etiqueta="DESCRIPCIÓN" name="descripcion" defaultValue={complejidad.descripcion ?? ""} placeholder="Cuándo aplica" error={campo("descripcion")} />
      <Boton type="submit" tamano="sm" variante="contorno" disabled={enviando} className="py-[13px]">
        {enviando ? "…" : "GUARDAR"}
      </Boton>
      <div className="sm:col-span-4">
        <Aviso>{estado?.error}</Aviso>
        <Aviso tono="ok">{estado?.ok}</Aviso>
      </div>
    </form>
  );
}
