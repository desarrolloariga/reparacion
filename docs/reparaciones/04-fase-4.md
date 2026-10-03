# 04 · Fase 4 — Dinero e indicadores

Cerrada el 2026-10-03. Verificación: `npm test` (92 unitarias), `npm run check`, `npm run build`, `npm run test:fase4` (22 comprobaciones contra la base) y `npm run test:humo` (páginas por rol).

## Lo construido

**Base de datos** (migraciones `20261006100000` a `20261006120000`, aplicadas)
- `liquidaciones_joyero` (borrador → pagada; un borrador por joyero) y `liquidacion_detalle` con **`unique (asignacion_id, es_descuento)`**: una asignación entra una sola vez como pago y, si es garantía, una sola vez como descuento al responsable. `fn_generar_liquidacion` (trabajos terminados —aunque hayan tenido retrabajo— no pagados, por fecha de terminado, más descuentos de garantías si el parámetro lo indica), `fn_confirmar_liquidacion` (marca pagadas y cierra asignaciones), `fn_anular_liquidacion` (solo borradores).
- `vw_ordenes_economia`: precio, cobrado, saldo, costo (Σ asignaciones no anuladas), utilidad, margen, joyero, entregada a tiempo. Funciones por período: `fn_indicadores_operacion`, `fn_tiempo_por_tipo`, `fn_economia_resumen`, `fn_economia_por_joyero`, `fn_economia_por_tipo`, `fn_utilidad_mensual`, `fn_ticket_promedio`.
- `vw_cliente_360` (órdenes entregadas, facturado, utilidad, ticket y utilidad promedio, primer/último servicio, días desde el último, frecuencia promedio, trabajo más frecuente, rango de precio, recurrente, inactivo según parámetro, activas, garantías), `fn_tasa_recompra`, `fn_ranking_clientes`, `fn_ingresos_nuevos_vs_recurrentes`.
- **Regla de reconocimiento**: ingresos, costos y utilidad de un período son los de las órdenes **entregadas** en él (`fecha_entrega_real`), no los cobros. Escrito en el SQL y rotulado en el tablero.

**Lógica pura con pruebas**: `dinero.ts` (saldo, costo, utilidad, margen y previsualización de liquidación idéntica a la función SQL), `periodos.ts` (rangos predefinidos y lectura desde la URL).

**Pantallas**
- `/panel/liquidaciones`: lista; nueva liquidación con **previsualización** (joyero + rango → líneas de pago y descuentos → generar borrador). `/panel/liquidaciones/[id]`: líneas, total, confirmar pago (fecha, forma, referencia), anular borrador, **comprobante PDF** con espacio de firma.
- `/panel/gerencia` (admin y gerencia): selector de período; **Resultado económico** (ingreso, costo, utilidad, margen, cobrado, saldos, pendiente a joyeros, tendencia mensual de 12 meses, ticket promedio, utilidad por tipo), **Operación** (recibidas, entregadas, % a tiempo, días promedio, desviación, conversión de cotizaciones, tiempo por tipo), **Joyeros** (desempeño y utilidad por joyero), **Clientes** (tasa de recompra, nuevos vs recurrentes y su participación, ranking de mayor valor, inactivos con historial).
- `/panel/clientes/[id]`: ficha **Cliente 360**. `/panel/clientes?vista=valor|utilidad`: ranking.
- Pestaña Pagos completa desde la Fase 3; el tablero y las liquidaciones cierran el circuito del dinero.

## Cómo probar a mano (criterios 7, 8, 9 y 11)

1. Con una garantía sin cobro entregada cuyo responsable es el joyero X: Liquidaciones → joyero X → período → previsualizar: aparece el descuento en negativo y la utilidad de la orden de garantía es negativa en Gerencia. **Criterio 7.**
2. Generar el borrador, confirmar el pago; volver a previsualizar el mismo período: no reaparece nada. `npm run db:sql -- "insert into joyeria.liquidacion_detalle (liquidacion_id, asignacion_id, monto) values (…, …, 1)"` con una asignación ya liquidada → la base rechaza por el índice único. **Criterio 8.**
3. Cliente con 2 órdenes entregadas: su ficha muestra recurrente, total facturado, utilidad y días desde el último servicio; sumar a mano sus órdenes en `/panel/ordenes?estado=entregada` coincide con el ranking de `/panel/clientes?vista=valor`. **Criterio 9.**
4. `grep -r "@supabase/supabase-js" src` → solo `src/lib/supabase/server.ts`; todos los módulos de `src/lib/datos` empiezan con `import "server-only"`. **Criterio 11.**
5. Entregar una orden hoy con un pago registrado el mes pasado: en Gerencia, el ingreso cae en este mes y el cobro en el anterior.

## Decisiones tomadas (donde el documento callaba)

- Liquidables: `terminada`, `rechazada_calidad` y `cerrada` no pagadas (el trabajo original se paga aunque haya tenido retrabajo; el retrabajo va a costo 0). Se cuentan por `fecha_terminado_real`.
- Descuento de garantía: el costo de la asignación de la orden de garantía se resta al **joyero responsable**; quien la ejecutó (puede ser otro) cobra ese mismo costo. Si es la misma persona, queda en cero: retrabajo gratis.
- Un solo borrador por joyero; anularlo libera las líneas.
- Costo por tipo de trabajo usa `costo_joyero_estimado` de las líneas (el costo real es por asignación, no por línea). El costo real por orden y por joyero sí es el pactado.
- "Días promedio de reparación" = días naturales entre recepción y entrega; "desviación" = días hábiles reales − estimados de las asignaciones terminadas en el período.
- Cliente nuevo = su primera orden entregada cae en el período.
- Gráficas en SVG propio (barras y serie de tiempo), sin librería.

## Pendiente del usuario

- Proveedor de correo (`RESEND_API_KEY`, `CORREO_REMITENTE`) y revisión de los textos de los correos.
- Variables en Vercel; crons (reducir a diarios en plan Hobby).
- Rotar la contraseña de la base y la de `admin`.
