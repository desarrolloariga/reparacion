-- ─────────────────────────────────────────────────────────────────────────
-- Órdenes de reparación y creación
--
-- La orden es el eje de todo el módulo: pieza, cliente, trabajos, fechas,
-- estado y dinero del lado del cliente. El estado solo cambia a través de
-- fn_cambiar_estado_orden (migración de funciones): un trigger rechaza
-- cualquier otro camino.
-- ─────────────────────────────────────────────────────────────────────────

create type joyeria.estado_orden as enum (
  'recibida', 'cotizada', 'aprobada', 'asignada', 'en_proceso',
  'terminada_joyero', 'en_control_calidad', 'lista_entrega', 'entregada',
  'rechazada', 'anulada'
);

create type joyeria.momento_foto as enum ('entrada', 'proceso', 'salida', 'diseno');

-- ── Correlativo anual por prefijo (REP-2026-00001, CRE-2026-00001) ────────
create table joyeria.correlativos (
  prefijo text not null,
  anio integer not null,
  ultimo integer not null default 0,
  primary key (prefijo, anio)
);

comment on table joyeria.correlativos is
  'Último número emitido por prefijo y año. fn_siguiente_numero lo incrementa con bloqueo de fila.';

-- ── Órdenes ──────────────────────────────────────────────────────────────
create table joyeria.ordenes (
  id bigint generated always as identity primary key,
  numero text not null unique,
  cliente_id bigint not null references joyeria.clientes (id),
  tipo joyeria.categoria_trabajo not null,
  estado joyeria.estado_orden not null default 'recibida',

  -- La pieza
  descripcion_pieza text not null check (length(btrim(descripcion_pieza)) > 0),
  material text,
  quilataje text,
  peso_entrada_g numeric(10, 3) check (peso_entrada_g is null or peso_entrada_g >= 0),
  peso_salida_g numeric(10, 3) check (peso_salida_g is null or peso_salida_g >= 0),
  piedras text,
  observaciones_recepcion text,

  -- Tiempos
  fecha_recepcion date not null default ((now() at time zone 'America/Guatemala')::date),
  dias_estimados integer check (dias_estimados is null or dias_estimados >= 0),
  fecha_estimada_entrega date,
  fecha_prometida_cliente date,
  -- Si el usuario la fijó a mano, un recálculo posterior no la pisa.
  fecha_prometida_manual boolean not null default false,
  fecha_entrega_real date,

  -- Dinero del lado del cliente (el costo del joyero vive en asignaciones)
  precio_cliente numeric(12, 2) not null default 0 check (precio_cliente >= 0),

  -- Garantías
  es_garantia boolean not null default false,
  orden_origen_id bigint references joyeria.ordenes (id),
  cobra_garantia boolean not null default false,
  joyero_responsable_garantia_id bigint references joyeria.joyeros (id),

  motivo_anulacion text,
  entregada_con_saldo boolean not null default false,

  creado_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz,

  constraint ordenes_garantia_coherente check (es_garantia = (orden_origen_id is not null)),
  constraint ordenes_cobro_solo_garantia check (not cobra_garantia or es_garantia),
  constraint ordenes_responsable_solo_garantia check (joyero_responsable_garantia_id is null or es_garantia)
);

create index ordenes_estado_idx on joyeria.ordenes (estado);
create index ordenes_cliente_idx on joyeria.ordenes (cliente_id);
create index ordenes_prometida_idx on joyeria.ordenes (fecha_prometida_cliente);
create index ordenes_origen_idx on joyeria.ordenes (orden_origen_id) where orden_origen_id is not null;
create index ordenes_recepcion_idx on joyeria.ordenes (fecha_recepcion desc);

create trigger ordenes_actualizacion
  before update on joyeria.ordenes
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on column joyeria.ordenes.fecha_prometida_manual is
  'true cuando el usuario cambió la fecha prometida: los recálculos la respetan.';
comment on column joyeria.ordenes.entregada_con_saldo is
  'La entrega se hizo con saldo pendiente de forma explícita; queda también en el historial.';

