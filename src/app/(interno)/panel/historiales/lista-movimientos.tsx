import Link from "next/link";

import { camposAsignacion, camposLiquidacion, camposOrden, camposPago } from "@/components/admin/campos";
import { BotonEliminar, EditorRegistro } from "@/components/admin/controles";
import { Chip } from "@/components/ui/chip";
import { Paginacion } from "@/components/ui/paginacion";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import {
  editarAsignacion,
  editarHistorial,
  editarLiquidacion,
  editarOrden,
  editarPago,
  eliminarAsignacion,
  eliminarHistorial,
  eliminarLiquidacion,
  eliminarOrden,
  eliminarPago,
} from "@/lib/acciones/admin";
import type { Movimiento, registrosOriginales } from "@/lib/datos/movimientos";
import { ETIQUETA_MOVIMIENTO, POR_PAGINA_MOVIMIENTOS, TONO_MOVIMIENTO } from "@/lib/datos/movimientos";
import { fecha, fechaHora, moneda } from "@/lib/format";
import { ETIQUETA_CATEGORIA } from "@/lib/supabase/modelo";
import { cn } from "@/lib/utils";

type Originales = Awaited<ReturnType<typeof registrosOriginales>>;

/**
 * Lista de movimientos con la corrección de cada uno según su tipo. Los
 * botones aparecen solo si el registro original existe; las acciones
 * vuelven a exigir admin en el servidor.
 */
export function ListaMovimientos({
  filas,
  originales,
  total,
  pagina,
  paginas,
  porPagina,
  enlace,
  volverA,
}: {
  filas: Movimiento[];
  originales: Originales;
  total: number;
  pagina: number;
  paginas: number;
  porPagina: number;
  enlace: (cambios: Record<string, string>) => string;
  volverA: string;
}) {
  return (
    <Tarjeta className="overflow-hidden">
      {filas.length === 0 ? (
        <Vacio titulo="Sin movimientos con esos filtros" descripcion="Prueba otro período, tipo de movimiento o quita algún filtro." className="py-12" />
      ) : (
        <ul className="m-0 list-none divide-y divide-ink/6 p-0">
          {filas.map((m) => (
            <li key={`${m.tipo}-${m.registro_id}`} className="flex flex-col gap-2 px-5 py-3">
              <div className="grid items-start gap-x-4 gap-y-1 md:grid-cols-[110px_150px_minmax(0,1fr)_130px]">
                <span className="text-[12px] tabular-nums">
                  {fecha(m.fecha + "T12:00:00")}
                  {m.momento ? <span className="text-ink/40 block text-[10.5px]">{fechaHora(m.momento).split(",").pop()?.trim()}</span> : null}
                </span>
                <span className="flex flex-col items-start gap-1">
                  <Chip tono={TONO_MOVIMIENTO[m.tipo]}>{ETIQUETA_MOVIMIENTO[m.tipo]}</Chip>
                  {m.categoria ? <span className="text-ink/45 text-[10.5px]">{ETIQUETA_CATEGORIA[m.categoria]}</span> : null}
                </span>
                <span className="flex min-w-0 flex-col gap-[2px] text-[12.5px]">
                  <span className="flex flex-wrap items-center gap-x-2">
                    {m.orden_id && m.numero ? <Link href={`/panel/ordenes/${m.orden_id}`} className="hover:text-gold-dark font-mono text-[12px] font-medium">{m.numero}</Link> : null}
                    {m.cliente_id && m.cliente ? <Link href={`/panel/clientes/${m.cliente_id}`} className="hover:text-gold-dark">{m.cliente}</Link> : null}
                    {m.joyero_id && m.joyero ? <Link href={`/panel/joyeros/${m.joyero_id}`} className="hover:text-gold-dark text-ink/70">Joyero: {m.joyero}</Link> : null}
                    {m.tipo === "pago_joyero" ? <Link href={`/panel/liquidaciones/${m.registro_id}`} className="hover:text-gold-dark text-[11px] underline-offset-2 hover:underline">ver liquidación</Link> : null}
                  </span>
                  {m.detalle ? <span className="text-ink/65 truncate">{m.detalle}</span> : null}
                  <span className="text-ink/40 text-[11px]">
                    {m.usuario ? `Registró: ${m.usuario}` : "Sistema"}
                    {m.referencia ? ` · ref. ${m.referencia}` : ""}
                  </span>
                </span>
                <span className={cn("text-right font-medium tabular-nums", m.signo === 1 && "text-sage", m.signo === -1 && "text-clay")}>
                  {m.monto === null ? "—" : `${m.signo === 1 ? "+" : m.signo === -1 ? "−" : ""}${moneda(m.monto)}`}
                </span>
              </div>
              <Acciones m={m} originales={originales} volverA={volverA} />
            </li>
          ))}
        </ul>
      )}
      <Paginacion pagina={pagina} paginas={paginas} total={total} porPagina={porPagina} opcionesPorPagina={POR_PAGINA_MOVIMIENTOS} enlace={enlace} />
    </Tarjeta>
  );
}

