"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
import { calendarioVigente } from "@/lib/datos/calendario";
import { listarComplejidades, listarTiposTrabajo, matrizTiempos } from "@/lib/datos/catalogos";
import { leerParametros } from "@/lib/datos/parametros";
import { esFechaISO, hoyISO } from "@/lib/reparaciones/dias-habiles";
import { diasPorLinea, FaltaTiempoEstandar, fechasDeOrden, type Combinacion } from "@/lib/reparaciones/tiempos";
import { esRutaTemporalDe, extensionDe, moverArchivo, rutaFotoOrden } from "@/lib/storage";
import { CATEGORIAS } from "@/lib/supabase/modelo";
import { db } from "@/lib/supabase/server";
import {
  erroresDeZod,
  fechaISO,
  idEntero,
  texto,
  textoOpcional,
  textoRequerido,
  type EstadoAccion,
} from "@/lib/validacion";

import { anotarOrden, cambiarEstadoOrden, mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/** Recepción y mantenimiento de la pieza. Admin y taller. */

const Linea = z.object({
  tipo_trabajo_id: z.coerce.number().int().positive(),
  complejidad_id: z.coerce.number().int().positive(),
  descripcion: z.string().trim().max(300).optional().default(""),
  cantidad: z.coerce.number().int().min(1).max(99).optional().default(1),
});

const EsquemaRecepcion = z.object({
  cliente_id: idEntero,
  tipo: z.enum(CATEGORIAS, "Elige reparación o creación."),
  descripcion_pieza: textoRequerido("Describe la pieza.", 300),
  material: textoOpcional(80),
  quilataje: textoOpcional(40),
  peso_entrada_g: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "El peso debe ser un número positivo."),
  piedras: textoOpcional(300),
  observaciones_recepcion: textoOpcional(1000),
  fecha_recepcion: fechaISO("La fecha de recepción"),
  fecha_prometida_manual: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || esFechaISO(v), "La fecha prometida no es válida."),
  lineas: z.array(Linea).min(1, "Agrega al menos un trabajo."),
  fotos: z.array(z.string()).max(20),
});

async function describirCombinacion() {
  const [tipos, complejidades] = await Promise.all([listarTiposTrabajo(), listarComplejidades()]);
  const nombreTipo = new Map(tipos.map((t) => [t.id, t.nombre]));
  const nombreComp = new Map(complejidades.map((c) => [c.id, c.nombre]));
  return (c: Combinacion) =>
    `${nombreTipo.get(c.tipo_trabajo_id) ?? `tipo ${c.tipo_trabajo_id}`} · ${nombreComp.get(c.complejidad_id) ?? `complejidad ${c.complejidad_id}`}`;
}

function leerJSON<T>(crudo: string, porDefecto: T): T {
  try {
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

export async function crearOrden(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();

  const r = EsquemaRecepcion.safeParse({
    cliente_id: texto(formData, "cliente_id"),
    tipo: texto(formData, "tipo"),
    descripcion_pieza: texto(formData, "descripcion_pieza"),
    material: texto(formData, "material"),
    quilataje: texto(formData, "quilataje"),
    peso_entrada_g: texto(formData, "peso_entrada_g"),
    piedras: texto(formData, "piedras"),
    observaciones_recepcion: texto(formData, "observaciones_recepcion"),
    fecha_recepcion: texto(formData, "fecha_recepcion") || hoyISO(),
    fecha_prometida_manual: texto(formData, "fecha_prometida_manual"),
    lineas: leerJSON(texto(formData, "lineas"), []),
    fotos: leerJSON(texto(formData, "fotos"), []),
  });
  if (!r.success) return erroresDeZod(r.error);
  const d = r.data;

  // Tiempos y fechas: bloquea si falta una combinación en la matriz.
  const [matriz, parametros, calendario] = await Promise.all([matrizTiempos(), leerParametros(), calendarioVigente()]);
  let dias: number[];
  try {
    dias = diasPorLinea(d.lineas, matriz, await describirCombinacion());
  } catch (e) {
    if (e instanceof FaltaTiempoEstandar) return { error: e.message, campos: { lineas: "Falta tiempo estándar" } };
    throw e;
  }
  const diasEstimados = dias.reduce((s, n) => s + n, 0);
  const fechas = fechasDeOrden(d.fecha_recepcion, diasEstimados, parametros, calendario);
  const manual = d.fecha_prometida_manual !== null && d.fecha_prometida_manual !== fechas.fecha_prometida_cliente;

  const { data: orden, error } = await db().rpc("fn_crear_orden", {
    p_cliente_id: d.cliente_id,
    p_tipo: d.tipo,
    p_pieza: {
      descripcion_pieza: d.descripcion_pieza,
      material: d.material,
      quilataje: d.quilataje,
      peso_entrada_g: d.peso_entrada_g,
      piedras: d.piedras,
      observaciones_recepcion: d.observaciones_recepcion,
      fecha_recepcion: d.fecha_recepcion,
    },
    p_lineas: d.lineas.map((l, i) => ({ ...l, dias_estimados: dias[i], orden: i + 1 })),
    p_dias_estimados: diasEstimados,
    p_fecha_estimada: fechas.fecha_estimada_entrega,
    p_fecha_prometida: manual ? d.fecha_prometida_manual! : fechas.fecha_prometida_cliente,
    p_fecha_prometida_manual: manual,
    p_usuario_id: sesion.usuarioId,
  });
  if (error || !orden) return { error: await mensajeDeBase(error, "No se pudo crear la orden.") };

  // Fotografías: se suben a tmp/ durante el asistente y aquí se mueven.
  const avisos: string[] = [];
  for (const ruta of d.fotos) {
    if (!esRutaTemporalDe(ruta, sesion.usuarioId)) continue;
    const ext = ruta.split(".").pop() ?? "jpg";
    const tipo = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    try {
      const destino = rutaFotoOrden(orden.id, "entrada", tipo);
      await moverArchivo(ruta, destino);
      await db().from("fotografias").insert({ orden_id: orden.id, momento: "entrada", ruta_storage: destino, subido_por: sesion.usuarioId });
    } catch (e) {
      avisos.push((e as Error).message);
    }
  }

  revalidarOrden(orden.id);
  redirect(`/panel/ordenes/${orden.id}?creada=1${avisos.length ? "&fotos_error=1" : ""}`);
}

// ── Edición de la pieza ──────────────────────────────────────────────────
const EsquemaPieza = z.object({
  orden_id: idEntero,
  descripcion_pieza: textoRequerido("Describe la pieza.", 300),
  material: textoOpcional(80),
  quilataje: textoOpcional(40),
  peso_entrada_g: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "El peso debe ser un número positivo."),
  peso_salida_g: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "El peso debe ser un número positivo."),
  piedras: textoOpcional(300),
  observaciones_recepcion: textoOpcional(1000),
});

