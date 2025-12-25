-- =====================================================================
-- SCRIPT: Creación de Sistema de Maestro de Calles - CitySecure
-- Versión: 3.0
-- Fecha: Diciembre 2025
-- Base de Datos: citizen_security_v2
-- =====================================================================
-- DESCRIPCIÓN:
-- Este script crea las 4 tablas nuevas para el sistema de gestión de calles
-- y modifica la tabla novedades_incidentes para integrar direcciones.
-- 
-- ORDEN DE EJECUCIÓN:
-- 1. tipos_via (catálogo)
-- 2. calles (maestro principal)
-- 3. calles_cuadrantes (relación M:N)
-- 4. direcciones (direcciones normalizadas)
-- 5. ALTER novedades_incidentes (agregar FK)
-- =====================================================================

USE `citizen_security_v2`;

-- =====================================================================
-- 1. TABLA: tipos_via
-- Catálogo de tipos de vías (Avenida, Jirón, Calle, Pasaje, etc.)
-- =====================================================================

DROP TABLE IF EXISTS `tipos_via`;

CREATE TABLE `tipos_via` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(10) NOT NULL COMMENT 'Código único (AV, JR, CA, PJ, etc.)',
  `nombre` VARCHAR(50) NOT NULL COMMENT 'Nombre completo (Avenida, Jirón, Calle)',
  `abreviatura` VARCHAR(10) NOT NULL COMMENT 'Abreviatura oficial (Av., Jr., Ca.)',
  `descripcion` TEXT,
  `orden` INT DEFAULT 0 COMMENT 'Orden de visualización',
  `estado` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_via_codigo` (`codigo`),
  KEY `idx_tipos_via_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Catálogo de tipos de vías (Av, Jr, Ca, Psje, etc.)';

-- =====================================================================
-- 2. TABLA: calles
-- Maestro principal de todas las calles del distrito
-- =====================================================================

DROP TABLE IF EXISTS `calles`;

