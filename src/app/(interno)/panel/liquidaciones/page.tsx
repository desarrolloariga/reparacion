import type { Metadata } from "next";
import Link from "next/link";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Chip } from "@/components/ui/chip";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { listarJoyeros } from "@/lib/datos/joyeros";
import { listarLiquidaciones, previsualizarLiquidacion } from "@/lib/datos/liquidaciones";
import { fecha, moneda } from "@/lib/format";
import { esFechaISO, hoyISO } from "@/lib/reparaciones/dias-habiles";
import { rangoPredefinido } from "@/lib/reparaciones/periodos";
import { leerTexto, type Parametros } from "@/lib/url";

import { FormularioGenerar } from "./formulario-generar";

export const metadata: Metadata = { title: "Liquidaciones" };

export default async function PaginaLiquidaciones({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sesion = await requerirLectura();
  const params = await searchParams;
  const lectura = soloLectura(sesion);
  const hoy = hoyISO();
  const porDefecto = rangoPredefinido("mes_anterior", hoy);

  const joyeroId = Number(leerTexto(params, "joyero"));
  const desde = esFechaISO(leerTexto(params, "desde")) ? leerTexto(params, "desde") : porDefecto.desde;
  const hasta = esFechaISO(leerTexto(params, "hasta")) ? leerTexto(params, "hasta") : porDefecto.hasta;
  const previsualizar = Number.isInteger(joyeroId) && joyeroId > 0 && desde <= hasta;

  const [liquidaciones, joyeros, previa] = await Promise.all([
    listarLiquidaciones(),
    listarJoyeros(true),
    previsualizar ? previsualizarLiquidacion(joyeroId, desde, hasta) : Promise.resolve(null),
  ]);
  const joyero = joyeros.find((j) => j.id === joyeroId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <div className="flex flex-col gap-5">
        {params.anulada === "1" ? <Aviso tono="ok">Borrador anulado: sus trabajos vuelven a estar pendientes de pago.</Aviso> : null}
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Liquidaciones">
            <span className="text-ink/45 text-[12px]">{liquidaciones.length} registradas</span>
          </TarjetaEncabezado>
          {liquidaciones.length === 0 ? (
            <Vacio titulo="Sin liquidaciones" descripcion="Elige un joyero y un período: el sistema trae sus trabajos terminados no pagados y los descuentos por garantía." className="py-10" />
          ) : (
            <Tabla minAncho={680}>
              <Thead>
                <Th>Joyero</Th>
                <Th>Período</Th>
                <Th className="text-right">Líneas</Th>
                <Th className="text-right">Total</Th>
                <Th>Estado</Th>
                <Th>Pago</Th>
              </Thead>
              <Tbody>
                {liquidaciones.map((l) => (
                  <Tr key={l.id}>
                    <Td><Link href={`/panel/liquidaciones/${l.id}`} className="hover:text-gold-dark font-medium">{l.joyero}</Link></Td>
                    <Td className="tabular-nums">{fecha(l.periodo_desde + "T12:00:00")} – {fecha(l.periodo_hasta + "T12:00:00")}</Td>
                    <Td className="text-right tabular-nums">{l.lineas}</Td>
                    <Td className={`text-right font-medium tabular-nums ${Number(l.total) < 0 ? "text-clay" : ""}`}>{moneda(Number(l.total))}</Td>
                    <Td><Chip tono={l.estado === "pagada" ? "exito" : "oro"}>{l.estado === "pagada" ? "Pagada" : "Borrador"}</Chip></Td>
                    <Td className="text-ink/60 tabular-nums">{l.fecha_pago ? fecha(l.fecha_pago + "T12:00:00") : "—"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          )}
        </Tarjeta>
      </div>

      {!lectura ? (
        <div className="flex flex-col gap-4">
          <Tarjeta className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">NUEVA</span>
              <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Liquidar a un joyero</h3>
            </div>
            <form method="get" className="flex flex-col gap-4">
              <label className="flex flex-col gap-[7px]">
                <span className="tracking-field text-ink/50 text-[10px] leading-none font-medium">JOYERO</span>
                <select name="joyero" defaultValue={joyeroId || ""} className="border-ink/14 bg-paper rounded-field border px-[14px] py-[13px] text-sm">
                  <option value="">Elige un joyero</option>
                  {joyeros.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-[7px]">
                  <span className="tracking-field text-ink/50 text-[10px] leading-none font-medium">DESDE</span>
                  <input type="date" name="desde" defaultValue={desde} className="border-ink/14 bg-paper rounded-field border px-3 py-[12px] text-sm" />
                </label>
                <label className="flex flex-col gap-[7px]">
                  <span className="tracking-field text-ink/50 text-[10px] leading-none font-medium">HASTA</span>
                  <input type="date" name="hasta" defaultValue={hasta} className="border-ink/14 bg-paper rounded-field border px-3 py-[12px] text-sm" />
                </label>
              </div>
              <Boton type="submit" variante="contorno" className="py-[13px]">PREVISUALIZAR</Boton>
            </form>
          </Tarjeta>

          {previa && joyero ? (
            <Tarjeta className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">PREVISUALIZACIÓN</span>
                <h3 className="font-display m-0 text-[18px] leading-tight font-normal">{joyero.nombre} · {fecha(desde + "T12:00:00")} – {fecha(hasta + "T12:00:00")}</h3>
              </div>
              {previa.pagos.length + previa.descuentos.length === 0 ? (
                <Aviso tono="info">No hay trabajos pendientes de pago ni descuentos en ese período.</Aviso>
              ) : (
                <>
                  <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[12.5px]">
                    {previa.pagos.map((l) => (
                      <li key={`p${l.asignacion_id}`} className="flex justify-between gap-3"><span className="truncate">{l.concepto}</span><span className="tabular-nums">{moneda(l.monto)}</span></li>
                    ))}
                    {previa.descuentos.map((l) => (
                      <li key={`d${l.asignacion_id}`} className="text-clay flex justify-between gap-3"><span className="truncate">{l.concepto}</span><span className="tabular-nums">{moneda(l.monto)}</span></li>
                    ))}
                  </ul>
                  <div className="border-ink/8 flex items-baseline justify-between border-t pt-3">
                    <span className="text-ink/55 text-[12px]">Total a pagar</span>
                    <span className={`font-display text-[24px] leading-none tabular-nums ${previa.total < 0 ? "text-clay" : ""}`}>{moneda(previa.total)}</span>
                  </div>
                  <FormularioGenerar joyeroId={joyero.id} desde={desde} hasta={hasta} />
                </>
              )}
            </Tarjeta>
          ) : null}

          <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">
            Entran los trabajos terminados (aunque hayan tenido retrabajo) no pagados, por fecha de terminado. Las garantías de las que el joyero es responsable se descuentan según el parámetro. Una asignación nunca entra en dos liquidaciones.
          </p>
        </div>
      ) : null}
    </div>
  );
}
