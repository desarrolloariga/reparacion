import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Aviso } from "@/components/ui/aviso";
import { Chip, ChipActivo } from "@/components/ui/chip";
import { FormularioAlternar } from "@/components/ui/formulario-alternar";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { alternarJoyero, desactivarTarifa } from "@/lib/acciones/joyeros";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { listarComplejidades, listarEspecialidades, listarTiposTrabajo } from "@/lib/datos/catalogos";
import { joyeroPorId } from "@/lib/datos/joyeros";
import { usuariosJoyeroDisponibles } from "@/lib/datos/usuarios";
import { fecha, moneda } from "@/lib/format";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";

import { FormularioJoyero } from "../formulario-joyero";
import { FormularioTarifa } from "./formulario-tarifa";

export const metadata: Metadata = { title: "Joyero" };

export default async function PaginaJoyero({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sesion = await requerirLectura();
  const { id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const joyero = await joyeroPorId(id);
  if (!joyero) notFound();

  const lectura = soloLectura(sesion);
  const [especialidades, cuentas, tipos, complejidades, q] = await Promise.all([
    listarEspecialidades(true),
    usuariosJoyeroDisponibles(joyero.id),
    listarTiposTrabajo({ soloActivos: true }),
    listarComplejidades(),
    searchParams,
  ]);

  const tarifasActivas = joyero.tarifas.filter((t) => t.activo);
  const historial = joyero.tarifas.filter((t) => !t.activo);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div className="flex flex-col gap-5">
        {q.creado === "1" ? <Aviso tono="ok">Joyero registrado. Ahora puedes agregar sus tarifas.</Aviso> : null}

        <Tarjeta className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">JOYERO</span>
              <h3 className="font-display m-0 text-[22px] leading-tight font-normal">{joyero.nombre}</h3>
            </div>
            <span className="flex items-center gap-2">
              <ChipActivo activo={joyero.activo} />
              {!lectura ? <FormularioAlternar id={joyero.id} activo={joyero.activo} accion={alternarJoyero} /> : null}
            </span>
          </div>

          {lectura ? (
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
              <dt className="text-ink/45">Teléfono</dt><dd className="m-0">{joyero.telefono ?? "—"}</dd>
              <dt className="text-ink/45">Correo</dt><dd className="m-0">{joyero.correo ?? "—"}</dd>
              <dt className="text-ink/45">Documento</dt><dd className="m-0">{joyero.documento ?? "—"}</dd>
              <dt className="text-ink/45">Capacidad</dt><dd className="m-0">{joyero.capacidad_maxima} órdenes simultáneas</dd>
              <dt className="text-ink/45">Especialidades</dt>
              <dd className="m-0 flex flex-wrap gap-1">{joyero.especialidades.map((e) => <Chip key={e.id}>{e.nombre}</Chip>)}</dd>
              <dt className="text-ink/45">Acceso</dt><dd className="m-0">{joyero.usuario?.correo ?? "Sin cuenta"}</dd>
              <dt className="text-ink/45">Notas</dt><dd className="m-0">{joyero.notas ?? "—"}</dd>
            </dl>
          ) : (
            <FormularioJoyero
              inicial={joyero}
              especialidades={especialidades.map((e) => ({ id: e.id, nombre: e.nombre }))}
              cuentas={cuentas}
            />
          )}
        </Tarjeta>
      </div>

      <div className="flex flex-col gap-5">
        <Tarjeta className="overflow-hidden">
          <TarjetaEncabezado titulo="Tarifas vigentes">
            <span className="text-ink/45 text-[12px]">{tarifasActivas.length} activas</span>
          </TarjetaEncabezado>
          {tarifasActivas.length === 0 ? (
            <Vacio
              titulo="Sin tarifas pactadas"
              descripcion="Al asignar una orden se propone el costo desde aquí. Sin tarifa, el costo se escribe a mano cada vez."
              className="py-8"
            />
          ) : (
            <Tabla minAncho={460}>
              <Thead>
                <Th>Trabajo</Th>
                <Th>Complejidad</Th>
                <Th className="text-right">Costo</Th>
                <Th>Desde</Th>
                {!lectura ? <Th className="text-right" /> : null}
              </Thead>
              <Tbody>
                {tarifasActivas.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-medium">{t.tipo_trabajo}</Td>
                    <Td>{t.complejidad ?? <span className="text-ink/45">Todas</span>}</Td>
                    <Td className="text-right tabular-nums">{moneda(Number(t.costo_acordado))}</Td>
                    <Td className="text-ink/55 tabular-nums">{fecha(t.vigente_desde + "T12:00:00")}</Td>
                    {!lectura ? (
                      <Td className="text-right">
                        <form action={desactivarTarifa} className="inline">
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="joyero_id" value={joyero.id} />
                          <button type="submit" className="border-ink/14 text-ink/55 hover:border-clay hover:text-clay rounded-field cursor-pointer border px-3 py-[6px] text-[11px] transition-colors">
                            Cerrar
                          </button>
                        </form>
                      </Td>
                    ) : null}
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          )}
        </Tarjeta>

        {!lectura ? (
          <Tarjeta className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">NUEVA TARIFA</span>
              <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Costo pactado</h3>
            </div>
            <FormularioTarifa
              joyeroId={joyero.id}
              tipos={tipos.map((t) => ({ id: t.id, nombre: t.nombre, categoria: t.categoria }))}
              complejidades={complejidades.map((c) => ({ id: c.id, nombre: c.nombre }))}
              hoy={hoyISO()}
            />
          </Tarjeta>
        ) : null}

        {historial.length > 0 ? (
          <Tarjeta className="overflow-hidden">
            <TarjetaEncabezado titulo="Historial de tarifas" />
            <Tabla minAncho={460}>
              <Thead>
                <Th>Trabajo</Th>
                <Th>Complejidad</Th>
                <Th className="text-right">Costo</Th>
                <Th>Desde</Th>
              </Thead>
              <Tbody>
                {historial.map((t) => (
                  <Tr key={t.id} className="text-ink/45">
                    <Td>{t.tipo_trabajo}</Td>
                    <Td>{t.complejidad ?? "Todas"}</Td>
                    <Td className="text-right tabular-nums">{moneda(Number(t.costo_acordado))}</Td>
                    <Td className="tabular-nums">{fecha(t.vigente_desde + "T12:00:00")}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Tabla>
          </Tarjeta>
        ) : null}
      </div>
    </div>
  );
}
