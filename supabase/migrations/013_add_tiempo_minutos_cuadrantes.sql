-- Migración 013: Agregar columna tiempo_minutos a tablas de cuadrantes operativos
-- Columna presente en MySQL pero ausente en la migración inicial de Supabase.
-- Causa: ERROR "column ovc.tiempo_minutos does not exist" al exportar Excel
--        desde el endpoint GET /reportes-operativos/combinados/exportar
-- Aplicado manualmente en Supabase el 2026-05-31 vía MCP apply_migration.

ALTER TABLE citysecure.operativos_vehiculos_cuadrantes
  ADD COLUMN IF NOT EXISTS tiempo_minutos INTEGER DEFAULT NULL;

ALTER TABLE citysecure.operativos_personal_cuadrantes
  ADD COLUMN IF NOT EXISTS tiempo_minutos INTEGER DEFAULT NULL;
