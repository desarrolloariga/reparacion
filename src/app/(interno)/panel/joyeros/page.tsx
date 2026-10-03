import type { Metadata } from "next";
import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import { Chip, ChipActivo } from "@/components/ui/chip";
import { Tabla, Tbody, Td, Th, Thead, Tr } from "@/components/ui/tabla";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirLectura, soloLectura } from "@/lib/auth/guardas";
import { listarJoyeros } from "@/lib/datos/joyeros";

export const metadata: Metadata = { title: "Joyeros" };

export default async function PaginaJoyeros() {
  const sesion = await requerirLectura();
  const joyeros = await listarJoyeros();
  const activos = joyeros.filter((j) => j.activo).length;
  const puedeEditar = !soloLectura(sesion);

  return (
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
  );
}
