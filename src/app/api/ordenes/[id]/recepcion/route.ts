import { NextResponse, type NextRequest } from "next/server";

import { sesionOpcional } from "@/lib/auth/guardas";
import { ordenPorId } from "@/lib/datos/ordenes";
import { fecha } from "@/lib/format";
import { cabecerasPdf, imagenParaPdf, renderizarPdf } from "@/lib/pdf";
import { DocumentoRecepcion } from "@/lib/pdf/recepcion";
import { urlFirmada } from "@/lib/storage";

export const runtime = "nodejs";

/** Comprobante de recepción en PDF, con hasta cuatro fotos de entrada. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionOpcional();
  if (!sesion || sesion.rol === "joyero") return new NextResponse("Sin permiso", { status: 403 });

  const { id: idCrudo } = await params;
  const id = Number(idCrudo);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse("No encontrado", { status: 404 });

  const datos = await ordenPorId(id);
  if (!datos) return new NextResponse("No encontrado", { status: 404 });
  const { orden, cliente, lineas, fotos, historial } = datos;

  const entrada = fotos.filter((f) => f.momento === "entrada").slice(0, 4);
  const imagenes: Buffer[] = [];
  for (const f of entrada) {
    try {
      const r = await fetch(await urlFirmada(f.ruta_storage, 60));
      if (r.ok) {
        const jpg = await imagenParaPdf(await r.arrayBuffer());
        if (jpg) imagenes.push(jpg);
      }
    } catch {
      /* sin esa foto */
    }
  }

  const recepcion = historial.find((h) => h.estado_anterior === null);
  const f = (v: string | null) => (v ? fecha(v + "T12:00:00") : null);

  const pdf = await renderizarPdf(
    DocumentoRecepcion({
      numero: orden.numero,
      tipo: orden.tipo,
      fechaRecepcion: fecha(orden.fecha_recepcion + "T12:00:00"),
      cliente: { nombre: cliente.nombre, telefono: cliente.telefono, correo: cliente.correo },
      pieza: {
        descripcion: orden.descripcion_pieza,
        material: orden.material,
        quilataje: orden.quilataje,
        pesoEntrada: orden.peso_entrada_g === null ? null : String(orden.peso_entrada_g),
        piedras: orden.piedras,
        observaciones: orden.observaciones_recepcion,
      },
      trabajos: lineas.map((l) => ({ nombre: l.tipo_trabajo, complejidad: l.complejidad, detalle: l.descripcion, cantidad: l.cantidad, dias: l.dias_estimados })),
      diasEstimados: orden.dias_estimados ?? 0,
      fechaEstimada: f(orden.fecha_estimada_entrega),
      fechaPrometida: f(orden.fecha_prometida_cliente),
      recibidoPor: recepcion?.usuario ?? "ARIGA",
      fotos: imagenes,
    }),
  );

  const descargar = request.nextUrl.searchParams.get("descargar") === "1";
  return new NextResponse(new Uint8Array(pdf), { headers: cabecerasPdf(`recepcion-${orden.numero}.pdf`, descargar) });
}
