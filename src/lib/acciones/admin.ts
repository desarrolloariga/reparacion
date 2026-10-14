"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requerirAdmin } from "@/lib/auth/guardas";
import { normalizarIdentificador } from "@/lib/auth/identificador";
import { registrarAuditoria } from "@/lib/datos/auditoria";
import { esFechaISO } from "@/lib/reparaciones/dias-habiles";
import { FORMAS_PAGO, TIPOS_PAGO } from "@/lib/reparaciones/pagos";
import { eliminarArchivos } from "@/lib/storage";
import { db } from "@/lib/supabase/server";
import {
  erroresDeZod,
  fechaISO,
  importe,
  texto,
  textoOpcional,
  textoRequerido,
  type EstadoAccion,
} from "@/lib/validacion";

import { mensajeDeBase, revalidarOrden as revalidarOrdenBase } from "./ordenes-estado";

function revalidarOrden(ordenId?: number) {
  revalidarOrdenBase(ordenId);
  revalidatePath("/panel/historiales");
}

/**
 * Correcciones del administrador: editar y eliminar registros que el resto
 * de roles no puede tocar (pagos, órdenes entregadas, asignaciones,
 * historial, clientes, liquidaciones). Toda acción empieza con
 * `requerirAdmin()` y deja huella en `auditoria_admin`.
 */

function motivoDe(formData: FormData) {
  return texto(formData, "motivo").trim() || null;
}

/** Destino tras eliminar, si la acción vino de Historiales (solo rutas internas). */
function volverA(formData: FormData) {
  const v = texto(formData, "volver_a");
  return v.startsWith("/panel/") && !v.startsWith("//") ? v : null;
}

function idDe(formData: FormData, nombre = "id") {
  const id = Number(texto(formData, nombre));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Fecha opcional: vacío → null; inválida → error. */
const fechaOpcional = (etiqueta: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || esFechaISO(v), `${etiqueta} no es válida.`);

const numeroOpcional = (etiqueta: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), `${etiqueta} debe ser un número positivo.`);

// ── Pagos del cliente (ingresos y saldos) ────────────────────────────────
const EsquemaPago = z.object({
  tipo: z.enum(TIPOS_PAGO, "Tipo de pago inválido."),
  monto: importe("El monto"),
  forma_pago: z.enum(FORMAS_PAGO, "Forma de pago inválida."),
  fecha: fechaISO("La fecha"),
  referencia: textoOpcional(120),
});

export async function editarPago(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Pago inválido." };
  const r = EsquemaPago.safeParse({
    tipo: texto(formData, "tipo"),
    monto: texto(formData, "monto"),
    forma_pago: texto(formData, "forma_pago"),
    fecha: texto(formData, "fecha"),
    referencia: texto(formData, "referencia"),
  });
  if (!r.success) return erroresDeZod(r.error);
  if (r.data.monto <= 0) return { error: "El monto debe ser mayor que cero.", campos: { monto: "Mayor que cero" } };

  const { data: antes } = await db().from("pagos_cliente").select("*, ordenes(numero, precio_cliente)").eq("id", id).maybeSingle();
  if (!antes) return { error: "El pago no existe." };
  const orden = Array.isArray(antes.ordenes) ? antes.ordenes[0] : antes.ordenes;

  // El total cobrado no puede pasar del precio de la orden.
  const { data: otros } = await db().from("pagos_cliente").select("monto").eq("orden_id", antes.orden_id).neq("id", id);
  const cobradoOtros = (otros ?? []).reduce((s, p) => s + Number(p.monto), 0);
  if (orden && cobradoOtros + r.data.monto > Number(orden.precio_cliente) + 0.009) {
    return { error: `Con ese monto lo cobrado (${(cobradoOtros + r.data.monto).toFixed(2)}) superaría el precio de la orden (${Number(orden.precio_cliente).toFixed(2)}).`, campos: { monto: "Supera el precio" } };
  }

  const { data: despues, error } = await db().from("pagos_cliente").update(r.data).eq("id", id).select("*").single();
  if (error) return { error: await mensajeDeBase(error, "No se pudo editar el pago.") };

  const { ordenes: _o, ...antesLimpio } = antes;
  void _o;
  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "pago", entidadId: id, accion: "editar", referencia: orden?.numero, antes: antesLimpio, despues, motivo: motivoDe(formData) });
  revalidarOrden(antes.orden_id);
  revalidatePath("/panel/ingresos");
  return { ok: "Pago corregido." };
}

