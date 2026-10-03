"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo, Casilla } from "@/components/ui/campo";
import { Chip } from "@/components/ui/chip";
import { anularAsignacion, asignarJoyero } from "@/lib/acciones/asignaciones";
import type { CandidatoConCosto } from "@/lib/datos/asignaciones";
import { moneda } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EstadoAccion } from "@/lib/validacion";

/**
 * Diálogo de asignación: joyeros ordenados por coincidencia de especialidad,
 * con carga, cumplimiento, retrabajo y costo sugerido. Si la fecha supera
 * el tope frente al cliente, se advierte y hay que confirmar; no se bloquea.
 */
export function DialogoAsignar({
  ordenId,
  candidatos,
  sugerida,
  tope,
  bloquearPorCapacidad,
  hoy,
  diasEstimados,
  fechaPrometida,
}: {
  ordenId: number;
  candidatos: CandidatoConCosto[];
  sugerida: string;
  tope: string | null;
  bloquearPorCapacidad: boolean;
  hoy: string;
  diasEstimados: number;
  fechaPrometida: string | null;
}) {
  const [joyeroId, setJoyeroId] = useState<number | null>(candidatos[0]?.id ?? null);
  const [costo, setCosto] = useState<string>(candidatos[0]?.costo_sugerido !== null && candidatos[0]?.costo_sugerido !== undefined ? String(candidatos[0].costo_sugerido) : "");
  const [fechaCompromiso, setFechaCompromiso] = useState(sugerida);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(asignarJoyero, null);

  const elegido = useMemo(() => candidatos.find((c) => c.id === joyeroId) ?? null, [candidatos, joyeroId]);
  const excede = Boolean(tope && fechaCompromiso > tope);
  const capacidadLlena = Boolean(elegido?.capacidad_llena);

  function elegir(c: CandidatoConCosto) {
    setJoyeroId(c.id);
    if (c.costo_sugerido !== null) setCosto(String(c.costo_sugerido));
  }

  if (candidatos.length === 0) {
    return <Aviso tono="aviso">No hay joyeros activos. Registra uno en Joyeros.</Aviso>;
  }

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="orden_id" value={ordenId} />
      <input type="hidden" name="joyero_id" value={joyeroId ?? ""} />

      <ul className="m-0 flex max-h-[320px] list-none flex-col gap-2 overflow-y-auto p-0">
        {candidatos.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => elegir(c)}
              className={cn(
                "rounded-card flex w-full cursor-pointer flex-col gap-1 border px-3 py-2 text-left transition-colors",
                c.id === joyeroId ? "border-gold bg-gold/8" : "border-ink/10 hover:border-gold/60",
              )}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-medium">{c.nombre}</span>
                <span className="flex items-center gap-1">
                  {c.coincidencias > 0 ? <Chip tono="oro">{c.coincidencias} esp.</Chip> : <Chip tono="tenue">sin esp.</Chip>}
                  <Chip tono={c.capacidad_llena ? "error" : "neutro"}>{c.activas}/{c.capacidad_maxima}</Chip>
                </span>
              </span>
              <span className="text-ink/50 flex flex-wrap gap-x-3 text-[11px]">
                <span>cumple {c.cumplimiento_pct === null ? "—" : `${c.cumplimiento_pct}%`}</span>
                <span>retrabajo {c.retrabajo_pct === null ? "—" : `${c.retrabajo_pct}%`}</span>
                <span className={c.costo_sugerido === null ? "text-clay" : ""}>
                  {c.costo_sugerido === null ? "sin tarifa" : `tarifa ${moneda(c.costo_sugerido)}${c.lineas_sin_tarifa > 0 ? ` (${c.lineas_sin_tarifa} sin tarifa)` : ""}`}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {capacidadLlena ? (
        <Aviso tono={bloquearPorCapacidad ? "error" : "aviso"}>
          {elegido?.nombre} ya alcanzó su capacidad ({elegido?.activas} de {elegido?.capacidad_maxima}). {bloquearPorCapacidad ? "El parámetro bloquea la asignación." : "Se puede asignar de todos modos."}
        </Aviso>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="COSTO PACTADO (Q)" name="costo_pactado" type="number" min={0.01} step="0.01" inputMode="decimal" value={costo} onChange={(e) => setCosto(e.target.value)} error={estado?.campos?.costo_pactado} required />
        <Campo etiqueta="FECHA DE COMPROMISO" name="fecha_compromiso" type="date" min={hoy} value={fechaCompromiso} onChange={(e) => setFechaCompromiso(e.target.value)} error={estado?.campos?.fecha_compromiso} ayuda={`Sugerida: ${sugerida} (${diasEstimados} días hábiles)`} required />
      </div>

      {excede ? (
        <div className="border-clay/30 bg-clay/6 rounded-card flex flex-col gap-2 border p-3 text-[12px]">
          <span className="text-clay flex items-center gap-2 font-medium"><AlertTriangle size={14} /> La fecha que puede cumplir el joyero supera la fecha prometida al cliente.</span>
          <span className="text-ink/60">Prometida al cliente: {fechaPrometida} · tope para el joyero: {tope}. Dos salidas: ajustar la fecha del cliente (pestaña Pieza) o asignar de todos modos dejando constancia en el historial.</span>
          <Casilla name="asignar_de_todos_modos" etiqueta="Asignar de todos modos (queda registrado)" />
        </div>
      ) : null}

      <Area etiqueta="INSTRUCCIONES PARA EL JOYERO" name="instrucciones" placeholder="Qué hacer, qué cuidar, qué no tocar…" />
      <Campo etiqueta="COMENTARIO INTERNO (OPCIONAL)" name="comentario" placeholder="Va al historial" />

      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>

      <Boton type="submit" disabled={enviando || !joyeroId || (capacidadLlena && bloquearPorCapacidad)} className="py-[14px]">
        {enviando ? "ASIGNANDO…" : "ASIGNAR"}
      </Boton>
    </form>
  );
}

export function FormularioAnularAsignacion({ asignacionId }: { asignacionId: number }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(anularAsignacion, null);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="text-ink/45 hover:text-clay cursor-pointer self-start text-[11px] underline-offset-2 hover:underline">
        Anular asignación
      </button>
    );
  }
  return (
    <form action={accion} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="asignacion_id" value={asignacionId} />
      <Campo etiqueta="MOTIVO" name="motivo" placeholder="Por qué se anula" className="min-w-[220px]" />
      <Boton type="submit" tamano="sm" variante="contorno" disabled={enviando} className="text-clay border-clay/40">{enviando ? "…" : "ANULAR"}</Boton>
      <Boton type="button" tamano="sm" variante="fantasma" onClick={() => setAbierto(false)}>CANCELAR</Boton>
      <Aviso>{estado?.error}</Aviso>
    </form>
  );
}
