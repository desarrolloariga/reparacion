import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ChipTipoOrden } from "@/components/ordenes/chip-estado";
import { Semaforo } from "@/components/ordenes/semaforo";
import { Chip } from "@/components/ui/chip";
import { Tarjeta } from "@/components/ui/tarjeta";
import { requerirJoyero } from "@/lib/auth/guardas";
import { evaluarSemaforos } from "@/lib/datos/semaforo";
import { trabajoDeJoyero } from "@/lib/datos/trabajos-joyero";
import { fecha } from "@/lib/format";

import { AccionesTrabajo } from "./acciones-trabajo";

export const metadata: Metadata = { title: "Trabajo" };

export default async function PaginaTrabajo({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirJoyero();
  const { id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const t = await trabajoDeJoyero(sesion.joyeroId, id);
  if (!t) notFound();
  const activo = t.estado_asignacion === "asignada" || t.estado_asignacion === "en_proceso";
  const semaforos = activo ? await evaluarSemaforos([{ id: t.asignacion_id, fecha_control: t.fecha_compromiso }]) : new Map();

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <Link href="/panel/mis-trabajos" className="text-ink/50 hover:text-ink flex items-center gap-1 text-[11px]"><ArrowLeft size={12} /> Mis trabajos</Link>

      <Tarjeta className="flex flex-col gap-4 p-6">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[13px] font-medium">{t.numero}</span>
          <ChipTipoOrden tipo={t.tipo} />
          {t.es_retrabajo ? <Chip tono="error">Retrabajo</Chip> : null}
          <Chip tono={t.estado_asignacion === "en_proceso" ? "oscuro" : t.estado_asignacion === "asignada" ? "oro" : "exito"}>
            {t.estado_asignacion === "asignada" ? "Por iniciar" : t.estado_asignacion === "en_proceso" ? "En proceso" : "Terminado"}
          </Chip>
        </span>
        <h2 className="font-display m-0 text-[24px] leading-tight font-normal">{t.descripcion_pieza}</h2>
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
          <Dato etiqueta="Material" valor={[t.material, t.quilataje].filter(Boolean).join(" · ") || "—"} />
          <Dato etiqueta="Piedras" valor={t.piedras ?? "—"} />
          <Dato etiqueta="Compromiso" valor={fecha(t.fecha_compromiso + "T12:00:00")} />
          <Dato etiqueta="Asignado" valor={fecha(t.fecha_asignacion + "T12:00:00")} />
        </dl>
        {activo ? <Semaforo evaluacion={semaforos.get(t.asignacion_id)} conFecha /> : null}
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-3 p-6">
        <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">TRABAJOS</span>
        <p className="m-0 text-[14px] leading-relaxed">{t.trabajos ?? "—"}</p>
        {t.instrucciones ? (
          <>
            <span className="text-gold-dark tracking-eyebrow mt-2 text-[9px] font-medium">INSTRUCCIONES DEL TALLER</span>
            <p className="m-0 text-[14px] leading-relaxed whitespace-pre-line">{t.instrucciones}</p>
          </>
        ) : null}
      </Tarjeta>

      {t.fotos.length > 0 ? (
        <Tarjeta className="flex flex-col gap-3 p-6">
          <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">FOTOGRAFÍAS DE ENTRADA</span>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
            {t.fotos.map((f) => (
              <li key={f.id}>
                <a href={`/api/archivos/foto/${f.id}`} target="_blank" rel="noreferrer" className="rounded-card border-ink/10 bg-bone block aspect-square overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/archivos/foto/${f.id}`} alt="" loading="lazy" className="size-full object-cover" />
                </a>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}

      <AccionesTrabajo asignacionId={t.asignacion_id} estado={t.estado_asignacion} notas={t.notas_joyero} />
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-ink/45 text-[10px] tracking-[0.12em] uppercase">{etiqueta}</dt>
      <dd className="m-0 font-medium">{valor}</dd>
    </div>
  );
}