export async function eliminarPago(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Pago inválido." };
  const { data: antes } = await db().from("pagos_cliente").select("*, ordenes(numero)").eq("id", id).maybeSingle();
  if (!antes) return { error: "El pago no existe." };

  const { error } = await db().from("pagos_cliente").delete().eq("id", id);
  if (error) return { error: await mensajeDeBase(error, "No se pudo eliminar el pago.") };

  const { ordenes, ...antesLimpio } = antes;
  const numero = (Array.isArray(ordenes) ? ordenes[0] : ordenes)?.numero;
  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "pago", entidadId: id, accion: "eliminar", referencia: numero, antes: antesLimpio, motivo: motivoDe(formData) });
  revalidarOrden(antes.orden_id);
  revalidatePath("/panel/ingresos");
  return { ok: "Pago eliminado." };
}

// ── Órdenes ──────────────────────────────────────────────────────────────
const EsquemaOrden = z.object({
  descripcion_pieza: textoRequerido("Describe la pieza.", 300),
  material: z.string().trim().max(80),
  quilataje: z.string().trim().max(40),
  peso_entrada_g: numeroOpcional("El peso de entrada"),
  peso_salida_g: numeroOpcional("El peso de salida"),
  piedras: z.string().trim().max(300),
  observaciones_recepcion: z.string().trim().max(1000),
  fecha_recepcion: fechaISO("La fecha de recepción"),
  fecha_estimada_entrega: fechaOpcional("La entrega estimada"),
  fecha_prometida_cliente: fechaOpcional("La fecha prometida"),
  fecha_entrega_real: fechaOpcional("La fecha de entrega real"),
  precio_cliente: importe("El precio al cliente"),
});

export async function editarOrden(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Orden inválida." };
  const campos = Object.keys(EsquemaOrden.shape) as (keyof typeof EsquemaOrden.shape)[];
  const r = EsquemaOrden.safeParse(Object.fromEntries(campos.map((c) => [c, texto(formData, c)])));
  if (!r.success) return erroresDeZod(r.error);
  const motivo = motivoDe(formData);
  if (!motivo) return { error: "Escribe el motivo de la corrección.", campos: { motivo: "Obligatorio" } };

  // Las fechas y números vacíos viajan como "" para que la función los ponga en null.
  const cambios = Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, v === null ? "" : String(v)]));
  const { error } = await db().rpc("fn_admin_editar_orden", { p_orden_id: id, p_cambios: cambios, p_usuario_id: sesion.usuarioId, p_motivo: motivo });
  if (error) return { error: await mensajeDeBase(error, "No se pudo corregir la orden.") };

  revalidarOrden(id);
  revalidatePath("/panel/gerencia");
  return { ok: "Orden corregida. El cambio quedó en el historial y en la auditoría." };
}

export async function eliminarOrden(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Orden inválida." };
  const motivo = motivoDe(formData);
  if (!motivo) return { error: "Escribe el motivo de la eliminación.", campos: { motivo: "Obligatorio" } };

  const { data, error } = await db().rpc("fn_admin_eliminar_orden", { p_orden_id: id, p_usuario_id: sesion.usuarioId, p_motivo: motivo });
  if (error) return { error: await mensajeDeBase(error, "No se pudo eliminar la orden.") };

  const rutas = (data as string[] | null) ?? [];
  try {
    await eliminarArchivos(rutas);
  } catch (e) {
    console.error("[eliminarOrden] archivos huérfanos:", (e as Error).message);
  }

  revalidarOrden();
  revalidatePath("/panel/clientes", "layout");
  revalidatePath("/panel/gerencia");
  redirect(volverA(formData) ?? "/panel/ordenes?estado=todas&eliminada=1");
}

// ── Asignaciones (costo y fechas del joyero) ─────────────────────────────
const EsquemaAsignacion = z.object({
  costo_pactado: importe("El costo pactado"),
  fecha_asignacion: fechaISO("La fecha de asignación"),
  fecha_compromiso: fechaISO("La fecha de compromiso"),
  fecha_inicio_real: fechaOpcional("La fecha de inicio"),
  fecha_terminado_real: fechaOpcional("La fecha de terminado"),
  instrucciones: textoOpcional(1000),
});

async function enLiquidacion(asignacionId: number) {
  const { count } = await db().from("liquidacion_detalle").select("id", { count: "exact", head: true }).eq("asignacion_id", asignacionId);
  return (count ?? 0) > 0;
}

