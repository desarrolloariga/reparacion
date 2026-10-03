"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo, Casilla, Rotulo, Selector } from "@/components/ui/campo";
import { crearGarantia } from "@/lib/acciones/entrega";
import type { EstadoAccion } from "@/lib/validacion";

type Linea = { clave: string; tipo_trabajo_id: number | ""; complejidad_id: number | ""; descripcion: string };

/**
 * Garantía: orden nueva ligada a la original. Sin cobro, precio 0 y nace
 * aprobada (lista para asignar); con cobro, sigue el flujo de cotización.
 * El joyero responsable recibe el descuento en su liquidación (Fase 4).
 */
export function FormularioGarantia({
  ordenOrigenId,
  descripcion,
  joyeros,
  joyeroSugerido,
  tipos,
  complejidades,
  lineasIniciales,
}: {
  ordenOrigenId: number;
  descripcion: string;
  joyeros: { id: number; nombre: string }[];
  joyeroSugerido: number | null;
  tipos: { id: number; nombre: string }[];
  complejidades: { id: number; nombre: string }[];
  lineasIniciales: { tipo_trabajo_id: number; complejidad_id: number; descripcion: string }[];
}) {
  const [lineas, setLineas] = useState<Linea[]>(() =>
    (lineasIniciales.length ? lineasIniciales : [{ tipo_trabajo_id: "" as const, complejidad_id: "" as const, descripcion: "" }]).map((l, i) => ({ ...l, clave: `g${i}` })),
  );
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(crearGarantia, null);
  const completas = lineas.filter((l) => l.tipo_trabajo_id !== "" && l.complejidad_id !== "");

  const actualizar = (clave: string, c: Partial<Linea>) => setLineas((s) => s.map((l) => (l.clave === clave ? { ...l, ...c } : l)));

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="orden_origen_id" value={ordenOrigenId} />
      <input type="hidden" name="lineas" value={JSON.stringify(completas.map(({ clave: _c, ...l }) => { void _c; return l; }))} />

      <Casilla name="cobra_garantia" etiqueta="Se le cobra al cliente" ayuda="Si no, la orden nace aprobada con precio 0 y su utilidad será negativa: la garantía tiene un costo y alguien lo paga." />

      <Selector etiqueta="JOYERO RESPONSABLE" name="joyero_responsable_id" defaultValue={joyeroSugerido ?? ""} ayuda="A quien se le descuenta el retrabajo en su liquidación (según el parámetro).">
        <option value="">Sin responsable</option>
        {joyeros.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
      </Selector>

      <Campo etiqueta="PIEZA" name="descripcion_pieza" defaultValue={descripcion} />
      <Area etiqueta="QUÉ RECLAMA EL CLIENTE" name="observaciones" placeholder="Se volvió a soltar la piedra…" required />

      <div className="flex flex-col gap-2">
        <Rotulo>TRABAJOS DE LA GARANTÍA</Rotulo>
        {lineas.map((l) => (
          <div key={l.clave} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
            <select value={l.tipo_trabajo_id} onChange={(e) => actualizar(l.clave, { tipo_trabajo_id: e.target.value ? Number(e.target.value) : "" })} className="border-ink/14 bg-paper rounded-field border px-3 py-[9px] text-sm">
              <option value="">Trabajo</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <select value={l.complejidad_id} onChange={(e) => actualizar(l.clave, { complejidad_id: e.target.value ? Number(e.target.value) : "" })} className="border-ink/14 bg-paper rounded-field border px-3 py-[9px] text-sm">
              <option value="">Compl.</option>
              {complejidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button type="button" disabled={lineas.length === 1} onClick={() => setLineas((s) => s.filter((x) => x.clave !== l.clave))} className="text-ink/40 hover:text-clay cursor-pointer disabled:opacity-30" aria-label="Quitar"><Trash2 size={15} /></button>
          </div>
        ))}
        <button type="button" onClick={() => setLineas((s) => [...s, { clave: `g${Date.now()}`, tipo_trabajo_id: "", complejidad_id: "", descripcion: "" }])} className="text-gold-dark hover:text-ink flex cursor-pointer items-center gap-2 self-start text-[12px] font-medium">
          <Plus size={14} /> Agregar trabajo
        </button>
      </div>

      <Aviso>{estado?.error}</Aviso>
      <Boton type="submit" disabled={enviando || completas.length === 0} className="py-[14px]">{enviando ? "ABRIENDO…" : "ABRIR GARANTÍA"}</Boton>
    </form>
  );
}
