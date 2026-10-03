"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
import { calendarioVigente } from "@/lib/datos/calendario";
import { listarComplejidades, listarTiposTrabajo, matrizTiempos } from "@/lib/datos/catalogos";
import { leerParametros } from "@/lib/datos/parametros";
import { notificar } from "@/lib/notificaciones";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { diasPorLinea, FaltaTiempoEstandar, fechasDeOrden, type Combinacion } from "@/lib/reparaciones/tiempos";
import { db } from "@/lib/supabase/server";
import { erroresDeZod, idEntero, idOpcional, texto, textoOpcional, type EstadoAccion } from "@/lib/validacion";

import { mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/** Entrega al cliente y apertura de garantías. Admin y taller. */

export async function entregarOrden(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const ordenId = Number(texto(formData, "orden_id"));
  if (!Number.isInteger(ordenId) || ordenId <= 0) return { error: "Orden inválida." };
  const conSaldo = formData.get("con_saldo") === "on";
  const comentario = texto(formData, "comentario").trim();

  const { error } = await db().rpc("fn_entregar_orden", {
    p_orden_id: ordenId,
    p_usuario_id: sesion.usuarioId,
    p_con_saldo: conSaldo,
    p_comentario: comentario,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo entregar la orden.") };

  revalidarOrden(ordenId);
  return { ok: "Orden entregada." };
}

// ── Garantías ────────────────────────────────────────────────────────────
const Linea = z.object({
  tipo_trabajo_id: z.coerce.number().int().positive(),
  complejidad_id: z.coerce.number().int().positive(),
  descripcion: z.string().trim().max(300).optional().default(""),
});

const EsquemaGarantia = z.object({
  orden_origen_id: idEntero,
  joyero_responsable_id: idOpcional,
  descripcion_pieza: textoOpcional(300),
  observaciones: textoOpcional(1000),
  lineas: z.array(Linea).min(1, "Agrega al menos un trabajo."),
});

async function describirCombinacion() {
  const [tipos, complejidades] = await Promise.all([listarTiposTrabajo(), listarComplejidades()]);
  const nombreTipo = new Map(tipos.map((t) => [t.id, t.nombre]));
  const nombreComp = new Map(complejidades.map((c) => [c.id, c.nombre]));
  return (c: Combinacion) => `${nombreTipo.get(c.tipo_trabajo_id) ?? c.tipo_trabajo_id} · ${nombreComp.get(c.complejidad_id) ?? c.complejidad_id}`;
}

export async function crearGarantia(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  let lineas: unknown = [];
  try {
    lineas = JSON.parse(texto(formData, "lineas") || "[]");
  } catch {
    lineas = [];
  }
  const r = EsquemaGarantia.safeParse({
    orden_origen_id: texto(formData, "orden_origen_id"),
    joyero_responsable_id: texto(formData, "joyero_responsable_id"),
    descripcion_pieza: texto(formData, "descripcion_pieza"),
    observaciones: texto(formData, "observaciones"),
    lineas,
  });
  if (!r.success) return erroresDeZod(r.error);
  const d = r.data;
  const cobra = formData.get("cobra_garantia") === "on";

  const [matriz, parametros, calendario] = await Promise.all([matrizTiempos(), leerParametros(), calendarioVigente()]);
  let dias: number[];
  try {
    dias = diasPorLinea(d.lineas, matriz, await describirCombinacion());
  } catch (e) {
    if (e instanceof FaltaTiempoEstandar) return { error: e.message };
    throw e;
  }
  const total = dias.reduce((s, n) => s + n, 0);
  const fechas = fechasDeOrden(hoyISO(), total, parametros, calendario);

  const { data, error } = await db().rpc("fn_crear_garantia", {
    p_orden_origen_id: d.orden_origen_id,
    p_cobra: cobra,
    // La función SQL admite null; el tipo generado no lo refleja porque el
    // parámetro no tiene default.
    p_joyero_responsable_id: (d.joyero_responsable_id ?? null) as unknown as number,
    p_descripcion_pieza: d.descripcion_pieza ?? "",
    p_observaciones: d.observaciones ?? "",
    p_lineas: d.lineas.map((l, i) => ({ ...l, dias_estimados: dias[i], orden: i + 1 })),
    p_dias_estimados: total,
    p_fecha_estimada: fechas.fecha_estimada_entrega,
    p_fecha_prometida: fechas.fecha_prometida_cliente,
    p_usuario_id: sesion.usuarioId,
  });
  if (error || !data) return { error: await mensajeDeBase(error, "No se pudo abrir la garantía.") };

  const nueva = data as { id: number; numero: string };
  await notificar({
    tipo: "garantia",
    titulo: `Garantía abierta: ${nueva.numero}`,
    cuerpo: cobra ? "Con cobro: requiere cotización." : "Sin cobro: ya está aprobada, lista para asignar.",
    enlace: `/panel/ordenes/${nueva.id}`,
    roles: ["admin", "taller"],
  });

  revalidarOrden(d.orden_origen_id);
  revalidarOrden(nueva.id);
  redirect(`/panel/ordenes/${nueva.id}?garantia=1`);
}
