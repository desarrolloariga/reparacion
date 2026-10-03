-- ─────────────────────────────────────────────────────────────────────────
-- Autenticación propia de ARIGA Joyería
--
-- Mismo modelo que Smart Vale: cuentas con contraseña scrypt y sesiones
-- opacas (en la cookie viaja un token aleatorio; aquí solo su SHA-256).
-- No se usa Supabase Auth: la autorización vive en src/lib/auth/guardas.ts.
-- ─────────────────────────────────────────────────────────────────────────

create type joyeria.rol_usuario as enum ('admin', 'taller', 'joyero', 'gerencia');

comment on type joyeria.rol_usuario is
  'admin: todo, incluidos catálogos y parámetros. taller: opera (recepción, '
  'cotización, asignación, calidad, entrega, cobros, liquidaciones). joyero: '
  'solo sus asignaciones, sin precios al cliente. gerencia: solo lectura.';

create table joyeria.usuarios (
  id bigint generated always as identity primary key,
  nombre text not null check (length(btrim(nombre)) > 0),
  -- Correo o nombre de usuario corto, siempre en minúsculas y sin espacios.
  correo text not null unique check (correo = lower(btrim(correo))),
  telefono text,
  contrasena_hash text not null,
  rol joyeria.rol_usuario not null default 'taller',
  activo boolean not null default true,
  ultimo_acceso timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz
);

create index usuarios_rol_idx on joyeria.usuarios (rol) where activo;

create trigger usuarios_actualizacion
  before update on joyeria.usuarios
  for each row execute function joyeria.fn_marcar_actualizacion();

comment on table joyeria.usuarios is
  'Cuentas de acceso. El rol joyero se enlaza a una fila de joyeros por joyeros.usuario_id.';
comment on column joyeria.usuarios.contrasena_hash is
  'Formato scrypt$N$r$p$salHex$derivadoHex, ver src/lib/auth/contrasena.ts.';

create table joyeria.sesiones (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references joyeria.usuarios (id) on delete cascade,
  token_hash text not null unique,
  expira_en timestamptz not null,
  ultima_actividad timestamptz not null default now(),
  user_agent text,
  creado_en timestamptz not null default now()
);

create index sesiones_usuario_idx on joyeria.sesiones (usuario_id);
create index sesiones_expira_idx on joyeria.sesiones (expira_en);

comment on table joyeria.sesiones is
  'Sesiones abiertas. Se guarda el SHA-256 del token de la cookie, nunca el token.';

-- Limpieza de sesiones vencidas; se puede llamar desde un job periódico.
create or replace function joyeria.fn_purgar_sesiones()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  borradas integer;
begin
  delete from joyeria.sesiones where expira_en < now();
  get diagnostics borradas = row_count;
  return borradas;
end;
$$;
