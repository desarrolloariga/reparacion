import "server-only";

import { costoSugerido, ordenarCandidatos, type Candidato, type CandidatoEvaluado } from "@/lib/reparaciones/asignacion";
import { db } from "@/lib/supabase/server";
import type { Tabla } from "@/lib/supabase/modelo";

export type Asignacion = Tabla<"asignaciones">;
export type AsignacionListada = Asignacion & { joyero: string; joyero_telefono: string | null };

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export async function asignacionesDeOrden(ordenId: number): Promise<AsignacionListada[]> {
  const { data, error } = await db()
    .from("asignaciones")
    .select("*, joyeros(nombre, telefono)")
    .eq("orden_id", ordenId)
    .order("id", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las asignaciones: ${error.message}`);
  return (data ?? []).map(({ joyeros, ...a }) => ({
    ...a,
    joyero: uno(joyeros)?.nombre ?? "—",
    joyero_telefono: uno(joyeros)?.telefono ?? null,
  }));
}

export async function asignacionActiva(ordenId: number): Promise<AsignacionListada | null> {
  const lista = await asignacionesDeOrden(ordenId);
  return lista.find((a) => a.estado === "asignada" || a.estado === "en_proceso" || a.estado === "terminada") ?? null;
}

export async function asignacionPorId(id: number): Promise<Asignacion | null> {
  const { data, error } = await db().from("asignaciones").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type CandidatoConCosto = CandidatoEvaluado & {
  costo_sugerido: number | null;
  lineas_sin_tarifa: number;
  telefono: string | null;
};

/**
 * Joyeros ordenados para asignar una orden: coincidencia de especialidades
 * con los trabajos, carga contra capacidad, cumplimiento, retrabajo y costo
 * sugerido desde sus tarifas.
 */
export async function candidatosParaOrden(ordenId: number): Promise<{ candidatos: CandidatoConCosto[]; especialidades: number[] }> {
  const [lineas, joyeros, tarifas, carga] = await Promise.all([
    db().from("orden_detalle").select("tipo_trabajo_id, complejidad_id, cantidad, tipos_trabajo(especialidad_id)").eq("orden_id", ordenId),
    db().from("joyeros").select("id, nombre, activo, capacidad_maxima, telefono, joyeros_especialidades(especialidad_id)").eq("activo", true),
    db().from("tarifas_joyero").select("joyero_id, tipo_trabajo_id, complejidad_id, costo_acordado").eq("activo", true),
    db().rpc("fn_carga_joyeros"),
  ]);
  for (const r of [lineas, joyeros, tarifas, carga]) if (r.error) throw new Error(r.error.message);

  const especialidades = [...new Set((lineas.data ?? []).map((l) => uno(l.tipos_trabajo)?.especialidad_id).filter((e): e is number => typeof e === "number"))];
  const cargaPor = new Map((carga.data ?? []).map((c) => [c.joyero_id, c]));
  const tarifasPor = new Map<number, { tipo_trabajo_id: number; complejidad_id: number | null; costo_acordado: number }[]>();
  for (const t of tarifas.data ?? []) {
    const lista = tarifasPor.get(t.joyero_id) ?? [];
    lista.push({ tipo_trabajo_id: t.tipo_trabajo_id, complejidad_id: t.complejidad_id, costo_acordado: Number(t.costo_acordado) });
    tarifasPor.set(t.joyero_id, lista);
  }

  const base: Candidato[] = (joyeros.data ?? []).map((j) => {
    const c = cargaPor.get(j.id);
    return {
      id: j.id,
      nombre: j.nombre,
      activo: j.activo,
      capacidad_maxima: j.capacidad_maxima,
      especialidades: (j.joyeros_especialidades ?? []).map((e) => e.especialidad_id),
      activas: c?.activas ?? 0,
      terminadas: c?.terminadas ?? 0,
      a_tiempo: c?.a_tiempo ?? 0,
      retrabajos: c?.retrabajos ?? 0,
    };
  });
  const telefonos = new Map((joyeros.data ?? []).map((j) => [j.id, j.telefono]));
  const lineasCosto = (lineas.data ?? []).map((l) => ({ tipo_trabajo_id: l.tipo_trabajo_id, complejidad_id: l.complejidad_id, cantidad: l.cantidad }));

  const candidatos = ordenarCandidatos(base, especialidades).map((j) => {
    const { total, sinTarifa } = costoSugerido(tarifasPor.get(j.id) ?? [], lineasCosto);
    return { ...j, costo_sugerido: total, lineas_sin_tarifa: sinTarifa, telefono: telefonos.get(j.id) ?? null };
  });

  return { candidatos, especialidades };
}
