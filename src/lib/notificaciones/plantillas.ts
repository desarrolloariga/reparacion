/** Plantillas de correo: HTML simple con la marca, sin dependencias. */

function escapar(t: string) {
  return t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

export function envoltorio(titulo: string, cuerpo: string, pie = "ARIGA Joyería · Taller de reparaciones y creaciones") {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f3ed;font-family:Helvetica,Arial,sans-serif;color:#0b0b0c">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <div style="letter-spacing:.3em;font-size:12px;font-weight:bold">ARIGA</div>
  <div style="letter-spacing:.3em;font-size:8px;color:#888;margin-top:2px">JOYERÍA</div>
  <div style="background:#fff;border:1px solid #e7e3da;border-radius:4px;padding:24px;margin-top:20px">
    <h1 style="font-size:20px;font-weight:normal;margin:0 0 14px">${escapar(titulo)}</h1>
    <div style="font-size:14px;line-height:1.6">${cuerpo}</div>
  </div>
  <p style="font-size:11px;color:#888;margin-top:16px;letter-spacing:.08em">${escapar(pie)}</p>
</div></body></html>`;
}

export const parrafo = (t: string) => `<p style="margin:0 0 12px">${escapar(t)}</p>`;
export const lista = (items: string[]) => `<ul style="margin:0 0 12px;padding-left:18px">${items.map((i) => `<li>${escapar(i)}</li>`).join("")}</ul>`;
export const destacado = (t: string) => `<p style="margin:0 0 12px;padding:10px 14px;background:#f6f3ed;border-left:3px solid #c6a15b">${escapar(t)}</p>`;
