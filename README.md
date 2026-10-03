# ARIGA Joyería — Reparaciones y Control de Joyeros

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase (esquema `joyeria`) · Vercel.

Plataforma interna de ARIGA para recibir piezas, cotizarlas, asignarlas a joyeros externos, controlar tiempos y calidad, entregar, cobrar y liquidar, con indicadores de operación, joyeros, dinero y clientes. El sistema de diseño es el de **ARIGA Smart Vale**.

Documentación del módulo en [`docs/reparaciones/`](docs/reparaciones/): hallazgos iniciales, un documento por fase con lo construido y las decisiones, y la entrega final.

## Arranque local

```bash
npm install
cp .env.example .env.local   # llenar SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_DB_URL
npm run dev                  # http://localhost:3003
```

Primer acceso: usuario `admin`, contraseña `admin123`. **Cámbiala en Mi cuenta → Cambiar contraseña.**

## Supabase

El proyecto de Supabase es compartido con el ERP (`public`) y Smart Vale (`smartvale`). Esta app vive en el esquema **`joyeria`**, cerrado a `anon` y `authenticated`: solo el servidor accede, con la clave de servicio (`src/lib/supabase/server.ts`, protegido con `server-only`). No se usa Supabase Auth: la autenticación es propia (`joyeria.usuarios` + `joyeria.sesiones`) y la autorización vive en `src/lib/auth/guardas.ts`.

| Comando | Qué hace |
|---|---|
| `npm run db:push` | Aplica `supabase/migrations/` a la base (conexión directa por `SUPABASE_DB_URL`) |
| `npm run db:types` | Regenera `src/lib/supabase/types.ts` desde la base |
| `npm run db:check` | Verifica conexión, esquema expuesto, tablas y cierre de seguridad |
| `npm run db:sql -- "select …"` | Ejecuta una consulta suelta |
| `npm run db:new nombre` | Crea un archivo de migración vacío |
| `npm run db:bundle` | Une las migraciones en `supabase/aplicar.sql` (respaldo manual) |
| `npm run usuarios:crear -- --nombre "…" --correo … --rol admin\|taller\|joyero\|gerencia [--clave …]` | Alta de cuentas desde la terminal |

`SUPABASE_DB_URL` es la cadena del *session pooler* (Dashboard → Connect → Session pooler, IPv4). Solo la usan los scripts locales; **no va en Vercel**.

## Pruebas

| Comando | Qué prueba |
|---|---|
| `npm test` | Unitarias (vitest): días hábiles, semáforo, parámetros… |
| `npm run check` | TypeScript + ESLint |
| `npm run test:fase1` | Contra la base real: semillas, restricciones, hash de contraseñas (limpia lo que crea) |
| `npm run test:humo` | Con el servidor corriendo: cada página por rol, códigos HTTP y redirecciones |

## Vercel

1. Importar el repositorio de GitHub (framework Next.js, se detecta solo).
2. Variables de entorno (Production y Preview): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (marcar **Sensitive**), `NEXT_PUBLIC_SITE_URL` (dominio real). Las fases siguientes añaden `CRON_SECRET` y las del proveedor de correo.
3. Cada push a `main` despliega a producción; cada rama/PR crea un preview.

## Estructura

```
src/
  app/
    login/                     acceso
    (interno)/panel/           todo lo que exige sesión (layout con requerirSesion)
      joyeros/  catalogos/  usuarios/  cuenta/  mis-trabajos/
    globals.css                tokens de la marca (@theme de Tailwind v4)
  components/
    layout/                    barra lateral, cabecera, barra móvil, shell
    ui/                        Boton, Campo, Selector, Area, Casilla, Tarjeta, Chip, Aviso, Tabla, Vacio, Paginacion…
  lib/
    auth/                      sesiones, guardas, contraseñas
    acciones/                  Server Actions ("use server"), una guarda al inicio de cada una
    datos/                     lecturas (server-only), una función por consulta
    reparaciones/              lógica pura con pruebas: días hábiles, semáforo, parámetros…
    supabase/                  cliente de servidor, esquema, tipos generados, alias (modelo.ts)
    navegacion.ts              menú por rol: única fuente de verdad del sidebar y la cabecera
    validacion.ts              helpers de zod y FormData para las acciones
supabase/migrations/           migraciones SQL del esquema joyeria
scripts/                       CLI: migraciones, tipos, usuarios, pruebas
docs/reparaciones/             hallazgos, fases y entrega
```
