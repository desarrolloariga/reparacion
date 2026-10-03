-- ─────────────────────────────────────────────────────────────────────────
-- Economía: utilidad por orden, joyero y tipo de trabajo; indicadores de
-- operación; tendencia mensual.
--
-- REGLA DE RECONOCIMIENTO: los ingresos, costos y utilidades de un período
-- son los de las órdenes ENTREGADAS en ese período (fecha_entrega_real),
-- no los pagos cobrados en él. Es la pregunta que siempre surge; queda
-- escrita aquí y rotulada en el tablero.
-- ─────────────────────────────────────────────────────────────────────────

create or replace view joyeria.vw_ordenes_economia as
select
  o.id,
  o.numero,
  o.tipo,
  o.estado,
  o.cliente_id,
  c.nombre as cliente,
  o.fecha_recepcion,
  o.fecha_entrega_real,
  o.fecha_prometida_cliente,
  o.es_garantia,
  o.orden_origen_id,
  o.precio_cliente,
  coalesce(p.cobrado, 0)::numeric(12, 2) as cobrado,
  (o.precio_cliente - coalesce(p.cobrado, 0))::numeric(12, 2) as saldo,
  coalesce(a.costo, 0)::numeric(12, 2) as costo,
  (o.precio_cliente - coalesce(a.costo, 0))::numeric(12, 2) as utilidad,
  case when o.precio_cliente > 0
       then round((o.precio_cliente - coalesce(a.costo, 0)) / o.precio_cliente * 100, 2)
       else null end as margen,
  u.joyero_id,
  j.nombre as joyero,
  (o.fecha_entrega_real <= o.fecha_prometida_cliente) as entregada_a_tiempo
from joyeria.ordenes o
join joyeria.clientes c on c.id = o.cliente_id
left join lateral (select sum(monto) as cobrado from joyeria.pagos_cliente where orden_id = o.id) p on true
left join lateral (select sum(costo_pactado) as costo from joyeria.asignaciones where orden_id = o.id and estado <> 'anulada') a on true
left join lateral (select joyero_id from joyeria.asignaciones where orden_id = o.id and estado <> 'anulada' order by id desc limit 1) u on true
left join joyeria.joyeros j on j.id = u.joyero_id;

comment on view joyeria.vw_ordenes_economia is
  'Dinero por orden: precio, cobrado, saldo, costo (Σ asignaciones no anuladas), utilidad y margen. Ingresos por fecha de entrega.';

-- ── Operación ────────────────────────────────────────────────────────────
create or replace function joyeria.fn_indicadores_operacion(p_desde date, p_hasta date)
returns table (
  recibidas integer,
  activas integer,
  entregadas integer,
  entregadas_a_tiempo integer,
  pct_a_tiempo numeric,
  dias_promedio_total numeric,
  desviacion_promedio numeric,
  cotizaciones_enviadas integer,
  cotizaciones_aprobadas integer,
  conversion_pct numeric
)
language sql
security invoker
set search_path = ''
stable
as $$
  with ent as (
    select * from joyeria.ordenes where estado = 'entregada' and fecha_entrega_real between p_desde and p_hasta
  )
  select
    (select count(*)::integer from joyeria.ordenes where fecha_recepcion between p_desde and p_hasta),
    (select count(*)::integer from joyeria.ordenes where estado not in ('entregada', 'rechazada', 'anulada')),
    (select count(*)::integer from ent),
    (select count(*)::integer from ent where fecha_entrega_real <= fecha_prometida_cliente),
    (select round(100.0 * count(*) filter (where fecha_entrega_real <= fecha_prometida_cliente) / nullif(count(*), 0), 1) from ent),
    (select round(avg(fecha_entrega_real - fecha_recepcion), 1) from ent),
    (select round(avg(desviacion_dias), 1) from joyeria.asignaciones where desviacion_dias is not null and fecha_terminado_real between p_desde and p_hasta),
    (select count(*)::integer from joyeria.cotizaciones where enviada_en::date between p_desde and p_hasta),
    (select count(*)::integer from joyeria.cotizaciones where aprobada_en::date between p_desde and p_hasta),
    (select round(100.0 * (select count(*) from joyeria.cotizaciones where aprobada_en::date between p_desde and p_hasta)
       / nullif((select count(*) from joyeria.cotizaciones where enviada_en::date between p_desde and p_hasta), 0), 1));
$$;

