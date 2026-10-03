-- ─────────────────────────────────────────────────────────────────────────
-- Liquidaciones a joyeros
--
-- Una liquidación agrupa las asignaciones terminadas y no pagadas de un
-- joyero en un período, más los descuentos por garantías de las que es
-- responsable. Una asignación entra una sola vez como pago y, si es una
-- garantía, una sola vez como descuento al responsable: lo garantiza el
-- índice único (asignacion_id, es_descuento).
-- ─────────────────────────────────────────────────────────────────────────

create table joyeria.liquidaciones_joyero (
  id bigint generated always as identity primary key,
  joyero_id bigint not null references joyeria.joyeros (id),
  periodo_desde date not null,
  periodo_hasta date not null,
  total numeric(12, 2) not null default 0,
  fecha_pago date,
  forma_pago joyeria.forma_pago,
  referencia text,
  estado text not null default 'borrador' check (estado in ('borrador', 'pagada')),
  notas text,
  creado_por bigint references joyeria.usuarios (id),
  pagada_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz,
  constraint liquidaciones_periodo check (periodo_hasta >= periodo_desde)
);

-- Un borrador por joyero a la vez: se confirma o se anula antes de abrir otro.
create unique index liquidaciones_borrador_unq
  on joyeria.liquidaciones_joyero (joyero_id)
  where estado = 'borrador';

create index liquidaciones_joyero_idx on joyeria.liquidaciones_joyero (joyero_id, estado, fecha_pago);

create trigger liquidaciones_joyero_actualizacion
  before update on joyeria.liquidaciones_joyero
  for each row execute function joyeria.fn_marcar_actualizacion();

create table joyeria.liquidacion_detalle (
  id bigint generated always as identity primary key,
  liquidacion_id bigint not null references joyeria.liquidaciones_joyero (id) on delete cascade,
  asignacion_id bigint not null references joyeria.asignaciones (id),
  monto numeric(12, 2) not null,
  es_descuento boolean not null default false,
  concepto text,
  creado_en timestamptz not null default now(),
  -- La misma asignación no se paga dos veces ni se descuenta dos veces.
  unique (asignacion_id, es_descuento)
);

create index liquidacion_detalle_liquidacion_idx on joyeria.liquidacion_detalle (liquidacion_id);

comment on table joyeria.liquidacion_detalle is
  'Líneas de una liquidación: pagos (monto positivo) y descuentos por garantía (es_descuento, monto negativo).';

-- ── Generar borrador ─────────────────────────────────────────────────────
create or replace function joyeria.fn_generar_liquidacion(
  p_joyero_id bigint,
  p_desde date,
  p_hasta date,
  p_usuario_id bigint
)
returns joyeria.liquidaciones_joyero
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_liq joyeria.liquidaciones_joyero%rowtype;
  v_descontar boolean;
  v_total numeric;
