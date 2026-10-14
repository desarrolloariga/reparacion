"use server";

import { z } from "zod";

import { requerirTaller } from "@/lib/auth/guardas";
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
