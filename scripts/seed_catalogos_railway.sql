-- =====================================================
-- SEED: Catálogos para Railway MySQL
-- Ejecutar en MySQL Workbench conectado a Railway
-- =====================================================

-- =====================================================
-- TIPOS DE VEHÍCULO
-- =====================================================
INSERT IGNORE INTO tipos_vehiculo (id, nombre, descripcion, estado, created_at, updated_at) VALUES
(1, 'Patrullero', 'Vehículo móvil para patrullaje urbano', 1, NOW(), NOW()),
(2, 'Motocicleta', 'Motocicleta para patrullaje rápido', 1, NOW(), NOW()),
(3, 'Camioneta', 'Camioneta para transporte de personal', 1, NOW(), NOW()),
(4, 'Bicicleta', 'Bicicleta para patrullaje ecológico', 1, NOW(), NOW()),
(5, 'Ambulancia', 'Vehículo de emergencias médicas', 1, NOW(), NOW()),
(6, 'Utilitario', 'Vehículo de uso administrativo', 1, NOW(), NOW());

-- Verificar tipos de vehículo
SELECT 'Tipos de Vehículo insertados:' AS mensaje, COUNT(*) AS total FROM tipos_vehiculo;

-- =====================================================
-- UNIDADES / OFICINAS
-- =====================================================
INSERT IGNORE INTO unidades_oficina (id, codigo, nombre, tipo_unidad, telefono, email, direccion, ubigeo, estado, created_at, updated_at) VALUES
(1, 'DESPACHO-SERENAZGO', 'Central de Despacho Serenazgo', 'SERENAZGO', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(2, 'CIA-SAGITARIO', 'Compañía Sagitario', 'SERENAZGO', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(3, 'CIA-MONTERRICO', 'Compañía Monterrico', 'SERENAZGO', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(4, 'CIA-SURCO', 'Compañía Surco', 'SERENAZGO', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(5, 'PNP-105', 'Comisaría PNP 105', 'PNP', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(6, 'BOMBEROS-27', 'Compañía de Bomberos 27', 'BOMBEROS', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(7, 'AMBULANCIA-01', 'Ambulancia Municipal 01', 'AMBULANCIA', NULL, NULL, NULL, NULL, 1, NOW(), NOW()),
(8, 'USC-01', 'Unidad Serenazgo Chorrillos', 'SERENAZGO', '+51 988 888 888', 'serenazgo.centro@demo.com', 'Av. Huaylas 456', '150101', 1, NOW(), NOW());

-- Verificar unidades
SELECT 'Unidades/Oficinas insertadas:' AS mensaje, COUNT(*) AS total FROM unidades_oficina;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
SELECT '=== RESUMEN DE CATÁLOGOS ===' AS info;
SELECT 'tipos_vehiculo' AS tabla, COUNT(*) AS registros FROM tipos_vehiculo
UNION ALL
SELECT 'unidades_oficina' AS tabla, COUNT(*) AS registros FROM unidades_oficina
UNION ALL
SELECT 'ubigeo' AS tabla, COUNT(*) AS registros FROM ubigeo;
