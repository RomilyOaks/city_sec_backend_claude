/**
 * ===================================================
 * RUTAS PRINCIPALES - INDEX (ACTUALIZADO)
 * ===================================================
 *
 * Ruta: src/routes/index.js
 *
 * Descripción:
 * Configuración Principal de Rutas del Sistema de Seguridad Ciudadana.
 * Centraliza todos los módulos y sus respectivas rutas con prefijos
 * y middlewares globales.
 *
 * Actualización: Se agregó el módulo de Personal
 *
 * Módulos disponibles:
 * - Autenticación (/auth)
 * - Usuarios (/usuarios)
 * - Catálogos (/catalogos)
 * - Novedades/Incidentes (/novedades)
 * - Personal (/personal) ✅ NUEVO
 * - Sectores (/sectores)
 * - Cuadrantes (/cuadrantes)
 * - Vehículos (/vehiculos)
 * - Permisos (/permisos)
 * - Roles (/roles)
 * - Auditoría (/auditoria)
 * - Reportes (/reportes)
 *
 * @module routes/index
 * @author Sistema de Seguridad Ciudadana
 * @version 2.0.0
 * @date 2025-12-10
 */

import express from "express";
const router = express.Router();

// ==========================================
// IMPORTAR ROUTERS DE MÓDULOS
// ==========================================

// Módulo de Autenticación (público)
import authRoutes from "./auth.routes.js";

// Módulos de Gestión de Usuarios y Permisos
import usuariosRoutes from "./usuarios.routes.js";
import rolesRoutes from "./roles.routes.js";
import permisosRoutes from "./permisos.routes.js";

// Módulos Operativos
import novedadesRoutes from "./novedades.routes.js";
import vehiculosRoutes from "./vehiculos.routes.js";
import personalRoutes from "./personal.routes.js"; // ✅ NUEVO
import sectoresRoutes from "./sectores.routes.js";
import cuadrantesRoutes from "./cuadrantes.routes.js";

// Módulos de Catálogos y Configuración
import catalogosRoutes from "./catalogos.routes.js";

// Módulo de Auditoría
import auditoriaAccionRoutes from "./auditoriaAcciones.routes.js";

// Módulos de Reportes (si existe)
// import reportesRoutes from "./reportes.routes.js";

// ==========================================
// MIDDLEWARE GLOBAL DE LOGGING
// ==========================================

/**
 * Middleware global para registrar todas las peticiones
 * Útil para debugging y monitoreo
 */
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
});

// ==========================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ==========================================

/**
 * @route   /auth
 * @desc    Rutas de autenticación
 * @endpoints
 *   - POST /auth/register
 *   - POST /auth/login
 *   - POST /auth/refresh
 *   - POST /auth/logout
 *   - POST /auth/forgot-password
 *   - POST /auth/reset-password
 *   - GET  /auth/verify-email
 */
router.use("/auth", authRoutes);

// ==========================================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// Todas las rutas siguientes requieren token JWT válido
// ==========================================

/**
 * @route   /usuarios
 * @desc    Gestión de usuarios del sistema
 * @access  Admin, Supervisor
 */
router.use("/usuarios", usuariosRoutes);

/**
 * @route   /roles
 * @desc    Gestión de roles y permisos
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
 * @desc    Gestión de novedades e incidentes
 * @access  Operador, Supervisor, Admin
 */
router.use("/novedades", novedadesRoutes);

/**
 * @route   /vehiculos
 * @desc    Gestión de vehículos y flota
 * @access  Operador, Supervisor, Admin
 */
router.use("/vehiculos", vehiculosRoutes);

/**
 * @route   /personal ✅ NUEVO
 * @desc    Gestión de personal de seguridad
 * @access  Operador, Supervisor, Admin
 * @endpoints
 *   - GET    /personal                     - Listar con filtros
 *   - GET    /personal/stats               - Estadísticas
 *   - GET    /personal/conductores         - Solo conductores
 *   - GET    /personal/disponibles         - Personal sin vehículo
 *   - GET    /personal/cargo/:cargoId      - Por cargo
 *   - GET    /personal/documento/:doc      - Por documento
 *   - GET    /personal/status/:status      - Por status laboral
 *   - GET    /personal/:id                 - Obtener uno
 *   - POST   /personal                     - Crear
 *   - PUT    /personal/:id                 - Actualizar
 *   - DELETE /personal/:id                 - Eliminar (soft)
 *   - POST   /personal/:id/restore         - Restaurar
 *   - PATCH  /personal/:id/status          - Cambiar status
 *   - PATCH  /personal/:id/asignar-vehiculo    - Asignar vehículo
 *   - DELETE /personal/:id/desasignar-vehiculo - Desasignar vehículo
 *   - PATCH  /personal/:id/licencia        - Actualizar licencia
 *   - POST   /personal/:id/generar-codigo  - Generar código acceso
 *   - GET    /personal/:id/verificar-licencia - Verificar licencia
 *   - GET    /personal/:id/historial-novedades - Historial
 */
