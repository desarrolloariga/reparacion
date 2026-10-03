import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { ChipEstadoOrden, ChipTipoOrden } from "@/components/ordenes/chip-estado";
import { Semaforo } from "@/components/ordenes/semaforo";
import { Boton } from "@/components/ui/boton";
import { Paginacion } from "@/components/ui/paginacion";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { listarOrdenes, POR_PAGINA_ORDENES, type FiltroOrdenes } from "@/lib/datos/ordenes";
import { evaluarSemaforos } from "@/lib/datos/semaforo";
import { fecha, moneda } from "@/lib/format";
import { ESTADOS_ORDEN, ETIQUETA_ESTADO, type EstadoOrden } from "@/lib/reparaciones/estados";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";
import { constructorDeEnlaces, leerTexto, paginar, type Parametros } from "@/lib/url";

export const metadata: Metadata = { title: "Órdenes" };

export default async function PaginaOrdenes({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sesion = await requerirLectura();
  const params = await searchParams;

  const q = leerTexto(params, "q");
  const estadoCrudo = leerTexto(params, "estado") || "activas";
  const estado = (ESTADOS_ORDEN as readonly string[]).includes(estadoCrudo) || estadoCrudo === "todas" ? (estadoCrudo as EstadoOrden | "todas") : "activas";
  const tipoCrudo = leerTexto(params, "tipo");
  const tipo = (CATEGORIAS as readonly string[]).includes(tipoCrudo) ? (tipoCrudo as CategoriaTrabajo) : undefined;
  const desde = leerTexto(params, "desde") || undefined;
  const hasta = leerTexto(params, "hasta") || undefined;
  const orden = leerTexto(params, "orden") === "fecha_control" ? "fecha_control" : "recientes";

  const filtro: FiltroOrdenes = { busqueda: q, estado, tipo, desde, hasta, orden };
  const conteo = await listarOrdenes({ ...filtro, pagina: 1, porPagina: 1 });
  const { pagina, paginas, porPagina } = paginar(params, conteo.total, POR_PAGINA_ORDENES);
  const { filas, total } = await listarOrdenes({ ...filtro, pagina, porPagina });
  const semaforos = await evaluarSemaforos(filas);

  const actuales = { q, estado, tipo, desde, hasta, orden, pagina, porPagina };
  const enlace = constructorDeEnlaces("/panel/ordenes", actuales);
  const puedeCrear = !soloLectura(sesion);

  return (
    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo="Órdenes">
        <span className="flex items-center gap-3">
          <span className="text-ink/45 text-[12px]">{total} {estado === "activas" ? "activas" : estado === "todas" ? "en total" : ETIQUETA_ESTADO[estado].toLowerCase()}</span>
          {puedeCrear ? (
            <Link href="/panel/ordenes/nueva"><Boton tamano="sm">RECIBIR PIEZA</Boton></Link>
          ) : null}
        </span>
      </TarjetaEncabezado>

      <form method="get" className="border-ink/6 flex flex-wrap items-end gap-3 border-b px-5 py-4">
        <label className="border-ink/14 bg-paper rounded-field flex items-center gap-2 border px-3 py-2">
          <Search size={14} className="text-ink/40" />
          <input name="q" defaultValue={q} placeholder="Número, cliente o pieza" className="w-[180px] bg-transparent text-[12.5px] outline-none sm:w-[240px]" />
        </label>
        <select name="estado" defaultValue={estado} className="border-ink/14 bg-paper rounded-field border px-3 py-2 text-[12.5px]">
          <option value="activas">Activas</option>
          <option value="todas">Todas</option>
          {ESTADOS_ORDEN.map((e) => <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>)}
        </select>
        <select name="tipo" defaultValue={tipo ?? ""} className="border-ink/14 bg-paper rounded-field border px-3 py-2 text-[12.5px]">
          <option value="">Reparación y creación</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{ETIQUETA_CATEGORIA[c]}</option>)}
        </select>
        <label className="flex items-center gap-1 text-[11px]">
          <span className="text-ink/45">Recibidas de</span>
          <input type="date" name="desde" defaultValue={desde ?? ""} className="border-ink/14 bg-paper rounded-field border px-2 py-2 text-[12px]" />
          <span className="text-ink/45">a</span>
          <input type="date" name="hasta" defaultValue={hasta ?? ""} className="border-ink/14 bg-paper rounded-field border px-2 py-2 text-[12px]" />
        </label>
        <select name="orden" defaultValue={orden} className="border-ink/14 bg-paper rounded-field border px-3 py-2 text-[12.5px]">
          <option value="recientes">Más recientes primero</option>
          <option value="fecha_control">Por fecha de control</option>
        </select>
        <Boton type="submit" tamano="sm" variante="contorno">FILTRAR</Boton>
        {q || tipo || desde || hasta || estado !== "activas" ? (
          <Link href="/panel/ordenes" className="text-ink/45 hover:text-ink text-[11px] underline-offset-2 hover:underline">Limpiar</Link>
        ) : null}
      </form>

      {filas.length === 0 ? (
        <Vacio
          titulo={q || tipo || desde || hasta ? "Sin resultados" : "No hay órdenes activas"}
          descripcion={q ? `Nada coincide con «${q}».` : "Recibe una pieza para abrir la primera orden."}
          accion={puedeCrear && !q ? <Link href="/panel/ordenes/nueva"><Boton>RECIBIR UNA PIEZA</Boton></Link> : undefined}
        />
      ) : (
        <Tabla minAncho={900}>
          <Thead>
            <Th>Orden</Th>
            <Th>Cliente</Th>
            <Th>Pieza y trabajos</Th>
            <Th>Estado</Th>
            <Th>Semáforo</Th>
            <Th className="text-right">Precio</Th>
          </Thead>
          <Tbody>
            {filas.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <Link href={`/panel/ordenes/${o.id}`} className="hover:text-gold-dark block font-mono text-[12px] font-medium">{o.numero}</Link>
                  <span className="text-ink/45 flex items-center gap-2 text-[11px]"><ChipTipoOrden tipo={o.tipo} />{fecha(o.fecha_recepcion + "T12:00:00")}</span>
                </Td>
                <Td>
                  <Link href={`/panel/clientes/${o.cliente_id}`} className="hover:text-gold-dark block">{o.cliente}</Link>
                  <span className="text-ink/45 text-[11px]">{o.cliente_telefono ?? ""}</span>
                </Td>
                <Td>
                  <span className="block">{o.descripcion_pieza}</span>
                  <span className="text-ink/45 block text-[11.5px]">{o.trabajos ?? "Sin trabajos"}</span>
                </Td>
                <Td><ChipEstadoOrden estado={o.estado} corto /></Td>
                <Td><Semaforo evaluacion={semaforos.get(o.id)} conFecha /></Td>
                <Td className="text-right tabular-nums">{Number(o.precio_cliente) > 0 ? moneda(Number(o.precio_cliente)) : <span className="text-ink/30">—</span>}</Td>
              </Tr>
            ))}
          </Tbody>
        </Tabla>
      )}

      <Paginacion pagina={pagina} paginas={paginas} total={total} porPagina={porPagina} opcionesPorPagina={POR_PAGINA_ORDENES} enlace={enlace} />
    </Tarjeta>
  );
}
