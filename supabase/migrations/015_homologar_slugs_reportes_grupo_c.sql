-- Migración 015: homologar slugs Grupo C — módulo reportes
-- Reemplaza underscore en recurso por dot notation (patrón establecido)
-- Aplicado en Supabase: 2026-05-31

UPDATE citysecure.permisos SET slug = REPLACE(slug, 'reportes.operativos_dashboard.', 'reportes.operativos.dashboard.'), recurso = 'operativos.dashboard' WHERE recurso = 'operativos_dashboard' AND modulo = 'reportes';

UPDATE citysecure.permisos SET slug = REPLACE(slug, 'reportes.operativos_vehiculares.', 'reportes.operativos.vehiculares.'), recurso = 'operativos.vehiculares' WHERE recurso = 'operativos_vehiculares' AND modulo = 'reportes';

UPDATE citysecure.permisos SET slug = REPLACE(slug, 'reportes.operativos_personales.', 'reportes.operativos.personales.'), recurso = 'operativos.personales' WHERE recurso = 'operativos_personales' AND modulo = 'reportes';

UPDATE citysecure.permisos SET slug = REPLACE(slug, 'reportes.novedades_no_atendidas.', 'reportes.novedades.no_atendidas.'), recurso = 'novedades.no_atendidas' WHERE recurso = 'novedades_no_atendidas' AND modulo = 'reportes';
