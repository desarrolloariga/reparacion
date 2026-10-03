import type { Metadata } from "next";
import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import { Chip, ChipActivo } from "@/components/ui/chip";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { listarJoyeros } from "@/lib/datos/joyeros";
import { desempenoJoyeros } from "@/lib/datos/taller";
import { moneda } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { leerTexto, type Parametros } from "@/lib/url";

export const metadata: Metadata = { title: "Joyeros" };

export default async function PaginaJoyeros({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sesion = await requerirLectura();
  const params = await searchParams;
  const hoy = hoyISO();
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(leerTexto(params, "desde")) ? leerTexto(params, "desde") : `${hoy.slice(0, 7)}-01`;
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(leerTexto(params, "hasta")) ? leerTexto(params, "hasta") : hoy;
  const [joyeros, desempeno] = await Promise.all([listarJoyeros(), desempenoJoyeros(desde, hasta)]);
  const activos = joyeros.filter((j) => j.activo).length;
  const puedeEditar = !soloLectura(sesion);
  const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(0)} %`);

  return (
    <div className="flex flex-col gap-5">
    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo="Desempeño por joyero">
        <form method="get" className="flex items-center gap-2 text-[11px]">
          <span className="text-ink/45">Período</span>
          <input type="date" name="desde" defaultValue={desde} className="border-ink/14 bg-paper rounded-field border px-2 py-[6px] text-[12px]" />
          <span className="text-ink/45">a</span>
          <input type="date" name="hasta" defaultValue={hasta} className="border-ink/14 bg-paper rounded-field border px-2 py-[6px] text-[12px]" />
          <Boton type="submit" tamano="sm" variante="contorno">VER</Boton>
        </form>
      </TarjetaEncabezado>
      <Tabla minAncho={980}>
        <Thead>
          <Th>Joyero</Th>
          <Th className="text-right">Asignados</Th>
          <Th className="text-right">En proceso</Th>
          <Th className="text-right">Terminados</Th>
          <Th className="text-right">Atrasados</Th>
          <Th className="text-right">Días resp.</Th>
          <Th className="text-right">Cumplimiento</Th>
          <Th className="text-right">Retrabajo</Th>
          <Th className="text-right">Costo período</Th>
          <Th className="text-right">Pendiente pago</Th>
        </Thead>
        <Tbody>
          {desempeno.map((d) => (
            <Tr key={d.joyero_id} className={d.activo ? undefined : "text-ink/40"}>
              <Td><Link href={`/panel/joyeros/${d.joyero_id}`} className="hover:text-gold-dark font-medium">{d.joyero}</Link></Td>
              <Td className="text-right tabular-nums">{d.asignados}</Td>
              <Td className="text-right tabular-nums">{d.en_proceso}</Td>
              <Td className="text-right tabular-nums">{d.terminados}</Td>
              <Td className={`text-right tabular-nums ${d.atrasados > 0 ? "text-clay font-semibold" : ""}`}>{d.atrasados}</Td>
              <Td className="text-right tabular-nums">{d.dias_promedio_respuesta ?? "—"}</Td>
              <Td className="text-right tabular-nums">{pct(d.cumplimiento_pct)}</Td>
              <Td className={`text-right tabular-nums ${(d.retrabajo_pct ?? 0) > 0 ? "text-clay" : ""}`}>{pct(d.retrabajo_pct)}</Td>
              <Td className="text-right tabular-nums">{moneda(d.costo_total)}</Td>
              <Td className="text-right tabular-nums">{d.pendiente_pago > 0 ? moneda(d.pendiente_pago) : "—"}</Td>
            </Tr>
          ))}
        </Tbody>
      </Tabla>
    </Tarjeta>

    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo="Joyeros">
        <span className="flex items-center gap-4">
          <span className="text-ink/45 text-[12px]">{activos} activos</span>
          {puedeEditar ? (
            <Link href="/panel/joyeros/nuevo">
              <Boton tamano="sm">NUEVO JOYERO</Boton>
            </Link>
          ) : null}
        </span>
      </TarjetaEncabezado>

      {joyeros.length === 0 ? (
        <Vacio
          titulo="Todavía no hay joyeros"
          descripcion="Registra a los contratistas que hacen el trabajo físico: con sus especialidades, su capacidad y las tarifas pactadas."
          accion={puedeEditar ? <Link href="/panel/joyeros/nuevo"><Boton>REGISTRAR EL PRIMERO</Boton></Link> : undefined}
        />
      ) : (
        <Tabla minAncho={760}>
          <Thead>
            <Th>Joyero</Th>
            <Th>Especialidades</Th>
            <Th className="text-right">Capacidad</Th>
            <Th className="text-right">Tarifas</Th>
            <Th>Acceso</Th>
            <Th>Estado</Th>
          </Thead>
          <Tbody>
            {joyeros.map((j) => (
              <Tr key={j.id}>
                <Td>
                  <Link href={`/panel/joyeros/${j.id}`} className={`hover:text-gold-dark block font-medium ${j.activo ? "" : "text-ink/40"}`}>
                    {j.nombre}
                  </Link>
                  <span className="text-ink/45 block text-[11.5px]">{[j.telefono, j.correo].filter(Boolean).join(" · ") || "Sin contacto"}</span>
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {j.especialidades.length === 0 ? <span className="text-ink/30">—</span> : j.especialidades.map((e) => <Chip key={e.id}>{e.nombre}</Chip>)}
                  </span>
                </Td>
                <Td className="text-right tabular-nums">{j.capacidad_maxima}</Td>
                <Td className="text-right tabular-nums">{j.tarifas_activas}</Td>
                <Td className="text-ink/55 text-[11.5px]">{j.usuario ? j.usuario.correo : "Sin cuenta"}</Td>
                <Td><ChipActivo activo={j.activo} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Tabla>
      )}
    </Tarjeta>
    </div>
  );
}
