import Link from "next/link";
import { FileText } from "lucide-react";

import { ChipCotizacion } from "@/components/ordenes/chip-estado";
import { Boton } from "@/components/ui/boton";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { nuevaVersionCotizacion } from "@/lib/acciones/cotizaciones";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { fecha, fechaHora, moneda } from "@/lib/format";
import { estadoEfectivo, margenBajo } from "@/lib/reparaciones/cotizaciones";

export function TabCotizaciones({ datos, lectura, hoy }: { datos: OrdenCompleta; lectura: boolean; hoy: string }) {
  const { orden, cotizaciones } = datos;
  const borrador = cotizaciones.find((c) => c.estado === "borrador");
  const puedeCotizar = !lectura && (orden.estado === "recibida" || orden.estado === "cotizada");

  return (
    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo="Cotizaciones">
        {puedeCotizar ? (
          borrador ? (
            <Link href={`/panel/ordenes/${orden.id}/cotizaciones/${borrador.id}`}><Boton tamano="sm">ABRIR BORRADOR v{borrador.version}</Boton></Link>
          ) : (
            <form action={nuevaVersionCotizacion}>
              <input type="hidden" name="orden_id" value={orden.id} />
              <Boton type="submit" tamano="sm">{cotizaciones.length === 0 ? "COTIZAR" : "NUEVA VERSIÓN"}</Boton>
            </form>
          )
        ) : null}
      </TarjetaEncabezado>

      {cotizaciones.length === 0 ? (
        <Vacio
          titulo="Todavía no hay cotización"
          descripcion={orden.tipo === "creacion" ? "En una creación conviene subir y aprobar el diseño antes de cotizar." : "Diagnostica la pieza y arma las líneas con su precio y el costo del joyero: verás el margen antes de enviarla."}
          className="py-10"
        />
      ) : (
        <Tabla minAncho={720}>
          <Thead>
            <Th>Versión</Th>
            <Th>Estado</Th>
            <Th className="text-right">Al cliente</Th>
            <Th className="text-right">Costo joyero</Th>
            <Th className="text-right">Margen</Th>
            <Th>Validez</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {cotizaciones.map((c) => {
              const efectivo = estadoEfectivo(c, hoy);
              const margen = c.margen_estimado === null ? null : Number(c.margen_estimado);
              return (
                <Tr key={c.id} className={c.estado === "reemplazada" ? "text-ink/45" : undefined}>
                  <Td>
                    <span className="block font-medium">v{c.version}</span>
                    <span className="text-ink/45 block text-[11px]">{c.enviada_en ? `enviada ${fechaHora(c.enviada_en)}` : `creada ${fechaHora(c.creado_en)}`}</span>
                    {c.aprobada_por_nombre ? <span className="text-sage block text-[11px]">aprobó: {c.aprobada_por_nombre}</span> : null}
                    {c.motivo_rechazo ? <span className="text-clay block text-[11px]">{c.motivo_rechazo}</span> : null}
                  </Td>
                  <Td><ChipCotizacion estado={efectivo} /></Td>
                  <Td className="text-right tabular-nums">{moneda(Number(c.total_cliente))}</Td>
                  <Td className="text-right tabular-nums">{moneda(Number(c.total_costo_joyero))}</Td>
                  <Td className={`text-right tabular-nums ${margenBajo(margen) ? "text-clay font-semibold" : ""}`}>{margen === null ? "—" : `${margen.toFixed(1)} %`}</Td>
                  <Td className="text-ink/60 tabular-nums">{c.valido_hasta ? fecha(c.valido_hasta + "T12:00:00") : "—"}</Td>
                  <Td className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`/panel/ordenes/${orden.id}/cotizaciones/${c.id}`} className="border-ink/14 text-ink/55 hover:border-gold hover:text-ink rounded-field border px-3 py-[6px] text-[11px] transition-colors">
                        {c.estado === "borrador" && !lectura ? "Editar" : "Ver"}
                      </Link>
                      {c.estado !== "borrador" ? (
                        <a href={`/api/cotizaciones/${c.id}/pdf`} target="_blank" rel="noreferrer" className="border-ink/14 text-ink/55 hover:border-gold hover:text-ink rounded-field inline-flex items-center gap-1 border px-3 py-[6px] text-[11px] transition-colors">
                          <FileText size={12} /> PDF
                        </a>
                      ) : null}
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Tabla>
      )}
    </Tarjeta>
  );
}
