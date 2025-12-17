/**
 * ===================================================
 * ROUTER PRINCIPAL - ÍNDICE DE RUTAS
 * ===================================================
 *
 * Ruta: src/routes/index.js
 *
 * Descripción:
 * Configuración principal de rutas del Sistema de Seguridad Ciudadana.
 * Centraliza todos los módulos y sus respectivas rutas con prefijos,
 * middlewares globales, y manejo de errores.
 *
 * VERSIÓN: 2.3.0
 * ÚLTIMA ACTUALIZACIÓN: 2025-12-14
 *
 * HISTORIAL DE CAMBIOS:
 * =====================
 *
 * v2.3.0 (2025-12-14):
 *   - ✅ Agregado módulo /estados-novedad, /tipos-novedad, /subtipos-novedad
 * v2.2.0 (2025-12-12):
 *   - ✅ Agregado módulo /cargos
 *   - ✅ Mejorada documentación JSDoc
 *   - ✅ Agregado sistema de versionado
 *   - ✅ Mejorado middleware de logging
 *   - ✅ Agregado health check expandido
 *
 * v2.1.0 (2025-12-11):
 *   - ✅ Agregado módulo /cuadrantes
 *   - ✅ Mejorada estructura de módulos
 *
 * v2.0.0 (2025-12-10):
 *   - ✅ Agregado módulo /personal
 *   - ✅ Refactorización completa
 *
 * v1.0.0 (2025-11-01):
 *   - 🎉 Versión inicial
 *
 * MÓDULOS DISPONIBLES:
 * ====================
 * 🔐 Autenticación:       /auth
 * 👥 Usuarios:            /usuarios
 * 🎭 Roles:               /roles
 * 🔑 Permisos:            /permisos
 * 📋 Novedades:           /novedades
 * 🚗 Vehículos:           /vehiculos
 * 👨‍✈️ Personal:            /personal
 * 🗺️ Sectores:            /sectores
 * 📍 Cuadrantes:          /cuadrantes
 * 📚 Catálogos:           /catalogos
 * 💼 Cargos:              /cargos ✅ NEW
 * 📊 Auditoría:           /auditoria
 * 📈 Reportes:            /reportes (futuro)
 *
 * @module routes/index
 * @requires express
 * @author Sistema de Seguridad Ciudadana
 * @version 2.2.0
 * @date 2025-12-12
 */

import express from "express";
const router = express.Router();

//=============================================
// IMPORTAR ROUTERS DE MÓDULOS
//=============================================

// 🔐 Autenticación (público)
import authRoutes from "./auth.routes.js";

// 👥 Gestión de Usuarios y Permisos
import usuariosRoutes from "./usuarios.routes.js";
import rolesRoutes from "./roles.routes.js";
import permisosRoutes from "./permisos.routes.js";

// 📋 Módulos Operativos
import novedadesRoutes from "./novedades.routes.js";
import vehiculosRoutes from "./vehiculos.routes.js";
import mantenimientosRoutes from "./mantenimientos.routes.js";
import personalRoutes from "./personal.routes.js";
import sectoresRoutes from "./sectores.routes.js";
import cuadrantesRoutes from "./cuadrantes.routes.js";

// 📚 Catálogos y Configuración
import catalogosRoutes from "./catalogos.routes.js";
import cargosRoutes from "./cargos.routes.js";
import tipoNovedadRoutes from "./tipo-novedad.routes.js"; // ✅ NEW
import subtipoNovedadRoutes from "./subtipo-novedad.routes.js"; // ✅ NEW
import estadoNovedadRoutes from "./estado-novedad.routes.js"; // ✅ NEW

// 📊 Auditoría y Reportes
import auditoriaAccionRoutes from "./auditoriaAcciones.routes.js";
// import reportesRoutes from "./reportes.routes.js"; // TODO: Implementar

//=============================================
// MIDDLEWARE GLOBAL DE LOGGING
//=============================================

