import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Etiqueta pequeña en versalitas: estados, categorías, roles. */
export function Chip({
  tono = "neutro",
  children,
  className,
  title,
}: {
  tono?: "neutro" | "oro" | "exito" | "error" | "oscuro" | "tenue";
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "rounded-field inline-flex shrink-0 items-center gap-1 px-[9px] py-[3px] text-[9.5px] font-semibold tracking-[0.1em] whitespace-nowrap uppercase",
        tono === "neutro" && "bg-ink/8 text-ink/55",
        tono === "oro" && "bg-gold/16 text-gold-deep",
        tono === "exito" && "bg-sage/14 text-sage",
        tono === "error" && "bg-clay/10 text-clay",
        tono === "oscuro" && "bg-ink text-gold-light",
        tono === "tenue" && "bg-ink/4 text-ink/35",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** ACTIVO / INACTIVO. */
export function ChipActivo({ activo }: { activo: boolean }) {
  return <Chip tono={activo ? "exito" : "tenue"}>{activo ? "Activo" : "Inactivo"}</Chip>;
}
