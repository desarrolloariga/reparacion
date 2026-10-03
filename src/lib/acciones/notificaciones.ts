"use server";

import { revalidatePath } from "next/cache";

import { requerirSesion } from "@/lib/auth/guardas";
import { marcarLeidas } from "@/lib/notificaciones";

export async function marcarTodasLeidas() {
  const sesion = await requerirSesion();
  await marcarLeidas(sesion.usuarioId);
  revalidatePath("/panel", "layout");
}

export async function marcarLeida(formData: FormData) {
  const sesion = await requerirSesion();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await marcarLeidas(sesion.usuarioId, [id]);
  revalidatePath("/panel", "layout");
}
