# 02 · Fase 2 — Órdenes y cotizaciones

Cerrada el 2026-10-03. Verificación: `npm test` (72 unitarias), `npm run check`, `npm run build`, `npm run test:fase2` (35 comprobaciones contra la base) y `npm run test:humo` (páginas por rol).

## Lo construido

**Base de datos** (migraciones `20261004100000` a `20261004140000`, aplicadas)
- `ordenes` (pieza, fechas, precio al cliente, garantía, `fecha_prometida_manual`, `entregada_con_saldo`), `orden_detalle`, `orden_estados_historial`, `fotografias`, `correlativos`, `transiciones_estado` (sembrada con la tabla del documento; una prueba unitaria comprueba que la constante de TypeScript coincide con la semilla).
- Enums `estado_orden`, `momento_foto`, `estado_cotizacion`. `cotizaciones` (versionadas; solo una enviada/aprobada y un borrador por orden), `cotizacion_detalle`, `disenos`.
- Funciones: `fn_siguiente_numero` (REP-2026-00001 / CRE-2026-00001, con bloqueo de fila: seis llamadas simultáneas no repiten), **`fn_cambiar_estado_orden`** (única puerta: valida transición, precondiciones y escribe historial en una transacción), trigger **`ordenes_estado_guardia`** (rechaza cualquier `update` de `estado` fuera de la función, y cualquier cambio sobre una orden entregada), `fn_anotar_orden`, `fn_crear_orden`, `fn_nueva_version_cotizacion`, `fn_guardar_cotizacion` + `fn_recalcular_cotizacion`, `fn_enviar_cotizacion`, `fn_aprobar_cotizacion`, `fn_rechazar_cotizacion`, `fn_vencer_cotizaciones`.
- Vista `vw_ordenes_tablero`: orden + cliente + trabajos + cotización vigente + `fecha_control` (la fecha contra la que se mide el semáforo; en la Fase 3 pasa a ser la del joyero cuando la pieza está en sus manos).

**Lógica pura con pruebas** (`src/lib/reparaciones/`): `estados.ts` (transiciones, destinos, fecha de control, tipo de mora), `tiempos.ts` (suma de días por línea, `FaltaTiempoEstandar` con la lista de combinaciones faltantes, fechas derivadas, recálculo respetando la fecha manual), `cotizaciones.ts` (totales, margen, umbral 25 %, estado efectivo), `numero-orden.ts`.

**Storage y archivos**: bucket privado `reparaciones` (creado con `npm run storage:preparar`); subida por archivo a `POST /api/archivos` (destino `tmp`, `foto` o `diseno`) con reducción a ≤1600 px / WebP en el navegador; lectura por `GET /api/archivos/{foto|diseno}/{id}` que valida la sesión y redirige a una URL firmada de 2 minutos. Las fotos del asistente van a `tmp/` y `crearOrden` las mueve a la orden.

**PDF** (`@react-pdf/renderer` + `sharp` para convertir WebP → JPEG): comprobante de recepción (`/api/ordenes/{id}/recepcion`, con hasta 4 fotos de entrada) y cotización para el cliente (`/api/cotizaciones/{id}/pdf`: precio por línea y total; **nunca** costo del joyero ni utilidad).

**Pantallas**
- `/panel/clientes` (buscador, paginación por URL, alta/edición, activar/desactivar) · `/panel/clientes/[id]` con sus órdenes y semáforos.
- `/panel/ordenes`: tabla con filtros por estado (activas por defecto), tipo, rango de recepción, orden por fecha de control; buscador por número, cliente o pieza; semáforo por fila.
- `/panel/ordenes/nueva`: asistente en tres pasos (cliente con búsqueda y alta rápida → pieza y fotos → trabajos) con **días y fechas calculándose en vivo** con los mismos módulos puros del servidor; fecha prometida ajustable (queda marcada como manual); si falta una combinación en la matriz lo dice en pantalla y el servidor bloquea igual.
- `/panel/ordenes/[id]`: encabezado (número, tipo, estado, semáforo, fechas, precio), comprobante PDF, anulación con motivo, pestañas por URL: Pieza (edición, trabajos, fecha prometida manual) · Cotizaciones (versiones con margen, PDF, nueva versión) · Diseños (solo creación: subir versiones, aprobar, comentarios) · Fotografías (por momento, subir/eliminar) · Historial.
- `/panel/ordenes/[id]/cotizaciones/[cotizacionId]`: cotizador con margen en vivo (rojo bajo 25 %, no bloquea), guardar borrador, guardar y enviar (vigencia desde parámetros), aprobar (nombre de quien aprueba; copia líneas y precio a la orden, recalcula fechas desde hoy) y rechazar.

