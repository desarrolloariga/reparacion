-- ─────────────────────────────────────────────────────────────────────────
-- Joyeros (contratistas externos) y clientes
-- ─────────────────────────────────────────────────────────────────────────

-- ── Joyeros ──────────────────────────────────────────────────────────────
create table joyeria.joyeros (
  id bigint generated always as identity primary key,
  nombre text not null check (length(btrim(nombre)) > 0),
  documento text,
  telefono text,
  correo text check (correo is null or correo = lower(btrim(correo))),
  -- Cuenta con rol joyero para entrar a "Mis trabajos". Opcional: un joyero
  -- puede existir en el catálogo sin acceso al sistema.
  usuario_id bigint unique references joyeria.usuarios (id),
  capacidad_maxima integer not null default 5 check (capacidad_maxima > 0),
  activo boolean not null default true,
  notas text,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

create index joyeros_activo_idx on joyeria.joyeros (activo, nombre);

create trigger joyeros_actualizacion
  before update on joyeria.joyeros
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on column joyeria.joyeros.capacidad_maxima is
  'Órdenes simultáneas (asignada o en_proceso) a partir de las cuales se '
  'advierte o se bloquea una asignación nueva (parámetro bloquear_por_capacidad).';

create table joyeria.joyeros_especialidades (
  joyero_id bigint not null references joyeria.joyeros (id) on delete cascade,
  especialidad_id bigint not null references joyeria.especialidades (id),
  primary key (joyero_id, especialidad_id)
);

-- ── Tarifas pactadas por joyero ──────────────────────────────────────────
create table joyeria.tarifas_joyero (
  id bigint generated always as identity primary key,
  joyero_id bigint not null references joyeria.joyeros (id) on delete cascade,
  tipo_trabajo_id bigint not null references joyeria.tipos_trabajo (id),
  -- null = aplica a todas las complejidades.
  complejidad_id bigint references joyeria.complejidades (id),
  costo_acordado numeric(12, 2) not null check (costo_acordado >= 0),
  vigente_desde date not null default ((now() at time zone 'America/Guatemala')::date),
  activo boolean not null default true,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

-- Una sola tarifa vigente por joyero, tipo y complejidad; "todas" (null)
-- cuenta como un valor más gracias a NULLS NOT DISTINCT.
create unique index tarifas_joyero_vigente_unq
  on joyeria.tarifas_joyero (joyero_id, tipo_trabajo_id, complejidad_id)
  nulls not distinct
  where activo;

create index tarifas_joyero_joyero_idx on joyeria.tarifas_joyero (joyero_id, activo);

create trigger tarifas_joyero_actualizacion
  before update on joyeria.tarifas_joyero
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.tarifas_joyero is
  'Historial de costos pactados. No se edita ni se borra: una tarifa nueva '
  'desactiva la anterior. Se usa para proponer el costo al asignar.';

-- ── Clientes ─────────────────────────────────────────────────────────────
create table joyeria.clientes (
  id bigint generated always as identity primary key,
  nombre text not null check (length(btrim(nombre)) > 0),
  -- Sin unique: familiares comparten teléfono.
  telefono text,
  correo text check (correo is null or correo = lower(btrim(correo))),
  direccion text,
  notas text,
  activo boolean not null default true,
  -- Puente futuro al ERP (public.clientes.id). Sin FK a propósito: este
  -- esquema no depende de public.
  erp_cliente_id bigint,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

create index clientes_telefono_idx on joyeria.clientes (telefono);
create index clientes_nombre_idx on joyeria.clientes (lower(nombre));
create index clientes_busqueda_idx
  on joyeria.clientes using gin (to_tsvector('spanish', nombre));

create trigger clientes_actualizacion
  before update on joyeria.clientes
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.clientes is
  'Directorio propio de la joyería. erp_cliente_id enlaza, si se quiere, con public.clientes.';
