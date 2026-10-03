# 03 · Fase 3 — Taller

Cerrada el 2026-10-03. Verificación: `npm test` (80 unitarias), `npm run check`, `npm run build`, `npm run test:fase3` (26 comprobaciones contra la base) y `npm run test:humo` (páginas por rol).

## Lo construido

**Base de datos** (migraciones `20261005100000` y `20261005110000`, aplicadas)
- `asignaciones` (costo pactado, instrucciones, fechas de asignación/compromiso/inicio/terminado, `es_retrabajo`, `dias_reales`, `desviacion_dias`, `excede_fecha_cliente`, `pagada`; solo una activa por orden por índice único parcial), `control_calidad`, `pagos_cliente`, `notificaciones`, `correos_salientes`. Enums `estado_asignacion`, `resultado_calidad`, `tipo_pago`, `forma_pago`.
- Funciones: `fn_asignar_joyero` (exige orden aprobada, costo > 0 y fecha; registra en el historial si supera la promesa al cliente), `fn_anular_asignacion` (solo si no empezó; orden vuelve a aprobada), `fn_iniciar_trabajo` / `fn_terminar_trabajo` (fechas del servidor; desviación guardada), `fn_registrar_calidad` (aprobado → lista_entrega; rechazado → asignación `rechazada_calidad` + retrabajo al mismo joyero con costo 0 + orden asignada), `fn_crear_garantia` (orden nueva ligada; sin cobro nace aprobada con precio 0), `fn_entregar_orden`, `fn_carga_joyeros`, `fn_desempeno_joyeros(desde, hasta)`.
- `fn_cambiar_estado_orden` ya aplica las precondiciones de `asignada` (asignación activa con costo o retrabajo) y `entregada` (calidad aprobada, foto de salida, saldo cero o entrega con saldo explícita). El trigger guardián además hace inmutable una orden entregada.
- `vw_ordenes_tablero` ahora trae joyero, compromiso, `fecha_control` real (compromiso del joyero cuando la pieza está en sus manos), cobrado y saldo. `vw_trabajos_joyero`: lo que ve el joyero, **sin ninguna columna de dinero del cliente** (una prueba lo comprueba).

**Lógica pura con pruebas**: `asignacion.ts` (fecha sugerida, tope del joyero, desviación, orden de candidatos por especialidad/carga/cumplimiento/retrabajo, costo sugerido desde tarifas).

**Notificaciones**: tabla en plataforma + campana en la cabecera con contador + `/panel/notificaciones`. Cola de correo con adaptador: proveedor `consola` por defecto (registra y marca enviado) y `resend` listo con `RESEND_API_KEY` + `CORREO_REMITENTE`, sin dependencias nuevas. Eventos: asignación creada (joyero), trabajo terminado (taller), calidad rechazada (joyero), pieza lista (taller + correo al cliente), garantía (taller), resumen diario de alertas (taller) y por vencer (joyero). Crons: `/api/cron/alertas` (07:00 GT), `/api/cron/correos` (cada hora, reintentos).

**Pantallas**
- Ficha de la orden: pestañas **Asignaciones** (diálogo con joyeros ordenados por coincidencia de especialidad, carga/capacidad, cumplimiento, retrabajo y costo sugerido; fecha sugerida y tope; advertencia «supera la fecha prometida» con dos salidas; bloqueo o aviso por capacidad según parámetro; anular asignación), **Calidad** (recibir pieza → aprobar/rechazar con observaciones; el rechazo abre el retrabajo), **Pagos** (precio, cobrado, saldo; registrar cobros; admin puede corregir), **Garantías** (origen ↔ garantías; abrir garantía desde una entregada con joyero responsable y trabajos). Cabecera: **Recibir pieza** y **Entregar** (lista de requisitos, saldo, opción explícita de entrega con saldo).
- `/panel/mis-trabajos` y `/panel/mis-trabajos/[id]` (rol joyero, móvil): pieza, trabajos, instrucciones, fotos de entrada, semáforo contra su compromiso, **Iniciar** / **Marcar terminado** con confirmación, notas. Nada de precios.
- `/panel/alertas`: vencidas y por vencer separadas en mora del joyero y mora frente al cliente; contador en el menú.
- `/panel/tablero`: kanban por estado con arrastrar y soltar nativo y menú «Mover a…»; transiciones inválidas rechazadas con motivo.
- `/panel/joyeros`: tabla comparativa por período (asignados, en proceso, terminados, atrasados, días de respuesta, cumplimiento, retrabajo, costo, pendiente de pago); ficha con trabajos asignados.
- `/panel`: alertas, órdenes activas por estado, últimas órdenes.

