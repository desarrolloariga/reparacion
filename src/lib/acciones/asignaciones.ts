"use server";

import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
import { calendarioVigente } from "@/lib/datos/calendario";
import { leerParametros } from "@/lib/datos/parametros";
import { notificar } from "@/lib/notificaciones";
import { destacado, envoltorio, parrafo } from "@/lib/notificaciones/plantillas";
import { excedeTope, topeJoyero } from "@/lib/reparaciones/asignacion";
import { db } from "@/lib/supabase/server";
import { erroresDeZod, fechaISO, idEntero, importe, texto, textoOpcional, type EstadoAccion } from "@/lib/validacion";

import { mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/** Asignación de órdenes a joyeros. Admin y taller. */

const EsquemaAsignar = z.object({
  orden_id: idEntero,
  joyero_id: idEntero,
  costo_pactado: importe("El costo pactado"),
  instrucciones: textoOpcional(1000),
  fecha_compromiso: fechaISO("La fecha de compromiso"),
  comentario: textoOpcional(300),
});

export async function asignarJoyero(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const r = EsquemaAsignar.safeParse({
    orden_id: texto(formData, "orden_id"),
    joyero_id: texto(formData, "joyero_id"),
    costo_pactado: texto(formData, "costo_pactado"),
    instrucciones: texto(formData, "instrucciones"),
    fecha_compromiso: texto(formData, "fecha_compromiso"),
    comentario: texto(formData, "comentario"),
  });
  if (!r.success) return erroresDeZod(r.error);
  const d = r.data;
  if (d.costo_pactado <= 0) return { error: "El costo pactado debe ser mayor que cero.", campos: { costo_pactado: "Mayor que cero" } };
  const confirmaExceso = formData.get("asignar_de_todos_modos") === "on";

  const [orden, joyero, parametros, calendario] = await Promise.all([
    db().from("ordenes").select("id, numero, estado, fecha_prometida_cliente, descripcion_pieza").eq("id", d.orden_id).maybeSingle(),
    db().from("joyeros").select("id, nombre, correo, capacidad_maxima, usuario_id").eq("id", d.joyero_id).maybeSingle(),
    leerParametros(),
    calendarioVigente(),
  ]);
  if (!orden.data) return { error: "La orden no existe." };
  if (!joyero.data) return { error: "El joyero no existe." };
  if (orden.data.estado !== "aprobada") return { error: "Solo se asigna una orden aprobada." };

  // Tope: la fecha del joyero debe dejar la holgura antes de la promesa al cliente.
  let excede = false;
  if (orden.data.fecha_prometida_cliente) {
    const tope = topeJoyero(orden.data.fecha_prometida_cliente, parametros.holgura_joyero_dias, calendario);
    excede = excedeTope(d.fecha_compromiso, tope);
    if (excede && !confirmaExceso) {
      return {
        error: `La fecha que puede cumplir el joyero (${d.fecha_compromiso}) supera la fecha prometida al cliente (${orden.data.fecha_prometida_cliente}, tope ${tope}). Ajusta la fecha del cliente o marca «asignar de todos modos».`,
        campos: { fecha_compromiso: "Supera el tope" },
      };
    }
  }

  // Capacidad: advierte o bloquea según el parámetro.
  const { count } = await db().from("asignaciones").select("id", { count: "exact", head: true }).eq("joyero_id", d.joyero_id).in("estado", ["asignada", "en_proceso"]);
  if ((count ?? 0) >= joyero.data.capacidad_maxima && parametros.bloquear_por_capacidad) {
    return { error: `${joyero.data.nombre} ya tiene ${count} órdenes activas (capacidad ${joyero.data.capacidad_maxima}). El parámetro «bloquear por capacidad» está activo.` };
  }

  const { error } = await db().rpc("fn_asignar_joyero", {
    p_orden_id: d.orden_id,
    p_joyero_id: d.joyero_id,
    p_costo: d.costo_pactado,
    p_instrucciones: d.instrucciones ?? "",
    p_fecha_compromiso: d.fecha_compromiso,
    p_excede: excede,
    p_usuario_id: sesion.usuarioId,
    p_comentario: d.comentario ?? "",
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo asignar.") };

  await notificar({
    tipo: "asignacion_creada",
    titulo: `Nuevo trabajo: ${orden.data.numero}`,
    cuerpo: `${orden.data.descripcion_pieza}. Compromiso: ${d.fecha_compromiso}.`,
    enlace: "/panel/mis-trabajos",
    usuarios: joyero.data.usuario_id ? [joyero.data.usuario_id] : [],
    correo: joyero.data.correo
      ? {
          para: [joyero.data.correo],
          asunto: `ARIGA · Nuevo trabajo ${orden.data.numero}`,
          html: envoltorio(`Nuevo trabajo asignado: ${orden.data.numero}`, parrafo(`Pieza: ${orden.data.descripcion_pieza}.`) + destacado(`Fecha de compromiso: ${d.fecha_compromiso}`) + (d.instrucciones ? parrafo(`Instrucciones: ${d.instrucciones}`) : "")),
        }
      : undefined,
  });

  revalidarOrden(d.orden_id);
  return { ok: `Orden asignada a ${joyero.data.nombre}.` };
}

export async function anularAsignacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const id = Number(texto(formData, "asignacion_id"));
  const motivo = texto(formData, "motivo").trim();
  if (!Number.isInteger(id) || id <= 0) return { error: "Asignación inválida." };

  const { data, error } = await db().rpc("fn_anular_asignacion", { p_asignacion_id: id, p_usuario_id: sesion.usuarioId, p_motivo: motivo });
  if (error) return { error: await mensajeDeBase(error, "No se pudo anular la asignación.") };
  revalidarOrden((data as { id: number }).id);
  return { ok: "Asignación anulada: la orden vuelve a aprobada." };
}
