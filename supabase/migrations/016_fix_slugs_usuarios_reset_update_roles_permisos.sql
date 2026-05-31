-- Migración 016: correcciones slugs módulo usuarios
-- AUTORIZADO por usuario (operación destructiva)
-- Aplicado en Supabase: 2026-05-31

-- Corrección 1: eliminar usuarios.reset_password.execute (duplicado — frontend usaba este,
--   backend usaba usuarios.usuarios.reset_password → unificado en usuarios.usuarios.reset_password)
-- Corrección 2: eliminar usuarios.update_estado.execute (huérfano — nadie lo usaba)
DELETE FROM citysecure.rol_permisos
WHERE permiso_id IN (
  SELECT id FROM citysecure.permisos
  WHERE slug IN ('usuarios.reset_password.execute', 'usuarios.update_estado.execute')
);

DELETE FROM citysecure.permisos
WHERE slug IN ('usuarios.reset_password.execute', 'usuarios.update_estado.execute');

-- Corrección 3: homologar usuarios.roles_permisos.assign → usuarios.roles.permisos.assign
UPDATE citysecure.permisos
SET slug = 'usuarios.roles.permisos.assign', recurso = 'roles.permisos'
WHERE slug = 'usuarios.roles_permisos.assign' AND modulo = 'usuarios';
