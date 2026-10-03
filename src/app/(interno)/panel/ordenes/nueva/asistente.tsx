"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Check, Plus, Search, Trash2, UserPlus } from "lucide-react";

import { SubirFotos } from "@/components/fotos/subir-fotos";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo, Rotulo, Selector } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { buscarClientesAccion, crearClienteRapido } from "@/lib/acciones/clientes";
import { crearOrden } from "@/lib/acciones/ordenes";
import { fecha as formatearFecha } from "@/lib/format";
import { crearCalendario, type DiaSemanaISO } from "@/lib/reparaciones/dias-habiles";
import { claveCombinacion, diasPorLinea, FaltaTiempoEstandar, fechasDeOrden } from "@/lib/reparaciones/tiempos";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";
import { cn } from "@/lib/utils";
import type { EstadoAccion } from "@/lib/validacion";

type Tipo = { id: number; nombre: string; categoria: CategoriaTrabajo };
type Complejidad = { id: number; nombre: string; descripcion: string | null };
type ClienteMin = { id: number; nombre: string; telefono: string | null };
type Linea = { clave: string; tipo_trabajo_id: number | ""; complejidad_id: number | ""; descripcion: string };

/**
 * Recepción en tres pasos: cliente → pieza y fotos → trabajos. Los tiempos
 * y las fechas se calculan en vivo con los mismos módulos puros que usa el
 * servidor; el servidor los vuelve a calcular al guardar.
 *
 * Es un solo <form>: los pasos se ocultan, no se desmontan, así que todos
 * los campos viajan juntos al crear la orden.
 */
