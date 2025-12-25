-- =====================================================================
-- SCRIPT: Consultas Útiles y Funciones Helper - Sistema de Calles
-- Versión: 3.0
-- Fecha: Diciembre 2025
-- Base de Datos: citizen_security_v2
-- =====================================================================
-- DESCRIPCIÓN:
-- Este script contiene consultas útiles y funciones helper para
-- trabajar con el sistema de calles
-- =====================================================================

USE `citizen_security_v2`;

-- =====================================================================
-- PARTE 1: CONSULTAS DE BÚSQUEDA Y VALIDACIÓN
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1 Autocomplete de calles (para frontend)
-- ---------------------------------------------------------------------
-- Uso: Buscar calles que contengan "ejercito"
SELECT 
  id,
  calle_code,
  nombre_completo,
  urbanizacion,
  zona,
  categoria_via,
  es_principal
FROM calles
WHERE nombre_via LIKE '%ejercito%'
  AND estado = 1
ORDER BY es_principal DESC, nombre_via ASC
LIMIT 20;

-- ---------------------------------------------------------------------
-- 1.2 Buscar sector y cuadrante de una dirección
-- ---------------------------------------------------------------------
-- Uso: Obtener sector/cuadrante de "Av. Ejército 450"
SET @calle_id = 5;  -- Av. Ejército
SET @numero = 450;

SELECT 
  c.nombre_completo AS calle,
  cc.numero_inicio,
  cc.numero_fin,
  cu.cuadrante_code,
  cu.nombre AS cuadrante_nombre,
  s.sector_code,
  s.nombre AS sector_nombre,
  cc.prioridad
FROM calles c
INNER JOIN calles_cuadrantes cc ON c.id = cc.calle_id AND cc.estado = 1
INNER JOIN cuadrantes cu ON cc.cuadrante_id = cu.id AND cu.estado = 1
INNER JOIN sectores s ON cu.sector_id = s.id AND s.estado = 1
WHERE c.id = @calle_id
  AND (@numero IS NULL 
       OR cc.numero_inicio IS NULL 
       OR @numero >= cc.numero_inicio)
  AND (@numero IS NULL 
       OR cc.numero_fin IS NULL 
       OR @numero <= cc.numero_fin)
ORDER BY cc.prioridad ASC
LIMIT 1;

-- =====================================================================
-- PARTE 2: CONSULTAS DE REPORTES Y ESTADÍSTICAS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1 Calles por sector (a través de cuadrantes)
-- ---------------------------------------------------------------------
SELECT 
  s.sector_code,
  s.nombre AS sector,
  c.calle_code,
  c.nombre_completo AS calle,
  c.urbanizacion,
  cc.numero_inicio,
  cc.numero_fin,
  cu.cuadrante_code,
  cu.nombre AS cuadrante
FROM calles c
INNER JOIN calles_cuadrantes cc ON c.id = cc.calle_id AND cc.estado = 1
INNER JOIN cuadrantes cu ON cc.cuadrante_id = cu.id AND cu.estado = 1
INNER JOIN sectores s ON cu.sector_id = s.id AND s.estado = 1
WHERE s.sector_code = 'S001'
  AND c.estado = 1
ORDER BY c.es_principal DESC, c.nombre_via;

-- ---------------------------------------------------------------------
-- 2.2 Calles por cuadrante específico
-- ---------------------------------------------------------------------
SELECT 
  c.calle_code,
  c.nombre_completo,
  c.urbanizacion,
  cc.numero_inicio,
  cc.numero_fin,
  cc.desde_interseccion,
  cc.hasta_interseccion
FROM calles c
INNER JOIN calles_cuadrantes cc ON c.id = cc.calle_id
WHERE cc.cuadrante_id = 5 
  AND cc.estado = 1
ORDER BY c.nombre_via;

-- ---------------------------------------------------------------------
-- 2.3 Estadísticas de novedades por calle
-- ---------------------------------------------------------------------
SELECT 
  c.nombre_completo AS calle,
  c.urbanizacion,
  COUNT(n.id) AS total_novedades,
  s.nombre AS sector,
  cu.nombre AS cuadrante,
  SUM(d.veces_usada) AS veces_usada_total
