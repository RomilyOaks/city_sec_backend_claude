-- =============================================================================
-- MIGRACIÓN 003: Sistema de Tracking GPS de Vehículos de Patrullaje
-- =============================================================================
-- Archivo  : migrations/003_tracking_tables_mysql.sql
-- Proyecto : CitySecure Backend
-- Fecha    : 2026-05-27
-- BD       : MySQL 8.0 (Railway)
--
-- Descripción:
--   Crea las dos tablas del sistema de tracking GPS en tiempo real:
--
--   tracking_vehiculos  — Snapshot de la última posición de cada unidad.
--                         Una sola fila por vehículo (UNIQUE vehiculo_id).
--                         Siempre UPSERT: INSERT ... ON DUPLICATE KEY UPDATE.
--
--   tracking_historial  — Historial completo de posiciones para reconstruir
--                         rutas patrulladas por turno. Alta frecuencia de
--                         inserción. Purgar registros > 30 días.
--
-- PRERREQUISITOS:
--   Las siguientes tablas deben existir antes de ejecutar este script:
--   - vehiculos
--   - personal_seguridad
--   - operativos_turno
--
-- INSTRUCCIONES:
--   Ejecutar manualmente contra la BD Railway.
--   NO usar con Sequelize sync automático (force/alter).
--   Conectar via: railway connect --service <mysql-service>
--   O via cliente MySQL apuntando a las credenciales de Railway.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS tracking_historial;
--   DROP TABLE IF EXISTS tracking_vehiculos;
-- =============================================================================


