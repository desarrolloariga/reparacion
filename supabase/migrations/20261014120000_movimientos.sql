-- ─────────────────────────────────────────────────────────────────────────
-- Historial unificado de movimientos
--
-- Una fila por hecho del negocio, con la misma forma para todos los tipos:
--   recepcion     pieza recibida (abre la orden)
--   cotizacion    cotización enviada al cliente (monto ofrecido)
--   venta         orden entregada (ingreso reconocido = precio al cliente)
--   cobro         pago del cliente (entrada de dinero, signo +1)
--   costo_joyero  trabajo encargado a un joyero (costo pactado)
--   pago_joyero   liquidación pagada a un joyero (salida de dinero, signo −1)
--   estado        cambio de estado o nota en el historial de la orden
--
-- `registro_id` es el id de la fila original (pago, asignación, liquidación,
-- historial, cotización u orden): con él la pantalla de Historiales abre la
-- corrección del registro correcto.
-- ─────────────────────────────────────────────────────────────────────────

create or replace view joyeria.vw_movimientos as
-- Recepciones
select
  'recepcion'::text as tipo,
  o.id as registro_id,
  o.fecha_recepcion as fecha,
  o.creado_en as momento,
  o.id as orden_id,
  o.numero,
  o.tipo as categoria,
  o.cliente_id,
  c.nombre as cliente,
  null::bigint as joyero_id,
  null::text as joyero,
  o.creado_por as usuario_id,
  u.nombre as usuario,
  null::numeric as monto,
  null::integer as signo,
  o.descripcion_pieza as detalle,
  null::text as referencia
from joyeria.ordenes o
join joyeria.clientes c on c.id = o.cliente_id
left join joyeria.usuarios u on u.id = o.creado_por

union all
-- Cotizaciones enviadas
select
  'cotizacion', q.id, (q.enviada_en at time zone 'America/Guatemala')::date, q.enviada_en,
  o.id, o.numero, o.tipo, o.cliente_id, c.nombre,
  null::bigint, null::text,
  q.creado_por, u.nombre,
  q.total_cliente, null::integer,
  'Versión ' || q.version || ' · ' || q.estado::text,
  q.aprobada_por_nombre
from joyeria.cotizaciones q
join joyeria.ordenes o on o.id = q.orden_id
join joyeria.clientes c on c.id = o.cliente_id
left join joyeria.usuarios u on u.id = q.creado_por
where q.enviada_en is not null

union all
-- Ventas (entregas)
select
  'venta', o.id, o.fecha_entrega_real, coalesce(h.creado_en, o.actualizado_en, o.creado_en),
  o.id, o.numero, o.tipo, o.cliente_id, c.nombre,
  a.joyero_id, j.nombre,
  h.usuario_id, u.nombre,
  o.precio_cliente, null::integer,
  o.descripcion_pieza || case when o.es_garantia then ' (garantía)' else '' end,
  case when o.entregada_con_saldo then 'entregada con saldo' end
from joyeria.ordenes o
join joyeria.clientes c on c.id = o.cliente_id
left join lateral (
  select hh.usuario_id, hh.creado_en from joyeria.orden_estados_historial hh
  where hh.orden_id = o.id and hh.estado_nuevo = 'entregada' and hh.estado_anterior is distinct from 'entregada'
  order by hh.id desc limit 1
) h on true
left join joyeria.usuarios u on u.id = h.usuario_id
left join lateral (
  select x.joyero_id from joyeria.asignaciones x where x.orden_id = o.id and x.estado <> 'anulada' order by x.id desc limit 1
) a on true
left join joyeria.joyeros j on j.id = a.joyero_id
where o.estado = 'entregada' and o.fecha_entrega_real is not null

union all
-- Cobros a clientes
select
  'cobro', p.id, p.fecha, p.creado_en,
  o.id, o.numero, o.tipo, o.cliente_id, c.nombre,
  null::bigint, null::text,
  p.registrado_por, u.nombre,
  p.monto, 1,
  initcap(p.tipo::text) || ' · ' || p.forma_pago::text,
  p.referencia
from joyeria.pagos_cliente p
join joyeria.ordenes o on o.id = p.orden_id
join joyeria.clientes c on c.id = o.cliente_id
left join joyeria.usuarios u on u.id = p.registrado_por

union all
-- Costos de joyero (asignaciones)
select
  'costo_joyero', a.id, a.fecha_asignacion, a.creado_en,
  o.id, o.numero, o.tipo, o.cliente_id, c.nombre,
  a.joyero_id, j.nombre,
  a.creado_por, u.nombre,
  a.costo_pactado, null::integer,
  replace(a.estado::text, '_', ' ') || case when a.es_retrabajo then ' · retrabajo' else '' end || case when a.pagada then ' · pagada' else '' end,
  null::text
from joyeria.asignaciones a
join joyeria.ordenes o on o.id = a.orden_id
join joyeria.clientes c on c.id = o.cliente_id
join joyeria.joyeros j on j.id = a.joyero_id
left join joyeria.usuarios u on u.id = a.creado_por
where a.estado <> 'anulada'

union all
-- Pagos a joyeros (liquidaciones pagadas)
select
  'pago_joyero', l.id, l.fecha_pago, coalesce(l.actualizado_en, l.creado_en),
  null::bigint, null::text, null::joyeria.categoria_trabajo, null::bigint, null::text,
  l.joyero_id, j.nombre,
  coalesce(l.pagada_por, l.creado_por), u.nombre,
  l.total, -1,
  'Liquidación ' || to_char(l.periodo_desde, 'DD/MM/YYYY') || ' – ' || to_char(l.periodo_hasta, 'DD/MM/YYYY') || coalesce(' · ' || l.forma_pago::text, ''),
  l.referencia
from joyeria.liquidaciones_joyero l
join joyeria.joyeros j on j.id = l.joyero_id
left join joyeria.usuarios u on u.id = coalesce(l.pagada_por, l.creado_por)
where l.estado = 'pagada' and l.fecha_pago is not null

union all
-- Cambios de estado y notas
select
  'estado', h.id, (h.creado_en at time zone 'America/Guatemala')::date, h.creado_en,
  o.id, o.numero, o.tipo, o.cliente_id, c.nombre,
  null::bigint, null::text,
  h.usuario_id, u.nombre,
  null::numeric, null::integer,
  case when h.estado_anterior is not distinct from h.estado_nuevo then 'Nota'
       else coalesce(replace(h.estado_anterior::text, '_', ' '), 'nueva') || ' → ' || replace(h.estado_nuevo::text, '_', ' ') end
    || coalesce(' · ' || h.comentario, ''),
  null::text
from joyeria.orden_estados_historial h
join joyeria.ordenes o on o.id = h.orden_id
join joyeria.clientes c on c.id = o.cliente_id
left join joyeria.usuarios u on u.id = h.usuario_id;

comment on view joyeria.vw_movimientos is
  'Historial unificado: recepciones, cotizaciones, ventas, cobros, costos y pagos a joyeros, cambios de estado. registro_id apunta a la fila original.';
