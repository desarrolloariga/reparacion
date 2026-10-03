import type { Metadata } from "next";

import { Tarjeta } from "@/components/ui/tarjeta";
import { requerirTaller } from "@/lib/auth/guardas";
import { listarEspecialidades } from "@/lib/datos/catalogos";
import { usuariosJoyeroDisponibles } from "@/lib/datos/usuarios";

import { FormularioJoyero } from "../formulario-joyero";

export const metadata: Metadata = { title: "Nuevo joyero" };

export default async function PaginaNuevoJoyero() {
  await requerirTaller();
  const [especialidades, cuentas] = await Promise.all([
    listarEspecialidades(true),
    usuariosJoyeroDisponibles(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,620px)_1fr] lg:items-start">
      <Tarjeta className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">TALLER</span>
          <h3 className="font-display m-0 text-[22px] leading-tight font-normal">Registrar joyero</h3>
        </div>
        <FormularioJoyero
          inicial={null}
          especialidades={especialidades.map((e) => ({ id: e.id, nombre: e.nombre }))}
          cuentas={cuentas}
        />
      </Tarjeta>
      <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">
        Después de crearlo podrás registrar sus tarifas por tipo de trabajo desde su
        ficha. Si va a entrar al sistema desde el celular, crea antes una cuenta con
        rol joyero en Usuarios y enlázala aquí.
      </p>
    </div>
  );
}
