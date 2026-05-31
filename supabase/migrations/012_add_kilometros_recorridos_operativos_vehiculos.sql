-- Migración 012: Agregar columna kilometros_recorridos a operativos_vehiculos
-- Columna presente en MySQL pero ausente en la migración inicial de Supabase.
-- Causa: ERROR "column ov.kilometros_recorridos does not exist" al exportar Excel
--        desde el endpoint GET /reportes-operativos/combinados/exportar
-- Aplicado manualmente en Supabase el 2026-05-31 vía MCP apply_migration.

ALTER TABLE citysecure.operativos_vehiculos
  ADD COLUMN IF NOT EXISTS kilometros_recorridos INTEGER DEFAULT NULL;
