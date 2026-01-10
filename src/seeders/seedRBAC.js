/**
 * ============================================
 * SEED: ROLES, PERMISOS Y USUARIO ADMINISTRADOR
 * ============================================
 *
 * Este seeder crea la estructura inicial de RBAC:
 * 1. Roles del sistema (super_admin, admin, operador, etc.)
 * 2. Permisos granulares por módulo
 * 3. Asignación de permisos a roles
 * 4. Usuario administrador inicial
 *
 * VERSIÓN: 2.2.1 (Incluye módulo Calles y Direcciones)
 * EJECUTAR CON: npm run seed:rbac
 */

import { sequelize } from "../models/index.js";
import models from "../models/index.js";
import bcrypt from "bcryptjs";

// Destructurar los modelos necesarios
const { Usuario, Rol, Permiso, UsuarioRol } = models;

/**
 * Función principal del seed
 */
async function seedRBAC() {
  const transaction = await sequelize.transaction();

  try {
    console.log("🔄 Iniciando seed de RBAC...");
    console.log(`📊 Entorno: ${process.env.NODE_ENV || "development"}`);

    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a base de datos establecida");

    // ========================================
    // 1. CREAR ROLES DEL SISTEMA
    // ========================================
    console.log("\n📋 Creando roles del sistema...");

    const rolesData = [
      {
        nombre: "Super Administrador",
        slug: "super_admin",
        descripcion: "Super Administrador - Acceso total al sistema",
        nivel_jerarquia: 0,
        es_sistema: true,
        color: "#DC2626",
        estado: true,
      },
      {
        nombre: "Administrador",
        slug: "admin",
        descripcion: "Administrador - Gestión completa del sistema",
        nivel_jerarquia: 1,
        es_sistema: true,
        color: "#F59E0B",
        estado: true,
      },
      {
        nombre: "Operador",
        slug: "operador",
        descripcion: "Operador - Registro y gestión de novedades",
        nivel_jerarquia: 2,
        es_sistema: true,
        color: "#3B82F6",
        estado: true,
      },
      {
        nombre: "Supervisor",
        slug: "supervisor",
        descripcion: "Supervisor - Supervisión y cierre de casos",
        nivel_jerarquia: 3,
        es_sistema: true,
        color: "#8B5CF6",
        estado: true,
      },
      {
        nombre: "Consulta",
        slug: "consulta",
        descripcion: "Consulta - Solo lectura de información",
        nivel_jerarquia: 4,
        es_sistema: true,
        color: "#6B7280",
        estado: true,
      },
      {
        nombre: "Usuario Básico",
        slug: "usuario_basico",
        descripcion: "Usuario Básico - Acceso mínimo",
        nivel_jerarquia: 5,
        es_sistema: true,
        color: "#9CA3AF",
        estado: true,
      },
    ];

    // Crear roles uno por uno para manejar duplicados
    let rolesCreados = 0;
    for (const rolData of rolesData) {
      const [rol, created] = await Rol.findOrCreate({
        where: { slug: rolData.slug },
        defaults: rolData,
        transaction,
      });
      if (created) rolesCreados++;
    }

    console.log(
      `   ✓ ${rolesCreados} roles nuevos creados (${rolesData.length} total verificados)`
    );

    // ========================================
    // 2. CREAR PERMISOS GRANULARES
    // ========================================
    console.log("\n🔐 Creando permisos del sistema...");

    const permisosData = [
      // ============================================
      // MÓDULO: USUARIOS
      // ============================================
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "create",
        descripcion: "Crear nuevos usuarios en el sistema",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "read",
        descripcion: "Ver información de usuarios",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "update",
        descripcion: "Actualizar datos de usuarios",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "delete",
        descripcion: "Eliminar usuarios del sistema",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "roles",
        accion: "assign",
        descripcion: "Asignar roles a usuarios",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "roles_permisos",
        accion: "assign",
        descripcion: "Asignar permisos a roles",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "permisos",
        accion: "assign",
        descripcion: "Asignar permisos directos a usuarios",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "permisos",
        accion: "read",
        descripcion: "Ver permisos del sistema",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "reset_password",
        accion: "execute",
        descripcion: "Resetear contraseña de usuarios",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "reset_password",
        descripcion: "Resetear contraseña de un usuario",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "update_estado",
        accion: "execute",
        descripcion: "Cambiar estado de usuario",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "update_estado",
        descripcion: "Actualizar estado de un usuario",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: ROLES
      // ============================================
      {
        modulo: "usuarios",
        recurso: "roles",
        accion: "create",
        descripcion: "Crear nuevos roles",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "roles",
        accion: "read",
        descripcion: "Ver roles del sistema",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "roles",
        accion: "update",
        descripcion: "Actualizar roles",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "roles",
        accion: "delete",
        descripcion: "Eliminar roles",
        es_sistema: true,
      },
      {
        modulo: "usuarios",
        recurso: "roles",
        accion: "remove",
        descripcion: "Remover roles de usuarios",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: NOVEDADES
      // ============================================
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "create",
        descripcion: "Registrar nuevos incidentes",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "novedades",
        accion: "create",
        descripcion: "Registrar nuevas novedades",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "read",
        descripcion: "Ver incidentes registrados",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "novedades",
        accion: "read",
        descripcion: "Ver novedades registradas",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "update",
        descripcion: "Actualizar incidentes",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "novedades",
        accion: "update",
        descripcion: "Actualizar novedades",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "delete",
        descripcion: "Eliminar incidentes",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "novedades",
        accion: "delete",
        descripcion: "Eliminar novedades",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "asignacion",
        accion: "execute",
        descripcion: "Asignar recursos a novedades",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "cierre",
        descripcion: "Cerrar incidentes",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "novedades",
        accion: "cierre",
        descripcion: "Cerrar novedades",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "reapertura",
        descripcion: "Reabrir incidentes cerrados",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: PERSONAL
      // ============================================
      {
        modulo: "personal",
        recurso: "personal",
        accion: "create",
        descripcion: "Registrar nuevo personal",
        es_sistema: true,
      },
      {
        modulo: "personal",
        recurso: "personal",
        accion: "read",
        descripcion: "Ver información del personal",
        es_sistema: true,
      },
      {
        modulo: "personal",
        recurso: "personal",
        accion: "update",
        descripcion: "Actualizar datos del personal",
        es_sistema: true,
      },
      {
        modulo: "personal",
        recurso: "personal",
        accion: "delete",
        descripcion: "Eliminar personal",
        es_sistema: true,
      },
      {
        modulo: "personal",
        recurso: "personal",
        accion: "asignar_vehiculo",
        descripcion: "Asignar vehículos al personal",
        es_sistema: true,
      },
      {
        modulo: "personal",
        recurso: "licencias",
        accion: "read",
        descripcion: "Ver licencias del personal",
        es_sistema: true,
      },
      {
        modulo: "personal",
        recurso: "licencias",
        accion: "create",
        descripcion: "Registrar licencias del personal",
        es_sistema: true,
      },
      {
        modulo: "personal",
        recurso: "licencias",
        accion: "update",
        descripcion: "Actualizar licencias del personal",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: VEHÍCULOS
      // ============================================
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "create",
        descripcion: "Registrar nuevos vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "read",
        descripcion: "Ver información de vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "update",
        descripcion: "Actualizar datos de vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "delete",
        descripcion: "Eliminar vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "asignaciones",
        accion: "read",
        descripcion: "Ver asignaciones de vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "asignaciones",
        accion: "create",
        descripcion: "Crear asignaciones de vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "asignaciones",
        accion: "update",
        descripcion: "Actualizar asignaciones",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "mantenimientos",
        accion: "read",
        descripcion: "Ver mantenimientos de vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "mantenimientos",
        accion: "create",
        descripcion: "Registrar mantenimientos",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: UBICACIÓN
      // ============================================
      {
        modulo: "ubicacion",
        recurso: "sectores",
        accion: "read",
        descripcion: "Ver sectores del distrito",
        es_sistema: true,
      },
      {
        modulo: "ubicacion",
        recurso: "sectores",
        accion: "create",
        descripcion: "Crear sectores",
        es_sistema: true,
      },
      {
        modulo: "ubicacion",
        recurso: "sectores",
        accion: "update",
        descripcion: "Actualizar sectores",
        es_sistema: true,
      },
      {
        modulo: "ubicacion",
        recurso: "cuadrantes",
        accion: "read",
        descripcion: "Ver cuadrantes de sectores",
        es_sistema: true,
      },
      {
        modulo: "ubicacion",
        recurso: "cuadrantes",
        accion: "create",
        descripcion: "Crear cuadrantes",
        es_sistema: true,
      },
      {
        modulo: "ubicacion",
        recurso: "cuadrantes",
        accion: "update",
        descripcion: "Actualizar cuadrantes",
        es_sistema: true,
      },
      {
        modulo: "ubicacion",
        recurso: "ubigeo",
        accion: "read",
        descripcion: "Ver información de UBIGEO",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: CATÁLOGOS
      // ============================================
      {
        modulo: "catalogos",
        recurso: "tipos_documento",
        accion: "read",
        descripcion: "Ver tipos de documento",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "estados_civiles",
        accion: "read",
        descripcion: "Ver estados civiles",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "tipos_sangre",
        accion: "read",
        descripcion: "Ver tipos de sangre",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "tipos_contrato",
        accion: "read",
        descripcion: "Ver tipos de contrato",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "cargos",
        accion: "read",
        descripcion: "Ver cargos del personal",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "cargos",
        accion: "create",
        descripcion: "Crear cargos del personal",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "cargos",
        accion: "update",
        descripcion: "Actualizar cargos del personal",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "cargos",
        accion: "delete",
        descripcion: "Eliminar cargos del personal",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "unidades",
        accion: "read",
        descripcion: "Ver unidades/oficinas",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: REPORTES
      // ============================================
      {
        modulo: "reportes",
        recurso: "novedades",
        accion: "read",
        descripcion: "Ver reportes de novedades",
        es_sistema: true,
      },
      {
        modulo: "reportes",
        recurso: "personal",
        accion: "read",
        descripcion: "Ver reportes de personal",
        es_sistema: true,
      },
      {
        modulo: "reportes",
        recurso: "vehiculos",
        accion: "read",
        descripcion: "Ver reportes de vehículos",
        es_sistema: true,
      },
      {
        modulo: "reportes",
        recurso: "mantenimientos",
        accion: "read",
        descripcion: "Ver reportes de mantenimientos",
        es_sistema: true,
      },
      {
        modulo: "reportes",
        recurso: "exportar",
        accion: "execute",
        descripcion: "Exportar reportes",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: AUDITORÍA
      // ============================================
      {
        modulo: "auditoria",
        recurso: "logs",
        accion: "read",
        descripcion: "Ver logs del sistema",
        es_sistema: true,
      },
      {
        modulo: "auditoria",
        recurso: "historial",
        accion: "read",
        descripcion: "Ver historial de cambios",
        es_sistema: true,
      },
      {
        modulo: "auditoria",
        recurso: "registros",
        accion: "read",
        descripcion: "Ver registros de auditoría",
        es_sistema: true,
      },
      {
        modulo: "auditoria",
        recurso: "registros",
        accion: "export",
        descripcion: "Exportar registros de auditoría",
        es_sistema: true,
      },
      {
        modulo: "auditoria",
        recurso: "estadisticas",
        accion: "read",
        descripcion: "Ver estadísticas de auditoría",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: CALLES Y DIRECCIONES (NUEVO v2.2.1)
      // ============================================

      // --- TIPOS DE VÍA ---
      {
        modulo: "calles",
        recurso: "tipos_via",
        accion: "read",
        descripcion: "Ver catálogo de tipos de vía",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "tipos_via",
        accion: "create",
        descripcion: "Crear tipos de vía",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "tipos_via",
        accion: "update",
        descripcion: "Actualizar tipos de vía",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "tipos_via",
        accion: "delete",
        descripcion: "Eliminar tipos de vía",
        es_sistema: true,
      },

      // --- CALLES ---
      {
        modulo: "calles",
        recurso: "calles",
        accion: "read",
        descripcion: "Ver maestro de calles",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "calles",
        accion: "create",
        descripcion: "Registrar nuevas calles",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "calles",
        accion: "update",
        descripcion: "Actualizar información de calles",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "calles",
        accion: "delete",
        descripcion: "Eliminar calles del sistema",
        es_sistema: true,
      },

      // --- CALLES-CUADRANTES ---
      {
        modulo: "calles",
        recurso: "calles_cuadrantes",
        accion: "read",
        descripcion: "Ver relaciones calle-cuadrante",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "calles_cuadrantes",
        accion: "create",
        descripcion: "Asignar calles a cuadrantes",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "calles_cuadrantes",
        accion: "update",
        descripcion: "Actualizar rangos de numeración",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "calles_cuadrantes",
        accion: "delete",
        descripcion: "Eliminar relaciones calle-cuadrante",
        es_sistema: true,
      },

      // --- DIRECCIONES ---
      {
        modulo: "calles",
        recurso: "direcciones",
        accion: "read",
        descripcion: "Ver direcciones normalizadas",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "direcciones",
        accion: "create",
        descripcion: "Registrar nuevas direcciones",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "direcciones",
        accion: "update",
        descripcion: "Actualizar direcciones existentes",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "direcciones",
        accion: "delete",
        descripcion: "Eliminar direcciones del sistema",
        es_sistema: true,
      },
      {
        modulo: "calles",
        recurso: "direcciones",
        accion: "geocodificar",
        descripcion: "Actualizar coordenadas GPS de direcciones",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: OPERATIVOS
      // ============================================
      {
        modulo: "operativos",
        recurso: "turnos",
        accion: "create",
        descripcion: "Permite registrar nuevos turnos para el personal.",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "turnos",
        accion: "read",
        descripcion: "Permite ver la lista de turnos y sus detalles.",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "turnos",
        accion: "update",
        descripcion: "Permite modificar la información de un turno existente.",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "turnos",
        accion: "delete",
        descripcion: "Permite eliminar un turno (soft delete).",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: OPERATIVOS - VEHÍCULOS
      // ============================================
      {
        modulo: "operativos",
        recurso: "vehiculos",
        accion: "create",
        descripcion: "Permite registrar nuevos vehículos operativos.",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos",
        accion: "read",
        descripcion:
          "Permite ver la lista de vehículos operativos y sus detalles.",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos",
        accion: "update",
        descripcion:
          "Permite modificar la información de un vehículo operativo.",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos",
        accion: "delete",
        descripcion: "Permite eliminar un vehículo operativo (soft delete).",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: OPERATIVOS - VEHÍCULOS - CUADRANTES
      // ============================================
      {
        modulo: "operativos",
        recurso: "vehiculos_cuadrantes",
        accion: "read",
        descripcion: "Leer cuadrantes de vehículos operativos",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos_cuadrantes",
        accion: "create",
        descripcion: "Crear cuadrantes de vehículos operativos",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos_cuadrantes",
        accion: "update",
        descripcion: "Actualizar cuadrantes de vehículos operativos",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos_cuadrantes",
        accion: "delete",
        descripcion: "Eliminar cuadrantes de vehículos operativos",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: OPERATIVOS - VEHÍCULOS - NOVEDADES
      // ============================================
      {
        modulo: "operativos",
        recurso: "vehiculos_novedades",
        accion: "read",
        descripcion: "Leer novedades de vehículos operativos en cuadrantes",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos_novedades",
        accion: "create",
        descripcion: "Crear novedades de vehículos operativos en cuadrantes",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos_novedades",
        accion: "update",
        descripcion:
          "Actualizar novedades de vehículos operativos en cuadrantes",
        es_sistema: true,
      },
      {
        modulo: "operativos",
        recurso: "vehiculos_novedades",
        accion: "delete",
        descripcion: "Eliminar novedades de vehículos operativos en cuadrantes",
        es_sistema: true,
      },
    ];

    // Crear permisos uno por uno
    let permisosCreados = 0;
    for (const permisoData of permisosData) {
      // Generamos el slug con puntos para el registro
      const slug = `${permisoData.modulo}.${permisoData.recurso}.${permisoData.accion}`;

      const [permiso, created] = await Permiso.findOrCreate({
        where: {
          modulo: permisoData.modulo,
          recurso: permisoData.recurso,
          accion: permisoData.accion,
        },
        defaults: { ...permisoData, slug, estado: true },
        transaction,
      });

      if (created) permisosCreados++;
    }

    console.log(
      `   ✓ ${permisosCreados} permisos nuevos creados (${permisosData.length} total verificados)`
    );

    // ========================================
    // 3. ASIGNAR PERMISOS A ROLES
    // ========================================
    console.log("\n🔗 Asignando permisos a roles...");

    // Obtener el rol Super Admin
    const superAdminRole = await Rol.findOne({
      where: { slug: "super_admin" },
      transaction,
    });

    if (superAdminRole) {
      // Obtener todos los permisos activos
      const todosLosPermisos = await Permiso.findAll({
        where: { estado: true },
        transaction,
      });

      // Asignar todos los permisos al Super Admin usando bulkCreate manual
      const { RolPermiso } = await import("../models/index.js");

      // Eliminar permisos existentes
      await RolPermiso.destroy({
        where: { rol_id: superAdminRole.id },
        transaction,
      });

      // Crear nuevos permisos con auditoría (created_by = 13 para sistema/seeder)
      const rolPermisosData = todosLosPermisos.map((permiso) => ({
        rol_id: superAdminRole.id,
        permiso_id: permiso.id,
        created_by: 13, // Usuario administrador del sistema (seeder)
        updated_by: 13,
      }));
      await RolPermiso.bulkCreate(rolPermisosData, { transaction });

      console.log(
        `   ✓ ${todosLosPermisos.length} permisos asignados al rol Super Admin`
      );
    }

    // Asignar permisos de operativos a Administrador y Supervisor
    const rolesParaOperativos = await Rol.findAll({
      where: {
        slug: { [sequelize.Op.in]: ["admin", "supervisor"] },
      },
      transaction,
    });

    if (rolesParaOperativos.length > 0) {
      const permisosOperativos = await Permiso.findAll({
        where: {
          modulo: "operativos",
          recurso: {
            [sequelize.Op.in]: [
              "turnos",
              "vehiculos",
              "vehiculos_cuadrantes",
              "vehiculos_novedades",
            ],
          },
          accion: { [sequelize.Op.in]: ["create", "read", "update", "delete"] },
        },
        transaction,
      });

      if (permisosOperativos.length > 0) {
        const { RolPermiso } = await import("../models/index.js");
        const asignaciones = [];
        for (const rol of rolesParaOperativos) {
          for (const permiso of permisosOperativos) {
            asignaciones.push({
              rol_id: rol.id,
              permiso_id: permiso.id,
              created_by: 13, // Sistema/seeder
              updated_by: 13,
            });
          }
        }

        // Usar ignoreDuplicates para evitar errores si el seeder se corre de nuevo
        await RolPermiso.bulkCreate(asignaciones, {
          transaction,
          ignoreDuplicates: true,
        });
        console.log(
          `   ✓ ${permisosOperativos.length} permisos de 'operativos' (turnos, vehiculos) asignados a ${rolesParaOperativos.length} roles (Admin, Supervisor)`
        );
      }
    }

    // ========================================
    // 4. CREAR USUARIO ADMINISTRADOR INICIAL
    // ========================================
    console.log("\n👤 Verificando usuario administrador...");

    // Hashear contraseña
    const adminPassword = "Mi1eraAppCloud";
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Buscar o crear usuario admin
    const [adminUser, createdUser] = await Usuario.findOrCreate({
      where: { username: "admin" },
      defaults: {
        username: "admin",
        email: "admin@citysec.com",
        password_hash: passwordHash,
        nombres: "Administrador",
        apellidos: "del Sistema",
        estado: true,
      },
      transaction,
    });

    // SIEMPRE verificar y asignar el rol
    if (superAdminRole) {
      const tieneRol = await adminUser.hasRoles([superAdminRole], {
        transaction,
      });

      if (!tieneRol) {
        // Usar UsuarioRol.create manual en lugar de addRoles
        const { UsuarioRol } = await import("../models/index.js");
        await UsuarioRol.create(
          {
            usuario_id: adminUser.id,
            rol_id: superAdminRole.id,
            created_by: 13, // Sistema/seeder
            updated_by: 13,
            fecha_asignacion: new Date(),
          },
          { transaction }
        );
        console.log("   ✓ Rol super_admin asignado al usuario admin");
      } else {
        console.log("   ℹ️  Usuario admin ya tiene el rol super_admin");
      }

      if (createdUser) {
        console.log("   ✓ Usuario administrador creado");
      } else {
        console.log("   ℹ️  Usuario administrador ya existía");
      }
    }

    // Commit de la transacción
    await transaction.commit();

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEED COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    // Verificar datos creados
    const totalRoles = await Rol.count();
    const totalPermisos = await Permiso.count();
    const totalRolPermisos = await sequelize.models.rol_permisos.count();
    const totalUsuarioRoles = await sequelize.models.UsuarioRol.count();

    console.log("\n📊 RESUMEN:");
    console.log(`   Roles en sistema: ${totalRoles}`);
    console.log(`   Permisos en sistema: ${totalPermisos}`);
    console.log(`   Permisos asignados a roles: ${totalRolPermisos}`);
    console.log(`   Usuarios con roles: ${totalUsuarioRoles}`);

    console.log("\n📝 CREDENCIALES DEL ADMINISTRADOR:");
    console.log("   Username: admin");
    console.log("   Email: admin@citysec.com");
    console.log("   Password: Admin123!");

    console.log("\n✨ NUEVO EN v2.2.1:");
    console.log("   ✓ 17 permisos del módulo Calles y Direcciones");
    console.log("   ✓ Permisos organizados por recurso:");
    console.log("     - tipos_via (4 permisos)");
    console.log("     - calles (4 permisos)");
    console.log("     - calles_cuadrantes (4 permisos)");
    console.log("     - direcciones (5 permisos)");

    console.log("\n⚠️  IMPORTANTE:");
    console.log("   - Cambiar esta contraseña después del primer login");
    console.log(
      "   - Configurar permisos para los demás roles según necesidad"
    );
    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    // Solo hacemos rollback si la transacción NO ha finalizado todavía
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction.rollback();
    }

    console.error("\n❌ ERROR DURANTE EL SEED:", error);
    console.error("\n📋 Detalles del error:");
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);

    if (error.parent) {
      console.error(`   Error SQL: ${error.parent.message}`);
      console.error(`   SQL: ${error.parent.sql}`);
    }

    process.exit(1);
  } finally {
    // Cerrar conexión a la base de datos
    await sequelize.close();
    console.log("🔌 Conexión a base de datos cerrada\n");
  }
}

// ========================================
// EJECUTAR EL SEED
// ========================================
seedRBAC();