-- ── Trabajos de la orden ─────────────────────────────────────────────────
create table joyeria.orden_detalle (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  tipo_trabajo_id bigint not null references joyeria.tipos_trabajo (id),
  complejidad_id bigint not null references joyeria.complejidades (id),
  descripcion text,
  cantidad integer not null default 1 check (cantidad > 0),
  -- Copiado de tiempos_estandar al crear o aprobar: la matriz puede cambiar
  -- después sin alterar lo ya prometido.
  dias_estimados integer not null check (dias_estimados > 0),
  precio_cliente numeric(12, 2) not null default 0 check (precio_cliente >= 0),
  costo_joyero_estimado numeric(12, 2) not null default 0 check (costo_joyero_estimado >= 0),
  orden integer not null default 1,
  creado_en timestamptz not null default now()
);

create index orden_detalle_orden_idx on joyeria.orden_detalle (orden_id);

-- ── Historial de estados ─────────────────────────────────────────────────
create table joyeria.orden_estados_historial (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  -- null en la creación de la orden
  estado_anterior joyeria.estado_orden,
  estado_nuevo joyeria.estado_orden not null,
  usuario_id bigint references joyeria.usuarios (id),
  comentario text,
  creado_en timestamptz not null default now()
);

create index orden_estados_historial_orden_idx on joyeria.orden_estados_historial (orden_id, creado_en);

comment on table joyeria.orden_estados_historial is
  'Lo escribe siempre fn_cambiar_estado_orden (o fn_anotar_orden para notas sin cambio de estado).';

-- ── Fotografías ──────────────────────────────────────────────────────────
create table joyeria.fotografias (
  id bigint generated always as identity primary key,
  orden_id bigint not null references joyeria.ordenes (id) on delete cascade,
  momento joyeria.momento_foto not null,
  ruta_storage text not null unique,
  descripcion text,
  subido_por bigint references joyeria.usuarios (id),
  creado_en timestamptz not null default now()
);

create index fotografias_orden_idx on joyeria.fotografias (orden_id, momento);

comment on column joyeria.fotografias.ruta_storage is
  'Ruta dentro del bucket privado `reparaciones`. Se sirve por URL firmada tras validar sesión.';

-- ── Transiciones permitidas ──────────────────────────────────────────────
-- Tabla y constante de TypeScript (src/lib/reparaciones/estados.ts) deben
-- coincidir; una prueba lo comprueba.
create table joyeria.transiciones_estado (
  desde joyeria.estado_orden not null,
  hacia joyeria.estado_orden not null,
  disparador text,
  primary key (desde, hacia)
);

insert into joyeria.transiciones_estado (desde, hacia, disparador) values
  ('recibida',           'cotizada',           'Se envía la cotización'),
  ('recibida',           'anulada',            'El cliente retira la pieza sin cotizar'),
  ('cotizada',           'aprobada',           'El cliente aprueba'),
  ('cotizada',           'rechazada',          'El cliente rechaza'),
  ('cotizada',           'cotizada',           'Se crea una versión nueva'),
  ('cotizada',           'anulada',            'Anulación con motivo'),
  ('aprobada',           'asignada',           'Se asigna joyero'),
  ('aprobada',           'anulada',            'Anulación con motivo'),
  ('asignada',           'en_proceso',         'El joyero marca inicio'),
  ('asignada',           'aprobada',           'Se anula la asignación'),
  ('asignada',           'anulada',            'Anulación con motivo'),
  ('en_proceso',         'terminada_joyero',   'El joyero marca terminado'),
  ('en_proceso',         'anulada',            'Anulación con motivo'),
  ('terminada_joyero',   'en_control_calidad', 'Taller recibe la pieza'),
  ('terminada_joyero',   'anulada',            'Anulación con motivo'),
  ('en_control_calidad', 'lista_entrega',      'Calidad aprobada'),
  ('en_control_calidad', 'asignada',           'Calidad rechazada: vuelve al joyero'),
  ('en_control_calidad', 'anulada',            'Anulación con motivo'),
  ('lista_entrega',      'entregada',          'Entrega y cobro'),
  ('lista_entrega',      'anulada',            'Anulación con motivo'),
  ('rechazada',          'anulada',            'Anulación con motivo');
