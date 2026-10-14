import "server-only";

import { db } from "@/lib/supabase/server";
import type { Tabla } from "@/lib/supabase/modelo";

/** Historial global de ingresos (pagos de clientes) por período. */

export type Ingreso = Tabla<"pagos_cliente"> & {
  numero: string;
  estado_orden: string;
  cliente_id: number | null;
  cliente: string;
  registrado: string | null;
};

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export async function listarIngresos(desde: string, hasta: string, limite = 1000): Promise<Ingreso[]> {
  const { data, error } = await db()
    .from("pagos_cliente")
    .select("*, ordenes(numero, estado, cliente_id, clientes(nombre)), usuarios(nombre)")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`No se pudieron leer los ingresos: ${error.message}`);
  return (data ?? []).map(({ ordenes, usuarios, ...p }) => {
    const o = uno(ordenes);
    return {
      ...p,
      numero: o?.numero ?? "—",
      estado_orden: o?.estado ?? "",
      cliente_id: o?.cliente_id ?? null,
      cliente: uno(o?.clientes)?.nombre ?? "—",
      registrado: uno(usuarios)?.nombre ?? null,
    };
  });
}
