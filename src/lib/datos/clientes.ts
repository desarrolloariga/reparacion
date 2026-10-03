import "server-only";

import { db } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/supabase/modelo";

/** Directorio de clientes de la joyería. */

export const POR_PAGINA_CLIENTES = [25, 50, 100] as const;

export type FiltroClientes = {
  busqueda?: string;
  soloActivos?: boolean;
  pagina?: number;
  porPagina?: number;
};

export type ClienteListado = Cliente & { ordenes: number };

export async function listarClientes(f: FiltroClientes = {}): Promise<{ filas: ClienteListado[]; total: number }> {
  const porPagina = f.porPagina ?? 25;
  const pagina = Math.max(1, f.pagina ?? 1);
  const desde = (pagina - 1) * porPagina;

  let consulta = db()
    .from("clientes")
    .select("*, ordenes(count)", { count: "exact" })
    .order("nombre")
    .range(desde, desde + porPagina - 1);

  if (f.soloActivos) consulta = consulta.eq("activo", true);
  if (f.busqueda?.trim()) {
    const q = f.busqueda.trim().replace(/[%,()]/g, " ");
    consulta = consulta.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,correo.ilike.%${q}%`);
  }

  const { data, error, count } = await consulta;
  if (error) throw new Error(`No se pudieron leer los clientes: ${error.message}`);

  return {
    filas: (data ?? []).map(({ ordenes, ...c }) => ({
      ...c,
      ordenes: Array.isArray(ordenes) ? (ordenes[0]?.count ?? 0) : 0,
    })),
    total: count ?? 0,
  };
}

/** Búsqueda corta para el asistente de recepción (máx. `limite` resultados). */
export async function buscarClientes(texto: string, limite = 8): Promise<Cliente[]> {
  const q = texto.trim().replace(/[%,()]/g, " ");
  if (!q) return [];
  const { data, error } = await db()
    .from("clientes")
    .select("*")
    .eq("activo", true)
    .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
    .order("nombre")
    .limit(limite);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function clientePorId(id: number): Promise<Cliente | null> {
  const { data, error } = await db().from("clientes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
