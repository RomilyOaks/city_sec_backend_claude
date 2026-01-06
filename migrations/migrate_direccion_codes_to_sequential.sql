/**
 * ============================================================================
 * MIGRACIÓN: Códigos de Direcciones a Sistema Secuencial
 * ============================================================================
 *
 * PROPÓSITO:
 * - Migrar códigos de direcciones del formato antiguo (DIR-TIMESTAMP-RANDOM)
 *   al nuevo formato secuencial (D-XXXXXX)
 *
 * FORMATO ANTERIOR: DIR-20240105120000-123
 * FORMATO NUEVO:    D-000001, D-000002, ..., D-999999
 *
 * PASOS:
 * 1. Agregar campo temporal para backup del código antiguo
 * 2. Actualizar códigos a formato secuencial
 * 3. Verificar integridad
 *
 * ADVERTENCIA:
 * - Hacer BACKUP de la base de datos antes de ejecutar
 * - Ejecutar en horario de bajo tráfico
 * - Verificar que todas las direcciones tengan código único
 *
 * AUTOR: Claude AI
 * FECHA: 2026-01-06
 * ============================================================================
 */

-- ============================================================================
-- PASO 1: Agregar campo de backup (verificar primero si no existe)
-- ============================================================================

-- Verificar si la columna ya existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'direcciones'
      AND COLUMN_NAME = 'direccion_code_legacy'
);

-- Agregar columna solo si no existe
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE direcciones ADD COLUMN direccion_code_legacy VARCHAR(50) COMMENT ''Backup del código anterior a la migración''',
    'SELECT ''La columna direccion_code_legacy ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PASO 2: Guardar códigos antiguos en el campo legacy
-- ============================================================================

UPDATE direcciones
SET direccion_code_legacy = direccion_code
WHERE direccion_code_legacy IS NULL;

-- ============================================================================
-- PASO 3: Actualizar códigos al formato secuencial
-- ============================================================================

SET @contador := 0;

UPDATE direcciones
SET direccion_code = CONCAT('D-', LPAD((@contador := @contador + 1), 6, '0'))
ORDER BY created_at ASC;

-- ============================================================================
-- PASO 4: Verificar la migración
-- ============================================================================

-- Contar total de direcciones
SELECT COUNT(*) as total_direcciones FROM direcciones;

-- Verificar formato de los nuevos códigos
SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN direccion_code REGEXP '^D-[0-9]{6}$' THEN 1 END) as formato_correcto,
    COUNT(CASE WHEN direccion_code NOT REGEXP '^D-[0-9]{6}$' THEN 1 END) as formato_incorrecto
FROM direcciones;

-- Verificar duplicados (no debería haber ninguno)
SELECT direccion_code, COUNT(*) as duplicados
FROM direcciones
GROUP BY direccion_code
HAVING COUNT(*) > 1;

-- Mostrar primeros 10 registros migrados
SELECT
    id,
    direccion_code_legacy as codigo_anterior,
    direccion_code as codigo_nuevo,
    created_at
FROM direcciones
ORDER BY created_at ASC
LIMIT 10;

-- Mostrar últimos 10 registros migrados
SELECT
    id,
    direccion_code_legacy as codigo_anterior,
    direccion_code as codigo_nuevo,
    created_at
FROM direcciones
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- PASO 5: (OPCIONAL) Rollback - Solo si es necesario revertir
-- ============================================================================

-- DESCOMENTAR SOLO SI NECESITAS REVERTIR LA MIGRACIÓN
-- UPDATE direcciones
-- SET direccion_code = direccion_code_legacy
-- WHERE direccion_code_legacy IS NOT NULL;

-- ============================================================================
-- PASO 6: (OPCIONAL) Limpiar campo legacy después de verificar
-- ============================================================================

-- DESCOMENTAR SOLO DESPUÉS DE VERIFICAR QUE TODO ESTÁ CORRECTO
-- ALTER TABLE direcciones DROP COLUMN direccion_code_legacy;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. ANTES DE EJECUTAR:
   - Hacer backup completo de la base de datos
   - Verificar que no hay procesos de creación de direcciones en ejecución
   - Notificar a los usuarios sobre el mantenimiento

2. DESPUÉS DE EJECUTAR:
   - Verificar que todos los códigos tienen formato D-XXXXXX
   - Verificar que no hay duplicados
   - Probar la creación de nuevas direcciones
   - Verificar que el backend puede buscar por los nuevos códigos

3. CAPACIDAD:
   - El nuevo formato soporta hasta 999,999 direcciones
   - Si se necesita más capacidad, cambiar a D-XXXXXXX (7 dígitos)

4. BÚSQUEDA:
   - Los códigos antiguos se mantienen en direccion_code_legacy
   - Se puede implementar búsqueda por ambos campos si es necesario

5. FRONTEND:
   - Actualizar el frontend para mostrar los nuevos códigos
   - Implementar normalización de búsqueda (D-123 → D-000123)
   - Actualizar reportes y exportaciones
*/
