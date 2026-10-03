import type { Metadata } from "next";

import { Tarjeta } from "@/components/ui/tarjeta";
import { requerirSesion } from "@/lib/auth/guardas";
import { ETIQUETA_ROL } from "@/lib/supabase/modelo";

import { FormularioMiClave } from "./formulario";

export const metadata: Metadata = { title: "Mi contraseña" };

export default async function PaginaCuenta() {
  const sesion = await requerirSesion();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <Tarjeta className="flex flex-col gap-4 p-6">
        <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Tu cuenta</h3>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
          <dt className="text-ink/45">Nombre</dt>
          <dd className="m-0">{sesion.nombre}</dd>
          <dt className="text-ink/45">Acceso</dt>
          <dd className="m-0 font-mono">{sesion.correo}</dd>
          <dt className="text-ink/45">Rol</dt>
          <dd className="m-0">{ETIQUETA_ROL[sesion.rol]}</dd>
        </dl>
        <p className="text-ink/45 m-0 text-[11.5px] leading-relaxed">
          Si cambiaste de nombre o de correo, pide al administrador que lo
          actualice. Lo que sí puedes hacer tú es cambiar la contraseña.
        </p>
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">SEGURIDAD</span>
          <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Cambiar contraseña</h3>
        </div>
        <FormularioMiClave />
      </Tarjeta>
    </div>
  );
}
