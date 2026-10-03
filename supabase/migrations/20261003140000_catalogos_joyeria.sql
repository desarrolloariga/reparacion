-- ─────────────────────────────────────────────────────────────────────────
-- Catálogos del taller
--
-- Especialidades, tipos de trabajo, complejidades, la matriz de tiempos
-- estándar (corazón del cálculo automático de fechas), parámetros y el
-- calendario laboral. Todo administrable desde la interfaz por el rol admin.
-- ─────────────────────────────────────────────────────────────────────────

create type joyeria.categoria_trabajo as enum ('reparacion', 'creacion');

-- ── Especialidades ───────────────────────────────────────────────────────
create table joyeria.especialidades (
  id bigint generated always as identity primary key,
  nombre text not null unique check (length(btrim(nombre)) > 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

create trigger especialidades_actualizacion
  before update on joyeria.especialidades
  for each row execute function joyeria.fn_marcar_actualizacion();

-- ── Tipos de trabajo ─────────────────────────────────────────────────────
create table joyeria.tipos_trabajo (
  id bigint generated always as identity primary key,
  nombre text not null check (length(btrim(nombre)) > 0),
  categoria joyeria.categoria_trabajo not null,
  especialidad_id bigint references joyeria.especialidades (id),
  descripcion text,
  activo boolean not null default true,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

create unique index tipos_trabajo_nombre_unq
  on joyeria.tipos_trabajo (lower(btrim(nombre)));
create index tipos_trabajo_categoria_idx
  on joyeria.tipos_trabajo (categoria, activo);

create trigger tipos_trabajo_actualizacion
  before update on joyeria.tipos_trabajo
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.tipos_trabajo is
  'Qué se le hace a una pieza. La categoría separa reparación de creación.';

-- ── Complejidades ────────────────────────────────────────────────────────
create table joyeria.complejidades (
  id bigint generated always as identity primary key,
  nombre text not null unique check (length(btrim(nombre)) > 0),
  orden integer not null unique check (orden > 0),
  descripcion text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

create trigger complejidades_actualizacion
  before update on joyeria.complejidades
  for each row execute function joyeria.fn_marcar_actualizacion();

-- ── Tiempos estándar: matriz tipo de trabajo × complejidad ───────────────
create table joyeria.tiempos_estandar (
  id bigint generated always as identity primary key,
  tipo_trabajo_id bigint not null references joyeria.tipos_trabajo (id) on delete cascade,
  complejidad_id bigint not null references joyeria.complejidades (id),
  dias_habiles integer not null check (dias_habiles > 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz,
  unique (tipo_trabajo_id, complejidad_id)
);

create trigger tiempos_estandar_actualizacion
  before update on joyeria.tiempos_estandar
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.tiempos_estandar is
  'Días hábiles por combinación. Si falta una combinación, la recepción se '
  'bloquea en vez de asumir un valor: la calibra ARIGA desde la interfaz.';

-- ── Parámetros (clave-valor) ─────────────────────────────────────────────
create table joyeria.parametros (
  id bigint generated always as identity primary key,
  clave text not null unique check (clave ~ '^[a-z][a-z0-9_]*$'),
  valor text not null,
  tipo_dato text not null check (tipo_dato in ('entero', 'booleano', 'texto', 'json')),
  grupo text not null default 'general',
  descripcion text,
  actualizado_en timestamptz
);

create trigger parametros_actualizacion
  before update on joyeria.parametros
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.parametros is
  'Una fila por clave. El tipado y los valores por defecto viven en '
  'src/lib/reparaciones/parametros.ts; la base solo guarda el texto.';

-- ── Calendario laboral ───────────────────────────────────────────────────
create table joyeria.calendario_laboral (
  id bigint generated always as identity primary key,
  fecha date not null unique,
  es_habil boolean not null,
  descripcion text,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

create trigger calendario_laboral_actualizacion
  before update on joyeria.calendario_laboral
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.calendario_laboral is
  'Excepciones a la regla semanal (parámetro dias_semana_habiles): '
  'es_habil = false cierra un feriado; es_habil = true abre un domingo.';