export async function editarAsignacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Asignación inválida." };
  const r = EsquemaAsignacion.safeParse({
    costo_pactado: texto(formData, "costo_pactado"),
    fecha_asignacion: texto(formData, "fecha_asignacion"),
    fecha_compromiso: texto(formData, "fecha_compromiso"),
    fecha_inicio_real: texto(formData, "fecha_inicio_real"),
    fecha_terminado_real: texto(formData, "fecha_terminado_real"),
    instrucciones: texto(formData, "instrucciones"),
  });
  if (!r.success) return erroresDeZod(r.error);
  const d = r.data;
  if (d.fecha_compromiso < d.fecha_asignacion) return { error: "El compromiso no puede ser anterior a la asignación.", campos: { fecha_compromiso: "Anterior a la asignación" } };

  const { data: antes } = await db().from("asignaciones").select("*, ordenes(numero)").eq("id", id).maybeSingle();
  if (!antes) return { error: "La asignación no existe." };
  if (!antes.es_retrabajo && d.costo_pactado <= 0) return { error: "El costo debe ser mayor que cero.", campos: { costo_pactado: "Mayor que cero" } };
  if (Number(antes.costo_pactado) !== d.costo_pactado && (await enLiquidacion(id))) {
    return { error: "Este trabajo ya está en una liquidación al joyero: elimina esa liquidación antes de cambiar el costo.", campos: { costo_pactado: "Liquidado" } };
  }

  const { data: despues, error } = await db().from("asignaciones").update(d).eq("id", id).select("*").single();
  if (error) return { error: await mensajeDeBase(error, "No se pudo corregir la asignación.") };

  const { ordenes, ...antesLimpio } = antes;
  const numero = (Array.isArray(ordenes) ? ordenes[0] : ordenes)?.numero;
  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "asignacion", entidadId: id, accion: "editar", referencia: numero, antes: antesLimpio, despues, motivo: motivoDe(formData) });
  revalidarOrden(antes.orden_id);
  revalidatePath("/panel/joyeros", "layout");
  return { ok: "Asignación corregida." };
}

export async function eliminarAsignacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Asignación inválida." };
  const { data: antes } = await db().from("asignaciones").select("*, ordenes(numero)").eq("id", id).maybeSingle();
  if (!antes) return { error: "La asignación no existe." };
  if (["asignada", "en_proceso", "terminada"].includes(antes.estado)) {
    return { error: "Es la asignación activa de la orden: anúlala o termina el flujo antes de eliminarla; si solo hay un dato mal, edítala." };
  }
  if (await enLiquidacion(id)) return { error: "Este trabajo está en una liquidación al joyero: elimina primero esa liquidación." };

  // El control de calidad la referencia: se suelta el vínculo, el registro de calidad se conserva.
  await db().from("control_calidad").update({ asignacion_id: null }).eq("asignacion_id", id);
  const { error } = await db().from("asignaciones").delete().eq("id", id);
  if (error) return { error: await mensajeDeBase(error, "No se pudo eliminar la asignación.") };

  const { ordenes, ...antesLimpio } = antes;
  const numero = (Array.isArray(ordenes) ? ordenes[0] : ordenes)?.numero;
  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "asignacion", entidadId: id, accion: "eliminar", referencia: numero, antes: antesLimpio, motivo: motivoDe(formData) });
  revalidarOrden(antes.orden_id);
  revalidatePath("/panel/joyeros", "layout");
  return { ok: "Asignación eliminada." };
}

// ── Historial de la orden ────────────────────────────────────────────────
export async function editarHistorial(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Registro inválido." };
  const comentario = texto(formData, "comentario").trim().slice(0, 1000) || null;
  const { data: antes } = await db().from("orden_estados_historial").select("*").eq("id", id).maybeSingle();
  if (!antes) return { error: "El registro no existe." };

  const { data: despues, error } = await db().from("orden_estados_historial").update({ comentario }).eq("id", id).select("*").single();
  if (error) return { error: error.message };

  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "historial", entidadId: id, accion: "editar", referencia: `orden ${antes.orden_id}`, antes, despues, motivo: motivoDe(formData) });
  revalidarOrden(antes.orden_id);
  return { ok: "Comentario corregido." };
}

export async function eliminarHistorial(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Registro inválido." };
  const { data: antes } = await db().from("orden_estados_historial").select("*").eq("id", id).maybeSingle();
  if (!antes) return { error: "El registro no existe." };

  const { error } = await db().from("orden_estados_historial").delete().eq("id", id);
  if (error) return { error: error.message };

  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "historial", entidadId: id, accion: "eliminar", referencia: `orden ${antes.orden_id}`, antes, motivo: motivoDe(formData) });
  revalidarOrden(antes.orden_id);
  return { ok: "Registro eliminado." };
}

