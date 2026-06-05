-- Migración 019: Permiso OCR de comprobantes de combustible
-- Fecha: 2026-06-05
-- Feature: TD-P-002 — Proxy OCR de Comprobantes de Combustible
--
-- Sintaxis: PostgreSQL (Supabase, schema citysecure)
-- Para MySQL local: ver database/seeds/019_vision_ocr_permission_mysql.sql

-- 1. Insertar el permiso
INSERT INTO citysecure.permisos (modulo, recurso, accion, slug, descripcion, es_sistema)
VALUES (
  'vehiculos',
  'combustible',
  'ocr',
  'vehiculos.combustible.ocr',
  'Analizar comprobante OCR: Permite enviar imágenes de comprobantes al servicio de análisis IA',
  false
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Asignar a los roles operador, supervisor y admin
INSERT INTO citysecure.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM citysecure.roles r, citysecure.permisos p
WHERE r.slug IN ('operador', 'supervisor', 'admin')
  AND p.slug = 'vehiculos.combustible.ocr'
ON CONFLICT DO NOTHING;

-- Verificación
SELECT p.slug, r.slug AS rol
FROM citysecure.permisos p
JOIN citysecure.rol_permisos rp ON rp.permiso_id = p.id
JOIN citysecure.roles r ON r.id = rp.rol_id
WHERE p.slug = 'vehiculos.combustible.ocr'
ORDER BY r.slug;
