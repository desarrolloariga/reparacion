import { NextResponse, type NextRequest } from "next/server";

import { autorizarCron } from "@/lib/cron";
import { alertasActivas } from "@/lib/datos/alertas";
import { notificar } from "@/lib/notificaciones";
import { envoltorio, lista, parrafo } from "@/lib/notificaciones/plantillas";
import { describirRestantes } from "@/lib/reparaciones/semaforo";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Diario (07:00 Guatemala): resumen de alertas al taller y aviso a cada
 * joyero con trabajos vencidos o por vencer.
 */
export async function GET(request: NextRequest) {
  const rechazo = autorizarCron(request);
  if (rechazo) return rechazo;

  const alertas = await alertasActivas();
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Taller: resumen en plataforma + correo a quienes tengan dirección.
  if (alertas.total > 0) {
    const { data: taller } = await db().from("usuarios").select("id, correo").eq("activo", true).in("rol", ["admin", "taller"]);
    const correos = (taller ?? []).map((u) => u.correo).filter((c) => /\S+@\S+\.\S+/.test(c));
    const linea = (o: (typeof alertas.joyero.vencidas)[number]) => `${o.numero} · ${o.cliente} · ${o.descripcion_pieza} · ${describirRestantes(o.evaluacion.dias ?? 0)}`;
    const html = envoltorio(
      `Alertas del taller: ${alertas.total}`,
      parrafo(`Mora del joyero — vencidas: ${alertas.joyero.vencidas.length}, por vencer: ${alertas.joyero.porVencer.length}.`) +
        lista([...alertas.joyero.vencidas, ...alertas.joyero.porVencer].map(linea)) +
        parrafo(`Mora frente al cliente — vencidas: ${alertas.cliente.vencidas.length}, por vencer: ${alertas.cliente.porVencer.length}.`) +
        lista([...alertas.cliente.vencidas, ...alertas.cliente.porVencer].map(linea)) +
        parrafo(`Tablero: ${sitio}/panel/alertas`),
    );
    await notificar({
      tipo: "resumen_alertas",
      titulo: `${alertas.total} órdenes vencidas o por vencer`,
      cuerpo: `Joyero: ${alertas.joyero.vencidas.length} vencidas, ${alertas.joyero.porVencer.length} por vencer · Cliente: ${alertas.cliente.vencidas.length} vencidas, ${alertas.cliente.porVencer.length} por vencer`,
      enlace: "/panel/alertas",
      roles: ["admin", "taller"],
      correo: correos.length ? { para: correos, asunto: `ARIGA · ${alertas.total} alertas del taller`, html } : undefined,
    });
  }

  // Joyeros: solo lo suyo.
  const porJoyero = new Map<number, (typeof alertas.joyero.vencidas)[number][]>();
  for (const o of [...alertas.joyero.vencidas, ...alertas.joyero.porVencer]) {
    if (!o.joyero_id) continue;
    porJoyero.set(o.joyero_id, [...(porJoyero.get(o.joyero_id) ?? []), o]);
  }
  let avisadosJoyeros = 0;
  if (porJoyero.size > 0) {
    const { data: joyeros } = await db().from("joyeros").select("id, nombre, correo, usuario_id").in("id", [...porJoyero.keys()]);
    for (const j of joyeros ?? []) {
      const suyas = porJoyero.get(j.id) ?? [];
      const texto = suyas.map((o) => `${o.numero} · ${o.descripcion_pieza} · ${describirRestantes(o.evaluacion.dias ?? 0)}`);
      await notificar({
        tipo: "por_vencer_joyero",
        titulo: `${suyas.length} ${suyas.length === 1 ? "trabajo" : "trabajos"} por vencer o vencidos`,
        cuerpo: texto.join(" · "),
        enlace: "/panel/mis-trabajos",
        usuarios: j.usuario_id ? [j.usuario_id] : [],
        correo: j.correo ? { para: [j.correo], asunto: `ARIGA · Trabajos por vencer`, html: envoltorio(`Hola ${j.nombre}`, parrafo("Estos trabajos están por vencer o vencidos:") + lista(texto)) } : undefined,
      });
      avisadosJoyeros += 1;
    }
  }

  return NextResponse.json({ total: alertas.total, joyerosAvisados: avisadosJoyeros });
}
