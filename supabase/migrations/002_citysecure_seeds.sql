-- ============================================================
-- CitySecure Backend — Seeds iniciales para Supabase
-- Archivo: 002_citysecure_seeds.sql
-- Schema: citysecure
-- Versión: 2.4.0 (incluye permisos Tracking GPS)
-- Fecha: 2026-05-28
--
-- INSTRUCCIONES DE EJECUCIÓN:
--   1. Ejecutar DESPUÉS de 001_citysecure_schema.sql
--   2. Se puede ejecutar múltiples veces (ON CONFLICT DO NOTHING)
--   3. Todos los INSERT usan ON CONFLICT DO NOTHING para idempotencia
--
-- CONTENIDO:
--   1. 6 Roles del sistema
--   2. 122 Permisos granulares (modulo.recurso.accion)
--   3. Asignación de permisos a roles
--   4. Usuario administrador inicial
--
-- CREDENCIALES DEL ADMINISTRADOR:
--   Username : admin
--   Email    : admin@citysec.com
--   Password : Admin123!  ← CAMBIAR EN EL PRIMER LOGIN
--
-- PARA GENERAR EL HASH DE LA CONTRASEÑA (bcrypt rounds=10):
--   node -e "const b=require('bcryptjs');console.log(b.hashSync('Admin123!',10))"
--   Reemplazar el valor de password_hash en la sección del usuario admin.
-- ============================================================

SET search_path TO citysecure;

-- ============================================================
-- 1. ROLES DEL SISTEMA
-- ============================================================