FROM direcciones d
INNER JOIN calles c ON d.calle_id = c.id
INNER JOIN cuadrantes cu ON d.cuadrante_id = cu.id
INNER JOIN sectores s ON cu.sector_id = s.id
LEFT JOIN novedades_incidentes n ON n.direccion_id = d.id
WHERE YEAR(n.fecha_hora_ocurrencia) = 2025
  AND d.estado = 1
GROUP BY c.id, s.id, cu.id
ORDER BY total_novedades DESC
LIMIT 20;

-- ---------------------------------------------------------------------
-- 2.4 Direcciones más peligrosas (puntos calientes)
-- ---------------------------------------------------------------------
SELECT 
  d.direccion_completa,
  d.veces_usada,
  COUNT(n.id) AS incidentes_recientes,
  s.nombre AS sector,
  cu.nombre AS cuadrante,
  d.latitud,
  d.longitud
FROM direcciones d
INNER JOIN cuadrantes cu ON d.cuadrante_id = cu.id
INNER JOIN sectores s ON cu.sector_id = s.id
LEFT JOIN novedades_incidentes n ON n.direccion_id = d.id
WHERE n.fecha_hora_ocurrencia >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
  AND d.estado = 1
GROUP BY d.id
HAVING incidentes_recientes >= 3
ORDER BY incidentes_recientes DESC, d.veces_usada DESC
LIMIT 30;

-- ---------------------------------------------------------------------
-- 2.5 Direcciones de un AAHH o Urbanización
-- ---------------------------------------------------------------------
SELECT 
  d.direccion_completa,
  d.manzana,
  d.lote,
  d.numero_municipal,
  d.veces_usada,
  CONCAT(cu.cuadrante_code, ' - ', cu.nombre) AS cuadrante,
  CONCAT(s.sector_code, ' - ', s.nombre) AS sector
FROM direcciones d
INNER JOIN cuadrantes cu ON d.cuadrante_id = cu.id
INNER JOIN sectores s ON cu.sector_id = s.id
WHERE d.urbanizacion LIKE '%Villa El Salvador%'
  AND d.estado = 1
ORDER BY d.manzana, d.lote, d.numero_municipal;

-- ---------------------------------------------------------------------
-- 2.6 Validar cobertura de calles por cuadrante
-- ---------------------------------------------------------------------
-- Muestra cuadrantes con pocas calles mapeadas
SELECT 
  s.sector_code,
  s.nombre AS sector,
  cu.cuadrante_code,
  cu.nombre AS cuadrante,
  COUNT(DISTINCT cc.calle_id) AS total_calles,
  CASE 
    WHEN COUNT(DISTINCT cc.calle_id) = 0 THEN '❌ Sin calles'
    WHEN COUNT(DISTINCT cc.calle_id) < 5 THEN '⚠️ Pocas calles'
    ELSE '✅ OK'
  END AS estado_cobertura
FROM cuadrantes cu
INNER JOIN sectores s ON cu.sector_id = s.id
LEFT JOIN calles_cuadrantes cc ON cu.id = cc.cuadrante_id AND cc.estado = 1
WHERE cu.estado = 1
GROUP BY cu.id
ORDER BY total_calles ASC, s.sector_code, cu.cuadrante_code;

-- =====================================================================
-- PARTE 3: CONSULTAS DE MANTENIMIENTO
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3.1 Detectar direcciones sin geocodificar
-- ---------------------------------------------------------------------
SELECT 
  d.direccion_code,
  d.direccion_completa,
  d.veces_usada,
  d.created_at
FROM direcciones d
WHERE d.geocodificada = 0
  AND d.estado = 1
ORDER BY d.veces_usada DESC, d.created_at DESC
LIMIT 50;

-- ---------------------------------------------------------------------
-- 3.2 Detectar direcciones sin cuadrante/sector asignado
-- ---------------------------------------------------------------------
SELECT 
  d.direccion_code,
  d.direccion_completa,
  c.nombre_completo AS calle,
  d.cuadrante_id,
  d.sector_id,
  d.created_at
FROM direcciones d
INNER JOIN calles c ON d.calle_id = c.id
WHERE (d.cuadrante_id IS NULL OR d.sector_id IS NULL)
  AND d.estado = 1
ORDER BY d.created_at DESC;

-- ---------------------------------------------------------------------
-- 3.3 Calles sin asignar a ningún cuadrante
-- ---------------------------------------------------------------------
SELECT 
  c.calle_code,
  c.nombre_completo,
  c.urbanizacion,
  c.created_at,
  COUNT(cc.id) AS cuadrantes_asignados
