import "server-only";

/**
 * Adaptador de correo. El proveedor real (Resend, SMTP…) se decide después:
 * basta implementar `ProveedorCorreo` y elegirlo en `proveedorActual()`.
 *
 * Mientras tanto, el proveedor `consola` no manda nada: registra en el log y
 * marca el correo como enviado, para que la cola no crezca sin control.
 */

export type Mensaje = { para: string; asunto: string; html: string };

export interface ProveedorCorreo {
  nombre: string;
  enviar(mensaje: Mensaje): Promise<void>;
}

export const proveedorConsola: ProveedorCorreo = {
  nombre: "consola",
  async enviar(m) {
    console.info(`[correo · consola] → ${m.para} · ${m.asunto}`);
  },
};

/**
 * Proveedor por `fetch` a Resend, listo para activarse con RESEND_API_KEY y
 * CORREO_REMITENTE. No añade dependencias.
 */
export const proveedorResend: ProveedorCorreo = {
  nombre: "resend",
  async enviar(m) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.CORREO_REMITENTE, to: [m.para], subject: m.asunto, html: m.html }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  },
};

export function proveedorActual(): ProveedorCorreo {
  if (process.env.RESEND_API_KEY && process.env.CORREO_REMITENTE) return proveedorResend;
  return proveedorConsola;
}
