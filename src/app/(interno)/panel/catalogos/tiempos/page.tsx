import type { Metadata } from "next";

import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { requerirAdmin } from "@/lib/auth/guardas";
import { claveMatriz, listarComplejidades, listarTiposTrabajo, matrizTiempos } from "@/lib/datos/catalogos";

import { Matriz } from "./matriz";

export const metadata: Metadata = { title: "Tiempos estándar" };

/**
 * Matriz tipo de trabajo × complejidad. Es el corazón del cálculo automático
 * de fechas: cada orden suma los días hábiles de sus trabajos desde aquí.
 */
export default async function PaginaTiempos() {
  await requerirAdmin();
  const [tipos, complejidades, matriz] = await Promise.all([
    listarTiposTrabajo(),
    listarComplejidades(),
    matrizTiempos(),
  ]);

  const activos = tipos.filter((t) => t.activo);
  const definidas = activos.reduce(
    (s, t) => s + complejidades.filter((c) => matriz.has(claveMatriz(t.id, c.id))).length,
    0,
  );
  const total = activos.length * complejidades.length;

  return (
    <div className="flex flex-col gap-5">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Días hábiles por trabajo y complejidad">
          <span className={`text-[12px] ${definidas === total ? "text-sage" : "text-gold-deep"}`}>
            {definidas} de {total} combinaciones definidas
          </span>
        </TarjetaEncabezado>
        <Matriz
          tipos={tipos.map((t) => ({ id: t.id, nombre: t.nombre, categoria: t.categoria, activo: t.activo }))}
          complejidades={complejidades.map((c) => ({ id: c.id, nombre: c.nombre }))}
          valores={Object.fromEntries(matriz)}
        />
      </Tarjeta>
      <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">
        Una celda vacía significa «sin tiempo definido»: la recepción de una pieza
        con ese trabajo y esa complejidad se bloquea hasta que se calibre. Los
        tiempos son días hábiles del joyero, no días naturales; la holgura al
        cliente se suma aparte (Parámetros).
      </p>
    </div>
  );
}
