"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Subida de fotografías desde el navegador.
 *
 * Cada foto se reduce a ≤ 1600 px y se convierte a WebP con un canvas antes
 * de subirse, una por una, a /api/archivos: una foto de celular de 4–6 MB
 * pasa a ~300 KB y nunca choca con el límite de cuerpo de Vercel.
 *
 * Modo `tmp`: el asistente de recepción; devuelve las rutas temporales al
 * padre y la orden las mueve al crearse. Modo `foto` / `diseno`: orden ya
 * existente; tras subir se refresca la página.
 */

type Item = {
  clave: string;
  nombre: string;
  previsualizacion: string | null;
  estado: "subiendo" | "ok" | "error";
  ruta?: string;
  error?: string;
};

type Props =
  | { modo: "tmp"; onCambio: (rutas: string[]) => void; max?: number }
  | { modo: "foto"; ordenId: number; momento: "entrada" | "proceso" | "salida"; max?: number }
  | { modo: "diseno"; ordenId: number; descripcion?: string; max?: number };

const LADO_MAXIMO = 1600;

async function reducirImagen(archivo: File): Promise<Blob> {
  if (!archivo.type.startsWith("image/") || archivo.type === "image/heic" || archivo.type === "image/heif") {
    return archivo;
  }
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && archivo.size < 600 * 1024) return archivo;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.85));
    return blob ?? archivo;
  } catch {
    return archivo;
  }
}

export function SubirFotos(props: Props) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const max = props.max ?? 12;
  const subiendo = items.some((i) => i.estado === "subiendo");

  function avisar(lista: Item[]) {
    if (props.modo === "tmp") {
      props.onCambio(lista.filter((i) => i.estado === "ok" && i.ruta).map((i) => i.ruta!));
    }
  }

  async function subir(archivo: File) {
    const clave = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const esImagen = archivo.type.startsWith("image/");
    const previsualizacion = esImagen ? URL.createObjectURL(archivo) : null;
    setItems((s) => [...s, { clave, nombre: archivo.name, previsualizacion, estado: "subiendo" }]);

    try {
      const cuerpo = props.modo === "diseno" && !esImagen ? archivo : await reducirImagen(archivo);
      const datos = new FormData();
      const nombre = cuerpo.type === "image/webp" ? archivo.name.replace(/\.[^.]+$/, "") + ".webp" : archivo.name;
      datos.set("archivo", new File([cuerpo], nombre, { type: cuerpo.type || archivo.type }));
      datos.set("destino", props.modo);
      if (props.modo === "foto") {
        datos.set("orden_id", String(props.ordenId));
        datos.set("momento", props.momento);
      }
      if (props.modo === "diseno") {
        datos.set("orden_id", String(props.ordenId));
        if (props.descripcion) datos.set("descripcion", props.descripcion);
      }

      const r = await fetch("/api/archivos", { method: "POST", body: datos });
      const json = (await r.json().catch(() => ({}))) as { ruta?: string; error?: string };
      if (!r.ok) throw new Error(json.error ?? `Error ${r.status}`);

      setItems((s) => {
        const lista = s.map((i) => (i.clave === clave ? { ...i, estado: "ok" as const, ruta: json.ruta } : i));
        avisar(lista);
        return lista;
      });
      if (props.modo !== "tmp") router.refresh();
    } catch (e) {
      setItems((s) => s.map((i) => (i.clave === clave ? { ...i, estado: "error", error: (e as Error).message } : i)));
    }
  }

  async function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    const cupo = Math.max(0, max - items.filter((i) => i.estado !== "error").length);
    for (const a of archivos.slice(0, cupo)) await subir(a);
  }

  function quitar(clave: string) {
    setItems((s) => {
      const lista = s.filter((i) => i.clave !== clave);
      avisar(lista);
      return lista;
    });
  }

  const acepta = props.modo === "diseno" ? "image/*,application/pdf" : "image/*";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input ref={entrada} type="file" accept={acepta} multiple={props.modo !== "diseno"} onChange={alElegir} className="hidden" />
        <input ref={camara} type="file" accept="image/*" capture="environment" onChange={alElegir} className="hidden" />
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={subiendo}
          className="border-ink/14 text-ink/70 hover:border-gold hover:text-ink rounded-field flex cursor-pointer items-center gap-2 border px-4 py-[10px] text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors disabled:opacity-50"
        >
          <ImagePlus size={15} />
          {props.modo === "diseno" ? "Subir diseño" : "Elegir fotos"}
        </button>
        {props.modo !== "diseno" ? (
          <button
            type="button"
            onClick={() => camara.current?.click()}
            disabled={subiendo}
            className="border-ink/14 text-ink/70 hover:border-gold hover:text-ink rounded-field flex cursor-pointer items-center gap-2 border px-4 py-[10px] text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors disabled:opacity-50 sm:hidden"
          >
            <Camera size={15} />
            Tomar foto
          </button>
        ) : null}
        {subiendo ? (
          <span className="text-ink/50 flex items-center gap-2 text-[12px]">
            <Loader2 size={14} className="animate-spin" /> Subiendo…
          </span>
        ) : null}
      </div>

      {items.length > 0 ? (
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-4 md:grid-cols-6">
          {items.map((i) => (
            <li
              key={i.clave}
              className={cn(
                "rounded-card border-ink/10 relative aspect-square overflow-hidden border bg-white",
                i.estado === "error" && "border-clay",
              )}
            >
              {i.previsualizacion ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.previsualizacion} alt={i.nombre} className={cn("size-full object-cover", i.estado === "subiendo" && "opacity-50")} />
              ) : (
                <span className="text-ink/50 flex size-full items-center justify-center px-2 text-center text-[11px] break-all">{i.nombre}</span>
              )}
              {i.estado === "subiendo" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-white/40">
                  <Loader2 size={18} className="text-ink animate-spin" />
                </span>
              ) : null}
              {i.estado === "error" ? (
                <span className="bg-clay/90 absolute inset-x-0 bottom-0 px-1 py-[2px] text-[9px] text-white">{i.error}</span>
              ) : null}
              {props.modo === "tmp" || i.estado === "error" ? (
                <button
                  type="button"
                  onClick={() => quitar(i.clave)}
                  aria-label="Quitar"
                  className="bg-ink/70 hover:bg-clay absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full text-white transition-colors"
                >
                  {i.estado === "error" ? <X size={12} /> : <Trash2 size={12} />}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
