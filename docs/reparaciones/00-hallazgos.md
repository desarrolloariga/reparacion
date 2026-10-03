# 00 · Hallazgos del repositorio y de Supabase

Fecha: 2026-10-03. Punto de partida del módulo de Reparaciones y Control de Joyeros.

## Resumen

El documento de requisitos asume una plataforma existente con clientes, usuarios, autenticación, subida de archivos, PDF y shadcn/ui. **Este repositorio (`arigajoyeria`) se creó el mismo día y no tenía nada de eso**: solo el sistema de diseño ARIGA (copiado de Smart Vale), el cliente de Supabase con clave de servicio y un esquema `joyeria` vacío. Por eso la Fase 1 incluye autenticación, roles y una pantalla de usuarios, además de lo que pedía el documento.

## Esquemas en el proyecto de Supabase (`aijexrcfmakphpqihkig`)

| Esquema | Qué es | Relevante para este módulo |
|---|---|---|
| `public` | ERP de ARIGA (91 tablas, 84 funciones). Tiene `clientes` (id bigint, nombre, telefono, correo, direccion, fecha_nacimiento, vendedor_id, activo) y `usuarios` con `auth_uid uuid` → usa **Supabase Auth** y tablas `roles`/`permisos` propias. | Se decidió **no** depender de él. `joyeria.clientes.erp_cliente_id` queda como puente opcional, sin llave foránea. |
| `smartvale` | Plataforma de vales (20 tablas, 35 funciones). Auth propia: `usuarios` con `contrasena_hash` scrypt + `sesiones`; `contactos` como directorio. | Es el **modelo de referencia** del que se portó la autenticación y los patrones de código. |
| `smartvalehubgold` | Variante de Smart Vale para otra marca. | No se toca. |
| `tiendaariga` | Otra aplicación con su propia tabla `clientes`. | No se toca. |
| `joyeria` | Este módulo. Existía vacío (sin tablas); las migraciones de este repositorio lo poblaron. | Convención: nombres en español, PK `bigint generated always as identity`, `creado_en` / `actualizado_en`, `creado_por → usuarios`, funciones `fn_*`, vistas `vw_*`. |

Convención real del proyecto Smart Vale (la más cercana): esquema propio cerrado a `anon` y `authenticated`, acceso solo con `service_role` desde el servidor, sin RLS, marcas de tiempo `fecha_creacion` / `fecha_actualizacion`. **Este módulo sigue el documento (`creado_en` / `actualizado_en`)**, no a Smart Vale, porque la base aún no existía y no había nada que mantener compatible.

## Dónde está la tabla de clientes

No había ninguna utilizable sin acoplarse al ERP. Decisión del usuario: **tabla propia `joyeria.clientes`** (`id`, `nombre`, `telefono` sin unique, `correo`, `direccion`, `notas`, `activo`, `erp_cliente_id`). Se crea en la Fase 1; su pantalla llega con las órdenes en la Fase 2.

## Autenticación y rol

No existía. Decisión del usuario: **autenticación propia, portada de Smart Vale** (`src/lib/auth/*`):

- `joyeria.usuarios` (`correo` único en minúsculas, `contrasena_hash` scrypt, `rol`, `activo`, `ultimo_acceso`) y `joyeria.sesiones` (SHA-256 del token de la cookie, `expira_en`, `ultima_actividad`).
- Enum `joyeria.rol_usuario`: `admin`, `taller`, `joyero`, `gerencia`. El rol vive en `usuarios.rol`; el enlace a un joyero en `joyeros.usuario_id`.
- Cookie `ariga_joyeria_sesion` (nombre distinto a Smart Vale: en localhost las cookies no distinguen puertos y se pisarían).
- Guardas en `src/lib/auth/guardas.ts`: `requerirSesion`, `requerirRol`, `requerirAdmin`, `requerirTaller` (admin|taller), `requerirLectura` (admin|taller|gerencia), `requerirJoyero`, `soloLectura`. **Es la única frontera de autorización**: sin Supabase Auth no hay `auth.uid()` y RLS no puede decidir nada.
- `src/proxy.ts` solo comprueba que exista la cookie; la validación real la hacen las guardas.

