-- ============================================
-- STORED PROCEDURE: Asignar Permisos a Rol Consulta (CORREGIDO)
-- ============================================
-- 
-- Descripción:
-- Asigna todos los permisos de lectura existentes al rol "consulta"
-- sin modificar la tabla de permisos, solo crea asignaciones en rol_permisos
--
-- Uso:
-- CALL asignar_permisos_consulta();
--
-- Creado: 2026-02-20
-- Propósito: Solucionar problema de permisos para usuario con rol "consulta"
-- Corrección: Eliminado @@TRANCOUNT (no existe en MySQL)

DELIMITER //

CREATE PROCEDURE asignar_permisos_consulta()
sp_main: BEGIN
    DECLARE v_rol_consulta_id INT DEFAULT 0;
    DECLARE v_permisos_asignados INT DEFAULT 0;
    DECLARE v_permisos_existentes INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(400);
    
    -- Manejo de errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        
        -- Rollback en caso de error
        ROLLBACK;
        
        SELECT 
            'ERROR' as status,
            v_error_message as message;
    END;

    -- Iniciar transacción
    START TRANSACTION;
    
    -- ============================================
    -- 1. Obtener ID del rol "consulta"
    -- ============================================
    SELECT id INTO v_rol_consulta_id 
    FROM roles 
    WHERE slug = 'consulta' AND estado = 1;
    
    -- Verificar que el rol existe
    IF v_rol_consulta_id = 0 THEN
        -- Rollback y retornar error
        ROLLBACK;
        SELECT 
            'ERROR' as status,
            'Rol "consulta" no encontrado o inactivo' as message;
        -- Salir del procedimiento
        LEAVE sp_main;
    END IF;
    
    -- ============================================
    -- 2. Contar permisos existentes del rol
    -- ============================================
    SELECT COUNT(*) INTO v_permisos_existentes
    FROM rol_permisos 
    WHERE rol_id = v_rol_consulta_id;
    
    -- ============================================
    -- 3. Asignar permisos de NOVEDADES (lectura)
    -- ============================================
    INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, created_by, updated_by)
    SELECT 
        v_rol_consulta_id,
        p.id,
        13, -- created_by (sistema/seeder)
        13  -- updated_by (sistema/seeder)
    FROM permisos p
    WHERE p.modulo = 'novedades' 
      AND p.accion = 'read'
      AND p.estado = 1
      AND p.id NOT IN (
          SELECT permiso_id 
          FROM rol_permisos 
          WHERE rol_id = v_rol_consulta_id
      );
    
    SET v_permisos_asignados = v_permisos_asignados + ROW_COUNT();
    
    -- ============================================
    -- 4. Asignar permisos de CATÁLOGOS (lectura)
    -- ============================================
    INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, created_by, updated_by)
    SELECT 
        v_rol_consulta_id,
        p.id,
        13,
        13
    FROM permisos p
    WHERE p.modulo = 'catalogos' 
      AND p.accion = 'read'
      AND p.estado = 1
      AND p.id NOT IN (
          SELECT permiso_id 
          FROM rol_permisos 
          WHERE rol_id = v_rol_consulta_id
      );
    
    SET v_permisos_asignados = v_permisos_asignados + ROW_COUNT();
    
    -- ============================================
    -- 5. Asignar permisos de CALLES (lectura)
    -- ============================================
    INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, created_by, updated_by)
    SELECT 
        v_rol_consulta_id,
        p.id,
        13,
        13
    FROM permisos p
    WHERE p.modulo = 'calles' 
      AND p.accion = 'read'
      AND p.estado = 1
      AND p.id NOT IN (
          SELECT permiso_id 
          FROM rol_permisos 
          WHERE rol_id = v_rol_consulta_id
      );
    
    SET v_permisos_asignados = v_permisos_asignados + ROW_COUNT();
    
    -- ============================================
    -- 6. Asignar permisos de OPERATIVOS (lectura)
    -- ============================================
    INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, created_by, updated_by)
    SELECT 
        v_rol_consulta_id,
        p.id,
        13,
        13
    FROM permisos p
    WHERE p.modulo = 'operativos' 
      AND p.accion = 'read'
      AND p.estado = 1
      AND p.id NOT IN (
          SELECT permiso_id 
          FROM rol_permisos 
          WHERE rol_id = v_rol_consulta_id
      );
    
    SET v_permisos_asignados = v_permisos_asignados + ROW_COUNT();
    
    -- ============================================
    -- 7. Asignar permisos de REPORTES (lectura)
    -- ============================================
    INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, created_by, updated_by)
    SELECT 
        v_rol_consulta_id,
        p.id,
        13,
        13
    FROM permisos p
    WHERE p.modulo = 'reportes' 
      AND p.accion = 'read'
      AND p.estado = 1
      AND p.id NOT IN (
          SELECT permiso_id 
          FROM rol_permisos 
          WHERE rol_id = v_rol_consulta_id
      );
    
    SET v_permisos_asignados = v_permisos_asignados + ROW_COUNT();
    
    -- ============================================
    -- 8. Verificar permisos específicos críticos
    -- ============================================
    -- Asegurar que tenga permisos específicos para tipos y subtipos de novedad
    INSERT IGNORE INTO rol_permisos (rol_id, permiso_id, created_by, updated_by)
    SELECT 
        v_rol_consulta_id,
        p.id,
        13,
        13
    FROM permisos p
    WHERE (p.modulo = 'catalogos' AND p.recurso IN ('tipos_novedad', 'subtipos_novedad') AND p.accion = 'read')
       OR (p.modulo = 'novedades' AND p.recurso IN ('tipos_novedad', 'subtipos_novedad') AND p.accion = 'read')
      AND p.estado = 1
      AND p.id NOT IN (
          SELECT permiso_id 
          FROM rol_permisos 
          WHERE rol_id = v_rol_consulta_id
      );
    
    SET v_permisos_asignados = v_permisos_asignados + ROW_COUNT();
    
    -- ============================================
    -- 9. Confirmar transacción
    -- ============================================
    COMMIT;
    
    -- ============================================
    -- 10. Retornar resultados
    -- ============================================
    SELECT 
        'SUCCESS' as status,
        'Permisos asignados exitosamente al rol consulta' as message,
        v_rol_consulta_id as rol_consulta_id,
        v_permisos_existentes as permisos_antes,
        (SELECT COUNT(*) FROM rol_permisos WHERE rol_id = v_rol_consulta_id) as permisos_despues,
        v_permisos_asignados as nuevos_permisos_asignados;
    
    -- ============================================
    -- 11. Mostrar detalle de permisos asignados
    -- ============================================
    SELECT 
        p.modulo,
        p.recurso,
        p.accion,
        p.descripcion,
        p.slug
    FROM rol_permisos rp
    JOIN permisos p ON rp.permiso_id = p.id
    WHERE rp.rol_id = v_rol_consulta_id
      AND p.accion = 'read'
    ORDER BY p.modulo, p.recurso, p.accion;
    
END sp_main //

DELIMITER ;

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Ejecutar este script en MySQL Workbench
-- 2. Luego ejecutar: CALL asignar_permisos_consulta();
-- 3. Verificar resultados en las tablas de salida
-- ============================================
