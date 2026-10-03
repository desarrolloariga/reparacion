import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/lib/supabase/server";

/**
 * Archivos de órdenes (fotografías y diseños) en el bucket privado de
 * Supabase Storage. Nada de aquí llega al navegador: las rutas se guardan
 * en la base y se sirven por URL firmada desde un route handler que valida
 * la sesión.
 */

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "reparaciones";

/** Tamaño máximo por archivo que acepta la subida (bytes). */
export const TAMANO_MAXIMO = 4 * 1024 * 1024;

export const TIPOS_IMAGEN = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
export const TIPOS_DISENO = new Set([...TIPOS_IMAGEN, "application/pdf"]);

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

export function extensionDe(tipo: string) {
  return EXTENSION[tipo] ?? "bin";
}

function almacen() {
  return db().storage.from(BUCKET);
}

export function rutaTemporal(usuarioId: number, tipo: string) {
  return `tmp/${usuarioId}/${randomUUID()}.${extensionDe(tipo)}`;
}

export function rutaFotoOrden(ordenId: number, momento: string, tipo: string) {
  return `ordenes/${ordenId}/${momento}/${randomUUID()}.${extensionDe(tipo)}`;
}

export function rutaDiseno(ordenId: number, version: number, tipo: string) {
  return `disenos/${ordenId}/v${version}-${randomUUID()}.${extensionDe(tipo)}`;
}

/** Solo se mueven archivos temporales del propio usuario: evita colar rutas ajenas. */
export function esRutaTemporalDe(ruta: string, usuarioId: number) {
  return /^tmp\/\d+\/[0-9a-f-]{36}\.[a-z0-9]+$/.test(ruta) && ruta.startsWith(`tmp/${usuarioId}/`);
}

export async function subirArchivo(ruta: string, datos: ArrayBuffer | Uint8Array | Blob, tipo: string) {
  const { error } = await almacen().upload(ruta, datos, { contentType: tipo, upsert: false });
  if (error) throw new Error(`No se pudo guardar el archivo: ${error.message}`);
  return ruta;
}

export async function moverArchivo(desde: string, hasta: string) {
  const { error } = await almacen().move(desde, hasta);
  if (error) throw new Error(`No se pudo mover el archivo: ${error.message}`);
  return hasta;
}

export async function eliminarArchivos(rutas: string[]) {
  if (rutas.length === 0) return;
  const { error } = await almacen().remove(rutas);
  if (error) throw new Error(`No se pudieron eliminar archivos: ${error.message}`);
}

/** URL firmada de corta vida; el navegador la recibe por redirección. */
export async function urlFirmada(ruta: string, segundos = 120) {
  const { data, error } = await almacen().createSignedUrl(ruta, segundos);
  if (error || !data) throw new Error(`No se pudo firmar la URL: ${error?.message}`);
  return data.signedUrl;
}

/** Archivos temporales con más de `horas` de antigüedad (para el cron de limpieza). */
export async function temporalesViejos(horas = 24): Promise<string[]> {
  const { data: carpetas, error } = await almacen().list("tmp", { limit: 1000 });
  if (error) throw new Error(error.message);
  const limite = Date.now() - horas * 3_600_000;
  const viejos: string[] = [];
  for (const carpeta of carpetas ?? []) {
    if (!carpeta.name) continue;
    const { data: archivos } = await almacen().list(`tmp/${carpeta.name}`, { limit: 1000 });
    for (const a of archivos ?? []) {
      const fecha = a.created_at ? new Date(a.created_at).getTime() : 0;
      if (fecha && fecha < limite) viejos.push(`tmp/${carpeta.name}/${a.name}`);
    }
  }
  return viejos;
}
