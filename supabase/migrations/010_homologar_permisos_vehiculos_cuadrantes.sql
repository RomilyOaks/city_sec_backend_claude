-- ============================================================
-- CitySecure — Homologación permisos vehiculos_cuadrantes
-- Archivo: 010_homologar_permisos_vehiculos_cuadrantes.sql
--
-- Mapeo de IDs:
--   106 (vehiculos_cuadrantes.read)   → 530 (vehiculos.cuadrantes.read)
--   107 (vehiculos_cuadrantes.create) → 529 (vehiculos.cuadrantes.create)
--   108 (vehiculos_cuadrantes.update) → 531 (vehiculos.cuadrantes.update)
--   109 (vehiculos_cuadrantes.delete) → 532 (vehiculos.cuadrantes.delete)
-- ============================================================

SET search_path TO citysecure;

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- PASO A: Insertar asignaciones correctas donde faltan
-- ─────────────────────────────────────────────────────────────

-- super_admin: los 4
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT r.id, p.id, 1
FROM roles r CROSS JOIN permisos p
WHERE r.slug = 'super_admin' AND p.id IN (529, 530, 531, 532)
ON CONFLICT DO NOTHING;

-- admin: los 4
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT r.id, p.id, 1
FROM roles r CROSS JOIN permisos p
WHERE r.slug = 'admin' AND p.id IN (529, 530, 531, 532)
ON CONFLICT DO NOTHING;

-- supervisor: los 4
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT r.id, p.id, 1
FROM roles r CROSS JOIN permisos p
WHERE r.slug = 'supervisor' AND p.id IN (529, 530, 531, 532)
ON CONFLICT DO NOTHING;

-- consulta: solo read
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT r.id, p.id, 1
FROM roles r CROSS JOIN permisos p
WHERE r.slug = 'consulta' AND p.id IN (530)
ON CONFLICT DO NOTHING;

-- radio_operador: ya tiene create(529)+read(530), le falta update(531)
--   no tenía delete incorrecto → no se agrega delete
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT r.id, p.id, 1
FROM roles r CROSS JOIN permisos p
WHERE r.slug = 'radio_operador' AND p.id IN (531)
ON CONFLICT DO NOTHING;

-- sereno: ya tiene create(529)+read(530), no tenía update ni delete → nada nuevo
-- telefonista: ya tiene read(530) → nada nuevo

-- ─────────────────────────────────────────────────────────────
-- PASO B: Eliminar asignaciones con permisos incorrectos
-- ─────────────────────────────────────────────────────────────

DELETE FROM rol_permisos
WHERE permiso_id IN (106, 107, 108, 109);

-- ─────────────────────────────────────────────────────────────
-- PASO C: Eliminar los permisos incorrectos
-- ─────────────────────────────────────────────────────────────

DELETE FROM permisos
WHERE id IN (106, 107, 108, 109);

COMMIT;