-- =============================================================================
-- TABLA 1: tracking_vehiculos
-- Estado "en vivo" de la flota — última posición conocida por unidad.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `tracking_vehiculos` (
  `id`                  INT            NOT NULL AUTO_INCREMENT
                                       COMMENT 'PK autoincremental',
  `vehiculo_id`         INT            NOT NULL
                                       COMMENT 'FK a vehiculos.id — UNIQUE: una posición activa por unidad',
  `personal_id`         INT            NULL
                                       COMMENT 'FK a personal_seguridad.id — conductor activo (NULL si no asignado)',
  `operativo_id`        BIGINT UNSIGNED NULL
                                       COMMENT 'FK a operativos_turno.id — turno activo (NULL fuera de turno). BIGINT UNSIGNED para coincidir con PK de operativos_turno',
  `lat`                 DECIMAL(10,8)  NOT NULL
                                       COMMENT 'Latitud GPS — rango válido: -90 a 90',
  `lng`                 DECIMAL(11,8)  NOT NULL
                                       COMMENT 'Longitud GPS — rango válido: -180 a 180',
  `velocidad`           DECIMAL(5,2)   NULL
                                       COMMENT 'Velocidad en km/h reportada por el dispositivo',
  `precision_gps`       DECIMAL(6,2)   NULL
                                       COMMENT 'Precisión del GPS en metros (menor = más preciso)',
  `bateria_dispositivo` TINYINT        NULL
                                       COMMENT 'Porcentaje de batería del dispositivo móvil (0–100)',
  `activo`              TINYINT(1)     NOT NULL DEFAULT 1
                                       COMMENT '1 = en servicio y enviando GPS | 0 = inactivo',
  `created_at`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       COMMENT 'Timestamp de creación del registro',
  `updated_at`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                ON UPDATE CURRENT_TIMESTAMP
                                       COMMENT 'Timestamp de última actualización de posición GPS',

  PRIMARY KEY (`id`),

  -- Una sola fila activa por vehículo — garantiza el UPSERT
  UNIQUE KEY `uq_tracking_vehiculo_id` (`vehiculo_id`),

  -- Filtros frecuentes del dashboard
  INDEX `idx_tracking_operativo`  (`operativo_id`),
  INDEX `idx_tracking_activo`     (`activo`),

  -- Filtro: WHERE updated_at > NOW() - INTERVAL 10 MINUTE (vehículos activos)
  INDEX `idx_tracking_updated_at` (`updated_at`),

  CONSTRAINT `fk_tv_vehiculo`
    FOREIGN KEY (`vehiculo_id`)
    REFERENCES `vehiculos` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT `fk_tv_personal`
    FOREIGN KEY (`personal_id`)
    REFERENCES `personal_seguridad` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT `fk_tv_operativo`
    FOREIGN KEY (`operativo_id`)
    REFERENCES `operativos_turno` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Snapshot de última posición GPS por vehículo. Una fila por unidad — siempre UPSERT.';


-- =============================================================================
-- TABLA 2: tracking_historial
-- Trazado GPS completo — usado para reconstruir rutas patrulladas.
-- Alta frecuencia de escritura. PURGAR registros > 30 días.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `tracking_historial` (
  `id`            BIGINT        NOT NULL AUTO_INCREMENT
                                COMMENT 'PK BIGINT — tabla de alto volumen de inserción',
  `vehiculo_id`   INT           NOT NULL
                                COMMENT 'FK a vehiculos.id',
  `lat`           DECIMAL(10,8) NOT NULL
                                COMMENT 'Latitud GPS en este punto de la ruta',
  `lng`           DECIMAL(11,8) NOT NULL
                                COMMENT 'Longitud GPS en este punto de la ruta',
  `velocidad`     DECIMAL(5,2)  NULL
                                COMMENT 'Velocidad en km/h en este punto de la ruta',
  `registrado_at` DATETIME      NOT NULL
                                COMMENT 'Timestamp del DISPOSITIVO — puede diferir del servidor por latencia',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                COMMENT 'Timestamp del SERVIDOR — cuando se recibió el dato',

  PRIMARY KEY (`id`),

  -- Consulta principal: ruta de un vehículo en un rango de tiempo
  -- WHERE vehiculo_id = ? AND registrado_at BETWEEN ? AND ? ORDER BY registrado_at ASC
  INDEX `idx_historial_vehiculo_tiempo` (`vehiculo_id`, `registrado_at`),

  -- Purga periódica: DELETE WHERE registrado_at < NOW() - INTERVAL 30 DAY
  INDEX `idx_historial_registrado_at` (`registrado_at`),

  CONSTRAINT `fk_th_vehiculo`
    FOREIGN KEY (`vehiculo_id`)
    REFERENCES `vehiculos` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE

) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Historial de posiciones GPS para rutas. PURGAR registros > 30 días.';


-- =============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar para confirmar que las tablas se crearon correctamente.
-- =============================================================================

-- SHOW CREATE TABLE tracking_vehiculos\G
-- SHOW CREATE TABLE tracking_historial\G
-- SHOW INDEX FROM tracking_vehiculos;
-- SHOW INDEX FROM tracking_historial;


-- =============================================================================
-- PURGA MANUAL DE DATOS HISTÓRICOS (ejecutar cuando sea necesario)
-- =============================================================================
--
-- Purgar en batches para no bloquear la tabla durante la ejecución:
--
--   DELETE FROM tracking_historial
--   WHERE registrado_at < NOW() - INTERVAL 30 DAY
--   LIMIT 10000;
--
-- Repetir hasta que no queden filas afectadas (@@ROW_COUNT = 0).
--
-- -----------------------------------------------------------------------------
-- AUTOMATIZACIÓN CON MYSQL EVENT SCHEDULER (opcional):
-- Requiere que el Event Scheduler esté habilitado en Railway.
--
--   SET GLOBAL event_scheduler = ON;
--
--   CREATE EVENT IF NOT EXISTS `evt_purga_tracking_historial`
--     ON SCHEDULE EVERY 1 DAY
--     STARTS CURRENT_TIMESTAMP + INTERVAL 1 DAY
--     DO
--       DELETE FROM tracking_historial
--       WHERE registrado_at < NOW() - INTERVAL 30 DAY
--       LIMIT 50000;
--
-- =============================================================================
