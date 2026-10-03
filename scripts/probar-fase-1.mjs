/**
 * Pruebas de la Fase 1 contra la base real, por PostgREST con la clave de
 * servicio (el mismo camino que usa la aplicación).
 *
 *   npm run test:fase1
 *
 * Comprueba semillas, restricciones y el hash de contraseñas. Lo que crea
 * lleva el prefijo `zz-prueba-` y se elimina al final, pase lo que pase.
 */
import { scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const base = { apikey: clave, Authorization: `Bearer ${clave}` };
let pasan = 0;
let fallan = 0;

function comprobar(descripcion, condicion, detalle = "") {
  if (condicion) {
    pasan++;
    console.log(`  [ok] ${descripcion}`);
  } else {
    fallan++;
    console.log(`  [!!] ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  }
}

async function rest(metodo, ruta, cuerpo, extra = {}) {
  const r = await fetch(`${url}/rest/v1/${ruta}`, {
    method: metodo,
    headers: {
      ...base,
      "Accept-Profile": "joyeria",
      "Content-Profile": "joyeria",
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extra,
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  let json = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = texto;
  }
  return { ok: r.ok, status: r.status, json };
}

const get = (ruta) => rest("GET", ruta);
const post = (ruta, cuerpo) => rest("POST", ruta, cuerpo);
const del = (ruta) => rest("DELETE", ruta);

const creados = { joyeros: [], tipos: [], especialidades: [] };

async function limpiar() {
  for (const id of creados.joyeros) await del(`joyeros?id=eq.${id}`);
  for (const id of creados.tipos) await del(`tipos_trabajo?id=eq.${id}`);
  for (const id of creados.especialidades) await del(`especialidades?id=eq.${id}`);
  await del("joyeros?nombre=like.zz-prueba-*");
  await del("tipos_trabajo?nombre=like.zz-prueba-*");
  await del("especialidades?nombre=like.zz-prueba-*");
}

try {
  console.log("\nSemillas");
  const esp = await get("especialidades?select=id,nombre&order=nombre");
  comprobar("8 especialidades sembradas", esp.json?.length === 8, `hay ${esp.json?.length}`);
  const comp = await get("complejidades?select=id,nombre,orden&order=orden");
  comprobar("complejidades Baja/Media/Alta en orden", comp.json?.map((c) => c.nombre).join(",") === "Baja,Media,Alta");
  const tipos = await get("tipos_trabajo?select=id,nombre,categoria&order=nombre");
  comprobar("13 tipos de trabajo sembrados", tipos.json?.length === 13, `hay ${tipos.json?.length}`);
  comprobar("9 de reparación y 4 de creación",
    tipos.json?.filter((t) => t.categoria === "reparacion").length === 9 &&
    tipos.json?.filter((t) => t.categoria === "creacion").length === 4);
  const par = await get("parametros?select=clave,valor");
  const mapa = Object.fromEntries((par.json ?? []).map((p) => [p.clave, p.valor]));
  comprobar("9 parámetros sembrados", par.json?.length === 9, `hay ${par.json?.length}`);
  comprobar("dias_semana_habiles = [1..6]", mapa.dias_semana_habiles === "[1,2,3,4,5,6]", mapa.dias_semana_habiles);
  comprobar("holgura_cliente_dias = 2", mapa.holgura_cliente_dias === "2");
  const cal = await get("calendario_laboral?select=fecha,es_habil&fecha=eq.2026-10-20");
  comprobar("20 de octubre de 2026 es feriado", cal.json?.[0]?.es_habil === false);
  const matriz = await get("tiempos_estandar?select=id");
  comprobar("la matriz de tiempos arranca vacía (la calibra ARIGA)", Array.isArray(matriz.json));

  console.log("\nRestricciones");
  const dup = await post("especialidades", { nombre: "Engaste" });
  comprobar("especialidad duplicada rechazada (23505)", dup.status === 409 && dup.json?.code === "23505", `status ${dup.status}`);

  const dupTipo = await post("tipos_trabajo", { nombre: "  rodinado ", categoria: "reparacion" });
  comprobar("tipo de trabajo duplicado por nombre normalizado rechazado", dupTipo.status === 409, `status ${dupTipo.status}`);

  const malCategoria = await post("tipos_trabajo", { nombre: "zz-prueba-cat", categoria: "otra" });
  comprobar("categoría fuera del enum rechazada", !malCategoria.ok);

  const diasCero = await post("tiempos_estandar", { tipo_trabajo_id: tipos.json[0].id, complejidad_id: comp.json[0].id, dias_habiles: 0 });
  comprobar("tiempo estándar con 0 días rechazado (check)", !diasCero.ok && diasCero.json?.code === "23514", `código ${diasCero.json?.code}`);

  console.log("\nJoyeros y tarifas");
  const joyero = await post("joyeros", { nombre: "zz-prueba-joyero", capacidad_maxima: 3 });
  comprobar("joyero creado", joyero.ok, JSON.stringify(joyero.json));
  const joyeroId = joyero.json?.[0]?.id;
  if (joyeroId) creados.joyeros.push(joyeroId);

  const capacidadCero = await post("joyeros", { nombre: "zz-prueba-cap", capacidad_maxima: 0 });
  comprobar("capacidad 0 rechazada (check)", !capacidadCero.ok);

  const je = await post("joyeros_especialidades", [
    { joyero_id: joyeroId, especialidad_id: esp.json[0].id },
    { joyero_id: joyeroId, especialidad_id: esp.json[1].id },
  ]);
  comprobar("dos especialidades enlazadas", je.ok && je.json?.length === 2);
  const jeDup = await post("joyeros_especialidades", { joyero_id: joyeroId, especialidad_id: esp.json[0].id });
  comprobar("especialidad repetida rechazada (PK compuesta)", jeDup.status === 409);

  const tipoId = tipos.json[0].id;
  const t1 = await post("tarifas_joyero", { joyero_id: joyeroId, tipo_trabajo_id: tipoId, complejidad_id: null, costo_acordado: 150, vigente_desde: "2026-10-01" });
  comprobar("tarifa «todas las complejidades» creada", t1.ok, JSON.stringify(t1.json));
  const t1dup = await post("tarifas_joyero", { joyero_id: joyeroId, tipo_trabajo_id: tipoId, complejidad_id: null, costo_acordado: 200, vigente_desde: "2026-10-02" });
  comprobar("segunda tarifa activa con la misma clave (null) rechazada — NULLS NOT DISTINCT", t1dup.status === 409, `status ${t1dup.status}`);
  const t2 = await post("tarifas_joyero", { joyero_id: joyeroId, tipo_trabajo_id: tipoId, complejidad_id: comp.json[2].id, costo_acordado: 300, vigente_desde: "2026-10-01" });
  comprobar("tarifa específica (Alta) convive con la general", t2.ok);
  const negativa = await post("tarifas_joyero", { joyero_id: joyeroId, tipo_trabajo_id: tipoId, complejidad_id: comp.json[1].id, costo_acordado: -5, vigente_desde: "2026-10-01" });
  comprobar("costo negativo rechazado", !negativa.ok);

  const trig = await rest("PATCH", `joyeros?id=eq.${joyeroId}`, { notas: "editado" });
  comprobar("trigger de actualizado_en se dispara", trig.ok && Boolean(trig.json?.[0]?.actualizado_en), JSON.stringify(trig.json));

  console.log("\nUsuarios y contraseñas");
  const admin = await get("usuarios?select=id,correo,rol,contrasena_hash,activo&correo=eq.admin");
  const a = admin.json?.[0];
  comprobar("existe el usuario admin con rol admin", a?.rol === "admin" && a?.activo === true);
  if (a) {
    const [alg, N, r, p, salHex, derHex] = a.contrasena_hash.split("$");
    const derivado = await scrypt("admin123".normalize("NFKC"), Buffer.from(salHex, "hex"), 64, { N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
    comprobar("la contraseña admin123 verifica contra el hash scrypt", alg === "scrypt" && timingSafeEqual(derivado, Buffer.from(derHex, "hex")));
  }
  const mayus = await post("usuarios", { nombre: "zz-prueba", correo: "Zz-Prueba", contrasena_hash: "x", rol: "taller" });
  comprobar("correo con mayúsculas rechazado por el check", !mayus.ok);
  const rolMalo = await post("usuarios", { nombre: "zz-prueba", correo: "zz-prueba-rol", contrasena_hash: "x", rol: "vendedora" });
  comprobar("rol fuera del enum rechazado", !rolMalo.ok);

  console.log("\nCierre de seguridad");
  const sinClave = await fetch(`${url}/rest/v1/usuarios?select=id`, { headers: { "Accept-Profile": "joyeria" } });
  comprobar("sin credenciales la API no responde datos", sinClave.status === 401 || sinClave.status === 403 || sinClave.status === 404, `status ${sinClave.status}`);
} finally {
  await limpiar();
}

console.log(`\n${pasan} correctas, ${fallan} fallidas.\n`);
process.exit(fallan ? 1 : 0);
