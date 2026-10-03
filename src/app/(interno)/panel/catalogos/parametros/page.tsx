import type { Metadata } from "next";

import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { requerirAdmin } from "@/lib/auth/guardas";
import { listarParametros } from "@/lib/datos/parametros";

import { FormularioParametros } from "./formulario";

export const metadata: Metadata = { title: "Parámetros" };

export default async function PaginaParametros() {
  await requerirAdmin();
  const filas = await listarParametros();
  const valores: Record<string, string> = {};
  for (const f of filas) valores[f.clave] = f.valor;

  return (
    <div className="flex max-w-[820px] flex-col gap-5">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Parámetros del sistema" />
        <FormularioParametros valores={valores} />
      </Tarjeta>
      <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">
        Los cambios aplican a las órdenes nuevas y a los cálculos que se hagan a
        partir de ahora; las fechas ya prometidas no se recalculan solas.
      </p>
    </div>
  );
}
