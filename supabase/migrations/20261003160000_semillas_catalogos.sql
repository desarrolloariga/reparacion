-- ─────────────────────────────────────────────────────────────────────────
-- Semillas de catálogos y parámetros
--
-- Idempotente: todo con `on conflict do nothing`. La matriz de tiempos
-- estándar NO se siembra a propósito: la calibra ARIGA desde la interfaz.
-- ─────────────────────────────────────────────────────────────────────────

insert into joyeria.especialidades (nombre) values
  ('Soldadura'), ('Engaste'), ('Pulido'), ('Talla'),
  ('Fundición'), ('Cambio de medida'), ('Rodinado'), ('Diseño')
on conflict (nombre) do nothing;

insert into joyeria.complejidades (nombre, orden, descripcion) values
  ('Baja', 1, 'Trabajo rutinario, sin riesgo para la pieza.'),
  ('Media', 2, 'Requiere cuidado especial o más de una operación.'),
  ('Alta', 3, 'Pieza delicada, piedras o técnica poco frecuente.')
on conflict (nombre) do nothing;

insert into joyeria.tipos_trabajo (nombre, categoria, especialidad_id)
select v.nombre, v.categoria::joyeria.categoria_trabajo, e.id
from (values
  ('Cambio de medida',        'reparacion', 'Cambio de medida'),
  ('Soldadura de cadena',     'reparacion', 'Soldadura'),
  ('Soldadura de anillo',     'reparacion', 'Soldadura'),
  ('Engaste de piedra',       'reparacion', 'Engaste'),
  ('Pulido y limpieza',       'reparacion', 'Pulido'),
  ('Rodinado',                'reparacion', 'Rodinado'),
  ('Reemplazo de broche',     'reparacion', 'Soldadura'),
  ('Enderezado',              'reparacion', null),
  ('Reconstrucción de uñas',  'reparacion', 'Engaste'),
  ('Anillo a la medida',      'creacion',   'Diseño'),
  ('Dije personalizado',      'creacion',   'Diseño'),
  ('Argollas de matrimonio',  'creacion',   'Fundición'),
  ('Reproducción de pieza',   'creacion',   'Fundición')
) as v (nombre, categoria, especialidad)
left join joyeria.especialidades e on e.nombre = v.especialidad
where not exists (
  select 1 from joyeria.tipos_trabajo t
  where lower(btrim(t.nombre)) = lower(btrim(v.nombre))
);

insert into joyeria.parametros (clave, valor, tipo_dato, grupo, descripcion) values
  ('holgura_cliente_dias', '2', 'entero', 'tiempos',
   'Días hábiles que se suman al estimado para prometerle al cliente.'),
  ('holgura_joyero_dias', '1', 'entero', 'tiempos',
   'Días hábiles de colchón entre la fecha del joyero y la del cliente.'),
  ('umbral_por_vencer_dias', '1', 'entero', 'tiempos',
   'A cuántos días hábiles del vencimiento se pinta amarillo.'),
  ('dias_semana_habiles', '[1,2,3,4,5,6]', 'json', 'tiempos',
   'Días de la semana que cuentan como hábiles (ISO: 1 = lunes … 7 = domingo).'),
  ('vigencia_cotizacion_dias', '15', 'entero', 'cotizaciones',
   'Días hasta que una cotización enviada se marca vencida.'),
  ('bloquear_por_capacidad', 'false', 'booleano', 'taller',
   'Si exceder la capacidad del joyero bloquea la asignación o solo advierte.'),
  ('descontar_garantia_al_joyero', 'true', 'booleano', 'dinero',
   'Si el costo de un retrabajo por garantía se descuenta de la liquidación del joyero responsable.'),
  ('moneda', 'GTQ', 'texto', 'dinero',
   'Moneda de la operación. Informativo: el formato vive en src/lib/format.ts.'),
  ('cliente_inactivo_dias', '180', 'entero', 'clientes',
   'Días sin servicio a partir de los cuales un cliente se considera inactivo.')
on conflict (clave) do nothing;

-- Feriados de Guatemala 2026 (solo los de día completo). 24 y 31 de
-- diciembre quedan a criterio del administrador.
insert into joyeria.calendario_laboral (fecha, es_habil, descripcion) values
  ('2026-01-01', false, 'Año Nuevo'),
  ('2026-04-02', false, 'Jueves Santo'),
  ('2026-04-03', false, 'Viernes Santo'),
  ('2026-05-01', false, 'Día del Trabajo'),
  ('2026-06-30', false, 'Día del Ejército'),
  ('2026-09-15', false, 'Independencia'),
  ('2026-10-20', false, 'Revolución de 1944'),
  ('2026-11-01', false, 'Todos los Santos'),
  ('2026-12-25', false, 'Navidad'),
  ('2027-01-01', false, 'Año Nuevo')
on conflict (fecha) do nothing;
