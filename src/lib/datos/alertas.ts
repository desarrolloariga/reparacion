import "server-only";

import { tipoMoraDe } from "@/lib/reparaciones/estados";

import { ordenesActivas, type OrdenTablero } from "./ordenes";
import { evaluarSemaforos, type EvaluacionSemaforo } from "./semaforo";

export type OrdenAlerta = OrdenTablero & { evaluacion: EvaluacionSemaforo };

export type Alertas = {
  joyero: { vencidas: OrdenAlerta[]; porVencer: OrdenAlerta[] };
  cliente: { vencidas: OrdenAlerta[]; porVencer: OrdenAlerta[] };
  total: number;
  activas: number;
};

/**
 * Órdenes vencidas y por vencer, separadas según quién está en mora: el
 * joyero (asignada / en_proceso, contra su compromiso) o el taller frente
 * al cliente (cualquier otro estado activo, contra la fecha prometida).
 */
export async function alertasActivas(): Promise<Alertas> {
  const activas = await ordenesActivas();
  const semaforos = await evaluarSemaforos(activas);

  const salida: Alertas = { joyero: { vencidas: [], porVencer: [] }, cliente: { vencidas: [], porVencer: [] }, total: 0, activas: activas.length };
  for (const o of activas) {
    const e = semaforos.get(o.id);
    if (!e?.semaforo || e.semaforo === "a_tiempo") continue;
    const grupo = tipoMoraDe(o.estado) === "joyero" ? salida.joyero : salida.cliente;
    (e.semaforo === "vencido" ? grupo.vencidas : grupo.porVencer).push({ ...o, evaluacion: e });
    salida.total += 1;
  }
  const porDias = (a: OrdenAlerta, b: OrdenAlerta) => (a.evaluacion.dias ?? 0) - (b.evaluacion.dias ?? 0);
  for (const g of [salida.joyero, salida.cliente]) {
    g.vencidas.sort(porDias);
    g.porVencer.sort(porDias);
  }
  return salida;
}
