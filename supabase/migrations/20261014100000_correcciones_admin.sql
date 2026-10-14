-- ─────────────────────────────────────────────────────────────────────────
-- Correcciones del administrador
--
-- El rol admin puede editar y eliminar registros ya cerrados (pagos,
-- órdenes entregadas, asignaciones, historial, clientes, liquidaciones).
-- Cada corrección queda en `auditoria_admin` con el antes, el después y el
-- motivo: el registro cambia, la huella no se pierde.
-- ─────────────────────────────────────────────────────────────────────────

create table joyeria.auditoria_admin (
  id bigint generated always as identity primary key,
  usuario_id bigint references joyeria.usuarios (id) on delete set null,
  entidad text not null,
  entidad_id bigint not null,
  accion text not null check (accion in ('editar', 'eliminar')),
  -- Referencia legible (número de orden, nombre del cliente…) para buscar.
  referencia text,
  antes jsonb,
  despues jsonb,
  motivo text,
  creado_en timestamptz not null default now()
);

create index auditoria_admin_fecha_idx on joyeria.auditoria_admin (creado_en desc);
create index auditoria_admin_entidad_idx on joyeria.auditoria_admin (entidad, entidad_id);

comment on table joyeria.auditoria_admin is
  'Huella de las correcciones del administrador: qué registro, quién, cuándo, antes, después y por qué.';

-- ── Editar una orden (también entregada) ─────────────────────────────────
-- Solo campos de datos y dinero; el estado sigue cambiando únicamente por
-- fn_cambiar_estado_orden. `joyeria.admin` abre el candado de la orden
-- entregada durante esta transacción.
create or replace function joyeria.fn_admin_editar_orden(
  p_orden_id bigint,
  p_cambios jsonb,
  p_usuario_id bigint,
  p_motivo text
)
returns joyeria.ordenes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_antes joyeria.ordenes%rowtype;
  v_despues joyeria.ordenes%rowtype;
  c jsonb := coalesce(p_cambios, '{}'::jsonb);
begin
  select * into v_antes from joyeria.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden no existe' using errcode = 'P0002';
  end if;
  if c ? 'precio_cliente' and (c ->> 'precio_cliente')::numeric < 0 then
    raise exception 'El precio no puede ser negativo' using errcode = 'P0001';
  end if;

  perform set_config('joyeria.admin', '1', true);
  update joyeria.ordenes set
    descripcion_pieza = case when c ? 'descripcion_pieza' then btrim(c ->> 'descripcion_pieza') else descripcion_pieza end,
    material = case when c ? 'material' then nullif(btrim(c ->> 'material'), '') else material end,
    quilataje = case when c ? 'quilataje' then nullif(btrim(c ->> 'quilataje'), '') else quilataje end,
    peso_entrada_g = case when c ? 'peso_entrada_g' then nullif(c ->> 'peso_entrada_g', '')::numeric else peso_entrada_g end,
    peso_salida_g = case when c ? 'peso_salida_g' then nullif(c ->> 'peso_salida_g', '')::numeric else peso_salida_g end,
    piedras = case when c ? 'piedras' then nullif(btrim(c ->> 'piedras'), '') else piedras end,
    observaciones_recepcion = case when c ? 'observaciones_recepcion' then nullif(btrim(c ->> 'observaciones_recepcion'), '') else observaciones_recepcion end,
    fecha_recepcion = case when c ? 'fecha_recepcion' then (c ->> 'fecha_recepcion')::date else fecha_recepcion end,
    fecha_estimada_entrega = case when c ? 'fecha_estimada_entrega' then nullif(c ->> 'fecha_estimada_entrega', '')::date else fecha_estimada_entrega end,
    fecha_prometida_cliente = case when c ? 'fecha_prometida_cliente' then nullif(c ->> 'fecha_prometida_cliente', '')::date else fecha_prometida_cliente end,
    fecha_prometida_manual = case when c ? 'fecha_prometida_cliente' and (c ->> 'fecha_prometida_cliente') is distinct from v_antes.fecha_prometida_cliente::text then true else fecha_prometida_manual end,
    fecha_entrega_real = case when c ? 'fecha_entrega_real' then nullif(c ->> 'fecha_entrega_real', '')::date else fecha_entrega_real end,
    precio_cliente = case when c ? 'precio_cliente' then (c ->> 'precio_cliente')::numeric else precio_cliente end,
    cliente_id = case when c ? 'cliente_id' then (c ->> 'cliente_id')::bigint else cliente_id end
  where id = p_orden_id
  returning * into v_despues;
  perform set_config('joyeria.admin', '', true);

  insert into joyeria.auditoria_admin (usuario_id, entidad, entidad_id, accion, referencia, antes, despues, motivo)
  values (p_usuario_id, 'orden', p_orden_id, 'editar', v_antes.numero, to_jsonb(v_antes), to_jsonb(v_despues), nullif(btrim(coalesce(p_motivo, '')), ''));

  insert into joyeria.orden_estados_historial (orden_id, estado_anterior, estado_nuevo, usuario_id, comentario)
  values (p_orden_id, v_despues.estado, v_despues.estado, p_usuario_id,
    'Corrección de administrador' || case when p_motivo is not null and btrim(p_motivo) <> '' then ': ' || btrim(p_motivo) else '' end);

  return v_despues;