**Jobs**: `GET /api/cron/vencer-cotizaciones` (diario 06:00 UTC = 00:00 GT) y `GET /api/cron/limpiar-temporales` (domingos), protegidos con `CRON_SECRET`, declarados en `vercel.json`.

## Cómo probar a mano (criterios 1, 2 y 3 del documento)

1. Catálogos → Tiempos estándar: definir al menos «Cambio de medida · Baja» y «Engaste de piedra · Media» (p. ej. 2 y 4 días).
2. Nueva recepción: elegir o crear cliente → describir la pieza, subir 2–3 fotos desde el celular → agregar los dos trabajos. El panel verde muestra 6 días hábiles, la entrega estimada y la prometida (+2 de holgura), saltando el feriado del 20 de octubre si cae en medio. **Criterio 1.**
3. Volver a Catálogos → Tiempos y vaciar una de las dos celdas. Repetir la recepción: el asistente avisa «Falta parametrizar…» con la combinación exacta y el botón no deja crear; si se fuerza el envío, el servidor responde con el mismo mensaje. **Criterio 2.**
4. En la orden → Cotizaciones → COTIZAR: poner precios y costos, ver el margen; guardar y enviar. NUEVA VERSIÓN dos veces más (la anterior pasa a reemplazada). Aprobar la tercera con un nombre: la orden queda aprobada, la pestaña Pieza muestra las líneas con precio y el encabezado el total, sin volver a escribir nada. **Criterio 3.**
5. Bajar un precio hasta que el margen quede bajo 25 %: el resumen se pone rojo y avisa; sigue dejando enviar.
6. PDF de cotización: no aparece el costo del joyero. PDF de recepción: aparecen las fotos de entrada.
7. Creación: el botón Aprobar se bloquea hasta marcar un diseño como aprobado en la pestaña Diseños.
8. `npm run db:sql -- "update joyeria.ordenes set estado = 'aprobada' where id = 1"` → la base responde que el estado solo se cambia con `fn_cambiar_estado_orden`.

## Decisiones tomadas (donde el documento callaba)

- Al **aprobar** la cotización, las fechas se recalculan tomando como base **la fecha de aprobación**, no la de recepción: el joyero no puede empezar antes. Si la fecha prometida se había fijado a mano, se respeta.
- Los días por línea son los de la matriz **sin multiplicar por cantidad** (el documento suma «por cada línea»).
- Una cotización enviada con validez pasada **se muestra vencida** aunque el job diario no haya corrido; la acción de aprobar la marca vencida antes de rechazar la aprobación. (La función SQL no puede marcar y lanzar en la misma transacción; migración `20261004140000`.)
- Un solo borrador por orden; «Nueva versión» clona la última (o arranca de los trabajos de la recepción). Las versiones enviadas o vencidas pasan a reemplazada; las aprobadas/rechazadas no se tocan.
- Anulación: motivo obligatorio (mínimo 5 caracteres); nunca sobre entregada ni anulada.
- Fotos: subida por archivo (límite 4 MB tras reducir en el navegador) y lectura por redirección a URL firmada; nunca se exponen rutas del bucket. HEIC se acepta sin reducir (iOS lo manda así).
- El rol joyero no accede a archivos hasta la Fase 3 (`joyeroTieneOrden` devuelve `false` hasta que existan asignaciones).
- `/panel` sigue siendo el inicio del taller; la lista de órdenes está a un clic y en la barra móvil. Las alertas de la Fase 3 irán al inicio.

## Pendiente / siguiente fase

- Asignación a joyeros, portal del joyero, control de calidad, garantías, alertas, kanban, notificaciones (Fase 3). `vw_ordenes_tablero` ya tiene las columnas de joyero preparadas.
- Pagos y entrega (Fase 3/4): `fn_cambiar_estado_orden` ya exige calidad aprobada, foto de salida y saldo cero para `entregada`.
