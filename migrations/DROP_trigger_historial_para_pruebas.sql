-- ===================================================
-- SCRIPT: Eliminar trigger para pruebas de duplicación
-- ===================================================
-- Fecha: 2026-01-05
-- Propósito: Eliminar temporalmente el trigger para identificar
--            si la duplicación viene del trigger o del backend
-- ===================================================

USE `railway`;

-- Verificar trigger actual antes de eliminar
SELECT
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING,
    ACTION_STATEMENT
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'railway'
  AND TRIGGER_NAME = 'trg_novedades_incidentes_after_update';

-- Eliminar el trigger
DROP TRIGGER IF EXISTS `trg_novedades_incidentes_after_update`;

-- Verificar que fue eliminado
SELECT
    TRIGGER_NAME
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'railway'
  AND TRIGGER_NAME = 'trg_novedades_incidentes_after_update';

-- Si no hay resultados, el trigger fue eliminado correctamente

SELECT 'Trigger eliminado exitosamente. Ahora puedes hacer pruebas desde el frontend.' AS resultado;

-- ===================================================
-- INSTRUCCIONES PARA PRUEBAS
-- ===================================================
-- 1. Ejecuta este script para eliminar el trigger
-- 2. Desde el frontend, asigna recursos a una novedad (cambio a estado DESPACHADO)
-- 3. Revisa la tabla historial_estado_novedades:
--    SELECT * FROM historial_estado_novedades WHERE novedad_id = X ORDER BY id DESC;
-- 4. Si sigue duplicando → El problema está en el BACKEND
--    Si NO duplica → El problema estaba en el TRIGGER
-- 5. Después de la prueba, restaura el trigger con fix_trigger_historial_auditoria.sql
-- ===================================================

-- CONSULTA PARA VERIFICAR DUPLICADOS
-- Ejecuta esto después de asignar recursos:
/*
SELECT
    id,
    novedad_id,
    estado_anterior_id,
    estado_nuevo_id,
    usuario_id,
    fecha_cambio,
    observaciones,
    created_by,
    updated_by
FROM historial_estado_novedades
WHERE novedad_id = 34  -- Reemplaza con el ID de tu novedad de prueba
ORDER BY id DESC
LIMIT 5;
*/
