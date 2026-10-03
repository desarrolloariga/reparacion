import { NextResponse, type NextRequest } from "next/server";

import { autorizarCron } from "@/lib/cron";
import { enviarCorreosPendientes } from "@/lib/notificaciones";

export const runtime = "nodejs";

/** Vacía la cola de correo con el proveedor configurado (reintenta hasta 5 veces). */
export async function GET(request: NextRequest) {
  const rechazo = autorizarCron(request);
  if (rechazo) return rechazo;
  try {
    return NextResponse.json(await enviarCorreosPendientes(100));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
