import { NextResponse, type NextRequest } from "next/server";

import { sesionOpcional } from "@/lib/auth/guardas";
import { cotizacionPorId } from "@/lib/datos/cotizaciones";
import { ordenPorId } from "@/lib/datos/ordenes";
import { fecha, moneda } from "@/lib/format";
import { cabecerasPdf, renderizarPdf } from "@/lib/pdf";
import { DocumentoCotizacion } from "@/lib/pdf/cotizacion";
import { estadoEfectivo, ETIQUETA_COTIZACION } from "@/lib/reparaciones/cotizaciones";
import { hoyISO } from "@/lib/reparaciones/dias-habiles";
import { claveCombinacion } from "@/lib/reparaciones/tiempos";
import { matrizTiempos } from "@/lib/datos/catalogos";

export const runtime = "nodejs";

/** Cotización para el cliente: precio al cliente y total; nunca el costo del joyero. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionOpcional();
  if (!sesion || sesion.rol === "joyero") return new NextResponse("Sin permiso", { status: 403 });

  const { id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse("No encontrado", { status: 404 });

  const cot = await cotizacionPorId(id);
  if (!cot) return new NextResponse("No encontrado", { status: 404 });
  const [datos, matriz] = await Promise.all([ordenPorId(cot.cotizacion.orden_id), matrizTiempos()]);
  if (!datos) return new NextResponse("No encontrado", { status: 404 });

  const { cotizacion, lineas } = cot;
  const dias = lineas.reduce((s, l) => s + (matriz.get(claveCombinacion(l.tipo_trabajo_id, l.complejidad_id)) ?? 0), 0);

  const pdf = await renderizarPdf(
    DocumentoCotizacion({
      numero: datos.orden.numero,
      version: cotizacion.version,
      tipo: datos.orden.tipo,
      fechaEmision: fecha(cotizacion.enviada_en ?? cotizacion.creado_en),
      validoHasta: cotizacion.valido_hasta ? fecha(cotizacion.valido_hasta + "T12:00:00") : null,
      cliente: { nombre: datos.cliente.nombre, telefono: datos.cliente.telefono },
      pieza: datos.orden.descripcion_pieza,
      lineas: lineas.map((l) => ({
        nombre: l.tipo_trabajo,
        complejidad: l.complejidad,
        detalle: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: moneda(Number(l.precio_unitario)),
        subtotal: moneda(Number(l.precio_unitario) * l.cantidad),
      })),
      total: moneda(Number(cotizacion.total_cliente)),
      diasEstimados: dias,
      notas: cotizacion.notas,
      estado: ETIQUETA_COTIZACION[estadoEfectivo(cotizacion, hoyISO())],
    }),
  );

  const descargar = request.nextUrl.searchParams.get("descargar") === "1";
  return new NextResponse(new Uint8Array(pdf), {
    headers: cabecerasPdf(`cotizacion-${datos.orden.numero}-v${cotizacion.version}.pdf`, descargar),
  });
}
