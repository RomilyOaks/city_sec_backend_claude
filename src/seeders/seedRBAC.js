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
        // CORREGIDO: Usar boolean (true) en lugar de la cadena "activo"
        estado: true,
      },
      {
        nombre: "Administrador",
        slug: "admin",
        descripcion: "Administrador - Gestión completa del sistema",
        nivel_jerarquia: 1,
        es_sistema: true,
        color: "#F59E0B",
        // CORREGIDO
        estado: true,
      },
      {
        nombre: "Operador",
        slug: "operador",
        descripcion: "Operador - Registro y gestión de novedades",
        nivel_jerarquia: 2,
        es_sistema: true,
        color: "#3B82F6",
        // CORREGIDO
        estado: true,
      },
      {
        nombre: "Supervisor",
        slug: "supervisor",
        descripcion: "Supervisor - Supervisión y cierre de casos",
        nivel_jerarquia: 3,
        es_sistema: true,
        color: "#8B5CF6",
        // CORREGIDO
        estado: true,
      },
      {
        nombre: "Consulta",
        slug: "consulta",
        descripcion: "Consulta - Solo lectura de información",
        nivel_jerarquia: 4,
        es_sistema: true,
        color: "#6B7280",
        // CORREGIDO
        estado: true,
      },
      {
        nombre: "Usuario Básico",
        slug: "usuario_basico",
        descripcion: "Usuario Básico - Acceso mínimo",
        nivel_jerarquia: 5,
        es_sistema: true,
        color: "#9CA3AF",
        // CORREGIDO
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
      `   ✓ ${rolesCreados} roles nuevos creados (${rolesData.length} total verificados)`
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
        recurso: "permisos",
        accion: "assign",
        descripcion: "Asignar permisos directos a usuarios",
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
        recurso: "update_estado",
        accion: "execute",
        descripcion: "Cambiar estado de usuario",
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
        recurso: "incidentes",
        accion: "read",
        descripcion: "Ver incidentes",
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
        recurso: "incidentes",
        accion: "delete",
        descripcion: "Eliminar incidentes",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "estados",
        accion: "update",
        descripcion: "Cambiar estado de incidente",
        es_sistema: true,
      },
      {
        modulo: "novedades",
        recurso: "asignacion",
        accion: "execute",
        descripcion: "Asignar personal a incidente",
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
        recurso: "combustible",
        accion: "read",
        descripcion: "Ver registros de abastecimiento",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "combustible",
        accion: "create",
        descripcion: "Registrar abastecimiento",
        es_sistema: true,
      },

      {
        modulo: "vehiculos",
        recurso: "mantenimientos",
        accion: "create",
        descripcion: "Registrar mantenimientos de vehículos",
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
        accion: "update",
        descripcion: "Actualizar mantenimientos de vehículos",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "mantenimientos",
        accion: "delete",
        descripcion: "Eliminar mantenimientos de vehículos",
        es_sistema: true,
      },

      {
        modulo: "vehiculos",
        recurso: "talleres",
        accion: "create",
        descripcion: "Registrar talleres",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "talleres",
        accion: "read",
        descripcion: "Ver talleres",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "talleres",
        accion: "update",
        descripcion: "Actualizar talleres",
        es_sistema: true,
      },
      {
        modulo: "vehiculos",
        recurso: "talleres",
        accion: "delete",
        descripcion: "Eliminar talleres",
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

      // ============================================
      // MÓDULO: SECTORES
      // ============================================
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "create",
        descripcion: "Crear nuevos sectores",
        es_sistema: true,
      },
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "read",
        descripcion: "Ver sectores",
        es_sistema: true,
      },
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "update",
        descripcion: "Actualizar sectores",
        es_sistema: true,
      },
      {
        modulo: "sectores",
        recurso: "sectores",
        accion: "delete",
        descripcion: "Eliminar sectores",
        es_sistema: true,
      },
      {
        modulo: "sectores",
        recurso: "cuadrantes",
        accion: "create",
        descripcion: "Crear cuadrantes",
        es_sistema: true,
      },
      {
        modulo: "sectores",
        recurso: "cuadrantes",
        accion: "read",
        descripcion: "Ver cuadrantes",
        es_sistema: true,
      },

      // ============================================
      // MÓDULO: CATÁLOGOS
      // ============================================
      {
        modulo: "catalogos",
        recurso: "tipos_novedad",
        accion: "read",
        descripcion: "Ver tipos de novedad",
        es_sistema: true,
      },
      {
        modulo: "catalogos",
        recurso: "tipos_novedad",
        accion: "create",
        descripcion: "Crear tipos de novedad",
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
        // Aquí se mantiene 'estado: true' asumiendo que el modelo Permiso usa BOOLEAN.
        defaults: { ...permisoData, slug, estado: true },
        transaction,
      });

      if (created) permisosCreados++;
    }

    console.log(
      `   ✓ ${permisosCreados} permisos nuevos creados (${permisosData.length} total verificados)`
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

      // Asignar todos los permisos al Super Admin
      await superAdminRole.setPermisos(todosLosPermisos, { transaction });

      console.log(
        `   ✓ ${todosLosPermisos.length} permisos asignados al rol Super Admin`
      );
    }

    // ========================================
    // 4. CREAR USUARIO ADMINISTRADOR INICIAL
    // ========================================
    console.log("\n👤 Verificando usuario administrador...");

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
        // CORREGIDO: Usar boolean (true) en lugar de la cadena "activo"
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
        await adminUser.addRoles([superAdminRole], { transaction });
        console.log("   ✓ Rol super_admin asignado al usuario admin");
      } else {
        console.log("   ℹ️  Usuario admin ya tiene el rol super_admin");
      }

      if (createdUser) {
        console.log("   ✓ Usuario administrador creado");
      } else {
        console.log("   ℹ️  Usuario administrador ya existía");
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
    console.log(`   Roles en sistema: ${totalRoles}`);
    console.log(`   Permisos en sistema: ${totalPermisos}`);
    console.log(`   Permisos asignados a roles: ${totalRolPermisos}`);
    console.log(`   Usuarios con roles: ${totalUsuarioRoles}`);

    console.log("\n📝 CREDENCIALES DEL ADMINISTRADOR:");
    console.log("   Username: admin");
    console.log("   Email: admin@citysec.com");
    console.log("   Password: Admin123!");

    console.log("\n⚠️  IMPORTANTE:");
    console.log("   - Cambiar esta contraseña después del primer login");
    console.log(
      "   - Configurar permisos para los demás roles según necesidad"
    );
    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    // ⬇️ CORRECCIÓN CLAVE ⬇️
    // Solo hacemos rollback si la transacción NO ha finalizado todavía (falló antes del commit)
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      // Rollback en caso de error
      await transaction.rollback();
    }
    // ⬆️ FIN DE LA CORRECCIÓN ⬆️

    console.error("\n❌ ERROR DURANTE EL SEED:", error);
    console.error("\n📋 Detalles del error:");
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);

    if (error.parent) {
      console.error(`   Error SQL: ${error.parent.message}`);
      console.error(`   SQL: ${error.parent.sql}`);
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
