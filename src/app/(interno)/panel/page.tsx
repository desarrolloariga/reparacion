import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Boton } from "@/components/ui/boton";
import { Tarjeta, TarjetaEncabezado, TarjetaIndicador } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirSesion } from "@/lib/auth/guardas";
import { calendarioVigente, listarExcepciones, proximoDiaNoHabil } from "@/lib/datos/calendario";
import { combinacionesSinTiempo, listarTiposTrabajo } from "@/lib/datos/catalogos";
import { listarJoyeros } from "@/lib/datos/joyeros";
import { leerParametros } from "@/lib/datos/parametros";
import { fecha } from "@/lib/format";
import { hoyISO, NOMBRE_DIA_SEMANA } from "@/lib/reparaciones/dias-habiles";

export const metadata: Metadata = { title: "Inicio" };

/**
 * Resumen de arranque. En esta fase muestra el estado de la parametrización
 * del taller; las órdenes y alertas llegan en las fases siguientes.
 */
export default async function PaginaPanel() {
  const sesion = await requerirSesion();
  if (sesion.rol === "joyero") redirect("/panel/mis-trabajos");

  const [joyeros, tipos, faltantes, parametros, calendario, excepciones] = await Promise.all([
    listarJoyeros(true),
    listarTiposTrabajo({ soloActivos: true }),
    combinacionesSinTiempo(),
    leerParametros(),
    calendarioVigente(),
    listarExcepciones(),
  ]);

  const hoy = hoyISO();
  const noHabil = await proximoDiaNoHabil(hoy, calendario, excepciones);
  const diasSemana = parametros.dias_semana_habiles.map((d) => NOMBRE_DIA_SEMANA[d].slice(0, 3)).join(" · ");

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador etiqueta="JOYEROS ACTIVOS" valor={joyeros.length} nota="en el taller" />
        <TarjetaIndicador etiqueta="TIPOS DE TRABAJO" valor={tipos.length} nota="activos en catálogo" />
        <TarjetaIndicador
          etiqueta="MATRIZ DE TIEMPOS"
          valor={faltantes.length === 0 ? "Completa" : faltantes.length}
          nota={faltantes.length === 0 ? "todas las combinaciones definidas" : "combinaciones sin tiempo"}
        />
        <TarjetaIndicador
          etiqueta="PRÓXIMO DÍA NO HÁBIL"
          valor={noHabil ? fecha(noHabil.fecha) : "—"}
          nota={noHabil?.motivo}
        />
      </div>

      {faltantes.length > 0 && sesion.rol === "admin" ? (
        <Tarjeta className="border-gold/40 bg-gold/6 flex flex-wrap items-center justify-between gap-4 px-[22px] py-4">
          <div className="flex flex-col gap-1">
            <span className="text-gold-deep text-[13px] font-medium">
              Faltan {faltantes.length} combinaciones en la matriz de tiempos estándar.
            </span>
            <span className="text-ink/55 text-[12px]">
              Sin ellas, la recepción de una pieza con ese trabajo y complejidad se bloquea.
            </span>
          </div>
          <Link href="/panel/catalogos/tiempos">
            <Boton tamano="sm">COMPLETAR MATRIZ</Boton>
          </Link>
        </Tarjeta>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta>
          <TarjetaEncabezado titulo="Calendario laboral" />
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-[22px] py-[18px] text-[13px]">
            <dt className="text-ink/45">Días hábiles</dt>
            <dd className="m-0">{diasSemana}</dd>
            <dt className="text-ink/45">Holgura al cliente</dt>
            <dd className="m-0">{parametros.holgura_cliente_dias} días hábiles</dd>
            <dt className="text-ink/45">Holgura del joyero</dt>
            <dd className="m-0">{parametros.holgura_joyero_dias} días hábiles</dd>
            <dt className="text-ink/45">Excepciones registradas</dt>
            <dd className="m-0">{excepciones.length}</dd>
          </dl>
        </Tarjeta>

        <Tarjeta>
          <Vacio
            titulo="Las órdenes llegan en la Fase 2"
            descripcion="Recepción de piezas, cotizaciones, asignación a joyeros, alertas y liquidaciones se construyen sobre esta base: joyeros, catálogos, tiempos y calendario."
          />
        </Tarjeta>
      </div>
    </>
  );
}
