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
--   D) BOOLEAN/SMALLINT NOT NULL → nullable (datos MySQL pueden ser NULL)
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
-- F) direcciones — columnas ajustado_en_mapa y fecha_ajuste_mapa
--
-- MySQL tiene estas dos columnas que el schema PG no tenía.
-- ============================================================

ALTER TABLE direcciones
  ADD COLUMN IF NOT EXISTS ajustado_en_mapa  SMALLINT  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fecha_ajuste_mapa TIMESTAMPTZ;

-- ============================================================
-- D) DROP NOT NULL en BOOLEAN/SMALLINT con DEFAULT
--
-- En MySQL los registros antiguos pueden tener NULL en columnas
-- que en PostgreSQL se declararon NOT NULL DEFAULT <valor>.
-- DROP NOT NULL no elimina el DEFAULT — nuevos registros siguen
-- recibiendo el valor por defecto; solo la migración puede pasar NULL.
-- ============================================================

-- BOOLEAN NOT NULL → nullable (conserva DEFAULT)
ALTER TABLE tipos_vehiculo        ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE catalogo_desperfectos ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE estados_novedad       ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE tipos_novedad         ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE cargos                ALTER COLUMN requiere_licencia DROP NOT NULL;
ALTER TABLE cargos                ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE unidades_oficina      ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE subtipos_novedad      ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE sectores              ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE cuadrantes            ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE personal_seguridad    ALTER COLUMN estado           DROP NOT NULL;

-- ============================================================
-- E) permisos — columnas de auditoría faltantes
--
-- MySQL tiene created_by, deleted_by, deleted_at en permisos
-- pero el schema original de PG no las tenía.
-- ============================================================

ALTER TABLE permisos
  ADD COLUMN IF NOT EXISTS created_by INTEGER,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- SMALLINT NOT NULL → nullable (conserva DEFAULT)
ALTER TABLE tipos_via             ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE tipos_copiloto        ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE horarios_turnos       ALTER COLUMN cruza_medianoche DROP NOT NULL;
ALTER TABLE horarios_turnos       ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE subsectores           ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE calles                ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE calles_cuadrantes     ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE direcciones           ALTER COLUMN estado           DROP NOT NULL;
ALTER TABLE estados_novedad       ALTER COLUMN estado           DROP NOT NULL; -- spacing fix

-- ============================================================
-- Verificación final
-- ============================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'citysecure'
  AND (
    (table_name IN ('cargos','roles','personal_seguridad','sectores',
                    'catalogo_desperfectos','horarios_turnos')
     AND column_name IN ('deleted_by','estado','codigo','prioridad',
                         'tiempo_estimado_reparacion','created_by','requiere_licencia'))
    OR
    (column_name = 'estado'
     AND table_name IN ('tipos_via','tipos_vehiculo','tipos_copiloto',
                        'estados_novedad','tipos_novedad','subtipos_novedad',
                        'unidades_oficina','sectores','subsectores','cuadrantes',
                        'calles','calles_cuadrantes','direcciones'))
  )
ORDER BY table_name, column_name;