router.use("/personal", personalRoutes);

/**
 * @route   /sectores
 * @desc    Gestión de sectores de vigilancia
 * @access  Supervisor, Admin
 */
router.use("/sectores", sectoresRoutes);

/**
 * @route   /cuadrantes
 * @desc    Gestión de cuadrantes de patrullaje
 * @access  Supervisor, Admin
 */
router.use("/cuadrantes", cuadrantesRoutes);

/**
 * @route   /catalogos
 * @desc    Catálogos del sistema (tipos, subtipos, estados, etc.)
 * @access  Todos los usuarios autenticados
 */
router.use("/catalogos", catalogosRoutes);

/**
 * @route   /auditoria
 * @desc    Registros de auditoría del sistema
 * @access  Admin, Auditor
 */
router.use("/auditoria", auditoriaAccionRoutes);

/**
 * @route   /reportes
 * @desc    Reportes y estadísticas del sistema
 * @access  Supervisor, Admin
 */
// router.use("/reportes", reportesRoutes); // Descomentar cuando esté disponible

// ==========================================
// RUTA DE HEALTH CHECK
// ==========================================

/**
 * @route   GET /health
 * @desc    Verificar que la API está funcionando
 * @access  Público
 * @returns {Object} Estado del servidor
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(), // Tiempo en segundos que el servidor ha estado activo
  });
});

// ==========================================
// RUTA RAÍZ - INFORMACIÓN DE LA API
// ==========================================

/**
 * @route   GET /
 * @desc    Información general de la API
 * @access  Público
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "API de Seguridad Ciudadana",
    version: process.env.API_VERSION || "1.0.0",
    description: "Sistema integral de gestión de seguridad ciudadana",
    environment: process.env.NODE_ENV || "development",
    documentation: "/api/v1/docs",
    modules: {
      auth: {
        path: "/auth",
        description: "Autenticación y gestión de sesiones",
        public: true,
      },
      usuarios: {
        path: "/usuarios",
        description: "Gestión de usuarios del sistema",
        public: false,
      },
      personal: {
        path: "/personal",
        description: "Gestión de personal de seguridad",
        public: false,
        new: true, // ✅ MARCADO COMO NUEVO
      },
      novedades: {
        path: "/novedades",
        description: "Gestión de novedades e incidentes",
        public: false,
      },
      vehiculos: {
        path: "/vehiculos",
        description: "Gestión de vehículos y flota",
        public: false,
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
      catalogos: {
        path: "/catalogos",
        description: "Catálogos del sistema",
        public: false,
      },
      roles: {
        path: "/roles",
        description: "Gestión de roles",
        public: false,
      },
      permisos: {
        path: "/permisos",
        description: "Gestión de permisos",
        public: false,
      },
      auditoria: {
        path: "/auditoria",
        description: "Registros de auditoría",
        public: false,
      },
    },
    contact: {
      support: "soporte@citysec.com",
      documentation: "https://docs.citysec.com",
    },
  });
});

// ==========================================
// RUTA NO ENCONTRADA (404)
// Debe estar DESPUÉS de todas las rutas válidas
// ==========================================

/**
 * Middleware para capturar rutas no encontradas
 * Se ejecuta si ninguna ruta anterior hizo match
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
    suggestion: "Verifique la documentación de la API en /api/v1",
    availableRoutes: [
      "/auth",
      "/usuarios",
      "/personal", // ✅ NUEVO
      "/novedades",
      "/vehiculos",
      "/sectores",
      "/cuadrantes",
      "/catalogos",
      "/roles",
      "/permisos",
      "/auditoria",
    ],
  });
});

// ==========================================
// EXPORTAR ROUTER
// ==========================================

export default router;
