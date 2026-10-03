# 99 · Entrega — Módulo de Reparaciones y Control de Joyeros

Fecha: 2026-10-03. Cuatro fases ejecutadas de corrido; un commit local por fase (`git log`). Base de datos real: proyecto Supabase `aijexrcfmakphpqihkig`, esquema **`joyeria`** (12 migraciones aplicadas, tipos generados desde la base).

## Cómo empezar

```bash
npm install
npm run dev            # http://localhost:3003
```

Primer acceso: **`admin` / `admin123`** → Mi cuenta → **Cambiar contraseña**. Cuentas de prueba (`taller`, `gerencia`, `joyero1`) y sus claves en `docs/reparaciones/01-fase-1.md`; desactívalas desde Usuarios cuando no hagan falta.

Primer día de uso recomendado:
1. Catálogos → **Tiempos estándar**: llenar la matriz (arranca vacía a propósito; sin ella la recepción se bloquea).
2. Catálogos → Parámetros y Calendario laboral: revisar holguras, días hábiles y feriados.
3. Joyeros: registrar a los joyeros con especialidades y tarifas; crear sus cuentas (rol joyero) en Usuarios y enlazarlas desde la ficha.
4. Recibir la primera pieza.

## Verificación (todo en verde al cierre)

| Comando | Qué | Resultado |
|---|---|---|
| `npm test` | 92 pruebas unitarias de la lógica pura (días hábiles, estados, tiempos, cotizaciones, asignación, dinero, períodos, parámetros, semáforo, número de orden) | ✔ |
| `npm run check` | TypeScript estricto + ESLint | ✔ |
| `npm run build` | Build de producción (Next 16) | ✔ |
| `npm run db:check` | Conexión, esquema expuesto, tablas y cierre de seguridad (401 sin credenciales) | ✔ |
| `npm run test:fase1` … `test:fase4` | Pruebas contra la base real por fase (crean y limpian datos `zz-prueba-*`) | ✔ 27 · 35 · 26 · 22 |
| `npm run test:humo` | Con el servidor corriendo: cada página por rol, códigos HTTP y redirecciones | ✔ |

## Criterios de aceptación del documento

| # | Criterio | Dónde se cumple | Cómo verlo |
|---|---|---|---|
| 1 | Dos trabajos de distinta complejidad → suma de días hábiles, fecha estimada y prometida, respetando feriados | `tiempos.ts` + calendario; asistente de recepción | `02-fase-2.md` paso 2; `tiempos.test.ts` |
| 2 | Falta una combinación en la matriz → bloqueo con mensaje claro | `FaltaTiempoEstandar`; asistente y `crearOrden` | `02-fase-2.md` paso 3 |
| 3 | Cotización versionada tres veces con margen; aprobar la tercera crea la orden sin redigitar | `fn_nueva_version_cotizacion`, `fn_aprobar_cotizacion` | `02-fase-2.md` paso 4; `test:fase2` |
| 4 | Asignar con fecha que supera la prometida → advertencia y decisión en el historial | diálogo de asignación + `fn_asignar_joyero` | `03-fase-3.md` paso 1; `test:fase3` |
| 5 | El joyero entra desde el celular, ve solo lo suyo, marca terminado, nunca ve un precio | `vw_trabajos_joyero` sin columnas de dinero; guardas por rol | `03-fase-3.md` paso 2; `test:fase3` |
| 6 | Rechazo en calidad → vuelve al joyero con costo 0 y suma a su retrabajo | `fn_registrar_calidad`, `fn_carga_joyeros` | `03-fase-3.md` paso 3 |
| 7 | Garantía sin cobro → utilidad negativa y descuento en la liquidación del joyero | `fn_crear_garantia`, `vw_ordenes_economia`, `fn_generar_liquidacion` | `04-fase-4.md` paso 1; `test:fase4` |
| 8 | La liquidación de un período no vuelve a incluir asignaciones pagadas | `pagada`, `unique (asignacion_id, es_descuento)` | `04-fase-4.md` paso 2; `test:fase4` |
| 9 | `vw_cliente_360` devuelve recompra, valor, utilidad y días desde el último servicio; el ranking cuadra a mano | `vw_cliente_360`, `fn_ranking_clientes` | `04-fase-4.md` paso 3; `test:fase4` |
| 10 | Alertas separan mora del joyero y mora frente al cliente | `alertas.ts`, `/panel/alertas` | `03-fase-3.md` paso 5 |
| 11 | Ninguna consulta a Supabase desde el navegador | `server-only` en `src/lib/supabase/server.ts` y `src/lib/datos/*`; archivos por URL firmada tras validar sesión | `grep -r "@supabase/supabase-js" src` |

## Mapa del sistema

- **Documentos**: `00-hallazgos.md` (qué había y qué se decidió), `01`–`04` (por fase: construido, cómo probar, decisiones, pendientes).
- **Base**: `supabase/migrations/` en orden; `npm run db:push` aplica, `npm run db:types` regenera tipos. El estado de una orden solo cambia por `fn_cambiar_estado_orden`; un trigger rechaza cualquier otro camino.
- **Código**: `src/lib/reparaciones/` (lógica pura probada), `src/lib/datos/` (lecturas, `server-only`), `src/lib/acciones/` (Server Actions con guarda), `src/app/(interno)/panel/` (pantallas), `src/lib/navegacion.ts` (menú por rol).
- **Roles**: admin (todo), taller (operación, cobros, liquidaciones), joyero (solo Mis trabajos), gerencia (lectura: órdenes, alertas, tablero, joyeros, clientes, liquidaciones).

## Lo que queda de tu lado

1. **Seguridad**: cambiar `admin123`; rotar la contraseña de la base (`Database → Settings`) y actualizar `SUPABASE_DB_URL` en `.env.local`; si este chat se compartió, rotar también la clave de servicio.
2. **Vercel**: importar el repositorio; variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Sensitive), `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `SUPABASE_STORAGE_BUCKET=reparaciones`. Los crons están en `vercel.json`; en plan Hobby, dejarlos diarios.
3. **GitHub**: crear el repositorio remoto y hacer `git push` (hay 4 commits locales en `main`).
4. **Correo**: decidir proveedor. Con Resend basta `RESEND_API_KEY` y `CORREO_REMITENTE` (dominio verificado); sin ellas todo queda en la cola marcado como enviado en consola.
5. **Supabase**: si alguien edita los esquemas expuestos desde el Dashboard, comprobar que `joyeria` siga en la lista (`npm run db:check`).
6. **Datos**: calibrar la matriz de tiempos y las tarifas; revisar los textos de los PDF y correos.

## Fuera de alcance (respetado)

Inventario y materiales, WhatsApp, facturación electrónica (SAT), portal público con QR, app nativa, migración de históricos, integración con producción o inventario del ERP.
