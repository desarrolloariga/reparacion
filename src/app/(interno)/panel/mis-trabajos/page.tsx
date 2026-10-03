import type { Metadata } from "next";

import { Tarjeta } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirRol } from "@/lib/auth/guardas";

export const metadata: Metadata = { title: "Mis trabajos" };

/** Portal del joyero. Se completa en la Fase 3. */
export default async function PaginaMisTrabajos() {
  const sesion = await requerirRol("joyero");

  if (sesion.joyeroId === null) {
    return (
      <Tarjeta>
        <Vacio
          titulo="Tu cuenta todavía no está enlazada"
          descripcion="Tienes acceso de joyero, pero el taller aún no enlazó esta cuenta con tu ficha de joyero. Pide al administrador que lo haga desde Joyeros → tu ficha → Cuenta de acceso."
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <Vacio
        titulo={`Hola, ${sesion.nombre.split(" ")[0]}`}
        descripcion="Aquí verás las piezas que tienes asignadas, con sus instrucciones, fotografías y fecha de compromiso. Esta pantalla se habilita en la Fase 3."
      />
    </Tarjeta>
  );
}
