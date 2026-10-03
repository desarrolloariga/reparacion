import { ChipEstadoOrden } from "@/components/ordenes/chip-estado";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { fechaHora } from "@/lib/format";
import type { EstadoOrden } from "@/lib/reparaciones/estados";

export function TabHistorial({ datos }: { datos: OrdenCompleta }) {
  const { historial } = datos;

  return (
    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo="Historial">
        <span className="text-ink/45 text-[12px]">{historial.length} movimientos</span>
      </TarjetaEncabezado>
      <ol className="m-0 list-none divide-y divide-ink/6 p-0">
        {historial.map((h) => {
          const nota = h.estado_anterior === h.estado_nuevo;
          return (
            <li key={h.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3">
              <span className="text-ink/45 w-[140px] shrink-0 text-[11.5px] tabular-nums">{fechaHora(h.creado_en)}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  {nota ? (
                    <span className="text-ink/55 text-[10px] font-semibold tracking-[0.12em] uppercase">Nota</span>
                  ) : (
                    <>
                      {h.estado_anterior ? <ChipEstadoOrden estado={h.estado_anterior as EstadoOrden} corto /> : <span className="text-ink/40 text-[11px]">—</span>}
                      <span className="text-ink/35">→</span>
                      <ChipEstadoOrden estado={h.estado_nuevo as EstadoOrden} corto />
                    </>
                  )}
                </span>
                {h.comentario ? <span className="text-[12.5px]">{h.comentario}</span> : null}
              </span>
              <span className="text-ink/45 text-[11.5px]">{h.usuario ?? "Sistema"}</span>
            </li>
          );
        })}
      </ol>
    </Tarjeta>
  );
}
