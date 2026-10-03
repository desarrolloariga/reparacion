"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
import { FORMAS_PAGO } from "@/lib/reparaciones/pagos";
import { db } from "@/lib/supabase/server";
import { erroresDeZod, fechaISO, idEntero, texto, textoOpcional, type EstadoAccion } from "@/lib/validacion";

import { mensajeDeBase } from "./ordenes-estado";

/** Liquidaciones a joyeros. Admin y taller. */

function revalidar(id?: number) {
  revalidatePath("/panel/liquidaciones");
  revalidatePath("/panel/joyeros", "layout");
  revalidatePath("/panel/gerencia");
  if (id) revalidatePath(`/panel/liquidaciones/${id}`);
}

const EsquemaGenerar = z.object({
  joyero_id: idEntero,
  desde: fechaISO("La fecha inicial"),
  hasta: fechaISO("La fecha final"),
});

export async function generarLiquidacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const r = EsquemaGenerar.safeParse({ joyero_id: texto(formData, "joyero_id"), desde: texto(formData, "desde"), hasta: texto(formData, "hasta") });
  if (!r.success) return erroresDeZod(r.error);
  if (r.data.desde > r.data.hasta) return { error: "El rango está invertido." };

  const { data, error } = await db().rpc("fn_generar_liquidacion", {
    p_joyero_id: r.data.joyero_id,
    p_desde: r.data.desde,
    p_hasta: r.data.hasta,
    p_usuario_id: sesion.usuarioId,
  });
  if (error || !data) return { error: await mensajeDeBase(error, "No se pudo generar la liquidación.") };

  revalidar();
  redirect(`/panel/liquidaciones/${(data as { id: number }).id}?generada=1`);
}

const EsquemaConfirmar = z.object({
  liquidacion_id: idEntero,
  fecha_pago: fechaISO("La fecha de pago"),
  forma_pago: z.enum(FORMAS_PAGO, "Elige la forma de pago."),
  referencia: textoOpcional(120),
});

export async function confirmarLiquidacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const r = EsquemaConfirmar.safeParse({
    liquidacion_id: texto(formData, "liquidacion_id"),
    fecha_pago: texto(formData, "fecha_pago"),
    forma_pago: texto(formData, "forma_pago"),
    referencia: texto(formData, "referencia"),
  });
  if (!r.success) return erroresDeZod(r.error);

  const { error } = await db().rpc("fn_confirmar_liquidacion", {
    p_liquidacion_id: r.data.liquidacion_id,
    p_fecha_pago: r.data.fecha_pago,
    p_forma_pago: r.data.forma_pago,
    p_referencia: r.data.referencia ?? "",
    p_usuario_id: sesion.usuarioId,
  });
  if (error) return { error: await mensajeDeBase(error, "No se pudo confirmar la liquidación.") };

  revalidar(r.data.liquidacion_id);
  return { ok: "Liquidación pagada. Las asignaciones quedaron cerradas." };
}

export async function anularLiquidacion(formData: FormData) {
  await requerirTaller();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const { error } = await db().rpc("fn_anular_liquidacion", { p_liquidacion_id: id });
  if (error) redirect(`/panel/liquidaciones/${id}?error=${encodeURIComponent(await mensajeDeBase(error, "No se pudo anular."))}`);
  revalidar();
  redirect("/panel/liquidaciones?anulada=1");
}
