import type { EvaluacionSemaforo } from "@/lib/datos/semaforo";
import { fecha } from "@/lib/format";
import { CLASE_SEMAFORO, describirRestantes, ETIQUETA_SEMAFORO, PUNTO_SEMAFORO } from "@/lib/reparaciones/semaforo";
import { cn } from "@/lib/utils";

/** Punto de color + días restantes. Sin fecha de control no dibuja nada. */
export function Semaforo({
  evaluacion,
  conFecha = false,
  className,
}: {
  evaluacion: EvaluacionSemaforo | undefined;
  conFecha?: boolean;
  className?: string;
}) {
  if (!evaluacion?.semaforo || evaluacion.dias === null) {
    return <span className={cn("text-ink/30 text-[11px]", className)}>—</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-2 text-[12px]", className)} title={ETIQUETA_SEMAFORO[evaluacion.semaforo]}>
      <span className={cn("inline-block size-[9px] shrink-0 rounded-full", PUNTO_SEMAFORO[evaluacion.semaforo])} />
      <span className={cn("whitespace-nowrap", evaluacion.semaforo === "vencido" ? "text-clay font-medium" : "text-ink/70")}>
        {describirRestantes(evaluacion.dias)}
      </span>
      {conFecha && evaluacion.fecha ? (
        <span className="text-ink/40 whitespace-nowrap tabular-nums">· {fecha(evaluacion.fecha + "T12:00:00")}</span>
      ) : null}
    </span>
  );
}

/** Chip grande para el encabezado de la orden. */
export function ChipSemaforo({ evaluacion }: { evaluacion: EvaluacionSemaforo | undefined }) {
  if (!evaluacion?.semaforo || evaluacion.dias === null) return null;
  return (
    <span className={cn("rounded-field inline-flex items-center gap-2 px-3 py-[6px] text-[11px] font-semibold tracking-[0.08em] uppercase", CLASE_SEMAFORO[evaluacion.semaforo])}>
      <span className={cn("inline-block size-2 rounded-full", PUNTO_SEMAFORO[evaluacion.semaforo])} />
      {ETIQUETA_SEMAFORO[evaluacion.semaforo]} · {describirRestantes(evaluacion.dias)}
    </span>
  );
}
