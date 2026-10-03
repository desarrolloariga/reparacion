import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { ChipEstadoOrden, ChipTipoOrden } from "@/components/ordenes/chip-estado";
import { ChipSemaforo } from "@/components/ordenes/semaforo";
import { Aviso } from "@/components/ui/aviso";
import { Chip } from "@/components/ui/chip";
import { Tarjeta } from "@/components/ui/tarjeta";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { ordenPorId, ordenTableroPorId } from "@/lib/datos/ordenes";
import { evaluarSemaforos } from "@/lib/datos/semaforo";
import { fecha, moneda } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { esTerminal } from "@/lib/reparaciones/estados";

import { AccionesOrden } from "./acciones-orden";
import { Pestanas, type Pestana } from "./pestanas";
import { TabCotizaciones } from "./tab-cotizaciones";
import { TabDisenos } from "./tab-disenos";
import { TabFotos } from "./tab-fotos";
import { TabHistorial } from "./tab-historial";
import { TabPieza } from "./tab-pieza";

export const metadata: Metadata = { title: "Orden" };

const MENSAJES: Record<string, string> = {
  creada: "Orden creada. Puedes imprimir el comprobante de recepción y cotizar.",
  aprobada: "Cotización aprobada: la orden quedó aprobada con su precio y sus fechas.",
  enviada: "Cotización enviada al cliente.",
  rechazada: "Cotización rechazada: la orden quedó rechazada.",
  fotos_error: "La orden se creó, pero alguna fotografía no se pudo guardar. Súbela de nuevo desde la pestaña Fotografías.",
};

export default async function PaginaOrden({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sesion = await requerirLectura();
  const { id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [datos, tablero, q] = await Promise.all([ordenPorId(id), ordenTableroPorId(id), searchParams]);
  if (!datos || !tablero) notFound();
  const { orden, cliente } = datos;
  const semaforos = await evaluarSemaforos([tablero]);
  const lectura = soloLectura(sesion);
  const hoy = hoyISO();

  const pestanas: Pestana[] = ["pieza", "cotizaciones", ...(orden.tipo === "creacion" ? (["disenos"] as Pestana[]) : []), "fotos", "historial"];
  const tabCrudo = typeof q.tab === "string" ? q.tab : "pieza";
  const tab: Pestana = pestanas.includes(tabCrudo as Pestana) ? (tabCrudo as Pestana) : "pieza";

  const avisos = Object.keys(MENSAJES).filter((k) => q[k] === "1");
  const errorQuery = typeof q.error === "string" ? q.error : null;

  return (
    <div className="flex flex-col gap-5">
      {avisos.map((k) => <Aviso key={k} tono={k === "fotos_error" ? "aviso" : "ok"}>{MENSAJES[k]}</Aviso>)}
      {errorQuery ? <Aviso>{errorQuery}</Aviso> : null}

      <Tarjeta className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <ChipTipoOrden tipo={orden.tipo} />
              <ChipEstadoOrden estado={orden.estado} />
              {orden.es_garantia ? <Chip tono="error">Garantía</Chip> : null}
              <ChipSemaforo evaluacion={semaforos.get(orden.id)} />
            </span>
            <h2 className="font-display m-0 text-[30px] leading-none font-normal">
              <span className="font-mono text-[22px] tracking-[0.04em]">{orden.numero}</span>
            </h2>
            <span className="text-[14px]">
              {orden.descripcion_pieza}
              <span className="text-ink/45"> · </span>
              <Link href={`/panel/clientes/${cliente.id}`} className="hover:text-gold-dark font-medium">{cliente.nombre}</Link>
              {cliente.telefono ? <span className="text-ink/45"> · {cliente.telefono}</span> : null}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href={`/api/ordenes/${orden.id}/recepcion`} target="_blank" rel="noreferrer" className="border-ink/14 text-ink/70 hover:border-gold hover:text-ink rounded-field flex items-center gap-2 border px-3 py-[8px] text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors">
              <FileText size={14} /> Comprobante
            </a>
            {!lectura ? <AccionesOrden orden={{ id: orden.id, estado: orden.estado, numero: orden.numero }} /> : null}
          </div>
        </div>

        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3 lg:grid-cols-6">
          <Dato etiqueta="Recibida" valor={fecha(orden.fecha_recepcion + "T12:00:00")} />
          <Dato etiqueta="Días estimados" valor={orden.dias_estimados === null ? "—" : `${orden.dias_estimados} hábiles`} />
          <Dato etiqueta="Entrega estimada" valor={orden.fecha_estimada_entrega ? fecha(orden.fecha_estimada_entrega + "T12:00:00") : "—"} />
          <Dato etiqueta="Prometida al cliente" valor={orden.fecha_prometida_cliente ? fecha(orden.fecha_prometida_cliente + "T12:00:00") : "—"} nota={orden.fecha_prometida_manual ? "fijada a mano" : undefined} />
          <Dato etiqueta="Precio al cliente" valor={Number(orden.precio_cliente) > 0 ? moneda(Number(orden.precio_cliente)) : "Sin cotizar"} />
          <Dato etiqueta={esTerminal(orden.estado) ? "Cerrada" : "Entrega real"} valor={orden.fecha_entrega_real ? fecha(orden.fecha_entrega_real + "T12:00:00") : "—"} />
        </dl>
      </Tarjeta>

      <Pestanas ordenId={orden.id} actual={tab} disponibles={pestanas} contadores={{ cotizaciones: datos.cotizaciones.length, disenos: datos.disenos.length, fotos: datos.fotos.length, historial: datos.historial.length }} />

      {tab === "pieza" ? <TabPieza datos={datos} lectura={lectura} /> : null}
      {tab === "cotizaciones" ? <TabCotizaciones datos={datos} lectura={lectura} hoy={hoy} /> : null}
      {tab === "disenos" ? <TabDisenos datos={datos} lectura={lectura} /> : null}
      {tab === "fotos" ? <TabFotos datos={datos} lectura={lectura} /> : null}
      {tab === "historial" ? <TabHistorial datos={datos} /> : null}
    </div>
  );
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-ink/45 text-[10px] tracking-[0.12em] uppercase">{etiqueta}</dt>
      <dd className="m-0 font-medium tabular-nums">{valor}</dd>
      {nota ? <span className="text-gold-dark text-[10.5px]">{nota}</span> : null}
    </div>
  );
}
