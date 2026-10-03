/**
 * Crea (si no existe) el bucket privado de Storage para fotografías y
 * diseños. Idempotente.
 *
 *   npm run storage:preparar
 */
const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "reparaciones";

if (!url || !clave) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const cab = { apikey: clave, Authorization: `Bearer ${clave}`, "Content-Type": "application/json" };

const existente = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers: cab });
if (existente.ok) {
  const b = await existente.json();
  console.log(`El bucket "${bucket}" ya existe (público: ${b.public}).`);
  if (b.public) console.log("  [!!] Debería ser privado: las fotos se sirven por URL firmada.");
  process.exit(0);
}

const r = await fetch(`${url}/storage/v1/bucket`, {
  method: "POST",
  headers: cab,
  body: JSON.stringify({
    id: bucket,
    name: bucket,
    public: false,
    file_size_limit: 10 * 1024 * 1024,
    allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"],
  }),
});

if (!r.ok) {
  console.error(`No se pudo crear el bucket: ${r.status} ${await r.text()}`);
  process.exit(1);
}
console.log(`Bucket privado "${bucket}" creado.`);
