import type { Metadata } from "next";
import Link from "next/link";

import { ChipEstadoOrden } from "@/components/ordenes/chip-estado";
import { Semaforo } from "@/components/ordenes/semaforo";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado, TarjetaIndicador } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirLectura } from "@/lib/auth/guardas";
import { alertasActivas, type OrdenAlerta } from "@/lib/datos/alertas";

export const metadata: Metadata = { title: "Alertas" };

/** Tablero de arranque de cada mañana: vencidas y por vencer, por tipo de mora. */
export default async function PaginaAlertas() {
  await requerirLectura();
  const a = await alertasActivas();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaIndicador etiqueta="MORA DEL JOYERO · VENCIDAS" valor={a.joyero.vencidas.length} nota="pasó la fecha de compromiso" />
        <TarjetaIndicador etiqueta="MORA DEL JOYERO · POR VENCER" valor={a.joyero.porVencer.length} nota="dentro del umbral" />
        <TarjetaIndicador etiqueta="FRENTE AL CLIENTE · VENCIDAS" valor={a.cliente.vencidas.length} nota="pasó la fecha prometida" />
        <TarjetaIndicador etiqueta="FRENTE AL CLIENTE · POR VENCER" valor={a.cliente.porVencer.length} nota={`${a.activas} órdenes activas`} />
      </div>

      <Seccion titulo="Mora del joyero" ayuda="Órdenes asignadas o en proceso, medidas contra la fecha de compromiso del joyero." vencidas={a.joyero.vencidas} porVencer={a.joyero.porVencer} conJoyero />
      <Seccion titulo="Mora frente al cliente" ayuda="Órdenes en cualquier otro estado activo, medidas contra la fecha prometida al cliente: cotizar, revisar, entregar." vencidas={a.cliente.vencidas} porVencer={a.cliente.porVencer} />
    </div>
  );
}

function Seccion({ titulo, ayuda, vencidas, porVencer, conJoyero = false }: { titulo: string; ayuda: string; vencidas: OrdenAlerta[]; porVencer: OrdenAlerta[]; conJoyero?: boolean }) {
  const filas = [...vencidas, ...porVencer];
  return (
    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo={titulo}>
        <span className="text-ink/45 text-[12px]">{ayuda}</span>
      </TarjetaEncabezado>
      {filas.length === 0 ? (
        <Vacio titulo="Nada vencido ni por vencer" descripcion="Todo lo activo va a tiempo." className="py-8" />
      ) : (
        <Tabla minAncho={760}>
          <Thead>
            <Th>Orden</Th>
            <Th>Cliente</Th>
            <Th>Pieza</Th>
            {conJoyero ? <Th>Joyero</Th> : null}
            <Th>Estado</Th>
            <Th>Semáforo</Th>
          </Thead>
          <Tbody>
            {filas.map((o) => (
              <Tr key={o.id} className={o.evaluacion.semaforo === "vencido" ? "bg-clay/4" : undefined}>
                <Td><Link href={`/panel/ordenes/${o.id}`} className="hover:text-gold-dark font-mono text-[12px] font-medium">{o.numero}</Link></Td>
                <Td>{o.cliente}<span className="text-ink/45 block text-[11px]">{o.cliente_telefono ?? ""}</span></Td>
                <Td>{o.descripcion_pieza}<span className="text-ink/45 block text-[11px]">{o.trabajos ?? ""}</span></Td>
                {conJoyero ? <Td>{o.joyero ?? "—"}</Td> : null}
                <Td><ChipEstadoOrden estado={o.estado} corto /></Td>
                <Td><Semaforo evaluacion={o.evaluacion} conFecha /></Td>
              </Tr>
            ))}
          </Tbody>
        </Tabla>
      )}
    </Tarjeta>
  );
}