begin
  if not exists (select 1 from joyeria.joyeros where id = p_joyero_id) then
    raise exception 'El joyero no existe' using errcode = 'P0002';
  end if;
  if exists (select 1 from joyeria.liquidaciones_joyero where joyero_id = p_joyero_id and estado = 'borrador') then
    raise exception 'Ya hay una liquidación en borrador para este joyero: confírmala o anúlala antes de abrir otra' using errcode = 'P0001';
  end if;

  select lower(coalesce((select valor from joyeria.parametros where clave = 'descontar_garantia_al_joyero'), 'true')) in ('true', '1', 'si', 'sí', 'on')
  into v_descontar;

  insert into joyeria.liquidaciones_joyero (joyero_id, periodo_desde, periodo_hasta, creado_por)
  values (p_joyero_id, p_desde, p_hasta, p_usuario_id)
  returning * into v_liq;

  -- Pagos: trabajos terminados (con o sin retrabajo posterior) no pagados.
  insert into joyeria.liquidacion_detalle (liquidacion_id, asignacion_id, monto, es_descuento, concepto)
  select v_liq.id, a.id, a.costo_pactado, false,
         o.numero || ' · ' || o.descripcion_pieza || case when a.es_retrabajo then ' (retrabajo)' else '' end
  from joyeria.asignaciones a
  join joyeria.ordenes o on o.id = a.orden_id
  where a.joyero_id = p_joyero_id
    and a.estado in ('terminada', 'rechazada_calidad', 'cerrada')
    and not a.pagada
    and a.costo_pactado > 0
    and a.fecha_terminado_real between p_desde and p_hasta
    and not exists (select 1 from joyeria.liquidacion_detalle d where d.asignacion_id = a.id and not d.es_descuento)
  order by a.fecha_terminado_real, a.id;

  -- Descuentos: costo de las garantías de las que este joyero es responsable.
  if v_descontar then
    insert into joyeria.liquidacion_detalle (liquidacion_id, asignacion_id, monto, es_descuento, concepto)
    select v_liq.id, a.id, -a.costo_pactado, true,
           'Descuento por garantía ' || o.numero || ' (origen ' || og.numero || ')'
    from joyeria.asignaciones a
    join joyeria.ordenes o on o.id = a.orden_id
    join joyeria.ordenes og on og.id = o.orden_origen_id
    where o.es_garantia
      and o.joyero_responsable_garantia_id = p_joyero_id
      and a.estado in ('terminada', 'rechazada_calidad', 'cerrada')
      and a.costo_pactado > 0
      and a.fecha_terminado_real between p_desde and p_hasta
      and not exists (select 1 from joyeria.liquidacion_detalle d where d.asignacion_id = a.id and d.es_descuento)
    order by a.fecha_terminado_real, a.id;
  end if;

  if not exists (select 1 from joyeria.liquidacion_detalle where liquidacion_id = v_liq.id) then
    delete from joyeria.liquidaciones_joyero where id = v_liq.id;
    raise exception 'No hay trabajos pendientes de pago ni descuentos en ese período' using errcode = 'P0001';
  end if;

  select coalesce(sum(monto), 0) into v_total from joyeria.liquidacion_detalle where liquidacion_id = v_liq.id;
  update joyeria.liquidaciones_joyero set total = v_total where id = v_liq.id returning * into v_liq;
  return v_liq;
end;
$$;

-- ── Confirmar: queda pagada y las asignaciones cerradas ──────────────────
create or replace function joyeria.fn_confirmar_liquidacion(
  p_liquidacion_id bigint,
  p_fecha_pago date,
  p_forma_pago joyeria.forma_pago,
  p_referencia text,
  p_usuario_id bigint
)
returns joyeria.liquidaciones_joyero
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_liq joyeria.liquidaciones_joyero%rowtype;
begin
  select * into v_liq from joyeria.liquidaciones_joyero where id = p_liquidacion_id for update;
  if not found then
    raise exception 'La liquidación no existe' using errcode = 'P0002';
  end if;
  if v_liq.estado <> 'borrador' then
    raise exception 'La liquidación ya está %', v_liq.estado using errcode = 'P0001';
  end if;

  update joyeria.asignaciones a
  set pagada = true,
      estado = case when a.estado = 'terminada' then 'cerrada'::joyeria.estado_asignacion else a.estado end
  where a.id in (select d.asignacion_id from joyeria.liquidacion_detalle d where d.liquidacion_id = p_liquidacion_id and not d.es_descuento);

  update joyeria.liquidaciones_joyero
  set estado = 'pagada',
      fecha_pago = coalesce(p_fecha_pago, (now() at time zone 'America/Guatemala')::date),
      forma_pago = p_forma_pago,
      referencia = nullif(btrim(coalesce(p_referencia, '')), ''),
      pagada_por = p_usuario_id
  where id = p_liquidacion_id
  returning * into v_liq;

  return v_liq;
end;
$$;

-- ── Anular un borrador (las líneas se liberan) ───────────────────────────
create or replace function joyeria.fn_anular_liquidacion(p_liquidacion_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_estado text;
begin
  select estado into v_estado from joyeria.liquidaciones_joyero where id = p_liquidacion_id for update;
  if not found then
    raise exception 'La liquidación no existe' using errcode = 'P0002';
  end if;
  if v_estado <> 'borrador' then
    raise exception 'Una liquidación pagada no se anula' using errcode = 'P0001';
  end if;
  delete from joyeria.liquidaciones_joyero where id = p_liquidacion_id;
end;
$$;
