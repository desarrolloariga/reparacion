import "server-only";

import {
  lineasDeLiquidacion,
  type AsignacionLiquidable,
  type GarantiaDescontable,
  type LineaLiquidacion,
} from "@/lib/reparaciones/dinero";
import { db } from "@/lib/supabase/server";
import type { Tabla } from "@/lib/supabase/modelo";

import { leerParametros } from "./parametros";

export type Liquidacion = Tabla<"liquidaciones_joyero">;
export type LiquidacionListada = Liquidacion & { joyero: string; lineas: number };

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export async function listarLiquidaciones(limite = 100): Promise<LiquidacionListada[]> {
  const { data, error } = await db()
    .from("liquidaciones_joyero")
    .select("*, joyeros(nombre), liquidacion_detalle(count)")
    .order("creado_en", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`No se pudieron leer las liquidaciones: ${error.message}`);
  return (data ?? []).map(({ joyeros, liquidacion_detalle, ...l }) => ({
    ...l,
    joyero: uno(joyeros)?.nombre ?? "—",
    lineas: Array.isArray(liquidacion_detalle) ? (liquidacion_detalle[0]?.count ?? 0) : 0,
  }));
}

export type LineaDetalle = Tabla<"liquidacion_detalle"> & { numero: string; descripcion_pieza: string; fecha_terminado_real: string | null };

export type LiquidacionCompleta = {
  liquidacion: Liquidacion;
  joyero: { id: number; nombre: string; telefono: string | null; correo: string | null };
  lineas: LineaDetalle[];
  pagadaPor: string | null;
};

export async function liquidacionPorId(id: number): Promise<LiquidacionCompleta | null> {
  const { data, error } = await db()
    .from("liquidaciones_joyero")
    .select("*, joyeros(id, nombre, telefono, correo), pagador:usuarios!liquidaciones_joyero_pagada_por_fkey(nombre)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la liquidación: ${error.message}`);
  if (!data) return null;

  const { data: lineas, error: errorLineas } = await db()
    .from("liquidacion_detalle")
    .select("*, asignaciones(fecha_terminado_real, ordenes(numero, descripcion_pieza))")
    .eq("liquidacion_id", id)
    .order("es_descuento")
    .order("id");
  if (errorLineas) throw new Error(errorLineas.message);

  const { joyeros, pagador, ...liquidacion } = data;
  const j = uno(joyeros);
  return {
    liquidacion,
    joyero: { id: j?.id ?? liquidacion.joyero_id, nombre: j?.nombre ?? "—", telefono: j?.telefono ?? null, correo: j?.correo ?? null },
    lineas: (lineas ?? []).map(({ asignaciones, ...d }) => {
      const a = uno(asignaciones);
      const o = uno(a?.ordenes);
      return { ...d, numero: o?.numero ?? "—", descripcion_pieza: o?.descripcion_pieza ?? "", fecha_terminado_real: a?.fecha_terminado_real ?? null };
    }),
    pagadaPor: uno(pagador)?.nombre ?? null,
  };
}

/**
 * Previsualización con la misma regla que `fn_generar_liquidacion`: pagos
 * pendientes del joyero en el rango y descuentos por garantías de las que
 * es responsable.
 */
export async function previsualizarLiquidacion(joyeroId: number, desde: string, hasta: string): Promise<{ pagos: LineaLiquidacion[]; descuentos: LineaLiquidacion[]; total: number }> {
  const [asignaciones, garantias, parametros] = await Promise.all([
    db()
      .from("asignaciones")
      .select("id, costo_pactado, estado, pagada, es_retrabajo, fecha_terminado_real, ordenes!inner(numero, descripcion_pieza), liquidacion_detalle(es_descuento)")
      .eq("joyero_id", joyeroId),
    db()
      .from("asignaciones")
      .select("id, costo_pactado, estado, fecha_terminado_real, ordenes!inner(numero, es_garantia, joyero_responsable_garantia_id, origen:ordenes!ordenes_orden_origen_id_fkey(numero)), liquidacion_detalle(es_descuento)")
      .eq("ordenes.es_garantia", true)
      .eq("ordenes.joyero_responsable_garantia_id", joyeroId),
    leerParametros(),
  ]);
  if (asignaciones.error) throw new Error(asignaciones.error.message);
  if (garantias.error) throw new Error(garantias.error.message);

  const liquidables: AsignacionLiquidable[] = (asignaciones.data ?? []).map((a) => {
    const o = uno(a.ordenes);
    return {
      id: a.id,
      numero: o?.numero ?? "—",
      descripcion_pieza: o?.descripcion_pieza ?? "",
      costo_pactado: a.costo_pactado,
      estado: a.estado,
      pagada: a.pagada,
      es_retrabajo: a.es_retrabajo,
      fecha_terminado_real: a.fecha_terminado_real,
      ya_liquidada: (a.liquidacion_detalle ?? []).some((d) => !d.es_descuento),
    };
  });

  const descontables: GarantiaDescontable[] = (garantias.data ?? []).map((a) => {
    const o = uno(a.ordenes);
    const origen = uno(o?.origen);
    return {
      asignacion_id: a.id,
      numero_garantia: o?.numero ?? "—",
      numero_origen: origen?.numero ?? "—",
      costo_pactado: a.costo_pactado,
      estado: a.estado,
      fecha_terminado_real: a.fecha_terminado_real,
      ya_descontada: (a.liquidacion_detalle ?? []).some((d) => d.es_descuento),
    };
  });

  return lineasDeLiquidacion(liquidables, descontables, parametros, { desde, hasta });
}
