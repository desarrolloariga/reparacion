import type { Metadata } from "next";
import Link from "next/link";

import { Barras } from "@/components/graficas/barras";
import { Serie } from "@/components/graficas/serie";
import { Boton } from "@/components/ui/boton";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado, TarjetaIndicador } from "@/components/ui/tarjeta";
import { requerirRol } from "@/lib/auth/guardas";
import {
  clientes360,
  economiaPorJoyero,
  economiaPorTipo,
  economiaResumen,
  indicadoresOperacion,
  nuevosVsRecurrentes,
  rankingClientes,
  tasaRecompra,
  ticketPromedio,
  tiempoPorTipo,
  utilidadMensual,
} from "@/lib/datos/indicadores";
import { desempenoJoyeros } from "@/lib/datos/taller";
import { fecha, moneda, monedaCompacta } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { CLAVES_PERIODO, ETIQUETA_PERIODO, leerRango } from "@/lib/reparaciones/periodos";
import { ETIQUETA_CATEGORIA } from "@/lib/supabase/modelo";
import { cn } from "@/lib/utils";
import type { Parametros } from "@/lib/url";

export const metadata: Metadata = { title: "Tablero gerencial" };

/**
 * Operación, joyeros, resultado económico y clientes, con selector de
 * período. Los ingresos se reconocen por orden entregada en el período.
 */
