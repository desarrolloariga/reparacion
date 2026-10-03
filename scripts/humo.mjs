/**
 * Prueba de humo del servidor: abre sesiones reales por rol (insertando en
 * `sesiones` por PostgREST) y pide cada página comprobando código HTTP,
 * redirecciones y un texto esperado. No usa navegador.
 *
 *   npm run build && npm run start      (en otra terminal, puerto 3003)
 *   npm run test:humo
 *
 * Las sesiones que crea se borran al terminar.
 */
import { createHash, randomBytes } from "node:crypto";

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
if (!url || !clave) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const COOKIE = "ariga_joyeria_sesion";
const cab = { apikey: clave, Authorization: `Bearer ${clave}`, "Accept-Profile": "joyeria", "Content-Profile": "joyeria", "Content-Type": "application/json", Prefer: "return=representation" };

let pasan = 0;
let fallan = 0;
const ok = (d) => { pasan++; console.log(`  [ok] ${d}`); };
const mal = (d, x = "") => { fallan++; console.log(`  [!!] ${d}${x ? ` — ${x}` : ""}`); };

async function abrirSesion(correo) {
  const r = await fetch(`${url}/rest/v1/usuarios?select=id&correo=eq.${correo}`, { headers: cab });
  const [u] = await r.json();
  if (!u) throw new Error(`No existe el usuario ${correo}`);
  const token = randomBytes(32).toString("base64url");
  const token_hash = createHash("sha256").update(token).digest("hex");
  const s = await fetch(`${url}/rest/v1/sesiones`, {
    method: "POST",
    headers: cab,
    body: JSON.stringify({ usuario_id: u.id, token_hash, expira_en: new Date(Date.now() + 3_600_000).toISOString(), user_agent: "humo" }),
  });
  if (!s.ok) throw new Error(`No se pudo abrir sesión para ${correo}: ${await s.text()}`);
  return { token, token_hash };
}

async function cerrarSesion(token_hash) {
  await fetch(`${url}/rest/v1/sesiones?token_hash=eq.${token_hash}`, { method: "DELETE", headers: cab });
}

async function pedir(ruta, token) {
  const r = await fetch(`${sitio}${ruta}`, {
    redirect: "manual",
    headers: token ? { cookie: `${COOKIE}=${token}` } : {},
  });
  const html = r.status === 200 ? await r.text() : "";
  return { status: r.status, location: r.headers.get("location") ?? "", html };
}

/** [ruta, estado esperado, texto que debe aparecer | destino de la redirección, texto que NO debe aparecer] */
const CASOS = {
  anonimo: [
    ["/login", 200, "Iniciar sesión"],
    ["/panel", 307, "/login?redirect=%2Fpanel"],
    ["/panel/joyeros", 307, "/login"],
  ],
  admin: [
    ["/login", 307, "/panel"],
    ["/panel", 200, "JOYEROS ACTIVOS"],
    ["/panel/joyeros", 200, "NUEVO JOYERO"],
    ["/panel/joyeros/nuevo", 200, "Registrar joyero"],
    ["/panel/joyeros/999999", 404, ""],
    ["/panel/catalogos", 307, "/panel/catalogos/tipos-trabajo"],
    ["/panel/catalogos/especialidades", 200, "Engaste"],
    ["/panel/catalogos/tipos-trabajo", 200, "Cambio de medida"],
    ["/panel/catalogos/complejidades", 200, "Niveles de complejidad"],
    ["/panel/catalogos/tiempos", 200, "GUARDAR MATRIZ"],
    ["/panel/catalogos/parametros", 200, "HOLGURA AL CLIENTE"],
    ["/panel/catalogos/calendario", 200, "Revolución de 1944"],
    ["/panel/usuarios", 200, "Administrador"],
    ["/panel/cuenta", 200, "Cambiar contraseña"],
    ["/panel/mis-trabajos", 307, "/panel"],
  ],
  taller: [
    ["/panel", 200, "JOYEROS ACTIVOS"],
    ["/panel/joyeros", 200, "NUEVO JOYERO"],
    ["/panel/catalogos/tipos-trabajo", 307, "/panel"],
    ["/panel/usuarios", 307, "/panel"],
  ],
  gerencia: [
    ["/panel/joyeros", 200, "Joyeros", "NUEVO JOYERO"],
    ["/panel/joyeros/nuevo", 307, "/panel"],
    ["/panel/usuarios", 307, "/panel"],
  ],
  joyero1: [
    ["/panel", 307, "/panel/mis-trabajos"],
    ["/panel/mis-trabajos", 200, "todavía no está enlazada"],
    ["/panel/joyeros", 307, "/panel/mis-trabajos"],
    ["/panel/catalogos/tiempos", 307, "/panel/mis-trabajos"],
    ["/login", 307, "/panel/mis-trabajos"],
  ],
};

try {
  const ping = await fetch(`${sitio}/login`, { redirect: "manual" }).catch(() => null);
  if (!ping) {
    console.error(`El servidor no responde en ${sitio}. Arranca \`npm run start\` (o \`npm run dev\`).`);
    process.exit(1);
  }
} catch {
  /* se reporta arriba */
}

const sesiones = {};
try {
  for (const rol of Object.keys(CASOS)) {
    if (rol === "anonimo") continue;
    sesiones[rol] = await abrirSesion(rol);
  }

  for (const [rol, casos] of Object.entries(CASOS)) {
    console.log(`\n${rol}`);
    const token = sesiones[rol]?.token;
    for (const [ruta, esperado, texto, ausente] of casos) {
      const r = await pedir(ruta, token);
      if (r.status !== esperado) {
        mal(`${ruta} → ${esperado}`, `respondió ${r.status}${r.location ? ` → ${r.location}` : ""}`);
        continue;
      }
      if (esperado >= 300 && esperado < 400) {
        const destino = r.location.replace(/^https?:\/\/[^/]+/, "");
        if (texto && !destino.startsWith(texto)) {
          mal(`${ruta} → ${esperado} ${texto}`, `redirige a ${destino}`);
          continue;
        }
        ok(`${ruta} → ${esperado} ${destino}`);
        continue;
      }
      if (texto && !r.html.includes(texto)) {
        mal(`${ruta} → ${esperado} con «${texto}»`, "el texto no aparece");
        continue;
      }
      if (ausente && r.html.includes(ausente)) {
        mal(`${ruta} no debe mostrar «${ausente}»`);
        continue;
      }
      ok(`${ruta} → ${esperado}${texto ? ` con «${texto}»` : ""}${ausente ? ` sin «${ausente}»` : ""}`);
    }
  }
} finally {
  for (const s of Object.values(sesiones)) await cerrarSesion(s.token_hash);
}

console.log(`\n${pasan} correctas, ${fallan} fallidas.\n`);
process.exit(fallan ? 1 : 0);
