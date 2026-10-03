import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChipEstadoOrden, ChipTipoOrden } from "@/components/ordenes/chip-estado";
import { Semaforo } from "@/components/ordenes/semaforo";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { ChipActivo } from "@/components/ui/chip";
import { FormularioAlternar } from "@/components/ui/formulario-alternar";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { alternarCliente } from "@/lib/acciones/clientes";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { clientePorId } from "@/lib/datos/clientes";
import { ordenesDeCliente } from "@/lib/datos/ordenes";
import { evaluarSemaforos } from "@/lib/datos/semaforo";
import { fecha, moneda } from "@/lib/format";

import { FormularioCliente } from "../formulario";

export const metadata: Metadata = { title: "Cliente" };

export default async function PaginaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sesion = await requerirLectura();
  const { id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [cliente, ordenes, q] = await Promise.all([clientePorId(id), ordenesDeCliente(id), searchParams]);
  if (!cliente) notFound();
  const semaforos = await evaluarSemaforos(ordenes);
  const lectura = soloLectura(sesion);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="flex flex-col gap-5">
        {q.creado === "1" ? <Aviso tono="ok">Cliente creado.</Aviso> : null}

        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo={`Órdenes de ${cliente.nombre}`}>
            <span className="flex items-center gap-3">
              <span className="text-ink/45 text-[12px]">{ordenes.length} en total</span>
              {!lectura ? (
                <Link href={`/panel/ordenes/nueva?cliente=${cliente.id}`}>
                  <Boton tamano="sm">RECIBIR PIEZA</Boton>
                </Link>
              ) : null}
            </span>
          </TarjetaEncabezado>
          {ordenes.length === 0 ? (
            <Vacio titulo="Sin órdenes todavía" descripcion="Cuando reciba una pieza aparecerá aquí con su estado y su fecha prometida." className="py-10" />
          ) : (
            <Tabla minAncho={640}>
              <Thead>
                <Th>Orden</Th>
                <Th>Pieza</Th>
                <Th>Estado</Th>
                <Th>Promesa</Th>
                <Th className="text-right">Precio</Th>
              </Thead>
              <Tbody>
                {ordenes.map((o) => (
                  <Tr key={o.id}>
                    <Td>
                      <Link href={`/panel/ordenes/${o.id}`} className="hover:text-gold-dark block font-mono text-[12px] font-medium">{o.numero}</Link>
                      <span className="text-ink/45 text-[11px] tabular-nums">{fecha(o.fecha_recepcion + "T12:00:00")}</span>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2"><ChipTipoOrden tipo={o.tipo} /><span>{o.descripcion_pieza}</span></span>
                    </Td>
                    <Td><ChipEstadoOrden estado={o.estado} corto /></Td>
                    <Td><Semaforo evaluacion={semaforos.get(o.id)} conFecha /></Td>
                    <Td className="text-right tabular-nums">{o.precio_cliente > 0 ? moneda(Number(o.precio_cliente)) : "—"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          )}
        </Tarjeta>
      </div>

      <Tarjeta className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">CLIENTE</span>
            <h3 className="font-display m-0 text-[22px] leading-tight font-normal">{cliente.nombre}</h3>
          </div>
          <span className="flex items-center gap-2">
            <ChipActivo activo={cliente.activo} />
            {!lectura ? <FormularioAlternar id={cliente.id} activo={cliente.activo} accion={alternarCliente} /> : null}
          </span>
        </div>
        {lectura ? (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
            <dt className="text-ink/45">Teléfono</dt><dd className="m-0">{cliente.telefono ?? "—"}</dd>
            <dt className="text-ink/45">Correo</dt><dd className="m-0">{cliente.correo ?? "—"}</dd>
            <dt className="text-ink/45">Dirección</dt><dd className="m-0">{cliente.direccion ?? "—"}</dd>
            <dt className="text-ink/45">Notas</dt><dd className="m-0">{cliente.notas ?? "—"}</dd>
          </dl>
        ) : (
          <FormularioCliente inicial={cliente} />
        )}
      </Tarjeta>
    </div>
  );
}
