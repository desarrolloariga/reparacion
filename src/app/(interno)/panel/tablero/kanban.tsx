"use client";

import { useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { ChipTipoOrden } from "@/components/ordenes/chip-estado";
import { Aviso } from "@/components/ui/aviso";
import { cambiarEstadoOrden } from "@/lib/acciones/ordenes-estado";
import type { EvaluacionSemaforo } from "@/lib/datos/semaforo";
import { describirRestantes, PUNTO_SEMAFORO } from "@/lib/reparaciones/semaforo";
import { destinosDesde, ESTADOS_KANBAN, ETIQUETA_CORTA_ESTADO, ETIQUETA_ESTADO, puedeTransitar, type EstadoOrden } from "@/lib/reparaciones/estados";
import type { CategoriaTrabajo } from "@/lib/supabase/modelo";
import { cn } from "@/lib/utils";

type Tarjeta = {
  id: number;
  numero: string;
  tipo: CategoriaTrabajo;
  estado: EstadoOrden;
  cliente: string;
  descripcion_pieza: string;
  joyero: string | null;
  evaluacion: EvaluacionSemaforo;
};

/**
 * Kanban por estado. Arrastrar dispara la transición (drag & drop nativo,
 * sin librería); en móvil cada tarjeta tiene «Mover a…». Una transición
 * inválida se rechaza con el motivo que da la base: las que exigen datos
 * (asignar, entregar…) se hacen desde la ficha de la orden.
 */
export function Kanban({ ordenes, editable }: { ordenes: Tarjeta[]; editable: boolean }) {
  const router = useRouter();
  const [arrastrando, setArrastrando] = useState<Tarjeta | null>(null);
  const [sobre, setSobre] = useState<EstadoOrden | null>(null);
  const [mensaje, setMensaje] = useState<{ tono: "error" | "ok"; texto: string } | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const [pendiente, iniciar] = useTransition();

  function mover(o: Tarjeta, destino: EstadoOrden) {
    setMenu(null);
    if (o.estado === destino) return;
    if (!puedeTransitar(o.estado, destino)) {
      setMensaje({ tono: "error", texto: `${o.numero}: una orden ${ETIQUETA_ESTADO[o.estado].toLowerCase()} no puede pasar a ${ETIQUETA_ESTADO[destino].toLowerCase()}.` });
      return;
    }
    iniciar(async () => {
      const r = await cambiarEstadoOrden(o.id, destino, destino === "anulada" ? "Anulada desde el tablero" : undefined);
      if (r.ok) {
        setMensaje({ tono: "ok", texto: `${o.numero} → ${ETIQUETA_ESTADO[destino]}.` });
        router.refresh();
      } else {
        setMensaje({ tono: "error", texto: `${o.numero}: ${r.error}` });
      }
    });
  }

  function alSoltar(e: DragEvent, destino: EstadoOrden) {
    e.preventDefault();
    setSobre(null);
    if (arrastrando) mover(arrastrando, destino);
    setArrastrando(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {mensaje ? <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso> : null}
      <div className={cn("flex gap-3 overflow-x-auto pb-3", pendiente && "opacity-60")}>
        {ESTADOS_KANBAN.map((estado) => {
          const lista = ordenes.filter((o) => o.estado === estado);
          const aceptaArrastre = arrastrando ? puedeTransitar(arrastrando.estado, estado) : false;
          return (
            <section
              key={estado}
              onDragOver={(e) => { if (editable && aceptaArrastre) { e.preventDefault(); setSobre(estado); } }}
              onDragLeave={() => setSobre((s) => (s === estado ? null : s))}
              onDrop={(e) => editable && aceptaArrastre && alSoltar(e, estado)}
              className={cn(
                "bg-paper border-ink/7 rounded-card flex w-[250px] shrink-0 flex-col border transition-colors",
                sobre === estado && aceptaArrastre && "border-gold bg-gold/6",
                arrastrando && !aceptaArrastre && "opacity-50",
              )}
            >
              <header className="border-ink/7 flex items-center justify-between border-b px-3 py-2">
                <span className="text-[10px] font-semibold tracking-[0.14em] uppercase">{ETIQUETA_CORTA_ESTADO[estado]}</span>
                <span className="bg-ink/6 text-ink/55 rounded-[9px] px-[7px] py-[1px] text-[10px]">{lista.length}</span>
              </header>
              <ul className="m-0 flex min-h-[80px] list-none flex-col gap-2 p-2">
                {lista.map((o) => (
                  <li
                    key={o.id}
                    draggable={editable}
                    onDragStart={() => setArrastrando(o)}
                    onDragEnd={() => { setArrastrando(null); setSobre(null); }}
                    className={cn("bg-bone border-ink/8 rounded-card relative flex flex-col gap-1 border p-2 text-[12px]", editable && "cursor-grab active:cursor-grabbing")}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <Link href={`/panel/ordenes/${o.id}`} className="hover:text-gold-dark font-mono text-[11.5px] font-medium">{o.numero}</Link>
                      <span className="flex items-center gap-1">
                        <ChipTipoOrden tipo={o.tipo} />
                        {editable ? (
                          <button type="button" onClick={() => setMenu(menu === o.id ? null : o.id)} aria-label="Mover a" className="text-ink/40 hover:text-ink cursor-pointer"><MoreHorizontal size={14} /></button>
                        ) : null}
                      </span>
                    </span>
                    <span className="truncate font-medium">{o.descripcion_pieza}</span>
                    <span className="text-ink/55 truncate">{o.cliente}{o.joyero ? ` · ${o.joyero}` : ""}</span>
                    {o.evaluacion.semaforo && o.evaluacion.dias !== null ? (
                      <span className="flex items-center gap-1 text-[11px]">
                        <span className={cn("inline-block size-2 rounded-full", PUNTO_SEMAFORO[o.evaluacion.semaforo])} />
                        <span className={o.evaluacion.semaforo === "vencido" ? "text-clay" : "text-ink/60"}>{describirRestantes(o.evaluacion.dias)}</span>
                      </span>
                    ) : null}
                    {menu === o.id ? (
                      <ul className="bg-paper border-ink/10 rounded-card absolute top-8 right-2 z-10 m-0 flex min-w-[170px] list-none flex-col border p-1 shadow-lg">
                        {destinosDesde(o.estado).map((d) => (
                          <li key={d}>
                            <button type="button" onClick={() => mover(o, d)} className="hover:bg-gold/8 w-full cursor-pointer rounded px-2 py-1 text-left text-[12px]">
                              → {ETIQUETA_ESTADO[d]}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="text-ink/45 m-0 text-[11px] leading-relaxed">
        Arrastra una tarjeta a otra columna para cambiar el estado. Las transiciones que necesitan datos —asignar joyero, aprobar cotización, registrar calidad, entregar— se hacen desde la ficha de la orden; el tablero las rechaza con el motivo.
      </p>
    </div>
  );
}