INSERT INTO roles (nombre, slug, descripcion, nivel_jerarquia, es_sistema, color, estado)
VALUES
    ('Super Administrador', 'super_admin',   'Super Administrador - Acceso total al sistema',    0, TRUE, '#DC2626', TRUE),
    ('Administrador',       'admin',         'Administrador - Gestión completa del sistema',      1, TRUE, '#F59E0B', TRUE),
    ('Operador',            'operador',      'Operador - Registro y gestión de novedades',        2, TRUE, '#3B82F6', TRUE),
    ('Supervisor',          'supervisor',    'Supervisor - Supervisión y cierre de casos',        3, TRUE, '#8B5CF6', TRUE),
    ('Consulta',            'consulta',      'Consulta - Solo lectura de información',            4, TRUE, '#6B7280', TRUE),
    ('Usuario Básico',      'usuario_basico','Usuario Básico - Acceso mínimo',                   5, TRUE, '#9CA3AF', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. PERMISOS DEL SISTEMA (122 permisos)
-- ============================================================

-- ----------------------------------------------------------
-- MÓDULO: usuarios (17 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('usuarios','usuarios',      'create',         'usuarios.usuarios.create',         'Crear nuevos usuarios en el sistema',              TRUE, TRUE),
    ('usuarios','usuarios',      'read',           'usuarios.usuarios.read',           'Ver información de usuarios',                      TRUE, TRUE),
    ('usuarios','usuarios',      'update',         'usuarios.usuarios.update',         'Actualizar datos de usuarios',                     TRUE, TRUE),
    ('usuarios','usuarios',      'delete',         'usuarios.usuarios.delete',         'Eliminar usuarios del sistema',                    TRUE, TRUE),
    ('usuarios','roles',         'assign',         'usuarios.roles.assign',            'Asignar roles a usuarios',                         TRUE, TRUE),
    ('usuarios','roles_permisos','assign',         'usuarios.roles_permisos.assign',   'Asignar permisos a roles',                         TRUE, TRUE),
    ('usuarios','permisos',      'assign',         'usuarios.permisos.assign',         'Asignar permisos directos a usuarios',             TRUE, TRUE),
    ('usuarios','permisos',      'read',           'usuarios.permisos.read',           'Ver permisos del sistema',                         TRUE, TRUE),
    ('usuarios','reset_password','execute',        'usuarios.reset_password.execute',  'Resetear contraseña de usuarios',                  TRUE, TRUE),
    ('usuarios','usuarios',      'reset_password', 'usuarios.usuarios.reset_password', 'Resetear contraseña de un usuario',                TRUE, TRUE),
    ('usuarios','update_estado', 'execute',        'usuarios.update_estado.execute',   'Cambiar estado de usuario',                        TRUE, TRUE),
    ('usuarios','usuarios',      'update_estado',  'usuarios.usuarios.update_estado',  'Actualizar estado de un usuario',                  TRUE, TRUE),
    ('usuarios','roles',         'create',         'usuarios.roles.create',            'Crear nuevos roles',                               TRUE, TRUE),
    ('usuarios','roles',         'read',           'usuarios.roles.read',              'Ver roles del sistema',                            TRUE, TRUE),
    ('usuarios','roles',         'update',         'usuarios.roles.update',            'Actualizar roles',                                 TRUE, TRUE),
    ('usuarios','roles',         'delete',         'usuarios.roles.delete',            'Eliminar roles',                                   TRUE, TRUE),
    ('usuarios','roles',         'remove',         'usuarios.roles.remove',            'Remover roles de usuarios',                        TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: novedades (12 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('novedades','incidentes','create',    'novedades.incidentes.create',    'Registrar nuevos incidentes',          TRUE, TRUE),
    ('novedades','novedades', 'create',    'novedades.novedades.create',     'Registrar nuevas novedades',           TRUE, TRUE),
    ('novedades','incidentes','read',      'novedades.incidentes.read',      'Ver incidentes registrados',           TRUE, TRUE),
    ('novedades','novedades', 'read',      'novedades.novedades.read',       'Ver novedades registradas',            TRUE, TRUE),
    ('novedades','incidentes','update',    'novedades.incidentes.update',    'Actualizar incidentes',                TRUE, TRUE),
    ('novedades','novedades', 'update',    'novedades.novedades.update',     'Actualizar novedades',                 TRUE, TRUE),
    ('novedades','incidentes','delete',    'novedades.incidentes.delete',    'Eliminar incidentes',                  TRUE, TRUE),
    ('novedades','novedades', 'delete',    'novedades.novedades.delete',     'Eliminar novedades',                   TRUE, TRUE),
    ('novedades','asignacion','execute',   'novedades.asignacion.execute',   'Asignar recursos a novedades',         TRUE, TRUE),
    ('novedades','incidentes','cierre',    'novedades.incidentes.cierre',    'Cerrar incidentes',                    TRUE, TRUE),
    ('novedades','novedades', 'cierre',    'novedades.novedades.cierre',     'Cerrar novedades',                     TRUE, TRUE),
    ('novedades','incidentes','reapertura','novedades.incidentes.reapertura','Reabrir incidentes cerrados',          TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: personal (8 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('personal','personal',  'create',          'personal.personal.create',          'Registrar nuevo personal',          TRUE, TRUE),
    ('personal','personal',  'read',            'personal.personal.read',            'Ver información del personal',      TRUE, TRUE),
    ('personal','personal',  'update',          'personal.personal.update',          'Actualizar datos del personal',     TRUE, TRUE),
    ('personal','personal',  'delete',          'personal.personal.delete',          'Eliminar personal',                 TRUE, TRUE),
    ('personal','personal',  'asignar_vehiculo','personal.personal.asignar_vehiculo','Asignar vehículos al personal',     TRUE, TRUE),
    ('personal','licencias', 'read',            'personal.licencias.read',           'Ver licencias del personal',        TRUE, TRUE),
    ('personal','licencias', 'create',          'personal.licencias.create',         'Registrar licencias del personal',  TRUE, TRUE),
    ('personal','licencias', 'update',          'personal.licencias.update',         'Actualizar licencias del personal', TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: vehiculos (9 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('vehiculos','vehiculos',     'create','vehiculos.vehiculos.create',     'Registrar nuevos vehículos',            TRUE, TRUE),
    ('vehiculos','vehiculos',     'read',  'vehiculos.vehiculos.read',       'Ver información de vehículos',          TRUE, TRUE),
    ('vehiculos','vehiculos',     'update','vehiculos.vehiculos.update',     'Actualizar datos de vehículos',         TRUE, TRUE),
    ('vehiculos','vehiculos',     'delete','vehiculos.vehiculos.delete',     'Eliminar vehículos',                    TRUE, TRUE),
    ('vehiculos','asignaciones',  'read',  'vehiculos.asignaciones.read',    'Ver asignaciones de vehículos',         TRUE, TRUE),
    ('vehiculos','asignaciones',  'create','vehiculos.asignaciones.create',  'Crear asignaciones de vehículos',       TRUE, TRUE),
    ('vehiculos','asignaciones',  'update','vehiculos.asignaciones.update',  'Actualizar asignaciones',               TRUE, TRUE),
    ('vehiculos','mantenimientos','read',  'vehiculos.mantenimientos.read',  'Ver mantenimientos de vehículos',       TRUE, TRUE),
    ('vehiculos','mantenimientos','create','vehiculos.mantenimientos.create','Registrar mantenimientos',              TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: ubicacion (7 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('ubicacion','sectores',  'read',  'ubicacion.sectores.read',   'Ver sectores del distrito',   TRUE, TRUE),
    ('ubicacion','sectores',  'create','ubicacion.sectores.create', 'Crear sectores',              TRUE, TRUE),
    ('ubicacion','sectores',  'update','ubicacion.sectores.update', 'Actualizar sectores',         TRUE, TRUE),
    ('ubicacion','cuadrantes','read',  'ubicacion.cuadrantes.read', 'Ver cuadrantes de sectores',  TRUE, TRUE),
    ('ubicacion','cuadrantes','create','ubicacion.cuadrantes.create','Crear cuadrantes',           TRUE, TRUE),
    ('ubicacion','cuadrantes','update','ubicacion.cuadrantes.update','Actualizar cuadrantes',      TRUE, TRUE),
    ('ubicacion','ubigeo',    'read',  'ubicacion.ubigeo.read',     'Ver información de UBIGEO',   TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: catalogos (14 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('catalogos','tipos_documento',  'read',  'catalogos.tipos_documento.read',  'Ver tipos de documento',        TRUE, TRUE),
    ('catalogos','estados_civiles',  'read',  'catalogos.estados_civiles.read',  'Ver estados civiles',           TRUE, TRUE),
    ('catalogos','tipos_sangre',     'read',  'catalogos.tipos_sangre.read',     'Ver tipos de sangre',           TRUE, TRUE),
    ('catalogos','tipos_contrato',   'read',  'catalogos.tipos_contrato.read',   'Ver tipos de contrato',         TRUE, TRUE),
    ('catalogos','cargos',           'read',  'catalogos.cargos.read',           'Ver cargos del personal',       TRUE, TRUE),
    ('catalogos','cargos',           'create','catalogos.cargos.create',         'Crear cargos del personal',     TRUE, TRUE),
    ('catalogos','cargos',           'update','catalogos.cargos.update',         'Actualizar cargos del personal',TRUE, TRUE),
    ('catalogos','cargos',           'delete','catalogos.cargos.delete',         'Eliminar cargos del personal',  TRUE, TRUE),
    ('catalogos','unidades',         'read',  'catalogos.unidades.read',         'Ver unidades/oficinas',         TRUE, TRUE),
    ('catalogos','unidades',         'create','catalogos.unidades.create',       'Crear unidades/oficinas',       TRUE, TRUE),
    ('catalogos','unidades',         'update','catalogos.unidades.update',       'Actualizar unidades/oficinas',  TRUE, TRUE),
    ('catalogos','unidades',         'delete','catalogos.unidades.delete',       'Eliminar unidades/oficinas',    TRUE, TRUE),
    ('catalogos','tipos_novedad',    'read',  'catalogos.tipos_novedad.read',    'Ver tipos de novedad',          TRUE, TRUE),
    ('catalogos','subtipos_novedad', 'read',  'catalogos.subtipos_novedad.read', 'Ver subtipos de novedad',       TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: reportes (8 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('reportes','operativos_dashboard',    'read',  'reportes.operativos_dashboard.read',   'Dashboard Reportes - Ver KPIs y métricas operativas',      TRUE, TRUE),
    ('reportes','operativos_dashboard',    'export','reportes.operativos_dashboard.export', 'Dashboard Reportes - Exportar datos (XLS/CSV)',             TRUE, TRUE),
    ('reportes','operativos_vehiculares',  'read',  'reportes.operativos_vehiculares.read', 'Operativos Vehiculares - Ver listado y detalles',           TRUE, TRUE),
    ('reportes','operativos_vehiculares',  'export','reportes.operativos_vehiculares.export','Operativos Vehiculares - Exportar datos (XLS/CSV)',        TRUE, TRUE),
    ('reportes','operativos_personales',   'read',  'reportes.operativos_personales.read',  'Operativos a Pie - Ver listado y detalles',                 TRUE, TRUE),
    ('reportes','operativos_personales',   'export','reportes.operativos_personales.export','Operativos a Pie - Exportar datos (XLS/CSV)',              TRUE, TRUE),
    ('reportes','novedades_no_atendidas',  'read',  'reportes.novedades_no_atendidas.read', 'Novedades no Atendidas - Ver listado y análisis',           TRUE, TRUE),
    ('reportes','novedades_no_atendidas',  'export','reportes.novedades_no_atendidas.export','Novedades no Atendidas - Exportar datos (XLS/CSV)',       TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: auditoria (5 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('auditoria','logs',        'read',  'auditoria.logs.read',        'Ver logs del sistema',              TRUE, TRUE),
    ('auditoria','historial',   'read',  'auditoria.historial.read',   'Ver historial de cambios',          TRUE, TRUE),
    ('auditoria','registros',   'read',  'auditoria.registros.read',   'Ver registros de auditoría',        TRUE, TRUE),
    ('auditoria','registros',   'export','auditoria.registros.export', 'Exportar registros de auditoría',   TRUE, TRUE),
    ('auditoria','estadisticas','read',  'auditoria.estadisticas.read','Ver estadísticas de auditoría',     TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: calles (17 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('calles','tipos_via',       'read',        'calles.tipos_via.read',        'Ver catálogo de tipos de vía',            TRUE, TRUE),
    ('calles','tipos_via',       'create',      'calles.tipos_via.create',      'Crear tipos de vía',                      TRUE, TRUE),
    ('calles','tipos_via',       'update',      'calles.tipos_via.update',      'Actualizar tipos de vía',                 TRUE, TRUE),
    ('calles','tipos_via',       'delete',      'calles.tipos_via.delete',      'Eliminar tipos de vía',                   TRUE, TRUE),
    ('calles','calles',          'read',        'calles.calles.read',           'Ver maestro de calles',                   TRUE, TRUE),
    ('calles','calles',          'create',      'calles.calles.create',         'Registrar nuevas calles',                 TRUE, TRUE),
    ('calles','calles',          'update',      'calles.calles.update',         'Actualizar información de calles',        TRUE, TRUE),
    ('calles','calles',          'delete',      'calles.calles.delete',         'Eliminar calles del sistema',             TRUE, TRUE),
    ('calles','calles_cuadrantes','read',       'calles.calles_cuadrantes.read',  'Ver relaciones calle-cuadrante',        TRUE, TRUE),
    ('calles','calles_cuadrantes','create',     'calles.calles_cuadrantes.create','Asignar calles a cuadrantes',           TRUE, TRUE),
    ('calles','calles_cuadrantes','update',     'calles.calles_cuadrantes.update','Actualizar rangos de numeración',       TRUE, TRUE),
    ('calles','calles_cuadrantes','delete',     'calles.calles_cuadrantes.delete','Eliminar relaciones calle-cuadrante',   TRUE, TRUE),
    ('calles','direcciones',     'read',        'calles.direcciones.read',      'Ver direcciones normalizadas',            TRUE, TRUE),
    ('calles','direcciones',     'create',      'calles.direcciones.create',    'Registrar nuevas direcciones',            TRUE, TRUE),
    ('calles','direcciones',     'update',      'calles.direcciones.update',    'Actualizar direcciones existentes',       TRUE, TRUE),
    ('calles','direcciones',     'delete',      'calles.direcciones.delete',    'Eliminar direcciones del sistema',        TRUE, TRUE),
    ('calles','direcciones',     'geocodificar','calles.direcciones.geocodificar','Actualizar coordenadas GPS de direcciones',TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: operativos (19 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('operativos','turnos',             'create','operativos.turnos.create',             'Permite registrar nuevos turnos para el personal.',                  TRUE, TRUE),
    ('operativos','turnos',             'read',  'operativos.turnos.read',               'Permite ver la lista de turnos y sus detalles.',                     TRUE, TRUE),
    ('operativos','turnos',             'update','operativos.turnos.update',             'Permite modificar la información de un turno existente.',            TRUE, TRUE),
    ('operativos','turnos',             'delete','operativos.turnos.delete',             'Permite eliminar un turno (soft delete).',                           TRUE, TRUE),
    ('operativos','vehiculos',          'create','operativos.vehiculos.create',          'Permite registrar nuevos vehículos operativos.',                     TRUE, TRUE),
    ('operativos','vehiculos',          'read',  'operativos.vehiculos.read',            'Permite ver la lista de vehículos operativos y sus detalles.',       TRUE, TRUE),
    ('operativos','vehiculos',          'update','operativos.vehiculos.update',          'Permite modificar la información de un vehículo operativo.',         TRUE, TRUE),
    ('operativos','vehiculos',          'delete','operativos.vehiculos.delete',          'Permite eliminar un vehículo operativo (soft delete).',              TRUE, TRUE),
    ('operativos','vehiculos_cuadrantes','read', 'operativos.vehiculos_cuadrantes.read', 'Leer cuadrantes de vehículos operativos',                           TRUE, TRUE),
    ('operativos','vehiculos_cuadrantes','create','operativos.vehiculos_cuadrantes.create','Crear cuadrantes de vehículos operativos',                        TRUE, TRUE),
    ('operativos','vehiculos_cuadrantes','update','operativos.vehiculos_cuadrantes.update','Actualizar cuadrantes de vehículos operativos',                   TRUE, TRUE),
    ('operativos','vehiculos_cuadrantes','delete','operativos.vehiculos_cuadrantes.delete','Eliminar cuadrantes de vehículos operativos',                     TRUE, TRUE),
    ('operativos','vehiculos_novedades','read',  'operativos.vehiculos_novedades.read',  'Leer novedades de vehículos operativos en cuadrantes',               TRUE, TRUE),
    ('operativos','vehiculos_novedades','create','operativos.vehiculos_novedades.create','Crear novedades de vehículos operativos en cuadrantes',             TRUE, TRUE),
    ('operativos','vehiculos_novedades','update','operativos.vehiculos_novedades.update','Actualizar novedades de vehículos operativos en cuadrantes',        TRUE, TRUE),
    ('operativos','vehiculos_novedades','delete','operativos.vehiculos_novedades.delete','Eliminar novedades de vehículos operativos en cuadrantes',          TRUE, TRUE),
    ('operativos','reportes',           'read',  'operativos.reportes.read',             'Ver reportes operativos de todos los tipos',                         TRUE, TRUE),
    ('operativos','reportes',           'export','operativos.reportes.export',           'Exportar reportes operativos a Excel o CSV',                         TRUE, TRUE),
    ('operativos','personal',           'read',  'operativos.personal.read',             'Ver reportes de operativos a pie y patrullaje personal',             TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: novedades — adjuntos y extras (4 permisos)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('novedades','read',  'read',      'novedades.read.read',       'Ver novedades no atendidas y reportes de incidentes',              TRUE, TRUE),
    ('novedades','fotos', 'viewer',    'novedades.fotos.viewer',    'Ver fotos adjuntas en novedades (URLs Supabase)',                   TRUE, TRUE),
    ('novedades','fotos', 'downloader','novedades.fotos.downloader','Descargar fotos adjuntas en novedades',                            TRUE, TRUE),
    ('novedades','audio', 'player',    'novedades.audio.player',    'Reproducir audio adjunto en novedades (URLs Supabase)',             TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------
-- MÓDULO: tracking (2 permisos — v2.4.0)
-- ----------------------------------------------------------
INSERT INTO permisos (modulo, recurso, accion, slug, descripcion, es_sistema, estado) VALUES
    ('tracking','vehiculos','update','tracking.vehiculos.update','Enviar posición GPS de vehículo de patrullaje (app móvil serenos)',  TRUE, TRUE),
    ('tracking','vehiculos','read',  'tracking.vehiculos.read',  'Ver posiciones y tracking en tiempo real de vehículos (dashboard)', TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. USUARIO ADMINISTRADOR INICIAL
-- ============================================================
-- ATENCIÓN: El valor de password_hash a continuación es un hash
-- de bcrypt para la contraseña 'Admin123!' con cost factor 10.
--
-- Si necesitas regenerarlo, ejecuta en tu terminal:
--   node -e "const b=require('bcryptjs');console.log(b.hashSync('Admin123!',10))"
--
-- Luego reemplaza el hash en este INSERT.
-- ============================================================

INSERT INTO usuarios (
    id,
    username,
    email,
    password_hash,
    nombres,
    apellidos,
    estado,
    require_password_change,
    created_at,
    updated_at
)
VALUES (
    1,
    'admin',
    'admin@citysec.com',
    '$2b$10$L8G7Nar7QmZJMVp.T9RFFOWQROqq6/bT1WgkBwOXdXZHe/34P0VRi',
    'Administrador',
    'del Sistema',
    'ACTIVO',
    TRUE,   -- forzar cambio de contraseña en primer login
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Ajustar la secuencia de usuarios para evitar conflictos
-- si se insertaron registros con id explícito
SELECT setval('usuarios_id_seq', GREATEST((SELECT MAX(id) FROM usuarios), 1));

-- ============================================================
-- 4. ASIGNACIÓN DE PERMISOS A ROLES
-- ============================================================

-- ----------------------------------------------------------
-- 4.1 Super Admin → TODOS los permisos
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id  AS rol_id,
    p.id  AS permiso_id,
    1     AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug = 'super_admin'
  AND p.estado = TRUE
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.2 Admin y Supervisor → permisos de operativos (todos)
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id AS rol_id,
    p.id AS permiso_id,
    1    AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug IN ('admin', 'supervisor')
  AND p.modulo = 'operativos'
  AND p.recurso IN ('turnos','vehiculos','vehiculos_cuadrantes','vehiculos_novedades','reportes','personal')
  AND p.accion  IN ('create','read','update','delete','export')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.3 Roles operativos → novedades.read.read
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id AS rol_id,
    p.id AS permiso_id,
    1    AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug IN ('super_admin','admin','supervisor','operador','consulta')
  AND p.slug = 'novedades.read.read'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.4 viewer + player → admin, supervisor, operador, consulta
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id AS rol_id,
    p.id AS permiso_id,
    1    AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug IN ('admin','supervisor','operador','consulta')
  AND p.slug IN ('novedades.fotos.viewer','novedades.audio.player')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.5 downloader → admin, supervisor
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id AS rol_id,
    p.id AS permiso_id,
    1    AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug IN ('admin','supervisor')
  AND p.slug = 'novedades.fotos.downloader'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.6 Tracking GPS — update → super_admin, admin, supervisor, operador
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id AS rol_id,
    p.id AS permiso_id,
    1    AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug IN ('super_admin','admin','supervisor','operador')
  AND p.slug = 'tracking.vehiculos.update'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.7 Tracking GPS — read → super_admin, admin, supervisor, operador, consulta
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id AS rol_id,
    p.id AS permiso_id,
    1    AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug IN ('super_admin','admin','supervisor','operador','consulta')
  AND p.slug = 'tracking.vehiculos.read'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.8 Rol Consulta → todos los permisos de solo lectura
--     (modulos: novedades, catalogos, calles, operativos, reportes, tracking)
-- ----------------------------------------------------------
INSERT INTO rol_permisos (rol_id, permiso_id, created_by)
SELECT
    r.id AS rol_id,
    p.id AS permiso_id,
    1    AS created_by
FROM roles r
CROSS JOIN permisos p
WHERE r.slug = 'consulta'
  AND (
      (p.modulo = 'novedades'   AND p.accion = 'read')
   OR (p.modulo = 'catalogos'   AND p.accion = 'read')
   OR (p.modulo = 'calles'      AND p.accion = 'read')
   OR (p.modulo = 'operativos'  AND p.accion = 'read')
   OR (p.modulo = 'reportes'    AND p.accion = 'read')
   OR (p.modulo = 'tracking'    AND p.accion = 'read')
  )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- 4.9 Asignar rol super_admin al usuario admin
-- ----------------------------------------------------------
INSERT INTO usuario_roles (usuario_id, rol_id, fecha_asignacion, estado, created_by)
SELECT
    u.id AS usuario_id,
    r.id AS rol_id,
    NOW(),
    1,
    1
FROM usuarios u
CROSS JOIN roles r
WHERE u.username = 'admin'
  AND r.slug = 'super_admin'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- ============================================================
-- VERIFICACIÓN FINAL (solo lectura, no modifica datos)
-- ============================================================

SELECT
    'Roles'     AS entidad, COUNT(*) AS total FROM roles
UNION ALL
SELECT
    'Permisos',              COUNT(*)          FROM permisos
UNION ALL
SELECT
    'Rol-Permisos',          COUNT(*)          FROM rol_permisos
UNION ALL
SELECT
    'Usuarios',              COUNT(*)          FROM usuarios
UNION ALL
SELECT
    'Usuario-Roles',         COUNT(*)          FROM usuario_roles;

-- ============================================================
-- FIN DEL SCRIPT
-- Próximo paso: actualizar la contraseña del admin en el
-- primer login o ejecutar:
--   UPDATE citysecure.usuarios
--   SET    password_hash = '<hash_generado>',
--          require_password_change = TRUE
--   WHERE  username = 'admin';
-- ============================================================