end;
$$;

-- ── Eliminar una orden ───────────────────────────────────────────────────
-- Arrastra sus trabajos, fotos, cotizaciones, asignaciones, calidad, pagos
-- e historial. Se bloquea si tiene garantías hijas o trabajos ya incluidos
-- en una liquidación al joyero (habría que corregir primero esa liquidación).
-- Devuelve las rutas de Storage para que la aplicación borre los archivos.
create or replace function joyeria.fn_admin_eliminar_orden(
  p_orden_id bigint,
  p_usuario_id bigint,
  p_motivo text
)
returns text[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_orden joyeria.ordenes%rowtype;
  v_rutas text[];
begin
  select * into v_orden from joyeria.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden no existe' using errcode = 'P0002';
  end if;
  if exists (select 1 from joyeria.ordenes g where g.orden_origen_id = p_orden_id) then
    raise exception 'La orden tiene garantías ligadas: elimínalas primero' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from joyeria.liquidacion_detalle d
    join joyeria.asignaciones a on a.id = d.asignacion_id
    where a.orden_id = p_orden_id
  ) then
    raise exception 'Hay trabajos de esta orden incluidos en una liquidación al joyero: elimina o corrige primero esa liquidación' using errcode = 'P0001';
  end if;

  select array_agg(r) into v_rutas from (
    select ruta_storage as r from joyeria.fotografias where orden_id = p_orden_id
    union all
    select ruta_storage from joyeria.disenos where orden_id = p_orden_id and ruta_storage is not null
  ) x;

  insert into joyeria.auditoria_admin (usuario_id, entidad, entidad_id, accion, referencia, antes, motivo)
  values (p_usuario_id, 'orden', p_orden_id, 'eliminar', v_orden.numero,
    jsonb_build_object(
      'orden', to_jsonb(v_orden),
      'pagos', coalesce((select jsonb_agg(to_jsonb(p)) from joyeria.pagos_cliente p where p.orden_id = p_orden_id), '[]'::jsonb),
      'asignaciones', coalesce((select jsonb_agg(to_jsonb(a)) from joyeria.asignaciones a where a.orden_id = p_orden_id), '[]'::jsonb)
    ),
    nullif(btrim(coalesce(p_motivo, '')), ''));

  delete from joyeria.ordenes where id = p_orden_id;
  return coalesce(v_rutas, '{}');
end;
$$;

-- ── Eliminar una liquidación (también pagada) ────────────────────────────
-- Devuelve sus trabajos al estado «pendiente de pago».
create or replace function joyeria.fn_admin_eliminar_liquidacion(
  p_liquidacion_id bigint,
  p_usuario_id bigint,
  p_motivo text
)
returns void
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

  update joyeria.asignaciones a
  set pagada = false,
      estado = case when a.estado = 'cerrada' then 'terminada'::joyeria.estado_asignacion else a.estado end
  where a.id in (select d.asignacion_id from joyeria.liquidacion_detalle d where d.liquidacion_id = p_liquidacion_id and not d.es_descuento);

  insert into joyeria.auditoria_admin (usuario_id, entidad, entidad_id, accion, referencia, antes, motivo)
  values (p_usuario_id, 'liquidacion', p_liquidacion_id, 'eliminar',
    (select nombre from joyeria.joyeros where id = v_liq.joyero_id) || ' · ' || v_liq.periodo_desde || ' a ' || v_liq.periodo_hasta,
    jsonb_build_object(
      'liquidacion', to_jsonb(v_liq),
      'lineas', coalesce((select jsonb_agg(to_jsonb(d)) from joyeria.liquidacion_detalle d where d.liquidacion_id = p_liquidacion_id), '[]'::jsonb)
    ),
    nullif(btrim(coalesce(p_motivo, '')), ''));

  delete from joyeria.liquidaciones_joyero where id = p_liquidacion_id;
end;
$$;
