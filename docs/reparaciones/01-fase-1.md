# 01 · Fase 1 — Base

Cerrada el 2026-10-03. Verificación: `npm test` (43 pruebas unitarias), `npm run check`, `npm run build`, `npm run db:check`, `npm run test:fase1` (27 comprobaciones contra la base) y `npm run test:humo` (páginas por rol con sesiones reales).

## Lo construido

**Base de datos (esquema `joyeria`, aplicado en Supabase con `npm run db:push`)**
- `usuarios`, `sesiones`, enum `rol_usuario` (admin, taller, joyero, gerencia).
- `especialidades`, `tipos_trabajo` (enum `categoria_trabajo`), `complejidades`, `tiempos_estandar` (matriz tipo × complejidad, `unique`), `parametros` (clave-valor tipado), `calendario_laboral` (excepciones a la regla semanal).
- `joyeros`, `joyeros_especialidades`, `tarifas_joyero` (historial inmutable; una sola vigente por joyero/tipo/complejidad gracias a un índice único parcial con `NULLS NOT DISTINCT`), `clientes` (tabla lista; su pantalla llega en la Fase 2).
- Semillas: 8 especialidades, 3 complejidades, 13 tipos de trabajo (9 reparación, 4 creación), 9 parámetros, feriados de Guatemala 2026. **La matriz de tiempos arranca vacía** a propósito.
- El esquema quedó expuesto en PostgREST junto a los esquemas existentes; `anon` y `authenticated` siguen sin acceso.

**Autenticación y roles** (port de Smart Vale): login con correo o usuario corto, contraseñas scrypt, cookie `ariga_joyeria_sesion` httpOnly, sesiones de 30 días en base, guardas por rol, proxy que exige cookie, pantalla de usuarios (alta, activar/desactivar, restablecer clave) y cambio de la propia contraseña.

**Lógica pura con pruebas** (`src/lib/reparaciones/`): `dias-habiles.ts` (suma/resta/conteo de días hábiles con calendario; invariante `entre(f, sumar(f, n)) === n` probada para 6 fechas × 31 valores), `semaforo.ts`, `parametros.ts` (definición, defaults, lectura tolerante y validación estricta).

**Pantallas**
- `/panel` resumen: joyeros activos, tipos activos, combinaciones sin tiempo (con aviso y enlace a la matriz), próximo día no hábil, calendario vigente.
- `/panel/joyeros` lista · `/panel/joyeros/nuevo` · `/panel/joyeros/[id]` ficha con datos, especialidades, cuenta de acceso enlazada, tarifas vigentes, alta de tarifa e historial. Gerencia lo ve sin formularios.
- Catálogos (solo admin): especialidades, tipos de trabajo (por categoría), complejidades (3 filas fijas), **matriz de tiempos estándar** (un solo formulario para toda la grilla, contador de cambios, celdas sin definir resaltadas, error por celda), parámetros (formulario generado desde la definición), calendario laboral (por año, alta/edición/eliminación).
- `/panel/usuarios` (admin), `/panel/cuenta` (todos), `/panel/mis-trabajos` (joyero; placeholder hasta la Fase 3, explica si la cuenta no está enlazada).

**Herramientas**: `npm run db:push` / `db:types` / `db:sql` / `db:check`, `usuarios:crear`, `test`, `test:fase1`, `test:humo`.

## Cuentas creadas

| Acceso | Contraseña | Rol | Para qué |
|---|---|---|---|
| `admin` | `admin123` | admin | **Primer inicio de sesión. Cambiarla cuanto antes** desde Mi cuenta → Cambiar contraseña. |
| `taller` | `WX7SnSs5ieNQ` | taller | Probar la operación sin permisos de catálogo. |
| `gerencia` | `6RJTLMUAB5sp` | gerencia | Probar la vista de solo lectura. |
| `joyero1` | `dNdumkvznRsE` | joyero | Probar el portal del joyero (Fase 3). Hay que enlazarla a un joyero desde su ficha. |

Las tres de prueba se pueden desactivar desde Usuarios cuando ya no hagan falta.

## Cómo probar a mano

1. `npm run dev` → `http://localhost:3003` → redirige a `/login`. Entrar como `admin` / `admin123`.
2. Catálogos → Tiempos estándar: el panel de inicio avisa que faltan 39 combinaciones. Llenar algunas celdas, dejar otras vacías y poner un 0 en una: el 0 se marca en rojo y nada se guarda hasta corregirlo.
3. Catálogos → Parámetros: desmarcar sábado → en Inicio cambia el «próximo día no hábil» y la lista de días hábiles.
4. Catálogos → Calendario laboral: agregar un domingo como «Abre» y un feriado; editar y eliminar.
5. Joyeros → Nuevo: crear uno con dos especialidades y capacidad 3 → en la ficha agregar una tarifa «Todas» y otra para «Alta» del mismo trabajo; agregar otra «Todas» del mismo trabajo → la anterior pasa al historial.
6. Usuarios: crear una cuenta con rol joyero → Joyeros → ficha → Cuenta de acceso → enlazarla. Entrar con esa cuenta en otra ventana privada: va a `/panel/mis-trabajos`.
7. Entrar como `taller`: no ve Catálogos ni Usuarios; `/panel/catalogos/tiempos` lo devuelve a `/panel`. Como `gerencia`: ve Joyeros sin botones ni formularios.
8. Catálogos → Tipos de trabajo: crear uno con el nombre de otro existente → mensaje de duplicado.

## Decisiones tomadas (donde el documento callaba)

- `creado_en` / `actualizado_en` según el documento; la fundación del esquema se editó antes de aplicarla, no después.
- Tarifas inmutables: una nueva cierra la anterior; el historial queda para liquidar (Fase 4).
- Complejidades fijas en la interfaz (nombre, orden y descripción editables; sin alta ni baja).
- Pantalla de usuarios incluida en esta fase para poder enlazar cuentas de joyero sin terminal.
- `requerirJoyero` redirige a `/panel/mis-trabajos` (no a `/login`) cuando la cuenta no está enlazada, para no entrar en bucle; la página explica el caso.
- Edición de catálogos por URL (`?editar=<id>`), igual que la paginación: la URL es el estado.
- Esquema expuesto en PostgREST por SQL (`pgrst.db_schemas` en el rol `authenticator`), conservando los esquemas existentes.

## Pendiente / fuera de esta fase

- Clientes: tabla creada, pantalla en Fase 2.
- Portal del joyero, alertas, kanban: Fase 3.
- Correo: proveedor por decidir; adaptador en Fase 3.
- Rotar la contraseña de la base de datos y la de `admin` cuando el usuario revise.
