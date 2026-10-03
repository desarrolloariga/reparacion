"use server";

import { revalidatePath } from "next/cache";

import { requerirAdmin } from "@/lib/auth/guardas";
import {
  CLAVES_PARAMETROS,
  DEFINICION_PARAMETROS,
  validarParametro,
} from "@/lib/reparaciones/parametros";
import { db } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/lib/validacion";

/**
 * Guarda los parámetros editables. Las claves vienen de la definición del
 * módulo puro (lista blanca), nunca del formulario; los booleanos llegan como
 * checkbox ("on" o ausente) y los días como varios checkboxes `dias`.
 */
export async function guardarParametros(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();

  const campos: Record<string, string> = {};
  const cambios: { clave: string; valor: string }[] = [];

  for (const clave of CLAVES_PARAMETROS) {
    const def = DEFINICION_PARAMETROS[clave];
    if (def.soloLectura) continue;

    let crudo: string;
    switch (def.tipo) {
      case "booleano":
        crudo = formData.get(clave) === "on" ? "true" : "false";
        break;
      case "json_dias":
        crudo = JSON.stringify(formData.getAll("dias").map(Number));
        break;
      default: {
        const v = formData.get(clave);
        crudo = typeof v === "string" ? v : "";
      }
    }

    const resultado = validarParametro(clave, crudo);
    if ("error" in resultado) {
      campos[clave] = resultado.error;
      continue;
    }
    cambios.push({ clave, valor: resultado.valor });
  }

  if (Object.keys(campos).length > 0) {
    return { error: Object.values(campos)[0], campos };
  }

  for (const c of cambios) {
    const { data, error } = await db()
      .from("parametros")
      .update({ valor: c.valor })
      .eq("clave", c.clave)
      .select("clave");
    if (error) return { error: `No se pudo guardar "${c.clave}": ${error.message}` };
    // Sin fila no hay error de Postgres: la clave no está sembrada.
    if (!data?.length) return { error: `El parámetro "${c.clave}" no existe en la base. Aplica las migraciones.` };
  }

  revalidatePath("/panel", "layout");
  return { ok: "Parámetros guardados." };
}
