-- ─────────────────────────────────────────────────────────────────────────
-- Cliente 360: un renglón por cliente con su historia económica
-- ─────────────────────────────────────────────────────────────────────────

create or replace view joyeria.vw_cliente_360 as
with ent as (
  select * from joyeria.vw_ordenes_economia where estado = 'entregada'
),
brechas as (
  select cliente_id,
         fecha_entrega_real - lag(fecha_entrega_real) over (partition by cliente_id order by fecha_entrega_real, id) as brecha
  from ent
),
tipos as (
  select o.cliente_id, t.nombre,
         row_number() over (partition by o.cliente_id order by count(*) desc, t.nombre) as rn
  from joyeria.ordenes o
  join joyeria.orden_detalle d on d.orden_id = o.id
  join joyeria.tipos_trabajo t on t.id = d.tipo_trabajo_id
  where o.estado = 'entregada'
  group by o.cliente_id, t.nombre
),
param as (
  select coalesce((select case when valor ~ '^[0-9]+$' then valor::integer end from joyeria.parametros where clave = 'cliente_inactivo_dias'), 180) as dias
),
hoy as (
  select (now() at time zone 'America/Guatemala')::date as hoy
)
select
  c.id,
  c.nombre,
  c.telefono,
  c.correo,
  c.activo,
  count(e.id)::integer as total_ordenes,
  coalesce(sum(e.precio_cliente), 0)::numeric(12, 2) as total_facturado,
  coalesce(sum(e.utilidad), 0)::numeric(12, 2) as utilidad_generada,
  case when count(e.id) > 0 then round(avg(e.precio_cliente), 2) end as ticket_promedio,
  case when count(e.id) > 0 then round(avg(e.utilidad), 2) end as utilidad_promedio,
  min(e.fecha_entrega_real) as fecha_primer_servicio,
  max(e.fecha_entrega_real) as fecha_ultimo_servicio,
  case when max(e.fecha_entrega_real) is not null then (select hoy from hoy) - max(e.fecha_entrega_real) end as dias_desde_ultimo_servicio,
  (select round(avg(b.brecha), 1) from brechas b where b.cliente_id = c.id and b.brecha is not null) as frecuencia_promedio_dias,
  (select t.nombre from tipos t where t.cliente_id = c.id and t.rn = 1) as tipo_trabajo_mas_frecuente,
  case when count(e.id) > 0 then min(e.precio_cliente) end as precio_minimo,
  case when count(e.id) > 0 then max(e.precio_cliente) end as precio_maximo,
  (count(e.id) >= 2) as es_recurrente,
  (max(e.fecha_entrega_real) is not null and (select hoy from hoy) - max(e.fecha_entrega_real) > (select dias from param)) as inactivo,
  (select count(*)::integer from joyeria.ordenes o where o.cliente_id = c.id and o.estado not in ('entregada', 'rechazada', 'anulada')) as ordenes_activas,
  (select count(*)::integer from joyeria.ordenes o where o.cliente_id = c.id and o.es_garantia) as garantias
from joyeria.clientes c
left join ent e on e.cliente_id = c.id
group by c.id;

comment on view joyeria.vw_cliente_360 is
  'Valor acumulado, recompra, frecuencia y preferencias por cliente. Solo cuentan las órdenes entregadas.';

create or replace function joyeria.fn_tasa_recompra()
returns table (clientes_con_servicio integer, clientes_recurrentes integer, tasa_recompra_pct numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  select
    count(*) filter (where total_ordenes >= 1)::integer,
    count(*) filter (where total_ordenes >= 2)::integer,
    round(100.0 * count(*) filter (where total_ordenes >= 2) / nullif(count(*) filter (where total_ordenes >= 1), 0), 1)
  from joyeria.vw_cliente_360;
$$;

create or replace function joyeria.fn_ranking_clientes(p_desde date, p_hasta date, p_criterio text default 'facturacion', p_limite integer default 10)
returns table (cliente_id bigint, cliente text, ordenes integer, facturado numeric, utilidad numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  select e.cliente_id, e.cliente, count(*)::integer, coalesce(sum(e.precio_cliente), 0), coalesce(sum(e.utilidad), 0)
  from joyeria.vw_ordenes_economia e
  where e.estado = 'entregada' and e.fecha_entrega_real between p_desde and p_hasta
  group by e.cliente_id, e.cliente
  order by case when p_criterio = 'utilidad' then coalesce(sum(e.utilidad), 0) else coalesce(sum(e.precio_cliente), 0) end desc, e.cliente
  limit greatest(coalesce(p_limite, 10), 1);
$$;

-- Nuevo = su primera orden entregada cae en el período; recurrente = ya tenía entregas antes.
create or replace function joyeria.fn_ingresos_nuevos_vs_recurrentes(p_desde date, p_hasta date)
returns table (segmento text, clientes integer, ordenes integer, ingreso numeric, utilidad numeric)
language sql
security invoker
set search_path = ''
stable
as $$
  with primera as (
    select cliente_id, min(fecha_entrega_real) as primera
    from joyeria.vw_ordenes_economia where estado = 'entregada' group by cliente_id
  ),
  e as (
    select e.*, case when p.primera between p_desde and p_hasta then 'nuevos' else 'recurrentes' end as segmento
    from joyeria.vw_ordenes_economia e
    join primera p on p.cliente_id = e.cliente_id
    where e.estado = 'entregada' and e.fecha_entrega_real between p_desde and p_hasta
  )
  select s.segmento,
         count(distinct e.cliente_id)::integer,
         count(e.id)::integer,
         coalesce(sum(e.precio_cliente), 0),
         coalesce(sum(e.utilidad), 0)
  from (values ('nuevos'), ('recurrentes')) as s(segmento)
  left join e on e.segmento = s.segmento
  group by s.segmento
  order by s.segmento;
$$;
