-- ===================================================
-- SCRIPT: Eliminar TODOS los triggers de historial
-- ===================================================
-- Fecha: 2026-01-05
-- Propósito: Eliminar todos los triggers que crean registros
--            en historial_estado_novedades para evitar duplicación
-- ===================================================

USE `railway`;

-- ==========================================
-- 1. VERIFICAR TRIGGERS EXISTENTES
-- ==========================================
SELECT
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING,
    DEFINER
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'railway'
  AND EVENT_OBJECT_TABLE = 'novedades_incidentes'
ORDER BY TRIGGER_NAME;

-- ==========================================
-- 2. ELIMINAR TRIGGER #1
-- ==========================================
DROP TRIGGER IF EXISTS `trg_novedades_incidentes_after_update`;

SELECT 'Trigger trg_novedades_incidentes_after_update eliminado' AS resultado;

-- ==========================================
-- 3. ELIMINAR TRIGGER #2 (EL QUE CAUSA DUPLICADOS)
-- ==========================================
DROP TRIGGER IF EXISTS `trg_historial_cambio_estado`;

SELECT 'Trigger trg_historial_cambio_estado eliminado' AS resultado;

-- ==========================================
-- 4. VERIFICAR QUE FUERON ELIMINADOS
-- ==========================================
SELECT
    TRIGGER_NAME
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'railway'
  AND EVENT_OBJECT_TABLE = 'novedades_incidentes';

-- Si no retorna resultados, todos los triggers fueron eliminados correctamente

-- ==========================================
-- 5. MENSAJE FINAL
-- ==========================================
SELECT CONCAT(
    'Todos los triggers eliminados. ',
    'El backend ahora maneja el historial manualmente con las observaciones del frontend.'
) AS resultado_final;

-- ===================================================
-- IMPORTANTE: DESPUÉS DE ELIMINAR LOS TRIGGERS
-- ===================================================
-- 1. Reinicia el servidor backend
-- 2. Prueba asignar recursos desde el frontend
-- 3. Verifica que SOLO se cree 1 registro en historial
-- 4. Verifica que las observaciones se graben correctamente
--
-- Query de verificación:
-- SELECT * FROM historial_estado_novedades
-- WHERE novedad_id = 37
-- ORDER BY id DESC;
-- ===================================================
