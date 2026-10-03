import type { Metadata } from "next";
import Link from "next/link";

import { Chip } from "@/components/ui/chip";
import { CLASE_BOTON_FILA } from "@/components/ui/formulario-alternar";
import { DisposicionCatalogo, idEditar, PanelFormulario, type ParamsBusqueda } from "@/components/ui/panel-formulario";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { eliminarDia } from "@/lib/acciones/calendario";
import { requerirAdmin } from "@/lib/auth/guardas";
import { aniosConExcepciones, listarExcepciones } from "@/lib/datos/calendario";
import { fecha } from "@/lib/format";
import { diaSemanaISO, hoyISO, NOMBRE_DIA_SEMANA } from "@/lib/reparaciones/dias-habiles";

import { FormularioDia } from "./formulario";

export const metadata: Metadata = { title: "Calendario laboral" };

const RUTA = "/panel/catalogos/calendario";

export default async function PaginaCalendario({ searchParams }: { searchParams: ParamsBusqueda }) {
  await requerirAdmin();
  const params = await searchParams;
  const editar = idEditar(params);
  const anioActual = Number(hoyISO().slice(0, 4));
  const anio = typeof params.anio === "string" && /^\d{4}$/.test(params.anio) ? Number(params.anio) : anioActual;

  const [dias, anios] = await Promise.all([listarExcepciones(anio), aniosConExcepciones()]);
  const opcionesAnio = [...new Set([...anios, anioActual, anioActual + 1])].sort();
  const inicial = editar ? (dias.find((d) => d.id === editar) ?? null) : null;

  return (
    <DisposicionCatalogo>
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo={`Excepciones ${anio}`}>
          <span className="flex items-center gap-2 text-[12px]">
            {opcionesAnio.map((a) => (
              <Link
                key={a}
                href={`${RUTA}?anio=${a}`}
                className={a === anio ? "text-ink font-semibold tabular-nums" : "text-ink/45 hover:text-gold-dark tabular-nums"}
              >
                {a}
              </Link>
            ))}
          </span>
        </TarjetaEncabezado>

        {dias.length === 0 ? (
          <Vacio titulo={`Sin excepciones en ${anio}`} descripcion="Agrega feriados o días abiertos desde el formulario." />
        ) : (
          <Tabla minAncho={560}>
            <Thead>
              <Th>Fecha</Th>
              <Th>Día</Th>
              <Th>Tipo</Th>
              <Th>Descripción</Th>
              <Th className="text-right">Acciones</Th>
            </Thead>
            <Tbody>
              {dias.map((d) => (
                <Tr key={d.id} className={d.id === editar ? "bg-gold/6" : undefined}>
                  <Td className="font-medium tabular-nums">{fecha(d.fecha + "T12:00:00")}</Td>
                  <Td className="text-ink/55">{NOMBRE_DIA_SEMANA[diaSemanaISO(d.fecha)]}</Td>
                  <Td><Chip tono={d.es_habil ? "exito" : "error"}>{d.es_habil ? "Abre" : "Cierra"}</Chip></Td>
                  <Td className="text-ink/70">{d.descripcion ?? "—"}</Td>
                  <Td className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`${RUTA}?anio=${anio}&editar=${d.id}`} className={CLASE_BOTON_FILA}>Editar</Link>
                      <form action={eliminarDia} className="inline">
                        <input type="hidden" name="id" value={d.id} />
                        <button type="submit" className="border-clay/30 text-clay hover:bg-clay/8 rounded-field cursor-pointer border px-3 py-[6px] text-[11px] transition-colors">
                          Eliminar
                        </button>
                      </form>
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Tabla>
        )}
      </Tarjeta>

      <PanelFormulario
        eyebrow={inicial ? "EDITAR" : "NUEVA EXCEPCIÓN"}
        titulo={inicial ? fecha(inicial.fecha + "T12:00:00") : "Feriado o día abierto"}
        editando={Boolean(inicial)}
        rutaCancelar={`${RUTA}?anio=${anio}`}
        nota="La regla semanal (qué días abre el taller) está en Parámetros. Aquí van las excepciones: un feriado que cierra o un domingo que abre."
      >
        <FormularioDia key={inicial?.id ?? "nuevo"} inicial={inicial} />
      </PanelFormulario>
    </DisposicionCatalogo>
  );
}
