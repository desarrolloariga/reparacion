"use client";

import { useActionState, useState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { aprobarDiseno } from "@/lib/acciones/disenos";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioAprobarDiseno({ disenoId, version }: { disenoId: number; version: number }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(aprobarDiseno, null);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="border-sage/40 text-sage hover:bg-sage/8 rounded-field cursor-pointer border px-3 py-[6px] text-[11px] transition-colors">
        Marcar aprobado por el cliente
      </button>
    );
  }

  return (
    <form action={accion} className="border-sage/30 bg-sage/6 rounded-card flex w-full flex-col gap-3 border p-3">
      <input type="hidden" name="diseno_id" value={disenoId} />
      <Campo etiqueta={`COMENTARIOS DEL CLIENTE SOBRE V${version} (OPCIONAL)`} name="comentarios_cliente" placeholder="Quiere la piedra un poco más alta…" />
      <Aviso>{estado?.error}</Aviso>
      <div className="flex gap-2">
        <Boton type="submit" tamano="sm" disabled={enviando}>{enviando ? "GUARDANDO…" : "CONFIRMAR APROBACIÓN"}</Boton>
        <Boton type="button" tamano="sm" variante="fantasma" onClick={() => setAbierto(false)}>CANCELAR</Boton>
      </div>
    </form>
  );
}
