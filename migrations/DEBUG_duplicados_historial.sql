-- ===================================================
-- SCRIPT: Debug de duplicados en historial
-- ===================================================
-- Fecha: 2026-01-05
-- Propósito: Analizar duplicados en historial_estado_novedades
-- ===================================================

USE `railway`;

-- 1. Ver todos los registros de la novedad 34 (tu caso)
SELECT
    id,
    novedad_id,
    estado_anterior_id,
    estado_nuevo_id,
    usuario_id,
    tiempo_en_estado_min,
    observaciones,
    fecha_cambio,
    created_by,
    updated_by,
    created_at,
    updated_at
FROM historial_estado_novedades
WHERE novedad_id = 34
ORDER BY id ASC;

-- 2. Buscar duplicados exactos (mismo estado, misma fecha_cambio)
SELECT
    novedad_id,
    estado_anterior_id,
    estado_nuevo_id,
    fecha_cambio,
    COUNT(*) as cantidad_duplicados
FROM historial_estado_novedades
WHERE novedad_id = 34
GROUP BY novedad_id, estado_anterior_id, estado_nuevo_id, fecha_cambio
HAVING COUNT(*) > 1;

-- 3. Ver diferencia en microsegundos entre registros consecutivos
SELECT
    h1.id as id1,
    h2.id as id2,
    h1.estado_nuevo_id,
    h1.fecha_cambio as fecha1,
    h2.fecha_cambio as fecha2,
    TIMESTAMPDIFF(MICROSECOND, h1.fecha_cambio, h2.fecha_cambio) as diferencia_microsegundos,
    h1.observaciones as obs1,
    h2.observaciones as obs2,
    h1.created_by as created1,
    h2.created_by as created2
FROM historial_estado_novedades h1
JOIN historial_estado_novedades h2 ON h2.id = h1.id + 1
WHERE h1.novedad_id = 34
ORDER BY h1.id;

-- 4. Verificar si hay triggers activos
SELECT
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING,
    DEFINER
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'railway'
  AND EVENT_OBJECT_TABLE = 'novedades_incidentes';

-- 5. Limpiar duplicados de la novedad 34 (OPCIONAL - ejecutar con cuidado)
-- SOLO EJECUTAR DESPUÉS DE CONFIRMAR QUE SON DUPLICADOS
/*
-- Mantener solo el primer registro de cada grupo duplicado
DELETE h1 FROM historial_estado_novedades h1
INNER JOIN historial_estado_novedades h2
WHERE h1.novedad_id = 34
  AND h2.novedad_id = 34
  AND h1.estado_anterior_id = h2.estado_anterior_id
  AND h1.estado_nuevo_id = h2.estado_nuevo_id
  AND h1.fecha_cambio = h2.fecha_cambio
  AND h1.id > h2.id;  -- Eliminar el registro con ID mayor
*/

-- 6. Contar cuántos registros quedarían después de limpiar
SELECT
    'Registros actuales' as tipo,
    COUNT(*) as cantidad
FROM historial_estado_novedades
WHERE novedad_id = 34
UNION ALL
SELECT
    'Registros únicos (sin duplicados)' as tipo,
    COUNT(DISTINCT CONCAT(estado_anterior_id, '-', estado_nuevo_id, '-', fecha_cambio)) as cantidad
FROM historial_estado_novedades
WHERE novedad_id = 34;