## Subida de archivos

Nada en este repositorio ni en Smart Vale. Plan: bucket privado de Supabase Storage `reparaciones`, subida por archivo a un route handler con sesión (el cuerpo de una función de Vercel tope en 4,5 MB), reducción de fotos en el navegador antes de subir, lectura por URL firmada tras validar sesión. Llega en la Fase 2.

## Librerías

| Para | Qué se usa | Estado |
|---|---|---|
| PDF | `@react-pdf/renderer`, como en Smart Vale (`src/lib/pdf/*`) | Fase 2 |
| Tablas | HTML plano con Tailwind (`src/components/ui/tabla.tsx`); paginación por URL | Fase 1 |
| Fechas | `date-fns` solo para formateo (`src/lib/format.ts`, zona `America/Guatemala`); la aritmética de días hábiles es propia y pura (`src/lib/reparaciones/dias-habiles.ts`) | Fase 1 |
| Formularios | Server Actions `"use server"` + `zod` v4 + `useActionState`; estado `{ error?, ok?, campos? }` (`src/lib/validacion.ts`) | Fase 1 |
| UI | Componentes ARIGA propios (`Boton`, `Campo`, `Selector`, `Area`, `Casilla`, `Tarjeta`, `Chip`, `Aviso`, `Vacio`, `Paginacion`). **No hay shadcn/ui** y no se agrega ninguna librería de UI. | Fase 1 |
| Pruebas | `vitest` (`npm test`), pruebas junto a cada módulo puro | Fase 1 |
| Base de datos | `@supabase/supabase-js` solo en `src/lib/supabase/server.ts` (`server-only`); CLI de Supabase con `--db-url` para migraciones y tipos | Fase 1 |

## Acceso a la base desde este equipo

- La cadena directa `db.<ref>.supabase.co:5432` resuelve solo IPv6 y este equipo no tiene IPv6. Se usa el **session pooler** por IPv4: `aws-1-us-west-2.pooler.supabase.com:5432`, usuario `postgres.<ref>` (`SUPABASE_DB_URL` en `.env.local`, nunca en Vercel).
- `npm run db:push` aplica `supabase/migrations/` y las registra en `supabase_migrations.schema_migrations`; `npm run db:types` regenera `src/lib/supabase/types.ts`; `npm run db:sql -- "<consulta>"` para verificaciones.
- El esquema se expuso en PostgREST con `alter role authenticator set pgrst.db_schemas = '<lista existente>, joyeria'` + `notify pgrst, 'reload config'` / `'reload schema'`, conservando los esquemas de las otras aplicaciones. Verificado con `npm run db:check`. Si alguien edita los esquemas expuestos desde el Dashboard, hay que revisar que `joyeria` siga en la lista.

## Desviaciones respecto al documento

| Documento | Aquí | Por qué |
|---|---|---|
| Esquema `reparaciones` | Esquema `joyeria` | Decisión del usuario: reparaciones es el primer módulo de la app de joyería. |
| FK a `clientes` y `usuarios` existentes | Tablas propias en `joyeria` | No había tablas utilizables sin acoplarse al ERP. |
| shadcn/ui | Componentes ARIGA | No existía; el propio documento pide no introducir librerías de UI. |
| `joyeros.email` | `joyeros.correo` | Coherente con `usuarios.correo` y `clientes.correo`. |
| Semilla de `tiempos_estandar` (no la pedía, pero tentaba) | Sin semilla | El documento exige bloquear cuando falta una combinación; valores inventados lo esconderían. |
| Fases con parada | Ejecución continua | Instrucción final del usuario; cada fase deja su `0N-fase-N.md` y un commit. |
