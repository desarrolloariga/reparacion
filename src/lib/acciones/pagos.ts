"use server";

import { z } from "zod";

import { requerirAdmin, requerirTaller } from "@/lib/auth/guardas";
import { pagosDeOrden, saldoDe } from "@/lib/datos/taller";
import { FORMAS_PAGO, TIPOS_PAGO } from "@/lib/reparaciones/pagos";
import { db } from "@/lib/supabase/server";
import { erroresDeZod, fechaISO, idEntero, importe, texto, textoOpcional, type EstadoAccion } from "@/lib/validacion";

import { mensajeDeBase, revalidarOrden } from "./ordenes-estado";

/** Cobros al cliente. Admin y taller. */

const EsquemaPago = z.object({
  orden_id: idEntero,
  tipo: z.enum(TIPOS_PAGO, "Elige el tipo de pago."),
  monto: importe("El monto"),
  forma_pago: z.enum(FORMAS_PAGO, "Elige la forma de pago."),
  fecha: fechaISO("La fecha"),
  referencia: textoOpcional(120),
});

export async function registrarPago(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirTaller();
  const r = EsquemaPago.safeParse({
    orden_id: texto(formData, "orden_id"),
    tipo: texto(formData, "tipo"),
    monto: texto(formData, "monto"),
    forma_pago: texto(formData, "forma_pago"),
    fecha: texto(formData, "fecha"),
    referencia: texto(formData, "referencia"),
  });
  if (!r.success) return erroresDeZod(r.error);
  const d = r.data;
  if (d.monto <= 0) return { error: "El monto debe ser mayor que cero.", campos: { monto: "Mayor que cero" } };

  const { data: orden } = await db().from("ordenes").select("id, estado, precio_cliente").eq("id", d.orden_id).maybeSingle();
  if (!orden) return { error: "La orden no existe." };
  if (orden.estado === "anulada" || orden.estado === "rechazada") return { error: "La orden está cerrada sin entrega: no admite cobros." };

  const { saldo } = saldoDe(Number(orden.precio_cliente), await pagosDeOrden(d.orden_id));
  if (d.monto > saldo + 0.009) {
    return { error: `El monto supera el saldo pendiente (${saldo.toFixed(2)}).`, campos: { monto: `Máximo ${saldo.toFixed(2)}` } };
  }

  const { error } = await db().from("pagos_cliente").insert({ ...d, registrado_por: sesion.usuarioId });
  if (error) return { error: await mensajeDeBase(error, "No se pudo registrar el pago.") };

  revalidarOrden(d.orden_id);
  return { ok: `Pago de ${d.monto.toFixed(2)} registrado.` };
}

/** Solo administración, y nunca sobre una orden entregada: corrige errores de captura. */
export async function eliminarPago(formData: FormData) {
  await requerirAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const { data } = await db().from("pagos_cliente").select("id, orden_id, ordenes(estado)").eq("id", id).maybeSingle();
  if (!data) return;
  const o = Array.isArray(data.ordenes) ? data.ordenes[0] : data.ordenes;
  if (o?.estado === "entregada") return;
  await db().from("pagos_cliente").delete().eq("id", id);
  revalidarOrden(data.orden_id);
}
