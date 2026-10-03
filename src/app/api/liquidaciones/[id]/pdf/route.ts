import { NextResponse, type NextRequest } from "next/server";

import { sesionOpcional } from "@/lib/auth/guardas";
import { liquidacionPorId } from "@/lib/datos/liquidaciones";
import { fecha, moneda } from "@/lib/format";
import { cabecerasPdf, renderizarPdf } from "@/lib/pdf";
import { DocumentoLiquidacion } from "@/lib/pdf/liquidacion";
import { ETIQUETA_FORMA_PAGO, type FormaPago } from "@/lib/reparaciones/pagos";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionOpcional();
  if (!sesion || sesion.rol === "joyero") return new NextResponse("Sin permiso", { status: 403 });

  const { id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse("No encontrado", { status: 404 });

  const datos = await liquidacionPorId(id);
  if (!datos) return new NextResponse("No encontrado", { status: 404 });
  const { liquidacion, joyero, lineas } = datos;
  const { data: j } = await db().from("joyeros").select("documento").eq("id", joyero.id).maybeSingle();

  const pagos = lineas.filter((l) => !l.es_descuento).reduce((s, l) => s + Number(l.monto), 0);
  const descuentos = lineas.filter((l) => l.es_descuento).reduce((s, l) => s + Number(l.monto), 0);
  const f = (v: string | null) => (v ? fecha(v + "T12:00:00") : null);

  const pdf = await renderizarPdf(
    DocumentoLiquidacion({
      id: liquidacion.id,
      joyero: { nombre: joyero.nombre, telefono: joyero.telefono, documento: j?.documento ?? null },
      periodo: `${f(liquidacion.periodo_desde)} – ${f(liquidacion.periodo_hasta)}`,
      fechaPago: f(liquidacion.fecha_pago) ?? "Pendiente",
      formaPago: liquidacion.forma_pago ? ETIQUETA_FORMA_PAGO[liquidacion.forma_pago as FormaPago] : "—",
      referencia: liquidacion.referencia,
      lineas: lineas.map((l) => ({ concepto: l.concepto ?? `${l.numero} · ${l.descripcion_pieza}`, fecha: f(l.fecha_terminado_real), monto: moneda(Number(l.monto)), descuento: l.es_descuento })),
      subtotalPagos: moneda(pagos),
      subtotalDescuentos: moneda(descuentos),
      total: moneda(Number(liquidacion.total)),
      pagadaPor: datos.pagadaPor,
    }),
  );

  const descargar = request.nextUrl.searchParams.get("descargar") === "1";
  return new NextResponse(new Uint8Array(pdf), { headers: cabecerasPdf(`liquidacion-${liquidacion.id}.pdf`, descargar) });
}