// ── Clientes ─────────────────────────────────────────────────────────────
export async function eliminarCliente(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Cliente inválido." };
  const { data: antes } = await db().from("clientes").select("*").eq("id", id).maybeSingle();
  if (!antes) return { error: "El cliente no existe." };
  const { count } = await db().from("ordenes").select("id", { count: "exact", head: true }).eq("cliente_id", id);
  if ((count ?? 0) > 0) {
    return { error: `El cliente tiene ${count} ${count === 1 ? "orden" : "órdenes"}: elimínalas primero o desactiva al cliente.` };
  }

  const { error } = await db().from("clientes").delete().eq("id", id);
  if (error) return { error: await mensajeDeBase(error, "No se pudo eliminar el cliente.") };

  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "cliente", entidadId: id, accion: "eliminar", referencia: antes.nombre, antes, motivo: motivoDe(formData) });
  revalidatePath("/panel/clientes", "layout");
  redirect(volverA(formData) ?? "/panel/clientes?eliminado=1");
}

/** Corrección de datos del cliente con huella (el taller edita sin auditoría). */
export async function editarClienteAdmin(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Cliente inválido." };
  const r = z
    .object({
      nombre: textoRequerido("Escribe el nombre.", 160),
      telefono: textoOpcional(40),
      correo: z.string().trim().max(160).transform((v) => (v === "" ? null : normalizarIdentificador(v))),
      direccion: textoOpcional(300),
      notas: textoOpcional(1000),
    })
    .safeParse({ nombre: texto(formData, "nombre"), telefono: texto(formData, "telefono"), correo: texto(formData, "correo"), direccion: texto(formData, "direccion"), notas: texto(formData, "notas") });
  if (!r.success) return erroresDeZod(r.error);

  const { data: antes } = await db().from("clientes").select("*").eq("id", id).maybeSingle();
  if (!antes) return { error: "El cliente no existe." };
  const { data: despues, error } = await db().from("clientes").update(r.data).eq("id", id).select("*").single();
  if (error) return { error: error.message };

  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "cliente", entidadId: id, accion: "editar", referencia: antes.nombre, antes, despues, motivo: motivoDe(formData) });
  revalidatePath("/panel/clientes", "layout");
  return { ok: "Cliente corregido." };
}

// ── Liquidaciones ────────────────────────────────────────────────────────
const EsquemaLiquidacion = z.object({
  fecha_pago: fechaOpcional("La fecha de pago"),
  forma_pago: z.union([z.enum(FORMAS_PAGO), z.literal("")]).transform((v) => (v === "" ? null : v)),
  referencia: textoOpcional(120),
  notas: textoOpcional(1000),
});

export async function editarLiquidacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Liquidación inválida." };
  const r = EsquemaLiquidacion.safeParse({
    fecha_pago: texto(formData, "fecha_pago"),
    forma_pago: texto(formData, "forma_pago"),
    referencia: texto(formData, "referencia"),
    notas: texto(formData, "notas"),
  });
  if (!r.success) return erroresDeZod(r.error);

  const { data: antes } = await db().from("liquidaciones_joyero").select("*").eq("id", id).maybeSingle();
  if (!antes) return { error: "La liquidación no existe." };
  const { data: despues, error } = await db().from("liquidaciones_joyero").update(r.data).eq("id", id).select("*").single();
  if (error) return { error: error.message };

  await registrarAuditoria({ usuarioId: sesion.usuarioId, entidad: "liquidacion", entidadId: id, accion: "editar", referencia: `#${id}`, antes, despues, motivo: motivoDe(formData) });
  revalidatePath("/panel/liquidaciones", "layout");
  revalidatePath("/panel/historiales");
  return { ok: "Liquidación corregida." };
}

export async function eliminarLiquidacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesion = await requerirAdmin();
  const id = idDe(formData);
  if (!id) return { error: "Liquidación inválida." };
  const motivo = motivoDe(formData);
  if (!motivo) return { error: "Escribe el motivo: los trabajos vuelven a quedar pendientes de pago.", campos: { motivo: "Obligatorio" } };

  const { error } = await db().rpc("fn_admin_eliminar_liquidacion", { p_liquidacion_id: id, p_usuario_id: sesion.usuarioId, p_motivo: motivo });
  if (error) return { error: await mensajeDeBase(error, "No se pudo eliminar la liquidación.") };

  revalidatePath("/panel/liquidaciones", "layout");
  revalidatePath("/panel/joyeros", "layout");
  revalidatePath("/panel/gerencia");
  revalidatePath("/panel/historiales");
  redirect(volverA(formData) ?? "/panel/liquidaciones?eliminada=1");
}
