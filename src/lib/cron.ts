import { NextResponse, type NextRequest } from "next/server";

/**
 * Los jobs programados no tienen cookie: Vercel Cron manda
 * `Authorization: Bearer <CRON_SECRET>`. Sin secreto configurado, los
 * endpoints quedan cerrados (nunca abiertos por defecto).
 */
export function autorizarCron(request: NextRequest): NextResponse | null {
  const secreto = process.env.CRON_SECRET;
  const cabecera = request.headers.get("authorization") ?? "";
  if (!secreto || cabecera !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  return null;
}
