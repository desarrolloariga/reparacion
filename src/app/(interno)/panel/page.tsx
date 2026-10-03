import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChipEstadoOrden } from "@/components/ordenes/chip-estado";
import { Semaforo } from "@/components/ordenes/semaforo";
import { Boton } from "@/components/ui/boton";
import { Tarjeta, TarjetaEncabezado, TarjetaIndicador } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirSesion } from "@/lib/auth/guardas";
import { alertasActivas } from "@/lib/datos/alertas";
import { calendarioVigente, listarExcepciones, proximoDiaNoHabil } from "@/lib/datos/calendario";
import { combinacionesSinTiempo } from "@/lib/datos/catalogos";
import { contarPorEstado, listarOrdenes } from "@/lib/datos/ordenes";
import { evaluarSemaforos } from "@/lib/datos/semaforo";
import { fecha } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { ESTADOS_KANBAN, ETIQUETA_CORTA_ESTADO } from "@/lib/reparaciones/estados";

export const metadata: Metadata = { title: "Inicio" };

/** Resumen del día: alertas, órdenes por estado y lo último recibido. */
export default async function PaginaPanel() {
  const sesion = await requerirSesion();
  if (sesion.rol === "joyero") redirect("/panel/mis-trabajos");

  const [alertas, conteo, recientes, faltantes, calendario, excepciones] = await Promise.all([
    alertasActivas(),
    contarPorEstado(),
    listarOrdenes({ estado: "activas", pagina: 1, porPagina: 8 }),
    sesion.rol === "admin" ? combinacionesSinTiempo() : Promise.resolve([]),
    calendarioVigente(),
    listarExcepciones(),
  ]);
  const semaforos = await evaluarSemaforos(recientes.filas);
  const noHabil = await proximoDiaNoHabil(hoyISO(), calendario, excepciones);
  const vencidas = alertas.joyero.vencidas.length + alertas.cliente.vencidas.length;
  const porVencer = alertas.joyero.porVencer.length + alertas.cliente.porVencer.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaIndicador etiqueta="ÓRDENES ACTIVAS" valor={alertas.activas} nota={`${conteo.entregada ?? 0} entregadas en total`} />
        <TarjetaIndicador etiqueta="VENCIDAS" valor={vencidas} nota={vencidas > 0 ? `${alertas.joyero.vencidas.length} del joyero · ${alertas.cliente.vencidas.length} frente al cliente` : "ninguna"} />
        <TarjetaIndicador etiqueta="POR VENCER" valor={porVencer} nota="dentro del umbral de alerta" />
        <TarjetaIndicador etiqueta="PRÓXIMO DÍA NO HÁBIL" valor={noHabil ? fecha(noHabil.fecha + "T12:00:00") : "—"} nota={noHabil?.motivo} />
      </div>

      {vencidas + porVencer > 0 ? (
        <Tarjeta className="border-clay/30 bg-clay/4 flex flex-wrap items-center justify-between gap-4 px-[22px] py-4">
          <span className="text-[13px]"><strong>{vencidas}</strong> vencidas y <strong>{porVencer}</strong> por vencer. Empieza el día por ahí.</span>
          <Link href="/panel/alertas"><Boton tamano="sm">VER ALERTAS</Boton></Link>
        </Tarjeta>
      ) : null}

      {faltantes.length > 0 ? (
        <Tarjeta className="border-gold/40 bg-gold/6 flex flex-wrap items-center justify-between gap-4 px-[22px] py-4">
          <span className="text-[13px]">Faltan <strong>{faltantes.length}</strong> combinaciones en la matriz de tiempos estándar: la recepción con esos trabajos se bloquea.</span>
          <Link href="/panel/catalogos/tiempos"><Boton tamano="sm" variante="contorno">COMPLETAR MATRIZ</Boton></Link>
        </Tarjeta>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Últimas órdenes activas">
            <Link href="/panel/ordenes" className="text-ink/45 hover:text-gold-dark text-[12px]">Ver todas</Link>
          </TarjetaEncabezado>
          {recientes.filas.length === 0 ? (
            <Vacio titulo="Sin órdenes activas" descripcion="Recibe una pieza para abrir la primera." accion={sesion.rol !== "gerencia" ? <Link href="/panel/ordenes/nueva"><Boton>RECIBIR PIEZA</Boton></Link> : undefined} className="py-10" />
          ) : (
            <ul className="m-0 list-none divide-y divide-ink/6 p-0">
              {recientes.filas.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span className="flex min-w-0 flex-col">
                    <Link href={`/panel/ordenes/${o.id}`} className="hover:text-gold-dark font-mono text-[12px] font-medium">{o.numero}</Link>
                    <span className="truncate text-[12.5px]">{o.descripcion_pieza} · <span className="text-ink/55">{o.cliente}</span></span>
                  </span>
                  <span className="flex items-center gap-3">
                    <ChipEstadoOrden estado={o.estado} corto />
                    <Semaforo evaluacion={semaforos.get(o.id)} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Por estado">
            <Link href="/panel/tablero" className="text-ink/45 hover:text-gold-dark text-[12px]">Tablero</Link>
          </TarjetaEncabezado>
          <ul className="m-0 list-none divide-y divide-ink/6 p-0">
            {ESTADOS_KANBAN.map((e) => (
              <li key={e} className="flex items-center justify-between px-5 py-2 text-[12.5px]">
                <Link href={`/panel/ordenes?estado=${e}`} className="hover:text-gold-dark">{ETIQUETA_CORTA_ESTADO[e]}</Link>
                <span className="font-medium tabular-nums">{conteo[e] ?? 0}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>
    </>
  );
}
