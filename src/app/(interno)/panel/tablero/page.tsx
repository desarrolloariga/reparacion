import type { Metadata } from "next";

import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { ordenesActivas } from "@/lib/datos/ordenes";
import { evaluarSemaforos } from "@/lib/datos/semaforo";

import { Kanban } from "./kanban";

export const metadata: Metadata = { title: "Tablero" };

export default async function PaginaTablero() {
  const sesion = await requerirLectura();
  const ordenes = await ordenesActivas();
  const semaforos = await evaluarSemaforos(ordenes);

  return (
    <Kanban
      ordenes={ordenes.map((o) => ({
        id: o.id,
        numero: o.numero,
        tipo: o.tipo,
        estado: o.estado,
        cliente: o.cliente,
        descripcion_pieza: o.descripcion_pieza,
        joyero: o.joyero,
        evaluacion: semaforos.get(o.id) ?? { semaforo: null, dias: null, fecha: null },
      }))}
      editable={!soloLectura(sesion)}
    />
  );
}