/**
 * Middleware para registrar todas las peticiones HTTP
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware
 */
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"] || "Unknown";

  console.log(`
┌─────────────────────────────────────
│ 📡 REQUEST
├─────────────────────────────────────
│ Timestamp: ${timestamp}
│ Method:    ${method}
│ URL:       ${url}
│ IP:        ${ip}
│ Agent:     ${userAgent.substring(0, 50)}...
└─────────────────────────────────────
  `);

  next();
});

//=============================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
//=============================================

/**
 * @route   /auth
 * @desc    Rutas de autenticación y gestión de sesiones
 * @access  Público
 * @endpoints
 *   - POST   /auth/register          - Registrar nuevo usuario
 *   - POST   /auth/login             - Iniciar sesión
 *   - POST   /auth/refresh           - Renovar access token
 *   - POST   /auth/logout            - Cerrar sesión
 *   - POST   /auth/change-password   - Cambiar contraseña
 *   - GET    /auth/profile           - Obtener perfil
 *   - POST   /auth/forgot-password   - Solicitar recuperación
 *   - GET    /auth/debug-token       - Debug token (dev only)
 */
router.use("/auth", authRoutes);

//=============================================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
//=============================================

/**
 * @route   /usuarios
 * @desc    Gestión completa de usuarios del sistema
 * @access  Admin, Supervisor
 */
router.use("/usuarios", usuariosRoutes);

/**
 * @route   /roles
 * @desc    Gestión de roles y permisos (RBAC)
 * @access  Super Admin, Admin
 */
router.use("/roles", rolesRoutes);

/**
 * @route   /permisos
 * @desc    Gestión de permisos granulares
 * @access  Super Admin
 */
router.use("/permisos", permisosRoutes);

/**
 * @route   /novedades
 * @desc    Gestión de novedades e incidentes de seguridad
 * @access  Operador, Supervisor, Admin
 * @features
 *   - CRUD completo
 *   - Cambio de estados
 *   - Asignación de recursos
 *   - Dashboard y estadísticas
 */
router.use("/novedades", novedadesRoutes);

/**
 * @route   /vehiculos
 * @desc    Gestión de vehículos y flota municipal
 * @access  Operador, Supervisor, Admin
 * @features
 *   - CRUD completo
 *   - Control de kilometraje
 *   - Estados operativos
 *   - Historial de asignaciones
 */
router.use("/vehiculos", vehiculosRoutes);

/**
 * @route   /mantenimientos
 * @desc    Gestión de mantenimientos vehiculares
 * @access  Operador, Supervisor, Admin
 */
router.use("/mantenimientos", mantenimientosRoutes);

/**
 * @route   /personal
 * @desc    Gestión integral de personal de seguridad ciudadana
 * @access  Operador, Supervisor, Admin
 * @features
 *   - CRUD completo con soft delete
 *   - Gestión de licencias de conducir
 *   - Asignación de vehículos
 *   - Control de estados laborales
 *   - Generación de códigos de acceso
 *   - Estadísticas y reportes
 * @endpoints (20+)
 *   - GET    /personal                         - Listar con filtros
 *   - GET    /personal/stats                   - Estadísticas generales
 *   - GET    /personal/conductores             - Personal con licencia
 *   - GET    /personal/disponibles             - Sin vehículo asignado
 *   - GET    /personal/cargo/:cargoId          - Filtrar por cargo
 *   - GET    /personal/documento/:doc          - Buscar por documento
 *   - GET    /personal/status/:status          - Filtrar por status
 *   - GET    /personal/:id                     - Obtener detalle
 *   - POST   /personal                         - Crear nuevo
 *   - PUT    /personal/:id                     - Actualizar completo
 *   - DELETE /personal/:id                     - Eliminar (soft)
 *   - POST   /personal/:id/restore             - Restaurar eliminado
 *   - PATCH  /personal/:id/status              - Cambiar status laboral
 *   - PATCH  /personal/:id/asignar-vehiculo    - Asignar vehículo
 *   - DELETE /personal/:id/desasignar-vehiculo - Quitar vehículo
 *   - PATCH  /personal/:id/licencia            - Actualizar licencia
 *   - POST   /personal/:id/generar-codigo      - Generar código acceso
 *   - GET    /personal/:id/verificar-licencia  - Verificar vigencia
 *   - GET    /personal/:id/historial-novedades - Historial completo
 */
