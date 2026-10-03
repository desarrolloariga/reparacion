"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
import { calendarioVigente } from "@/lib/datos/calendario";
import { listarComplejidades, listarTiposTrabajo, matrizTiempos } from "@/lib/datos/catalogos";
import { cotizacionPorId } from "@/lib/datos/cotizaciones";
import { leerParametros } from "@/lib/datos/parametros";
import { estadoEfectivo } from "@/lib/reparaciones/cotizaciones";
import { hoyISO, sumarDiasNaturales } from "@/lib/reparaciones/dias-habiles";
import { diasPorLinea, FaltaTiempoEstandar, fechasDeOrden, type Combinacion } from "@/lib/reparaciones/tiempos";
import { db } from "@/lib/supabase/server";
import { erroresDeZod, idEntero, texto, type EstadoAccion } from "@/lib/validacion";

import { mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/** Cotizaciones versionadas. Admin y taller. */

const Linea = z.object({
  tipo_trabajo_id: z.coerce.number().int().positive(),
  complejidad_id: z.coerce.number().int().positive(),
  descripcion: z.string().trim().max(300).optional().default(""),
  cantidad: z.coerce.number().int().min(1, "Cantidad mínima 1.").max(99),
  precio_unitario: z.coerce.number().min(0, "El precio no puede ser negativo.").max(99_999_999),
  costo_joyero: z.coerce.number().min(0, "El costo no puede ser negativo.").max(99_999_999),
});

function leerLineas(crudo: string) {
  try {
    return crudo ? JSON.parse(crudo) : [];
  } catch {
    return [];
  }
}

/** Crea la siguiente versión (o la primera) y abre el cotizador. */
export async function nuevaVersionCotizacion(formData: FormData) {
  const sesion = await requerirTaller();
  const ordenId = Number(formData.get("orden_id"));
  if (!Number.isInteger(ordenId) || ordenId <= 0) return;

  const { data, error } = await db().rpc("fn_nueva_version_cotizacion", {
    p_orden_id: ordenId,
    p_usuario_id: sesion.usuarioId,
  });
  if (error) {
    redirect(`/panel/ordenes/${ordenId}?tab=cotizaciones&error=${encodeURIComponent(await mensajeDeBase(error, "No se pudo crear la versión."))}`);
  }
  revalidarOrden(ordenId);
  redirect(`/panel/ordenes/${ordenId}/cotizaciones/${(data as { id: number }).id}`);
}

export async function guardarCotizacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requerirTaller();
  const id = idEntero.safeParse(texto(formData, "cotizacion_id"));
  if (!id.success) return { error: "Cotización inválida." };

  const r = z.array(Linea).min(1, "Agrega al menos una línea.").safeParse(leerLineas(texto(formData, "lineas")));
  if (!r.success) return erroresDeZod(r.error);

  const { error } = await db().rpc("fn_guardar_cotizacion", {
    p_cotizacion_id: id.data,
    p_lineas: r.data.map((l, i) => ({ ...l, orden: i + 1 })),
    p_notas: texto(formData, "notas").trim() || undefined,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo guardar la cotización.") };

  const cot = await cotizacionPorId(id.data);
  if (cot) revalidarOrden(cot.cotizacion.orden_id);
  return { ok: "Cotización guardada." };
}

export async function enviarCotizacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const id = idEntero.safeParse(texto(formData, "cotizacion_id"));
  if (!id.success) return { error: "Cotización inválida." };

  // Si vienen líneas (el cotizador manda "guardar y enviar"), se guardan antes.
  const crudo = texto(formData, "lineas");
  if (crudo) {
    const guardado = await guardarCotizacion(null, formData);
    if (guardado?.error) return guardado;
  }

  const parametros = await leerParametros();
  const validoHasta = sumarDiasNaturales(hoyISO(), parametros.vigencia_cotizacion_dias);

  const { data, error } = await db().rpc("fn_enviar_cotizacion", {
    p_cotizacion_id: id.data,
    p_usuario_id: sesion.usuarioId,
    p_valido_hasta: validoHasta,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo enviar la cotización.") };

  const ordenId = (data as { orden_id: number }).orden_id;
  revalidarOrden(ordenId);
  redirect(`/panel/ordenes/${ordenId}?tab=cotizaciones&enviada=1`);
}

async function describirCombinacion() {
  const [tipos, complejidades] = await Promise.all([listarTiposTrabajo(), listarComplejidades()]);
  const nombreTipo = new Map(tipos.map((t) => [t.id, t.nombre]));
  const nombreComp = new Map(complejidades.map((c) => [c.id, c.nombre]));
  return (c: Combinacion) =>
    `${nombreTipo.get(c.tipo_trabajo_id) ?? c.tipo_trabajo_id} · ${nombreComp.get(c.complejidad_id) ?? c.complejidad_id}`;
}

/**
 * Aprobar: copia las líneas a la orden, fija el precio y recalcula las
 * fechas tomando como base la fecha de aprobación (el joyero no puede
 * empezar antes). Si la fecha prometida se fijó a mano, la base la respeta.
 */
export async function aprobarCotizacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const id = idEntero.safeParse(texto(formData, "cotizacion_id"));
  if (!id.success) return { error: "Cotización inválida." };
  const nombre = texto(formData, "aprobada_por_nombre").trim();
  if (nombre.length < 2) return { error: "Indica quién aprobó la cotización.", campos: { aprobada_por_nombre: "Obligatorio" } };

  const cot = await cotizacionPorId(id.data);
  if (!cot) return { error: "La cotización no existe." };

  // Una enviada con validez pasada se marca vencida aquí mismo (la base no
  // puede hacerlo y lanzar el error en la misma transacción).
  if (estadoEfectivo(cot.cotizacion, hoyISO()) === "vencida" && cot.cotizacion.estado === "enviada") {
    await db().from("cotizaciones").update({ estado: "vencida" }).eq("id", id.data);
    revalidarOrden(cot.cotizacion.orden_id);
    return { error: `La cotización venció el ${cot.cotizacion.valido_hasta}. Crea una versión nueva.` };
  }

  const [matriz, parametros, calendario] = await Promise.all([matrizTiempos(), leerParametros(), calendarioVigente()]);
  let dias: number[];
  try {
    dias = diasPorLinea(cot.lineas, matriz, await describirCombinacion());
  } catch (e) {
    if (e instanceof FaltaTiempoEstandar) return { error: e.message };
    throw e;
  }
  const diasEstimados = dias.reduce((s, n) => s + n, 0);
  const fechas = fechasDeOrden(hoyISO(), diasEstimados, parametros, calendario);

  const { data, error } = await db().rpc("fn_aprobar_cotizacion", {
    p_cotizacion_id: id.data,
    p_aprobada_por_nombre: nombre,
    p_usuario_id: sesion.usuarioId,
    p_lineas: cot.lineas.map((l, i) => ({
      tipo_trabajo_id: l.tipo_trabajo_id,
      complejidad_id: l.complejidad_id,
      descripcion: l.descripcion ?? "",
      cantidad: l.cantidad,
      dias_estimados: dias[i],
      precio_cliente: Number(l.precio_unitario) * l.cantidad,
      costo_joyero_estimado: Number(l.costo_joyero) * l.cantidad,
      orden: i + 1,
    })),
    p_dias_estimados: diasEstimados,
    p_fecha_estimada: fechas.fecha_estimada_entrega,
    p_fecha_prometida: fechas.fecha_prometida_cliente,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo aprobar la cotización.") };

  const ordenId = (data as { id: number }).id;
  revalidarOrden(ordenId);
  redirect(`/panel/ordenes/${ordenId}?aprobada=1`);
}

export async function rechazarCotizacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const id = idEntero.safeParse(texto(formData, "cotizacion_id"));
  if (!id.success) return { error: "Cotización inválida." };
  const motivo = texto(formData, "motivo").trim();

  const { data, error } = await db().rpc("fn_rechazar_cotizacion", {
    p_cotizacion_id: id.data,
    p_motivo: motivo,
    p_usuario_id: sesion.usuarioId,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo rechazar la cotización.") };

  const ordenId = (data as { id: number }).id;
  revalidarOrden(ordenId);
  redirect(`/panel/ordenes/${ordenId}?tab=cotizaciones&rechazada=1`);
}
