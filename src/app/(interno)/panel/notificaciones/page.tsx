import type { Metadata } from "next";
import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { marcarLeida, marcarTodasLeidas } from "@/lib/acciones/notificaciones";
import { requerirSesion } from "@/lib/auth/guardas";
import { fechaHora } from "@/lib/format";
import { listarNotificaciones } from "@/lib/notificaciones";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notificaciones" };

export default async function PaginaNotificaciones() {
  const sesion = await requerirSesion();
  const lista = await listarNotificaciones(sesion.usuarioId);
  const noLeidas = lista.filter((n) => !n.leida_en).length;

  return (
    <Tarjeta className="mx-auto w-full max-w-[820px] overflow-hidden">
      <TarjetaEncabezado titulo="Notificaciones">
        {noLeidas > 0 ? (
          <form action={marcarTodasLeidas}>
            <Boton type="submit" tamano="sm" variante="contorno">MARCAR TODAS LEÍDAS</Boton>
          </form>
        ) : (
          <span className="text-ink/45 text-[12px]">Todo leído</span>
        )}
      </TarjetaEncabezado>
      {lista.length === 0 ? (
        <Vacio titulo="Sin notificaciones" descripcion="Aquí aparecerán asignaciones, trabajos terminados, alertas y avisos." className="py-10" />
      ) : (
        <ul className="m-0 list-none divide-y divide-ink/6 p-0">
          {lista.map((n) => (
            <li key={n.id} className={cn("flex flex-wrap items-start gap-3 px-5 py-3", !n.leida_en && "bg-gold/4")}>
              <span className={cn("mt-[6px] inline-block size-2 shrink-0 rounded-full", n.leida_en ? "bg-ink/15" : "bg-gold")} />
              <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                {n.enlace ? (
                  <Link href={n.enlace} className="hover:text-gold-dark text-[13.5px] font-medium">{n.titulo}</Link>
                ) : (
                  <span className="text-[13.5px] font-medium">{n.titulo}</span>
                )}
                {n.cuerpo ? <span className="text-ink/60 text-[12px]">{n.cuerpo}</span> : null}
                <span className="text-ink/40 text-[11px]">{fechaHora(n.creado_en)}</span>
              </span>
              {!n.leida_en ? (
                <form action={marcarLeida}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="text-ink/40 hover:text-ink cursor-pointer text-[11px] underline-offset-2 hover:underline">Leída</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
