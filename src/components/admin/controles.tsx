"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo, Selector } from "@/components/ui/campo";
import { cn } from "@/lib/utils";
import type { EstadoAccion } from "@/lib/validacion";

/**
 * Controles de corrección del administrador: un botón «Editar» que despliega
 * un formulario generado desde una lista de campos, y un botón «Eliminar»
 * con confirmación y motivo. Solo se renderizan cuando la página ya
 * comprobó que la sesión es admin; la acción del servidor vuelve a exigirlo.
 */

type Accion = (previo: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
type Ocultos = Record<string, string | number>;

export type CampoEdicion = {
  nombre: string;
  etiqueta: string;
  tipo?: "texto" | "numero" | "fecha" | "area" | "seleccion";
  valor: string | number | null | undefined;
  opciones?: { valor: string; etiqueta: string }[];
  requerido?: boolean;
  ayuda?: string;
  /** Ocupa las dos columnas. */
  ancho?: boolean;
};

const CLASE_BOTON =
  "rounded-field inline-flex cursor-pointer items-center gap-[5px] border px-[9px] py-[5px] text-[11px] whitespace-nowrap transition-colors";

function Ocultos({ valores }: { valores: Ocultos }) {
  return (
    <>
      {Object.entries(valores).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

export function BotonEliminar({
  accion,
  ocultos,
  pregunta = "¿Eliminar este registro?",
  etiqueta = "Eliminar",
  motivoObligatorio = false,
  detalle,
  className,
}: {
  accion: Accion;
  ocultos: Ocultos;
  pregunta?: string;
  etiqueta?: string;
  motivoObligatorio?: boolean;
  detalle?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, enviar, enviando] = useActionState<EstadoAccion, FormData>(accion, null);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className={cn(CLASE_BOTON, "border-clay/30 text-clay hover:bg-clay/8", className)}>
        <Trash2 size={12} /> {etiqueta}
      </button>
    );
  }

  return (
    <form action={enviar} className={cn("border-clay/30 bg-clay/5 rounded-card flex w-full min-w-[240px] flex-col gap-2 border p-3 text-left", className)}>
      <Ocultos valores={ocultos} />
      <span className="text-clay text-[12px] font-medium">{pregunta}</span>
      {detalle ? <span className="text-ink/60 text-[11.5px] leading-relaxed">{detalle}</span> : null}
      <input
        name="motivo"
        placeholder={motivoObligatorio ? "Motivo (obligatorio)" : "Motivo (opcional)"}
        required={motivoObligatorio}
        className="border-ink/14 bg-paper rounded-field border px-2 py-[6px] text-[12px]"
      />
      <Aviso>{estado?.error}</Aviso>
      <span className="flex gap-2">
        <button type="submit" disabled={enviando} className={cn(CLASE_BOTON, "bg-clay border-clay text-white hover:bg-clay/90 disabled:opacity-50")}>
          {enviando ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className={cn(CLASE_BOTON, "border-ink/14 text-ink/60 hover:text-ink")}>
          Cancelar
        </button>
      </span>
    </form>
  );
}

export function EditorRegistro({
  accion,
  ocultos,
  campos,
  titulo = "Corregir registro",
  etiqueta = "Editar",
  motivoObligatorio = false,
  className,
}: {
  accion: Accion;
  ocultos: Ocultos;
  campos: CampoEdicion[];
  titulo?: string;
  etiqueta?: string;
  motivoObligatorio?: boolean;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  // Se cierra al guardar bien; se hace aquí y no en un efecto para no
  // provocar un segundo render en cascada.
  const [estado, enviar, enviando] = useActionState<EstadoAccion, FormData>(async (previo, formData) => {
    const r = await accion(previo, formData);
    if (r?.ok) setAbierto(false);
    return r;
  }, null);

  if (!abierto) {
    return (
      <span className={cn("inline-flex flex-col items-start gap-1", className)}>
        <button type="button" onClick={() => setAbierto(true)} className={cn(CLASE_BOTON, "border-ink/14 text-ink/60 hover:border-gold hover:text-ink")}>
          <Pencil size={12} /> {etiqueta}
        </button>
        {estado?.ok ? <span className="text-sage text-[11px]">{estado.ok}</span> : null}
      </span>
    );
  }

  const error = (n: string) => estado?.campos?.[n];

  return (
    <form action={enviar} className={cn("border-gold/40 bg-gold/5 rounded-card flex w-full flex-col gap-3 border p-4 text-left", className)}>
      <Ocultos valores={ocultos} />
      <span className="flex items-center justify-between gap-2">
        <span className="text-gold-dark text-[10px] font-semibold tracking-[0.16em] uppercase">{titulo}</span>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-ink/40 hover:text-ink cursor-pointer"><X size={15} /></button>
      </span>
      <div className="grid gap-3 sm:grid-cols-2">
        {campos.map((c) => {
          const valor = c.valor === null || c.valor === undefined ? "" : String(c.valor);
          const comunes = { name: c.nombre, defaultValue: valor, required: c.requerido, error: error(c.nombre), ayuda: c.ayuda };
          const caja = c.ancho || c.tipo === "area" ? "sm:col-span-2" : undefined;
          if (c.tipo === "area") return <div key={c.nombre} className={caja}><Area etiqueta={c.etiqueta} {...comunes} /></div>;
          if (c.tipo === "seleccion") {
            return (
              <div key={c.nombre} className={caja}>
                <Selector etiqueta={c.etiqueta} {...comunes}>
                  {(c.opciones ?? []).map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                </Selector>
              </div>
            );
          }
          return (
            <div key={c.nombre} className={caja}>
              <Campo
                etiqueta={c.etiqueta}
                type={c.tipo === "numero" ? "number" : c.tipo === "fecha" ? "date" : "text"}
                step={c.tipo === "numero" ? "0.01" : undefined}
                min={c.tipo === "numero" ? 0 : undefined}
                {...comunes}
              />
            </div>
          );
        })}
        <div className="sm:col-span-2">
          <Campo etiqueta={motivoObligatorio ? "MOTIVO DE LA CORRECCIÓN" : "MOTIVO (OPCIONAL)"} name="motivo" required={motivoObligatorio} error={error("motivo")} placeholder="Queda en la auditoría" />
        </div>
      </div>
      <Aviso>{estado?.error}</Aviso>
      <span className="flex gap-2">
        <Boton type="submit" tamano="sm" disabled={enviando}>{enviando ? "GUARDANDO…" : "GUARDAR CORRECCIÓN"}</Boton>
        <Boton type="button" tamano="sm" variante="fantasma" onClick={() => setAbierto(false)}>CANCELAR</Boton>
      </span>
    </form>
  );
}
