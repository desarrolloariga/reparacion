import Link from "next/link";

import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado, TarjetaIndicador } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import type { SaldoCliente, SaldoJoyero } from "@/lib/datos/movimientos";
import { fecha, moneda } from "@/lib/format";
import { ETIQUETA_ESTADO, type EstadoOrden } from "@/lib/reparaciones/estados";

/** Saldos pendientes: lo que deben los clientes y lo que se debe a los joyeros. */
export function VistaSaldos({ clientes, joyeros }: { clientes: SaldoCliente[]; joyeros: SaldoJoyero[] }) {
  const porCobrar = clientes.reduce((s, c) => s + c.saldo, 0);
  const porPagar = joyeros.reduce((s, j) => s + j.pendiente, 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaIndicador etiqueta="POR COBRAR A CLIENTES" valor={moneda(porCobrar)} nota={`${clientes.length} órdenes con saldo`} />
        <TarjetaIndicador etiqueta="POR PAGAR A JOYEROS" valor={moneda(porPagar)} nota={`${joyeros.reduce((s, j) => s + j.trabajos, 0)} trabajos terminados sin liquidar`} />
        <TarjetaIndicador etiqueta="DIFERENCIA" valor={moneda(porCobrar - porPagar)} nota="por cobrar − por pagar" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Saldos de clientes">
            <span className="text-ink/45 text-[12px]">Para corregir: abre la orden → Pagos (cobros) o Pieza (precio)</span>
          </TarjetaEncabezado>
          {clientes.length === 0 ? (
            <Vacio titulo="Nadie debe nada" descripcion="Todas las órdenes activas o entregadas están pagadas." className="py-10" />
          ) : (
            <Tabla minAncho={640}>
              <Thead>
                <Th>Orden</Th>
                <Th>Cliente</Th>
                <Th>Estado</Th>
                <Th className="text-right">Precio</Th>
                <Th className="text-right">Cobrado</Th>
                <Th className="text-right">Saldo</Th>
              </Thead>
              <Tbody>
                {clientes.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link href={`/panel/ordenes/${c.id}?tab=pagos`} className="hover:text-gold-dark font-mono text-[12px] font-medium">{c.numero}</Link>
                      <span className="text-ink/45 block text-[10.5px] tabular-nums">{fecha(c.fecha_recepcion + "T12:00:00")}</span>
                    </Td>
                    <Td><Link href={`/panel/clientes/${c.cliente_id}`} className="hover:text-gold-dark">{c.cliente}</Link></Td>
                    <Td className="text-[12px]">{ETIQUETA_ESTADO[c.estado as EstadoOrden] ?? c.estado}</Td>
                    <Td className="text-right tabular-nums">{moneda(c.precio_cliente)}</Td>
                    <Td className="text-right tabular-nums">{moneda(c.cobrado)}</Td>
                    <Td className={`text-right font-medium tabular-nums ${c.estado === "entregada" ? "text-clay" : ""}`}>{moneda(c.saldo)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          )}
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Pendiente de pago a joyeros">
            <Link href="/panel/liquidaciones" className="text-ink/45 hover:text-gold-dark text-[12px]">Liquidar</Link>
          </TarjetaEncabezado>
          {joyeros.length === 0 ? (
            <Vacio titulo="Nada pendiente" descripcion="Todos los trabajos terminados están liquidados." className="py-10" />
          ) : (
            <Tabla minAncho={360}>
              <Thead>
                <Th>Joyero</Th>
                <Th className="text-right">Trabajos</Th>
                <Th className="text-right">Pendiente</Th>
              </Thead>
              <Tbody>
                {joyeros.map((j) => (
                  <Tr key={j.joyero_id}>
                    <Td><Link href={`/panel/liquidaciones?joyero=${j.joyero_id}`} className="hover:text-gold-dark">{j.joyero}</Link></Td>
                    <Td className="text-right tabular-nums">{j.trabajos}</Td>
                    <Td className="text-right font-medium tabular-nums">{moneda(j.pendiente)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
