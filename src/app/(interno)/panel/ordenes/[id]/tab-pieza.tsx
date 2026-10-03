import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { moneda } from "@/lib/format";
import { esTerminal } from "@/lib/reparaciones/estados";

import { FormularioFechaPrometida, FormularioPieza } from "./formularios-pieza";

export function TabPieza({ datos, lectura }: { datos: OrdenCompleta; lectura: boolean }) {
  const { orden, lineas } = datos;
  const editable = !lectura && !esTerminal(orden.estado);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <Tarjeta className="flex flex-col gap-5 p-6">
        <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Datos de la pieza</h3>
        {editable ? (
          <FormularioPieza orden={orden} />
        ) : (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
            <dt className="text-ink/45">Descripción</dt><dd className="m-0">{orden.descripcion_pieza}</dd>
            <dt className="text-ink/45">Material</dt><dd className="m-0">{orden.material ?? "—"}</dd>
            <dt className="text-ink/45">Quilataje</dt><dd className="m-0">{orden.quilataje ?? "—"}</dd>
            <dt className="text-ink/45">Peso entrada</dt><dd className="m-0">{orden.peso_entrada_g !== null ? `${orden.peso_entrada_g} g` : "—"}</dd>
            <dt className="text-ink/45">Peso salida</dt><dd className="m-0">{orden.peso_salida_g !== null ? `${orden.peso_salida_g} g` : "—"}</dd>
            <dt className="text-ink/45">Piedras</dt><dd className="m-0">{orden.piedras ?? "—"}</dd>
            <dt className="text-ink/45">Observaciones</dt><dd className="m-0 whitespace-pre-line">{orden.observaciones_recepcion ?? "—"}</dd>
            {orden.motivo_anulacion ? (<><dt className="text-clay">Motivo de anulación</dt><dd className="m-0">{orden.motivo_anulacion}</dd></>) : null}
          </dl>
        )}
      </Tarjeta>

      <div className="flex flex-col gap-5">
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Trabajos">
            <span className="text-ink/45 text-[12px]">{orden.dias_estimados ?? 0} días hábiles</span>
          </TarjetaEncabezado>
          <Tabla minAncho={420}>
            <Thead>
              <Th>Trabajo</Th>
              <Th>Complejidad</Th>
              <Th className="text-right">Días</Th>
              <Th className="text-right">Precio</Th>
            </Thead>
            <Tbody>
              {lineas.map((l) => (
                <Tr key={l.id}>
                  <Td>
                    <span className="block font-medium">{l.cantidad > 1 ? `${l.cantidad} × ` : ""}{l.tipo_trabajo}</span>
                    {l.descripcion ? <span className="text-ink/45 block text-[11.5px]">{l.descripcion}</span> : null}
                  </Td>
                  <Td>{l.complejidad}</Td>
                  <Td className="text-right tabular-nums">{l.dias_estimados}</Td>
                  <Td className="text-right tabular-nums">{Number(l.precio_cliente) > 0 ? moneda(Number(l.precio_cliente)) : <span className="text-ink/30">—</span>}</Td>
                </Tr>
              ))}
            </Tbody>
          </Tabla>
          <p className="text-ink/45 m-0 px-5 py-3 text-[11px] leading-relaxed">
            Los trabajos se fijan al aprobar la cotización: para cambiarlos, crea una versión nueva.
          </p>
        </Tarjeta>

        {editable ? (
          <Tarjeta className="flex flex-col gap-4 p-6">
            <h3 className="font-display m-0 text-[18px] leading-tight font-normal">Fecha prometida al cliente</h3>
            <FormularioFechaPrometida orden={orden} />
          </Tarjeta>
        ) : null}
      </div>
    </div>
  );
}