CREATE TABLE `calles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `calle_code` VARCHAR(20) NOT NULL COMMENT 'Código único de calle (C001, C002)',
  `tipo_via_id` INT NOT NULL COMMENT 'FK a tipos_via',
  `nombre_via` VARCHAR(200) NOT NULL COMMENT 'Nombre de la vía (Ejército, Garcilaso, etc.)',
  `nombre_completo` VARCHAR(250) DEFAULT NULL COMMENT 'Nombre completo (ej: "Av. Ejército") - se actualiza via trigger',
  
  -- Ubicación geográfica
  `ubigeo_code` CHAR(6) DEFAULT NULL COMMENT 'UBIGEO del distrito',
  `urbanizacion` VARCHAR(150) DEFAULT NULL COMMENT 'Urbanización, AAHH, Vecindario',
  `zona` VARCHAR(100) DEFAULT NULL COMMENT 'Zona general (opcional)',
  
  -- Características de la calle
  `longitud_metros` DECIMAL(8,2) DEFAULT NULL COMMENT 'Longitud aproximada en metros',
  `ancho_metros` DECIMAL(5,2) DEFAULT NULL COMMENT 'Ancho promedio de la vía',
  `tipo_pavimento` ENUM('ASFALTO','CONCRETO','AFIRMADO','TROCHA','ADOQUIN','SIN_PAVIMENTO') 
    DEFAULT NULL,
  `sentido_via` ENUM('UNA_VIA','DOBLE_VIA','VARIABLE') DEFAULT 'DOBLE_VIA',
  `carriles` TINYINT DEFAULT NULL COMMENT 'Número de carriles',
  
  -- Intersecciones principales (referencias)
  `interseccion_inicio` VARCHAR(200) DEFAULT NULL COMMENT 'Calle que cruza al inicio',
  `interseccion_fin` VARCHAR(200) DEFAULT NULL COMMENT 'Calle que cruza al final',
  
  -- Geometría (opcional, para mapas avanzados)
  `linea_geometria_json` JSON DEFAULT NULL COMMENT 'Coordenadas LineString GeoJSON',
  
  -- Metadatos
  `observaciones` TEXT,
  `es_principal` TINYINT DEFAULT 0 COMMENT '1=Vía principal, 0=Vía secundaria',
  `categoria_via` ENUM('ARTERIAL','COLECTORA','LOCAL','RESIDENCIAL') DEFAULT 'LOCAL',
  
  -- Auditoría
  `estado` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `deleted_by` INT DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_calle_code` (`calle_code`),
  UNIQUE KEY `uq_tipo_nombre_via` (`tipo_via_id`, `nombre_via`, `urbanizacion`),
  KEY `idx_calles_ubigeo` (`ubigeo_code`),
  KEY `idx_calles_urbanizacion` (`urbanizacion`),
  KEY `idx_calles_zona` (`zona`),
  KEY `idx_calles_estado` (`estado`),
  KEY `idx_calles_nombre` (`nombre_via`),
  KEY `idx_calles_principal` (`es_principal`),
  
  CONSTRAINT `fk_calle_tipo_via` 
    FOREIGN KEY (`tipo_via_id`) REFERENCES `tipos_via` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_calle_ubigeo` 
    FOREIGN KEY (`ubigeo_code`) REFERENCES `ubigeo` (`ubigeo_code`) 
    ON DELETE SET NULL ON UPDATE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Maestro de calles del distrito';

-- =====================================================================
-- TRIGGER: Actualizar nombre_completo automáticamente
-- =====================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_calles_nombre_completo_insert$$
CREATE TRIGGER trg_calles_nombre_completo_insert
BEFORE INSERT ON calles
FOR EACH ROW
BEGIN
  DECLARE v_abreviatura VARCHAR(10);
  
  SELECT abreviatura INTO v_abreviatura
  FROM tipos_via
  WHERE id = NEW.tipo_via_id;
  
  SET NEW.nombre_completo = CONCAT(v_abreviatura, ' ', NEW.nombre_via);
END$$

DROP TRIGGER IF EXISTS trg_calles_nombre_completo_update$$
CREATE TRIGGER trg_calles_nombre_completo_update
BEFORE UPDATE ON calles
FOR EACH ROW
BEGIN
  DECLARE v_abreviatura VARCHAR(10);
  
  -- Solo actualizar si cambió tipo_via_id o nombre_via
  IF NEW.tipo_via_id != OLD.tipo_via_id OR NEW.nombre_via != OLD.nombre_via THEN
    SELECT abreviatura INTO v_abreviatura
    FROM tipos_via
    WHERE id = NEW.tipo_via_id;
    
    SET NEW.nombre_completo = CONCAT(v_abreviatura, ' ', NEW.nombre_via);
  END IF;
END$$

DELIMITER ;

-- =====================================================================
-- 3. TABLA: calles_cuadrantes
-- Relación Many-to-Many entre calles y cuadrantes
-- Nota: No necesitamos calles_sectores porque cuadrantes ya tienen sector_id
-- =====================================================================

DROP TABLE IF EXISTS `calles_cuadrantes`;

CREATE TABLE `calles_cuadrantes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `calle_id` INT NOT NULL COMMENT 'FK a calles',
  `cuadrante_id` INT NOT NULL COMMENT 'FK a cuadrantes',
  
  -- Rango de numeración específico del cuadrante
  `numero_inicio` INT DEFAULT NULL COMMENT 'Número inicial en este cuadrante',
  `numero_fin` INT DEFAULT NULL COMMENT 'Número final en este cuadrante',
  `lado` ENUM('AMBOS','PAR','IMPAR','TODOS') DEFAULT 'AMBOS',
  
  -- Tramo específico
  `desde_interseccion` VARCHAR(200) DEFAULT NULL,
  `hasta_interseccion` VARCHAR(200) DEFAULT NULL,
  
  -- Prioridad para resolución de conflictos
  `prioridad` TINYINT DEFAULT 1,
  
  -- Auditoría
  `observaciones` TEXT,
  `estado` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `deleted_by` INT DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_calle_cuadrante` (`calle_id`, `cuadrante_id`),
  KEY `idx_cc_cuadrante` (`cuadrante_id`),
  KEY `idx_cc_estado` (`estado`),
  KEY `idx_cc_numero_rango` (`numero_inicio`, `numero_fin`),
  
  CONSTRAINT `fk_cc_calle` 
    FOREIGN KEY (`calle_id`) REFERENCES `calles` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cc_cuadrante` 
    FOREIGN KEY (`cuadrante_id`) REFERENCES `cuadrantes` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Relación de calles con cuadrantes (M:N)';

-- =====================================================================
-- 4. TABLA: direcciones
-- Direcciones normalizadas con soporte para numeración municipal y Mz/Lote
-- =====================================================================

DROP TABLE IF EXISTS `direcciones`;

