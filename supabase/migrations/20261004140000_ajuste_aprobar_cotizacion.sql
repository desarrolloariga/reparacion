-- ─────────────────────────────────────────────────────────────────────────
-- Ajuste: fn_aprobar_cotizacion no debe marcar «vencida» antes de lanzar la
-- excepción (la excepción revierte la marca). La marca la pone el job
-- diario (fn_vencer_cotizaciones) o la aplicación antes de llamar aquí.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function joyeria.fn_aprobar_cotizacion(
  p_cotizacion_id bigint,
  p_aprobada_por_nombre text,
  p_usuario_id bigint,
  p_lineas jsonb,
  p_dias_estimados integer,
  p_fecha_estimada date,
  p_fecha_prometida date
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cot joyeria.cotizaciones%rowtype;
  v_orden joyeria.ordenes%rowtype;
  v_hoy date := (now() at time zone 'America/Guatemala')::date;
begin
  select * into v_cot from joyeria.cotizaciones where id = p_cotizacion_id for update;
  if not found then
    raise exception 'La cotización no existe' using errcode = 'P0002';
  end if;
  if v_cot.estado <> 'enviada' then
    raise exception 'Solo se aprueba una cotización enviada; esta está %', v_cot.estado using errcode = 'P0001';
  end if;
  if v_cot.valido_hasta is not null and v_cot.valido_hasta < v_hoy then
    raise exception 'La cotización venció el %. Crea una versión nueva', v_cot.valido_hasta using errcode = 'P0001';
  end if;
  if p_aprobada_por_nombre is null or btrim(p_aprobada_por_nombre) = '' then
    raise exception 'Indica quién aprobó la cotización' using errcode = 'P0001';
  end if;

  select * into v_orden from joyeria.ordenes where id = v_cot.orden_id for update;

  update joyeria.cotizaciones
  set estado = 'aprobada', aprobada_en = now(), aprobada_por_nombre = btrim(p_aprobada_por_nombre)
  where id = p_cotizacion_id
  returning * into v_cot;

  delete from joyeria.orden_detalle where orden_id = v_orden.id;
  insert into joyeria.orden_detalle (orden_id, tipo_trabajo_id, complejidad_id, descripcion, cantidad, dias_estimados, precio_cliente, costo_joyero_estimado, orden)
  select v_orden.id, l.tipo_trabajo_id, l.complejidad_id, nullif(l.descripcion, ''), coalesce(l.cantidad, 1),
         l.dias_estimados, coalesce(l.precio_cliente, 0), coalesce(l.costo_joyero_estimado, 0), coalesce(l.orden, row_number() over ())
  from jsonb_to_recordset(p_lineas)
    as l(tipo_trabajo_id bigint, complejidad_id bigint, descripcion text, cantidad integer, dias_estimados integer, precio_cliente numeric, costo_joyero_estimado numeric, orden integer);

  update joyeria.ordenes
  set precio_cliente = v_cot.total_cliente,
      dias_estimados = p_dias_estimados,
      fecha_estimada_entrega = p_fecha_estimada,
      fecha_prometida_cliente = case when fecha_prometida_manual then fecha_prometida_cliente else p_fecha_prometida end
  where id = v_orden.id;

  return joyeria.fn_cambiar_estado_orden(
    v_orden.id, 'aprobada', p_usuario_id,
    format('Cotización v%s aprobada por %s · %s', v_cot.version, btrim(p_aprobada_por_nombre), to_char(v_cot.total_cliente, 'FM999,999,990.00'))
  );
end;
$$;