FROM calles c
LEFT JOIN calles_cuadrantes cc ON c.id = cc.calle_id AND cc.estado = 1
WHERE c.estado = 1
GROUP BY c.id
HAVING cuadrantes_asignados = 0
ORDER BY c.created_at DESC;

-- ---------------------------------------------------------------------
-- 3.4 Duplicados potenciales en calles
-- ---------------------------------------------------------------------
SELECT 
  tipo_via_id,
  nombre_via,
  urbanizacion,
  COUNT(*) AS total,
  GROUP_CONCAT(calle_code SEPARATOR ', ') AS codigos
FROM calles
WHERE estado = 1
GROUP BY tipo_via_id, nombre_via, urbanizacion
HAVING total > 1
ORDER BY total DESC;

-- =====================================================================
-- PARTE 4: STORED PROCEDURES ÚTILES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4.1 Procedure: Buscar cuadrante y sector de una dirección
-- ---------------------------------------------------------------------

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_buscar_cuadrante_sector$$

CREATE PROCEDURE sp_buscar_cuadrante_sector(
  IN p_calle_id INT,
  IN p_numero INT,
  OUT p_cuadrante_id INT,
  OUT p_sector_id INT
)
BEGIN
  -- Buscar el cuadrante basado en la calle y número
  SELECT 
    cc.cuadrante_id,
    cu.sector_id
  INTO p_cuadrante_id, p_sector_id
  FROM calles_cuadrantes cc
  INNER JOIN cuadrantes cu ON cc.cuadrante_id = cu.id
  WHERE cc.calle_id = p_calle_id
    AND cc.estado = 1
    AND cu.estado = 1
    AND (p_numero IS NULL 
         OR cc.numero_inicio IS NULL 
         OR p_numero >= cc.numero_inicio)
    AND (p_numero IS NULL 
         OR cc.numero_fin IS NULL 
         OR p_numero <= cc.numero_fin)
  ORDER BY cc.prioridad ASC
  LIMIT 1;
END$$

DELIMITER ;

-- Ejemplo de uso:
-- CALL sp_buscar_cuadrante_sector(5, 450, @cuadrante, @sector);
-- SELECT @cuadrante AS cuadrante_id, @sector AS sector_id;

-- ---------------------------------------------------------------------
-- 4.2 Procedure: Registrar nueva dirección con auto-asignación
-- ---------------------------------------------------------------------

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_registrar_direccion$$

