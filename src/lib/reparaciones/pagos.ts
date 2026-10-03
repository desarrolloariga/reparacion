/** Catálogos fijos de cobros al cliente (espejo de los enums de la base). */
export const TIPOS_PAGO = ["anticipo", "saldo", "total"] as const;
export const FORMAS_PAGO = ["efectivo", "tarjeta", "transferencia", "otro"] as const;

export type TipoPago = (typeof TIPOS_PAGO)[number];
export type FormaPago = (typeof FORMAS_PAGO)[number];

export const ETIQUETA_TIPO_PAGO: Record<TipoPago, string> = { anticipo: "Anticipo", saldo: "Saldo", total: "Pago total" };
export const ETIQUETA_FORMA_PAGO: Record<FormaPago, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", otro: "Otro" };
