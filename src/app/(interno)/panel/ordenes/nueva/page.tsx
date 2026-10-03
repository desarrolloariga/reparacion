import type { Metadata } from "next";

import { requerirTaller } from "@/lib/auth/guardas";
import { calendarioVigente, listarExcepciones } from "@/lib/datos/calendario";
import { listarComplejidades, listarTiposTrabajo, matrizTiempos } from "@/lib/datos/catalogos";
import { clientePorId } from "@/lib/datos/clientes";
import { leerParametros } from "@/lib/datos/parametros";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";

import { Asistente } from "./asistente";

export const metadata: Metadata = { title: "Nueva recepción" };

export default async function PaginaNuevaRecepcion({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirTaller();
  const params = await searchParams;
  const clienteId = Number(params.cliente);

  const [tipos, complejidades, matriz, parametros, excepciones, clienteInicial] = await Promise.all([
    listarTiposTrabajo({ soloActivos: true }),
    listarComplejidades(),
    matrizTiempos(),
    leerParametros(),
    listarExcepciones(),
    Number.isInteger(clienteId) && clienteId > 0 ? clientePorId(clienteId) : Promise.resolve(null),
  ]);
  // Garantiza que el calendario sea construible (lanza si no hay días hábiles).
  await calendarioVigente();

  return (
    <Asistente
      tipos={tipos.map((t) => ({ id: t.id, nombre: t.nombre, categoria: t.categoria }))}
      complejidades={complejidades.map((c) => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion }))}
      matriz={Object.fromEntries(matriz)}
      parametros={{ holgura_cliente_dias: parametros.holgura_cliente_dias, dias_semana_habiles: parametros.dias_semana_habiles }}
      excepciones={excepciones.map((e) => ({ fecha: e.fecha, es_habil: e.es_habil }))}
      hoy={hoyISO()}
      clienteInicial={clienteInicial ? { id: clienteInicial.id, nombre: clienteInicial.nombre, telefono: clienteInicial.telefono } : null}
    />
  );
}
