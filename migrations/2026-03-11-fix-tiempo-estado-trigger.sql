-- ============================================
-- MIGRACIÓN: Corregir cálculo de tiempo_en_estado_min (versión 2)
-- ============================================
-- Descripción: 
-- Se crea un trigger BEFORE INSERT que recalculará automáticamente 
-- el campo tiempo_en_estado_min basándose en las fechas_cambio 
-- del historial de estados.

USE citizen_security_v2;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS tr_historial_estado_novedades_calcular_tiempo;

-- Crear nuevo trigger BEFORE INSERT
DELIMITER //

CREATE TRIGGER tr_historial_estado_novedades_calcular_tiempo
BEFORE INSERT ON historial_estado_novedades
FOR EACH ROW
BEGIN
  DECLARE fecha_anterior DATETIME;
  DECLARE tiempo_diferencia INT;
  
  -- Buscar la fecha_cambio del registro anterior más reciente de la misma novedad
  SELECT fecha_cambio INTO fecha_anterior
  FROM historial_estado_novedades
  WHERE novedad_id = NEW.novedad_id
  ORDER BY fecha_cambio DESC, id DESC
  LIMIT 1;
  
  -- Si existe un registro anterior, calcular la diferencia en minutos
  IF fecha_anterior IS NOT NULL THEN
    -- TIMESTAMPDIFF devuelve la diferencia en SECONDS, convertir a minutos
    SET tiempo_diferencia = ROUND(TIMESTAMPDIFF(SECOND, fecha_anterior, NEW.fecha_cambio) / 60);
    SET NEW.tiempo_en_estado_min = tiempo_diferencia;
  ELSE
    -- Si es el primer registro de la novedad, no hay tiempo anterior
    SET NEW.tiempo_en_estado_min = NULL;
  END IF;
END//

DELIMITER ;

-- ============================================
-- Script de corrección de datos históricos (usando tabla temporal)
-- ============================================

-- Crear tabla temporal con los cálculos correctos
CREATE TEMPORARY TABLE temp_tiempo_correcciones AS
SELECT 
  h1.id,
  ROUND(
    TIMESTAMPDIFF(SECOND, 
      (SELECT fecha_cambio FROM historial_estado_novedades h2 
       WHERE h2.novedad_id = h1.novedad_id 
       AND h2.fecha_cambio < h1.fecha_cambio
       ORDER BY h2.fecha_cambio DESC, h2.id DESC
       LIMIT 1),
      h1.fecha_cambio
    ) / 60
  ) as new_tiempo
FROM historial_estado_novedades h1
WHERE EXISTS (
  SELECT 1 FROM historial_estado_novedades h3
  WHERE h3.novedad_id = h1.novedad_id
  AND h3.fecha_cambio < h1.fecha_cambio
);

-- Actualizar con los valores correctos
UPDATE historial_estado_novedades h1
INNER JOIN temp_tiempo_correcciones t ON h1.id = t.id
SET h1.tiempo_en_estado_min = t.new_tiempo;

-- Verificar las correcciones
SELECT 
  id,
  novedad_id,
  estado_anterior_id,
  estado_nuevo_id,
  tiempo_en_estado_min,
  fecha_cambio,
  observaciones
FROM historial_estado_novedades
ORDER BY novedad_id, fecha_cambio
LIMIT 20;