## Cómo probar a mano (criterios 4, 5, 6, 7 y 10)

1. Orden aprobada → Asignaciones: elegir un joyero y poner una fecha de compromiso posterior al tope → aparece la advertencia; marcar «asignar de todos modos» → en Historial queda «supera la fecha prometida al cliente (decisión registrada)». **Criterio 4.**
2. Usuarios → crear cuenta rol joyero → Joyeros → ficha → enlazarla. Entrar con esa cuenta desde el celular: solo ve Mis trabajos; abrir el trabajo, Iniciar, Marcar terminado. En ninguna pantalla ni respuesta aparece el precio. **Criterio 5.**
3. Taller: Recibir pieza → Calidad → Rechazar con observaciones → en Asignaciones aparece el retrabajo con costo 0 al mismo joyero; en Joyeros sube su tasa de retrabajo. **Criterio 6.**
4. Terminar el retrabajo, recibir, aprobar calidad, subir foto de salida, registrar el pago, Entregar. Luego Garantías → Abrir garantía sin cobro con joyero responsable: la nueva orden nace aprobada con precio 0 (utilidad negativa al asignarla). **Criterio 7** (el descuento en la liquidación se cierra en la Fase 4).
5. Alertas: una orden asignada con compromiso vencido aparece en «Mora del joyero»; una cotizada con promesa vencida en «Mora frente al cliente». **Criterio 10.**
6. Tablero: arrastrar una recibida a «Asignada» → rechazado con motivo; arrastrar una terminada por joyero a «Calidad» → pasa.
7. Catálogos → Parámetros → activar «bloquear por capacidad» y asignar a un joyero lleno → bloqueado; desactivarlo → solo advierte.

## Decisiones tomadas (donde el documento callaba)

- **Retrabajo**: la asignación original queda `rechazada_calidad` y **sigue siendo liquidable** (el trabajo se hizo; el retrabajo es gratis). La Fase 4 incluye `rechazada_calidad` entre lo pagable.
- **Garantía sin cobro nace aprobada** (salto controlado dentro de la función, con historial): no tiene sentido cotizar 0. Con cobro, sigue el flujo normal.
- Fecha de compromiso del retrabajo: hoy + días estimados de la orden (mínimo 1 hábil).
- `fn_anular_asignacion` solo si la asignación está `asignada` (el documento solo contempla asignada → aprobada).
- `pagos_cliente` y el cobro mínimo entran en esta fase porque la entrega exige saldo cero; la pestaña Pagos ya está completa, los reportes de dinero son Fase 4.
- Correo: proveedor sin decidir → `consola`; el envío se intenta en el momento y el cron reintenta. Si Vercel está en plan Hobby, bajar el cron de correos a diario.
- Kanban sin librería (drag & drop nativo; «Mover a…» para móvil). Las transiciones con datos se hacen en la ficha.
- Portal del joyero: `/panel` y cualquier otra ruta lo redirigen a Mis trabajos; los archivos los ve solo si tiene una asignación en esa orden.

## Pendiente / siguiente fase

- Liquidaciones a joyeros (con descuento de garantías), indicadores económicos, cliente 360, tablero gerencial: Fase 4.
- Proveedor de correo real: pendiente de decisión del usuario (variables `RESEND_API_KEY` y `CORREO_REMITENTE`).
