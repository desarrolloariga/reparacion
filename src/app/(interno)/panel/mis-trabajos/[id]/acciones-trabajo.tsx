"use client";

import { useActionState, useState } from "react";
import { Check, Hammer } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { guardarNotasJoyero, iniciarTrabajo, terminarTrabajo } from "@/lib/acciones/trabajos";
import type { EstadoAccion } from "@/lib/validacion";

/** Dos botones con confirmación; la fecha la pone el servidor. */
export function AccionesTrabajo({ asignacionId, estado, notas }: { asignacionId: number; estado: string; notas: string | null }) {
  const [confirmando, setConfirmando] = useState<"iniciar" | "terminar" | null>(null);
  const [iniciado, iniciar, iniciando] = useActionState<EstadoAccion, FormData>(iniciarTrabajo, null);
  const [terminado, terminar, terminando] = useActionState<EstadoAccion, FormData>(terminarTrabajo, null);
  const [notasEstado, guardarNotas, guardando] = useActionState<EstadoAccion, FormData>(guardarNotasJoyero, null);

  if (estado !== "asignada" && estado !== "en_proceso") {
    return (
      <Tarjeta className="flex flex-col gap-2 p-6">
        <span className="text-sage flex items-center gap-2 text-[13px] font-medium"><Check size={16} /> Trabajo terminado</span>
        {notas ? <p className="text-ink/60 m-0 text-[12.5px] italic">Tus notas: {notas}</p> : null}
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="flex flex-col gap-4 p-6">
      {estado === "asignada" ? (
        confirmando === "iniciar" ? (
          <form action={iniciar} className="flex flex-col gap-3">
            <input type="hidden" name="asignacion_id" value={asignacionId} />
            <p className="m-0 text-[13px]">¿Empiezas este trabajo ahora? Se registra la fecha de inicio.</p>
            <Aviso>{iniciado?.error}</Aviso>
            <div className="flex gap-2">
              <Boton type="submit" disabled={iniciando} className="flex-1 py-[14px]">{iniciando ? "…" : "SÍ, INICIAR"}</Boton>
              <Boton type="button" variante="fantasma" onClick={() => setConfirmando(null)}>NO</Boton>
            </div>
          </form>
        ) : (
          <Boton type="button" onClick={() => setConfirmando("iniciar")} className="flex items-center justify-center gap-2 py-[16px] text-[13px]">
            <Hammer size={16} /> INICIAR TRABAJO
          </Boton>
        )
      ) : null}

      {estado === "en_proceso" ? (
        confirmando === "terminar" ? (
          <form action={terminar} className="flex flex-col gap-3">
            <input type="hidden" name="asignacion_id" value={asignacionId} />
            <p className="m-0 text-[13px]">¿La pieza está lista para que el taller la reciba? Se registra la fecha de hoy.</p>
            <Area etiqueta="NOTAS PARA EL TALLER (OPCIONAL)" name="notas_joyero" defaultValue={notas ?? ""} placeholder="Qué se hizo, qué conviene revisar…" />
            <Aviso>{terminado?.error}</Aviso>
            <div className="flex gap-2">
              <Boton type="submit" disabled={terminando} className="flex-1 py-[14px]">{terminando ? "…" : "SÍ, MARCAR TERMINADO"}</Boton>
              <Boton type="button" variante="fantasma" onClick={() => setConfirmando(null)}>NO</Boton>
            </div>
          </form>
        ) : (
          <Boton type="button" onClick={() => setConfirmando("terminar")} className="flex items-center justify-center gap-2 py-[16px] text-[13px]">
            <Check size={16} /> MARCAR TERMINADO
          </Boton>
        )
      ) : null}

      {confirmando === null ? (
        <form action={guardarNotas} className="border-ink/8 flex flex-col gap-3 border-t pt-4">
          <input type="hidden" name="asignacion_id" value={asignacionId} />
          <Area etiqueta="MIS NOTAS" name="notas_joyero" defaultValue={notas ?? ""} placeholder="Avances, dudas, lo que el taller debe saber" />
          <Aviso>{notasEstado?.error}</Aviso>
          <Aviso tono="ok">{notasEstado?.ok}</Aviso>
          <Boton type="submit" tamano="sm" variante="contorno" disabled={guardando} className="self-start">{guardando ? "…" : "GUARDAR NOTAS"}</Boton>
        </form>
      ) : null}
    </Tarjeta>
  );
}
