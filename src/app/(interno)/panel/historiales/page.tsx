import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Aviso } from "@/components/ui/aviso";
import { requerirAdmin } from "@/lib/auth/guardas";
import { listarJoyeros } from "@/lib/datos/joyeros";
import {
  ETIQUETA_MOVIMIENTO,
  listarMovimientos,
  POR_PAGINA_MOVIMIENTOS,
  registrosOriginales,
  resumenMovimientos,
  saldosClientes,
  saldosJoyeros,
  TIPOS_MOVIMIENTO,
  type FiltroMovimientos,
  type TipoMovimiento,
} from "@/lib/datos/movimientos";
import { listarUsuarios } from "@/lib/datos/usuarios";
import { moneda } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { CLAVES_PERIODO, ETIQUETA_PERIODO, leerRango } from "@/lib/reparaciones/periodos";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";
import { constructorDeEnlaces, leerTexto, paginar, type Parametros } from "@/lib/url";
import { cn } from "@/lib/utils";

import { ListaMovimientos } from "./lista-movimientos";
import { VistaSaldos } from "./vista-saldos";

export const metadata: Metadata = { title: "Historiales" };

/** Grupos de tipos que se pueden elegir en el filtro, además de cada tipo. */
const GRUPOS: Record<string, { etiqueta: string; tipos: TipoMovimiento[] }> = {
  todos: { etiqueta: "Todos los movimientos", tipos: [...TIPOS_MOVIMIENTO] },
  dinero: { etiqueta: "Solo dinero (ventas, cobros, costos, pagos)", tipos: ["venta", "cobro", "costo_joyero", "pago_joyero"] },
  operacion: { etiqueta: "Solo operación (recepciones, cotizaciones, estados)", tipos: ["recepcion", "cotizacion", "estado"] },
};

function leerTipos(valor: string): { clave: string; tipos: TipoMovimiento[] } {
  if (GRUPOS[valor]) return { clave: valor, tipos: GRUPOS[valor].tipos };
  if ((TIPOS_MOVIMIENTO as readonly string[]).includes(valor)) return { clave: valor, tipos: [valor as TipoMovimiento] };
  return { clave: "dinero", tipos: GRUPOS.dinero.tipos };
}

/**
 * Historiales: todos los movimientos del taller en un solo lugar, con
 * filtros, totales y la corrección (editar / eliminar) de cada registro.
 * Solo administración.
 */
export default async function PaginaHistoriales({ searchParams }: { searchParams: Promise<Parametros> }) {
  await requerirAdmin();
  const params = await searchParams;
  const vista = leerTexto(params, "vista") === "saldos" ? "saldos" : "movimientos";
  const rango = leerRango(params, hoyISO());
  const { clave: claveTipo, tipos } = leerTipos(leerTexto(params, "tipo"));
  const usuarioId = Number(leerTexto(params, "usuario")) || undefined;
  const joyeroId = Number(leerTexto(params, "joyero")) || undefined;
  const categoriaCruda = leerTexto(params, "categoria");
  const categoria = (CATEGORIAS as readonly string[]).includes(categoriaCruda) ? (categoriaCruda as CategoriaTrabajo) : undefined;
  const busqueda = leerTexto(params, "q");

  const filtro: FiltroMovimientos = { tipos, desde: rango.desde, hasta: rango.hasta, usuarioId, joyeroId, categoria, busqueda };
  const actuales = {
    vista: vista === "saldos" ? "saldos" : undefined,
    periodo: rango.clave === "personalizado" ? undefined : rango.clave,
    desde: rango.clave === "personalizado" ? rango.desde : undefined,
    hasta: rango.clave === "personalizado" ? rango.hasta : undefined,
    tipo: claveTipo,
    usuario: usuarioId,
    joyero: joyeroId,
    categoria,
    q: busqueda || undefined,
  };

  const [usuarios, joyeros] = await Promise.all([listarUsuarios(), listarJoyeros()]);
  const selectorClase = "border-ink/14 bg-paper rounded-field border px-3 py-[8px] text-[12.5px]";

  return (
    <div className="flex flex-col gap-5">
      {leerTexto(params, "eliminada") === "1" || leerTexto(params, "eliminado") === "1" ? <Aviso tono="ok">Registro eliminado. Queda una copia en Correcciones (auditoría).</Aviso> : null}

      {/* Vistas */}
      <nav className="border-ink/10 flex gap-1 border-b">
        {[
          { clave: "movimientos", etiqueta: "Movimientos", href: constructorDeEnlaces("/panel/historiales", { ...actuales, vista: undefined })({}) },
          { clave: "saldos", etiqueta: "Saldos", href: constructorDeEnlaces("/panel/historiales", { ...actuales, vista: "saldos" })({}) },
          { clave: "auditoria", etiqueta: "Correcciones (auditoría)", href: "/panel/auditoria" },
          { clave: "ingresos", etiqueta: "Ingresos por forma de pago", href: "/panel/ingresos" },
        ].map((t) => (
          <Link
            key={t.clave}
            href={t.href}
            className={cn("border-b-2 px-4 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors", vista === t.clave ? "border-gold text-ink" : "border-transparent text-ink/45 hover:text-ink")}
          >
            {t.etiqueta}
          </Link>
        ))}
      </nav>

      {/* Filtros */}
      <Tarjeta className="flex flex-col gap-3 px-5 py-4">
        {vista === "movimientos" ? (
          <span className="flex flex-wrap items-center gap-1">
            {CLAVES_PERIODO.map((c) => (
              <Link key={c} href={constructorDeEnlaces("/panel/historiales", { ...actuales, periodo: c, desde: undefined, hasta: undefined })({})} className={cn("rounded-field px-3 py-[6px] text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors", rango.clave === c ? "bg-ink text-gold-light" : "text-ink/55 hover:bg-ink/6")}>
                {ETIQUETA_PERIODO[c]}
              </Link>
            ))}
          </span>
        ) : null}
        <form method="get" className="flex flex-wrap items-end gap-3">
          {vista === "saldos" ? <input type="hidden" name="vista" value="saldos" /> : null}
          {vista === "movimientos" ? (
            <>
              <label className="flex flex-col gap-1 text-[10px] tracking-[0.12em] text-ink/50 uppercase">
                Tipo de movimiento
                <select name="tipo" defaultValue={claveTipo} className={selectorClase}>
                  {Object.entries(GRUPOS).map(([k, g]) => <option key={k} value={k}>{g.etiqueta}</option>)}
                  {TIPOS_MOVIMIENTO.map((t) => <option key={t} value={t}>{ETIQUETA_MOVIMIENTO[t]}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[10px] tracking-[0.12em] text-ink/50 uppercase">
                Vendedor / usuario
                <select name="usuario" defaultValue={usuarioId ?? ""} className={selectorClase}>
                  <option value="">Todos</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </label>
            </>
          ) : null}
          <label className="flex flex-col gap-1 text-[10px] tracking-[0.12em] text-ink/50 uppercase">
            Joyero
            <select name="joyero" defaultValue={joyeroId ?? ""} className={selectorClase}>
              <option value="">Todos</option>
              {joyeros.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] tracking-[0.12em] text-ink/50 uppercase">
            Tipo de orden
            <select name="categoria" defaultValue={categoria ?? ""} className={selectorClase}>
              <option value="">Reparación y creación</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{ETIQUETA_CATEGORIA[c]}</option>)}
            </select>
          </label>
          {vista === "movimientos" ? (
            <label className="flex flex-col gap-1 text-[10px] tracking-[0.12em] text-ink/50 uppercase">
              Rango
              <span className="flex items-center gap-1">
                <input type="date" name="desde" defaultValue={rango.desde} className={selectorClase} />
                <input type="date" name="hasta" defaultValue={rango.hasta} className={selectorClase} />
              </span>
            </label>
          ) : null}
          <label className="border-ink/14 bg-paper rounded-field flex items-center gap-2 border px-3 py-[8px]">
            <Search size={14} className="text-ink/40" />
            <input name="q" defaultValue={busqueda} placeholder="Orden, cliente, detalle, referencia" className="w-[200px] bg-transparent text-[12.5px] outline-none" />
          </label>
          <Boton type="submit" tamano="sm">FILTRAR</Boton>
          <Link href={vista === "saldos" ? "/panel/historiales?vista=saldos" : "/panel/historiales"} className="text-ink/45 hover:text-ink pb-2 text-[11px] underline-offset-2 hover:underline">Limpiar</Link>
        </form>
      </Tarjeta>

      {vista === "saldos" ? (
        <VistaSaldos clientes={await saldosClientes({ busqueda, categoria })} joyeros={await saldosJoyeros(joyeroId)} />
      ) : (
        <Movimientos filtro={filtro} params={params} actuales={actuales} />
      )}
    </div>
  );
}

