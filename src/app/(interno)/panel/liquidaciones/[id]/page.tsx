import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Chip } from "@/components/ui/chip";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { anularLiquidacion } from "@/lib/acciones/liquidaciones";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { liquidacionPorId } from "@/lib/datos/liquidaciones";
import { fecha, fechaHora, moneda } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { ETIQUETA_FORMA_PAGO, type FormaPago } from "@/lib/reparaciones/pagos";

import { FormularioConfirmar } from "./formulario-confirmar";

export const metadata: Metadata = { title: "Liquidación" };

export default async function PaginaLiquidacion({
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
  const [datos, q] = await Promise.all([liquidacionPorId(id), searchParams]);
  if (!datos) notFound();
  const { liquidacion, joyero, lineas } = datos;
  const lectura = soloLectura(sesion);
  const pagos = lineas.filter((l) => !l.es_descuento);
  const descuentos = lineas.filter((l) => l.es_descuento);

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
      {q.generada === "1" ? <Aviso tono="ok">Borrador generado. Revisa las líneas y confirma el pago.</Aviso> : null}
      {typeof q.error === "string" ? <Aviso>{q.error}</Aviso> : null}

      <Tarjeta className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex flex-col gap-2">
          <Link href="/panel/liquidaciones" className="text-ink/50 hover:text-ink flex items-center gap-1 text-[11px]"><ArrowLeft size={12} /> Liquidaciones</Link>
          <span className="flex flex-wrap items-center gap-2">
            <Chip tono={liquidacion.estado === "pagada" ? "exito" : "oro"}>{liquidacion.estado === "pagada" ? "Pagada" : "Borrador"}</Chip>
            <span className="text-ink/45 text-[12px]">#{liquidacion.id}</span>
          </span>
          <h2 className="font-display m-0 text-[26px] leading-none font-normal">{joyero.nombre}</h2>
          <span className="text-[13px] tabular-nums">{fecha(liquidacion.periodo_desde + "T12:00:00")} – {fecha(liquidacion.periodo_hasta + "T12:00:00")}</span>
          {liquidacion.estado === "pagada" ? (
            <span className="text-ink/60 text-[12px]">
              Pagada el {liquidacion.fecha_pago ? fecha(liquidacion.fecha_pago + "T12:00:00") : "—"} · {liquidacion.forma_pago ? ETIQUETA_FORMA_PAGO[liquidacion.forma_pago as FormaPago] : "—"}
              {liquidacion.referencia ? ` · ref. ${liquidacion.referencia}` : ""}{datos.pagadaPor ? ` · por ${datos.pagadaPor}` : ""}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-ink/45 text-[10px] tracking-[0.12em] uppercase">Total</span>
          <span className={`font-display text-[32px] leading-none tabular-nums ${Number(liquidacion.total) < 0 ? "text-clay" : ""}`}>{moneda(Number(liquidacion.total))}</span>
          {liquidacion.estado === "pagada" ? (
            <a href={`/api/liquidaciones/${liquidacion.id}/pdf`} target="_blank" rel="noreferrer" className="border-ink/14 text-ink/70 hover:border-gold hover:text-ink rounded-field flex items-center gap-2 border px-3 py-[8px] text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors">
              <FileText size={14} /> Comprobante
            </a>
          ) : null}
        </div>
      </Tarjeta>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Líneas">
            <span className="text-ink/45 text-[12px]">{pagos.length} pagos · {descuentos.length} descuentos</span>
          </TarjetaEncabezado>
          <Tabla minAncho={560}>
            <Thead>
              <Th>Concepto</Th>
              <Th>Terminado</Th>
              <Th className="text-right">Monto</Th>
            </Thead>
            <Tbody>
              {lineas.map((l) => (
                <Tr key={l.id} className={l.es_descuento ? "text-clay" : undefined}>
                  <Td>{l.concepto ?? `${l.numero} · ${l.descripcion_pieza}`}</Td>
                  <Td className="tabular-nums">{l.fecha_terminado_real ? fecha(l.fecha_terminado_real + "T12:00:00") : "—"}</Td>
                  <Td className="text-right font-medium tabular-nums">{moneda(Number(l.monto))}</Td>
                </Tr>
              ))}
            </Tbody>
          </Tabla>
          <p className="text-ink/45 m-0 px-5 py-3 text-[11px]">Creada {fechaHora(liquidacion.creado_en)}.</p>
        </Tarjeta>

        {!lectura && liquidacion.estado === "borrador" ? (
          <Tarjeta className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">CONFIRMAR PAGO</span>
              <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Marcar como pagada</h3>
            </div>
            <FormularioConfirmar liquidacionId={liquidacion.id} hoy={hoyISO()} />
            <form action={anularLiquidacion} className="border-ink/8 border-t pt-4">
              <input type="hidden" name="id" value={liquidacion.id} />
              <button type="submit" className="text-ink/45 hover:text-clay cursor-pointer text-[11.5px] underline-offset-2 hover:underline">Anular este borrador</button>
            </form>
          </Tarjeta>
        ) : null}
      </div>
    </div>
  );
}
