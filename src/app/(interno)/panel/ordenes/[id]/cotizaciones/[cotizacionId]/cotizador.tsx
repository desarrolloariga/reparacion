"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { aprobarCotizacion, enviarCotizacion, guardarCotizacion, rechazarCotizacion } from "@/lib/acciones/cotizaciones";
import { moneda } from "@/lib/format";
import { calcularTotales, margenBajo, UMBRAL_MARGEN, type EstadoCotizacion } from "@/lib/reparaciones/cotizaciones";
import type { EstadoOrden } from "@/lib/reparaciones/estados";
import { claveCombinacion } from "@/lib/reparaciones/tiempos";
import { ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";
import { cn } from "@/lib/utils";
import type { EstadoAccion } from "@/lib/validacion";

type Linea = {
  clave: string;
  tipo_trabajo_id: number | "";
  complejidad_id: number | "";
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  costo_joyero: number;
};

type LineaEntrada = Omit<Linea, "clave">;

/**
 * Cotizador: líneas con precio al cliente y costo del joyero, totales y
 * margen en vivo. El margen se ve antes de enviar: ese es el punto —no
 * aceptar trabajos que no dejan—. Bajo el umbral se pinta en rojo; no
 * bloquea.
 */
export function Cotizador({
  cotizacion,
  orden,
  lineasIniciales,
  tipos,
  complejidades,
  matriz,
  vigenciaDias,
  editable,
  decidible,
}: {
  cotizacion: { id: number; version: number; estado: EstadoCotizacion; notas: string | null; motivo_rechazo: string | null };
  orden: { id: number; tipo: CategoriaTrabajo; estado: EstadoOrden; hayDisenoAprobado: boolean };
  lineasIniciales: LineaEntrada[];
  tipos: { id: number; nombre: string; categoria: CategoriaTrabajo }[];
  complejidades: { id: number; nombre: string }[];
  matriz: Record<string, number>;
  vigenciaDias: number;
  editable: boolean;
  decidible: boolean;
}) {
  const [lineas, setLineas] = useState<Linea[]>(() => {
    const vacia: LineaEntrada = { tipo_trabajo_id: "", complejidad_id: "", descripcion: "", cantidad: 1, precio_unitario: 0, costo_joyero: 0 };
    const base: LineaEntrada[] = lineasIniciales.length > 0 ? lineasIniciales : [vacia];
    return base.map((l, i) => ({ ...l, clave: `l${i}` }));
  });
  const [notas, setNotas] = useState(cotizacion.notas ?? "");
  const [guardado, guardar, guardando] = useActionState<EstadoAccion, FormData>(guardarCotizacion, null);
  const [enviado, enviar, enviando] = useActionState<EstadoAccion, FormData>(enviarCotizacion, null);
  const [aprobado, aprobar, aprobando] = useActionState<EstadoAccion, FormData>(aprobarCotizacion, null);
  const [rechazado, rechazar, rechazando] = useActionState<EstadoAccion, FormData>(rechazarCotizacion, null);

  const totales = useMemo(() => calcularTotales(lineas), [lineas]);
  const bajo = margenBajo(totales.margen_estimado);
  const completas = lineas.every((l) => l.tipo_trabajo_id !== "" && l.complejidad_id !== "");
  const lineasJSON = JSON.stringify(lineas.filter((l) => l.tipo_trabajo_id !== "" && l.complejidad_id !== "").map(({ clave: _c, ...l }) => { void _c; return l; }));
  const diasTotales = lineas.reduce((s, l) => s + (l.tipo_trabajo_id !== "" && l.complejidad_id !== "" ? (matriz[claveCombinacion(l.tipo_trabajo_id, l.complejidad_id)] ?? 0) : 0), 0);
  const faltanTiempos = lineas.some((l) => l.tipo_trabajo_id !== "" && l.complejidad_id !== "" && matriz[claveCombinacion(l.tipo_trabajo_id, l.complejidad_id)] === undefined);
  const tiposDelTipo = tipos.filter((t) => t.categoria === orden.tipo);

  function actualizar(clave: string, cambios: Partial<Linea>) {
    setLineas((s) => s.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)));
  }

  const numero = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <Tarjeta className="overflow-hidden">
        <div className="border-ink/7 flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-display m-0 text-lg leading-none font-normal">Líneas · {ETIQUETA_CATEGORIA[orden.tipo]}</h3>
          <span className="text-ink/45 text-[12px]">{diasTotales} días hábiles estimados</span>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {lineas.map((l, i) => {
            const dias = l.tipo_trabajo_id !== "" && l.complejidad_id !== "" ? matriz[claveCombinacion(l.tipo_trabajo_id, l.complejidad_id)] : undefined;
            return (
              <div key={l.clave} className="border-ink/8 rounded-card grid gap-3 border p-3 lg:grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1fr)_70px_110px_110px_auto] lg:items-end">
                <label className="flex flex-col gap-[7px]">
                  <span className="tracking-field text-ink/50 text-[10px] leading-none font-medium">TRABAJO {i + 1}</span>
                  <select disabled={!editable} value={l.tipo_trabajo_id} onChange={(e) => actualizar(l.clave, { tipo_trabajo_id: e.target.value ? Number(e.target.value) : "" })} className="border-ink/14 bg-paper rounded-field border px-3 py-[10px] text-sm disabled:bg-ink/3">
                    <option value="">Elige</option>
                    {tiposDelTipo.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-[7px]">
                  <span className="tracking-field text-ink/50 text-[10px] leading-none font-medium">COMPLEJIDAD</span>
                  <select disabled={!editable} value={l.complejidad_id} onChange={(e) => actualizar(l.clave, { complejidad_id: e.target.value ? Number(e.target.value) : "" })} className="border-ink/14 bg-paper rounded-field border px-3 py-[10px] text-sm disabled:bg-ink/3">
                    <option value="">Elige</option>
                    {complejidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </label>
                <Campo etiqueta="DETALLE" value={l.descripcion} disabled={!editable} onChange={(e) => actualizar(l.clave, { descripcion: e.target.value })} placeholder="Lo que verá el cliente" />
                <Campo etiqueta="CANT." type="number" min={1} max={99} value={l.cantidad} disabled={!editable} onChange={(e) => actualizar(l.clave, { cantidad: Math.max(1, Math.round(numero(e.target.value))) })} />
                <Campo etiqueta="PRECIO (Q)" type="number" min={0} step="0.01" inputMode="decimal" value={l.precio_unitario} disabled={!editable} onChange={(e) => actualizar(l.clave, { precio_unitario: numero(e.target.value) })} />
                <Campo etiqueta="COSTO JOYERO" type="number" min={0} step="0.01" inputMode="decimal" value={l.costo_joyero} disabled={!editable} onChange={(e) => actualizar(l.clave, { costo_joyero: numero(e.target.value) })} />
                <div className="flex items-center gap-3 pb-[10px] text-[11px]">
                  <span className={cn("min-w-[44px] tabular-nums", dias === undefined && l.tipo_trabajo_id !== "" && l.complejidad_id !== "" ? "text-clay" : "text-ink/50")}>
                    {l.tipo_trabajo_id === "" || l.complejidad_id === "" ? "" : dias === undefined ? "sin tiempo" : `${dias} d`}
                  </span>
                  {editable ? (
                    <button type="button" disabled={lineas.length === 1} onClick={() => setLineas((s) => s.filter((x) => x.clave !== l.clave))} aria-label="Quitar línea" className="text-ink/40 hover:text-clay cursor-pointer disabled:opacity-30"><Trash2 size={15} /></button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {editable ? (
            <button type="button" onClick={() => setLineas((s) => [...s, { clave: `l${Date.now()}`, tipo_trabajo_id: "", complejidad_id: "", descripcion: "", cantidad: 1, precio_unitario: 0, costo_joyero: 0 }])} className="text-gold-dark hover:text-ink flex cursor-pointer items-center gap-2 self-start text-[12px] font-medium">
              <Plus size={14} /> Agregar línea
            </button>
          ) : null}

          <Area etiqueta="NOTAS PARA EL CLIENTE (OPCIONAL)" value={notas} disabled={!editable} onChange={(e) => setNotas(e.target.value)} placeholder="Condiciones, qué incluye, qué no…" />
          {cotizacion.motivo_rechazo ? <Aviso>Rechazada: {cotizacion.motivo_rechazo}</Aviso> : null}
        </div>
      </Tarjeta>

      <div className="flex flex-col gap-4">
        <Tarjeta className="flex flex-col gap-4 p-5">
          <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">RESUMEN</span>
          <dl className="m-0 flex flex-col gap-3 text-[13px]">
            <div className="flex items-baseline justify-between"><dt className="text-ink/50">Precio al cliente</dt><dd className="font-display m-0 text-[24px] leading-none tabular-nums">{moneda(totales.total_cliente)}</dd></div>
            <div className="flex items-baseline justify-between"><dt className="text-ink/50">Costo de joyero</dt><dd className="m-0 tabular-nums">{moneda(totales.total_costo_joyero)}</dd></div>
            <div className="flex items-baseline justify-between"><dt className="text-ink/50">Utilidad estimada</dt><dd className={cn("m-0 font-medium tabular-nums", totales.utilidad_estimada < 0 && "text-clay")}>{moneda(totales.utilidad_estimada)}</dd></div>
            <div className={cn("rounded-field flex items-center justify-between px-3 py-2", bajo ? "bg-clay/10 text-clay" : "bg-sage/10 text-sage")}>
              <dt className="flex items-center gap-2 text-[12px] font-medium">{bajo ? <AlertTriangle size={14} /> : null} Margen</dt>
              <dd className="font-display m-0 text-[22px] leading-none tabular-nums">{totales.margen_estimado === null ? "—" : `${totales.margen_estimado.toFixed(1)} %`}</dd>
            </div>
          </dl>
          {bajo ? <p className="text-clay m-0 text-[11.5px] leading-relaxed">Por debajo del {UMBRAL_MARGEN} %. Revisa el precio o el costo antes de enviar; no se bloquea.</p> : null}
          {faltanTiempos ? <p className="text-clay m-0 text-[11.5px] leading-relaxed">Alguna línea no tiene tiempo estándar: la aprobación se bloqueará hasta definirlo en Catálogos.</p> : null}
        </Tarjeta>

        {editable ? (
          <Tarjeta className="flex flex-col gap-3 p-5">
            <form action={guardar} className="flex flex-col gap-3">
              <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
              <input type="hidden" name="lineas" value={lineasJSON} />
              <input type="hidden" name="notas" value={notas} />
              <Aviso>{guardado?.error}</Aviso>
              <Aviso tono="ok">{guardado?.ok}</Aviso>
              <Boton type="submit" variante="contorno" disabled={guardando || !completas} className="py-[13px]">{guardando ? "GUARDANDO…" : "GUARDAR BORRADOR"}</Boton>
            </form>
            <form action={enviar} className="flex flex-col gap-3">
              <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
              <input type="hidden" name="lineas" value={lineasJSON} />
              <input type="hidden" name="notas" value={notas} />
              <Aviso>{enviado?.error}</Aviso>
              <Boton type="submit" disabled={enviando || !completas || totales.total_cliente <= 0} className="py-[13px]">{enviando ? "ENVIANDO…" : "GUARDAR Y ENVIAR AL CLIENTE"}</Boton>
              <span className="text-ink/45 text-[11px] leading-relaxed">Queda vigente {vigenciaDias} días. La orden pasa a «cotizada».</span>
            </form>
          </Tarjeta>
        ) : null}

        {decidible ? (
          <Tarjeta className="flex flex-col gap-4 p-5">
            <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">RESPUESTA DEL CLIENTE</span>
            {orden.tipo === "creacion" && !orden.hayDisenoAprobado ? (
              <Aviso tono="aviso">Esta creación aún no tiene un diseño aprobado: la aprobación se bloqueará hasta marcarlo en la pestaña Diseños.</Aviso>
            ) : null}
            <form action={aprobar} className="flex flex-col gap-3">
              <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
              <Campo etiqueta="QUIÉN APRUEBA" name="aprobada_por_nombre" placeholder="Nombre de quien aprobó" error={aprobado?.campos?.aprobada_por_nombre} required />
              <Aviso>{aprobado?.error}</Aviso>
              <Boton type="submit" disabled={aprobando} className="py-[13px]">{aprobando ? "APROBANDO…" : "APROBAR COTIZACIÓN"}</Boton>
              <span className="text-ink/45 text-[11px] leading-relaxed">Copia las líneas a la orden, fija el precio y recalcula las fechas desde hoy. Sin redigitar nada.</span>
            </form>
            <form action={rechazar} className="border-ink/8 flex flex-col gap-3 border-t pt-4">
              <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
              <Campo etiqueta="MOTIVO DEL RECHAZO (OPCIONAL)" name="motivo" placeholder="Muy caro, lo pensará…" />
              <Aviso>{rechazado?.error}</Aviso>
              <Boton type="submit" variante="contorno" disabled={rechazando} className="text-clay border-clay/40 hover:border-clay py-[13px]">{rechazando ? "…" : "RECHAZAR"}</Boton>
            </form>
          </Tarjeta>
        ) : null}
      </div>
    </div>
  );
}
