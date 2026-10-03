"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { encabezadoDeRuta } from "@/lib/navegacion";

/**
 * Cabecera pegajosa: migaja y título derivados de la ruta, más un espacio a
 * la derecha para la acción principal de la aplicación.
 */
export function Encabezado({
  onAbrirMenu,
  accion,
}: {
  onAbrirMenu?: () => void;
  accion?: ReactNode;
}) {
  const pathname = usePathname();
  const { migaja, titulo } = encabezadoDeRuta(pathname);

  return (
    <header className="border-ink/8 bg-bone/90 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-4 backdrop-blur-md sm:px-6 lg:gap-6 lg:px-[38px] lg:py-[22px]">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        className="text-ink/60 hover:text-ink -ml-1 cursor-pointer lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="text-gold-dark tracking-label truncate text-[9px] leading-none font-medium">
          {migaja}
        </span>
        <h2 className="font-display m-0 truncate text-[21px] leading-none font-normal lg:text-[25px]">
          {titulo}
        </h2>
      </div>

      {accion}
    </header>
  );
}
