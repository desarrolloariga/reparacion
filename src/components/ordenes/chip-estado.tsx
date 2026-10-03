import { Chip } from "@/components/ui/chip";
import {
  ETIQUETA_COTIZACION,
  TONO_COTIZACION,
  type EstadoCotizacion,
} from "@/lib/reparaciones/cotizaciones";
import {
  ETIQUETA_CORTA_ESTADO,
  ETIQUETA_ESTADO,
  TONO_ESTADO,
  type EstadoOrden,
} from "@/lib/reparaciones/estados";
import { ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";

export function ChipEstadoOrden({ estado, corto = false }: { estado: EstadoOrden; corto?: boolean }) {
  return (
    <Chip tono={TONO_ESTADO[estado]} title={ETIQUETA_ESTADO[estado]}>
      {corto ? ETIQUETA_CORTA_ESTADO[estado] : ETIQUETA_ESTADO[estado]}
    </Chip>
  );
}

export function ChipCotizacion({ estado }: { estado: EstadoCotizacion }) {
  return <Chip tono={TONO_COTIZACION[estado]}>{ETIQUETA_COTIZACION[estado]}</Chip>;
}

/** El tipo usa los colores de serie: identidad de la categoría, no estado. */
export function ChipTipoOrden({ tipo }: { tipo: CategoriaTrabajo }) {
  return (
    <span
      className={`rounded-field inline-flex shrink-0 items-center px-[9px] py-[3px] text-[9.5px] font-semibold tracking-[0.1em] uppercase ${
        tipo === "reparacion" ? "bg-serie-1/12 text-serie-1-texto" : "bg-serie-2/12 text-serie-2-texto"
      }`}
    >
      {ETIQUETA_CATEGORIA[tipo]}
    </span>
  );
}
