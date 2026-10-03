import { NextResponse, type NextRequest } from "next/server";

import { sesionOpcional } from "@/lib/auth/guardas";
import { disenoPorId, fotoPorId } from "@/lib/datos/ordenes";
import { joyeroTieneOrden } from "@/lib/datos/acceso-joyero";
import { urlFirmada } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Sirve una fotografía o un diseño: valida la sesión y redirige a una URL
 * firmada de corta vida. Las rutas del bucket nunca llegan al navegador.
 *
 * Un joyero solo puede ver archivos de órdenes que tiene asignadas.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tipo: string; id: string }> },
) {
  const sesion = await sesionOpcional();
  if (!sesion) return new NextResponse("Sin sesión", { status: 401 });

  const { tipo, id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse("No encontrado", { status: 404 });

  let ruta: string | null = null;
  let ordenId: number | null = null;

  if (tipo === "foto") {
    const foto = await fotoPorId(id);
    ruta = foto?.ruta_storage ?? null;
    ordenId = foto?.orden_id ?? null;
  } else if (tipo === "diseno") {
    const diseno = await disenoPorId(id);
    ruta = diseno?.ruta_storage ?? null;
    ordenId = diseno?.orden_id ?? null;
  }

  if (!ruta || !ordenId) return new NextResponse("No encontrado", { status: 404 });

  if (sesion.rol === "joyero") {
    if (sesion.joyeroId === null) return new NextResponse("Sin permiso", { status: 403 });
    if (!(await joyeroTieneOrden(sesion.joyeroId, ordenId))) {
      return new NextResponse("Sin permiso", { status: 403 });
    }
  }

  const url = await urlFirmada(ruta, 120);
  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