create or replace function joyeria.fn_tiempo_por_tipo(p_desde date, p_hasta date)
returns table (tipo_trabajo_id bigint, tipo_trabajo text, categoria joyeria.categoria_trabajo, ordenes integer, dias_promedio numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  select t.id, t.nombre, t.categoria, count(distinct o.id)::integer, round(avg(o.fecha_entrega_real - o.fecha_recepcion), 1)
  from joyeria.ordenes o
  join joyeria.orden_detalle d on d.orden_id = o.id
  join joyeria.tipos_trabajo t on t.id = d.tipo_trabajo_id
  where o.estado = 'entregada' and o.fecha_entrega_real between p_desde and p_hasta
  group by t.id, t.nombre, t.categoria
  order by count(distinct o.id) desc, t.nombre;
$$;

-- ── Económicos ───────────────────────────────────────────────────────────
create or replace function joyeria.fn_economia_resumen(p_desde date, p_hasta date)
returns table (
  ordenes integer,
  ingreso numeric,
  costo numeric,
  utilidad numeric,
  margen numeric,
  cobrado_en_periodo numeric,
  saldo_pendiente_total numeric,
  pendiente_pago_joyeros numeric,
  garantias integer,
  costo_garantias numeric
)
language sql
security invoker
set search_path = ''
stable
as $$
  with e as (select * from joyeria.vw_ordenes_economia where estado = 'entregada' and fecha_entrega_real between p_desde and p_hasta)
  select
    (select count(*)::integer from e),
    (select coalesce(sum(precio_cliente), 0) from e),
    (select coalesce(sum(costo), 0) from e),
    (select coalesce(sum(utilidad), 0) from e),
    (select case when coalesce(sum(precio_cliente), 0) > 0 then round(sum(utilidad) / sum(precio_cliente) * 100, 1) end from e),
    (select coalesce(sum(monto), 0) from joyeria.pagos_cliente where fecha between p_desde and p_hasta),
    (select coalesce(sum(saldo), 0) from joyeria.vw_ordenes_economia where estado not in ('rechazada', 'anulada') and saldo > 0),
    (select coalesce(sum(costo_pactado), 0) from joyeria.asignaciones where estado in ('terminada', 'rechazada_calidad') and not pagada),
    (select count(*)::integer from e where es_garantia),
    (select coalesce(sum(costo), 0) from e where es_garantia);
$$;

create or replace function joyeria.fn_economia_por_joyero(p_desde date, p_hasta date)
returns table (joyero_id bigint, joyero text, ordenes integer, ingreso numeric, costo numeric, utilidad numeric, margen numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  select e.joyero_id, coalesce(e.joyero, 'Sin joyero'), count(*)::integer,
         coalesce(sum(e.precio_cliente), 0), coalesce(sum(e.costo), 0), coalesce(sum(e.utilidad), 0),
         case when coalesce(sum(e.precio_cliente), 0) > 0 then round(sum(e.utilidad) / sum(e.precio_cliente) * 100, 1) end
  from joyeria.vw_ordenes_economia e
  where e.estado = 'entregada' and e.fecha_entrega_real between p_desde and p_hasta
  group by e.joyero_id, e.joyero
  order by coalesce(sum(e.utilidad), 0) desc;
$$;

create or replace function joyeria.fn_economia_por_tipo(p_desde date, p_hasta date)
returns table (tipo_trabajo_id bigint, tipo_trabajo text, categoria joyeria.categoria_trabajo, lineas integer, ingreso numeric, costo_estimado numeric, utilidad numeric, margen numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  select t.id, t.nombre, t.categoria, count(*)::integer,
         coalesce(sum(d.precio_cliente), 0), coalesce(sum(d.costo_joyero_estimado), 0),
         coalesce(sum(d.precio_cliente - d.costo_joyero_estimado), 0),
         case when coalesce(sum(d.precio_cliente), 0) > 0 then round(sum(d.precio_cliente - d.costo_joyero_estimado) / sum(d.precio_cliente) * 100, 1) end
  from joyeria.ordenes o
  join joyeria.orden_detalle d on d.orden_id = o.id
  join joyeria.tipos_trabajo t on t.id = d.tipo_trabajo_id
  where o.estado = 'entregada' and o.fecha_entrega_real between p_desde and p_hasta
  group by t.id, t.nombre, t.categoria
  order by coalesce(sum(d.precio_cliente), 0) desc;
$$;

create or replace function joyeria.fn_utilidad_mensual(p_meses integer default 12)
returns table (mes date, entregadas integer, ingreso numeric, costo numeric, utilidad numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  with meses as (
    select date_trunc('month', (now() at time zone 'America/Guatemala')::date)::date - (n || ' months')::interval as mes
    from generate_series(greatest(coalesce(p_meses, 12), 1) - 1, 0, -1) as n
  )
  select m.mes::date,
         count(e.id)::integer,
         coalesce(sum(e.precio_cliente), 0),
         coalesce(sum(e.costo), 0),
         coalesce(sum(e.utilidad), 0)
  from meses m
  left join joyeria.vw_ordenes_economia e
    on e.estado = 'entregada' and date_trunc('month', e.fecha_entrega_real)::date = m.mes::date
  group by m.mes
  order by m.mes;
$$;

create or replace function joyeria.fn_ticket_promedio(p_desde date, p_hasta date)
returns table (tipo joyeria.categoria_trabajo, ordenes integer, ticket_promedio numeric, utilidad_promedio numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  select e.tipo, count(*)::integer, round(avg(e.precio_cliente), 2), round(avg(e.utilidad), 2)
  from joyeria.vw_ordenes_economia e
  where e.estado = 'entregada' and e.fecha_entrega_real between p_desde and p_hasta
  group by e.tipo
  order by e.tipo;
$$;
