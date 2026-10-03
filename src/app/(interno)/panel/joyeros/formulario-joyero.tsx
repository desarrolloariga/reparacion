"use client";

import { useActionState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Area, Campo, Casilla, Rotulo, Selector } from "@/components/ui/campo";
import { crearJoyero, editarJoyero } from "@/lib/acciones/joyeros";
import type { Joyero } from "@/lib/supabase/modelo";
import type { EstadoAccion } from "@/lib/validacion";

type Inicial = Joyero & { especialidades: { id: number; nombre: string }[] };

export function FormularioJoyero({
  inicial,
  especialidades,
  cuentas,
}: {
  inicial: Inicial | null;
  especialidades: { id: number; nombre: string }[];
  cuentas: { id: number; nombre: string; correo: string }[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoAccion, FormData>(
    inicial ? editarJoyero : crearJoyero,
    null,
  );
  const campo = (n: string) => estado?.campos?.[n];
  const marcadas = new Set(inicial?.especialidades.map((e) => e.id) ?? []);

  return (
    <form action={accion} className="flex flex-col gap-4">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      <Campo etiqueta="NOMBRE" name="nombre" defaultValue={inicial?.nombre ?? ""} placeholder="Nombre y apellidos" error={campo("nombre")} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="TELÉFONO" name="telefono" defaultValue={inicial?.telefono ?? ""} placeholder="5512 3456" error={campo("telefono")} />
        <Campo etiqueta="DOCUMENTO (DPI/NIT)" name="documento" defaultValue={inicial?.documento ?? ""} error={campo("documento")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="CORREO" name="correo" type="email" defaultValue={inicial?.correo ?? ""} placeholder="joyero@correo.com" error={campo("correo")} />
        <Campo
          etiqueta="CAPACIDAD MÁXIMA"
          name="capacidad_maxima"
          type="number"
          min={1}
          max={100}
          defaultValue={inicial?.capacidad_maxima ?? 5}
          ayuda="Órdenes simultáneas antes de advertir."
          error={campo("capacidad_maxima")}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Rotulo>ESPECIALIDADES</Rotulo>
        {especialidades.length === 0 ? (
          <span className="text-ink/40 text-[12px]">No hay especialidades activas en el catálogo.</span>
        ) : (
          <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {especialidades.map((e) => (
              <Casilla key={e.id} name="especialidades" value={e.id} defaultChecked={marcadas.has(e.id)} etiqueta={e.nombre} />
            ))}
          </div>
        )}
      </div>

      <Selector
        etiqueta="CUENTA DE ACCESO"
        name="usuario_id"
        defaultValue={inicial?.usuario_id ?? ""}
        ayuda="Una cuenta con rol joyero, para que vea sus trabajos desde el celular."
        error={campo("usuario_id")}
      >
        <option value="">Sin acceso al sistema</option>
        {cuentas.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre} · {c.correo}</option>
        ))}
      </Selector>

      <Area etiqueta="NOTAS (OPCIONAL)" name="notas" defaultValue={inicial?.notas ?? ""} placeholder="Horarios, forma de pago, observaciones…" error={campo("notas")} />

      <Aviso>{estado?.error}</Aviso>
      <Aviso tono="ok">{estado?.ok}</Aviso>

      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "GUARDANDO…" : inicial ? "GUARDAR CAMBIOS" : "REGISTRAR JOYERO"}
      </Boton>
    </form>
  );
}
