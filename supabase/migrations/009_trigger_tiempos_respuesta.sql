-- ============================================================
-- CitySecure — Migración 009
-- Archivo: 009_trigger_tiempos_respuesta.sql
--
-- Trigger que auto-calcula los tiempos de respuesta en
-- novedades_incidentes al insertar o actualizar las fechas
-- clave (fecha_llegada, fecha_despacho, fecha_hora_reporte).
--
-- YA APLICADO MANUALMENTE el 2026-05-30 en Supabase.
-- Esta migración documenta el estado y es idempotente
-- (CREATE OR REPLACE + DROP IF EXISTS antes de crear).
-- ============================================================

SET search_path TO citysecure;

-- 1. Función trigger
CREATE OR REPLACE FUNCTION citysecure.fn_calcular_tiempos_respuesta()
RETURNS TRIGGER AS $$
BEGIN
  -- tiempo_respuesta_min_operativo: desde fecha_despacho hasta fecha_llegada
  IF NEW.fecha_llegada IS NOT NULL AND NEW.fecha_despacho IS NOT NULL THEN
    NEW.tiempo_respuesta_min_operativo := ROUND(
      EXTRACT(EPOCH FROM (NEW.fecha_llegada - NEW.fecha_despacho)) / 60
    )::integer;
  ELSE
    NEW.tiempo_respuesta_min_operativo := NULL;
  END IF;

  -- tiempo_respuesta_min: desde fecha_hora_reporte hasta fecha_llegada
  IF NEW.fecha_llegada IS NOT NULL AND NEW.fecha_hora_reporte IS NOT NULL THEN
    NEW.tiempo_respuesta_min := ROUND(
      EXTRACT(EPOCH FROM (NEW.fecha_llegada - NEW.fecha_hora_reporte)) / 60
    )::integer;
  ELSE
    NEW.tiempo_respuesta_min := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger (idempotente)
DROP TRIGGER IF EXISTS trg_novedades_calcular_tiempos ON citysecure.novedades_incidentes;

CREATE TRIGGER trg_novedades_calcular_tiempos
BEFORE INSERT OR UPDATE OF fecha_llegada, fecha_despacho, fecha_hora_reporte
ON citysecure.novedades_incidentes
FOR EACH ROW
EXECUTE FUNCTION citysecure.fn_calcular_tiempos_respuesta();

-- 3. Backfill — recalcular registros existentes con fecha_llegada
UPDATE citysecure.novedades_incidentes
SET
  tiempo_respuesta_min_operativo = CASE
    WHEN fecha_llegada IS NOT NULL AND fecha_despacho IS NOT NULL
    THEN ROUND(EXTRACT(EPOCH FROM (fecha_llegada - fecha_despacho)) / 60)::integer
    ELSE NULL
  END,
  tiempo_respuesta_min = CASE
    WHEN fecha_llegada IS NOT NULL AND fecha_hora_reporte IS NOT NULL
    THEN ROUND(EXTRACT(EPOCH FROM (fecha_llegada - fecha_hora_reporte)) / 60)::integer
    ELSE NULL
  END
WHERE fecha_llegada IS NOT NULL;