export async function editarPieza(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requerirTaller();
  const r = EsquemaPieza.safeParse({
    orden_id: texto(formData, "orden_id"),
    descripcion_pieza: texto(formData, "descripcion_pieza"),
    material: texto(formData, "material"),
    quilataje: texto(formData, "quilataje"),
    peso_entrada_g: texto(formData, "peso_entrada_g"),
    peso_salida_g: texto(formData, "peso_salida_g"),
    piedras: texto(formData, "piedras"),
    observaciones_recepcion: texto(formData, "observaciones_recepcion"),
  });
  if (!r.success) return erroresDeZod(r.error);
  const { orden_id, ...datos } = r.data;

  const { error } = await db().from("ordenes").update(datos).eq("id", orden_id);
  if (error) return { error: await mensajeDeBase(error, "No se pudo guardar la pieza.") };

  revalidarOrden(orden_id);
  return { ok: "Pieza guardada." };
}

// ── Fecha prometida ──────────────────────────────────────────────────────
export async function cambiarFechaPrometida(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requerirTaller();
  const ordenId = Number(texto(formData, "orden_id"));
  const fecha = texto(formData, "fecha_prometida_cliente");
  const motivo = texto(formData, "motivo").trim();
  if (!Number.isInteger(ordenId) || ordenId <= 0) return { error: "Orden inválida." };
  if (!esFechaISO(fecha)) return { error: "La fecha no es válida.", campos: { fecha_prometida_cliente: "Fecha inválida" } };

  const { error } = await db()
    .from("ordenes")
    .update({ fecha_prometida_cliente: fecha, fecha_prometida_manual: true })
    .eq("id", ordenId);
  if (error) return { error: await mensajeDeBase(error, "No se pudo cambiar la fecha.") };

  await anotarOrden(ordenId, `Fecha prometida al cliente fijada a mano: ${fecha}${motivo ? ` · ${motivo}` : ""}`);
  return { ok: `Fecha prometida: ${fecha}.` };
}

// ── Anulación ────────────────────────────────────────────────────────────
export async function anularOrden(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const ordenId = Number(texto(formData, "orden_id"));
  const motivo = texto(formData, "motivo").trim();
  if (!Number.isInteger(ordenId) || ordenId <= 0) return { error: "Orden inválida." };
  if (motivo.length < 5) return { error: "Escribe el motivo de la anulación.", campos: { motivo: "Obligatorio" } };

  const r = await cambiarEstadoOrden(ordenId, "anulada", motivo);
  if (!r.ok) return { error: r.error };
  return { ok: "Orden anulada." };
}

// ── Fotografías desde la ficha ───────────────────────────────────────────
export async function eliminarFoto(formData: FormData) {
  await requerirTaller();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const { data } = await db().from("fotografias").select("id, orden_id, ruta_storage").eq("id", id).maybeSingle();
  if (!data) return;
  const { eliminarArchivos } = await import("@/lib/storage");
  await db().from("fotografias").delete().eq("id", id);
  try {
    await eliminarArchivos([data.ruta_storage]);
  } catch {
    /* el registro ya no existe; el archivo huérfano lo limpia el cron */
  }
  revalidarOrden(data.orden_id);
}

export async function describirFoto(formData: FormData) {
  await requerirTaller();
  const id = Number(formData.get("id"));
  const descripcion = texto(formData, "descripcion").trim().slice(0, 200) || null;
  if (!Number.isInteger(id) || id <= 0) return;
  const { data } = await db().from("fotografias").update({ descripcion }).eq("id", id).select("orden_id").maybeSingle();
  if (data) revalidarOrden(data.orden_id);
}

export { extensionDe };
