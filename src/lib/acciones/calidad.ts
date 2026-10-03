"use server";

import { requerirTaller } from "@/lib/auth/guardas";
import { calendarioVigente } from "@/lib/datos/calendario";
import { notificar } from "@/lib/notificaciones";
import { destacado, envoltorio, parrafo } from "@/lib/notificaciones/plantillas";
import { hoyISO, sumarDiasHabiles } from "@/lib/reparaciones/dias-habiles";
import { db } from "@/lib/supabase/server";
import { texto, type EstadoAccion } from "@/lib/validacion";

import { cambiarEstadoOrden, mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/** Recepción de la pieza del joyero y control de calidad. Admin y taller. */

export async function recibirPieza(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const ordenId = Number(texto(formData, "orden_id"));
  if (!Number.isInteger(ordenId) || ordenId <= 0) return { error: "Orden inválida." };
  const r = await cambiarEstadoOrden(ordenId, "en_control_calidad", "Pieza recibida del joyero para revisión");
  if (!r.ok) return { error: r.error };
  return { ok: "Pieza recibida: en control de calidad." };
}

export async function registrarCalidad(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const ordenId = Number(texto(formData, "orden_id"));
  const resultado = texto(formData, "resultado");
  const observaciones = texto(formData, "observaciones").trim();
  if (!Number.isInteger(ordenId) || ordenId <= 0) return { error: "Orden inválida." };
  if (resultado !== "aprobado" && resultado !== "rechazado") return { error: "Indica el resultado." };
  if (resultado === "rechazado" && observaciones.length < 5) {
    return { error: "Explica qué falló: el joyero lo verá como instrucción del retrabajo.", campos: { observaciones: "Obligatorio al rechazar" } };
  }

  const { data: orden } = await db()
    .from("ordenes")
    .select("id, numero, dias_estimados, cliente_id, descripcion_pieza, clientes(nombre, correo)")
    .eq("id", ordenId)
    .maybeSingle();
  if (!orden) return { error: "La orden no existe." };

  let fechaRetrabajo: string | undefined;
  if (resultado === "rechazado") {
    const calendario = await calendarioVigente();
    fechaRetrabajo = sumarDiasHabiles(hoyISO(), Math.max(1, orden.dias_estimados ?? 1), calendario);
  }

  const { error } = await db().rpc("fn_registrar_calidad", {
    p_orden_id: ordenId,
    p_resultado: resultado,
    p_observaciones: observaciones,
    p_usuario_id: sesion.usuarioId,
    p_fecha_compromiso_retrabajo: fechaRetrabajo,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo registrar el control de calidad.") };

  if (resultado === "rechazado") {
    const { data: asig } = await db()
      .from("asignaciones")
      .select("joyero_id, joyeros(nombre, correo, usuario_id)")
      .eq("orden_id", ordenId)
      .eq("estado", "asignada")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    const j = Array.isArray(asig?.joyeros) ? asig?.joyeros[0] : asig?.joyeros;
    await notificar({
      tipo: "calidad_rechazada",
      titulo: `Retrabajo: ${orden.numero}`,
      cuerpo: observaciones,
      enlace: "/panel/mis-trabajos",
      usuarios: j?.usuario_id ? [j.usuario_id] : [],
      correo: j?.correo
        ? { para: [j.correo], asunto: `ARIGA · Retrabajo ${orden.numero}`, html: envoltorio(`Retrabajo en ${orden.numero}`, parrafo(`Control de calidad rechazó la pieza «${orden.descripcion_pieza}».`) + destacado(observaciones) + parrafo(`Nueva fecha de compromiso: ${fechaRetrabajo}.`)) }
        : undefined,
    });
  } else {
    const cliente = Array.isArray(orden.clientes) ? orden.clientes[0] : orden.clientes;
    await notificar({
      tipo: "pieza_lista",
      titulo: `Lista para entrega: ${orden.numero}`,
      cuerpo: `${orden.descripcion_pieza} · ${cliente?.nombre ?? ""}`,
      enlace: `/panel/ordenes/${ordenId}`,
      roles: ["admin", "taller"],
      correo: cliente?.correo
        ? { para: [cliente.correo], asunto: `ARIGA Joyería · Su pieza está lista (${orden.numero})`, html: envoltorio("Su pieza está lista", parrafo(`Hola ${cliente.nombre}, la pieza «${orden.descripcion_pieza}» pasó el control de calidad y ya puede pasar a recogerla.`) + destacado(`Orden ${orden.numero}`)) }
        : undefined,
    });
  }

  revalidarOrden(ordenId);
  return { ok: resultado === "aprobado" ? "Calidad aprobada: la orden está lista para entrega." : "Calidad rechazada: la pieza vuelve al joyero como retrabajo sin costo." };
}
