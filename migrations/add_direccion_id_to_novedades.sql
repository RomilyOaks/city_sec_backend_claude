-- ===================================================
-- MIGRACIÓN: Agregar columna direccion_id a novedades_incidentes
-- ===================================================
-- Fecha: 2026-01-04
-- Descripción: Agrega la columna direccion_id para relacionar novedades con direcciones
-- ===================================================

-- Verificar si la columna ya existe antes de agregarla
SET @dbname = DATABASE();
SET @tablename = 'novedades_incidentes';
SET @columnname = 'direccion_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'La columna direccion_id ya existe en novedades_incidentes' AS message;",
  "ALTER TABLE novedades_incidentes ADD COLUMN direccion_id INT NULL AFTER cuadrante_id, ADD INDEX idx_novedades_direccion (direccion_id);"
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar foreign key constraint (opcional, solo si no existe)
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
      AND (CONSTRAINT_NAME LIKE 'fk_%')
  ) > 0,
  "SELECT 'La foreign key para direccion_id ya existe' AS message;",
  "ALTER TABLE novedades_incidentes ADD CONSTRAINT fk_novedades_direccion FOREIGN KEY (direccion_id) REFERENCES direcciones(id) ON DELETE SET NULL ON UPDATE CASCADE;"
));

PREPARE alterFKIfNotExists FROM @preparedStatement2;
EXECUTE alterFKIfNotExists;
DEALLOCATE PREPARE alterFKIfNotExists;

-- Mostrar resultado
SELECT 'Migración completada exitosamente' AS resultado;
