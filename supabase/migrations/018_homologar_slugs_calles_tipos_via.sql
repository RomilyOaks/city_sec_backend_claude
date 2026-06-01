-- Migración 018: homologar slugs Grupo E — calles.tipos_via → calles.tipos.via
-- Aplicado en Supabase: 2026-05-31

UPDATE citysecure.permisos
SET slug    = REPLACE(slug,    'calles.tipos_via.', 'calles.tipos.via.'),
    recurso = 'tipos.via'
WHERE recurso = 'tipos_via' AND modulo = 'calles';