export function Asistente({
  tipos,
  complejidades,
  matriz,
  parametros,
  excepciones,
  hoy,
  clienteInicial,
}: {
  tipos: Tipo[];
  complejidades: Complejidad[];
  matriz: Record<string, number>;
  parametros: { holgura_cliente_dias: number; dias_semana_habiles: DiaSemanaISO[] };
  excepciones: { fecha: string; es_habil: boolean }[];
  hoy: string;
  clienteInicial: ClienteMin | null;
}) {
  const [paso, setPaso] = useState<1 | 2 | 3>(clienteInicial ? 2 : 1);
  const [cliente, setCliente] = useState<ClienteMin | null>(clienteInicial);
  const [tipo, setTipo] = useState<CategoriaTrabajo>("reparacion");
  const [lineas, setLineas] = useState<Linea[]>([{ clave: "l1", tipo_trabajo_id: "", complejidad_id: "", descripcion: "" }]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [fechaRecepcion, setFechaRecepcion] = useState(hoy);
  const [prometidaManual, setPrometidaManual] = useState("");
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(crearOrden, null);

  const calendario = useMemo(
    () => crearCalendario(parametros.dias_semana_habiles, excepciones),
    [parametros.dias_semana_habiles, excepciones],
  );
  const mapaMatriz = useMemo(() => new Map(Object.entries(matriz)), [matriz]);
  const nombreTipo = useMemo(() => new Map(tipos.map((t) => [t.id, t.nombre])), [tipos]);
  const nombreComp = useMemo(() => new Map(complejidades.map((c) => [c.id, c.nombre])), [complejidades]);

  const lineasCompletas = lineas.filter((l) => l.tipo_trabajo_id !== "" && l.complejidad_id !== "") as (Linea & { tipo_trabajo_id: number; complejidad_id: number })[];

  const calculo = useMemo(() => {
    if (lineasCompletas.length === 0) return null;
    try {
      const dias = diasPorLinea(lineasCompletas, mapaMatriz, (c) => `${nombreTipo.get(c.tipo_trabajo_id)} · ${nombreComp.get(c.complejidad_id)}`);
      const total = dias.reduce((s, d) => s + d, 0);
      const fechas = fechasDeOrden(fechaRecepcion, total, parametros, calendario);
      return { ok: true as const, dias, total, ...fechas };
    } catch (e) {
      if (e instanceof FaltaTiempoEstandar) return { ok: false as const, error: e.message };
      return { ok: false as const, error: (e as Error).message };
    }
  }, [lineasCompletas, mapaMatriz, fechaRecepcion, parametros, calendario, nombreTipo, nombreComp]);

  useEffect(() => {
    if (estado?.error) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estado]);

  const tiposDelTipo = tipos.filter((t) => t.categoria === tipo);
  const puedeAvanzar1 = Boolean(cliente);
  const puedeCrear = Boolean(cliente) && calculo?.ok === true && lineasCompletas.length === lineas.length && lineas.length > 0;

  function actualizarLinea(clave: string, cambios: Partial<Linea>) {
    setLineas((s) => s.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)));
  }

  return (
    <form action={accion} className="mx-auto flex w-full max-w-[900px] flex-col gap-5">
      <input type="hidden" name="cliente_id" value={cliente?.id ?? ""} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="lineas" value={JSON.stringify(lineasCompletas.map((l) => ({ tipo_trabajo_id: l.tipo_trabajo_id, complejidad_id: l.complejidad_id, descripcion: l.descripcion })))} />
      <input type="hidden" name="fotos" value={JSON.stringify(fotos)} />
      <input type="hidden" name="fecha_prometida_manual" value={prometidaManual} />

      <Pasos actual={paso} />

      <Aviso>{estado?.error}</Aviso>

      {/* Paso 1: cliente */}
      <Tarjeta className={cn("flex flex-col gap-5 p-6", paso !== 1 && "hidden")}>
        <Titulo eyebrow="PASO 1 DE 3" titulo="¿De quién es la pieza?" />
        <SelectorCliente cliente={cliente} onElegir={setCliente} />
        <div className="flex justify-end">
          <Boton type="button" disabled={!puedeAvanzar1} onClick={() => setPaso(2)}>CONTINUAR</Boton>
        </div>
      </Tarjeta>

      {/* Paso 2: pieza y fotos */}
      <Tarjeta className={cn("flex flex-col gap-5 p-6", paso !== 2 && "hidden")}>
        <Titulo eyebrow="PASO 2 DE 3" titulo="La pieza" />
        <div className="flex flex-col gap-2">
          <Rotulo>TIPO DE ORDEN</Rotulo>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setTipo(c); setLineas([{ clave: `l${Date.now()}`, tipo_trabajo_id: "", complejidad_id: "", descripcion: "" }]); }}
                className={cn(
                  "rounded-card cursor-pointer border px-4 py-3 text-left transition-colors",
                  tipo === c ? "border-gold bg-gold/8" : "border-ink/12 hover:border-gold/60",
                )}
              >
                <span className="block text-[13px] font-medium">{ETIQUETA_CATEGORIA[c]}</span>
                <span className="text-ink/45 block text-[11px]">{c === "reparacion" ? "Arreglar una pieza del cliente" : "Fabricar una pieza por encargo"}</span>
              </button>
            ))}
          </div>
        </div>
        <Campo etiqueta="DESCRIPCIÓN DE LA PIEZA" name="descripcion_pieza" placeholder="Anillo de compromiso, oro amarillo, con diamante central" error={estado?.campos?.descripcion_pieza} required />
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="MATERIAL" name="material" placeholder="Oro amarillo" />
          <Campo etiqueta="QUILATAJE" name="quilataje" placeholder="14k" />
          <Campo etiqueta="PESO DE ENTRADA (g)" name="peso_entrada_g" type="number" step="0.001" min={0} inputMode="decimal" placeholder="0.000" error={estado?.campos?.peso_entrada_g} />
        </div>
        <Campo etiqueta="PIEDRAS" name="piedras" placeholder="1 diamante ~0.5 ct, 6 zafiros pequeños" />
        <Area etiqueta="OBSERVACIONES DE RECEPCIÓN" name="observaciones_recepcion" placeholder="Estado en que llega: rayones, piedras flojas, grabados…" />
        <Campo etiqueta="FECHA DE RECEPCIÓN" name="fecha_recepcion" type="date" value={fechaRecepcion} onChange={(e) => setFechaRecepcion(e.target.value)} max={hoy} required />
        <div className="flex flex-col gap-2">
          <Rotulo>FOTOGRAFÍAS DE ENTRADA</Rotulo>
          <SubirFotos modo="tmp" onCambio={setFotos} />
          <span className="text-ink/40 text-[11px]">Evidencia del estado en que llega la pieza. Se reducen antes de subir.</span>
        </div>
        <div className="flex justify-between">
          <Boton type="button" variante="fantasma" onClick={() => setPaso(1)}>ATRÁS</Boton>
          <Boton type="button" onClick={() => setPaso(3)}>CONTINUAR</Boton>
        </div>
      </Tarjeta>

      {/* Paso 3: trabajos */}
      <Tarjeta className={cn("flex flex-col gap-5 p-6", paso !== 3 && "hidden")}>
        <Titulo eyebrow="PASO 3 DE 3" titulo="Trabajos a realizar" />
        <div className="flex flex-col gap-3">
          {lineas.map((l, i) => (
            <div key={l.clave} className="border-ink/8 rounded-card grid gap-3 border p-3 sm:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto] sm:items-end">
              <Selector etiqueta={`TRABAJO ${i + 1}`} value={l.tipo_trabajo_id} onChange={(e) => actualizarLinea(l.clave, { tipo_trabajo_id: e.target.value ? Number(e.target.value) : "" })}>
                <option value="">Elige un trabajo</option>
                {tiposDelTipo.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </Selector>
              <Selector etiqueta="COMPLEJIDAD" value={l.complejidad_id} onChange={(e) => actualizarLinea(l.clave, { complejidad_id: e.target.value ? Number(e.target.value) : "" })}>
                <option value="">Elige</option>
                {complejidades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Selector>
              <Campo etiqueta="DETALLE" value={l.descripcion} onChange={(e) => actualizarLinea(l.clave, { descripcion: e.target.value })} placeholder="De talla 6 a 7" />
              <div className="flex items-center gap-3 pb-[2px]">
                <span className="text-ink/55 min-w-[52px] text-[12px] tabular-nums">
                  {l.tipo_trabajo_id !== "" && l.complejidad_id !== ""
                    ? mapaMatriz.has(claveCombinacion(l.tipo_trabajo_id, l.complejidad_id))
                      ? `${mapaMatriz.get(claveCombinacion(l.tipo_trabajo_id, l.complejidad_id))} días`
                      : <span className="text-clay">sin tiempo</span>
                    : ""}
                </span>
                <button type="button" onClick={() => setLineas((s) => (s.length > 1 ? s.filter((x) => x.clave !== l.clave) : s))} aria-label="Quitar trabajo" className="text-ink/40 hover:text-clay cursor-pointer" disabled={lineas.length === 1}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setLineas((s) => [...s, { clave: `l${Date.now()}`, tipo_trabajo_id: "", complejidad_id: "", descripcion: "" }])} className="text-gold-dark hover:text-ink flex cursor-pointer items-center gap-2 self-start text-[12px] font-medium">
            <Plus size={14} /> Agregar otro trabajo
          </button>
        </div>

        <div className="border-gold/30 bg-gold/6 rounded-card flex flex-col gap-3 border p-4">
          <span className="text-gold-dark text-[9px] font-medium tracking-[0.2em]">TIEMPO Y FECHAS (CALCULADO EN VIVO)</span>
          {calculo === null ? (
            <span className="text-ink/50 text-[12.5px]">Completa al menos un trabajo con su complejidad.</span>
          ) : calculo.ok ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Dato etiqueta="Días hábiles estimados" valor={`${calculo.total}`} nota="suma de los trabajos" />
              <Dato etiqueta="Entrega estimada" valor={formatearFecha(calculo.fecha_estimada_entrega + "T12:00:00")} nota="trabajo del joyero" />
              <Dato etiqueta="Prometida al cliente" valor={formatearFecha((prometidaManual || calculo.fecha_prometida_cliente) + "T12:00:00")} nota={prometidaManual ? "fijada a mano" : `+${parametros.holgura_cliente_dias} de holgura`} />
            </div>
          ) : (
            <Aviso>{calculo.error}</Aviso>
          )}
          {calculo?.ok ? (
            <label className="flex flex-wrap items-center gap-3 text-[12px]">
              <span className="text-ink/55">Ajustar la fecha prometida:</span>
              <input type="date" value={prometidaManual} min={calculo.fecha_estimada_entrega} onChange={(e) => setPrometidaManual(e.target.value)} className="border-ink/14 bg-paper rounded-field border px-2 py-[6px] text-[12px]" />
              {prometidaManual ? (
                <button type="button" onClick={() => setPrometidaManual("")} className="text-ink/45 hover:text-ink cursor-pointer underline-offset-2 hover:underline">usar la calculada</button>
              ) : null}
            </label>
          ) : null}
        </div>

        <Aviso>{estado?.campos?.lineas ? estado.error : null}</Aviso>

        <div className="flex justify-between">
          <Boton type="button" variante="fantasma" onClick={() => setPaso(2)}>ATRÁS</Boton>
          <Boton type="submit" disabled={!puedeCrear || enviando}>{enviando ? "CREANDO ORDEN…" : "CREAR ORDEN"}</Boton>
        </div>
      </Tarjeta>
    </form>
  );
}

function Pasos({ actual }: { actual: 1 | 2 | 3 }) {
  const pasos = ["Cliente", "Pieza y fotos", "Trabajos"];
  return (
    <ol className="m-0 flex list-none gap-2 p-0">
      {pasos.map((p, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        return (
          <li key={p} className={cn("flex flex-1 items-center gap-2 border-b-2 pb-2 text-[11px] font-medium tracking-[0.1em] uppercase", n === actual ? "border-gold text-ink" : n < actual ? "border-sage text-sage" : "border-ink/10 text-ink/35")}>
            <span className={cn("flex size-5 items-center justify-center rounded-full border text-[10px]", n === actual ? "border-gold bg-gold text-ink" : n < actual ? "border-sage bg-sage text-white" : "border-ink/20")}>
              {n < actual ? <Check size={11} /> : n}
            </span>
            <span className="hidden sm:inline">{p}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Titulo({ eyebrow, titulo }: { eyebrow: string; titulo: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">{eyebrow}</span>
      <h3 className="font-display m-0 text-[22px] leading-tight font-normal">{titulo}</h3>
    </div>
  );
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-ink/45 text-[10px] tracking-[0.12em] uppercase">{etiqueta}</span>
      <span className="font-display text-[22px] leading-none">{valor}</span>
      {nota ? <span className="text-ink/45 text-[11px]">{nota}</span> : null}
    </div>
  );
}

function SelectorCliente({ cliente, onElegir }: { cliente: ClienteMin | null; onElegir: (c: ClienteMin | null) => void }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ClienteMin[]>([]);
  const [buscando, iniciarBusqueda] = useTransition();
  const [modoAlta, setModoAlta] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", telefono: "", correo: "" });
  const [errorAlta, setErrorAlta] = useState<string | null>(null);
  const [creando, iniciarAlta] = useTransition();

  const buscable = texto.trim().length >= 2;
  const visibles = buscable ? resultados : [];

  useEffect(() => {
    if (!buscable) return;
    const t = setTimeout(() => {
      iniciarBusqueda(async () => {
        const r = await buscarClientesAccion(texto);
        setResultados(r);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [texto, buscable]);

  if (cliente) {
    return (
      <div className="border-gold/40 bg-gold/6 rounded-card flex items-center justify-between gap-3 border px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[14px] font-medium">{cliente.nombre}</span>
          <span className="text-ink/50 text-[12px]">{cliente.telefono ?? "Sin teléfono"}</span>
        </div>
        <button type="button" onClick={() => onElegir(null)} className="text-ink/50 hover:text-ink cursor-pointer text-[11px] underline-offset-2 hover:underline">Cambiar</button>
      </div>
    );
  }

  if (modoAlta) {
    return (
      <div className="flex flex-col gap-4">
        <Campo etiqueta="NOMBRE" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Nombre y apellidos" autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="TELÉFONO" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} placeholder="5512 3456" />
          <Campo etiqueta="CORREO (OPCIONAL)" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} />
        </div>
        <Aviso>{errorAlta}</Aviso>
        <div className="flex gap-3">
          <Boton
            type="button"
            disabled={creando || nuevo.nombre.trim().length < 2}
            onClick={() =>
              iniciarAlta(async () => {
                setErrorAlta(null);
                const r = await crearClienteRapido(nuevo);
                if (r.ok) onElegir(r.cliente);
                else setErrorAlta(r.error);
              })
            }
          >
            {creando ? "CREANDO…" : "CREAR Y SELECCIONAR"}
          </Boton>
          <Boton type="button" variante="fantasma" onClick={() => setModoAlta(false)}>CANCELAR</Boton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="border-ink/14 bg-paper rounded-field focus-within:border-gold flex items-center gap-2 border px-3 py-3">
        <Search size={16} className="text-ink/40" />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre o teléfono" className="w-full bg-transparent text-[14px] outline-none" autoFocus />
      </label>
      {buscando ? <span className="text-ink/45 text-[12px]">Buscando…</span> : null}
      {visibles.length > 0 ? (
        <ul className="border-ink/8 rounded-card m-0 list-none divide-y divide-ink/6 border p-0">
          {visibles.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onElegir(c)} className="hover:bg-gold/6 flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left">
                <span className="text-[13.5px] font-medium">{c.nombre}</span>
                <span className="text-ink/50 text-[12px]">{c.telefono ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : buscable && !buscando ? (
        <span className="text-ink/45 text-[12px]">No hay clientes que coincidan.</span>
      ) : null}
      <button type="button" onClick={() => { setModoAlta(true); setNuevo({ nombre: texto, telefono: "", correo: "" }); }} className="text-gold-dark hover:text-ink flex cursor-pointer items-center gap-2 self-start text-[12px] font-medium">
        <UserPlus size={14} /> Cliente nuevo
      </button>
    </div>
  );
}
