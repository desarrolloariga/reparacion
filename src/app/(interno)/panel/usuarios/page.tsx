import type { Metadata } from "next";

import { Chip } from "@/components/ui/chip";
import { FormularioAlternar } from "@/components/ui/formulario-alternar";
import { Tarjeta } from "@/components/ui/tarjeta";
import { alternarUsuario } from "@/lib/acciones/usuarios";
import { requerirAdmin } from "@/lib/auth/guardas";
import { listarUsuarios } from "@/lib/datos/usuarios";
import { desde, iniciales } from "@/lib/format";
import { ETIQUETA_ROL } from "@/lib/supabase/modelo";

import { BotonClave } from "./boton-clave";
import { FormularioUsuario } from "./formulario";

export const metadata: Metadata = { title: "Usuarios" };

export default async function PaginaUsuarios() {
  const sesion = await requerirAdmin();
  const usuarios = await listarUsuarios();
  const activas = usuarios.filter((u) => u.activo).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <Tarjeta className="overflow-hidden">
        <div className="border-ink/7 flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-display m-0 text-lg leading-none font-normal">Cuentas</h3>
          <span className="text-ink/45 text-[12px]">
            {activas} de {usuarios.length} activas
          </span>
        </div>

        <ul className="m-0 list-none p-0">
          {usuarios.map((u) => {
            const esYo = u.id === sesion.usuarioId;
            return (
              <li
                key={u.id}
                className="border-ink/6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t px-5 py-4 first:border-t-0"
              >
                <span
                  className={`font-display flex size-9 shrink-0 items-center justify-center rounded-full border text-[12px] font-medium ${
                    u.activo ? "border-gold/45 text-gold-dark" : "border-ink/12 text-ink/30"
                  }`}
                >
                  {iniciales(u.nombre)}
                </span>

                <span className="flex min-w-0 flex-1 basis-[200px] flex-col">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-[13.5px] font-medium ${u.activo ? "" : "text-ink/40"}`}>
                      {u.nombre}
                    </span>
                    <Chip tono={u.rol === "admin" ? "oscuro" : u.rol === "joyero" ? "oro" : "neutro"}>
                      {ETIQUETA_ROL[u.rol]}
                    </Chip>
                    {esYo ? <Chip tono="oro">Tú</Chip> : null}
                  </span>
                  <span className="text-ink/42 truncate font-mono text-[11px]">
                    {u.correo}
                    {u.joyero ? ` · joyero: ${u.joyero}` : ""}
                    {u.rol === "joyero" && !u.joyero ? " · sin enlazar a un joyero" : ""}
                  </span>
                </span>

                <span className="text-ink/40 basis-[110px] text-[11px]">
                  {u.ultimo_acceso ? desde(u.ultimo_acceso) : "Nunca entró"}
                </span>

                <span className="flex items-center gap-2">
                  <BotonClave id={u.id} nombre={u.nombre} />
                  {esYo ? null : (
                    <FormularioAlternar id={u.id} activo={u.activo} accion={alternarUsuario} />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Tarjeta>

      <aside className="flex flex-col gap-4">
        <Tarjeta className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">
              NUEVA CUENTA
            </span>
            <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Dar de alta</h3>
          </div>
          <FormularioUsuario />
        </Tarjeta>

        <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">
          Las cuentas no se borran: desactivarlas cierra sus sesiones abiertas y
          les impide entrar, sin romper el historial de lo que hicieron. Una
          cuenta de rol joyero se enlaza desde la ficha del joyero.
        </p>
      </aside>
    </div>
  );
}