function Acciones({ m, originales, volverA }: { m: Movimiento; originales: Originales; volverA: string }) {
  const caja = (hijos: React.ReactNode) => <div className="flex flex-wrap justify-end gap-2">{hijos}</div>;

  switch (m.tipo) {
    case "cobro": {
      const p = originales.pagos.get(m.registro_id);
      if (!p) return null;
      return caja(
        <>
          <EditorRegistro accion={editarPago} ocultos={{ id: p.id }} campos={camposPago(p)} titulo={`Corregir cobro de ${m.numero}`} />
          <BotonEliminar accion={eliminarPago} ocultos={{ id: p.id }} pregunta={`¿Eliminar el cobro de ${moneda(Number(p.monto))}?`} detalle="El saldo de la orden vuelve a subir en ese monto." />
        </>,
      );
    }
    case "venta":
    case "recepcion": {
      const o = originales.ordenes.get(m.registro_id);
      if (!o) return null;
      return caja(
        <>
          <EditorRegistro accion={editarOrden} ocultos={{ id: o.id }} campos={camposOrden(o)} titulo={`Corregir ${o.numero}`} etiqueta="Editar orden" motivoObligatorio />
          <BotonEliminar
            accion={eliminarOrden}
            ocultos={{ id: o.id, volver_a: volverA }}
            etiqueta="Eliminar orden"
            pregunta={`¿Eliminar ${o.numero} por completo?`}
            detalle="Se borran sus trabajos, cotizaciones, asignaciones, cobros, fotos e historial. Se bloquea si tiene garantías o trabajos ya liquidados al joyero."
            motivoObligatorio
          />
        </>,
      );
    }
    case "costo_joyero": {
      const a = originales.asignaciones.get(m.registro_id);
      if (!a) return null;
      const activa = ["asignada", "en_proceso", "terminada"].includes(a.estado);
      return caja(
        <>
          <EditorRegistro accion={editarAsignacion} ocultos={{ id: a.id }} campos={camposAsignacion(a)} titulo={`Corregir trabajo de ${m.joyero ?? "joyero"}`} />
          {!activa ? <BotonEliminar accion={eliminarAsignacion} ocultos={{ id: a.id }} pregunta="¿Eliminar esta asignación?" detalle="Su costo deja de contar en la orden y en el joyero." /> : null}
        </>,
      );
    }
    case "pago_joyero": {
      const l = originales.liquidaciones.get(m.registro_id);
      if (!l) return null;
      return caja(
        <>
          <EditorRegistro accion={editarLiquidacion} ocultos={{ id: l.id }} campos={camposLiquidacion(l)} titulo="Corregir pago al joyero" />
          <BotonEliminar
            accion={eliminarLiquidacion}
            ocultos={{ id: l.id, volver_a: volverA }}
            pregunta="¿Eliminar esta liquidación pagada?"
            detalle="Sus trabajos vuelven a quedar pendientes de pago al joyero."
            motivoObligatorio
          />
        </>,
      );
    }
    case "estado": {
      const h = originales.historial.get(m.registro_id);
      if (!h) return null;
      return caja(
        <>
          <EditorRegistro accion={editarHistorial} ocultos={{ id: h.id }} campos={[{ nombre: "comentario", etiqueta: "COMENTARIO", tipo: "area", valor: h.comentario }]} titulo="Corregir comentario" />
          <BotonEliminar accion={eliminarHistorial} ocultos={{ id: h.id }} pregunta="¿Eliminar este movimiento del historial?" detalle="El estado actual de la orden no cambia." />
        </>,
      );
    }
    case "cotizacion":
      return m.orden_id ? caja(<Link href={`/panel/ordenes/${m.orden_id}?tab=cotizaciones`} className="text-ink/50 hover:text-gold-dark text-[11px] underline-offset-2 hover:underline">Las cotizaciones se gestionan en su versión dentro de la orden</Link>) : null;
  }
}
