import Link from "next/link";
import { Bell } from "lucide-react";

/** Campana de la cabecera con el contador de notificaciones sin leer. */
export function Campana({ noLeidas }: { noLeidas: number }) {
  return (
    <Link
      href="/panel/notificaciones"
      aria-label={noLeidas > 0 ? `${noLeidas} notificaciones sin leer` : "Notificaciones"}
      className="border-ink/14 text-ink/60 hover:border-gold hover:text-ink rounded-field relative flex size-[42px] shrink-0 items-center justify-center border transition-colors"
    >
      <Bell size={17} />
      {noLeidas > 0 ? (
        <span className="bg-gold text-ink absolute -top-[6px] -right-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
          {noLeidas > 99 ? "99+" : noLeidas}
        </span>
      ) : null}
    </Link>
  );
}
