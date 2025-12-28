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

-- Paso 1: Eliminar el índice único existente
-- NOTA: El nombre puede variar según cómo se creó (uq_tipos_via_codigo o solo codigo)
ALTER TABLE tipos_via DROP INDEX IF EXISTS uq_tipos_via_codigo;
ALTER TABLE tipos_via DROP INDEX IF EXISTS codigo;

-- Paso 2: Modificar la columna para remover UNIQUE constraint
ALTER TABLE tipos_via MODIFY COLUMN codigo VARCHAR(10) NOT NULL
COMMENT 'Código (AV, JR, CA, PJ, etc.) - Debe ser único solo entre registros activos';

-- Paso 3: Crear índice compuesto para optimizar búsquedas
-- Este índice permite búsquedas rápidas por codigo+estado
CREATE INDEX idx_tipos_via_codigo_estado ON tipos_via(codigo, estado);

-- Paso 4: Verificar que el cambio se aplicó correctamente
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