export default async function PaginaGerencia({ searchParams }: { searchParams: Promise<Parametros> }) {
  await requerirRol("admin", "gerencia");
  const params = await searchParams;
  const hoy = hoyISO();
  const rango = leerRango(params, hoy);

  const [operacion, tiempos, resumen, porJoyero, porTipo, mensual, ticket, recompra, ranking, segmentos, desempeno, inactivos] = await Promise.all([
    indicadoresOperacion(rango),
    tiempoPorTipo(rango),
    economiaResumen(rango),
    economiaPorJoyero(rango),
    economiaPorTipo(rango),
    utilidadMensual(12),
    ticketPromedio(rango),
    tasaRecompra(),
    rankingClientes(rango, "facturacion", 8),
    nuevosVsRecurrentes(rango),
    desempenoJoyeros(rango.desde, rango.hasta),
    clientes360("inactivos", 8),
  ]);

  const pct = (v: number | null, d = 1) => (v === null ? "—" : `${v.toFixed(d)} %`);
  const meses = mensual.map((m) => ({ etiqueta: new Date(m.mes + "T12:00:00").toLocaleDateString("es-GT", { month: "short" }).replace(".", ""), valores: [m.ingreso, m.costo, m.utilidad] }));
  const nuevos = segmentos.find((s) => s.segmento === "nuevos");
  const recurrentes = segmentos.find((s) => s.segmento === "recurrentes");
  const ingresoTotalSeg = (nuevos?.ingreso ?? 0) + (recurrentes?.ingreso ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <Tarjeta className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <span className="flex flex-wrap items-center gap-1">
          {CLAVES_PERIODO.map((c) => (
            <Link key={c} href={`/panel/gerencia?periodo=${c}`} className={cn("rounded-field px-3 py-[6px] text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors", rango.clave === c ? "bg-ink text-gold-light" : "text-ink/55 hover:bg-ink/6")}>
              {ETIQUETA_PERIODO[c]}
            </Link>
          ))}
        </span>
        <form method="get" className="flex items-center gap-2 text-[11px]">
          <input type="date" name="desde" defaultValue={rango.desde} className="border-ink/14 bg-paper rounded-field border px-2 py-[6px] text-[12px]" />
          <span className="text-ink/45">a</span>
          <input type="date" name="hasta" defaultValue={rango.hasta} className="border-ink/14 bg-paper rounded-field border px-2 py-[6px] text-[12px]" />
          <Boton type="submit" tamano="sm" variante="contorno">VER</Boton>
        </form>
      </Tarjeta>
      <p className="text-ink/45 m-0 -mt-3 px-1 text-[11px]">
        Período: {fecha(rango.desde + "T12:00:00")} – {fecha(rango.hasta + "T12:00:00")}. Ingresos, costos y utilidad corresponden a las órdenes <strong>entregadas</strong> en el período, no a los cobros.
      </p>

      {/* Resultado económico */}
      <section className="flex flex-col gap-4">
        <h3 className="font-display m-0 text-[22px] leading-none font-normal">Resultado económico</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TarjetaIndicador etiqueta="INGRESO" valor={monedaCompacta(resumen.ingreso)} nota={`${resumen.ordenes} órdenes entregadas`} />
          <TarjetaIndicador etiqueta="COSTO DE JOYEROS" valor={monedaCompacta(resumen.costo)} nota={resumen.garantias > 0 ? `${resumen.garantias} garantías · ${moneda(resumen.costo_garantias)}` : "sin garantías"} />
          <TarjetaIndicador etiqueta="UTILIDAD" valor={monedaCompacta(resumen.utilidad)} nota={`margen ${pct(resumen.margen)}`} />
          <TarjetaIndicador etiqueta="COBRADO EN EL PERÍODO" valor={monedaCompacta(resumen.cobrado_en_periodo)} nota={`saldo pendiente total ${monedaCompacta(resumen.saldo_pendiente_total)} · por pagar a joyeros ${monedaCompacta(resumen.pendiente_pago_joyeros)}`} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Tarjeta>
            <TarjetaEncabezado titulo="Tendencia mensual (12 meses)" />
            <div className="p-5">
              <Serie puntos={meses} series={[{ nombre: "Ingreso", color: "var(--color-serie-1)" }, { nombre: "Costo", color: "var(--color-serie-3)" }, { nombre: "Utilidad", color: "var(--color-serie-4)" }]} formato={(v) => monedaCompacta(v)} />
            </div>
          </Tarjeta>
          <Tarjeta>
            <TarjetaEncabezado titulo="Ticket promedio" />
            <div className="flex flex-col gap-3 p-5">
              {ticket.length === 0 ? <span className="text-ink/40 text-[12px]">Sin entregas en el período.</span> : ticket.map((t) => (
                <div key={t.tipo} className="flex items-baseline justify-between text-[13px]">
                  <span>{ETIQUETA_CATEGORIA[t.tipo]} <span className="text-ink/45">· {t.ordenes}</span></span>
                  <span className="tabular-nums"><strong>{moneda(t.ticket_promedio)}</strong> <span className="text-ink/45">utilidad {moneda(t.utilidad_promedio)}</span></span>
                </div>
              ))}
            </div>
            <TarjetaEncabezado titulo="Utilidad por tipo de trabajo" className="border-t" />
            <div className="p-5">
              <Barras datos={porTipo.slice(0, 8).map((t) => ({ etiqueta: t.tipo_trabajo, valor: t.utilidad, nota: `${t.lineas} líneas · margen ${pct(t.margen)}`, color: t.categoria === "reparacion" ? "var(--color-serie-1)" : "var(--color-serie-2)" }))} formato={(v) => moneda(v)} />
            </div>
          </Tarjeta>
        </div>
      </section>

      {/* Operación */}
      <section className="flex flex-col gap-4">
        <h3 className="font-display m-0 text-[22px] leading-none font-normal">Operación</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <TarjetaIndicador etiqueta="RECIBIDAS" valor={operacion.recibidas} nota={`${operacion.activas} activas hoy`} />
          <TarjetaIndicador etiqueta="ENTREGADAS" valor={operacion.entregadas} nota={`${operacion.entregadas_a_tiempo} dentro de la fecha prometida`} />
          <TarjetaIndicador etiqueta="A TIEMPO" valor={pct(operacion.pct_a_tiempo)} nota="de las entregadas" />
          <TarjetaIndicador etiqueta="DÍAS PROMEDIO" valor={operacion.dias_promedio_total ?? "—"} nota={`recepción → entrega · desviación ${operacion.desviacion_promedio === null ? "—" : `${operacion.desviacion_promedio > 0 ? "+" : ""}${operacion.desviacion_promedio}`} d hábiles`} />
          <TarjetaIndicador etiqueta="CONVERSIÓN" valor={pct(operacion.conversion_pct)} nota={`${operacion.cotizaciones_aprobadas} de ${operacion.cotizaciones_enviadas} cotizaciones`} />
        </div>
        <Tarjeta>
          <TarjetaEncabezado titulo="Tiempo promedio por tipo de trabajo (días naturales)" />
          <div className="p-5">
            <Barras datos={tiempos.slice(0, 10).map((t) => ({ etiqueta: t.tipo_trabajo, valor: t.dias_promedio ?? 0, nota: `${t.ordenes} órdenes`, color: t.categoria === "reparacion" ? "var(--color-serie-1)" : "var(--color-serie-2)" }))} formato={(v) => `${v} d`} />
          </div>
        </Tarjeta>
      </section>

      {/* Joyeros */}
      <section className="flex flex-col gap-4">
        <h3 className="font-display m-0 text-[22px] leading-none font-normal">Joyeros</h3>
        <div className="grid gap-5 lg:grid-cols-2">
          <Tarjeta className="overflow-hidden">
            <TarjetaEncabezado titulo="Desempeño" />
            <Tabla minAncho={520}>
              <Thead>
                <Th>Joyero</Th>
                <Th className="text-right">Term.</Th>
                <Th className="text-right">Atras.</Th>
                <Th className="text-right">Cumpl.</Th>
                <Th className="text-right">Retrab.</Th>
                <Th className="text-right">Días</Th>
              </Thead>
              <Tbody>
                {desempeno.filter((d) => d.activo || d.terminados > 0).map((d) => (
                  <Tr key={d.joyero_id}>
                    <Td><Link href={`/panel/joyeros/${d.joyero_id}`} className="hover:text-gold-dark">{d.joyero}</Link></Td>
                    <Td className="text-right tabular-nums">{d.terminados}</Td>
                    <Td className={`text-right tabular-nums ${d.atrasados > 0 ? "text-clay" : ""}`}>{d.atrasados}</Td>
                    <Td className="text-right tabular-nums">{pct(d.cumplimiento_pct, 0)}</Td>
                    <Td className="text-right tabular-nums">{pct(d.retrabajo_pct, 0)}</Td>
                    <Td className="text-right tabular-nums">{d.dias_promedio_respuesta ?? "—"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          </Tarjeta>
          <Tarjeta>
            <TarjetaEncabezado titulo="Utilidad por joyero" />
            <div className="p-5">
              <Barras datos={porJoyero.map((j) => ({ etiqueta: j.joyero, valor: j.utilidad, nota: `${j.ordenes} órdenes · ingreso ${monedaCompacta(j.ingreso)} · costo ${monedaCompacta(j.costo)} · margen ${pct(j.margen)}` }))} formato={(v) => moneda(v)} />
            </div>
          </Tarjeta>
        </div>
      </section>

      {/* Clientes */}
      <section className="flex flex-col gap-4">
        <h3 className="font-display m-0 text-[22px] leading-none font-normal">Clientes</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TarjetaIndicador etiqueta="TASA DE RECOMPRA" valor={pct(recompra.tasa_recompra_pct)} nota={`${recompra.clientes_recurrentes} de ${recompra.clientes_con_servicio} clientes con 2 o más entregas`} />
          <TarjetaIndicador etiqueta="CLIENTES NUEVOS" valor={nuevos?.clientes ?? 0} nota={`${nuevos?.ordenes ?? 0} órdenes · ${monedaCompacta(nuevos?.ingreso ?? 0)}`} />
          <TarjetaIndicador etiqueta="RECURRENTES" valor={recurrentes?.clientes ?? 0} nota={`${recurrentes?.ordenes ?? 0} órdenes · ${monedaCompacta(recurrentes?.ingreso ?? 0)}`} />
          <TarjetaIndicador etiqueta="INGRESO DE RECURRENTES" valor={ingresoTotalSeg > 0 ? pct(((recurrentes?.ingreso ?? 0) / ingresoTotalSeg) * 100, 0) : "—"} nota="participación en el ingreso del período" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Tarjeta className="overflow-hidden">
            <TarjetaEncabezado titulo="Mayor valor en el período">
              <Link href="/panel/clientes" className="text-ink/45 hover:text-gold-dark text-[12px]">Ver clientes</Link>
            </TarjetaEncabezado>
            <Tabla minAncho={420}>
              <Thead>
                <Th>Cliente</Th>
                <Th className="text-right">Órdenes</Th>
                <Th className="text-right">Facturado</Th>
                <Th className="text-right">Utilidad</Th>
              </Thead>
              <Tbody>
                {ranking.length === 0 ? <Tr><Td colSpan={4} className="text-ink/40 py-6 text-center">Sin entregas en el período.</Td></Tr> : ranking.map((c) => (
                  <Tr key={c.cliente_id}>
                    <Td><Link href={`/panel/clientes/${c.cliente_id}`} className="hover:text-gold-dark">{c.cliente}</Link></Td>
                    <Td className="text-right tabular-nums">{c.ordenes}</Td>
                    <Td className="text-right tabular-nums">{moneda(c.facturado)}</Td>
                    <Td className="text-right tabular-nums">{moneda(c.utilidad)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          </Tarjeta>
          <Tarjeta className="overflow-hidden">
            <TarjetaEncabezado titulo="Inactivos con historial" />
            <Tabla minAncho={420}>
              <Thead>
                <Th>Cliente</Th>
                <Th className="text-right">Órdenes</Th>
                <Th className="text-right">Último servicio</Th>
                <Th className="text-right">Facturado</Th>
              </Thead>
              <Tbody>
                {inactivos.length === 0 ? <Tr><Td colSpan={4} className="text-ink/40 py-6 text-center">Nadie inactivo según el parámetro.</Td></Tr> : inactivos.map((c) => (
                  <Tr key={c.id}>
                    <Td><Link href={`/panel/clientes/${c.id}`} className="hover:text-gold-dark">{c.nombre}</Link></Td>
                    <Td className="text-right tabular-nums">{c.total_ordenes}</Td>
                    <Td className="text-right tabular-nums">{c.dias_desde_ultimo_servicio} días</Td>
                    <Td className="text-right tabular-nums">{moneda(c.total_facturado)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          </Tarjeta>
        </div>
      </section>
    </div>
  );
}
