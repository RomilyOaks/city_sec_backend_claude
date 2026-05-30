-- ============================================================
-- CitySecure — Patch: alinear schema Supabase con MySQL
-- Archivo: 005_patch_schema_align_mysql.sql
-- Aplicar DESPUÉS de 001_citysecure_schema.sql si el schema
-- fue creado antes del 2026-05-30.
--
-- Es IDEMPOTENTE: usa IF NOT EXISTS / bloques DO $$ para que
-- pueda ejecutarse varias veces sin error.
--
-- Corrige los siguientes grupos de problemas:
--   A) deleted_by faltante en cargos, roles, personal_seguridad, sectores
--   B) catalogo_desperfectos — columnas extras del MySQL no declaradas en PG
--   C) horarios_turnos — created_by era NOT NULL, debe ser nullable
-- ============================================================

SET search_path TO citysecure;

-- ============================================================
-- A) deleted_by — tablas afectadas: cargos, roles,
--                 personal_seguridad, sectores
--
-- MySQL tiene deleted_by en estas tablas (usado en index.js
-- via belongsTo foreignKey: "deleted_by"). El schema original
-- de PostgreSQL no las tenía.
-- ============================================================

ALTER TABLE cargos
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

ALTER TABLE personal_seguridad
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

ALTER TABLE sectores
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- ============================================================
-- B) catalogo_desperfectos — columnas del MySQL no declaradas
--
-- El schema original solo tenía: id, nombre, categoria,
-- descripcion, activo. MySQL tiene además: codigo, prioridad,
-- tiempo_estimado_reparacion, estado, y columnas de auditoría.
-- ============================================================

ALTER TABLE catalogo_desperfectos
  ADD COLUMN IF NOT EXISTS codigo                     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS prioridad                  VARCHAR(10) DEFAULT 'MEDIA',
  ADD COLUMN IF NOT EXISTS tiempo_estimado_reparacion INTEGER,
  ADD COLUMN IF NOT EXISTS estado                     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by                 INTEGER,
  ADD COLUMN IF NOT EXISTS created_by                 INTEGER,
  ADD COLUMN IF NOT EXISTS created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by                 INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Constraint de prioridad (idempotente: captura error si ya existe)
DO $$ BEGIN
  ALTER TABLE catalogo_desperfectos
    ADD CONSTRAINT chk_catalogo_prioridad
    CHECK (prioridad IN ('ALTA','MEDIA','BAJA') OR prioridad IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- C) horarios_turnos — created_by debe ser nullable
--
-- El schema original declaraba: created_by INTEGER NOT NULL.
-- El campo referencia usuarios (no migrado), por lo que el
-- script de exportación lo fuerza a NULL → viola NOT NULL.
-- ============================================================

ALTER TABLE horarios_turnos
  ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- Verificación final — muestra columnas de las tablas patched
-- ============================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'citysecure'
  AND table_name   IN ('cargos','roles','personal_seguridad','sectores',
                       'catalogo_desperfectos','horarios_turnos')
  AND column_name  IN ('deleted_by','estado','codigo','prioridad',
                       'tiempo_estimado_reparacion','created_by')
ORDER BY table_name, column_name;
