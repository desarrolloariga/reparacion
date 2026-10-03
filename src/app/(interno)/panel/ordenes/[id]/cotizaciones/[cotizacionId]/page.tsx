import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { ChipCotizacion } from "@/components/ordenes/chip-estado";
import { Tarjeta } from "@/components/ui/tarjeta";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { listarComplejidades, listarTiposTrabajo, matrizTiempos } from "@/lib/datos/catalogos";
import { cotizacionPorId } from "@/lib/datos/cotizaciones";
import { ordenPorId } from "@/lib/datos/ordenes";
import { leerParametros } from "@/lib/datos/parametros";
import { fecha, fechaHora } from "@/lib/format";
import { estadoEfectivo } from "@/lib/reparaciones/cotizaciones";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";

import { Cotizador } from "./cotizador";

export const metadata: Metadata = { title: "Cotización" };

export default async function PaginaCotizacion({ params }: { params: Promise<{ id: string; cotizacionId: string }> }) {
  const sesion = await requerirLectura();
  const { id: idCrudo, cotizacionId: cotCrudo } = await params;
  const ordenId = Number(idCrudo);
  const cotizacionId = Number(cotCrudo);
  if (!Number.isInteger(ordenId) || !Number.isInteger(cotizacionId)) notFound();

  const [datos, cot, tipos, complejidades, matriz, parametros] = await Promise.all([
    ordenPorId(ordenId),
    cotizacionPorId(cotizacionId),
    listarTiposTrabajo({ soloActivos: true }),
    listarComplejidades(),
    matrizTiempos(),
    leerParametros(),
  ]);
  if (!datos || !cot || cot.cotizacion.orden_id !== ordenId) notFound();

  const { orden, cliente } = datos;
  const { cotizacion, lineas } = cot;
  const hoy = hoyISO();
  const efectivo = estadoEfectivo(cotizacion, hoy);
  const lectura = soloLectura(sesion);
  const editable = !lectura && cotizacion.estado === "borrador";
  const decidible = !lectura && efectivo === "enviada" && orden.estado === "cotizada";
  const hayDisenoAprobado = datos.disenos.some((d) => d.aprobado);

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5">
      <Tarjeta className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-col gap-1">
          <Link href={`/panel/ordenes/${orden.id}?tab=cotizaciones`} className="text-ink/50 hover:text-ink flex items-center gap-1 text-[11px]"><ArrowLeft size={12} /> Volver a la orden</Link>
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[14px] font-medium">{orden.numero}</span>
            <span className="text-ink/45">·</span>
            <span className="text-[14px]">{orden.descripcion_pieza}</span>
            <span className="text-ink/45">·</span>
            <span className="text-[13px]">{cliente.nombre}</span>
          </span>
          <span className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="font-medium">Cotización v{cotizacion.version}</span>
            <ChipCotizacion estado={efectivo} />
            {cotizacion.valido_hasta ? <span className="text-ink/50">válida hasta {fecha(cotizacion.valido_hasta + "T12:00:00")}</span> : null}
            {cotizacion.aprobada_en ? <span className="text-sage">aprobada {fechaHora(cotizacion.aprobada_en)} por {cotizacion.aprobada_por_nombre}</span> : null}
          </span>
        </div>
        {cotizacion.estado !== "borrador" ? (
          <a href={`/api/cotizaciones/${cotizacion.id}/pdf`} target="_blank" rel="noreferrer" className="border-ink/14 text-ink/70 hover:border-gold hover:text-ink rounded-field flex items-center gap-2 border px-3 py-[8px] text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors">
            <FileText size={14} /> PDF para el cliente
          </a>
        ) : null}
      </Tarjeta>

      <Cotizador
        cotizacion={{ id: cotizacion.id, version: cotizacion.version, estado: efectivo, notas: cotizacion.notas, motivo_rechazo: cotizacion.motivo_rechazo }}
        orden={{ id: orden.id, tipo: orden.tipo, estado: orden.estado, hayDisenoAprobado }}
        lineasIniciales={lineas.map((l) => ({
          tipo_trabajo_id: l.tipo_trabajo_id,
          complejidad_id: l.complejidad_id,
          descripcion: l.descripcion ?? "",
          cantidad: l.cantidad,
          precio_unitario: Number(l.precio_unitario),
          costo_joyero: Number(l.costo_joyero),
        }))}
        tipos={tipos.map((t) => ({ id: t.id, nombre: t.nombre, categoria: t.categoria }))}
        complejidades={complejidades.map((c) => ({ id: c.id, nombre: c.nombre }))}
        matriz={Object.fromEntries(matriz)}
        vigenciaDias={parametros.vigencia_cotizacion_dias}
        editable={editable}
        decidible={decidible}
      />
    </div>
  );
}
