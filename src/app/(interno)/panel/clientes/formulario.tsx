"use client";

import { useActionState, useEffect, useRef } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo } from "@/components/ui/campo";
import { guardarCliente } from "@/lib/acciones/clientes";
import type { Cliente } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioCliente({ inicial, volverA }: { inicial: Cliente | null; volverA?: string }) {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(guardarCliente, null);
  const campo = (n: string) => estado?.campos?.[n];

  useEffect(() => {
    if (estado?.ok && !inicial) formulario.current?.reset();
  }, [estado, inicial]);

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={inicial?.id ?? ""} />
      {volverA ? <input type="hidden" name="volver_a" value={volverA} /> : null}

      <Campo etiqueta="NOMBRE" name="nombre" defaultValue={inicial?.nombre ?? ""} placeholder="Nombre y apellidos" error={campo("nombre")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="TELÉFONO" name="telefono" type="tel" defaultValue={inicial?.telefono ?? ""} placeholder="5512 3456" error={campo("telefono")} />
        <Campo etiqueta="CORREO" name="correo" type="email" defaultValue={inicial?.correo ?? ""} placeholder="cliente@correo.com" error={campo("correo")} />
      </div>
      <Campo etiqueta="DIRECCIÓN" name="direccion" defaultValue={inicial?.direccion ?? ""} error={campo("direccion")} />
      <Area etiqueta="NOTAS" name="notas" defaultValue={inicial?.notas ?? ""} placeholder="Preferencias, cómo prefiere que le avisen…" error={campo("notas")} />

      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>

      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "GUARDANDO…" : inicial ? "GUARDAR CAMBIOS" : "CREAR CLIENTE"}
      </Boton>
    </form>
  );
}
