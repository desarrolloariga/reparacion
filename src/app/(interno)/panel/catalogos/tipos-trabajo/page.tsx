import type { Metadata } from "next";
import Link from "next/link";

import { Aviso } from "@/components/ui/aviso";
import { Chip, ChipActivo } from "@/components/ui/chip";
import { CLASE_BOTON_FILA, FormularioAlternar } from "@/components/ui/formulario-alternar";
import { DisposicionCatalogo, idEditar, PanelFormulario, type ParamsBusqueda } from "@/components/ui/panel-formulario";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { alternarTipoTrabajo } from "@/lib/acciones/catalogos";
import { requerirAdmin } from "@/lib/auth/guardas";
import { listarEspecialidades, listarTiposTrabajo } from "@/lib/datos/catalogos";
import { CATEGORIAS, ETIQUETA_CATEGORIA } from "@/lib/supabase/modelo";

import { FormularioTipoTrabajo } from "./formulario";

export const metadata: Metadata = { title: "Tipos de trabajo" };

const RUTA = "/panel/catalogos/tipos-trabajo";

export default async function PaginaTiposTrabajo({ searchParams }: { searchParams: ParamsBusqueda }) {
  await requerirAdmin();
  const params = await searchParams;
  const editar = idEditar(params);
  const [tipos, especialidades] = await Promise.all([listarTiposTrabajo(), listarEspecialidades(true)]);
  const inicial = editar ? (tipos.find((t) => t.id === editar) ?? null) : null;

  return (
    <DisposicionCatalogo>
      <div className="flex flex-col gap-5">
        {params.guardado === "1" ? <Aviso tono="ok">Tipo de trabajo guardado.</Aviso> : null}

        {CATEGORIAS.map((categoria) => {
          const lista = tipos.filter((t) => t.categoria === categoria);
          return (
            <Tarjeta key={categoria} className="overflow-hidden">
              <TarjetaEncabezado titulo={ETIQUETA_CATEGORIA[categoria]}>
                <span className="text-ink/45 text-[12px]">{lista.length} tipos</span>
              </TarjetaEncabezado>
              <Tabla minAncho={640}>
                <Thead>
                  <Th>Tipo de trabajo</Th>
                  <Th>Especialidad</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </Thead>
                <Tbody>
                  {lista.length === 0 ? (
                    <Tr><Td colSpan={4} className="text-ink/40 py-6 text-center">Sin tipos en esta categoría.</Td></Tr>
                  ) : lista.map((t) => (
                    <Tr key={t.id} className={t.id === editar ? "bg-gold/6" : undefined}>
                      <Td>
                        <span className={`block ${t.activo ? "font-medium" : "text-ink/40"}`}>{t.nombre}</span>
                        {t.descripcion ? <span className="text-ink/45 block text-[11.5px]">{t.descripcion}</span> : null}
                      </Td>
                      <Td>{t.especialidad ? <Chip>{t.especialidad}</Chip> : <span className="text-ink/30">—</span>}</Td>
                      <Td><ChipActivo activo={t.activo} /></Td>
                      <Td className="text-right">
                        <span className="inline-flex items-center gap-2">
                          <Link href={`${RUTA}?editar=${t.id}`} className={CLASE_BOTON_FILA}>Editar</Link>
                          <FormularioAlternar id={t.id} activo={t.activo} accion={alternarTipoTrabajo} />
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Tabla>
            </Tarjeta>
          );
        })}
      </div>

      <PanelFormulario
        eyebrow={inicial ? "EDITAR" : "NUEVO"}
        titulo={inicial ? inicial.nombre : "Tipo de trabajo"}
        editando={Boolean(inicial)}
        rutaCancelar={RUTA}
        nota="Cada tipo nuevo necesita sus días en la matriz de tiempos estándar; hasta entonces no se puede recibir una pieza con ese trabajo."
      >
        <FormularioTipoTrabajo
          key={inicial?.id ?? "nuevo"}
          inicial={inicial}
          especialidades={especialidades.map((e) => ({ id: e.id, nombre: e.nombre }))}
        />
      </PanelFormulario>
    </DisposicionCatalogo>
  );
}
