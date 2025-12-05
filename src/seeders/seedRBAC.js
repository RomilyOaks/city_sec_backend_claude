/**
 * Ruta: src/seeders/seedRBAC.js
 * Descripción: Script de inicialización para roles, permisos y usuario administrador
 * Crea la estructura básica de RBAC con roles predefinidos, permisos granulares
 * y un usuario super_admin inicial para comenzar a usar el sistema
 */

import bcrypt from "bcryptjs";
import { sequelize, Rol, Permiso, Usuario } from "../models/index.js";

/**
 * Definición de permisos del sistema
 * Formato: modulo.recurso.accion
 */
const PERMISOS = [
  // Módulo: Usuarios
  {
    modulo: "usuarios",
    recurso: "usuarios",
    accion: "read",
    descripcion: "Ver usuarios",
  },
  {
    modulo: "usuarios",
    recurso: "usuarios",
    accion: "create",
    descripcion: "Crear usuarios",
  },
  {
    modulo: "usuarios",
    recurso: "usuarios",
    accion: "update",
    descripcion: "Actualizar usuarios",
  },
  {
    modulo: "usuarios",
    recurso: "usuarios",
    accion: "delete",
    descripcion: "Eliminar usuarios",
  },
  {
    modulo: "usuarios",
    recurso: "usuarios",
    accion: "reset_password",
    descripcion: "Resetear contraseñas",
  },
  {
    modulo: "usuarios",
    recurso: "usuarios",
    accion: "update_estado",
    descripcion: "Cambiar estado de usuarios",
  },
  {
    modulo: "usuarios",
    recurso: "usuarios",
    accion: "admin",
    descripcion: "Administración completa de usuarios",
  },

  // Módulo: Roles
  {
    modulo: "usuarios",
    recurso: "roles",
    accion: "read",
    descripcion: "Ver roles",
  },
  {
    modulo: "usuarios",
    recurso: "roles",
    accion: "create",
    descripcion: "Crear roles",
  },
  {
    modulo: "usuarios",
    recurso: "roles",
    accion: "update",
    descripcion: "Actualizar roles",
  },
  {
    modulo: "usuarios",
    recurso: "roles",
    accion: "delete",
    descripcion: "Eliminar roles",
  },
  {
    modulo: "usuarios",
    recurso: "roles",
    accion: "assign",
    descripcion: "Asignar roles a usuarios",
  },

  // Módulo: Permisos
  {
    modulo: "usuarios",
    recurso: "permisos",
    accion: "read",
    descripcion: "Ver permisos",
  },
  {
    modulo: "usuarios",
    recurso: "permisos",
    accion: "create",
    descripcion: "Crear permisos",
  },
  {
    modulo: "usuarios",
    recurso: "permisos",
    accion: "update",
    descripcion: "Actualizar permisos",
  },
  {
    modulo: "usuarios",
    recurso: "permisos",
    accion: "delete",
    descripcion: "Eliminar permisos",
  },
  {
    modulo: "usuarios",
    recurso: "permisos",
    accion: "assign",
    descripcion: "Asignar permisos",
  },

  // Módulo: Novedades
  {
    modulo: "novedades",
    recurso: "incidentes",
    accion: "read",
    descripcion: "Ver novedades/incidentes",
  },
  {
    modulo: "novedades",
    recurso: "incidentes",
    accion: "create",
    descripcion: "Registrar novedades",
  },
  {
    modulo: "novedades",
    recurso: "incidentes",
    accion: "update",
    descripcion: "Actualizar novedades",
  },
  {
    modulo: "novedades",
    recurso: "incidentes",
    accion: "delete",
    descripcion: "Eliminar novedades",
  },
  {
    modulo: "novedades",
    recurso: "incidentes",
    accion: "asignar",
    descripcion: "Asignar unidades a novedades",
  },
  {
    modulo: "novedades",
    recurso: "incidentes",
    accion: "cerrar",
    descripcion: "Cerrar novedades",
  },

  // Módulo: Vehículos
  {
    modulo: "vehiculos",
    recurso: "vehiculos",
    accion: "read",
    descripcion: "Ver vehículos",
  },
  {
    modulo: "vehiculos",
    recurso: "vehiculos",
    accion: "create",
    descripcion: "Registrar vehículos",
  },
  {
    modulo: "vehiculos",
    recurso: "vehiculos",
    accion: "update",
    descripcion: "Actualizar vehículos",
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
    descripcion: "Ver abastecimientos",
  },
  {
    modulo: "vehiculos",
    recurso: "combustible",
    accion: "create",
    descripcion: "Registrar abastecimientos",
  },

  // Módulo: Personal
  {
    modulo: "personal",
    recurso: "personal",
    accion: "read",
    descripcion: "Ver personal",
  },
  {
    modulo: "personal",
    recurso: "personal",
    accion: "create",
    descripcion: "Registrar personal",
  },
  {
    modulo: "personal",
    recurso: "personal",
    accion: "update",
    descripcion: "Actualizar personal",
  },
  {
    modulo: "personal",
    recurso: "personal",
    accion: "delete",
    descripcion: "Eliminar personal",
  },

  // Módulo: Catálogos
  {
    modulo: "catalogos",
    recurso: "tipos_novedad",
    accion: "read",
    descripcion: "Ver tipos de novedad",
  },
  {
    modulo: "catalogos",
    recurso: "tipos_novedad",
    accion: "manage",
    descripcion: "Gestionar tipos de novedad",
  },
  {
    modulo: "catalogos",
    recurso: "sectores",
    accion: "read",
    descripcion: "Ver sectores",
  },
  {
    modulo: "catalogos",
    recurso: "sectores",
    accion: "manage",
    descripcion: "Gestionar sectores",
  },
  {
    modulo: "catalogos",
    recurso: "cuadrantes",
    accion: "read",
    descripcion: "Ver cuadrantes",
  },
  {
    modulo: "catalogos",
    recurso: "cuadrantes",
    accion: "manage",
    descripcion: "Gestionar cuadrantes",
  },

  // Módulo: Reportes
  {
    modulo: "reportes",
    recurso: "dashboard",
    accion: "read",
    descripcion: "Ver dashboard general",
  },
  {
    modulo: "reportes",
    recurso: "estadisticas",
    accion: "read",
    descripcion: "Ver estadísticas",
  },
  {
    modulo: "reportes",
    recurso: "reportes",
    accion: "generate",
    descripcion: "Generar reportes",
  },
  {
    modulo: "reportes",
    recurso: "reportes",
    accion: "export",
    descripcion: "Exportar reportes",
  },

  // Módulo: Auditoría
  {
    modulo: "auditoria",
    recurso: "logs",
    accion: "read",
    descripcion: "Ver logs de auditoría",
  },
  {
    modulo: "auditoria",
    recurso: "logs",
    accion: "export",
    descripcion: "Exportar logs",
  },
];

