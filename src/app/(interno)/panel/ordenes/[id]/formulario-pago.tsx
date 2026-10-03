"use client";

import { useActionState, useEffect, useRef } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { registrarPago } from "@/lib/acciones/pagos";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioPago({ ordenId, saldo, hoy }: { ordenId: number; saldo: number; hoy: string }) {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(registrarPago, null);
  const campo = (n: string) => estado?.campos?.[n];

  useEffect(() => {
    if (estado?.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="orden_id" value={ordenId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="TIPO" name="tipo" defaultValue="saldo" error={campo("tipo")}>
          <option value="anticipo">Anticipo</option>
          <option value="saldo">Saldo</option>
          <option value="total">Pago total</option>
        </Selector>
        <Campo etiqueta="MONTO (Q)" name="monto" type="number" min={0.01} max={saldo} step="0.01" inputMode="decimal" defaultValue={saldo.toFixed(2)} error={campo("monto")} ayuda={`Saldo: ${saldo.toFixed(2)}`} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="FORMA DE PAGO" name="forma_pago" defaultValue="efectivo" error={campo("forma_pago")}>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </Selector>
        <Campo etiqueta="FECHA" name="fecha" type="date" defaultValue={hoy} max={hoy} error={campo("fecha")} required />
      </div>
      <Campo etiqueta="REFERENCIA (OPCIONAL)" name="referencia" placeholder="Nº de boleta, últimos dígitos…" />
      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>
      <Boton type="submit" disabled={enviando} className="py-[14px]">{enviando ? "REGISTRANDO…" : "REGISTRAR PAGO"}</Boton>
    </form>
  );
}
