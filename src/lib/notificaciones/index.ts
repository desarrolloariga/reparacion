import "server-only";

import { db } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/supabase/modelo";

import { proveedorActual } from "./correo";

/**
 * Notificaciones: siempre en plataforma (tabla `notificaciones`, campana en
 * la cabecera) y, cuando el evento lo pide y hay dirección, también por
 * correo (cola `correos_salientes`, vaciada por /api/cron/correos).
 *
 * Nada de aquí lanza: una notificación que falla no debe tumbar la acción
 * que la originó.
 */

export type TipoNotificacion =
  | "asignacion_creada"
  | "trabajo_terminado"
  | "calidad_rechazada"
  | "cotizacion_enviada"
  | "pieza_lista"
  | "resumen_alertas"
  | "por_vencer_joyero"
  | "garantia";

export type Aviso = {
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo?: string;
  enlace?: string;
  /** Destinatarios en plataforma: ids de usuario y/o roles completos. */
  usuarios?: number[];
  roles?: RolUsuario[];
  /** Correo opcional: direcciones + asunto + HTML. */
  correo?: { para: string[]; asunto: string; html: string };
};

export async function notificar(aviso: Aviso): Promise<void> {
  try {
    const ids = new Set(aviso.usuarios ?? []);
    if (aviso.roles?.length) {
      const { data } = await db().from("usuarios").select("id").eq("activo", true).in("rol", aviso.roles);
      for (const u of data ?? []) ids.add(u.id);
    }
    if (ids.size > 0) {
      await db().from("notificaciones").insert(
        [...ids].map((usuario_id) => ({
          usuario_id,
          tipo: aviso.tipo,
          titulo: aviso.titulo,
          cuerpo: aviso.cuerpo ?? null,
          enlace: aviso.enlace ?? null,
        })),
      );
    }
    if (aviso.correo && aviso.correo.para.length > 0) {
      await db().from("correos_salientes").insert(
        aviso.correo.para
          .filter((p) => /\S+@\S+\.\S+/.test(p))
          .map((para) => ({ para, asunto: aviso.correo!.asunto, cuerpo_html: aviso.correo!.html })),
      );
    }
    // Intento inmediato; lo que falle lo reintenta /api/cron/correos.
    if (aviso.correo) await enviarCorreosPendientes(10).catch(() => undefined);
  } catch (e) {
    console.error("[notificar] no se pudo registrar la notificación:", (e as Error).message);
  }
}

/** Vacía la cola de correo con el proveedor actual; devuelve cuántos salieron. */
export async function enviarCorreosPendientes(limite = 50): Promise<{ enviados: number; errores: number; proveedor: string }> {
  const proveedor = proveedorActual();
  const { data: pendientes, error } = await db()
    .from("correos_salientes")
    .select("*")
    .eq("estado", "pendiente")
    .lt("intentos", 5)
    .order("creado_en")
    .limit(limite);
  if (error) throw new Error(error.message);

  let enviados = 0;
  let errores = 0;
  for (const c of pendientes ?? []) {
    try {
      await proveedor.enviar({ para: c.para, asunto: c.asunto, html: c.cuerpo_html });
      await db().from("correos_salientes").update({ estado: "enviado", enviado_en: new Date().toISOString(), intentos: c.intentos + 1, error: null }).eq("id", c.id);
      enviados += 1;
    } catch (e) {
      errores += 1;
      await db().from("correos_salientes").update({ estado: c.intentos + 1 >= 5 ? "error" : "pendiente", intentos: c.intentos + 1, error: (e as Error).message.slice(0, 500) }).eq("id", c.id);
    }
  }
  return { enviados, errores, proveedor: proveedor.nombre };
}

export async function contarNoLeidas(usuarioId: number): Promise<number> {
  const { count } = await db()
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .is("leida_en", null);
  return count ?? 0;
}

export async function listarNotificaciones(usuarioId: number, limite = 60) {
  const { data, error } = await db()
    .from("notificaciones")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function marcarLeidas(usuarioId: number, ids?: number[]) {
  let q = db().from("notificaciones").update({ leida_en: new Date().toISOString() }).eq("usuario_id", usuarioId).is("leida_en", null);
  if (ids?.length) q = q.in("id", ids);
  await q;
}
