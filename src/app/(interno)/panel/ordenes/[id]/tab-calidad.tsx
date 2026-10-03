import Link from "next/link";

import { Aviso } from "@/components/ui/aviso";
import { Chip } from "@/components/ui/chip";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import type { AsignacionListada } from "@/lib/datos/asignaciones";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import type { ControlCalidad } from "@/lib/datos/taller";
import { fechaHora } from "@/lib/format";

import { FormularioCalidad, FormularioRecibir } from "./formulario-calidad";

export function TabCalidad({
  datos,
  controles,
  asignaciones,
  lectura,
  fotosSalida,
}: {
  datos: OrdenCompleta;
  controles: ControlCalidad[];
  asignaciones: AsignacionListada[];
  lectura: boolean;
  fotosSalida: number;
}) {
  const { orden } = datos;
  const terminada = asignaciones.find((a) => a.estado === "terminada");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Control de calidad">
          <span className="text-ink/45 text-[12px]">{controles.length} revisiones</span>
        </TarjetaEncabezado>
        {controles.length === 0 ? (
          <Vacio titulo="Sin revisiones todavía" descripcion="Cuando el joyero termine y el taller reciba la pieza, se revisa aquí." className="py-10" />
        ) : (
          <ul className="m-0 list-none divide-y divide-ink/6 p-0">
            {controles.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 px-5 py-4">
                <span className="flex flex-wrap items-center gap-2">
                  <Chip tono={c.resultado === "aprobado" ? "exito" : "error"}>{c.resultado === "aprobado" ? "Aprobado" : "Rechazado"}</Chip>
                  <span className="text-ink/45 text-[11.5px]">{fechaHora(c.creado_en)} · {c.revisor ?? "—"}</span>
                </span>
                {c.observaciones ? <p className="m-0 text-[12.5px]">{c.observaciones}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      {!lectura ? (
        <div className="flex flex-col gap-4">
          {orden.estado === "terminada_joyero" ? (
            <Tarjeta className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">PASO 1</span>
                <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Recibir la pieza</h3>
              </div>
              <p className="text-ink/60 m-0 text-[12.5px] leading-relaxed">{terminada?.joyero ?? "El joyero"} marcó el trabajo como terminado. Al recibir la pieza físicamente pasa a control de calidad.</p>
              <FormularioRecibir ordenId={orden.id} />
            </Tarjeta>
          ) : null}

          {orden.estado === "en_control_calidad" ? (
            <Tarjeta className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">PASO 2</span>
                <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Resultado de la revisión</h3>
              </div>
              {fotosSalida === 0 ? (
                <Aviso tono="aviso">
                  Aún no hay fotografía de salida: la entrega la exige. Súbela en <Link href={`/panel/ordenes/${orden.id}?tab=fotos`} className="underline">Fotografías → Salida</Link>.
                </Aviso>
              ) : null}
              <FormularioCalidad ordenId={orden.id} joyero={terminada?.joyero ?? "el joyero"} />
            </Tarjeta>
          ) : null}

          {orden.estado !== "terminada_joyero" && orden.estado !== "en_control_calidad" ? (
            <p className="text-ink/45 m-0 px-1 text-[11.5px] leading-relaxed">
              La revisión se habilita cuando el joyero marque el trabajo como terminado.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
