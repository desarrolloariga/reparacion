"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  ClipboardList,
  Gem,
  Hammer,
  House,
  KanbanSquare,
  PackagePlus,
  Receipt,
  SlidersHorizontal,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { accesosMoviles, itemActivo, type IconoNav } from "@/lib/navegacion";
import type { RolUsuario } from "@/lib/supabase/modelo";
import { cn } from "@/lib/utils";

/** Barra inferior de accesos rápidos en móvil: lo frecuente, a un pulgar. */

export const ICONOS_NAV: Record<IconoNav, LucideIcon> = {
  inicio: House,
  ordenes: ClipboardList,
  recepcion: PackagePlus,
  clientes: UserRound,
  joyeros: Gem,
  catalogos: SlidersHorizontal,
  usuarios: Users,
  trabajos: Hammer,
  alertas: Bell,
  tablero: KanbanSquare,
  liquidaciones: Receipt,
  gerencia: BarChart3,
};

export function BarraMovil({ rol }: { rol: RolUsuario }) {
  const pathname = usePathname();
  const activo = itemActivo(pathname);
  const items = accesosMoviles(rol);

  if (items.length === 0) return null;

  return (
    <nav
      className="border-ink/10 bg-bone/95 fixed inset-x-0 bottom-0 z-30 flex border-t backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icono = ICONOS_NAV[item.icono ?? "inicio"];
        const esActivo = activo?.href === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={esActivo ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-[10px] text-[10px] font-medium transition-colors",
              esActivo ? "text-gold-dark" : "text-ink/45",
            )}
          >
            <Icono size={19} strokeWidth={esActivo ? 2.2 : 1.7} />
            {item.nombre}
          </Link>
        );
      })}
    </nav>
  );
}
