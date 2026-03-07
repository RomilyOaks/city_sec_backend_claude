-- ============================================================
-- Migración: Crear tabla rol_estados_novedad
-- Fecha: 2026-03-06
-- Descripción: Tabla para controlar qué estados de novedad
--              puede usar cada rol del sistema.
-- ============================================================

CREATE TABLE IF NOT EXISTS `rol_estados_novedad` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `rol_id`            INT NOT NULL COMMENT 'FK a roles',
  `estado_novedad_id` INT NOT NULL COMMENT 'FK a estados_novedad',
  `descripcion`       TEXT NULL,
  `observaciones`     TEXT NULL,
  `estado`            TINYINT NOT NULL DEFAULT 1,
  `created_by`        INT NOT NULL,
  `updated_by`        INT NULL,
  `deleted_by`        INT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`        DATETIME NULL,

  PRIMARY KEY (`id`),

  UNIQUE KEY `uq_rol_estados_novedad_rol_estado` (`rol_id`, `estado_novedad_id`),

  INDEX `idx_rol_estados_novedad_rol_id`           (`rol_id`),
  INDEX `idx_rol_estados_novedad_estado_novedad_id` (`estado_novedad_id`),
  INDEX `idx_rol_estados_novedad_created_by`       (`created_by`),
  INDEX `idx_rol_estados_novedad_updated_by`       (`updated_by`),
  INDEX `idx_rol_estados_novedad_deleted_by`       (`deleted_by`),

  CONSTRAINT `fk_ren_rol_id`
    FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_ren_estado_novedad_id`
    FOREIGN KEY (`estado_novedad_id`) REFERENCES `estados_novedad` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_ren_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_ren_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `fk_ren_deleted_by`
    FOREIGN KEY (`deleted_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Control de accesos a estados de novedades por roles';
