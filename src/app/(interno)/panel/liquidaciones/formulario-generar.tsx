"use client";

import { useActionState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { generarLiquidacion } from "@/lib/acciones/liquidaciones";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioGenerar({ joyeroId, desde, hasta }: { joyeroId: number; desde: string; hasta: string }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(generarLiquidacion, null);
  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="joyero_id" value={joyeroId} />
      <input type="hidden" name="desde" value={desde} />
      <input type="hidden" name="hasta" value={hasta} />
      <Aviso>{estado?.error}</Aviso>
      <Boton type="submit" disabled={enviando} className="py-[14px]">{enviando ? "GENERANDO…" : "GENERAR BORRADOR"}</Boton>
    </form>
  );
}
