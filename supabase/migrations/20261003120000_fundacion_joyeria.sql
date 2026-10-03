-- ─────────────────────────────────────────────────────────────────────────
-- Fundación del esquema `joyeria`
--
-- El proyecto de Supabase está compartido: `public` aloja el ERP de ARIGA y
-- `smartvale` la plataforma de vales. Esta aplicación vive aislada en su
-- propio esquema.
--
-- Modelo de seguridad: el esquema se cierra por completo a `anon` y
-- `authenticated`; el único acceso es con la clave de servicio, que nunca
-- sale del servidor. La autorización se aplica en la capa de servidor de
-- Next.js. Si más adelante se usa Supabase Auth desde el navegador, abrir
-- tabla por tabla con RLS y políticas explícitas.
--
-- Idempotente: se puede volver a aplicar sin efectos.
-- ─────────────────────────────────────────────────────────────────────────

create schema if not exists joyeria;

-- ── Cierre del esquema a los roles públicos ──────────────────────────────
-- `usage` se concede porque PostgREST lo necesita para resolver el esquema,
-- pero sin privilegios sobre tablas no se puede leer ni escribir nada.
grant usage on schema joyeria to anon, authenticated, service_role;

revoke all on all tables in schema joyeria from anon, authenticated;
revoke all on all sequences in schema joyeria from anon, authenticated;
revoke all on all functions in schema joyeria from anon, authenticated;

alter default privileges in schema joyeria
  revoke all on tables from anon, authenticated;
alter default privileges in schema joyeria
  revoke all on sequences from anon, authenticated;
alter default privileges in schema joyeria
  revoke all on functions from anon, authenticated;

-- El rol de servicio sí opera sobre todo lo que se cree en el esquema.
grant all on all tables in schema joyeria to service_role;
grant all on all sequences in schema joyeria to service_role;
grant all on all functions in schema joyeria to service_role;

alter default privileges in schema joyeria
  grant all on tables to service_role;
alter default privileges in schema joyeria
  grant all on sequences to service_role;
alter default privileges in schema joyeria
  grant all on functions to service_role;

-- ── Utilidad compartida: marca de actualización ──────────────────────────
-- Se engancha como trigger `before update` en las tablas que llevan la
-- columna `actualizado_en`. (Este esquema sigue la convención
-- `creado_en` / `actualizado_en`, no la `fecha_*` de smartvale.)
create or replace function joyeria.fn_marcar_actualizacion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

comment on schema joyeria is
  'ARIGA Joyería. Aislado de public (ERP) y smartvale (vales). Solo service_role.';
