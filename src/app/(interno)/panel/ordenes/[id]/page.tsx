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
import { asignacionesDeOrden, candidatosParaOrden } from "@/lib/datos/asignaciones";
import { calendarioVigente } from "@/lib/datos/calendario";
import { listarComplejidades, listarTiposTrabajo } from "@/lib/datos/catalogos";
import { listarJoyeros } from "@/lib/datos/joyeros";
import { ordenPorId, ordenTableroPorId } from "@/lib/datos/ordenes";
import { leerParametros } from "@/lib/datos/parametros";
import { evaluarSemaforos } from "@/lib/datos/semaforo";
import { controlesDeOrden, pagosDeOrden, saldoDe } from "@/lib/datos/taller";
import { fecha, moneda } from "@/lib/format";
import { fechaCompromisoSugerida, topeJoyero } from "@/lib/reparaciones/asignacion";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { esTerminal } from "@/lib/reparaciones/estados";

import { AccionesOrden } from "./acciones-orden";
import { Pestanas, type Pestana } from "./pestanas";
import { TabAsignaciones } from "./tab-asignaciones";
import { TabCalidad } from "./tab-calidad";
import { TabCotizaciones } from "./tab-cotizaciones";
import { TabDisenos } from "./tab-disenos";
import { TabFotos } from "./tab-fotos";
import { TabGarantias } from "./tab-garantias";
import { TabHistorial } from "./tab-historial";
import { TabPagos } from "./tab-pagos";
import { TabPieza } from "./tab-pieza";

export const metadata: Metadata = { title: "Orden" };

