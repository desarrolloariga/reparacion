import { cn } from "@/lib/utils";

type Punto = { etiqueta: string; valores: number[] };

/**
 * Serie de tiempo (varias líneas) en SVG inline. Pensada para la tendencia
 * mensual: ingreso, costo y utilidad. Sin librería.
 */
export function Serie({
  puntos,
  series,
  formato = (v) => String(v),
  alto = 180,
  className,
}: {
  puntos: Punto[];
  series: { nombre: string; color: string }[];
  formato?: (v: number) => string;
  alto?: number;
  className?: string;
}) {
  if (puntos.length === 0) return <p className="text-ink/40 m-0 px-5 py-6 text-[12px]">Sin datos.</p>;

  const ancho = 640;
  const margen = { izq: 56, der: 12, arr: 12, abj: 28 };
  const w = ancho - margen.izq - margen.der;
  const h = alto - margen.arr - margen.abj;
  const todos = puntos.flatMap((p) => p.valores);
  const max = Math.max(...todos, 1);
  const min = Math.min(...todos, 0);
  const y = (v: number) => margen.arr + h - ((v - min) / (max - min || 1)) * h;
  const x = (i: number) => margen.izq + (puntos.length === 1 ? w / 2 : (i / (puntos.length - 1)) * w);
  const pasos = 4;
  const cuadricula = Array.from({ length: pasos + 1 }, (_, i) => min + ((max - min) * i) / pasos);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full" role="img" aria-label="Serie de tiempo">
        {cuadricula.map((v) => (
          <g key={v}>
            <line x1={margen.izq} x2={ancho - margen.der} y1={y(v)} y2={y(v)} stroke="var(--color-rejilla)" strokeWidth="1" />
            <text x={margen.izq - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--color-eje)">{formato(v)}</text>
          </g>
        ))}
        {min < 0 ? <line x1={margen.izq} x2={ancho - margen.der} y1={y(0)} y2={y(0)} stroke="var(--color-eje)" strokeWidth="1" /> : null}
        {series.map((s, si) => {
          const ruta = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valores[si] ?? 0).toFixed(1)}`).join(" ");
          return (
            <g key={s.nombre}>
              <path d={ruta} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {puntos.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p.valores[si] ?? 0)} r="2.5" fill={s.color}>
                  <title>{`${p.etiqueta} · ${s.nombre}: ${formato(p.valores[si] ?? 0)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {puntos.map((p, i) => (
          <text key={p.etiqueta} x={x(i)} y={alto - 8} textAnchor="middle" fontSize="9" fill="var(--color-ink)" opacity="0.55">{p.etiqueta}</text>
        ))}
      </svg>
      <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-[11px]">
        {series.map((s) => (
          <li key={s.nombre} className="flex items-center gap-2">
            <span className="inline-block h-[3px] w-4 rounded" style={{ background: s.color }} />
            {s.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
