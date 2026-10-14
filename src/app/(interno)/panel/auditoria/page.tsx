import type { Metadata } from "next";

import { Chip } from "@/components/ui/chip";
import { Tarjeta, TarjetaEncabezado } from "@/components/ui/tarjeta";
import { Vacio } from "@/components/ui/vacio";
import { requerirAdmin } from "@/lib/auth/guardas";
import { listarAuditoria } from "@/lib/datos/auditoria";
import { fechaHora } from "@/lib/format";

export const metadata: Metadata = { title: "Auditoría" };

const ENTIDAD: Record<string, string> = {
  orden: "Orden",
  pago: "Pago",
  asignacion: "Asignación",
  historial: "Historial",
  cliente: "Cliente",
  liquidacion: "Liquidación",
};

/** Qué campos cambiaron entre el antes y el después de una edición. */
function diferencias(antes: unknown, despues: unknown): { campo: string; de: string; a: string }[] {
  if (!antes || !despues || typeof antes !== "object" || typeof despues !== "object") return [];
  const a = antes as Record<string, unknown>;
  const d = despues as Record<string, unknown>;
  const ignorar = new Set(["actualizado_en", "creado_en"]);
  return Object.keys(d)
    .filter((k) => !ignorar.has(k) && JSON.stringify(a[k]) !== JSON.stringify(d[k]))
    .map((k) => ({ campo: k, de: a[k] === null || a[k] === undefined ? "—" : String(a[k]), a: d[k] === null || d[k] === undefined ? "—" : String(d[k]) }));
}

export default async function PaginaAuditoria() {
  await requerirAdmin();
  const registros = await listarAuditoria(300);

  return (
    <Tarjeta className="overflow-hidden">
      <TarjetaEncabezado titulo="Correcciones del administrador">
        <span className="text-ink/45 text-[12px]">últimos {registros.length}</span>
      </TarjetaEncabezado>
      {registros.length === 0 ? (
        <Vacio titulo="Sin correcciones" descripcion="Cada edición o eliminación hecha por el administrador queda aquí con el antes, el después y el motivo." className="py-10" />
      ) : (
        <ul className="m-0 list-none divide-y divide-ink/6 p-0">
          {registros.map((r) => {
            const cambios = r.accion === "editar" ? diferencias(r.antes, r.despues) : [];
            return (
              <li key={r.id} className="flex flex-col gap-2 px-5 py-4">
                <span className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  <Chip tono={r.accion === "eliminar" ? "error" : "oro"}>{r.accion === "eliminar" ? "Eliminó" : "Editó"}</Chip>
                  <span className="font-medium">{ENTIDAD[r.entidad] ?? r.entidad}</span>
                  {r.referencia ? <span className="font-mono text-[12px]">{r.referencia}</span> : null}
                  <span className="text-ink/45">· {r.usuario ?? "—"} · {fechaHora(r.creado_en)}</span>
                </span>
                {r.motivo ? <span className="text-[12.5px]">Motivo: {r.motivo}</span> : null}
                {cambios.length > 0 ? (
                  <ul className="m-0 flex list-none flex-col gap-[2px] p-0 text-[11.5px]">
                    {cambios.map((c) => (
                      <li key={c.campo} className="text-ink/70">
                        <span className="font-mono">{c.campo}</span>: <span className="text-clay line-through">{c.de}</span> → <span className="text-sage">{c.a}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.accion === "eliminar" ? (
                  <details className="text-[11px]">
                    <summary className="text-ink/45 cursor-pointer">Ver copia de lo eliminado</summary>
                    <pre className="bg-bone rounded-card mt-2 max-h-[260px] overflow-auto p-3 text-[10.5px] leading-snug">{JSON.stringify(r.antes, null, 2)}</pre>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
