import type { Metadata } from "next";

import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { requerirAdmin } from "@/lib/auth/guardas";
import { listarComplejidades } from "@/lib/datos/catalogos";

import { FilaComplejidad } from "./fila";

export const metadata: Metadata = { title: "Complejidades" };

/**
 * Las complejidades son fijas (Baja, Media, Alta): la matriz de tiempos y
 * las órdenes dependen de ellas. Solo se editan nombre, orden y descripción.
 */
export default async function PaginaComplejidades() {
  await requerirAdmin();
  const complejidades = await listarComplejidades();

  return (
    <div className="flex max-w-[820px] flex-col gap-5">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Niveles de complejidad" />
        <ul className="m-0 list-none p-0">
          {complejidades.map((c) => (
            <li key={c.id} className="border-ink/6 border-t px-[22px] py-5 first:border-t-0">
              <FilaComplejidad complejidad={c} />
            </li>
          ))}
        </ul>
      </Tarjeta>
      <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">
        Cada combinación de tipo de trabajo y complejidad tiene sus días hábiles en
        la matriz de tiempos estándar. Por eso no se crean ni se borran niveles
        desde aquí: cambiarlos desencajaría la matriz y las órdenes ya recibidas.
      </p>
    </div>
  );
}
