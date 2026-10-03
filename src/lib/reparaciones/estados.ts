import type { FechaISO } from "./dias-habiles";

/**
 * Máquina de estados de la orden.
 *
 * Esta constante es el espejo en TypeScript de `joyeria.transiciones_estado`
 * y de las reglas de `fn_cambiar_estado_orden`. Sirve para decidir qué
 * botones mostrar y dar mensajes claros antes de llamar a la base; la base
 * vuelve a validar y es quien manda.
 */

export const ESTADOS_ORDEN = [
  "recibida",
  "cotizada",
  "aprobada",
  "asignada",
  "en_proceso",
  "terminada_joyero",
  "en_control_calidad",
  "lista_entrega",
  "entregada",
  "rechazada",
  "anulada",
] as const;

export type EstadoOrden = (typeof ESTADOS_ORDEN)[number];

export const ESTADOS_TERMINALES: readonly EstadoOrden[] = ["entregada", "rechazada", "anulada"];

export const ESTADOS_ACTIVOS: readonly EstadoOrden[] = ESTADOS_ORDEN.filter(
  (e) => !ESTADOS_TERMINALES.includes(e),
);

/** Columnas del tablero kanban, en orden de flujo. */
export const ESTADOS_KANBAN: readonly EstadoOrden[] = [
  "recibida",
  "cotizada",
  "aprobada",
  "asignada",
  "en_proceso",
  "terminada_joyero",
  "en_control_calidad",
  "lista_entrega",
];

/** Transiciones explícitas (sin la regla general de anulación). */
export const TRANSICIONES: readonly (readonly [EstadoOrden, EstadoOrden])[] = [
  ["recibida", "cotizada"],
  ["recibida", "anulada"],
  ["cotizada", "aprobada"],
  ["cotizada", "rechazada"],
  ["cotizada", "cotizada"],
  ["cotizada", "anulada"],
  ["aprobada", "asignada"],
  ["aprobada", "anulada"],
  ["asignada", "en_proceso"],
  ["asignada", "aprobada"],
  ["asignada", "anulada"],
  ["en_proceso", "terminada_joyero"],
  ["en_proceso", "anulada"],
  ["terminada_joyero", "en_control_calidad"],
  ["terminada_joyero", "anulada"],
  ["en_control_calidad", "lista_entrega"],
  ["en_control_calidad", "asignada"],
  ["en_control_calidad", "anulada"],
  ["lista_entrega", "entregada"],
  ["lista_entrega", "anulada"],
  ["rechazada", "anulada"],
];

export function puedeTransitar(desde: EstadoOrden, hacia: EstadoOrden): boolean {
  if (hacia === "anulada") return desde !== "entregada" && desde !== "anulada";
  return TRANSICIONES.some(([d, h]) => d === desde && h === hacia);
}

/** Estados alcanzables desde uno dado (para menús "Mover a…"). */
export function destinosDesde(desde: EstadoOrden): EstadoOrden[] {
  return ESTADOS_ORDEN.filter((h) => h !== desde && puedeTransitar(desde, h));
}

export function esTerminal(estado: EstadoOrden) {
  return ESTADOS_TERMINALES.includes(estado);
}

export const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  recibida: "Recibida",
  cotizada: "Cotizada",
  aprobada: "Aprobada",
  asignada: "Asignada",
  en_proceso: "En proceso",
  terminada_joyero: "Terminada por joyero",
  en_control_calidad: "En control de calidad",
  lista_entrega: "Lista para entrega",
  entregada: "Entregada",
  rechazada: "Rechazada",
  anulada: "Anulada",
};

export const ETIQUETA_CORTA_ESTADO: Record<EstadoOrden, string> = {
  recibida: "Recibida",
  cotizada: "Cotizada",
  aprobada: "Aprobada",
  asignada: "Asignada",
  en_proceso: "En proceso",
  terminada_joyero: "Terminada",
  en_control_calidad: "Calidad",
  lista_entrega: "Lista",
  entregada: "Entregada",
  rechazada: "Rechazada",
  anulada: "Anulada",
};

/** Tono del chip de estado (no usa los colores de serie: esos son de tipo). */
export const TONO_ESTADO: Record<EstadoOrden, "neutro" | "oro" | "exito" | "error" | "oscuro" | "tenue"> = {
  recibida: "neutro",
  cotizada: "oro",
  aprobada: "oro",
  asignada: "oscuro",
  en_proceso: "oscuro",
  terminada_joyero: "oscuro",
  en_control_calidad: "oro",
  lista_entrega: "exito",
  entregada: "exito",
  rechazada: "error",
  anulada: "tenue",
};

/** ¿Quién está en mora si se pasa la fecha de control? */
export function tipoMoraDe(estado: EstadoOrden): "joyero" | "cliente" {
  return estado === "asignada" || estado === "en_proceso" ? "joyero" : "cliente";
}

/**
 * Fecha contra la que se mide el semáforo. En manos del joyero, su
 * compromiso; en cualquier otro estado activo, la promesa al cliente.
 * Los estados terminales no tienen semáforo.
 */
export function fechaControlDe(
  orden: { estado: EstadoOrden; fecha_prometida_cliente: FechaISO | null },
  asignacionActiva?: { fecha_compromiso: FechaISO | null } | null,
): FechaISO | null {
  if (esTerminal(orden.estado)) return null;
  if (tipoMoraDe(orden.estado) === "joyero" && asignacionActiva?.fecha_compromiso) {
    return asignacionActiva.fecha_compromiso;
  }
  return orden.fecha_prometida_cliente;
}
