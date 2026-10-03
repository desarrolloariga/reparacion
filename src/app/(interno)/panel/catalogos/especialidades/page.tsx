import type { Metadata } from "next";
import Link from "next/link";

import { Aviso } from "@/components/ui/aviso";
import { ChipActivo } from "@/components/ui/chip";
import { CLASE_BOTON_FILA, FormularioAlternar } from "@/components/ui/formulario-alternar";
import { DisposicionCatalogo, idEditar, PanelFormulario, type ParamsBusqueda } from "@/components/ui/panel-formulario";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { alternarEspecialidad } from "@/lib/acciones/catalogos";
import { requerirAdmin } from "@/lib/auth/guardas";
import { listarEspecialidades } from "@/lib/datos/catalogos";

import { FormularioEspecialidad } from "./formulario";

export const metadata: Metadata = { title: "Especialidades" };

const RUTA = "/panel/catalogos/especialidades";

export default async function PaginaEspecialidades({ searchParams }: { searchParams: ParamsBusqueda }) {
  await requerirAdmin();
  const params = await searchParams;
  const editar = idEditar(params);
  const especialidades = await listarEspecialidades();
  const inicial = editar ? (especialidades.find((e) => e.id === editar) ?? null) : null;

  return (
    <DisposicionCatalogo>
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Especialidades">
          <span className="text-ink/45 text-[12px]">{especialidades.length} en total</span>
        </TarjetaEncabezado>

        {params.guardado === "1" ? (
          <div className="px-5 pt-4">
            <Aviso tono="ok">Especialidad guardada.</Aviso>
          </div>
        ) : null}

        {especialidades.length === 0 ? (
          <Vacio titulo="Sin especialidades" descripcion="Crea la primera desde el formulario." />
        ) : (
          <Tabla minAncho={520}>
            <Thead>
              <Th>Especialidad</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </Thead>
            <Tbody>
              {especialidades.map((e) => (
                <Tr key={e.id} className={e.id === editar ? "bg-gold/6" : undefined}>
                  <Td className={e.activo ? "font-medium" : "text-ink/40"}>{e.nombre}</Td>
                  <Td><ChipActivo activo={e.activo} /></Td>
                  <Td className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`${RUTA}?editar=${e.id}`} className={CLASE_BOTON_FILA}>Editar</Link>
                      <FormularioAlternar id={e.id} activo={e.activo} accion={alternarEspecialidad} />
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Tabla>
        )}
      </Tarjeta>

      <PanelFormulario
        eyebrow={inicial ? "EDITAR" : "NUEVA"}
        titulo={inicial ? inicial.nombre : "Especialidad"}
        editando={Boolean(inicial)}
        rutaCancelar={RUTA}
        nota="Las especialidades se asignan a joyeros y a tipos de trabajo para sugerir quién puede hacer cada orden. No se borran: se desactivan."
      >
        <FormularioEspecialidad key={inicial?.id ?? "nueva"} inicial={inicial} />
      </PanelFormulario>
    </DisposicionCatalogo>
  );
}
