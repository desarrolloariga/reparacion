"use client";

import { useActionState, useState } from "react";
import { Ban, Check, PackageCheck, Truck, X } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Casilla } from "@/components/ui/campo";
import { recibirPieza } from "@/lib/acciones/calidad";
import { entregarOrden } from "@/lib/acciones/entrega";
import { anularOrden } from "@/lib/acciones/ordenes";
import { moneda } from "@/lib/format";
import { esTerminal, type EstadoOrden } from "@/lib/reparaciones/estados";
import type { EstadoAccion } from "@/lib/validacion";

/**
 * Acciones de cabecera de la orden: recibir la pieza del joyero, entregar
 * al cliente y anular. Las demás transiciones viven en sus pestañas.
 */
export function AccionesOrden({
  orden,
  entrega,
}: {
  orden: { id: number; estado: EstadoOrden; numero: string };
  entrega: { saldo: number; cobrado: number; precio: number; calidadOk: boolean; fotosSalida: number };
}) {
  const [dialogo, setDialogo] = useState<"anular" | "entregar" | null>(null);
  const [anulado, anular, anulando] = useActionState<EstadoAccion, FormData>(anularOrden, null);
  const [recibido, recibir, recibiendo] = useActionState<EstadoAccion, FormData>(recibirPieza, null);
  const [entregado, entregar, entregando] = useActionState<EstadoAccion, FormData>(entregarOrden, null);

  if (esTerminal(orden.estado)) return null;

  const requisitos = [
    { ok: entrega.calidadOk, texto: "Control de calidad aprobado" },
    { ok: entrega.fotosSalida > 0, texto: "Al menos una fotografía de salida" },
    { ok: entrega.saldo <= 0.009, texto: entrega.saldo > 0.009 ? `Saldo pendiente: ${moneda(entrega.saldo)}` : "Saldo en cero" },
  ];
  const listo = requisitos.slice(0, 2).every((r) => r.ok);

  return (
    <>
      {orden.estado === "terminada_joyero" ? (
        <form action={recibir}>
          <input type="hidden" name="orden_id" value={orden.id} />
          <button type="submit" disabled={recibiendo} className="bg-ink text-gold-light hover:bg-ink-raised rounded-field flex cursor-pointer items-center gap-2 px-4 py-[8px] text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors disabled:opacity-50">
            <PackageCheck size={14} /> {recibiendo ? "Recibiendo…" : "Recibir pieza"}
          </button>
          {recibido?.error ? <span className="text-clay ml-2 text-[11px]">{recibido.error}</span> : null}
        </form>
      ) : null}

      {orden.estado === "lista_entrega" ? (
        <button type="button" onClick={() => setDialogo("entregar")} className="bg-ink text-gold-light hover:bg-ink-raised rounded-field flex cursor-pointer items-center gap-2 px-4 py-[8px] text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors">
          <Truck size={14} /> Entregar
        </button>
      ) : null}

      <button type="button" onClick={() => setDialogo("anular")} className="border-clay/30 text-clay hover:bg-clay/8 rounded-field flex cursor-pointer items-center gap-2 border px-3 py-[8px] text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors">
        <Ban size={14} /> Anular
      </button>

      {dialogo === "anular" ? (
        <Modal onCerrar={() => setDialogo(null)}>
          <form action={anular} className="flex flex-col gap-4">
            <input type="hidden" name="orden_id" value={orden.id} />
            <Encabezado eyebrow="ANULAR ORDEN" titulo={orden.numero} tono="clay" onCerrar={() => setDialogo(null)} />
            <p className="text-ink/60 m-0 text-[12.5px] leading-relaxed">La orden queda cerrada como anulada y deja de aparecer entre las activas. El motivo se guarda en el historial.</p>
            <Area etiqueta="MOTIVO" name="motivo" placeholder="El cliente retiró la pieza sin cotizar…" error={anulado?.campos?.motivo} required autoFocus />
            <Aviso>{anulado?.error}</Aviso>
            <div className="flex justify-end gap-2">
              <Boton type="button" variante="fantasma" onClick={() => setDialogo(null)}>CANCELAR</Boton>
              <Boton type="submit" disabled={anulando} className="bg-clay hover:bg-clay/90 text-white">{anulando ? "ANULANDO…" : "ANULAR ORDEN"}</Boton>
            </div>
          </form>
        </Modal>
      ) : null}

      {dialogo === "entregar" ? (
        <Modal onCerrar={() => setDialogo(null)}>
          <form action={entregar} className="flex flex-col gap-4">
            <input type="hidden" name="orden_id" value={orden.id} />
            <Encabezado eyebrow="ENTREGAR AL CLIENTE" titulo={orden.numero} tono="gold" onCerrar={() => setDialogo(null)} />
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[12.5px]">
              {requisitos.map((r) => (
                <li key={r.texto} className={`flex items-center gap-2 ${r.ok ? "text-sage" : "text-clay"}`}>
                  {r.ok ? <Check size={14} /> : <X size={14} />} {r.texto}
                </li>
              ))}
            </ul>
            <div className="bg-bone rounded-card flex items-baseline justify-between px-4 py-3 text-[13px]">
              <span className="text-ink/55">Precio {moneda(entrega.precio)} · cobrado {moneda(entrega.cobrado)}</span>
              <span className={`font-display text-[20px] ${entrega.saldo > 0.009 ? "text-clay" : "text-sage"}`}>{entrega.saldo > 0.009 ? `saldo ${moneda(entrega.saldo)}` : "sin saldo"}</span>
            </div>
            {entrega.saldo > 0.009 ? (
              <Casilla name="con_saldo" etiqueta="Entregar con saldo pendiente" ayuda="Queda registrado en el historial. Lo normal es cobrar antes desde la pestaña Pagos." />
            ) : null}
            <Area etiqueta="COMENTARIO (OPCIONAL)" name="comentario" placeholder="Quién recogió, observaciones…" />
            <Aviso>{entregado?.error}</Aviso>
            <div className="flex justify-end gap-2">
              <Boton type="button" variante="fantasma" onClick={() => setDialogo(null)}>CANCELAR</Boton>
              <Boton type="submit" disabled={entregando || !listo}>{entregando ? "ENTREGANDO…" : "CONFIRMAR ENTREGA"}</Boton>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

export function Modal({ children, onCerrar }: { children: React.ReactNode; onCerrar: () => void }) {
  return (
    <div className="bg-ink/60 fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={onCerrar}>
      <div onClick={(e) => e.stopPropagation()} className="bg-paper rounded-panel max-h-[92vh] w-full max-w-[520px] overflow-y-auto p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function Encabezado({ eyebrow, titulo, tono = "gold", onCerrar }: { eyebrow: string; titulo: string; tono?: "gold" | "clay"; onCerrar: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className={`tracking-eyebrow text-[9px] font-medium ${tono === "clay" ? "text-clay" : "text-gold-dark"}`}>{eyebrow}</span>
        <h3 className="font-display m-0 text-[20px] leading-tight font-normal">{titulo}</h3>
      </div>
      <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-ink/40 hover:text-ink cursor-pointer"><X size={18} /></button>
    </div>
  );
}
