import { z, type ZodError } from "zod";

/**
 * Piezas comunes de las Server Actions: forma del estado que devuelven,
 * traducción de errores de zod a mensajes por campo y lectores de FormData.
 * Sin `"use server"` a propósito: aquí hay constantes y helpers síncronos.
 */

export type EstadoAccion = {
  error?: string;
  ok?: string;
  /** Mensaje por campo, por el `name` del input. */
  campos?: Record<string, string>;
} | null;

/** Primer mensaje por campo + el primero global, listos para el formulario. */
export function erroresDeZod(error: ZodError): NonNullable<EstadoAccion> {
  const campos: Record<string, string> = {};
  for (const i of error.issues) {
    const c = String(i.path[0] ?? "");
    if (c && !campos[c]) campos[c] = i.message;
  }
  return { error: error.issues[0]?.message ?? "Revisa los datos.", campos };
}

/** Texto opcional: recorta y convierte vacío en null. */
export const textoOpcional = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v));

/** Texto obligatorio recortado. */
export const textoRequerido = (mensaje: string, max = 200) =>
  z.string().trim().min(1, mensaje).max(max, `Máximo ${max} caracteres.`);

/** Identificador numérico positivo que llega como texto. */
export const idEntero = z.coerce.number().int().positive("Identificador inválido.");

/** Identificador opcional: cadena vacía → null. */
export const idOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Identificador inválido.");

/** Entero en un rango, con mensaje propio. */
export const enteroEntre = (min: number, max: number, etiqueta: string) =>
  z.coerce
    .number({ error: `${etiqueta} debe ser un número.` })
    .int(`${etiqueta} debe ser un entero.`)
    .min(min, `${etiqueta} debe ser al menos ${min}.`)
    .max(max, `${etiqueta} no puede pasar de ${max}.`);

/** Importe en quetzales con dos decimales, no negativo. */
export const importe = (etiqueta = "El importe") =>
  z.coerce
    .number({ error: `${etiqueta} debe ser un número.` })
    .min(0, `${etiqueta} no puede ser negativo.`)
    .max(99_999_999.99, `${etiqueta} es demasiado grande.`)
    .transform((v) => Math.round(v * 100) / 100);

/** Fecha de calendario `YYYY-MM-DD` tal como la manda un <input type="date">. */
export const fechaISO = (etiqueta = "La fecha") =>
  z.iso.date({ error: `${etiqueta} no es válida.` });

/** Checkbox: presente ("on") → true. */
export function leerActivo(fd: FormData, nombre = "activo") {
  return fd.get(nombre) === "on";
}

/** Varios valores con el mismo `name` (checkboxes múltiples) como enteros. */
export function leerIds(fd: FormData, nombre: string): number[] {
  return fd
    .getAll(nombre)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/** `formData.get` como texto, nunca `File` ni `null`. */
export function texto(fd: FormData, nombre: string) {
  const v = fd.get(nombre);
  return typeof v === "string" ? v : "";
}

/** Mensaje humano para la violación de unicidad de Postgres. */
export function esDuplicado(error: { code?: string } | null | undefined) {
  return error?.code === "23505";
}

/** Violación de llave foránea: hay filas que dependen de esta. */
export function tieneDependencias(error: { code?: string } | null | undefined) {
  return error?.code === "23503";
}
