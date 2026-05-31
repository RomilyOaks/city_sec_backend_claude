-- ============================================================
-- CitySecure — Migración 008
-- Archivo: 008_seed_estados_operativo_recurso.sql
--
-- PROBLEMA: estados_operativo_recurso estaba vacía en Supabase.
-- Al asignar un vehículo a un turno, el INSERT en operativos_vehiculos
-- fallaba con FK constraint "fk_ov_estado_oper" porque
-- estado_operativo_id no referenciaba ningún registro válido.
--
-- También faltaba la columna 'alcance' que MySQL sí tiene y que
-- el modelo Sequelize y el frontend esperan.
--
-- Solución:
--   1. Agregar columna alcance (si no existe)
--   2. Insertar los 14 registros con los IDs originales de MySQL
--   3. Resetear la secuencia para evitar conflictos en futuros INSERTs
--
-- Es IDEMPOTENTE: usa ON CONFLICT DO NOTHING.
-- ============================================================

SET search_path TO citysecure;

-- 1. Agregar columna alcance si no existe
ALTER TABLE estados_operativo_recurso
  ADD COLUMN IF NOT EXISTS alcance VARCHAR(10) DEFAULT 'AMBOS';

-- 2. Insertar los 14 registros con IDs originales de MySQL
--    (OVERRIDING SYSTEM VALUE permite insertar IDs explícitos en columnas SERIAL)
INSERT INTO estados_operativo_recurso
  (id, codigo, descripcion, alcance, estado, created_at, updated_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1,  'OP', 'OPERATIVO ACTIVO',          'AMBOS',    1, '2026-01-08 11:49:11+00', '2026-01-25 02:58:27+00'),
  (2,  'BM', 'MAESTRANZA',                'AMBOS',    1, '2026-01-08 11:49:11+00', '2026-01-25 02:58:27+00'),
  (3,  'DQ', 'EN PC X DESPERFECTO',       'VEHICULO', 1, '2026-01-08 11:49:11+00', '2026-01-25 02:58:27+00'),
  (4,  'EX', 'EXPLANADA',                 'AMBOS',    1, '2026-01-08 11:49:12+00', '2026-01-25 02:58:28+00'),
  (5,  'NO', 'CHOFER SIN MOVIL',          'VEHICULO', 1, '2026-01-08 11:49:12+00', '2026-01-25 02:58:28+00'),
  (6,  'OD', 'OPERATIVA SIN DOCUMENTOS',  'AMBOS',    1, '2026-01-08 11:49:12+00', '2026-01-25 02:58:28+00'),
  (7,  'P',  'PATRULLANDO',               'VEHICULO', 1, '2026-01-08 11:49:13+00', '2026-01-25 02:58:29+00'),
  (8,  'Q',  'OPERATIVO SIN CHOFER',      'VEHICULO', 1, '2026-01-08 11:49:13+00', '2026-01-25 02:58:29+00'),
  (9,  'TA', 'TALLER PARTICULAR',         'VEHICULO', 1, '2026-01-08 11:49:13+00', '2026-01-25 02:58:29+00'),
  (10, 'F',  'FALTO',                     'PERSONAL', 1, '2026-01-08 22:30:49+00', '2026-01-11 20:12:44+00'),
  (11, 'DM', 'DESCANSO MEDICO',           'PERSONAL', 1, '2026-01-08 22:30:49+00', '2026-01-11 20:12:45+00'),
  (12, 'O',  'ONOMASTICO',                'PERSONAL', 1, '2026-01-08 22:30:49+00', '2026-01-11 20:12:45+00'),
  (13, 'PR', 'PERMISO',                   'PERSONAL', 1, '2026-01-08 22:30:50+00', '2026-01-11 20:12:45+00'),
  (15, 'AP', 'APOYO OTRA AREA',           'PERSONAL', 1, '2026-01-11 20:24:40+00', '2026-01-11 20:25:37+00')
ON CONFLICT (id) DO NOTHING;

-- 3. Resetear la secuencia al máximo ID existente para evitar conflictos futuros
SELECT setval(
  pg_get_serial_sequence('citysecure.estados_operativo_recurso', 'id'),
  (SELECT MAX(id) FROM estados_operativo_recurso)
);
