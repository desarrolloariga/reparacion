"use client";

import { useActionState, useState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area } from "@/components/ui/campo";
import { recibirPieza, registrarCalidad } from "@/lib/acciones/calidad";
import { cn } from "@/lib/utils";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioRecibir({ ordenId }: { ordenId: number }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(recibirPieza, null);
  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="orden_id" value={ordenId} />
      <Aviso>{estado?.error}</Aviso>
      <Boton type="submit" disabled={enviando} className="py-[14px]">{enviando ? "RECIBIENDO…" : "RECIBIR PIEZA DEL JOYERO"}</Boton>
    </form>
  );
}

export function FormularioCalidad({ ordenId, joyero }: { ordenId: number; joyero: string }) {
  const [resultado, setResultado] = useState<"aprobado" | "rechazado">("aprobado");
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(registrarCalidad, null);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="orden_id" value={ordenId} />
      <input type="hidden" name="resultado" value={resultado} />
      <div className="grid grid-cols-2 gap-2">
        {(["aprobado", "rechazado"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setResultado(r)}
            className={cn(
              "rounded-card cursor-pointer border px-4 py-3 text-left transition-colors",
              resultado === r ? (r === "aprobado" ? "border-sage bg-sage/8" : "border-clay bg-clay/6") : "border-ink/12 hover:border-gold/60",
            )}
          >
            <span className="block text-[13px] font-medium">{r === "aprobado" ? "Aprobar" : "Rechazar"}</span>
            <span className="text-ink/45 block text-[11px]">{r === "aprobado" ? "Queda lista para entrega" : `Vuelve a ${joyero} como retrabajo sin costo`}</span>
          </button>
        ))}
      </div>
      <Area
        etiqueta={resultado === "rechazado" ? "QUÉ FALLÓ (EL JOYERO LO VERÁ)" : "OBSERVACIONES (OPCIONAL)"}
        name="observaciones"
        placeholder={resultado === "rechazado" ? "La piedra quedó floja; el pulido tiene marcas…" : "Todo correcto"}
        error={estado?.campos?.observaciones}
        required={resultado === "rechazado"}
      />
      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>
      <Boton type="submit" disabled={enviando} className={cn("py-[14px]", resultado === "rechazado" && "bg-clay hover:bg-clay/90 text-white")}>
        {enviando ? "GUARDANDO…" : resultado === "aprobado" ? "APROBAR CALIDAD" : "RECHAZAR Y DEVOLVER AL JOYERO"}
      </Boton>
    </form>
  );
}
