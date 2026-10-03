import { NextResponse, type NextRequest } from "next/server";

import { autorizarCron } from "@/lib/cron";
import { eliminarArchivos, temporalesViejos } from "@/lib/storage";

export const runtime = "nodejs";

/** Semanal: borra fotos subidas al asistente de recepción que nunca se convirtieron en orden. */
export async function GET(request: NextRequest) {
  const rechazo = autorizarCron(request);
  if (rechazo) return rechazo;

  try {
    const viejos = await temporalesViejos(24);
    await eliminarArchivos(viejos);
    return NextResponse.json({ eliminados: viejos.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
