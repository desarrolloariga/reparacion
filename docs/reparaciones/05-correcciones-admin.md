# 05 · Correcciones del administrador

Solo el rol **admin** puede editar o eliminar registros ya hechos. Taller y gerencia no ven estos controles y el servidor los rechaza aunque se intente por otra vía (`requerirAdmin()` en cada acción).

## Qué se puede corregir y dónde

| Registro | Editar | Eliminar | Dónde |
|---|---|---|---|
| Pagos de clientes (ingresos, saldos) | Fecha, monto, tipo, forma, referencia. El total cobrado no puede pasar del precio. | Sí. El saldo vuelve a subir. | Pestaña **Pagos** de la orden y **Dinero → Ingresos** (historial global por período) |
| Órdenes (ventas) | Precio al cliente, fechas (recepción, estimada, prometida, entrega real) y datos de la pieza, **aunque esté entregada**. Motivo obligatorio. | Sí, con todo lo suyo (trabajos, cotizaciones, asignaciones, pagos, fotos, historial). Motivo obligatorio. Se bloquea si tiene garantías ligadas o trabajos ya liquidados al joyero. | Pestaña **Pieza** → «Corrección de la orden» |
| Asignaciones a joyeros (movimientos) | Costo pactado, fechas, instrucciones. El costo no cambia si ya está en una liquidación. | Sí, si no es la asignación activa y no está liquidada. | Pestaña **Asignaciones** |
| Historial de la orden | Comentario | Sí (el estado actual no cambia) | Pestaña **Historial** |
| Clientes | Ya se editaban desde la ficha | Sí, si no tiene órdenes | Ficha del cliente |
| Liquidaciones a joyeros | Fecha, forma de pago, referencia, notas | Sí, **también pagadas**: sus trabajos vuelven a quedar pendientes de pago. Motivo obligatorio. | Ficha de la liquidación |

El **estado** de una orden no se edita: sigue la máquina de estados (`fn_cambiar_estado_orden`).

## Auditoría

Cada corrección queda en `joyeria.auditoria_admin` con quién, cuándo, el motivo, el registro antes y después; en las eliminaciones, una copia completa de lo borrado. Se consulta en **Administración → Auditoría** (solo admin), que muestra campo por campo qué cambió.

## Verificación

- `npm run test:admin`: 15 comprobaciones contra la base (editar orden entregada, inmutabilidad sin la función de admin, auditoría, bloqueos, eliminar y revertir liquidación pagada, eliminar orden con limpieza completa).
- `npm run test:humo`: Ingresos visible para admin/taller/gerencia; Auditoría solo para admin.
- Migración: `20261014100000_correcciones_admin.sql`.
