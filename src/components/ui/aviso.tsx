import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Mensaje de resultado de un formulario: error, éxito o advertencia. */
export function Aviso({
  tono = "error",
  children,
  className,
}: {
  tono?: "error" | "ok" | "aviso" | "info";
  children: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      role={tono === "error" ? "alert" : "status"}
      className={cn(
        "rounded-field m-0 border px-3 py-[10px] text-[12px] leading-relaxed",
        tono === "error" && "border-clay/25 bg-clay/6 text-clay",
        tono === "ok" && "border-sage/30 bg-sage/8 text-sage",
        tono === "aviso" && "border-gold/30 bg-gold/8 text-gold-deep",
        tono === "info" && "border-ink/10 bg-ink/4 text-ink/60",
        className,
      )}
    >
      {children}
    </p>
  );
}
