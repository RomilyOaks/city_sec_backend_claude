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
 * EJECUTAR CON: npm run seed:rbac
 */

import { sequelize } from "../models/index.js";
import models from "../models/index.js";
import bcrypt from "bcryptjs";

// Destructurar los modelos necesarios
const { Usuario, Rol, Permiso } = models;

/**
 * Función principal del seed
 */
async function seedRBAC() {
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
        nombre: "super_admin",
        descripcion: "Super Administrador - Acceso total al sistema",
        nivel_jerarquico: 0,
        estado: "activo",
      },
      {
        nombre: "admin",
        descripcion: "Administrador - Gestión completa del sistema",
        nivel_jerarquico: 1,
        estado: "activo",
      },
      {
        nombre: "operador",
        descripcion: "Operador - Registro y gestión de novedades",
        nivel_jerarquico: 2,
        estado: "activo",
      },
      {
        nombre: "supervisor",
        descripcion: "Supervisor - Supervisión y cierre de casos",
        nivel_jerarquico: 3,
        estado: "activo",
      },
      {
        nombre: "consulta",
        descripcion: "Consulta - Solo lectura de información",
        nivel_jerarquico: 4,
        estado: "activo",
      },
      {
        nombre: "usuario_basico",
        descripcion: "Usuario Básico - Acceso mínimo",
        nivel_jerarquico: 5,
        estado: "activo",
      },
    ];

    const roles = await Rol.bulkCreate(rolesData, {
      ignoreDuplicates: true,
      returning: true,
    });

    console.log(`   ✓ ${roles.length} roles creados/verificados`);

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
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "read",
        descripcion: "Ver información de usuarios",
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "update",
        descripcion: "Actualizar datos de usuarios",
      },
      {
        modulo: "usuarios",
        recurso: "usuarios",
        accion: "delete",
        descripcion: "Eliminar usuarios del sistema",
      },
      {
        modulo: "usuarios",
        recurso: "roles",
        accion: "assign",
        descripcion: "Asignar roles a usuarios",
      },
      {
        modulo: "usuarios",
        recurso: "permisos",
        accion: "assign",
        descripcion: "Asignar permisos directos a usuarios",
      },
      {
        modulo: "usuarios",
        recurso: "reset_password",
        accion: "execute",
        descripcion: "Resetear contraseña de usuarios",
      },
      {
        modulo: "usuarios",
        recurso: "update_estado",
        accion: "execute",
        descripcion: "Cambiar estado de usuario (activo/inactivo/bloqueado)",
      },

      // ============================================
      // MÓDULO: NOVEDADES
      // ============================================
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "create",
        descripcion: "Registrar nuevos incidentes/novedades",
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "read",
        descripcion: "Ver incidentes/novedades",
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "update",
        descripcion: "Actualizar incidentes/novedades",
      },
      {
        modulo: "novedades",
        recurso: "incidentes",
        accion: "delete",
        descripcion: "Eliminar incidentes/novedades",
      },
      {
        modulo: "novedades",
        recurso: "estados",
        accion: "update",
        descripcion: "Cambiar estado de incidente",
      },
      {
        modulo: "novedades",
        recurso: "asignacion",
        accion: "execute",
        descripcion: "Asignar personal a incidente",
      },

      // ============================================
      // MÓDULO: VEHÍCULOS
      // ============================================
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "create",
        descripcion: "Registrar nuevos vehículos",
      },
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "read",
        descripcion: "Ver información de vehículos",
      },
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "update",
        descripcion: "Actualizar datos de vehículos",
      },
      {
        modulo: "vehiculos",
        recurso: "vehiculos",
        accion: "delete",
        descripcion: "Eliminar vehículos",
      },
      {
        modulo: "vehiculos",
        recurso: "combustible",
        accion: "read",
        descripcion: "Ver registros de abastecimiento de combustible",
      },
      {
        modulo: "vehiculos",
        recurso: "combustible",
        accion: "create",
        descripcion: "Registrar abastecimiento de combustible",
      },

      // ============================================
      // MÓDULO: PERSONAL
      // ============================================
      {
        modulo: "personal",
        recurso: "personal",
        accion: "create",
        descripcion: "Registrar nuevo personal de seguridad",
      },
      {
        modulo: "personal",
        recurso: "personal",
        accion: "read",
        descripcion: "Ver información del personal",
      },
      {
        modulo: "personal",
        recurso: "personal",
        accion: "update",
        descripcion: "Actualizar datos del personal",
      },
      {
        modulo: "personal",
        recurso: "personal",
        accion: "delete",
        descripcion: "Eliminar personal",
      },

      // ============================================
      // MÓDULO: SECTORES Y CUADRANTES
      // ============================================
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "create",
        descripcion: "Crear nuevos sectores",
      },
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "read",
        descripcion: "Ver sectores",
      },
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "update",
        descripcion: "Actualizar sectores",
      },
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "delete",
        descripcion: "Eliminar sectores",
      },
      {
        modulo: "sectores",
        recurso: "cuadrantes",
        accion: "create",
        descripcion: "Crear cuadrantes dentro de sectores",
      },
      {
        modulo: "sectores",
        recurso: "cuadrantes",
        accion: "read",
        descripcion: "Ver cuadrantes",
      },

      // ============================================
      // MÓDULO: CATÁLOGOS
      // ============================================
      {
        modulo: "catalogos",
        recurso: "tipos_novedad",
        accion: "read",
        descripcion: "Ver tipos de novedad",
      },
      {
        modulo: "catalogos",
        recurso: "tipos_novedad",
        accion: "create",
        descripcion: "Crear tipos de novedad",
      },
      {
        modulo: "catalogos",
        recurso: "cargos",
        accion: "read",
        descripcion: "Ver cargos del personal",
      },
      {
        modulo: "catalogos",
        recurso: "unidades",
        accion: "read",
        descripcion: "Ver unidades/oficinas",
      },

      // ============================================
      // MÓDULO: REPORTES
      // ============================================
      {
        modulo: "reportes",
        recurso: "novedades",
        accion: "read",
        descripcion: "Ver reportes de novedades",
      },
      {
        modulo: "reportes",
        recurso: "personal",
        accion: "read",
        descripcion: "Ver reportes de personal",
      },
      {
        modulo: "reportes",
        recurso: "vehiculos",
        accion: "read",
        descripcion: "Ver reportes de vehículos",
      },
      {
        modulo: "reportes",
        recurso: "exportar",
        accion: "execute",
        descripcion: "Exportar reportes (PDF, Excel)",
      },

      // ============================================
      // MÓDULO: AUDITORÍA
      // ============================================
      {
        modulo: "auditoria",
        recurso: "logs",
        accion: "read",
        descripcion: "Ver logs del sistema",
      },
      {
        modulo: "auditoria",
        recurso: "historial",
        accion: "read",
        descripcion: "Ver historial de cambios",
      },
    ];

    const permisos = await Permiso.bulkCreate(permisosData, {
      ignoreDuplicates: true,
      returning: true,
    });

    console.log(`   ✓ ${permisos.length} permisos creados/verificados`);

    // ========================================
    // 3. ASIGNAR PERMISOS A ROLES
    // ========================================
    console.log("\n🔗 Asignando permisos a roles...");

    // Obtener el rol Super Admin
    const superAdminRole = await Rol.findOne({
      where: { nombre: "super_admin" },
    });

    if (superAdminRole) {
      // Obtener todos los permisos
      const todosLosPermisos = await Permiso.findAll();

      // Asignar todos los permisos al Super Admin
      await superAdminRole.setPermisos(todosLosPermisos);

      console.log(
        `   ✓ ${todosLosPermisos.length} permisos asignados al rol Super Admin`
      );
    }

    // TODO: Aquí puedes agregar más asignaciones para otros roles
    // Ejemplo:
    // const adminRole = await Rol.findOne({ where: { nombre: "admin" } });
    // const permisosAdmin = await Permiso.findAll({ where: { ... } });
    // await adminRole.setPermisos(permisosAdmin);

    // ========================================
    // 4. CREAR USUARIO ADMINISTRADOR INICIAL
    // ========================================
    console.log("\n👤 Creando usuario administrador inicial...");

    // Hashear contraseña
    const adminPassword = "Admin123!";
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
        estado: "activo",
      },
    });

    if (createdUser) {
      // Asignar rol super_admin al usuario
      if (superAdminRole) {
        await adminUser.addRoles([superAdminRole]);
        console.log("   ✓ Usuario administrador creado y rol asignado");
      }
    } else {
      console.log("   ℹ️  Usuario administrador ya existía");
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 SEED COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(50));
    console.log("\n📝 CREDENCIALES DEL ADMINISTRADOR:");
    console.log("   Username: admin");
    console.log("   Email: admin@citysec.com");
    console.log("   Password: Admin123!");
    console.log("\n⚠️  IMPORTANTE:");
    console.log("   - Cambiar esta contraseña después del primer login");
    console.log(
      "   - Configurar permisos para los demás roles según necesidad"
    );
    console.log("\n" + "=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR DURANTE EL SEED:", error);
    console.error("\n📋 Detalles del error:");
    console.error(`   Mensaje: ${error.message}`);
    if (error.parent) {
      console.error(`   Error SQL: ${error.parent.message}`);
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
