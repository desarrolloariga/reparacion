import { cn } from "@/lib/utils";

/**
 * Barras horizontales en SVG inline, sin librería. El color va con la
 * entidad (serie) o es oro por defecto; el cromo retrocede.
 */
export function Barras({
  datos,
  formato = (v) => String(v),
  max,
  className,
  vacio = "Sin datos en el período",
}: {
  datos: { etiqueta: string; valor: number; color?: string; nota?: string }[];
  formato?: (v: number) => string;
  max?: number;
  className?: string;
  vacio?: string;
}) {
  if (datos.length === 0) return <p className={cn("text-ink/40 m-0 px-5 py-6 text-[12px]", className)}>{vacio}</p>;
  const tope = Math.max(max ?? 0, ...datos.map((d) => Math.abs(d.valor)), 1);

  return (
    <ul className={cn("m-0 flex list-none flex-col gap-2 p-0", className)}>
      {datos.map((d) => {
        const ancho = Math.max(2, Math.round((Math.abs(d.valor) / tope) * 100));
        const negativo = d.valor < 0;
        return (
          <li key={d.etiqueta} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3 text-[12px]">
            <span className="truncate" title={d.etiqueta}>
              {d.etiqueta}
              {d.nota ? <span className="text-ink/40 block truncate text-[10.5px]">{d.nota}</span> : null}
            </span>
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-[10px] w-full" aria-hidden>
              <rect x="0" y="0" width="100" height="10" fill="var(--color-rejilla)" />
              <rect x="0" y="0" width={ancho} height="10" fill={negativo ? "var(--color-clay)" : (d.color ?? "var(--color-gold)")} />
            </svg>
            <span className={cn("min-w-[72px] text-right tabular-nums", negativo && "text-clay")}>{formato(d.valor)}</span>
          </li>
        );
      })}
    </ul>
  );
}
