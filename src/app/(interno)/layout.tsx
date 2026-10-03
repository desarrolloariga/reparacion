import type { ReactNode } from "react";

import { Campana } from "@/components/layout/campana";
import { Shell } from "@/components/layout/shell";
import { requerirSesion } from "@/lib/auth/guardas";
import { alertasActivas } from "@/lib/datos/alertas";
import { contarNoLeidas } from "@/lib/notificaciones";
import { ETIQUETA_ROL } from "@/lib/supabase/modelo";

/**
 * Frontera de autenticación del panel.
 *
 * El proxy solo comprueba que exista la cookie; aquí se resuelve la sesión
 * real contra la base y se corta el paso si no vale. Todo lo que cuelga de
 * este layout puede asumir que hay una sesión válida.
 */
export default async function LayoutInterno({ children }: { children: ReactNode }) {
  const sesion = await requerirSesion();

  const [noLeidas, alertas] = await Promise.all([
    contarNoLeidas(sesion.usuarioId).catch(() => 0),
    sesion.rol === "joyero" ? Promise.resolve(null) : alertasActivas().catch(() => null),
  ]);

  return (
    <Shell
      usuario={{ nombre: sesion.nombre, rol: sesion.rol, detalle: ETIQUETA_ROL[sesion.rol] }}
      contadores={alertas && alertas.total > 0 ? { Alertas: alertas.total } : undefined}
      accion={<Campana noLeidas={noLeidas} />}
    >
      {children}
    </Shell>
  );
}
