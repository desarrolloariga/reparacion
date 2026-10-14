import type { Metadata } from "next";
import Link from "next/link";

import { camposPago } from "@/components/admin/campos";
import { BotonEliminar, EditorRegistro } from "@/components/admin/controles";
import { Boton } from "@/components/ui/boton";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado, TarjetaIndicador } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { editarPago, eliminarPago } from "@/lib/acciones/admin";
import { requerirLectura } from "@/lib/auth/guardas";
import { listarIngresos } from "@/lib/datos/ingresos";
import { fecha, moneda } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { ETIQUETA_FORMA_PAGO, ETIQUETA_TIPO_PAGO, FORMAS_PAGO, type FormaPago, type TipoPago } from "@/lib/reparaciones/pagos";
import { CLAVES_PERIODO, ETIQUETA_PERIODO, leerRango } from "@/lib/reparaciones/periodos";
import { cn } from "@/lib/utils";
import type { Parametros } from "@/lib/url";

export const metadata: Metadata = { title: "Ingresos" };

/**
 * Historial de ingresos: todos los cobros a clientes por fecha de pago. El
 * administrador puede corregir o eliminar cada uno; los demás roles solo ven.
 */
export default async function PaginaIngresos({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sesion = await requerirLectura();
  const params = await searchParams;
  const rango = leerRango(params, hoyISO());
  const ingresos = await listarIngresos(rango.desde, rango.hasta);
  const esAdmin = sesion.rol === "admin";

  const total = ingresos.reduce((s, p) => s + Number(p.monto), 0);
  const porForma = FORMAS_PAGO.map((f) => ({ forma: f, monto: ingresos.filter((p) => p.forma_pago === f).reduce((s, p) => s + Number(p.monto), 0) })).filter((x) => x.monto > 0);

  return (
    <div className="flex flex-col gap-5">
      <Tarjeta className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <span className="flex flex-wrap items-center gap-1">
          {CLAVES_PERIODO.map((c) => (
            <Link key={c} href={`/panel/ingresos?periodo=${c}`} className={cn("rounded-field px-3 py-[6px] text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors", rango.clave === c ? "bg-ink text-gold-light" : "text-ink/55 hover:bg-ink/6")}>
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaIndicador etiqueta="COBRADO EN EL PERÍODO" valor={moneda(total)} nota={`${ingresos.length} pagos`} />
        {porForma.slice(0, 3).map((f) => (
          <TarjetaIndicador key={f.forma} etiqueta={ETIQUETA_FORMA_PAGO[f.forma].toUpperCase()} valor={moneda(f.monto)} nota={total > 0 ? `${((f.monto / total) * 100).toFixed(0)} % del total` : undefined} />
        ))}
      </div>

      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Pagos de clientes">
          <span className="text-ink/45 text-[12px]">{fecha(rango.desde + "T12:00:00")} – {fecha(rango.hasta + "T12:00:00")} · por fecha de pago</span>
        </TarjetaEncabezado>
        {ingresos.length === 0 ? (
          <Vacio titulo="Sin ingresos en el período" descripcion="Los cobros se registran desde la pestaña Pagos de cada orden." className="py-10" />
        ) : (
          <Tabla minAncho={esAdmin ? 980 : 760}>
            <Thead>
              <Th>Fecha</Th>
              <Th>Orden</Th>
              <Th>Cliente</Th>
              <Th>Tipo</Th>
              <Th>Forma</Th>
              <Th>Referencia</Th>
              <Th className="text-right">Monto</Th>
              {esAdmin ? <Th className="text-right">Admin</Th> : null}
            </Thead>
            <Tbody>
              {ingresos.map((p) => (
                <Tr key={p.id}>
                  <Td className="tabular-nums">{fecha(p.fecha + "T12:00:00")}</Td>
                  <Td><Link href={`/panel/ordenes/${p.orden_id}?tab=pagos`} className="hover:text-gold-dark font-mono text-[12px] font-medium">{p.numero}</Link></Td>
                  <Td>{p.cliente_id ? <Link href={`/panel/clientes/${p.cliente_id}`} className="hover:text-gold-dark">{p.cliente}</Link> : p.cliente}</Td>
                  <Td>{ETIQUETA_TIPO_PAGO[p.tipo as TipoPago] ?? p.tipo}</Td>
                  <Td>{ETIQUETA_FORMA_PAGO[p.forma_pago as FormaPago] ?? p.forma_pago}</Td>
                  <Td className="text-ink/60">{p.referencia ?? "—"}<span className="text-ink/40 block text-[10.5px]">{p.registrado ?? ""}</span></Td>
                  <Td className="text-right font-medium tabular-nums">{moneda(Number(p.monto))}</Td>
                  {esAdmin ? (
                    <Td className="text-right">
                      <span className="inline-flex flex-wrap justify-end gap-2">
                        <EditorRegistro accion={editarPago} ocultos={{ id: p.id }} campos={camposPago(p)} titulo={`Corregir pago de ${p.numero}`} />
                        <BotonEliminar accion={eliminarPago} ocultos={{ id: p.id }} pregunta={`¿Eliminar el pago de ${moneda(Number(p.monto))}?`} detalle="El saldo de la orden vuelve a subir en ese monto." />
                      </span>
                    </Td>
                  ) : null}
                </Tr>
              ))}
            </Tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
