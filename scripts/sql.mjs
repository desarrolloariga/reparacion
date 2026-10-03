/**
 * Ejecuta una consulta suelta contra la base, con la conexión directa.
 *
 *   npm run db:sql -- "select count(*) from joyeria.usuarios"
 *   npm run db:sql -- --archivo ruta/consulta.sql
 *
 * Solo para verificación y mantenimiento desde la terminal. La aplicación
 * nunca usa esta vía: habla con la base por PostgREST con la clave de servicio.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Falta SUPABASE_DB_URL en .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
let sql;
const i = args.indexOf("--archivo");
if (i >= 0) sql = readFileSync(args[i + 1], "utf8");
else sql = args.join(" ");

if (!sql?.trim()) {
  console.error("Falta la consulta.");
  process.exit(1);
}

const cliente = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await cliente.connect();
  const resultado = await cliente.query(sql);
  const lotes = Array.isArray(resultado) ? resultado : [resultado];
  for (const r of lotes) {
    if (r.rows?.length) console.table(r.rows);
    else console.log(`${r.command ?? "OK"}: ${r.rowCount ?? 0} fila(s)`);
  }
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
