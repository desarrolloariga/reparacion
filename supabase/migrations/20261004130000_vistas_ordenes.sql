-- ─────────────────────────────────────────────────────────────────────────
-- Vista de órdenes para listados, tablero y alertas
--
-- `fecha_control` es la fecha contra la que se mide el semáforo: la
-- promesa al cliente, salvo cuando la pieza está en manos del joyero
-- (asignada / en_proceso), que es la fecha de compromiso de la asignación
-- activa. El conteo de días hábiles restantes lo hace TypeScript con el
-- calendario; la vista solo entrega la fecha.
--
-- Las columnas de joyero se rellenan en la Fase 3 (asignaciones); aquí van
-- tipadas para que `create or replace view` las pueda llenar sin cambiar
-- la forma.
-- ─────────────────────────────────────────────────────────────────────────

create or replace view joyeria.vw_ordenes_tablero as
select
  o.id,
  o.numero,
  o.tipo,
  o.estado,
  o.cliente_id,
  c.nombre as cliente,
  c.telefono as cliente_telefono,
  o.descripcion_pieza,
  o.material,
  o.fecha_recepcion,
  o.dias_estimados,
  o.fecha_estimada_entrega,
  o.fecha_prometida_cliente,
  o.fecha_prometida_manual,
  o.fecha_entrega_real,
  o.precio_cliente,
  o.es_garantia,
  o.orden_origen_id,
  (select count(*)::integer from joyeria.orden_detalle d where d.orden_id = o.id) as lineas,
  (select string_agg(t.nombre, ', ' order by d.orden, d.id)
     from joyeria.orden_detalle d join joyeria.tipos_trabajo t on t.id = d.tipo_trabajo_id
    where d.orden_id = o.id) as trabajos,
  (select q.estado from joyeria.cotizaciones q where q.orden_id = o.id order by q.version desc limit 1) as cotizacion_estado,
  (select q.valido_hasta from joyeria.cotizaciones q where q.orden_id = o.id order by q.version desc limit 1) as cotizacion_valido_hasta,
  (select q.version from joyeria.cotizaciones q where q.orden_id = o.id order by q.version desc limit 1) as cotizacion_version,
  null::bigint as joyero_id,
  null::text as joyero,
  null::date as fecha_compromiso_joyero,
  o.fecha_prometida_cliente as fecha_control,
  (select count(*)::integer from joyeria.fotografias f where f.orden_id = o.id) as fotografias,
  o.creado_por,
  o.creado_en,
  o.actualizado_en
from joyeria.ordenes o
join joyeria.clientes c on c.id = o.cliente_id;

comment on view joyeria.vw_ordenes_tablero is
  'Órdenes con cliente, trabajos, cotización vigente y fecha_control para el semáforo.';
