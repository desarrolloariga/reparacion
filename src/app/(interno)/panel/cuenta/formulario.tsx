"use client";

import { useActionState, useEffect, useRef } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { cambiarMiClave, type EstadoMiClave } from "@/lib/acciones/usuarios";

export function FormularioMiClave() {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoMiClave, FormData>(cambiarMiClave, null);

  useEffect(() => {
    if (estado?.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <Campo etiqueta="CONTRASEÑA ACTUAL" name="actual" type="password" autoComplete="current-password" required />
      <Campo
        etiqueta="CONTRASEÑA NUEVA"
        name="nueva"
        type="password"
        autoComplete="new-password"
        ayuda="Al menos 8 caracteres, con letras y números."
        required
      />
      <Campo etiqueta="REPETIR CONTRASEÑA NUEVA" name="repetida" type="password" autoComplete="new-password" required />

      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>

      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "GUARDANDO…" : "CAMBIAR CONTRASEÑA"}
      </Boton>
    </form>
  );
}
