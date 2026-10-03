import { Chip } from "@/components/ui/chip";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import type { AsignacionListada, CandidatoConCosto } from "@/lib/datos/asignaciones";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { fecha, moneda } from "@/lib/format";

import { DialogoAsignar, FormularioAnularAsignacion } from "./dialogo-asignar";

const TONO: Record<string, "neutro" | "oro" | "exito" | "error" | "oscuro" | "tenue"> = {
  asignada: "oro",
  en_proceso: "oscuro",
  terminada: "exito",
  rechazada_calidad: "error",
  cerrada: "tenue",
  anulada: "tenue",
};
const ETIQUETA: Record<string, string> = {
  asignada: "Asignada",
  en_proceso: "En proceso",
  terminada: "Terminada",
  rechazada_calidad: "Rechazada en calidad",
  cerrada: "Cerrada (pagada)",
  anulada: "Anulada",
};

export function TabAsignaciones({
  datos,
  asignaciones,
  lectura,
  extra,
}: {
  datos: OrdenCompleta;
  asignaciones: AsignacionListada[];
  lectura: boolean;
  extra: { candidatos: CandidatoConCosto[]; sugerida: string; tope: string | null; bloquearPorCapacidad: boolean; hoy: string } | null;
}) {
  const { orden } = datos;
  const f = (v: string | null) => (v ? fecha(v + "T12:00:00") : "—");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Asignaciones">
          <span className="text-ink/45 text-[12px]">{asignaciones.length} en total</span>
        </TarjetaEncabezado>
        {asignaciones.length === 0 ? (
          <Vacio
            titulo="Todavía sin joyero"
            descripcion={orden.estado === "aprobada" ? "Elige un joyero, pacta el costo y la fecha de compromiso." : "La orden se asigna cuando esté aprobada."}
            className="py-10"
          />
        ) : (
          <ul className="m-0 list-none divide-y divide-ink/6 p-0">
            {asignaciones.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium">{a.joyero}</span>
                    <Chip tono={TONO[a.estado] ?? "neutro"}>{ETIQUETA[a.estado] ?? a.estado}</Chip>
                    {a.es_retrabajo ? <Chip tono="error">Retrabajo sin costo</Chip> : null}
                    {a.excede_fecha_cliente ? <Chip tono="oro" title="Se asignó sabiendo que supera la fecha prometida al cliente">Supera promesa</Chip> : null}
                    {a.pagada ? <Chip tono="tenue">Pagada</Chip> : null}
                  </span>
                  {!lectura ? <span className="font-medium tabular-nums">{moneda(Number(a.costo_pactado))}</span> : null}
                </div>
                <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-4">
                  <Par etiqueta="Asignada" valor={f(a.fecha_asignacion)} />
                  <Par etiqueta="Compromiso" valor={f(a.fecha_compromiso)} />
                  <Par etiqueta="Inició" valor={f(a.fecha_inicio_real)} />
                  <Par etiqueta="Terminó" valor={f(a.fecha_terminado_real)} nota={a.desviacion_dias !== null ? `${a.dias_reales} días reales · desviación ${a.desviacion_dias > 0 ? "+" : ""}${a.desviacion_dias}` : undefined} />
                </dl>
                {a.instrucciones ? <p className="text-ink/70 m-0 text-[12.5px]">{a.instrucciones}</p> : null}
                {a.notas_joyero ? <p className="text-ink/60 m-0 text-[12px] italic">Joyero: {a.notas_joyero}</p> : null}
                {!lectura && a.estado === "asignada" ? <FormularioAnularAsignacion asignacionId={a.id} /> : null}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      {extra ? (
        <Tarjeta className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">ASIGNAR</span>
            <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Elegir joyero</h3>
          </div>
          <DialogoAsignar ordenId={orden.id} candidatos={extra.candidatos} sugerida={extra.sugerida} tope={extra.tope} bloquearPorCapacidad={extra.bloquearPorCapacidad} hoy={extra.hoy} diasEstimados={orden.dias_estimados ?? 0} fechaPrometida={orden.fecha_prometida_cliente} />
        </Tarjeta>
      ) : null}
    </div>
  );
}

function Par({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-ink/45 text-[10px] tracking-[0.1em] uppercase">{etiqueta}</dt>
      <dd className="m-0 tabular-nums">{valor}</dd>
      {nota ? <span className="text-ink/45 text-[10.5px]">{nota}</span> : null}
    </div>
  );
}
