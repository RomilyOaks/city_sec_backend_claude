-- ============================================================
-- Migración 011: Columnas faltantes en novedades_incidentes
-- ============================================================
-- Fecha: 2026-05-31
-- Aplicada en Supabase: 2026-05-31
--
-- Estas columnas existen en MySQL (producción Railway) pero no
-- estaban en la migración inicial de Supabase.
-- Su ausencia causaba ERROR 500 en el dashboard de reportes
-- operativos ("column ni.ajustado_en_mapa does not exist").
--
-- Referenciadas en:
--   src/services/reportesOperativosService.js
--     → getOperativosVehiculares(), getOperativosPie(),
--       getNovedadesNoAtendidas(), getResumenNovedadesNoAtendidas()
-- ============================================================

ALTER TABLE citysecure.novedades_incidentes
  ADD COLUMN IF NOT EXISTS ajustado_en_mapa  SMALLINT   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fecha_ajuste_mapa TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reporte_vecino_id BIGINT      DEFAULT NULL;
