import Link from "next/link";

import { ChipEstadoOrden } from "@/components/ordenes/chip-estado";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import type { AsignacionListada } from "@/lib/datos/asignaciones";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { fecha } from "@/lib/format";

import { FormularioGarantia } from "./formulario-garantia";

export function TabGarantias({
  datos,
  asignaciones,
  lectura,
  extra,
}: {
  datos: OrdenCompleta;
  asignaciones: AsignacionListada[];
  lectura: boolean;
  extra: { joyeros: { id: number; nombre: string }[]; tipos: { id: number; nombre: string }[]; complejidades: { id: number; nombre: string }[] } | null;
}) {
  const { orden, origen, garantias, lineas } = datos;
  const ultimoJoyero = asignaciones.find((a) => a.estado === "terminada" || a.estado === "cerrada" || a.estado === "rechazada_calidad");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="flex flex-col gap-5">
        {origen ? (
          <Tarjeta className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <span className="text-[13px]">
              Esta orden es una <strong>garantía</strong> de{" "}
              <Link href={`/panel/ordenes/${origen.id}`} className="hover:text-gold-dark font-mono font-medium">{origen.numero}</Link>
              {orden.joyero_responsable_garantia_id ? <span className="text-ink/55"> · joyero responsable registrado</span> : null}
            </span>
            <ChipEstadoOrden estado={origen.estado} corto />
          </Tarjeta>
        ) : null}

        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Garantías de esta orden">
            <span className="text-ink/45 text-[12px]">{garantias.length}</span>
          </TarjetaEncabezado>
          {garantias.length === 0 ? (
            <Vacio titulo="Sin garantías" descripcion="Si el cliente regresa con la pieza ya entregada, se abre aquí una orden de garantía ligada a esta." className="py-10" />
          ) : (
            <ul className="m-0 list-none divide-y divide-ink/6 p-0">
              {garantias.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span>
                    <Link href={`/panel/ordenes/${g.id}`} className="hover:text-gold-dark font-mono text-[12.5px] font-medium">{g.numero}</Link>
                    <span className="text-ink/45 ml-2 text-[11.5px] tabular-nums">{fecha(g.fecha_recepcion + "T12:00:00")}</span>
                  </span>
                  <ChipEstadoOrden estado={g.estado} corto />
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      {extra ? (
        <Tarjeta className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">EL CLIENTE REGRESÓ</span>
            <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Abrir garantía</h3>
          </div>
          <FormularioGarantia
            ordenOrigenId={orden.id}
            descripcion={orden.descripcion_pieza}
            joyeros={extra.joyeros}
            joyeroSugerido={ultimoJoyero?.joyero_id ?? null}
            tipos={extra.tipos}
            complejidades={extra.complejidades}
            lineasIniciales={lineas.map((l) => ({ tipo_trabajo_id: l.tipo_trabajo_id, complejidad_id: l.complejidad_id, descripcion: l.descripcion ?? "" }))}
          />
        </Tarjeta>
      ) : !lectura && orden.estado === "entregada" && orden.es_garantia ? (
        <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">Una garantía no abre garantías: hazlo desde la orden original.</p>
      ) : null}
    </div>
  );
}
