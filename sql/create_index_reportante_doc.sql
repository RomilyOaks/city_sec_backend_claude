-- Índice para búsqueda por documento de identidad del reportante
-- Mejora el rendimiento de búsquedas por DNI/documento en novedades

CREATE INDEX idx_novedad_reportante_doc ON novedades_incidentes (reportante_doc_identidad);

-- Verificar que el índice fue creado
SHOW INDEX FROM novedades_incidentes WHERE Key_name = 'idx_novedad_reportante_doc';
