"use client";

import { useActionState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { confirmarLiquidacion } from "@/lib/acciones/liquidaciones";
import { ETIQUETA_FORMA_PAGO, FORMAS_PAGO } from "@/lib/reparaciones/pagos";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioConfirmar({ liquidacionId, hoy }: { liquidacionId: number; hoy: string }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(confirmarLiquidacion, null);
  const campo = (n: string) => estado?.campos?.[n];
  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="liquidacion_id" value={liquidacionId} />
      <Campo etiqueta="FECHA DE PAGO" name="fecha_pago" type="date" defaultValue={hoy} max={hoy} error={campo("fecha_pago")} required />
      <Selector etiqueta="FORMA DE PAGO" name="forma_pago" defaultValue="transferencia" error={campo("forma_pago")}>
        {FORMAS_PAGO.map((f) => <option key={f} value={f}>{ETIQUETA_FORMA_PAGO[f]}</option>)}
      </Selector>
      <Campo etiqueta="REFERENCIA (OPCIONAL)" name="referencia" placeholder="Nº de transferencia, cheque…" />
      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>
      <Boton type="submit" disabled={enviando} className="py-[14px]">{enviando ? "CONFIRMANDO…" : "CONFIRMAR PAGO"}</Boton>
    </form>
  );
}
