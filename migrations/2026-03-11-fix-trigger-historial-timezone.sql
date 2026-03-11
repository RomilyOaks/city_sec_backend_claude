-- ===================================================
-- MIGRACIÓN: Corregir cálculo de tiempo_en_estado_min en el trigger
-- ===================================================
-- Fecha: 2026-03-11
-- Descripción: El cálculo del tiempo en estado utilizaba TIMESTAMPDIFF
-- directamente sobre OLD.updated_at y NEW.updated_at. Debido a diferencias
-- de zona horaria (UTC vs local America/Lima) los resultados se desfasaban
-- exactamente +300 minutos en algunos casos.
--
-- Solución: normalizar ambas fechas a la misma zona antes de medir la
-- diferencia. Convertimos ambas a UTC (zona neutra) mediante CONVERT_TZ, lo
-- cual elimina cualquier desplazamiento que pudiera haber quedado en la
-- columna `updated_at`.
-- ===================================================

USE `railway`;

-- eliminar trigger existente
DROP TRIGGER IF EXISTS `trg_novedades_incidentes_after_update`;

DELIMITER $$

CREATE TRIGGER `trg_novedades_incidentes_after_update`
AFTER UPDATE ON `novedades_incidentes`
FOR EACH ROW
BEGIN
    DECLARE tiempo_estado INT;
    DECLARE usuario_historial INT;

    IF NEW.estado_novedad_id <> OLD.estado_novedad_id THEN
        -- normalizar ambas fechas a UTC antes de calcular diferencia
        SET tiempo_estado = TIMESTAMPDIFF(
            MINUTE,
            CONVERT_TZ(OLD.updated_at, @@session.time_zone, '+00:00'),
            CONVERT_TZ(NEW.updated_at, @@session.time_zone, '+00:00')
        );

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
            UTC_TIMESTAMP(), -- guardar siempre en UTC y convertir al leer si es necesario
            NULL,
            usuario_historial,
            usuario_historial,
            UTC_TIMESTAMP(),
            UTC_TIMESTAMP()
        );
    END IF;
END$$

DELIMITER ;

-- mensaje de verificación
SELECT 'Trigger actualizado: normaliza timezone en cálculo de minutos' AS resultado;
