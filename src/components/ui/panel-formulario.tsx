import type { ReactNode } from "react";
import Link from "next/link";

import { Tarjeta } from "@/components/ui/tarjeta";

/**
 * Columna derecha de las pantallas de catálogo: el formulario de alta o de
 * edición, con cabecera y enlace para cancelar la edición (que es volver a
 * la misma URL sin `?editar=`).
 */
export function PanelFormulario({
  eyebrow,
  titulo,
  editando,
  rutaCancelar,
  children,
  nota,
}: {
  eyebrow: string;
  titulo: string;
  editando?: boolean;
  rutaCancelar?: string;
  children: ReactNode;
  nota?: ReactNode;
}) {
  return (
    <aside className="flex flex-col gap-4">
      <Tarjeta className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">{eyebrow}</span>
            <h3 className="font-display m-0 text-[20px] leading-tight font-normal">{titulo}</h3>
          </div>
          {editando && rutaCancelar ? (
            <Link href={rutaCancelar} className="text-ink/45 hover:text-ink text-[11px] underline-offset-2 hover:underline">
              Cancelar
            </Link>
          ) : null}
        </div>
        {children}
      </Tarjeta>
      {nota ? <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">{nota}</p> : null}
    </aside>
  );
}

/** Rejilla lista + formulario de las pantallas de catálogo. */
export function DisposicionCatalogo({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">{children}</div>;
}

/** Lee `?editar=<id>` de los searchParams de una página. */
export function idEditar(params: Record<string, string | string[] | undefined>): number | null {
  const v = params.editar;
  if (typeof v !== "string") return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export type ParamsBusqueda = Promise<Record<string, string | string[] | undefined>>;
