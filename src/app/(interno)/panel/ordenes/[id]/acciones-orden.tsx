"use client";

import { useActionState, useState } from "react";
import { Ban, X } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area } from "@/components/ui/campo";
import { anularOrden } from "@/lib/acciones/ordenes";
import { esTerminal, type EstadoOrden } from "@/lib/reparaciones/estados";
import type { EstadoAccion } from "@/lib/validacion";

/**
 * Acciones de cabecera de la orden que no pertenecen a una pestaña. La
 * anulación pide motivo obligatorio; el resto de transiciones viven en sus
 * pestañas (cotizaciones, asignaciones, calidad, entrega).
 */
export function AccionesOrden({ orden }: { orden: { id: number; estado: EstadoOrden; numero: string } }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(anularOrden, null);

  if (esTerminal(orden.estado)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="border-clay/30 text-clay hover:bg-clay/8 rounded-field flex cursor-pointer items-center gap-2 border px-3 py-[8px] text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors"
      >
        <Ban size={14} /> Anular
      </button>

      {abierto ? (
        <div className="bg-ink/60 fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={() => setAbierto(false)}>
          <form
            action={accion}
            onClick={(e) => e.stopPropagation()}
            className="bg-paper rounded-panel flex w-full max-w-[460px] flex-col gap-4 p-6 shadow-2xl"
          >
            <input type="hidden" name="orden_id" value={orden.id} />
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-clay tracking-eyebrow text-[9px] font-medium">ANULAR ORDEN</span>
                <h3 className="font-display m-0 text-[20px] leading-tight font-normal">{orden.numero}</h3>
              </div>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-ink/40 hover:text-ink cursor-pointer"><X size={18} /></button>
            </div>
            <p className="text-ink/60 m-0 text-[12.5px] leading-relaxed">
              La orden queda cerrada como anulada y deja de aparecer entre las activas. El motivo se guarda en el historial.
            </p>
            <Area etiqueta="MOTIVO" name="motivo" placeholder="El cliente retiró la pieza sin cotizar…" error={estado?.campos?.motivo} required autoFocus />
            <Aviso>{estado?.error}</Aviso>
            <div className="flex justify-end gap-2">
              <Boton type="button" variante="fantasma" onClick={() => setAbierto(false)}>CANCELAR</Boton>
              <Boton type="submit" disabled={enviando} className="bg-clay text-white hover:bg-clay/90">{enviando ? "ANULANDO…" : "ANULAR ORDEN"}</Boton>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
