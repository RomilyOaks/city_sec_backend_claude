-- Migración 017: homologar slugs Grupo B — módulo catalogos
-- Reemplaza underscore en recurso por dot notation
-- Aplicado en Supabase: 2026-05-31

UPDATE citysecure.permisos SET slug = REPLACE(slug, 'catalogos.tipos_documento.', 'catalogos.tipos.documento.'), recurso = 'tipos.documento' WHERE recurso = 'tipos_documento' AND modulo = 'catalogos';
UPDATE citysecure.permisos SET slug = REPLACE(slug, 'catalogos.estados_civiles.', 'catalogos.estados.civiles.'), recurso = 'estados.civiles' WHERE recurso = 'estados_civiles' AND modulo = 'catalogos';
UPDATE citysecure.permisos SET slug = REPLACE(slug, 'catalogos.tipos_sangre.', 'catalogos.tipos.sangre.'), recurso = 'tipos.sangre' WHERE recurso = 'tipos_sangre' AND modulo = 'catalogos';
UPDATE citysecure.permisos SET slug = REPLACE(slug, 'catalogos.tipos_contrato.', 'catalogos.tipos.contrato.'), recurso = 'tipos.contrato' WHERE recurso = 'tipos_contrato' AND modulo = 'catalogos';
UPDATE citysecure.permisos SET slug = REPLACE(slug, 'catalogos.tipos_novedad.', 'catalogos.tipos.novedad.'), recurso = 'tipos.novedad' WHERE recurso = 'tipos_novedad' AND modulo = 'catalogos';
UPDATE citysecure.permisos SET slug = REPLACE(slug, 'catalogos.subtipos_novedad.', 'catalogos.subtipos.novedad.'), recurso = 'subtipos.novedad' WHERE recurso = 'subtipos_novedad' AND modulo = 'catalogos';
