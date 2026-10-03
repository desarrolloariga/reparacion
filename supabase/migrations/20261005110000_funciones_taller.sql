-- ─────────────────────────────────────────────────────────────────────────
-- Funciones del taller: asignar, iniciar, terminar, calidad, garantía,
-- entrega. Todas pasan por fn_cambiar_estado_orden para mover la orden.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Asignar un joyero ────────────────────────────────────────────────────
create or replace function joyeria.fn_asignar_joyero(
  p_orden_id bigint,
  p_joyero_id bigint,
  p_costo numeric,
  p_instrucciones text,
  p_fecha_compromiso date,
  p_excede boolean,
  p_usuario_id bigint,
  p_comentario text default null
)
returns joyeria.asignaciones
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orden joyeria.ordenes%rowtype;
  v_joyero joyeria.joyeros%rowtype;
  v_asig joyeria.asignaciones%rowtype;
begin
  select * into v_orden from joyeria.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden no existe' using errcode = 'P0002';
  end if;
  if v_orden.estado <> 'aprobada' then
    raise exception 'Solo se asigna una orden aprobada; esta está %', v_orden.estado using errcode = 'P0001';
  end if;
  select * into v_joyero from joyeria.joyeros where id = p_joyero_id;
  if not found or not v_joyero.activo then
    raise exception 'El joyero no existe o está inactivo' using errcode = 'P0001';
  end if;
  if p_costo is null or p_costo <= 0 then
    raise exception 'El costo pactado debe ser mayor que cero' using errcode = 'P0001';
  end if;
  if p_fecha_compromiso is null then
    raise exception 'La fecha de compromiso es obligatoria' using errcode = 'P0001';
  end if;

  insert into joyeria.asignaciones (orden_id, joyero_id, costo_pactado, instrucciones, fecha_compromiso, excede_fecha_cliente, creado_por)
  values (p_orden_id, p_joyero_id, p_costo, nullif(btrim(coalesce(p_instrucciones, '')), ''), p_fecha_compromiso, coalesce(p_excede, false), p_usuario_id)
  returning * into v_asig;

  perform joyeria.fn_cambiar_estado_orden(
    p_orden_id, 'asignada', p_usuario_id,
    format('Asignada a %s · costo %s · compromiso %s%s%s',
      v_joyero.nombre,
      to_char(p_costo, 'FM999,999,990.00'),
      to_char(p_fecha_compromiso, 'YYYY-MM-DD'),
      case when coalesce(p_excede, false) then ' · supera la fecha prometida al cliente (decisión registrada)' else '' end,
      case when p_comentario is not null and btrim(p_comentario) <> '' then ' · ' || btrim(p_comentario) else '' end)
  );

  return v_asig;
end;
$$;

