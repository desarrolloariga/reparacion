import { SubirFotos } from "@/components/fotos/subir-fotos";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { eliminarFoto } from "@/lib/acciones/ordenes";
import type { OrdenCompleta } from "@/lib/datos/ordenes";
import { fechaHora } from "@/lib/format";
import { esTerminal } from "@/lib/reparaciones/estados";

const MOMENTOS = [
  { clave: "entrada", titulo: "Entrada", ayuda: "Cómo llegó la pieza." },
  { clave: "proceso", titulo: "Proceso", ayuda: "Avances durante el trabajo." },
  { clave: "salida", titulo: "Salida", ayuda: "Cómo se entrega. Obligatoria para entregar." },
] as const;

export function TabFotos({ datos, lectura }: { datos: OrdenCompleta; lectura: boolean }) {
  const { orden, fotos } = datos;
  const editable = !lectura && !esTerminal(orden.estado);

  return (
    <div className="flex flex-col gap-5">
      {MOMENTOS.map((m) => {
        const lista = fotos.filter((f) => f.momento === m.clave);
        return (
          <Tarjeta key={m.clave} className="overflow-hidden">
            <TarjetaEncabezado titulo={m.titulo}>
              <span className="text-ink/45 text-[12px]">{lista.length} {lista.length === 1 ? "foto" : "fotos"} · {m.ayuda}</span>
            </TarjetaEncabezado>
            <div className="flex flex-col gap-4 p-5">
              {lista.length > 0 ? (
                <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4 md:grid-cols-6">
                  {lista.map((f) => (
                    <li key={f.id} className="flex flex-col gap-1">
                      <a href={`/api/archivos/foto/${f.id}`} target="_blank" rel="noreferrer" className="rounded-card border-ink/10 bg-bone block aspect-square overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/archivos/foto/${f.id}`} alt={f.descripcion ?? `${m.titulo} ${f.id}`} loading="lazy" className="size-full object-cover" />
                      </a>
                      <span className="text-ink/45 truncate text-[10px]">{fechaHora(f.creado_en)}</span>
                      {editable ? (
                        <form action={eliminarFoto}>
                          <input type="hidden" name="id" value={f.id} />
                          <button type="submit" className="text-ink/40 hover:text-clay cursor-pointer text-[10px] underline-offset-2 hover:underline">Eliminar</button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink/40 text-[12px]">Sin fotografías de {m.titulo.toLowerCase()}.</span>
              )}
              {editable ? <SubirFotos modo="foto" ordenId={orden.id} momento={m.clave} /> : null}
            </div>
          </Tarjeta>
        );
      })}
    </div>
  );
}
