import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { ChipActivo } from "@/components/ui/chip";
import { Paginacion } from "@/components/ui/paginacion";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { listarClientes, POR_PAGINA_CLIENTES } from "@/lib/datos/clientes";
import { constructorDeEnlaces, leerTexto, paginar, type Parametros } from "@/lib/url";

import { FormularioCliente } from "./formulario";

export const metadata: Metadata = { title: "Clientes" };

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sesion = await requerirLectura();
  const params = await searchParams;
  const q = leerTexto(params, "q");
  const soloActivos = leerTexto(params, "inactivos") !== "1";

  const total0 = await listarClientes({ busqueda: q, soloActivos, pagina: 1, porPagina: 1 });
  const { pagina, paginas, porPagina } = paginar(params, total0.total, POR_PAGINA_CLIENTES);
  const { filas, total } = await listarClientes({ busqueda: q, soloActivos, pagina, porPagina });
  const enlace = constructorDeEnlaces("/panel/clientes", { q, inactivos: soloActivos ? undefined : "1", pagina, porPagina });
  const puedeEditar = !soloLectura(sesion);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Clientes">
          <form method="get" className="flex items-center gap-2">
            <label className="border-ink/14 bg-paper rounded-field flex items-center gap-2 border px-3 py-2">
              <Search size={14} className="text-ink/40" />
              <input name="q" defaultValue={q} placeholder="Nombre o teléfono" className="w-[160px] bg-transparent text-[12.5px] outline-none sm:w-[220px]" />
            </label>
            {!soloActivos ? <input type="hidden" name="inactivos" value="1" /> : null}
            <Boton type="submit" tamano="sm" variante="contorno">BUSCAR</Boton>
          </form>
        </TarjetaEncabezado>

        {filas.length === 0 ? (
          <Vacio
            titulo={q ? "Sin resultados" : "Todavía no hay clientes"}
            descripcion={q ? `No hay clientes que coincidan con «${q}».` : "El primer cliente se crea aquí o directamente al recibir una pieza."}
          />
        ) : (
          <Tabla minAncho={640}>
            <Thead>
              <Th>Cliente</Th>
              <Th>Contacto</Th>
              <Th className="text-right">Órdenes</Th>
              <Th>Estado</Th>
            </Thead>
            <Tbody>
              {filas.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/panel/clientes/${c.id}`} className={`hover:text-gold-dark block font-medium ${c.activo ? "" : "text-ink/40"}`}>{c.nombre}</Link>
                    {c.direccion ? <span className="text-ink/45 block text-[11.5px]">{c.direccion}</span> : null}
                  </Td>
                  <Td className="text-ink/70 text-[12px]">{[c.telefono, c.correo].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td className="text-right tabular-nums">{c.ordenes}</Td>
                  <Td><ChipActivo activo={c.activo} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Tabla>
        )}

        <Paginacion pagina={pagina} paginas={paginas} total={total} porPagina={porPagina} opcionesPorPagina={POR_PAGINA_CLIENTES} enlace={enlace} />
        <div className="border-ink/6 border-t px-5 py-2 text-[11px]">
          <Link href={enlace({ inactivos: soloActivos ? "1" : undefined, pagina: 1 })} className="text-ink/45 hover:text-gold-dark">
            {soloActivos ? "Mostrar también inactivos" : "Solo activos"}
          </Link>
        </div>
      </Tarjeta>

      {puedeEditar ? (
        <aside className="flex flex-col gap-4">
          <Tarjeta className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">NUEVO</span>
              <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Cliente</h3>
            </div>
            <FormularioCliente inicial={null} />
          </Tarjeta>
        </aside>
      ) : null}
    </div>
  );
}
