import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";

import type { DocumentProps } from "@react-pdf/renderer";

/** Renderiza un documento a Buffer, listo para responder o adjuntar. */
export async function renderizarPdf(documento: ReactElement<DocumentProps>) {
  return renderToBuffer(documento);
}

/** Cabeceras de respuesta: en línea por defecto, descarga con `descargar`. */
export function cabecerasPdf(nombre: string, descargar = false) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename="${nombre}"`,
    "Cache-Control": "private, no-store",
  };
}

/**
 * Convierte una imagen del bucket (normalmente WebP, que react-pdf no
 * entiende) a JPEG. Si falla, se omite la imagen antes que romper el PDF.
 */
export async function imagenParaPdf(datos: ArrayBuffer): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(Buffer.from(datos)).rotate().resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
  } catch {
    return null;
  }
}
