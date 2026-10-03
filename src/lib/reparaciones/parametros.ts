import { DIAS_SEMANA_ISO, type DiaSemanaISO } from "./dias-habiles";

/**
 * Parámetros del sistema: definición, valores por defecto y lectura tipada.
 *
 * La base (`joyeria.parametros`) guarda cada valor como texto; este módulo
 * es la única fuente de verdad sobre qué claves existen, de qué tipo son y
 * qué vale cada una si falta o está corrupta. Puro y probado.
 */

export type TipoParametro = "entero" | "booleano" | "texto" | "json_dias";

export type Parametros = {
  holgura_cliente_dias: number;
  holgura_joyero_dias: number;
  umbral_por_vencer_dias: number;
  dias_semana_habiles: DiaSemanaISO[];
  vigencia_cotizacion_dias: number;
  bloquear_por_capacidad: boolean;
  descontar_garantia_al_joyero: boolean;
  moneda: string;
  cliente_inactivo_dias: number;
};

export type ClaveParametro = keyof Parametros;

export type DefinicionParametro = {
  tipo: TipoParametro;
  etiqueta: string;
  ayuda: string;
  grupo: "tiempos" | "cotizaciones" | "taller" | "dinero" | "clientes";
  min?: number;
  max?: number;
  /** Se muestra pero no se edita desde la interfaz. */
  soloLectura?: boolean;
};

export const DEFINICION_PARAMETROS: Record<ClaveParametro, DefinicionParametro> = {
  holgura_cliente_dias: {
    tipo: "entero",
    etiqueta: "Holgura al cliente",
    ayuda: "Días hábiles que se suman al estimado para prometerle la fecha al cliente.",
    grupo: "tiempos",
    min: 0,
    max: 60,
  },
  holgura_joyero_dias: {
    tipo: "entero",
    etiqueta: "Holgura del joyero",
    ayuda: "Días hábiles de colchón entre la fecha de compromiso del joyero y la prometida al cliente.",
    grupo: "tiempos",
    min: 0,
    max: 60,
  },
  umbral_por_vencer_dias: {
    tipo: "entero",
    etiqueta: "Umbral de alerta",
    ayuda: "A cuántos días hábiles del vencimiento una orden se pinta en amarillo.",
    grupo: "tiempos",
    min: 0,
    max: 30,
  },
  dias_semana_habiles: {
    tipo: "json_dias",
    etiqueta: "Días hábiles de la semana",
    ayuda: "El calendario laboral agrega excepciones: feriados que cierran y domingos que abren.",
    grupo: "tiempos",
  },
  vigencia_cotizacion_dias: {
    tipo: "entero",
    etiqueta: "Vigencia de cotizaciones",
    ayuda: "Días hasta que una cotización enviada se marca vencida.",
    grupo: "cotizaciones",
    min: 1,
    max: 365,
  },
  bloquear_por_capacidad: {
    tipo: "booleano",
    etiqueta: "Bloquear por capacidad",
    ayuda: "Si está activo, no se puede asignar a un joyero que ya alcanzó su capacidad; si no, solo se advierte.",
    grupo: "taller",
  },
  descontar_garantia_al_joyero: {
    tipo: "booleano",
    etiqueta: "Descontar garantías al joyero",
    ayuda: "El costo de un retrabajo por garantía se descuenta de la liquidación del joyero responsable.",
    grupo: "dinero",
  },
  moneda: {
    tipo: "texto",
    etiqueta: "Moneda",
    ayuda: "Informativo. El formato de los importes es fijo en src/lib/format.ts.",
    grupo: "dinero",
    soloLectura: true,
  },
  cliente_inactivo_dias: {
    tipo: "entero",
    etiqueta: "Cliente inactivo tras",
    ayuda: "Días sin servicio a partir de los cuales un cliente se considera inactivo.",
    grupo: "clientes",
    min: 30,
    max: 3650,
  },
};

export const ETIQUETA_GRUPO: Record<DefinicionParametro["grupo"], string> = {
  tiempos: "Tiempos y fechas",
  cotizaciones: "Cotizaciones",
  taller: "Taller",
  dinero: "Dinero",
  clientes: "Clientes",
};

export const CLAVES_PARAMETROS = Object.keys(DEFINICION_PARAMETROS) as ClaveParametro[];

export const PARAMETROS_POR_DEFECTO: Parametros = {
  holgura_cliente_dias: 2,
  holgura_joyero_dias: 1,
  umbral_por_vencer_dias: 1,
  dias_semana_habiles: [1, 2, 3, 4, 5, 6],
  vigencia_cotizacion_dias: 15,
  bloquear_por_capacidad: false,
  descontar_garantia_al_joyero: true,
  moneda: "GTQ",
  cliente_inactivo_dias: 180,
};

