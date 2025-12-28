-- ============================================================================
-- MIGRACIÓN: Remover unique constraint de codigo en tipos_via
-- FECHA: 2025-12-28
-- AUTOR: Claude AI
-- ============================================================================
--
-- PROPÓSITO:
-- Permitir reutilizar códigos de TiposVía inactivos (estado=0).
-- Antes: codigo era UNIQUE en todos los registros
-- Ahora: codigo puede repetirse si los registros tienen diferente estado
--
-- CAMBIOS:
-- 1. Eliminar índice único uq_tipos_via_codigo
-- 2. Eliminar constraint UNIQUE del campo codigo
-- 3. Crear índice compuesto (codigo, estado) para optimizar búsquedas
--
-- ============================================================================

USE railway;

-- ============================================================================
-- Paso 1: Verificar qué índices existen actualmente
-- ============================================================================
SHOW INDEX FROM tipos_via WHERE Key_name LIKE '%codigo%';

-- ============================================================================
-- Paso 2: Eliminar el índice único existente
-- IMPORTANTE: Ejecuta SOLO el comando que corresponda según el resultado del SHOW INDEX
-- ============================================================================

-- Opción A: Si el índice se llama 'uq_tipos_via_codigo'
-- ALTER TABLE tipos_via DROP INDEX uq_tipos_via_codigo;

-- Opción B: Si el índice se llama 'codigo' (nombre por defecto)
-- ALTER TABLE tipos_via DROP INDEX codigo;

-- Opción C: Si el índice tiene otro nombre, usa ese nombre
-- ALTER TABLE tipos_via DROP INDEX [nombre_del_indice];

-- ============================================================================
-- Paso 3: Modificar la columna para remover UNIQUE constraint
-- Este comando se ejecuta independientemente del nombre del índice
-- ============================================================================
ALTER TABLE tipos_via MODIFY COLUMN codigo VARCHAR(10) NOT NULL
COMMENT 'Código (AV, JR, CA, PJ, etc.) - Debe ser único solo entre registros activos';

-- ============================================================================
-- Paso 4: Crear índice compuesto para optimizar búsquedas
-- Este índice permite búsquedas rápidas por codigo+estado
-- ============================================================================
CREATE INDEX idx_tipos_via_codigo_estado ON tipos_via(codigo, estado);

-- ============================================================================
-- Paso 5: Verificar que el cambio se aplicó correctamente
-- ============================================================================
SHOW INDEX FROM tipos_via WHERE Key_name LIKE '%codigo%';

-- ============================================================================
-- ROLLBACK (en caso de necesitar revertir)
-- ============================================================================
-- Si necesitas revertir estos cambios, ejecuta:
--
-- DROP INDEX idx_tipos_via_codigo_estado ON tipos_via;
-- ALTER TABLE tipos_via MODIFY COLUMN codigo VARCHAR(10) NOT NULL UNIQUE;
-- CREATE UNIQUE INDEX uq_tipos_via_codigo ON tipos_via(codigo);
--
-- ============================================================================
