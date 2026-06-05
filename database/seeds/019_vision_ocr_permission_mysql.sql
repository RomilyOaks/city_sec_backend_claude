-- Migración 019: Permiso OCR de comprobantes de combustible
-- Fecha: 2026-06-05
-- Feature: TD-P-002 — Proxy OCR de Comprobantes de Combustible
--
-- Sintaxis: MySQL (base de datos citizen_security_v2 / local)
-- Para PostgreSQL/Supabase: ver supabase/migrations/019_vision_ocr_permission.sql
--
-- YA EJECUTADO el 2026-06-05 — permiso id=646 confirmado en BD local
--
-- Para reejecutar en otro entorno:
--   mysql -u root -p citizen_security_v2 < database/seeds/019_vision_ocr_permission_mysql.sql

-- 1. Insertar el permiso (INSERT IGNORE evita error si ya existe)
INSERT IGNORE INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema)
VALUES (
  'vehiculos',
  'combustible',
  'ocr',
  'vehiculos.combustible.ocr',
  'Analizar comprobante OCR: Permite enviar imágenes de comprobantes al servicio de análisis IA',
  0
);

-- 2. Asignar a los roles operador, supervisor y admin
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.slug IN ('operador', 'supervisor', 'admin')
  AND p.slug = 'vehiculos.combustible.ocr';

-- Verificación
SELECT p.slug, r.slug AS rol
FROM permisos p
JOIN rol_permisos rp ON rp.permiso_id = p.id
JOIN roles r ON r.id = rp.rol_id
WHERE p.slug = 'vehiculos.combustible.ocr'
ORDER BY r.slug;
