/**
 * ============================================
 * RUTAS: src/routes/cuadrantes.routes.js
 * ============================================
 *
 * VERSION: 2.1.0
 * FECHA: 2026-02-12
 *
 * Definición de rutas para la gestión de cuadrantes de patrullaje.
 * Todas las rutas requieren autenticación y permisos específicos.
 *
 * Rutas disponibles:
 * - GET    /api/v1/cuadrantes                        - Listar cuadrantes (soporta subsector_id)
 * - GET    /api/v1/cuadrantes/cercanos               - Búsqueda geoespacial
 * - GET    /api/v1/cuadrantes/sector/:sectorId       - Cuadrantes de un sector
 * - GET    /api/v1/cuadrantes/subsector/:subsectorId - Cuadrantes de un subsector
 * - GET    /api/v1/cuadrantes/codigo/:code           - Buscar por código
 * - GET    /api/v1/cuadrantes/:id                    - Obtener cuadrante por ID
 * - POST   /api/v1/cuadrantes                        - Crear cuadrante
 * - PUT    /api/v1/cuadrantes/:id                    - Actualizar cuadrante
 * - DELETE /api/v1/cuadrantes/:id                    - Eliminar cuadrante
 * - PATCH  /api/v1/cuadrantes/:id/estado             - Cambiar estado
 */

import express from "express";
import {
  getCuadrantes,
  getCuadranteById,
  getCuadrantesBySector,
  getCuadrantesBySubsector,
  getCuadranteByCode,
  getCuadrantesCercanos,
  createCuadrante,
  updateCuadrante,
  deleteCuadrante,
  cambiarEstado,
} from "../controllers/cuadrantesController.js";

import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

import {
  validateCreateCuadrante,
  validateUpdateCuadrante,
  validateCuadranteId,
  validateQueryCuadrantes,
  validateCambiarEstado,
} from "../validators/cuadrante.validator.js";

// Crear router de Express
const router = express.Router();

// Autenticación global para todas las rutas
router.use(verificarToken);

// ============================================
// RUTAS DE CONSULTA (READ)
// ============================================

/**
 * @route   GET /api/v1/cuadrantes
 * @desc    Listar cuadrantes con paginación y filtros
 * @access  Private - sectores.cuadrantes.read
 */
router.get(
  "/",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.cuadrantes.read"]),
  validateQueryCuadrantes,
  getCuadrantes
);

/**
 * @route   GET /api/v1/cuadrantes/cercanos
 * @desc    Buscar cuadrantes cercanos a una ubicación (geoespacial)
 * @access  Private - sectores.cuadrantes.read
 *
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id
 */
router.get(
  "/cercanos",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.cuadrantes.read"]),
  validateQueryCuadrantes,
  getCuadrantesCercanos
);

/**
 * @route   GET /api/v1/cuadrantes/sector/:sectorId
 * @desc    Obtener cuadrantes de un sector específico
 * @access  Private - sectores.cuadrantes.read
 */
router.get(
  "/sector/:sectorId",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.cuadrantes.read"]),
  getCuadrantesBySector
);

/**
 * @route   GET /api/v1/cuadrantes/subsector/:subsectorId
 * @desc    Obtener cuadrantes de un subsector específico
 * @access  Private - sectores.cuadrantes.read
 */
router.get(
  "/subsector/:subsectorId",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.cuadrantes.read"]),
  getCuadrantesBySubsector
);

/**
 * @route   GET /api/v1/cuadrantes/codigo/:code
 * @desc    Buscar cuadrante por código único
 * @access  Private - sectores.cuadrantes.read
 */
router.get(
  "/codigo/:code",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.cuadrantes.read"]),
  getCuadranteByCode
);

/**
 * @route   GET /api/v1/cuadrantes/:id
 * @desc    Obtener cuadrante específico por ID
 * @access  Private - sectores.cuadrantes.read
 */
router.get(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.cuadrantes.read"]),
  validateCuadranteId,
  getCuadranteById
);

// ============================================
// RUTAS DE MODIFICACIÓN (CREATE, UPDATE, DELETE)
// ============================================

/**
 * @route   POST /api/v1/cuadrantes
 * @desc    Crear nuevo cuadrante
 * @access  Private - sectores.cuadrantes.create
 */
router.post(
  "/",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["sectores.cuadrantes.create"]),
  validateCreateCuadrante,
  createCuadrante
);

/**
 * @route   PUT /api/v1/cuadrantes/:id
 * @desc    Actualizar cuadrante existente
 * @access  Private - sectores.cuadrantes.update
 */
router.put(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["sectores.cuadrantes.update"]),
  validateCuadranteId,
  validateUpdateCuadrante,
  updateCuadrante
);

/**
 * @route   DELETE /api/v1/cuadrantes/:id
 * @desc    Eliminar cuadrante (soft delete)
 * @access  Private - sectores.cuadrantes.delete
 */
router.delete(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin"], ["sectores.cuadrantes.delete"]),
  validateCuadranteId,
  deleteCuadrante
);

/**
 * @route   PATCH /api/v1/cuadrantes/:id/estado
 * @desc    Activar o desactivar cuadrante
 * @access  Private - sectores.cuadrantes.update
 */
router.patch(
  "/:id/estado",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["sectores.cuadrantes.update"]),
  validateCuadranteId,
  validateCambiarEstado,
  cambiarEstado
);

export default router;
