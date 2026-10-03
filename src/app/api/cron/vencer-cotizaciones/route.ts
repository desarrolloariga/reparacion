import { NextResponse, type NextRequest } from "next/server";

import { autorizarCron } from "@/lib/cron";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Diario (06:00 UTC = 00:00 Guatemala): marca vencidas las cotizaciones enviadas cuya validez pasó. */
export async function GET(request: NextRequest) {
  const rechazo = autorizarCron(request);
  if (rechazo) return rechazo;

  const { data, error } = await db().rpc("fn_vencer_cotizaciones");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vencidas: data ?? 0 });
}