/**
 * Definición de roles del sistema
 */
const ROLES = [
  {
    nombre: "Super Administrador",
    slug: "super_admin",
    descripcion: "Acceso total al sistema sin restricciones",
    nivel_jerarquia: 0,
    es_sistema: true,
    color: "#DC2626", // Rojo
    permisos: "*", // Todos los permisos
  },
  {
    nombre: "Administrador",
    slug: "admin",
    descripcion: "Administrador general del sistema con la mayoría de permisos",
    nivel_jerarquia: 1,
    es_sistema: true,
    color: "#F59E0B", // Ámbar
    permisos: [
      // Usuarios
      "usuarios.usuarios.read",
      "usuarios.usuarios.create",
      "usuarios.usuarios.update",
      "usuarios.usuarios.reset_password",
      "usuarios.usuarios.update_estado",
      "usuarios.roles.read",
      "usuarios.roles.assign",
      // Novedades
      "novedades.incidentes.read",
      "novedades.incidentes.create",
      "novedades.incidentes.update",
      "novedades.incidentes.asignar",
      "novedades.incidentes.cerrar",
      // Vehículos
      "vehiculos.vehiculos.read",
      "vehiculos.vehiculos.create",
      "vehiculos.vehiculos.update",
      "vehiculos.combustible.read",
      "vehiculos.combustible.create",
      // Personal
      "personal.personal.read",
      "personal.personal.create",
      "personal.personal.update",
      // Catálogos
      "catalogos.tipos_novedad.read",
      "catalogos.tipos_novedad.manage",
      "catalogos.sectores.read",
      "catalogos.sectores.manage",
      "catalogos.cuadrantes.read",
      "catalogos.cuadrantes.manage",
      // Reportes
      "reportes.dashboard.read",
      "reportes.estadisticas.read",
      "reportes.reportes.generate",
      "reportes.reportes.export",
      // Auditoría
      "auditoria.logs.read",
      "auditoria.logs.export",
    ],
  },
  {
    nombre: "Operador",
    slug: "operador",
    descripcion: "Personal de operaciones que registra y gestiona novedades",
    nivel_jerarquia: 2,
    es_sistema: true,
    color: "#3B82F6", // Azul
    permisos: [
      "novedades.incidentes.read",
      "novedades.incidentes.create",
      "novedades.incidentes.update",
      "novedades.incidentes.asignar",
      "vehiculos.vehiculos.read",
      "vehiculos.combustible.read",
      "vehiculos.combustible.create",
      "personal.personal.read",
      "catalogos.tipos_novedad.read",
      "catalogos.sectores.read",
      "catalogos.cuadrantes.read",
      "reportes.dashboard.read",
    ],
  },
  {
    nombre: "Supervisor",
    slug: "supervisor",
    descripcion:
      "Supervisor de campo con permisos de lectura y cierre de novedades",
    nivel_jerarquia: 3,
    es_sistema: true,
    color: "#10B981", // Verde
    permisos: [
      "novedades.incidentes.read",
      "novedades.incidentes.update",
      "novedades.incidentes.cerrar",
      "vehiculos.vehiculos.read",
      "vehiculos.combustible.read",
      "personal.personal.read",
      "catalogos.tipos_novedad.read",
      "catalogos.sectores.read",
      "catalogos.cuadrantes.read",
      "reportes.dashboard.read",
    ],
  },
  {
    nombre: "Consulta",
    slug: "consulta",
    descripcion:
      "Usuario con permisos de solo lectura para consultas y reportes",
    nivel_jerarquia: 4,
    es_sistema: true,
    color: "#6B7280", // Gris
    permisos: [
      "novedades.incidentes.read",
      "vehiculos.vehiculos.read",
      "vehiculos.combustible.read",
      "personal.personal.read",
      "catalogos.tipos_novedad.read",
      "catalogos.sectores.read",
      "catalogos.cuadrantes.read",
      "reportes.dashboard.read",
      "reportes.estadisticas.read",
    ],
  },
  {
    nombre: "Usuario Básico",
    slug: "usuario_basico",
    descripcion: "Usuario con acceso básico al sistema",
    nivel_jerarquia: 5,
    es_sistema: true,
    color: "#8B5CF6", // Púrpura
    permisos: ["reportes.dashboard.read"],
  },
];

