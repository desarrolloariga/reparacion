import "server-only";

import type { EstadoOrden } from "@/lib/reparaciones/estados";
import type { EstadoCotizacion } from "@/lib/reparaciones/cotizaciones";
import { db } from "@/lib/supabase/server";
import type { CategoriaTrabajo, Tabla } from "@/lib/supabase/modelo";

/** Lecturas de órdenes. El estado nunca se escribe desde aquí. */

export type Orden = Tabla<"ordenes">;
export type Fotografia = Tabla<"fotografias">;
export type Diseno = Tabla<"disenos">;

/** Fila de `vw_ordenes_tablero` con los tipos reales (la vista los declara nulos). */
export type OrdenTablero = {
  id: number;
  numero: string;
  tipo: CategoriaTrabajo;
  estado: EstadoOrden;
  cliente_id: number;
  cliente: string;
  cliente_telefono: string | null;
  descripcion_pieza: string;
  material: string | null;
  fecha_recepcion: string;
  dias_estimados: number | null;
  fecha_estimada_entrega: string | null;
  fecha_prometida_cliente: string | null;
  fecha_prometida_manual: boolean;
  fecha_entrega_real: string | null;
  precio_cliente: number;
  es_garantia: boolean;
  orden_origen_id: number | null;
  lineas: number;
  trabajos: string | null;
  cotizacion_estado: EstadoCotizacion | null;
  cotizacion_valido_hasta: string | null;
  cotizacion_version: number | null;
  joyero_id: number | null;
  joyero: string | null;
  fecha_compromiso_joyero: string | null;
  fecha_control: string | null;
  fotografias: number;
  creado_por: number | null;
  creado_en: string;
  actualizado_en: string | null;
};

export const POR_PAGINA_ORDENES = [25, 50, 100] as const;

export type FiltroOrdenes = {
  busqueda?: string;
  estado?: EstadoOrden | "activas" | "todas";
  tipo?: CategoriaTrabajo;
  clienteId?: number;
  joyeroId?: number;
  desde?: string;
  hasta?: string;
  pagina?: number;
  porPagina?: number;
  orden?: "recientes" | "fecha_control";
};

const ESTADOS_ACTIVOS_SQL = "(recibida,cotizada,aprobada,asignada,en_proceso,terminada_joyero,en_control_calidad,lista_entrega)";

export async function listarOrdenes(f: FiltroOrdenes = {}): Promise<{ filas: OrdenTablero[]; total: number }> {
  const porPagina = f.porPagina ?? 25;
  const pagina = Math.max(1, f.pagina ?? 1);
  const desde = (pagina - 1) * porPagina;

  let consulta = db().from("vw_ordenes_tablero").select("*", { count: "exact" });

  if (f.estado && f.estado !== "todas" && f.estado !== "activas") consulta = consulta.eq("estado", f.estado);
  if (f.estado === "activas" || !f.estado) consulta = consulta.filter("estado", "in", ESTADOS_ACTIVOS_SQL);
  if (f.tipo) consulta = consulta.eq("tipo", f.tipo);
  if (f.clienteId) consulta = consulta.eq("cliente_id", f.clienteId);
  if (f.joyeroId) consulta = consulta.eq("joyero_id", f.joyeroId);
  if (f.desde) consulta = consulta.gte("fecha_recepcion", f.desde);
  if (f.hasta) consulta = consulta.lte("fecha_recepcion", f.hasta);
  if (f.busqueda?.trim()) {
    const q = f.busqueda.trim().replace(/[%,()]/g, " ");
    consulta = consulta.or(`numero.ilike.%${q}%,cliente.ilike.%${q}%,descripcion_pieza.ilike.%${q}%`);
  }

  consulta =
    f.orden === "fecha_control"
      ? consulta.order("fecha_control", { ascending: true, nullsFirst: false }).order("id", { ascending: false })
      : consulta.order("creado_en", { ascending: false });

  const { data, error, count } = await consulta.range(desde, desde + porPagina - 1);
  if (error) throw new Error(`No se pudieron leer las órdenes: ${error.message}`);
  return { filas: (data ?? []) as unknown as OrdenTablero[], total: count ?? 0 };
}