async function Movimientos({ filtro, params, actuales }: { filtro: FiltroMovimientos; params: Parametros; actuales: Record<string, string | number | undefined> }) {
  const resumen = await resumenMovimientos(filtro);
  const total = Object.values(resumen).reduce((s, r) => s + r.cantidad, 0);
  const { pagina, paginas, porPagina } = paginar(params, total, POR_PAGINA_MOVIMIENTOS);
  const { filas } = await listarMovimientos(filtro, pagina, porPagina);
  const originales = await registrosOriginales(filas);
  const enlace = constructorDeEnlaces("/panel/historiales", { ...actuales, pagina, porPagina });
  const volverA = enlace({});

  const entradas = resumen.cobro.monto;
  const salidas = resumen.pago_joyero.monto;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {TIPOS_MOVIMIENTO.filter((t) => filtro.tipos.includes(t)).map((t) => (
          <Link key={t} href={constructorDeEnlaces("/panel/historiales", { ...actuales, tipo: t, pagina: undefined })({})} className="bg-paper border-ink/7 rounded-card hover:border-gold flex flex-col gap-1 border px-4 py-3 transition-colors">
            <span className="text-ink/45 text-[9px] font-medium tracking-[0.16em] uppercase">{ETIQUETA_MOVIMIENTO[t]}</span>
            <span className="font-display text-[22px] leading-none">{resumen[t].cantidad}</span>
            {["venta", "cobro", "costo_joyero", "pago_joyero", "cotizacion"].includes(t) ? <span className="text-gold-dark text-[11px] tabular-nums">{moneda(resumen[t].monto)}</span> : null}
          </Link>
        ))}
      </div>

      {filtro.tipos.includes("cobro") || filtro.tipos.includes("pago_joyero") ? (
        <Tarjeta className="flex flex-wrap gap-x-8 gap-y-2 px-5 py-3 text-[12.5px]">
          <span>Entró (cobros): <strong className="text-sage tabular-nums">{moneda(entradas)}</strong></span>
          <span>Salió (pagos a joyeros): <strong className="text-clay tabular-nums">{moneda(salidas)}</strong></span>
          <span>Neto de caja: <strong className="tabular-nums">{moneda(entradas - salidas)}</strong></span>
          <span className="text-ink/45">Ventas y costos son devengados (no movimiento de caja).</span>
        </Tarjeta>
      ) : null}

      <ListaMovimientos
        filas={filas}
        originales={originales}
        total={total}
        pagina={pagina}
        paginas={paginas}
        porPagina={porPagina}
        enlace={enlace}
        volverA={volverA}
      />
    </>
  );
}