/**
 * Función principal para ejecutar el seed
 */
export const seedRBAC = async () => {
  const transaction = await sequelize.transaction();

  try {
    console.log("🌱 Iniciando seed de RBAC...");

    // 1. Crear permisos
    console.log("📝 Creando permisos...");
    const permisosCreados = [];

    for (const permiso of PERMISOS) {
      const slug = `${permiso.modulo}.${permiso.recurso}.${permiso.accion}`;

      const [permisoObj, created] = await Permiso.findOrCreate({
        where: { slug },
        defaults: {
          ...permiso,
          slug,
          es_sistema: true,
        },
        transaction,
      });

      permisosCreados.push(permisoObj);

      if (created) {
        console.log(`  ✓ Creado: ${slug}`);
      } else {
        console.log(`  → Ya existe: ${slug}`);
      }
    }

    console.log(`✅ ${permisosCreados.length} permisos procesados\n`);

    // 2. Crear roles y asignar permisos
    console.log("👥 Creando roles...");

    for (const rolData of ROLES) {
      const { permisos: permisosRol, ...datosRol } = rolData;

      const [rol, created] = await Rol.findOrCreate({
        where: { slug: rolData.slug },
        defaults: datosRol,
        transaction,
      });

      if (created) {
        console.log(`  ✓ Creado: ${rol.nombre} (${rol.slug})`);
      } else {
        console.log(`  → Ya existe: ${rol.nombre} (${rol.slug})`);
        // Actualizar datos del rol si ya existe
        await rol.update(datosRol, { transaction });
      }

      // Asignar permisos al rol
      if (permisosRol === "*") {
        // Super admin: todos los permisos
        await rol.setPermisos(permisosCreados, { transaction });
        console.log(`    → Asignados TODOS los permisos`);
      } else if (Array.isArray(permisosRol)) {
        // Otros roles: permisos específicos
        const permisosAsignar = permisosCreados.filter((p) =>
          permisosRol.includes(p.slug)
        );
        await rol.setPermisos(permisosAsignar, { transaction });
        console.log(`    → Asignados ${permisosAsignar.length} permisos`);
      }
    }

    console.log(`✅ ${ROLES.length} roles procesados\n`);

    // 3. Crear usuario super administrador si no existe
    console.log("👤 Creando usuario super administrador...");

    const [superAdmin, created] = await Usuario.findOrCreate({
      where: { username: "admin" },
      defaults: {
        username: "admin",
        email: "admin@citysec.com",
        password_hash: await bcrypt.hash("Admin123!", 10),
        nombres: "Super",
        apellidos: "Administrador",
        estado: "ACTIVO",
        email_verified_at: new Date(),
        oauth_provider: "LOCAL",
      },
      transaction,
    });

    if (created) {
      // Asignar rol de super_admin
      const rolSuperAdmin = await Rol.findOne({
        where: { slug: "super_admin" },
        transaction,
      });

      await superAdmin.addRol(rolSuperAdmin, { transaction });

      console.log("  ✓ Usuario super admin creado");
      console.log("    Username: admin");
      console.log("    Email: admin@citysec.com");
      console.log("    Password: Admin123!");
      console.log(
        "    ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login"
      );
    } else {
      console.log("  → Usuario admin ya existe");
    }

    // Commit de la transacción
    await transaction.commit();

    console.log("\n✅ Seed de RBAC completado exitosamente!\n");

    return {
      success: true,
      message: "RBAC inicializado correctamente",
      stats: {
        permisos: permisosCreados.length,
        roles: ROLES.length,
        adminCreated: created,
      },
    };
  } catch (error) {
    // Rollback en caso de error
    await transaction.rollback();
    console.error("❌ Error al ejecutar seed:", error);
    throw error;
  }
};

/**
 * Ejecutar seed si se llama directamente
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRBAC()
    .then(() => {
      console.log("Seed completado. Cerrando conexión...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error al ejecutar seed:", error);
      process.exit(1);
    });
}

export default seedRBAC;
