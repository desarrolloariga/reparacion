import { Chip } from "@/components/ui/chip";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import type { Cliente360 } from "@/lib/datos/indicadores";
import { fecha, moneda } from "@/lib/format";

/** Historia económica del cliente: valor, recompra, frecuencia y preferencias. */
export function Ficha360({ c, conDinero }: { c: Cliente360; conDinero: boolean }) {
  const f = (v: string | null) => (v ? fecha(v + "T12:00:00") : "—");
  return (
    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo="Cliente 360">
        <span className="flex items-center gap-2">
          {c.es_recurrente ? <Chip tono="oro">Recurrente</Chip> : <Chip tono="neutro">{c.total_ordenes === 0 ? "Sin entregas" : "Primera vez"}</Chip>}
          {c.inactivo ? <Chip tono="error">Inactivo</Chip> : null}
          {c.garantias > 0 ? <Chip tono="tenue">{c.garantias} garantías</Chip> : null}
        </span>
      </TarjetaEncabezado>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 px-[22px] py-[18px] text-[13px] sm:grid-cols-3 lg:grid-cols-4">
        <Dato etiqueta="Órdenes entregadas" valor={String(c.total_ordenes)} nota={c.ordenes_activas > 0 ? `${c.ordenes_activas} activas` : undefined} />
        <Dato etiqueta="Total facturado" valor={moneda(c.total_facturado)} />
        {conDinero ? <Dato etiqueta="Utilidad generada" valor={moneda(c.utilidad_generada)} nota={c.utilidad_promedio !== null ? `${moneda(c.utilidad_promedio)} por orden` : undefined} /> : null}
        <Dato etiqueta="Ticket promedio" valor={c.ticket_promedio !== null ? moneda(c.ticket_promedio) : "—"} nota={c.precio_minimo !== null && c.precio_maximo !== null ? `rango ${moneda(c.precio_minimo)} – ${moneda(c.precio_maximo)}` : undefined} />
        <Dato etiqueta="Primer servicio" valor={f(c.fecha_primer_servicio)} />
        <Dato etiqueta="Último servicio" valor={f(c.fecha_ultimo_servicio)} nota={c.dias_desde_ultimo_servicio !== null ? `hace ${c.dias_desde_ultimo_servicio} días` : undefined} />
        <Dato etiqueta="Frecuencia" valor={c.frecuencia_promedio_dias !== null ? `cada ${c.frecuencia_promedio_dias} días` : "—"} />
        <Dato etiqueta="Trabajo más frecuente" valor={c.tipo_trabajo_mas_frecuente ?? "—"} />
      </dl>
    </Tarjeta>
  );
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-ink/45 text-[10px] tracking-[0.12em] uppercase">{etiqueta}</dt>
      <dd className="m-0 font-medium tabular-nums">{valor}</dd>
      {nota ? <span className="text-ink/45 text-[10.5px]">{nota}</span> : null}
    </div>
  );
}