/** Todas las órdenes activas (tablero kanban y alertas): sin paginar. */
export async function ordenesActivas(): Promise<OrdenTablero[]> {
  const { data, error } = await db()
    .from("vw_ordenes_tablero")
    .select("*")
    .filter("estado", "in", ESTADOS_ACTIVOS_SQL)
    .order("fecha_control", { ascending: true, nullsFirst: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrdenTablero[];
}

export async function ordenTableroPorId(id: number): Promise<OrdenTablero | null> {
  const { data, error } = await db().from("vw_ordenes_tablero").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as OrdenTablero) ?? null;
}

export type LineaOrden = Tabla<"orden_detalle"> & { tipo_trabajo: string; complejidad: string };

export type HistorialOrden = Tabla<"orden_estados_historial"> & { usuario: string | null };

export type CotizacionResumen = Tabla<"cotizaciones">;

export type OrdenCompleta = {
  orden: Orden;
  cliente: Tabla<"clientes">;
  lineas: LineaOrden[];
  fotos: Fotografia[];
  historial: HistorialOrden[];
  cotizaciones: CotizacionResumen[];
  disenos: Diseno[];
  origen: { id: number; numero: string; estado: EstadoOrden } | null;
  garantias: { id: number; numero: string; estado: EstadoOrden; fecha_recepcion: string }[];
};

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export async function ordenPorId(id: number): Promise<OrdenCompleta | null> {
  const { data: orden, error } = await db().from("ordenes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer la orden: ${error.message}`);
  if (!orden) return null;

  const [cliente, lineas, fotos, historial, cotizaciones, disenos, origen, garantias] = await Promise.all([
    db().from("clientes").select("*").eq("id", orden.cliente_id).single(),
    db().from("orden_detalle").select("*, tipos_trabajo(nombre), complejidades(nombre)").eq("orden_id", id).order("orden").order("id"),
    db().from("fotografias").select("*").eq("orden_id", id).order("creado_en"),
    db().from("orden_estados_historial").select("*, usuarios(nombre)").eq("orden_id", id).order("creado_en", { ascending: false }).order("id", { ascending: false }),
    db().from("cotizaciones").select("*").eq("orden_id", id).order("version", { ascending: false }),
    db().from("disenos").select("*").eq("orden_id", id).order("version", { ascending: false }),
    orden.orden_origen_id
      ? db().from("ordenes").select("id, numero, estado").eq("id", orden.orden_origen_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    db().from("ordenes").select("id, numero, estado, fecha_recepcion").eq("orden_origen_id", id).order("fecha_recepcion"),
  ]);

  for (const r of [cliente, lineas, fotos, historial, cotizaciones, disenos, origen, garantias]) {
    if (r.error) throw new Error(`No se pudo leer la orden ${id}: ${r.error.message}`);
  }

  return {
    orden,
    cliente: cliente.data!,
    lineas: (lineas.data ?? []).map(({ tipos_trabajo, complejidades, ...l }) => ({
      ...l,
      tipo_trabajo: uno(tipos_trabajo)?.nombre ?? "—",
      complejidad: uno(complejidades)?.nombre ?? "—",
    })),
    fotos: fotos.data ?? [],
    historial: (historial.data ?? []).map(({ usuarios, ...h }) => ({ ...h, usuario: uno(usuarios)?.nombre ?? null })),
    cotizaciones: cotizaciones.data ?? [],
    disenos: disenos.data ?? [],
    origen: (origen.data as OrdenCompleta["origen"]) ?? null,
    garantias: (garantias.data ?? []) as OrdenCompleta["garantias"],
  };
}

export async function fotoPorId(id: number): Promise<Fotografia | null> {
  const { data, error } = await db().from("fotografias").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function disenoPorId(id: number): Promise<Diseno | null> {
  const { data, error } = await db().from("disenos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Conteo de órdenes por estado, para el resumen de inicio. */
export async function contarPorEstado(): Promise<Partial<Record<EstadoOrden, number>>> {
  const { data, error } = await db().from("ordenes").select("estado");
  if (error) throw new Error(error.message);
  const conteo: Partial<Record<EstadoOrden, number>> = {};
  for (const o of data ?? []) conteo[o.estado as EstadoOrden] = (conteo[o.estado as EstadoOrden] ?? 0) + 1;
  return conteo;
}

export async function ordenesDeCliente(clienteId: number): Promise<OrdenTablero[]> {
  const { data, error } = await db()
    .from("vw_ordenes_tablero")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("fecha_recepcion", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OrdenTablero[];
}
