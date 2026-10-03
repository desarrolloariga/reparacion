/**
 * Regenera src/lib/supabase/types.ts desde el esquema `joyeria` de la base.
 *
 *   npm run db:types
 *
 * Correr después de cada migración aplicada. El archivo generado no se edita
 * a mano; los alias de uso cotidiano viven en src/lib/supabase/modelo.ts.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { ejecutar } from "./supabase-cli.mjs";

const salida = path.join(process.cwd(), "src", "lib", "supabase", "types.ts");

const r = ejecutar(["gen", "types", "typescript", "--schema", "joyeria"], {
  stdio: ["ignore", "pipe", "inherit"],
  maxBuffer: 64 * 1024 * 1024,
});

if (r.status !== 0 || !r.stdout?.length) {
  console.error("No se pudieron generar los tipos.");
  process.exit(r.status ?? 1);
}

writeFileSync(salida, r.stdout);
console.log(`Tipos escritos en ${path.relative(process.cwd(), salida)} (${r.stdout.length} bytes)`);