-- ── Anular la asignación activa (solo si todavía no empezó) ──────────────
create or replace function joyeria.fn_anular_asignacion(
  p_asignacion_id bigint,
  p_usuario_id bigint,
  p_motivo text
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_asig joyeria.asignaciones%rowtype;
begin
  select * into v_asig from joyeria.asignaciones where id = p_asignacion_id for update;
  if not found then
    raise exception 'La asignación no existe' using errcode = 'P0002';
  end if;
  if v_asig.estado <> 'asignada' then
    raise exception 'Solo se anula una asignación que no ha empezado; esta está %', v_asig.estado using errcode = 'P0001';
  end if;

  update joyeria.asignaciones set estado = 'anulada' where id = p_asignacion_id;

  return joyeria.fn_cambiar_estado_orden(v_asig.orden_id, 'aprobada', p_usuario_id,
    'Asignación anulada' || case when p_motivo is not null and btrim(p_motivo) <> '' then ': ' || btrim(p_motivo) else '' end);
end;
$$;

-- ── El joyero empieza ────────────────────────────────────────────────────
create or replace function joyeria.fn_iniciar_trabajo(
  p_asignacion_id bigint,
  p_usuario_id bigint
)
returns joyeria.asignaciones
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_asig joyeria.asignaciones%rowtype;
begin
  select * into v_asig from joyeria.asignaciones where id = p_asignacion_id for update;
  if not found then
    raise exception 'La asignación no existe' using errcode = 'P0002';
  end if;
  if v_asig.estado <> 'asignada' then
    raise exception 'El trabajo ya está %', v_asig.estado using errcode = 'P0001';
  end if;

  update joyeria.asignaciones
  set estado = 'en_proceso', fecha_inicio_real = (now() at time zone 'America/Guatemala')::date
  where id = p_asignacion_id
  returning * into v_asig;

  perform joyeria.fn_cambiar_estado_orden(v_asig.orden_id, 'en_proceso', p_usuario_id, 'El joyero inició el trabajo');
  return v_asig;
end;
$$;

-- ── El joyero termina (la fecha la pone el servidor) ─────────────────────
create or replace function joyeria.fn_terminar_trabajo(
  p_asignacion_id bigint,
  p_usuario_id bigint,
  p_notas text,
  p_dias_reales integer,
  p_desviacion_dias integer
)
returns joyeria.asignaciones
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_asig joyeria.asignaciones%rowtype;
begin
  select * into v_asig from joyeria.asignaciones where id = p_asignacion_id for update;
  if not found then
    raise exception 'La asignación no existe' using errcode = 'P0002';
  end if;
  if v_asig.estado <> 'en_proceso' then
    raise exception 'Solo se termina un trabajo en proceso; este está %', v_asig.estado using errcode = 'P0001';
  end if;

  update joyeria.asignaciones
  set estado = 'terminada',
      fecha_terminado_real = (now() at time zone 'America/Guatemala')::date,
      notas_joyero = coalesce(nullif(btrim(coalesce(p_notas, '')), ''), notas_joyero),
      dias_reales = p_dias_reales,
      desviacion_dias = p_desviacion_dias
  where id = p_asignacion_id
  returning * into v_asig;

  perform joyeria.fn_cambiar_estado_orden(v_asig.orden_id, 'terminada_joyero', p_usuario_id,
    format('El joyero marcó terminado · %s días hábiles reales (desviación %s)', coalesce(p_dias_reales::text, '—'), coalesce(p_desviacion_dias::text, '—')));
  return v_asig;
end;
$$;

-- ── Control de calidad ───────────────────────────────────────────────────
-- Aprobado: la orden queda lista para entrega. Rechazado: la asignación
-- pasa a rechazada_calidad, se abre un retrabajo al mismo joyero con costo
-- cero y la orden vuelve a asignada.
create or replace function joyeria.fn_registrar_calidad(
  p_orden_id bigint,
  p_resultado joyeria.resultado_calidad,
  p_observaciones text,
  p_usuario_id bigint,
  p_fecha_compromiso_retrabajo date default null
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orden joyeria.ordenes%rowtype;
  v_asig joyeria.asignaciones%rowtype;
begin
  select * into v_orden from joyeria.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden no existe' using errcode = 'P0002';
  end if;
  if v_orden.estado <> 'en_control_calidad' then
    raise exception 'La orden no está en control de calidad (está %)', v_orden.estado using errcode = 'P0001';
  end if;

  select * into v_asig from joyeria.asignaciones
  where orden_id = p_orden_id and estado = 'terminada'
  order by id desc limit 1 for update;
  if not found then
    raise exception 'No hay una asignación terminada que revisar' using errcode = 'P0001';
  end if;

  insert into joyeria.control_calidad (orden_id, asignacion_id, resultado, observaciones, revisado_por)
  values (p_orden_id, v_asig.id, p_resultado, nullif(btrim(coalesce(p_observaciones, '')), ''), p_usuario_id);

  if p_resultado = 'aprobado' then
    return joyeria.fn_cambiar_estado_orden(p_orden_id, 'lista_entrega', p_usuario_id,
      'Calidad aprobada' || case when p_observaciones is not null and btrim(p_observaciones) <> '' then ': ' || btrim(p_observaciones) else '' end);
  end if;

  if p_fecha_compromiso_retrabajo is null then
    raise exception 'Indica la fecha de compromiso del retrabajo' using errcode = 'P0001';
  end if;

  update joyeria.asignaciones set estado = 'rechazada_calidad' where id = v_asig.id;

  insert into joyeria.asignaciones (orden_id, joyero_id, costo_pactado, instrucciones, fecha_compromiso, es_retrabajo, creado_por)
  values (p_orden_id, v_asig.joyero_id, 0,
    'RETRABAJO por rechazo de calidad' || case when p_observaciones is not null and btrim(p_observaciones) <> '' then ': ' || btrim(p_observaciones) else '' end,
    p_fecha_compromiso_retrabajo, true, p_usuario_id);

  return joyeria.fn_cambiar_estado_orden(p_orden_id, 'asignada', p_usuario_id,
    'Calidad rechazada: vuelve al joyero como retrabajo sin costo' || case when p_observaciones is not null and btrim(p_observaciones) <> '' then ' · ' || btrim(p_observaciones) else '' end);
end;
$$;

-- ── Garantía: orden nueva ligada a la original ───────────────────────────
-- Sin cobro: precio 0 y la orden nace aprobada (no hay nada que cotizar).
-- Con cobro: nace recibida y sigue el flujo normal de cotización.
create or replace function joyeria.fn_crear_garantia(
  p_orden_origen_id bigint,
  p_cobra boolean,
  p_joyero_responsable_id bigint,
  p_descripcion_pieza text,
  p_observaciones text,
  p_lineas jsonb,
  p_dias_estimados integer,
  p_fecha_estimada date,
  p_fecha_prometida date,
  p_usuario_id bigint
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_origen joyeria.ordenes%rowtype;
  v_nueva joyeria.ordenes%rowtype;
begin
  select * into v_origen from joyeria.ordenes where id = p_orden_origen_id;
  if not found then
    raise exception 'La orden original no existe' using errcode = 'P0002';
  end if;
  if v_origen.estado <> 'entregada' then
    raise exception 'Solo se abre garantía sobre una orden entregada' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(p_lineas, '[]'::jsonb)) = 0 then
    raise exception 'La garantía necesita al menos un trabajo' using errcode = 'P0001';
  end if;

  insert into joyeria.ordenes (
    numero, cliente_id, tipo, descripcion_pieza, material, quilataje, piedras,
    observaciones_recepcion, dias_estimados, fecha_estimada_entrega, fecha_prometida_cliente,
    es_garantia, orden_origen_id, cobra_garantia, joyero_responsable_garantia_id, creado_por
  ) values (
    joyeria.fn_siguiente_numero('REP'), v_origen.cliente_id, 'reparacion',
    coalesce(nullif(btrim(coalesce(p_descripcion_pieza, '')), ''), v_origen.descripcion_pieza),
    v_origen.material, v_origen.quilataje, v_origen.piedras,
    nullif(btrim(coalesce(p_observaciones, '')), ''),
    p_dias_estimados, p_fecha_estimada, p_fecha_prometida,
    true, p_orden_origen_id, coalesce(p_cobra, false), p_joyero_responsable_id, p_usuario_id
  )
  returning * into v_nueva;

  insert into joyeria.orden_detalle (orden_id, tipo_trabajo_id, complejidad_id, descripcion, cantidad, dias_estimados, orden)
  select v_nueva.id, l.tipo_trabajo_id, l.complejidad_id, nullif(l.descripcion, ''), coalesce(l.cantidad, 1), l.dias_estimados, coalesce(l.orden, row_number() over ())
  from jsonb_to_recordset(p_lineas)
    as l(tipo_trabajo_id bigint, complejidad_id bigint, descripcion text, cantidad integer, dias_estimados integer, orden integer);

  insert into joyeria.orden_estados_historial (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  values (v_nueva.id, null, 'recibida', p_usuario_id, format('Garantía de %s%s', v_origen.numero, case when coalesce(p_cobra, false) then ' (con cobro)' else ' (sin cobro)' end));

  if not coalesce(p_cobra, false) then
    -- Nace aprobada: no hay cotización que esperar. Salto controlado.
    perform set_config('joyeria.cambio_estado', '1', true);
    update joyeria.ordenes set estado = 'aprobada', precio_cliente = 0 where id = v_nueva.id returning * into v_nueva;
    perform set_config('joyeria.cambio_estado', '', true);
    insert into joyeria.orden_estados_historial (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
    values (v_nueva.id, 'recibida', 'aprobada', p_usuario_id, 'Garantía sin cobro: aprobada sin cotización');
  end if;

  return v_nueva;
end;
$$;

-- ── Entrega ──────────────────────────────────────────────────────────────
create or replace function joyeria.fn_entregar_orden(
  p_orden_id bigint,
  p_usuario_id bigint,
  p_con_saldo boolean,
  p_comentario text default null
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orden joyeria.ordenes%rowtype;
  v_saldo numeric;
begin
  select * into v_orden from joyeria.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden no existe' using errcode = 'P0002';
  end if;
  v_saldo := v_orden.precio_cliente - coalesce((select sum(monto) from joyeria.pagos_cliente where orden_id = p_orden_id), 0);

  if coalesce(p_con_saldo, false) and v_saldo > 0.009 then
    update joyeria.ordenes set entregada_con_saldo = true where id = p_orden_id;
  end if;

  return joyeria.fn_cambiar_estado_orden(p_orden_id, 'entregada', p_usuario_id,
    case when v_saldo > 0.009 and coalesce(p_con_saldo, false)
      then format('Entregada CON SALDO PENDIENTE de %s', to_char(v_saldo, 'FM999,999,990.00'))
      else 'Entregada' end
    || case when p_comentario is not null and btrim(p_comentario) <> '' then ' · ' || btrim(p_comentario) else '' end);
end;
$$;

-- ── Vistas ───────────────────────────────────────────────────────────────
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
  a.joyero_id,
  j.nombre as joyero,
  a.fecha_compromiso as fecha_compromiso_joyero,
  case when o.estado in ('asignada', 'en_proceso') and a.fecha_compromiso is not null
       then a.fecha_compromiso else o.fecha_prometida_cliente end as fecha_control,
  (select count(*)::integer from joyeria.fotografias f where f.orden_id = o.id) as fotografias,
  o.creado_por,
  o.creado_en,
  o.actualizado_en,
  a.id as asignacion_id,
  a.estado as asignacion_estado,
  a.es_retrabajo,
  coalesce((select sum(p.monto) from joyeria.pagos_cliente p where p.orden_id = o.id), 0)::numeric(12, 2) as cobrado,
  (o.precio_cliente - coalesce((select sum(p.monto) from joyeria.pagos_cliente p where p.orden_id = o.id), 0))::numeric(12, 2) as saldo
from joyeria.ordenes o
join joyeria.clientes c on c.id = o.cliente_id
left join lateral (
  select x.* from joyeria.asignaciones x
  where x.orden_id = o.id and x.estado in ('asignada', 'en_proceso', 'terminada')
  order by x.id desc limit 1
) a on true
left join joyeria.joyeros j on j.id = a.joyero_id;

-- Lo que ve el joyero: nunca precio al cliente, utilidad ni margen.
create or replace view joyeria.vw_trabajos_joyero as
select
  a.id as asignacion_id,
  a.joyero_id,
  a.orden_id,
  o.numero,
  o.tipo,
  o.estado as estado_orden,
  a.estado as estado_asignacion,
  o.descripcion_pieza,
  o.material,
  o.quilataje,
  o.piedras,
  (select string_agg(t.nombre || ' (' || cx.nombre || ')' || coalesce(': ' || d.descripcion, ''), ' · ' order by d.orden, d.id)
     from joyeria.orden_detalle d
     join joyeria.tipos_trabajo t on t.id = d.tipo_trabajo_id
     join joyeria.complejidades cx on cx.id = d.complejidad_id
    where d.orden_id = o.id) as trabajos,
  a.instrucciones,
  a.es_retrabajo,
  a.fecha_asignacion,
  a.fecha_compromiso,
  a.fecha_inicio_real,
  a.fecha_terminado_real,
  a.notas_joyero,
  o.dias_estimados,
  (select count(*)::integer from joyeria.fotografias f where f.orden_id = o.id and f.momento = 'entrada') as fotos_entrada,
  a.creado_en
from joyeria.asignaciones a
join joyeria.ordenes o on o.id = a.orden_id;

comment on view joyeria.vw_trabajos_joyero is
  'Portal del joyero. Sin columnas de dinero del cliente a propósito: el filtro es la propia vista.';

-- ── Carga y desempeño de joyeros ─────────────────────────────────────────
create or replace function joyeria.fn_carga_joyeros()
returns table (
  joyero_id bigint,
  activas integer,
  terminadas integer,
  a_tiempo integer,
  retrabajos integer
)
language sql
security invoker
set search_path = ''
stable
as $$
  select
    j.id as joyero_id,
    (select count(*)::integer from joyeria.asignaciones a where a.joyero_id = j.id and a.estado in ('asignada', 'en_proceso')) as activas,
    (select count(*)::integer from joyeria.asignaciones a where a.joyero_id = j.id and a.estado in ('terminada', 'cerrada', 'rechazada_calidad')) as terminadas,
    (select count(*)::integer from joyeria.asignaciones a where a.joyero_id = j.id and a.estado in ('terminada', 'cerrada', 'rechazada_calidad') and a.fecha_terminado_real <= a.fecha_compromiso) as a_tiempo,
    (select count(*)::integer from joyeria.asignaciones a where a.joyero_id = j.id and a.estado = 'rechazada_calidad') as retrabajos
  from joyeria.joyeros j;
$$;

create or replace function joyeria.fn_desempeno_joyeros(p_desde date, p_hasta date)
returns table (
  joyero_id bigint,
  joyero text,
  activo boolean,
  asignados integer,
  en_proceso integer,
  terminados integer,
  atrasados integer,
  dias_promedio_respuesta numeric,
  cumplimiento_pct numeric,
  retrabajo_pct numeric,
  costo_total numeric,
  pendiente_pago numeric
)
language sql
security invoker
set search_path = ''
stable
as $$
  with term as (
    select a.* from joyeria.asignaciones a
    where a.estado in ('terminada', 'cerrada', 'rechazada_calidad')
      and a.fecha_terminado_real between p_desde and p_hasta
  )
  select
    j.id,
    j.nombre,
    j.activo,
    (select count(*)::integer from joyeria.asignaciones a where a.joyero_id = j.id and a.estado <> 'anulada' and a.fecha_asignacion between p_desde and p_hasta),
    (select count(*)::integer from joyeria.asignaciones a where a.joyero_id = j.id and a.estado in ('asignada', 'en_proceso')),
    (select count(*)::integer from term t where t.joyero_id = j.id),
    (select count(*)::integer from term t where t.joyero_id = j.id and t.fecha_terminado_real > t.fecha_compromiso)
      + (select count(*)::integer from joyeria.asignaciones a where a.joyero_id = j.id and a.estado in ('asignada', 'en_proceso') and a.fecha_compromiso < (now() at time zone 'America/Guatemala')::date),
    (select round(avg(t.fecha_terminado_real - t.fecha_asignacion), 1) from term t where t.joyero_id = j.id),
    (select round(100.0 * count(*) filter (where t.fecha_terminado_real <= t.fecha_compromiso) / nullif(count(*), 0), 1) from term t where t.joyero_id = j.id),
    (select round(100.0 * count(*) filter (where t.estado = 'rechazada_calidad') / nullif(count(*), 0), 1) from term t where t.joyero_id = j.id),
    (select coalesce(sum(t.costo_pactado), 0) from term t where t.joyero_id = j.id),
    (select coalesce(sum(a.costo_pactado), 0) from joyeria.asignaciones a where a.joyero_id = j.id and a.estado in ('terminada', 'rechazada_calidad') and not a.pagada)
  from joyeria.joyeros j
  order by j.activo desc, j.nombre;
$$;
