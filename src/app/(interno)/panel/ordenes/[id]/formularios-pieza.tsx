"use client";

import { useActionState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo } from "@/components/ui/campo";
import { cambiarFechaPrometida, editarPieza } from "@/lib/acciones/ordenes";
import type { Orden } from "@/lib/datos/ordenes";
import type { EstadoAccion } from "@/lib/validacion";

export function FormularioPieza({ orden }: { orden: Orden }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(editarPieza, null);
  const campo = (n: string) => estado?.campos?.[n];

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="orden_id" value={orden.id} />
      <Campo etiqueta="DESCRIPCIÓN" name="descripcion_pieza" defaultValue={orden.descripcion_pieza} error={campo("descripcion_pieza")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="MATERIAL" name="material" defaultValue={orden.material ?? ""} />
        <Campo etiqueta="QUILATAJE" name="quilataje" defaultValue={orden.quilataje ?? ""} />
        <Campo etiqueta="PESO ENTRADA (g)" name="peso_entrada_g" type="number" step="0.001" min={0} defaultValue={orden.peso_entrada_g ?? ""} error={campo("peso_entrada_g")} />
        <Campo etiqueta="PESO SALIDA (g)" name="peso_salida_g" type="number" step="0.001" min={0} defaultValue={orden.peso_salida_g ?? ""} error={campo("peso_salida_g")} ayuda="Se anota al terminar." />
      </div>
      <Campo etiqueta="PIEDRAS" name="piedras" defaultValue={orden.piedras ?? ""} />
      <Area etiqueta="OBSERVACIONES DE RECEPCIÓN" name="observaciones_recepcion" defaultValue={orden.observaciones_recepcion ?? ""} />
      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>
      <Boton type="submit" disabled={enviando} tamano="sm" variante="contorno" className="self-start">
        {enviando ? "GUARDANDO…" : "GUARDAR PIEZA"}
      </Boton>
    </form>
  );
}

export function FormularioFechaPrometida({ orden }: { orden: Orden }) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(cambiarFechaPrometida, null);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="orden_id" value={orden.id} />
      <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <Campo etiqueta="NUEVA FECHA" name="fecha_prometida_cliente" type="date" defaultValue={orden.fecha_prometida_cliente ?? ""} error={estado?.campos?.fecha_prometida_cliente} required />
        <Campo etiqueta="MOTIVO (OPCIONAL)" name="motivo" placeholder="El cliente viaja; lo acordó con…" />
      </div>
      <p className="text-ink/45 m-0 text-[11px] leading-relaxed">
        Al fijarla a mano, los recálculos (por ejemplo al aprobar una cotización) la respetan. Queda anotado en el historial.
      </p>
      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>
      <Boton type="submit" disabled={enviando} tamano="sm" variante="contorno" className="self-start">
        {enviando ? "GUARDANDO…" : "FIJAR FECHA"}
      </Boton>
    </form>
  );
}