const MENSAJES: Record<string, string> = {
  creada: "Orden creada. Puedes imprimir el comprobante de recepción y cotizar.",
  aprobada: "Cotización aprobada: la orden quedó aprobada con su precio y sus fechas. Ya se puede asignar.",
  enviada: "Cotización enviada al cliente.",
  rechazada: "Cotización rechazada: la orden quedó rechazada.",
  garantia: "Garantía abierta y ligada a la orden original.",
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
  const lectura = soloLectura(sesion);
  const hoy = hoyISO();

  const [semaforos, asignaciones, controles, pagos] = await Promise.all([
    evaluarSemaforos([tablero]),
    asignacionesDeOrden(id),
    controlesDeOrden(id),
    pagosDeOrden(id),
  ]);
  const { cobrado, saldo } = saldoDe(Number(orden.precio_cliente), pagos);
  const calidadOk = controles.some((c) => c.resultado === "aprobado") && orden.estado === "lista_entrega";
  const fotosSalida = datos.fotos.filter((f) => f.momento === "salida").length;

  const mostrarGarantias = orden.estado === "entregada" || orden.es_garantia || datos.garantias.length > 0;
  const pestanas: Pestana[] = [
    "pieza",
    "cotizaciones",
    ...(orden.tipo === "creacion" ? (["disenos"] as Pestana[]) : []),
    "asignaciones",
    "calidad",
    "fotos",
    "pagos",
    "historial",
    ...(mostrarGarantias ? (["garantias"] as Pestana[]) : []),
  ];
  const tabCrudo = typeof q.tab === "string" ? q.tab : "pieza";
  const tab: Pestana = pestanas.includes(tabCrudo as Pestana) ? (tabCrudo as Pestana) : "pieza";

  // Datos específicos de la pestaña de asignación (solo cuando se puede asignar).
  let asignacionExtra: Awaited<ReturnType<typeof datosAsignacion>> | null = null;
  if (tab === "asignaciones" && orden.estado === "aprobada" && !lectura) asignacionExtra = await datosAsignacion(id, orden, hoy);

  let garantiaExtra: { joyeros: { id: number; nombre: string }[]; tipos: { id: number; nombre: string }[]; complejidades: { id: number; nombre: string }[] } | null = null;
  if (tab === "garantias" && orden.estado === "entregada" && !lectura && !orden.es_garantia) {
    const [joyeros, tipos, complejidades] = await Promise.all([listarJoyeros(true), listarTiposTrabajo({ soloActivos: true, categoria: "reparacion" }), listarComplejidades()]);
    garantiaExtra = {
      joyeros: joyeros.map((j) => ({ id: j.id, nombre: j.nombre })),
      tipos: tipos.map((t) => ({ id: t.id, nombre: t.nombre })),
      complejidades: complejidades.map((c) => ({ id: c.id, nombre: c.nombre })),
    };
  }

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
              {orden.es_garantia ? <Chip tono="error">Garantía{orden.cobra_garantia ? " con cobro" : " sin cobro"}</Chip> : null}
              {tablero.joyero ? <Chip tono="oscuro">Joyero: {tablero.joyero}</Chip> : null}
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
            {!lectura ? (
              <AccionesOrden
                orden={{ id: orden.id, estado: orden.estado, numero: orden.numero }}
                entrega={{ saldo, cobrado, precio: Number(orden.precio_cliente), calidadOk, fotosSalida }}
              />
            ) : null}
          </div>
        </div>

        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3 lg:grid-cols-6">
          <Dato etiqueta="Recibida" valor={fecha(orden.fecha_recepcion + "T12:00:00")} />
          <Dato etiqueta="Días estimados" valor={orden.dias_estimados === null ? "—" : `${orden.dias_estimados} hábiles`} />
          <Dato etiqueta={tablero.fecha_compromiso_joyero ? "Compromiso del joyero" : "Entrega estimada"} valor={tablero.fecha_compromiso_joyero ? fecha(tablero.fecha_compromiso_joyero + "T12:00:00") : orden.fecha_estimada_entrega ? fecha(orden.fecha_estimada_entrega + "T12:00:00") : "—"} />
          <Dato etiqueta="Prometida al cliente" valor={orden.fecha_prometida_cliente ? fecha(orden.fecha_prometida_cliente + "T12:00:00") : "—"} nota={orden.fecha_prometida_manual ? "fijada a mano" : undefined} />
          <Dato etiqueta="Precio al cliente" valor={Number(orden.precio_cliente) > 0 ? moneda(Number(orden.precio_cliente)) : orden.es_garantia && !orden.cobra_garantia ? "Sin cobro" : "Sin cotizar"} nota={saldo > 0 && Number(orden.precio_cliente) > 0 ? `saldo ${moneda(saldo)}` : cobrado > 0 ? "pagada" : undefined} />
          <Dato etiqueta={esTerminal(orden.estado) ? "Cerrada" : "Entrega real"} valor={orden.fecha_entrega_real ? fecha(orden.fecha_entrega_real + "T12:00:00") : "—"} />
        </dl>
      </Tarjeta>

      <Pestanas
        ordenId={orden.id}
        actual={tab}
        disponibles={pestanas}
        contadores={{ cotizaciones: datos.cotizaciones.length, disenos: datos.disenos.length, asignaciones: asignaciones.length, calidad: controles.length, fotos: datos.fotos.length, pagos: pagos.length, historial: datos.historial.length, garantias: datos.garantias.length }}
      />

      {tab === "pieza" ? <TabPieza datos={datos} lectura={lectura} /> : null}
      {tab === "cotizaciones" ? <TabCotizaciones datos={datos} lectura={lectura} hoy={hoy} /> : null}
      {tab === "disenos" ? <TabDisenos datos={datos} lectura={lectura} /> : null}
      {tab === "asignaciones" ? <TabAsignaciones datos={datos} asignaciones={asignaciones} lectura={lectura} extra={asignacionExtra} /> : null}
      {tab === "calidad" ? <TabCalidad datos={datos} controles={controles} asignaciones={asignaciones} lectura={lectura} fotosSalida={fotosSalida} /> : null}
      {tab === "fotos" ? <TabFotos datos={datos} lectura={lectura} /> : null}
      {tab === "pagos" ? <TabPagos datos={datos} pagos={pagos} lectura={lectura} esAdmin={sesion.rol === "admin"} hoy={hoy} /> : null}
      {tab === "historial" ? <TabHistorial datos={datos} /> : null}
      {tab === "garantias" ? <TabGarantias datos={datos} asignaciones={asignaciones} lectura={lectura} extra={garantiaExtra} /> : null}
    </div>
  );
}

async function datosAsignacion(ordenId: number, orden: { dias_estimados: number | null; fecha_prometida_cliente: string | null }, hoy: string) {
  const [{ candidatos }, parametros, calendario] = await Promise.all([candidatosParaOrden(ordenId), leerParametros(), calendarioVigente()]);
  const sugerida = fechaCompromisoSugerida(hoy, orden.dias_estimados ?? 0, calendario);
  const tope = orden.fecha_prometida_cliente ? topeJoyero(orden.fecha_prometida_cliente, parametros.holgura_joyero_dias, calendario) : null;
  return { candidatos, sugerida, tope, bloquearPorCapacidad: parametros.bloquear_por_capacidad, hoy };
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
