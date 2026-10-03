/**
 * Envoltorio del CLI de Supabase con la conexión directa a la base.
 *
 *   node --env-file=.env.local scripts/supabase-cli.mjs db push
 *   node --env-file=.env.local scripts/supabase-cli.mjs db pull --schema joyeria
 *
 * Existe porque los scripts de npm no expanden variables de entorno en
 * Windows, y porque pasar la URL por el shell de Windows rompería los `%`
 * de la contraseña codificada. Se invoca el binario directamente.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export const urlBase = process.env.SUPABASE_DB_URL;

export function binarioSupabase() {
  // El paquete `supabase` delega en un paquete por plataforma
  // (@supabase/cli-<os>-<arch>) que trae el ejecutable de Go.
  const ext = process.platform === "win32" ? ".exe" : "";
  const candidatos = {
    win32: ["windows-x64", "windows-arm64"],
    darwin: ["darwin-arm64", "darwin-x64"],
    linux: ["linux-x64", "linux-arm64", "linux-x64-musl", "linux-arm64-musl"],
  }[process.platform] ?? [];
  for (const sufijo of candidatos) {
    const ruta = path.join(process.cwd(), "node_modules", "@supabase", `cli-${sufijo}`, "bin", `supabase${ext}`);
    if (existsSync(ruta)) return ruta;
  }
  throw new Error("No se encontró el ejecutable del CLI de Supabase en node_modules/@supabase/cli-*");
}

export function ejecutar(args, opciones = {}) {
  if (!urlBase) {
    console.error("Falta SUPABASE_DB_URL en .env.local (cadena del session pooler).");
    process.exit(1);
  }
  return spawnSync(binarioSupabase(), [...args, "--db-url", urlBase], {
    stdio: "inherit",
    ...opciones,
  });
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const r = ejecutar(process.argv.slice(2));
  process.exit(r.status ?? 1);
}
