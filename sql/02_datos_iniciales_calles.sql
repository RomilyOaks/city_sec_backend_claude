-- =====================================================================
-- SCRIPT: Datos Iniciales - Sistema de Maestro de Calles
-- Versión: 3.0
-- Fecha: Diciembre 2025
-- Base de Datos: citizen_security_v2
-- =====================================================================
-- DESCRIPCIÓN:
-- Este script inserta los datos iniciales del sistema de calles:
-- 1. Tipos de vías (Av, Jr, Ca, etc.)
-- 2. Ejemplos de calles comunes de Lima
-- =====================================================================

USE `citizen_security_v2`;

-- =====================================================================
-- 1. DATOS INICIALES: tipos_via
-- Catálogo estándar de tipos de vías en Perú
-- =====================================================================

INSERT INTO `tipos_via` 
  (`codigo`, `nombre`, `abreviatura`, `descripcion`, `orden`, `estado`) 
VALUES
  -- Vías principales
  ('AV', 'Avenida', 'Av.', 'Vía urbana principal de gran amplitud', 1, 1),
  ('JR', 'Jirón', 'Jr.', 'Vía urbana tradicional', 2, 1),
  ('CA', 'Calle', 'Ca.', 'Vía urbana secundaria', 3, 1),
  
  -- Vías especiales
  ('PJ', 'Pasaje', 'Psje.', 'Vía peatonal o de acceso limitado', 4, 1),
  ('AL', 'Alameda', 'Alam.', 'Paseo arbolado', 5, 1),
  ('ML', 'Malecón', 'Malec.', 'Vía junto al mar, río o barranco', 6, 1),
  ('PR', 'Prolongación', 'Prol.', 'Extensión de una vía existente', 7, 1),
  
  -- Espacios públicos
  ('PZ', 'Plaza', 'Pza.', 'Espacio público abierto', 8, 1),
  ('PQ', 'Parque', 'Pq.', 'Área verde pública', 9, 1),
  ('OV', 'Óvalo', 'Óv.', 'Intersección circular', 10, 1),
  
  -- Otras vías
  ('CM', 'Camino', 'Cam.', 'Vía rural o periurbana', 11, 1),
  ('PS', 'Paseo', 'Ps.', 'Vía para pasear', 12, 1),
  ('BV', 'Boulevard', 'Blvd.', 'Avenida ancha con áreas verdes', 13, 1),
  ('AU', 'Autopista', 'Autop.', 'Vía rápida de alta capacidad', 14, 1),
  ('TR', 'Trocha', 'Tr.', 'Vía sin pavimentar', 15, 1);

-- =====================================================================
-- 2. EJEMPLOS: Calles principales de Lima
-- Nota: Estos son ejemplos. Debes reemplazar con las calles reales
--       de tu distrito específico
-- =====================================================================

-- IMPORTANTE: Ajusta el ubigeo_code según tu distrito
-- Ejemplo: 150101 = Lima (Cercado)
--          150122 = Lima (Miraflores)
--          150130 = Lima (San Isidro)
SET @ubigeo_lima = '150101'; -- Ajustar según tu distrito

-- Avenidas principales
INSERT INTO `calles` 
  (`calle_code`, `tipo_via_id`, `nombre_via`, `ubigeo_code`, `categoria_via`, `es_principal`, `estado`)
VALUES
  ('C001', 1, 'Arequipa', @ubigeo_lima, 'ARTERIAL', 1, 1),
  ('C002', 1, 'Javier Prado', @ubigeo_lima, 'ARTERIAL', 1, 1),
  ('C003', 1, 'La Marina', @ubigeo_lima, 'ARTERIAL', 1, 1),
  ('C004', 1, 'Brasil', @ubigeo_lima, 'ARTERIAL', 1, 1),
  ('C005', 1, 'Ejército', @ubigeo_lima, 'COLECTORA', 1, 1),
  ('C006', 1, 'Salaverry', @ubigeo_lima, 'ARTERIAL', 1, 1),
  ('C007', 1, 'Universitaria', @ubigeo_lima, 'ARTERIAL', 1, 1),
  ('C008', 1, 'Túpac Amaru', @ubigeo_lima, 'ARTERIAL', 1, 1),
  ('C009', 1, 'Colonial', @ubigeo_lima, 'COLECTORA', 1, 1),
  ('C010', 1, 'Angamos', @ubigeo_lima, 'COLECTORA', 1, 1);

-- Jirones
INSERT INTO `calles` 
  (`calle_code`, `tipo_via_id`, `nombre_via`, `ubigeo_code`, `categoria_via`, `estado`)
VALUES
  ('C011', 2, 'De la Unión', @ubigeo_lima, 'LOCAL', 1),
  ('C012', 2, 'Lampa', @ubigeo_lima, 'LOCAL', 1),
  ('C013', 2, 'Carabaya', @ubigeo_lima, 'LOCAL', 1),
  ('C014', 2, 'Ancash', @ubigeo_lima, 'LOCAL', 1),
  ('C015', 2, 'Huallaga', @ubigeo_lima, 'LOCAL', 1);