CREATE PROCEDURE sp_registrar_direccion(
  IN p_calle_id INT,
  IN p_numero_municipal VARCHAR(10),
  IN p_manzana VARCHAR(10),
  IN p_lote VARCHAR(10),
  IN p_urbanizacion VARCHAR(150),
  IN p_tipo_complemento VARCHAR(20),
  IN p_numero_complemento VARCHAR(20),
  IN p_referencia VARCHAR(255),
  IN p_usuario_id INT,
  OUT p_direccion_id INT,
  OUT p_direccion_code VARCHAR(30)
)
BEGIN
  DECLARE v_cuadrante_id INT;
  DECLARE v_sector_id INT;
  DECLARE v_ubigeo_code CHAR(6);
  DECLARE v_numero_int INT;
  
  -- Convertir número a entero si existe
  SET v_numero_int = CAST(p_numero_municipal AS UNSIGNED);
  
  -- Buscar cuadrante y sector
  CALL sp_buscar_cuadrante_sector(p_calle_id, v_numero_int, v_cuadrante_id, v_sector_id);
  
  -- Obtener ubigeo de la calle
  SELECT ubigeo_code INTO v_ubigeo_code
  FROM calles
  WHERE id = p_calle_id;
  
  -- Generar código único
  SET p_direccion_code = CONCAT('DIR-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
  
  -- Insertar dirección
  INSERT INTO direcciones (
    direccion_code,
    calle_id,
    numero_municipal,
    manzana,
    lote,
    urbanizacion,
    tipo_complemento,
    numero_complemento,
    referencia,
    cuadrante_id,
    sector_id,
    ubigeo_code,
    created_by
  ) VALUES (
    p_direccion_code,
    p_calle_id,
    p_numero_municipal,
    p_manzana,
    p_lote,
    p_urbanizacion,
    p_tipo_complemento,
    p_numero_complemento,
    p_referencia,
    v_cuadrante_id,
    v_sector_id,
    v_ubigeo_code,
    p_usuario_id
  );
  
  SET p_direccion_id = LAST_INSERT_ID();
END$$

DELIMITER ;

-- Ejemplo de uso (numeración municipal):
-- CALL sp_registrar_direccion(5, '450', NULL, NULL, NULL, 'DEPTO', '201', 'Frente al parque', 1, @dir_id, @dir_code);
-- SELECT @dir_id AS direccion_id, @dir_code AS direccion_code;

-- Ejemplo de uso (Mz/Lote):
-- CALL sp_registrar_direccion(100, NULL, 'B', '15', 'AAHH Villa El Salvador', NULL, NULL, 'Al lado de bodega', 1, @dir_id, @dir_code);
-- SELECT @dir_id AS direccion_id, @dir_code AS direccion_code;

-- =====================================================================
-- PARTE 5: TRIGGERS ÚTILES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5.1 Trigger: Actualizar contador veces_usada al usar una dirección
-- ---------------------------------------------------------------------

DELIMITER $$

DROP TRIGGER IF EXISTS trg_direccion_usada$$

CREATE TRIGGER trg_direccion_usada
AFTER INSERT ON novedades_incidentes
FOR EACH ROW
BEGIN
  IF NEW.direccion_id IS NOT NULL THEN
    UPDATE direcciones
    SET veces_usada = veces_usada + 1,
        ultima_vez_usada = NOW()
    WHERE id = NEW.direccion_id;
  END IF;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- 5.2 Trigger: Auto-asignar sector desde cuadrante en direcciones
-- ---------------------------------------------------------------------

DELIMITER $$

DROP TRIGGER IF EXISTS trg_direccion_auto_sector$$

CREATE TRIGGER trg_direccion_auto_sector
BEFORE INSERT ON direcciones
FOR EACH ROW
BEGIN
  -- Si tiene cuadrante pero no sector, asignarlo automáticamente
  IF NEW.cuadrante_id IS NOT NULL AND NEW.sector_id IS NULL THEN
    SELECT sector_id INTO NEW.sector_id
    FROM cuadrantes
    WHERE id = NEW.cuadrante_id;
  END IF;
END$$

DELIMITER ;

-- =====================================================================
-- PARTE 6: VISTAS ÚTILES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 6.1 Vista: Direcciones completas con ubicación
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW v_direcciones_completas AS
SELECT 
  d.id,
  d.direccion_code,
  d.direccion_completa,
  c.nombre_completo AS calle,
  c.urbanizacion AS calle_urbanizacion,
  d.numero_municipal,
  d.manzana,
  d.lote,
  d.urbanizacion AS direccion_urbanizacion,
  cu.cuadrante_code,
  cu.nombre AS cuadrante_nombre,
  s.sector_code,
  s.nombre AS sector_nombre,
  d.latitud,
  d.longitud,
  d.geocodificada,
  d.verificada,
  d.veces_usada,
  d.ultima_vez_usada,
  d.estado
FROM direcciones d
INNER JOIN calles c ON d.calle_id = c.id
LEFT JOIN cuadrantes cu ON d.cuadrante_id = cu.id
LEFT JOIN sectores s ON d.sector_id = s.id;

-- ---------------------------------------------------------------------
-- 6.2 Vista: Estadísticas de calles
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW v_estadisticas_calles AS
SELECT 
  c.id,
  c.calle_code,
  c.nombre_completo,
  c.urbanizacion,
  c.categoria_via,
  c.es_principal,
  COUNT(DISTINCT cc.cuadrante_id) AS total_cuadrantes,
  COUNT(DISTINCT cu.sector_id) AS total_sectores,
  COUNT(DISTINCT d.id) AS total_direcciones,
  SUM(d.veces_usada) AS total_usos,
  c.estado
FROM calles c
LEFT JOIN calles_cuadrantes cc ON c.id = cc.calle_id AND cc.estado = 1
LEFT JOIN cuadrantes cu ON cc.cuadrante_id = cu.id AND cu.estado = 1
LEFT JOIN direcciones d ON c.id = d.calle_id AND d.estado = 1
WHERE c.estado = 1
GROUP BY c.id;

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================

SELECT '✅ Consultas, procedures, triggers y vistas creados correctamente' AS STATUS;
