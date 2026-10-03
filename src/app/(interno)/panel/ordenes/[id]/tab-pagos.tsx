import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado, TarjetaIndicador } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { eliminarPago } from "@/lib/acciones/pagos";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { saldoDe, type Pago } from "@/lib/datos/taller";
import { fecha, moneda } from "@/lib/format";

import { FormularioPago } from "./formulario-pago";

const TIPO: Record<string, string> = { anticipo: "Anticipo", saldo: "Saldo", total: "Pago total" };
const FORMA: Record<string, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", otro: "Otro" };

export function TabPagos({ datos, pagos, lectura, esAdmin, hoy }: { datos: OrdenCompleta; pagos: Pago[]; lectura: boolean; esAdmin: boolean; hoy: string }) {
  const { orden } = datos;
  const precio = Number(orden.precio_cliente);
  const { cobrado, saldo } = saldoDe(precio, pagos);
  const puedeCobrar = !lectura && orden.estado !== "anulada" && orden.estado !== "rechazada" && saldo > 0.009;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaIndicador etiqueta="PRECIO AL CLIENTE" valor={precio > 0 ? moneda(precio) : "—"} nota={precio === 0 ? (orden.es_garantia ? "garantía sin cobro" : "aún sin cotización aprobada") : undefined} />
        <TarjetaIndicador etiqueta="COBRADO" valor={moneda(cobrado)} nota={`${pagos.length} ${pagos.length === 1 ? "pago" : "pagos"}`} />
        <TarjetaIndicador etiqueta="SALDO" valor={moneda(saldo)} nota={saldo <= 0.009 ? "sin saldo pendiente" : orden.entregada_con_saldo ? "entregada con saldo pendiente" : "pendiente de cobro"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Pagos registrados" />
          {pagos.length === 0 ? (
            <Vacio titulo="Sin pagos" descripcion="Los anticipos y el saldo se registran aquí; la entrega exige saldo en cero (o marcarla explícitamente con saldo)." className="py-10" />
          ) : (
            <Tabla minAncho={520}>
              <Thead>
                <Th>Fecha</Th>
                <Th>Tipo</Th>
                <Th>Forma</Th>
                <Th>Referencia</Th>
                <Th className="text-right">Monto</Th>
                {esAdmin && orden.estado !== "entregada" ? <Th /> : null}
              </Thead>
              <Tbody>
                {pagos.map((p) => (
                  <Tr key={p.id}>
                    <Td className="tabular-nums">{fecha(p.fecha + "T12:00:00")}</Td>
                    <Td>{TIPO[p.tipo] ?? p.tipo}</Td>
                    <Td>{FORMA[p.forma_pago] ?? p.forma_pago}</Td>
                    <Td className="text-ink/60">{p.referencia ?? "—"}<span className="text-ink/40 block text-[10.5px]">{p.registrado ?? ""}</span></Td>
                    <Td className="text-right font-medium tabular-nums">{moneda(Number(p.monto))}</Td>
                    {esAdmin && orden.estado !== "entregada" ? (
                      <Td className="text-right">
                        <form action={eliminarPago}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="text-ink/40 hover:text-clay cursor-pointer text-[11px] underline-offset-2 hover:underline">Eliminar</button>
                        </form>
                      </Td>
                    ) : null}
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          )}
        </Tarjeta>

        {puedeCobrar ? (
          <Tarjeta className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">REGISTRAR</span>
              <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Cobro</h3>
            </div>
            <FormularioPago ordenId={orden.id} saldo={saldo} hoy={hoy} />
          </Tarjeta>
        ) : null}
      </div>
    </div>
  );
}