router.use("/personal", personalRoutes);

/**
 * @route   /sectores
 * @desc    Gestión de sectores de vigilancia y patrullaje
 * @access  Supervisor, Admin
 * @features
 *   - Definición de zonas de cobertura
 *   - Asignación de personal
 *   - Estadísticas por sector
 */
router.use("/sectores", sectoresRoutes);

/**
 * @route   /cuadrantes
 * @desc    Gestión de cuadrantes de patrullaje (subdivisión de sectores)
 * @access  Supervisor, Admin
 * @features
 *   - Subdivisión territorial
 *   - Asignación de recursos
 *   - Mapeo geográfico
 */
router.use("/cuadrantes", cuadrantesRoutes);

/**
 * @route   /catalogos
 * @desc    Catálogos generales del sistema
 * @access  Todos los usuarios autenticados (lectura)
 * @endpoints
 *   - GET /catalogos/tipos-novedad
 *   - GET /catalogos/subtipos-novedad
 *   - GET /catalogos/estados-novedad
 *   - GET /catalogos/tipos-vehiculo
 *   - GET /catalogos/cargos
 *   - GET /catalogos/unidades
 */
router.use("/catalogos", catalogosRoutes);

/**
 * @route   /cargos ✅ NEW
 * @desc    Gestión de cargos/puestos de trabajo del personal
 * @access  Lectura: Todos | Escritura: Admin, Supervisor
 * @features
 *   - CRUD completo
 *   - Categorización jerárquica
 *   - Control de requisitos (licencia)
 *   - Estadísticas de asignación
 * @endpoints (9)
 *   - GET    /cargos                    - Listar con filtros
 *   - GET    /cargos/stats              - Estadísticas
 *   - GET    /cargos/con-licencia       - Cargos que requieren licencia
 *   - GET    /cargos/categoria/:cat     - Por categoría
 *   - GET    /cargos/:id                - Obtener uno
 *   - POST   /cargos                    - Crear (Admin/Supervisor)
 *   - PUT    /cargos/:id                - Actualizar (Admin/Supervisor)
 *   - DELETE /cargos/:id                - Eliminar (Admin)
 *   - POST   /cargos/:id/restore        - Restaurar (Admin)
 */
router.use("/cargos", cargosRoutes);

router.use("/tipos-novedad", tipoNovedadRoutes);
router.use("/subtipos-novedad", subtipoNovedadRoutes);
router.use("/estados-novedad", estadoNovedadRoutes);

/**
 * @route   /auditoria
 * @desc    Registros de auditoría y trazabilidad del sistema
 * @access  Admin, Auditor
 * @features
 *   - Registro de todas las acciones
 *   - Trazabilidad completa
 *   - Filtros avanzados
 */
router.use("/auditoria", auditoriaAccionRoutes);

/**
 * @route   /reportes
 * @desc    Reportes y estadísticas del sistema (futuro)
 * @access  Supervisor, Admin
 * @features  (TODO)
 *   - Reportes operativos
 *   - Dashboards ejecutivos
 *   - Exportación PDF/Excel
 */
// router.use("/reportes", reportesRoutes); // TODO: Implementar

//=============================================
// RUTA DE HEALTH CHECK
//=============================================

/**
 * @route   GET /health
 * @desc    Verificar estado del servidor y servicios
 * @access  Público
 * @returns {Object} Estado detallado del sistema
 */
