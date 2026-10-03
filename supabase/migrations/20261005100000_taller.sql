-- ─────────────────────────────────────────────────────────────────────────
-- Taller: asignaciones a joyeros, control de calidad y pagos del cliente
--
-- La asignación es la relación de dinero con el joyero (costo_pactado);
-- la orden es la relación de dinero con el cliente (precio_cliente).
-- Nunca se mezclan: utilidad = precio_cliente − Σ costo_pactado.
-- ─────────────────────────────────────────────────────────────────────────

create type joyeria.estado_asignacion as enum (
  'asignada', 'en_proceso', 'terminada', 'rechazada_calidad', 'cerrada', 'anulada'
);
create type joyeria.resultado_calidad as enum ('aprobado', 'rechazado');
create type joyeria.tipo_pago as enum ('anticipo', 'saldo', 'total');
create type joyeria.forma_pago as enum ('efectivo', 'tarjeta', 'transferencia', 'otro');

-- ── Asignaciones ─────────────────────────────────────────────────────────
create table joyeria.asignaciones (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  joyero_id bigint not null references joyeria.joyeros (id),
  costo_pactado numeric(12, 2) not null check (costo_pactado >= 0),
  instrucciones text,
  fecha_asignacion date not null default ((now() at time zone 'America/Guatemala')::date),
  fecha_compromiso date not null,
  fecha_inicio_real date,
  fecha_terminado_real date,
  estado joyeria.estado_asignacion not null default 'asignada',
  notas_joyero text,
  pagada boolean not null default false,
  -- Retrabajo por rechazo de calidad: mismo joyero, costo cero.
  es_retrabajo boolean not null default false,
  -- Se calculan al terminar, en días hábiles: lo real contra lo estimado.
  dias_reales integer,
  desviacion_dias integer,
  -- Se asignó aun sabiendo que el compromiso supera la promesa al cliente.
  excede_fecha_cliente boolean not null default false,
  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz,
  constraint asignaciones_costo_o_retrabajo check (costo_pactado > 0 or es_retrabajo),
  constraint asignaciones_fechas check (fecha_compromiso >= fecha_asignacion)
);

-- Solo una asignación viva por orden.
create unique index asignaciones_activa_unq
  on joyeria.asignaciones (orden_id)
  where estado in ('asignada', 'en_proceso', 'terminada');

create index asignaciones_joyero_idx on joyeria.asignaciones (joyero_id, estado);
create index asignaciones_orden_idx on joyeria.asignaciones (orden_id);
create index asignaciones_compromiso_idx on joyeria.asignaciones (fecha_compromiso) where estado in ('asignada', 'en_proceso');

create trigger asignaciones_actualizacion
  before update on joyeria.asignaciones
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.asignaciones is
  'Trabajo encargado a un joyero con su costo pactado y su fecha de compromiso. '
  'Una orden puede tener varias (reasignación, retrabajo); solo una activa.';

-- ── Control de calidad ───────────────────────────────────────────────────
create table joyeria.control_calidad (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  asignacion_id bigint references joyeria.asignaciones (id),
  resultado joyeria.resultado_calidad not null,
  observaciones text,
  revisado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now()
);

create index control_calidad_orden_idx on joyeria.control_calidad (orden_id, creado_en);

-- ── Pagos del cliente ────────────────────────────────────────────────────
create table joyeria.pagos_cliente (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  tipo joyeria.tipo_pago not null,
  monto numeric(12, 2) not null check (monto > 0),
  forma_pago joyeria.forma_pago not null,
  fecha date not null default ((now() at time zone 'America/Guatemala')::date),
  referencia text,
  registrado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now()
);

create index pagos_cliente_orden_idx on joyeria.pagos_cliente (orden_id);
create index pagos_cliente_fecha_idx on joyeria.pagos_cliente (fecha);

comment on table joyeria.pagos_cliente is
  'Cobros al cliente por orden. saldo = precio_cliente − Σ monto. Los ingresos '
  'se reconocen por fecha de entrega de la orden, no por fecha de pago.';

-- ── Notificaciones en plataforma y cola de correo ────────────────────────
create table joyeria.notificaciones (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references joyeria.usuarios (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  cuerpo text,
  enlace text,
  leida_en timestamptz,
  creado_en timestamptz not null default now()
);

create index notificaciones_usuario_idx on joyeria.notificaciones (usuario_id, leida_en, creado_en desc);

create table joyeria.correos_salientes (
  id bigint generated always as identity primary key,
  para text not null,
  asunto text not null,
  cuerpo_html text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'enviado', 'error')),
  error text,
  intentos integer not null default 0,
  enviado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index correos_salientes_pendientes_idx on joyeria.correos_salientes (creado_en) where estado = 'pendiente';

comment on table joyeria.correos_salientes is
  'Cola de correo. La vacía el job /api/cron/correos con el proveedor configurado '
  '(src/lib/notificaciones/correo.ts). Sin proveedor real, se registran y se marcan enviados en consola.';
