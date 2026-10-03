import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Tabla plana con el tratamiento tipográfico de la marca. Es HTML normal:
 * las páginas siguen siendo Server Components y la paginación va por URL.
 */
export function Tabla({
  children,
  className,
  minAncho = 720,
}: {
  children: ReactNode;
  className?: string;
  /** Ancho mínimo en px: por debajo, la tarjeta hace scroll horizontal. */
  minAncho?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-[12.5px]", className)}
        style={{ minWidth: minAncho }}
      >
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-ink/7 text-ink/42 border-b text-left text-[9px] tracking-[0.16em]">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 font-medium uppercase first:pl-5 last:pr-5", className)} {...props} />;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-ink/6 hover:bg-gold/4 border-b transition-colors last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle first:pl-5 last:pr-5", className)} {...props} />;
}
