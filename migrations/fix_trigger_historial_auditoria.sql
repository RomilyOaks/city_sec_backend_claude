-- ===================================================
-- MIGRACIÓN: Actualizar trigger para incluir created_by y updated_by
-- ===================================================
-- Fecha: 2026-01-04
-- Descripción: Corrige el trigger para incluir campos de auditoría
-- ===================================================

USE `railway`;

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS `trg_novedades_incidentes_after_update`;

-- Crear el trigger actualizado con campos de auditoría
DELIMITER $$

CREATE TRIGGER `trg_novedades_incidentes_after_update`
AFTER UPDATE ON `novedades_incidentes`
FOR EACH ROW
BEGIN
    DECLARE tiempo_estado INT;
    DECLARE usuario_historial INT;

    IF NEW.estado_novedad_id <> OLD.estado_novedad_id THEN
        SET tiempo_estado = TIMESTAMPDIFF(MINUTE, OLD.updated_at, NEW.updated_at);

        SET usuario_historial = COALESCE(
            NEW.updated_by,
            NEW.usuario_registro,
            OLD.updated_by,
            OLD.usuario_registro
        );

        INSERT INTO historial_estado_novedades (
            novedad_id,
            estado_anterior_id,
            estado_nuevo_id,
            usuario_id,
            tiempo_en_estado_min,
            observaciones,
            fecha_cambio,
            metadata,
            created_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            OLD.estado_novedad_id,
            NEW.estado_novedad_id,
            usuario_historial,
            tiempo_estado,
            NULL,
            NOW(),
            NULL,
            usuario_historial,  -- created_by
            usuario_historial,  -- updated_by
            NOW(),
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- Verificar que el trigger fue creado correctamente
SELECT
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'railway'
  AND TRIGGER_NAME = 'trg_novedades_incidentes_after_update';

SELECT 'Trigger actualizado exitosamente con campos de auditoría' AS resultado;
