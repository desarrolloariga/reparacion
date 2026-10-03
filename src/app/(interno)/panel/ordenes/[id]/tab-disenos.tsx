import { ExternalLink } from "lucide-react";

import { SubirFotos } from "@/components/fotos/subir-fotos";
import { Chip } from "@/components/ui/chip";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { eliminarDiseno } from "@/lib/acciones/disenos";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { fechaHora } from "@/lib/format";
import { esTerminal } from "@/lib/reparaciones/estados";

import { FormularioAprobarDiseno } from "./formulario-diseno";

export function TabDisenos({ datos, lectura }: { datos: OrdenCompleta; lectura: boolean }) {
  const { orden, disenos } = datos;
  const editable = !lectura && !esTerminal(orden.estado);
  const hayAprobado = disenos.some((d) => d.aprobado);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado titulo="Versiones de diseño">
          <span className={`text-[12px] ${hayAprobado ? "text-sage" : "text-gold-deep"}`}>
            {hayAprobado ? "Diseño aprobado" : "Falta aprobación del cliente"}
          </span>
        </TarjetaEncabezado>
        {disenos.length === 0 ? (
          <Vacio titulo="Sin diseños" descripcion="Sube el boceto o render que verá el cliente. La orden no se aprueba sin una versión aprobada." className="py-10" />
        ) : (
          <ul className="m-0 list-none divide-y divide-ink/6 p-0">
            {disenos.map((d) => (
              <li key={d.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <a href={`/api/archivos/diseno/${d.id}`} target="_blank" rel="noreferrer" className="rounded-card border-ink/10 bg-bone block size-[88px] shrink-0 overflow-hidden border">
                  {d.tipo_archivo?.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/archivos/diseno/${d.id}`} alt={`Diseño v${d.version}`} className="size-full object-cover" />
                  ) : (
                    <span className="text-ink/50 flex size-full items-center justify-center text-[11px]">PDF</span>
                  )}
                </a>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Versión {d.version}</span>
                    {d.aprobado ? <Chip tono="exito">Aprobado</Chip> : <Chip tono="tenue">Pendiente</Chip>}
                    <a href={`/api/archivos/diseno/${d.id}`} target="_blank" rel="noreferrer" className="text-ink/45 hover:text-gold-dark inline-flex items-center gap-1 text-[11px]"><ExternalLink size={11} /> abrir</a>
                  </span>
                  <span className="text-ink/45 text-[11px]">{d.nombre_archivo ?? ""} · {fechaHora(d.creado_en)}</span>
                  {d.descripcion ? <span className="text-[12.5px]">{d.descripcion}</span> : null}
                  {d.comentarios_cliente ? <span className="text-ink/60 text-[12px] italic">Cliente: {d.comentarios_cliente}</span> : null}
                  {editable ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {!d.aprobado ? <FormularioAprobarDiseno disenoId={d.id} version={d.version} /> : null}
                      {!d.aprobado ? (
                        <form action={eliminarDiseno}>
                          <input type="hidden" name="id" value={d.id} />
                          <button type="submit" className="text-ink/40 hover:text-clay cursor-pointer text-[11px] underline-offset-2 hover:underline">Eliminar</button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      {editable ? (
        <Tarjeta className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">NUEVA VERSIÓN</span>
            <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Subir diseño</h3>
          </div>
          <SubirFotos modo="diseno" ordenId={orden.id} max={1} />
          <p className="text-ink/45 m-0 text-[11px] leading-relaxed">Imagen o PDF. Cada subida crea una versión nueva; la aprobación del cliente se registra en la lista.</p>
        </Tarjeta>
      ) : null}
    </div>
  );
}
