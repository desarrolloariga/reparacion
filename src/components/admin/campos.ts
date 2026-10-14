import type { CampoEdicion } from "@/components/admin/controles";
import { ETIQUETA_FORMA_PAGO, ETIQUETA_TIPO_PAGO, FORMAS_PAGO, TIPOS_PAGO } from "@/lib/reparaciones/pagos";

/**
 * Campos editables por el administrador, una sola definición por entidad
 * para que la ficha de la orden y los historiales globales no diverjan.
 */

export function camposPago(p: { tipo: string; monto: number | string; forma_pago: string; fecha: string; referencia: string | null }): CampoEdicion[] {
  return [
    { nombre: "fecha", etiqueta: "FECHA", tipo: "fecha", valor: p.fecha, requerido: true },
    { nombre: "monto", etiqueta: "MONTO (Q)", tipo: "numero", valor: Number(p.monto), requerido: true },
    { nombre: "tipo", etiqueta: "TIPO", tipo: "seleccion", valor: p.tipo, opciones: TIPOS_PAGO.map((t) => ({ valor: t, etiqueta: ETIQUETA_TIPO_PAGO[t] })) },
    { nombre: "forma_pago", etiqueta: "FORMA DE PAGO", tipo: "seleccion", valor: p.forma_pago, opciones: FORMAS_PAGO.map((f) => ({ valor: f, etiqueta: ETIQUETA_FORMA_PAGO[f] })) },
    { nombre: "referencia", etiqueta: "REFERENCIA", valor: p.referencia, ancho: true },
  ];
}

export function camposOrden(o: {
  descripcion_pieza: string;
  material: string | null;
  quilataje: string | null;
  peso_entrada_g: number | null;
  peso_salida_g: number | null;
  piedras: string | null;
  observaciones_recepcion: string | null;
  fecha_recepcion: string;
  fecha_estimada_entrega: string | null;
  fecha_prometida_cliente: string | null;
  fecha_entrega_real: string | null;
  precio_cliente: number | string;
}): CampoEdicion[] {
  return [
    { nombre: "descripcion_pieza", etiqueta: "DESCRIPCIÓN DE LA PIEZA", valor: o.descripcion_pieza, requerido: true, ancho: true },
    { nombre: "precio_cliente", etiqueta: "PRECIO AL CLIENTE (Q)", tipo: "numero", valor: Number(o.precio_cliente), requerido: true, ayuda: "Cambia la utilidad y el saldo." },
    { nombre: "fecha_recepcion", etiqueta: "FECHA DE RECEPCIÓN", tipo: "fecha", valor: o.fecha_recepcion, requerido: true },
    { nombre: "fecha_estimada_entrega", etiqueta: "ENTREGA ESTIMADA", tipo: "fecha", valor: o.fecha_estimada_entrega },
    { nombre: "fecha_prometida_cliente", etiqueta: "PROMETIDA AL CLIENTE", tipo: "fecha", valor: o.fecha_prometida_cliente },
    { nombre: "fecha_entrega_real", etiqueta: "ENTREGA REAL", tipo: "fecha", valor: o.fecha_entrega_real, ayuda: "Decide en qué período cuenta el ingreso." },
    { nombre: "material", etiqueta: "MATERIAL", valor: o.material },
    { nombre: "quilataje", etiqueta: "QUILATAJE", valor: o.quilataje },
    { nombre: "peso_entrada_g", etiqueta: "PESO ENTRADA (g)", tipo: "numero", valor: o.peso_entrada_g },
    { nombre: "peso_salida_g", etiqueta: "PESO SALIDA (g)", tipo: "numero", valor: o.peso_salida_g },
    { nombre: "piedras", etiqueta: "PIEDRAS", valor: o.piedras, ancho: true },
    { nombre: "observaciones_recepcion", etiqueta: "OBSERVACIONES", tipo: "area", valor: o.observaciones_recepcion },
  ];
}

export function camposAsignacion(a: {
  costo_pactado: number | string;
  fecha_asignacion: string;
  fecha_compromiso: string;
  fecha_inicio_real: string | null;
  fecha_terminado_real: string | null;
  instrucciones: string | null;
}): CampoEdicion[] {
  return [
    { nombre: "costo_pactado", etiqueta: "COSTO PACTADO (Q)", tipo: "numero", valor: Number(a.costo_pactado), requerido: true },
    { nombre: "fecha_asignacion", etiqueta: "ASIGNADA", tipo: "fecha", valor: a.fecha_asignacion, requerido: true },
    { nombre: "fecha_compromiso", etiqueta: "COMPROMISO", tipo: "fecha", valor: a.fecha_compromiso, requerido: true },
    { nombre: "fecha_inicio_real", etiqueta: "INICIÓ", tipo: "fecha", valor: a.fecha_inicio_real },
    { nombre: "fecha_terminado_real", etiqueta: "TERMINÓ", tipo: "fecha", valor: a.fecha_terminado_real, ayuda: "Decide en qué liquidación entra." },
    { nombre: "instrucciones", etiqueta: "INSTRUCCIONES", tipo: "area", valor: a.instrucciones },
  ];
}

export function camposCliente(c: { nombre: string; telefono: string | null; correo: string | null; direccion: string | null; notas: string | null }): CampoEdicion[] {
  return [
    { nombre: "nombre", etiqueta: "NOMBRE", valor: c.nombre, requerido: true, ancho: true },
    { nombre: "telefono", etiqueta: "TELÉFONO", valor: c.telefono },
    { nombre: "correo", etiqueta: "CORREO", valor: c.correo },
    { nombre: "direccion", etiqueta: "DIRECCIÓN", valor: c.direccion, ancho: true },
    { nombre: "notas", etiqueta: "NOTAS", tipo: "area", valor: c.notas },
  ];
}

export function camposLiquidacion(l: { fecha_pago: string | null; forma_pago: string | null; referencia: string | null; notas: string | null }): CampoEdicion[] {
  return [
    { nombre: "fecha_pago", etiqueta: "FECHA DE PAGO", tipo: "fecha", valor: l.fecha_pago },
    {
      nombre: "forma_pago",
      etiqueta: "FORMA DE PAGO",
      tipo: "seleccion",
      valor: l.forma_pago ?? "",
      opciones: [{ valor: "", etiqueta: "—" }, ...FORMAS_PAGO.map((f) => ({ valor: f, etiqueta: ETIQUETA_FORMA_PAGO[f] }))],
    },
    { nombre: "referencia", etiqueta: "REFERENCIA", valor: l.referencia, ancho: true },
    { nombre: "notas", etiqueta: "NOTAS", tipo: "area", valor: l.notas },
  ];
}