router.get("/health", async (req, res) => {
  try {
    // Verificar conexión a base de datos
    const { sequelize } = await import("../models/index.js");
    await sequelize.authenticate();

    const dbStatus = {
      connected: true,
      type: sequelize.config.dialect,
      host: sequelize.config.host,
      database: sequelize.config.database,
    };

    res.status(200).json({
      success: true,
      message: "API funcionando correctamente",
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "2.2.0",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime()), // En segundos
      database: dbStatus,
      memory: {
        usage:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        unit: "MB",
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Servicio no disponible",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

//=============================================
// RUTA RAÍZ - INFORMACIÓN DE LA API
//=============================================

/**
 * @route   GET /
 * @desc    Información general de la API y módulos disponibles
 * @access  Público
 * @returns {Object} Metadata de la API
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "API de Seguridad Ciudadana",
    version: process.env.API_VERSION || "2.2.0",
    description: "Sistema integral de gestión de seguridad ciudadana municipal",
    environment: process.env.NODE_ENV || "development",
    documentation: "/api/v1/docs",
    timestamp: new Date().toISOString(),

    modules: {
      auth: {
        path: "/auth",
        description: "Autenticación y gestión de sesiones",
        public: true,
        endpoints: 8,
      },
      usuarios: {
        path: "/usuarios",
        description: "Gestión de usuarios del sistema",
        public: false,
        roles: ["admin", "supervisor"],
      },
      personal: {
        path: "/personal",
        description: "Gestión de personal de seguridad",
        public: false,
        endpoints: 20,
        features: ["CRUD", "Licencias", "Asignación Vehículos", "Estadísticas"],
      },
      novedades: {
        path: "/novedades",
        description: "Gestión de novedades e incidentes",
        public: false,
        endpoints: 8,
      },
      vehiculos: {
        path: "/vehiculos",
        description: "Gestión de vehículos y flota",
        public: false,
        endpoints: 8,
      },
      sectores: {
        path: "/sectores",
        description: "Gestión de sectores de vigilancia",
        public: false,
      },
      cuadrantes: {
        path: "/cuadrantes",
        description: "Gestión de cuadrantes de patrullaje",
        public: false,
      },
      cargos: {
        path: "/cargos",
        description: "Gestión de cargos del personal",
        public: false,
        endpoints: 9,
        new: true, // ✅ NUEVO
        version: "1.0.0",
      },
      catalogos: {
        path: "/catalogos",
        description: "Catálogos del sistema",
        public: false,
      },
      roles: {
        path: "/roles",
        description: "Gestión de roles (RBAC)",
        public: false,
      },
      permisos: {
        path: "/permisos",
        description: "Gestión de permisos granulares",
        public: false,
      },
      auditoria: {
        path: "/auditoria",
        description: "Registros de auditoría",
        public: false,
      },
    },

    stats: {
      totalModules: 12,
      totalEndpoints: "100+",
      activeModules: 11,
      futureModules: ["reportes"],
    },

    contact: {
      support: "soporte@serenazgo.gob.pe",
      documentation: "https://docs.serenazgo.gob.pe",
      repository: "https://github.com/RomilyOaks/city_sec_backend_claude",
    },
  });
});

//=============================================
// MANEJADOR DE RUTAS NO ENCONTRADAS (404)
//=============================================

/**
 * Middleware para capturar rutas no encontradas
 * DEBE estar DESPUÉS de todas las rutas válidas
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: "Verifique la documentación en /api/v1",

    availableRoutes: [
      "/auth",
      "/usuarios",
      "/personal",
      "/novedades",
      "/vehiculos",
      "/sectores",
      "/cuadrantes",
      "/catalogos",
      "/cargos", // ✅ NEW
      "/roles",
      "/permisos",
      "/auditoria",
      "/health",
    ],

    helpLinks: {
      documentation: "/api/v1",
      health: "/api/v1/health",
    },
  });
});

//=============================================
// EXPORTAR ROUTER
//=============================================

export default router;