-- Calles
INSERT INTO `calles` 
  (`calle_code`, `tipo_via_id`, `nombre_via`, `ubigeo_code`, `categoria_via`, `estado`)
VALUES
  ('C016', 3, 'Las Begonias', @ubigeo_lima, 'LOCAL', 1),
  ('C017', 3, 'Los Pinos', @ubigeo_lima, 'RESIDENCIAL', 1),
  ('C018', 3, 'Las Flores', @ubigeo_lima, 'RESIDENCIAL', 1),
  ('C019', 3, 'Los Cedros', @ubigeo_lima, 'RESIDENCIAL', 1),
  ('C020', 3, 'San Martín', @ubigeo_lima, 'LOCAL', 1);

-- =====================================================================
-- 3. EJEMPLO: Calles en Urbanización/AAHH
-- Ejemplo de cómo registrar calles en asentamientos humanos
-- =====================================================================

INSERT INTO `calles` 
  (`calle_code`, `tipo_via_id`, `nombre_via`, `ubigeo_code`, `urbanizacion`, `categoria_via`, `estado`)
VALUES
  ('C100', 3, 'Principal', @ubigeo_lima, 'AAHH Villa El Salvador', 'LOCAL', 1),
  ('C101', 3, '1', @ubigeo_lima, 'AAHH Villa El Salvador', 'RESIDENCIAL', 1),
  ('C102', 3, '2', @ubigeo_lima, 'AAHH Villa El Salvador', 'RESIDENCIAL', 1),
  ('C103', 3, '3', @ubigeo_lima, 'AAHH Villa El Salvador', 'RESIDENCIAL', 1),
  ('C104', 2, 'Los Jardines', @ubigeo_lima, 'Urbanización Los Rosales', 'RESIDENCIAL', 1),
  ('C105', 2, 'Las Palmeras', @ubigeo_lima, 'Urbanización Los Rosales', 'RESIDENCIAL', 1);

-- =====================================================================
-- 4. VERIFICACIÓN DE DATOS INSERTADOS
-- =====================================================================

-- Contar tipos de vías insertados
SELECT 
  'Tipos de Vía' AS tabla,
  COUNT(*) AS total_registros
FROM tipos_via
WHERE estado = 1;

-- Contar calles insertadas
SELECT 
  'Calles' AS tabla,
  COUNT(*) AS total_registros
FROM calles
WHERE estado = 1;

-- Ver resumen de calles por tipo de vía
SELECT 
  tv.nombre AS tipo_via,
  tv.abreviatura,
  COUNT(c.id) AS total_calles
FROM tipos_via tv
LEFT JOIN calles c ON tv.id = c.tipo_via_id AND c.estado = 1
WHERE tv.estado = 1
GROUP BY tv.id
ORDER BY tv.orden;

-- Ver ejemplos de calles con nombre completo generado
SELECT 
  calle_code,
  nombre_completo,
  urbanizacion,
  categoria_via,
  es_principal
FROM calles
WHERE estado = 1
ORDER BY es_principal DESC, nombre_via
LIMIT 10;

-- =====================================================================
-- NOTAS IMPORTANTES PARA CONTINUAR
-- =====================================================================

/*
📋 PRÓXIMOS PASOS:

1. MAPEAR CALLES A CUADRANTES:
   - Necesitas vincular cada calle con sus cuadrantes correspondientes
   - Usa la tabla calles_cuadrantes
   - Define rangos de numeración si aplica
   
   Ejemplo:
   INSERT INTO calles_cuadrantes (calle_id, cuadrante_id, numero_inicio, numero_fin, estado)
   VALUES 
     (1, 5, 100, 299, 1),  -- Av. Arequipa cuadras 1-2 en cuadrante C005
     (1, 6, 300, 599, 1);  -- Av. Arequipa cuadras 3-5 en cuadrante C006

2. AGREGAR MÁS CALLES:
   - Usar guías de calles municipales
   - Importar desde Google Maps API
   - Levantamiento en campo
   - Registrar todas las calles de tu jurisdicción

3. VALIDAR UBIGEO:
   - Asegúrate que el ubigeo_code corresponda a tu distrito
   - Verifica la tabla ubigeo para códigos válidos

4. CONFIGURAR DIRECCIONES:
   - Una vez tengas calles y calles_cuadrantes configuradas
   - El sistema podrá auto-asignar sector/cuadrante a nuevas direcciones
*/

SELECT '✅ Datos iniciales insertados correctamente' AS STATUS;
SELECT '📋 Próximo paso: Mapear calles a cuadrantes (calles_cuadrantes)' AS NEXT_STEP;
