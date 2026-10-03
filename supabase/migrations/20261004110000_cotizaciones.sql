-- ─────────────────────────────────────────────────────────────────────────
-- Cotizaciones versionadas y diseños
--
-- Una orden puede tener varias versiones de cotización; nunca se borra una.
-- Solo una puede estar enviada o aprobada a la vez, y solo un borrador.
-- ─────────────────────────────────────────────────────────────────────────

create type joyeria.estado_cotizacion as enum (
  'borrador', 'enviada', 'aprobada', 'rechazada', 'vencida', 'reemplazada'
);

create table joyeria.cotizaciones (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  version integer not null check (version > 0),
  estado joyeria.estado_cotizacion not null default 'borrador',
  -- Totales calculados por fn_guardar_cotizacion a partir de las líneas.
  total_cliente numeric(12, 2) not null default 0,
  total_costo_joyero numeric(12, 2) not null default 0,
  utilidad_estimada numeric(12, 2) not null default 0,
  -- Porcentaje sobre el precio al cliente; null si el total es cero.
  margen_estimado numeric(6, 2),
  valido_hasta date,
  enviada_en timestamptz,
  aprobada_en timestamptz,
  aprobada_por_nombre text,
  motivo_rechazo text,
  notas text,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz,
  unique (orden_id, version)
);

create unique index cotizaciones_vigente_unq
  on joyeria.cotizaciones (orden_id)
  where estado in ('enviada', 'aprobada');

create unique index cotizaciones_borrador_unq
  on joyeria.cotizaciones (orden_id)
  where estado = 'borrador';

create trigger cotizaciones_actualizacion
  before update on joyeria.cotizaciones
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on column joyeria.cotizaciones.margen_estimado is
  'utilidad_estimada / total_cliente × 100. Bajo 25 % la interfaz avisa; no bloquea.';

create table joyeria.cotizacion_detalle (
  id bigint generated always as identity primary key,
  cotizacion_id bigint not null references joyeria.cotizaciones (id) on delete cascade,
  tipo_trabajo_id bigint not null references joyeria.tipos_trabajo (id),
  complejidad_id bigint not null references joyeria.complejidades (id),
  descripcion text,
  cantidad integer not null default 1 check (cantidad > 0),
  precio_unitario numeric(12, 2) not null default 0 check (precio_unitario >= 0),
  -- Lo que ARIGA estima pagar al joyero por unidad. Nunca sale en el PDF.
  costo_joyero numeric(12, 2) not null default 0 check (costo_joyero >= 0),
  orden integer not null default 1,
  creado_en timestamptz not null default now()
);

create index cotizacion_detalle_cotizacion_idx on joyeria.cotizacion_detalle (cotizacion_id);

-- ── Diseños (solo órdenes de creación) ───────────────────────────────────
create table joyeria.disenos (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  version integer not null check (version > 0),
  descripcion text,
  ruta_storage text,
  nombre_archivo text,
  tipo_archivo text,
  aprobado boolean not null default false,
  aprobado_en timestamptz,
  comentarios_cliente text,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz,
  unique (orden_id, version)
);

create trigger disenos_actualizacion
  before update on joyeria.disenos
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.disenos is
  'Versiones de diseño de una creación. La orden no se aprueba sin una versión con aprobado = true.';