CREATE TABLE `direcciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `direccion_code` VARCHAR(30) NOT NULL COMMENT 'Código único de dirección',
  
  -- Componentes de la dirección
  `calle_id` INT NOT NULL COMMENT 'FK a calles',
  
  -- Sistema de numeración municipal (cuando existe)
  `numero_municipal` VARCHAR(10) DEFAULT NULL COMMENT 'Número de puerta (100, 250-A, S/N)',
  
  -- Sistema de manzana/lote (AAHH, urbanizaciones informales)
  `manzana` VARCHAR(10) DEFAULT NULL COMMENT 'Manzana (A, B, C, 01, 02)',
  `lote` VARCHAR(10) DEFAULT NULL COMMENT 'Lote (1, 2, 3, A, B)',
  
  -- Complementos adicionales
  `urbanizacion` VARCHAR(150) DEFAULT NULL COMMENT 'Urbanización, AAHH, Vecindario específico',
  `tipo_complemento` ENUM('DEPTO','OFICINA','PISO','INTERIOR','LOTE','MZ','BLOCK','TORRE','CASA') 
    DEFAULT NULL COMMENT 'Tipo de complemento',
  `numero_complemento` VARCHAR(20) DEFAULT NULL COMMENT 'Número del complemento (Dpto 201, Of. 5B)',
  `referencia` VARCHAR(255) DEFAULT NULL COMMENT 'Referencia adicional',
  
  -- Dirección completa generada (se actualiza via trigger)
  `direccion_completa` VARCHAR(500) DEFAULT NULL COMMENT 'Dirección legible completa',
  
  -- Relaciones geográficas (auto-asignadas)
  `cuadrante_id` INT DEFAULT NULL COMMENT 'Cuadrante asignado automáticamente',
  `sector_id` INT DEFAULT NULL COMMENT 'Sector derivado del cuadrante',
  `ubigeo_code` CHAR(6) DEFAULT NULL,
  
  -- Geocodificación
  `latitud` DECIMAL(10,8) DEFAULT NULL,
  `longitud` DECIMAL(11,8) DEFAULT NULL,
  `geocodificada` TINYINT DEFAULT 0 COMMENT '1=Geocodificada, 0=Pendiente',
  `fuente_geocodificacion` VARCHAR(50) DEFAULT NULL COMMENT 'Google Maps, Manual, etc.',
  
  -- Validación
  `verificada` TINYINT DEFAULT 0 COMMENT '1=Verificada en campo, 0=No verificada',
  `fecha_verificacion` DATE DEFAULT NULL,
  
  -- Uso y estadísticas
  `veces_usada` INT DEFAULT 0 COMMENT 'Contador de veces que se usó esta dirección',
  `ultima_vez_usada` DATETIME DEFAULT NULL,
  
  -- Auditoría
  `observaciones` TEXT,
  `estado` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `deleted_by` INT DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_direccion_code` (`direccion_code`),
  UNIQUE KEY `uq_calle_direccion_completa` (`calle_id`, `numero_municipal`, `manzana`, `lote`, `numero_complemento`),
  KEY `idx_dir_cuadrante` (`cuadrante_id`),
  KEY `idx_dir_sector` (`sector_id`),
  KEY `idx_dir_ubigeo` (`ubigeo_code`),
  KEY `idx_dir_urbanizacion` (`urbanizacion`),
  KEY `idx_dir_geocodificada` (`geocodificada`),
  KEY `idx_dir_verificada` (`verificada`),
  KEY `idx_dir_coords` (`latitud`, `longitud`),
  KEY `idx_dir_manzana_lote` (`manzana`, `lote`),
  
  CONSTRAINT `fk_dir_calle` 
    FOREIGN KEY (`calle_id`) REFERENCES `calles` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_dir_cuadrante` 
    FOREIGN KEY (`cuadrante_id`) REFERENCES `cuadrantes` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_dir_sector` 
    FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_dir_ubigeo` 
    FOREIGN KEY (`ubigeo_code`) REFERENCES `ubigeo` (`ubigeo_code`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Validación: Al menos debe tener número municipal O manzana+lote
  CONSTRAINT `chk_dir_tiene_identificador` 
    CHECK (numero_municipal IS NOT NULL OR (manzana IS NOT NULL AND lote IS NOT NULL))
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
COMMENT='Direcciones normalizadas con geocodificación (numeración municipal y Mz/Lote)';

-- =====================================================================
-- TRIGGERS: Actualizar direccion_completa automáticamente
-- =====================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_direcciones_completa_insert$$
CREATE TRIGGER trg_direcciones_completa_insert
BEFORE INSERT ON direcciones
FOR EACH ROW
BEGIN
  DECLARE v_nombre_calle VARCHAR(250);
  
  SELECT nombre_completo INTO v_nombre_calle
  FROM calles
  WHERE id = NEW.calle_id;
  
  SET NEW.direccion_completa = CONCAT(
    v_nombre_calle,
    IFNULL(CONCAT(' N° ', NEW.numero_municipal), ''),
    IFNULL(CONCAT(' Mz. ', NEW.manzana), ''),
    IFNULL(CONCAT(' Lt. ', NEW.lote), ''),
    IFNULL(CONCAT(' - ', NEW.urbanizacion), ''),
    IF(NEW.tipo_complemento IS NOT NULL AND NEW.numero_complemento IS NOT NULL,
       CONCAT(' ', NEW.tipo_complemento, '. ', NEW.numero_complemento), ''),
    IFNULL(CONCAT(' (', NEW.referencia, ')'), '')
  );
END$$

DROP TRIGGER IF EXISTS trg_direcciones_completa_update$$
CREATE TRIGGER trg_direcciones_completa_update
BEFORE UPDATE ON direcciones
FOR EACH ROW
BEGIN
  DECLARE v_nombre_calle VARCHAR(250);
  
  -- Solo actualizar si cambió algún componente de la dirección
  IF NEW.calle_id != OLD.calle_id 
     OR IFNULL(NEW.numero_municipal, '') != IFNULL(OLD.numero_municipal, '')
     OR IFNULL(NEW.manzana, '') != IFNULL(OLD.manzana, '')
     OR IFNULL(NEW.lote, '') != IFNULL(OLD.lote, '')
     OR IFNULL(NEW.urbanizacion, '') != IFNULL(OLD.urbanizacion, '')
     OR IFNULL(NEW.tipo_complemento, '') != IFNULL(OLD.tipo_complemento, '')
     OR IFNULL(NEW.numero_complemento, '') != IFNULL(OLD.numero_complemento, '')
     OR IFNULL(NEW.referencia, '') != IFNULL(OLD.referencia, '') THEN
    
    SELECT nombre_completo INTO v_nombre_calle
    FROM calles
    WHERE id = NEW.calle_id;
    
    SET NEW.direccion_completa = CONCAT(
      v_nombre_calle,
      IFNULL(CONCAT(' N° ', NEW.numero_municipal), ''),
      IFNULL(CONCAT(' Mz. ', NEW.manzana), ''),
      IFNULL(CONCAT(' Lt. ', NEW.lote), ''),
      IFNULL(CONCAT(' - ', NEW.urbanizacion), ''),
      IF(NEW.tipo_complemento IS NOT NULL AND NEW.numero_complemento IS NOT NULL,
         CONCAT(' ', NEW.tipo_complemento, '. ', NEW.numero_complemento), ''),
      IFNULL(CONCAT(' (', NEW.referencia, ')'), '')
    );
  END IF;
END$$

DELIMITER ;

-- =====================================================================
-- 5. MODIFICACIÓN: novedades_incidentes
-- Agregar campo direccion_id para relacionar con direcciones normalizadas
-- =====================================================================

-- Agregar columna direccion_id
ALTER TABLE `novedades_incidentes`
ADD COLUMN `direccion_id` INT DEFAULT NULL COMMENT 'FK a direcciones (nueva relación)' 
AFTER `localizacion`;

-- Crear índice
ALTER TABLE `novedades_incidentes`
ADD KEY `idx_novedad_direccion` (`direccion_id`);

-- Crear foreign key
ALTER TABLE `novedades_incidentes`
ADD CONSTRAINT `fk_novedad_direccion` 
  FOREIGN KEY (`direccion_id`) REFERENCES `direcciones` (`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================

-- Verificar creación de tablas
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  AUTO_INCREMENT,
  CREATE_TIME,
  TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'citizen_security_v2'
  AND TABLE_NAME IN ('tipos_via', 'calles', 'calles_cuadrantes', 'direcciones')
ORDER BY TABLE_NAME;

-- Mensaje de confirmación
SELECT '✅ Sistema de Maestro de Calles creado exitosamente' AS STATUS;
SELECT '📋 Próximo paso: Ejecutar script 02_datos_iniciales_calles.sql' AS NEXT_STEP;
