-- ─────────────────────────────────────────────────────────────────────────
-- Funciones de órdenes y cotizaciones
--
-- Todo lo que debe ser atómico vive aquí: numeración, cambio de estado con
-- historial, creación de órdenes, guardado/envío/versionado/aprobación de
-- cotizaciones. La aplicación las llama por RPC y nunca toca `estado`.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Numeración correlativa anual ─────────────────────────────────────────
create or replace function joyeria.fn_siguiente_numero(p_prefijo text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_anio integer := extract(year from (now() at time zone 'America/Guatemala'))::integer;
  v_n integer;
begin
  -- El upsert bloquea la fila: dos recepciones simultáneas no repiten número.
  insert into joyeria.correlativos (prefijo, anio, ultimo)
  values (p_prefijo, v_anio, 1)
  on conflict (prefijo, anio) do update set ultimo = joyeria.correlativos.ultimo + 1
  returning ultimo into v_n;

  return format('%s-%s-%s', p_prefijo, v_anio, lpad(v_n::text, 5, '0'));
end;
$$;

-- ── Guardia: nadie cambia `estado` fuera de fn_cambiar_estado_orden ──────
create or replace function joyeria.fn_guardia_estado_orden()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.estado is distinct from old.estado
     and coalesce(current_setting('joyeria.cambio_estado', true), '') <> '1' then
    raise exception 'El estado de la orden solo se cambia con joyeria.fn_cambiar_estado_orden'
      using errcode = 'P0001';
  end if;
  -- Una orden entregada es inmutable salvo por la propia función de estado.
  if old.estado = 'entregada'
     and coalesce(current_setting('joyeria.cambio_estado', true), '') <> '1'
     and coalesce(current_setting('joyeria.admin', true), '') <> '1' then
    raise exception 'Una orden entregada no se modifica' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger ordenes_estado_guardia
  before update on joyeria.ordenes
  for each row execute function joyeria.fn_guardia_estado_orden();

-- ── Cambio de estado: la única puerta ────────────────────────────────────
create or replace function joyeria.fn_cambiar_estado_orden(
  p_orden_id bigint,
  p_estado_nuevo joyeria.estado_orden,
  p_usuario_id bigint,
  p_comentario text default null
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orden joyeria.ordenes%rowtype;
  v_anterior joyeria.estado_orden;
  v_hoy date := (now() at time zone 'America/Guatemala')::date;
begin
  select * into v_orden from joyeria.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden % no existe', p_orden_id using errcode = 'P0002';
  end if;
  v_anterior := v_orden.estado;

  if p_estado_nuevo = 'anulada' then
    if v_anterior in ('entregada', 'anulada') then
      raise exception 'Una orden % no se puede anular', v_anterior using errcode = 'P0001';
    end if;
    if p_comentario is null or btrim(p_comentario) = '' then
      raise exception 'La anulación exige un motivo' using errcode = 'P0001';
    end if;
  elsif not exists (
    select 1 from joyeria.transiciones_estado t
    where t.desde = v_anterior and t.hacia = p_estado_nuevo
  ) then
    raise exception 'Transición no permitida: % → %', v_anterior, p_estado_nuevo
      using errcode = 'P0001';
  end if;

  if p_estado_nuevo = 'aprobada' and v_anterior = 'cotizada' then
    if not exists (select 1 from joyeria.cotizaciones c where c.orden_id = p_orden_id and c.estado = 'aprobada') then
      raise exception 'Para aprobar la orden hace falta una cotización aprobada' using errcode = 'P0001';
    end if;
    if v_orden.tipo = 'creacion'
       and not exists (select 1 from joyeria.disenos d where d.orden_id = p_orden_id and d.aprobado) then
      raise exception 'Una creación no se aprueba sin un diseño aprobado por el cliente' using errcode = 'P0001';
    end if;
  end if;

  if p_estado_nuevo = 'asignada' then
    if not exists (
      select 1 from joyeria.asignaciones a
      where a.orden_id = p_orden_id and a.estado = 'asignada'
        and a.fecha_compromiso is not null
        and (a.costo_pactado > 0 or a.es_retrabajo)
    ) then
      raise exception 'Para asignar hace falta una asignación activa con costo pactado y fecha de compromiso' using errcode = 'P0001';
    end if;
  end if;

  if p_estado_nuevo = 'entregada' then
    if not exists (
      select 1 from joyeria.control_calidad cc
      where cc.orden_id = p_orden_id and cc.resultado = 'aprobado'
    ) then
      raise exception 'No se entrega sin control de calidad aprobado' using errcode = 'P0001';
    end if;
    if not exists (select 1 from joyeria.fotografias f where f.orden_id = p_orden_id and f.momento = 'salida') then
      raise exception 'No se entrega sin al menos una fotografía de salida' using errcode = 'P0001';
    end if;
    if not v_orden.entregada_con_saldo
       and v_orden.precio_cliente - coalesce((select sum(p.monto) from joyeria.pagos_cliente p where p.orden_id = p_orden_id), 0) > 0.009 then
      raise exception 'La orden tiene saldo pendiente. Registra el cobro o marca la entrega con saldo pendiente' using errcode = 'P0001';
    end if;
  end if;

  perform set_config('joyeria.cambio_estado', '1', true);
  update joyeria.ordenes
  set estado = p_estado_nuevo,
      motivo_anulacion = case when p_estado_nuevo = 'anulada' then btrim(p_comentario) else motivo_anulacion end,
      fecha_entrega_real = case when p_estado_nuevo = 'entregada' then v_hoy else fecha_entrega_real end
  where id = p_orden_id
  returning * into v_orden;
  perform set_config('joyeria.cambio_estado', '', true);

  insert into joyeria.orden_estados_historial (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  values (p_orden_id, v_anterior, p_estado_nuevo, p_usuario_id, nullif(btrim(coalesce(p_comentario, '')), ''));

  return v_orden;
end;
$$;

comment on function joyeria.fn_cambiar_estado_orden is
  'Única puerta de cambio de estado: valida transición y precondiciones, actualiza y escribe el historial, todo en una transacción.';

-- ── Nota en el historial sin cambio de estado ────────────────────────────
create or replace function joyeria.fn_anotar_orden(
  p_orden_id bigint,
  p_usuario_id bigint,
  p_comentario text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_estado joyeria.estado_orden;
begin
  select estado into v_estado from joyeria.ordenes where id = p_orden_id;
  if not found then
    raise exception 'La orden % no existe', p_orden_id using errcode = 'P0002';
  end if;
  insert into joyeria.orden_estados_historial (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  values (p_orden_id, v_estado, v_estado, p_usuario_id, btrim(p_comentario));
end;
$$;

-- ── Creación de la orden (recepción) ─────────────────────────────────────
create or replace function joyeria.fn_crear_orden(
  p_cliente_id bigint,
  p_tipo joyeria.categoria_trabajo,
  p_pieza jsonb,
  p_lineas jsonb,
  p_dias_estimados integer,
  p_fecha_estimada date,
  p_fecha_prometida date,
  p_fecha_prometida_manual boolean,
  p_usuario_id bigint
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orden joyeria.ordenes%rowtype;
  v_numero text;
begin
  if jsonb_array_length(coalesce(p_lineas, '[]'::jsonb)) = 0 then
    raise exception 'La orden necesita al menos un trabajo' using errcode = 'P0001';
  end if;

  v_numero := joyeria.fn_siguiente_numero(case when p_tipo = 'reparacion' then 'REP' else 'CRE' end);

  insert into joyeria.ordenes (
    numero, cliente_id, tipo, descripcion_pieza, material, quilataje, peso_entrada_g,
    piedras, observaciones_recepcion, fecha_recepcion, dias_estimados,
    fecha_estimada_entrega, fecha_prometida_cliente, fecha_prometida_manual, creado_por
  ) values (
    v_numero, p_cliente_id, p_tipo,
    p_pieza ->> 'descripcion_pieza',
    nullif(p_pieza ->> 'material', ''),
    nullif(p_pieza ->> 'quilataje', ''),
    nullif(p_pieza ->> 'peso_entrada_g', '')::numeric,
    nullif(p_pieza ->> 'piedras', ''),
    nullif(p_pieza ->> 'observaciones_recepcion', ''),
    coalesce(nullif(p_pieza ->> 'fecha_recepcion', '')::date, (now() at time zone 'America/Guatemala')::date),
    p_dias_estimados, p_fecha_estimada, p_fecha_prometida, coalesce(p_fecha_prometida_manual, false),
    p_usuario_id
  )
  returning * into v_orden;

  insert into joyeria.orden_detalle (orden_id, tipo_trabajo_id, complejidad_id, descripcion, cantidad, dias_estimados, orden)
  select v_orden.id, l.tipo_trabajo_id, l.complejidad_id, nullif(l.descripcion, ''), coalesce(l.cantidad, 1), l.dias_estimados, coalesce(l.orden, row_number() over ())
  from jsonb_to_recordset(p_lineas)
    as l(tipo_trabajo_id bigint, complejidad_id bigint, descripcion text, cantidad integer, dias_estimados integer, orden integer);

  insert into joyeria.orden_estados_historial (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  values (v_orden.id, null, 'recibida', p_usuario_id, 'Pieza recibida');

  return v_orden;
end;
$$;

-- ── Cotizaciones ─────────────────────────────────────────────────────────

-- Nueva versión: clona la última (o arranca de los trabajos de la orden).
create or replace function joyeria.fn_nueva_version_cotizacion(
  p_orden_id bigint,
  p_usuario_id bigint
)
returns joyeria.cotizaciones
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orden joyeria.ordenes%rowtype;
  v_ultima joyeria.cotizaciones%rowtype;
  v_nueva joyeria.cotizaciones%rowtype;
  v_version integer;
begin
  select * into v_orden from joyeria.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden % no existe', p_orden_id using errcode = 'P0002';
  end if;
  if v_orden.estado not in ('recibida', 'cotizada') then
    raise exception 'La orden está %: ya no se cotiza', v_orden.estado using errcode = 'P0001';
  end if;
  if exists (select 1 from joyeria.cotizaciones c where c.orden_id = p_orden_id and c.estado = 'borrador') then
    raise exception 'Ya hay un borrador de cotización en esta orden' using errcode = 'P0001';
  end if;

  select * into v_ultima from joyeria.cotizaciones
  where orden_id = p_orden_id order by version desc limit 1;

  v_version := coalesce(v_ultima.version, 0) + 1;

  insert into joyeria.cotizaciones (orden_id, version, estado, notas, creado_por)
  values (p_orden_id, v_version, 'borrador', v_ultima.notas, p_usuario_id)
  returning * into v_nueva;

  if v_ultima.id is not null then
    insert into joyeria.cotizacion_detalle (cotizacion_id, tipo_trabajo_id, complejidad_id, descripcion, cantidad, precio_unitario, costo_joyero, orden)
    select v_nueva.id, d.tipo_trabajo_id, d.complejidad_id, d.descripcion, d.cantidad, d.precio_unitario, d.costo_joyero, d.orden
    from joyeria.cotizacion_detalle d where d.cotizacion_id = v_ultima.id;

    if v_ultima.estado in ('enviada', 'vencida') then
      update joyeria.cotizaciones set estado = 'reemplazada' where id = v_ultima.id;
    end if;
  else
    insert into joyeria.cotizacion_detalle (cotizacion_id, tipo_trabajo_id, complejidad_id, descripcion, cantidad, precio_unitario, costo_joyero, orden)
    select v_nueva.id, d.tipo_trabajo_id, d.complejidad_id, d.descripcion, d.cantidad, 0, 0, d.orden
    from joyeria.orden_detalle d where d.orden_id = p_orden_id order by d.orden, d.id;
  end if;

  -- Totales de arranque
  perform joyeria.fn_recalcular_cotizacion(v_nueva.id);

  if v_orden.estado = 'cotizada' then
    perform joyeria.fn_cambiar_estado_orden(p_orden_id, 'cotizada', p_usuario_id, format('Versión %s de la cotización', v_version));
  end if;

  select * into v_nueva from joyeria.cotizaciones where id = v_nueva.id;
  return v_nueva;
end;
$$;

create or replace function joyeria.fn_recalcular_cotizacion(p_cotizacion_id bigint)
returns void
language sql
security invoker
set search_path = ''
as $$
  update joyeria.cotizaciones c
  set total_cliente = t.cliente,
      total_costo_joyero = t.costo,
      utilidad_estimada = t.cliente - t.costo,
      margen_estimado = case when t.cliente > 0 then round((t.cliente - t.costo) / t.cliente * 100, 2) else null end
  from (
    select coalesce(sum(d.cantidad * d.precio_unitario), 0) as cliente,
           coalesce(sum(d.cantidad * d.costo_joyero), 0) as costo
    from joyeria.cotizacion_detalle d where d.cotizacion_id = p_cotizacion_id
  ) t
  where c.id = p_cotizacion_id;
$$;

-- Guarda las líneas de un borrador y recalcula totales, en una transacción.
create or replace function joyeria.fn_guardar_cotizacion(
  p_cotizacion_id bigint,
  p_lineas jsonb,
  p_notas text default null
)
returns joyeria.cotizaciones
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cot joyeria.cotizaciones%rowtype;
begin
  select * into v_cot from joyeria.cotizaciones where id = p_cotizacion_id for update;
  if not found then
    raise exception 'La cotización no existe' using errcode = 'P0002';
  end if;
  if v_cot.estado <> 'borrador' then
    raise exception 'Solo se edita un borrador; esta cotización está %', v_cot.estado using errcode = 'P0001';
  end if;

  delete from joyeria.cotizacion_detalle where cotizacion_id = p_cotizacion_id;

  insert into joyeria.cotizacion_detalle (cotizacion_id, tipo_trabajo_id, complejidad_id, descripcion, cantidad, precio_unitario, costo_joyero, orden)
  select p_cotizacion_id, l.tipo_trabajo_id, l.complejidad_id, nullif(l.descripcion, ''),
         coalesce(l.cantidad, 1), coalesce(l.precio_unitario, 0), coalesce(l.costo_joyero, 0),
         coalesce(l.orden, row_number() over ())
  from jsonb_to_recordset(coalesce(p_lineas, '[]'::jsonb))
    as l(tipo_trabajo_id bigint, complejidad_id bigint, descripcion text, cantidad integer, precio_unitario numeric, costo_joyero numeric, orden integer);

  update joyeria.cotizaciones set notas = nullif(btrim(coalesce(p_notas, '')), '') where id = p_cotizacion_id;
  perform joyeria.fn_recalcular_cotizacion(p_cotizacion_id);

  select * into v_cot from joyeria.cotizaciones where id = p_cotizacion_id;
  return v_cot;
end;
$$;

-- Enviar: borrador → enviada; la orden pasa a cotizada.
create or replace function joyeria.fn_enviar_cotizacion(
  p_cotizacion_id bigint,
  p_usuario_id bigint,
  p_valido_hasta date
)
returns joyeria.cotizaciones
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cot joyeria.cotizaciones%rowtype;
  v_estado joyeria.estado_orden;
begin
  select * into v_cot from joyeria.cotizaciones where id = p_cotizacion_id for update;
  if not found then
    raise exception 'La cotización no existe' using errcode = 'P0002';
  end if;
  if v_cot.estado <> 'borrador' then
    raise exception 'Solo se envía un borrador; esta cotización está %', v_cot.estado using errcode = 'P0001';
  end if;
  if not exists (select 1 from joyeria.cotizacion_detalle d where d.cotizacion_id = p_cotizacion_id) then
    raise exception 'La cotización no tiene líneas' using errcode = 'P0001';
  end if;

  update joyeria.cotizaciones
  set estado = 'enviada', enviada_en = now(), valido_hasta = p_valido_hasta
  where id = p_cotizacion_id
  returning * into v_cot;

  select estado into v_estado from joyeria.ordenes where id = v_cot.orden_id;
  if v_estado = 'recibida' then
    perform joyeria.fn_cambiar_estado_orden(v_cot.orden_id, 'cotizada', p_usuario_id, format('Cotización v%s enviada', v_cot.version));
  elsif v_estado = 'cotizada' then
    perform joyeria.fn_cambiar_estado_orden(v_cot.orden_id, 'cotizada', p_usuario_id, format('Cotización v%s enviada', v_cot.version));
  else
    raise exception 'La orden está %: no admite cotizaciones', v_estado using errcode = 'P0001';
  end if;

  return v_cot;
end;
$$;

-- Aprobar: copia las líneas a la orden, fija precio y fechas, y aprueba la orden.
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
    update joyeria.cotizaciones set estado = 'vencida' where id = p_cotizacion_id;
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

-- Rechazar: enviada → rechazada; la orden queda rechazada.
create or replace function joyeria.fn_rechazar_cotizacion(
  p_cotizacion_id bigint,
  p_motivo text,
  p_usuario_id bigint
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cot joyeria.cotizaciones%rowtype;
begin
  select * into v_cot from joyeria.cotizaciones where id = p_cotizacion_id for update;
  if not found then
    raise exception 'La cotización no existe' using errcode = 'P0002';
  end if;
  if v_cot.estado not in ('enviada', 'vencida') then
    raise exception 'Solo se rechaza una cotización enviada; esta está %', v_cot.estado using errcode = 'P0001';
  end if;

  update joyeria.cotizaciones
  set estado = 'rechazada', motivo_rechazo = nullif(btrim(coalesce(p_motivo, '')), '')
  where id = p_cotizacion_id;

  return joyeria.fn_cambiar_estado_orden(v_cot.orden_id, 'rechazada', p_usuario_id,
    format('Cotización v%s rechazada%s', v_cot.version, case when p_motivo is not null and btrim(p_motivo) <> '' then ': ' || btrim(p_motivo) else '' end));
end;
$$;

-- Job diario: las enviadas cuya validez pasó se marcan vencidas.
create or replace function joyeria.fn_vencer_cotizaciones()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_n integer;
begin
  update joyeria.cotizaciones
  set estado = 'vencida'
  where estado = 'enviada'
    and valido_hasta is not null
    and valido_hasta < (now() at time zone 'America/Guatemala')::date;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
