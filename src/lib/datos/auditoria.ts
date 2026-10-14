import "server-only";

import { db } from "@/lib/supabase/server";
import type { Tabla } from "@/lib/supabase/modelo";

/** Huella de las correcciones del administrador. */

export type EntidadAuditada = "orden" | "pago" | "asignacion" | "historial" | "cliente" | "liquidacion";

export async function registrarAuditoria(registro: {
  usuarioId: number;
  entidad: EntidadAuditada;
  entidadId: number;
  accion: "editar" | "eliminar";
  referencia?: string | null;
  antes?: unknown;
  despues?: unknown;
  motivo?: string | null;
}) {
  const { error } = await db().from("auditoria_admin").insert({
    usuario_id: registro.usuarioId,
    entidad: registro.entidad,
    entidad_id: registro.entidadId,
    accion: registro.accion,
    referencia: registro.referencia ?? null,
    antes: (registro.antes ?? null) as never,
    despues: (registro.despues ?? null) as never,
    motivo: registro.motivo?.trim() || null,
  });
  // La corrección ya se hizo; si la huella falla, se avisa en el log pero no
  // se revierte el trabajo del administrador.
  if (error) console.error("[auditoria] no se pudo registrar:", error.message);
}

export type RegistroAuditoria = Tabla<"auditoria_admin"> & { usuario: string | null };

export async function listarAuditoria(limite = 200): Promise<RegistroAuditoria[]> {
  const { data, error } = await db()
    .from("auditoria_admin")
    .select("*, usuarios(nombre)")
    .order("creado_en", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`No se pudo leer la auditoría: ${error.message}`);
  return (data ?? []).map(({ usuarios, ...r }) => ({
    ...r,
    usuario: (Array.isArray(usuarios) ? usuarios[0] : usuarios)?.nombre ?? null,
  }));
}
