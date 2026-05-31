-- Migración 014: homologar slugs calles.calles_cuadrantes.* → calles.calles.cuadrantes.*
-- Sigue el patrón establecido en operativos.vehiculos.novedades.* (recurso con dot notation)
-- Aplicado en Supabase: 2026-05-31

UPDATE citysecure.permisos
SET
  slug    = REPLACE(slug,    'calles.calles_cuadrantes.', 'calles.calles.cuadrantes.'),
  recurso = 'calles.cuadrantes'
WHERE recurso = 'calles_cuadrantes'
  AND modulo  = 'calles';
