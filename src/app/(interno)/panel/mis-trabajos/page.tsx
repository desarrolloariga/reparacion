import type { Metadata } from "next";
import Link from "next/link";

import { ChipTipoOrden } from "@/components/ordenes/chip-estado";
import { Semaforo } from "@/components/ordenes/semaforo";
import { Chip } from "@/components/ui/chip";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirRol } from "@/lib/auth/guardas";
import { evaluarSemaforos } from "@/lib/datos/semaforo";
import { trabajosDeJoyero } from "@/lib/datos/trabajos-joyero";
import { fecha } from "@/lib/format";

export const metadata: Metadata = { title: "Mis trabajos" };

/**
 * Portal del joyero: deliberadamente mínimo y usable desde el celular. Los
 * datos salen de una vista sin precios al cliente.
 */
export default async function PaginaMisTrabajos() {
  const sesion = await requerirRol("joyero");

  if (sesion.joyeroId === null) {
    return (
      <Tarjeta>
        <Vacio titulo="Tu cuenta todavía no está enlazada" descripcion="Tienes acceso de joyero, pero el taller aún no enlazó esta cuenta con tu ficha de joyero. Pide al administrador que lo haga desde Joyeros → tu ficha → Cuenta de acceso." />
      </Tarjeta>
    );
  }

  const trabajos = await trabajosDeJoyero(sesion.joyeroId);
  const activos = trabajos.filter((t) => t.estado_asignacion === "asignada" || t.estado_asignacion === "en_proceso");
  const terminados = trabajos.filter((t) => t.estado_asignacion === "terminada" || t.estado_asignacion === "rechazada_calidad" || t.estado_asignacion === "cerrada").slice(0, 20);
  const semaforos = await evaluarSemaforos(activos.map((t) => ({ id: t.asignacion_id, fecha_control: t.fecha_compromiso })));

  return (
    <div className="flex flex-col gap-5">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo={`Hola, ${sesion.nombre.split(" ")[0]}`}>
          <span className="text-ink/45 text-[12px]">{activos.length} {activos.length === 1 ? "trabajo pendiente" : "trabajos pendientes"}</span>
        </TarjetaEncabezado>
        {activos.length === 0 ? (
          <Vacio titulo="Sin trabajos pendientes" descripcion="Cuando el taller te asigne una pieza aparecerá aquí con sus instrucciones y su fecha de compromiso." className="py-10" />
        ) : (
          <ul className="m-0 list-none divide-y divide-ink/6 p-0">
            {activos.map((t) => (
              <li key={t.asignacion_id}>
                <Link href={`/panel/mis-trabajos/${t.asignacion_id}`} className="hover:bg-gold/4 flex flex-col gap-2 px-5 py-4 transition-colors">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-medium">{t.numero}</span>
                    <ChipTipoOrden tipo={t.tipo} />
                    <Chip tono={t.estado_asignacion === "en_proceso" ? "oscuro" : "oro"}>{t.estado_asignacion === "en_proceso" ? "En proceso" : "Por iniciar"}</Chip>
                    {t.es_retrabajo ? <Chip tono="error">Retrabajo</Chip> : null}
                  </span>
                  <span className="text-[14px] font-medium">{t.descripcion_pieza}</span>
                  <span className="text-ink/60 text-[12.5px]">{t.trabajos ?? "—"}</span>
                  <span className="flex flex-wrap items-center gap-3 text-[12px]">
                    <span className="text-ink/45">Compromiso: <span className="text-ink tabular-nums">{fecha(t.fecha_compromiso + "T12:00:00")}</span></span>
                    <Semaforo evaluacion={semaforos.get(t.asignacion_id)} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      {terminados.length > 0 ? (
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Terminados recientes" />
          <ul className="m-0 list-none divide-y divide-ink/6 p-0">
            {terminados.map((t) => (
              <li key={t.asignacion_id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[12.5px]">
                <span><span className="font-mono font-medium">{t.numero}</span> · {t.descripcion_pieza}</span>
                <span className="flex items-center gap-2">
                  {t.estado_asignacion === "rechazada_calidad" ? <Chip tono="error">Rechazado en calidad</Chip> : <Chip tono="exito">Terminado</Chip>}
                  <span className="text-ink/45 tabular-nums">{t.fecha_terminado_real ? fecha(t.fecha_terminado_real + "T12:00:00") : ""}</span>
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}
    </div>
  );
}