export function esClaveParametro(clave: string): clave is ClaveParametro {
  return clave in DEFINICION_PARAMETROS;
}

function analizarEntero(crudo: string, def: DefinicionParametro): number | null {
  if (!/^-?\d+$/.test(crudo.trim())) return null;
  const n = Number(crudo);
  if (def.min !== undefined && n < def.min) return null;
  if (def.max !== undefined && n > def.max) return null;
  return n;
}

function analizarBooleano(crudo: string): boolean | null {
  const v = crudo.trim().toLowerCase();
  if (["true", "1", "si", "sí", "on"].includes(v)) return true;
  if (["false", "0", "no", "off", ""].includes(v)) return false;
  return null;
}

export function analizarDias(crudo: string): DiaSemanaISO[] | null {
  let valor: unknown;
  try {
    valor = JSON.parse(crudo);
  } catch {
    return null;
  }
  if (!Array.isArray(valor) || valor.length === 0) return null;
  const dias = new Set<DiaSemanaISO>();
  for (const d of valor) {
    if (!DIAS_SEMANA_ISO.includes(d as DiaSemanaISO)) return null;
    dias.add(d as DiaSemanaISO);
  }
  return [...dias].sort((a, b) => a - b);
}

/**
 * Convierte el mapa clave → texto de la base en un objeto tipado. Nunca
 * lanza: un valor ausente o ilegible cae al valor por defecto, porque un
 * parámetro corrupto no debe tumbar la aplicación entera.
 */
export function analizarParametros(mapa: Record<string, string | undefined>): Parametros {
  const salida: Parametros = { ...PARAMETROS_POR_DEFECTO, dias_semana_habiles: [...PARAMETROS_POR_DEFECTO.dias_semana_habiles] };

  for (const clave of CLAVES_PARAMETROS) {
    const crudo = mapa[clave];
    if (crudo === undefined) continue;
    const def = DEFINICION_PARAMETROS[clave];

    switch (def.tipo) {
      case "entero": {
        const n = analizarEntero(crudo, def);
        if (n !== null) (salida as Record<string, unknown>)[clave] = n;
        break;
      }
      case "booleano": {
        const b = analizarBooleano(crudo);
        if (b !== null) (salida as Record<string, unknown>)[clave] = b;
        break;
      }
      case "texto": {
        if (crudo.trim() !== "") (salida as Record<string, unknown>)[clave] = crudo.trim();
        break;
      }
      case "json_dias": {
        const dias = analizarDias(crudo);
        if (dias) salida.dias_semana_habiles = dias;
        break;
      }
    }
  }

  return salida;
}

/**
 * Validación estricta de un valor que viene de un formulario. A diferencia
 * de `analizarParametros`, aquí un valor inválido es un error que se le
 * explica a quien lo escribió. Devuelve el texto listo para guardar.
 */
export function validarParametro(
  clave: ClaveParametro,
  crudo: string,
): { valor: string } | { error: string } {
  const def = DEFINICION_PARAMETROS[clave];
  if (def.soloLectura) return { error: `"${def.etiqueta}" no se edita desde aquí.` };

  switch (def.tipo) {
    case "entero": {
      const n = analizarEntero(crudo, def);
      if (n === null) {
        const rango =
          def.min !== undefined && def.max !== undefined
            ? ` entre ${def.min} y ${def.max}`
            : "";
        return { error: `"${def.etiqueta}" debe ser un número entero${rango}.` };
      }
      return { valor: String(n) };
    }
    case "booleano": {
      const b = analizarBooleano(crudo);
      if (b === null) return { error: `"${def.etiqueta}" debe ser sí o no.` };
      return { valor: b ? "true" : "false" };
    }
    case "texto": {
      const t = crudo.trim();
      if (!t) return { error: `"${def.etiqueta}" no puede quedar vacío.` };
      return { valor: t };
    }
    case "json_dias": {
      const dias = analizarDias(crudo);
      if (!dias) return { error: "Elige al menos un día hábil de la semana." };
      return { valor: JSON.stringify(dias) };
    }
  }
}

/** Serializa un objeto tipado al formato texto de la base (para pruebas y semillas). */
export function serializarParametro(clave: ClaveParametro, valor: Parametros[ClaveParametro]): string {
  if (Array.isArray(valor)) return JSON.stringify(valor);
  return String(valor);
}
