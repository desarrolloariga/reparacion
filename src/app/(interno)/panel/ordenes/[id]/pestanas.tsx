import Link from "next/link";

import { cn } from "@/lib/utils";

export type Pestana = "pieza" | "cotizaciones" | "disenos" | "asignaciones" | "calidad" | "fotos" | "pagos" | "historial" | "garantias";

const ETIQUETA: Record<Pestana, string> = {
  pieza: "Pieza",
  cotizaciones: "Cotizaciones",
  disenos: "Diseños",
  asignaciones: "Asignaciones",
  calidad: "Calidad",
  fotos: "Fotografías",
  pagos: "Pagos",
  historial: "Historial",
  garantias: "Garantías",
};

/** Pestañas por URL (`?tab=`): cada una es un enlace, no estado de cliente. */
export function Pestanas({
  ordenId,
  actual,
  disponibles,
  contadores = {},
}: {
  ordenId: number;
  actual: Pestana;
  disponibles: Pestana[];
  contadores?: Partial<Record<Pestana, number>>;
}) {
  return (
    <nav className="border-ink/10 -mb-1 flex gap-1 overflow-x-auto border-b">
      {disponibles.map((p) => {
        const activa = p === actual;
        const n = contadores[p];
        return (
          <Link
            key={p}
            href={`/panel/ordenes/${ordenId}?tab=${p}`}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors",
              activa ? "border-gold text-ink" : "border-transparent text-ink/45 hover:text-ink",
            )}
          >
            {ETIQUETA[p]}
            {n ? <span className={cn("rounded-[9px] px-[6px] py-[1px] text-[9px]", activa ? "bg-gold/20 text-gold-deep" : "bg-ink/6 text-ink/45")}>{n}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
