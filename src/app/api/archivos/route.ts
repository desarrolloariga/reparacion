import { NextResponse, type NextRequest } from "next/server";

import { sesionOpcional } from "@/lib/auth/guardas";
import { db } from "@/lib/supabase/server";
import {
  rutaDiseno,
  rutaFotoOrden,
  rutaTemporal,
  subirArchivo,
  TAMANO_MAXIMO,
  TIPOS_DISENO,
  TIPOS_IMAGEN,
} from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Subida de un archivo por vez (multipart). El navegador reduce las fotos a
 * ≤1600 px antes de mandarlas; aquí solo se valida tipo y tamaño.
 *
 * Campos:
 *   archivo   el archivo
 *   destino   "tmp" (asistente de recepción, se mueve al crear la orden)
 *             "foto" (orden existente: orden_id + momento)
 *             "diseno" (orden de creación: orden_id + descripcion)
 */
export async function POST(request: NextRequest) {
  const sesion = await sesionOpcional();
  if (!sesion) return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  if (sesion.rol !== "admin" && sesion.rol !== "taller") {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envío inválido." }, { status: 400 });
  }

  const archivo = form.get("archivo");
  if (!(archivo instanceof File)) return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  if (archivo.size === 0) return NextResponse.json({ error: "El archivo está vacío." }, { status: 400 });
  if (archivo.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: `El archivo pesa más de ${Math.round(TAMANO_MAXIMO / 1024 / 1024)} MB.` }, { status: 413 });
  }

  const destino = String(form.get("destino") ?? "tmp");
  const tipo = archivo.type || "application/octet-stream";
  const bytes = await archivo.arrayBuffer();

  try {
    if (destino === "tmp") {
      if (!TIPOS_IMAGEN.has(tipo)) return NextResponse.json({ error: "Solo se aceptan imágenes." }, { status: 415 });
      const ruta = await subirArchivo(rutaTemporal(sesion.usuarioId, tipo), bytes, tipo);
      return NextResponse.json({ ruta, nombre: archivo.name, tamano: archivo.size });
    }

    const ordenId = Number(form.get("orden_id"));
    if (!Number.isInteger(ordenId) || ordenId <= 0) return NextResponse.json({ error: "Orden inválida." }, { status: 400 });
    const { data: orden } = await db().from("ordenes").select("id, tipo, estado").eq("id", ordenId).maybeSingle();
    if (!orden) return NextResponse.json({ error: "La orden no existe." }, { status: 404 });
    if (orden.estado === "entregada" || orden.estado === "anulada") {
      return NextResponse.json({ error: "La orden ya está cerrada." }, { status: 409 });
    }

    if (destino === "foto") {
      if (!TIPOS_IMAGEN.has(tipo)) return NextResponse.json({ error: "Solo se aceptan imágenes." }, { status: 415 });
      const momento = String(form.get("momento") ?? "proceso");
      if (!["entrada", "proceso", "salida", "diseno"].includes(momento)) {
        return NextResponse.json({ error: "Momento inválido." }, { status: 400 });
      }
      const ruta = await subirArchivo(rutaFotoOrden(ordenId, momento, tipo), bytes, tipo);
      const descripcion = String(form.get("descripcion") ?? "").trim().slice(0, 200) || null;
      const { data, error } = await db()
        .from("fotografias")
        .insert({ orden_id: ordenId, momento: momento as "entrada" | "proceso" | "salida" | "diseno", ruta_storage: ruta, descripcion, subido_por: sesion.usuarioId })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ id: data.id, ruta });
    }

    if (destino === "diseno") {
      if (orden.tipo !== "creacion") return NextResponse.json({ error: "Solo las creaciones llevan diseños." }, { status: 409 });
      if (!TIPOS_DISENO.has(tipo)) return NextResponse.json({ error: "Solo imágenes o PDF." }, { status: 415 });
      const { data: ultimo } = await db()
        .from("disenos")
        .select("version")
        .eq("orden_id", ordenId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const version = (ultimo?.version ?? 0) + 1;
      const ruta = await subirArchivo(rutaDiseno(ordenId, version, tipo), bytes, tipo);
      const descripcion = String(form.get("descripcion") ?? "").trim().slice(0, 500) || null;
      const { data, error } = await db()
        .from("disenos")
        .insert({ orden_id: ordenId, version, descripcion, ruta_storage: ruta, nombre_archivo: archivo.name.slice(0, 160), tipo_archivo: tipo, creado_por: sesion.usuarioId })
        .select("id, version")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ id: data.id, version: data.version, ruta });
    }

    return NextResponse.json({ error: "Destino inválido." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
