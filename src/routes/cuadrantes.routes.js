/**
 * ============================================
 * RUTAS: src/routes/cuadrantes.routes.js
 * ============================================
 *
 * VERSION: 2.0.0
 * FECHA: 2026-02-03
 *
 * Definición de rutas para la gestión de cuadrantes de patrullaje.
 * Todas las rutas requieren autenticación y permisos específicos.
 *
 * CAMBIOS v2.0.0:
 * - Agregado filtro por subsector_id en GET /cuadrantes
 * - Nuevo endpoint GET /cuadrantes/subsector/:subsectorId
 * - Incluye relación con Subsector y supervisor en respuestas
 *
 * Rutas disponibles:
 * - GET    /api/v1/cuadrantes                      - Listar cuadrantes (soporta subsector_id)
 * - GET    /api/v1/cuadrantes/:id                  - Obtener cuadrante por ID
 * - GET    /api/v1/cuadrantes/sector/:sectorId     - Cuadrantes de un sector
 * - GET    /api/v1/cuadrantes/subsector/:subsectorId - Cuadrantes de un subsector
 * - GET    /api/v1/cuadrantes/codigo/:code         - Buscar por código
 * - GET    /api/v1/cuadrantes/cercanos             - Búsqueda geoespacial
 * - POST   /api/v1/cuadrantes                      - Crear cuadrante
 * - PUT    /api/v1/cuadrantes/:id                  - Actualizar cuadrante
 * - DELETE /api/v1/cuadrantes/:id                  - Eliminar cuadrante
 * - PATCH  /api/v1/cuadrantes/:id/estado           - Cambiar estado
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
  verificarRoles,
  requireAnyPermission,
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

/**
 * Middleware de autenticación para todas las rutas
 * Todas las rutas de cuadrantes requieren autenticación
 */
router.use(verificarToken);

// ============================================
// RUTAS DE CONSULTA (READ)
// ============================================

/**
 * @route   GET /api/v1/cuadrantes
 * @desc    Listar cuadrantes con paginación y filtros
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */

router.get("/", verificarToken, validateQueryCuadrantes, getCuadrantes);

/**
 * @route   GET /api/v1/cuadrantes/cercanos
 * @desc    Buscar cuadrantes cercanos a una ubicación (geoespacial)
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 *
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id
 */
router.get(
  "/cercanos",
  verificarToken,
  validateQueryCuadrantes,
  getCuadrantesCercanos
);

/**
 * @route   GET /api/v1/cuadrantes/sector/:sectorId
 * @desc    Obtener cuadrantes de un sector específico
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */
router.get(
  "/sector/:sectorId",
  verificarToken,
  validateQueryCuadrantes,
  getCuadrantesBySector
);

/**
 * @route   GET /api/v1/cuadrantes/subsector/:subsectorId
 * @desc    Obtener cuadrantes de un subsector específico
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */
router.get(
  "/subsector/:subsectorId",
  verificarToken,
  validateQueryCuadrantes,
  getCuadrantesBySubsector
);

/**
 * @route   GET /api/v1/cuadrantes/codigo/:code
 * @desc    Buscar cuadrante por código único
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */
router.get(
  "/codigo/:code",
  verificarToken,
  validateQueryCuadrantes,
  getCuadranteByCode
);

/**
 * @route   GET /api/v1/cuadrantes/:id
 * @desc    Obtener cuadrante específico por ID
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */
router.get("/:id", verificarToken, validateQueryCuadrantes, getCuadranteById);

// ============================================
// RUTAS DE MODIFICACIÓN (CREATE, UPDATE, DELETE)
// ============================================

/**
 * @route   POST /api/v1/cuadrantes
 * @desc    Crear nuevo cuadrante
 * @access  Private (requiere permiso: catalogos.cuadrantes.create)
 */
router.post("/", verificarToken, validateQueryCuadrantes, createCuadrante);

/**
 * @route   PUT /api/v1/cuadrantes/:id
 * @desc    Actualizar cuadrante existente
 * @access  Private (requiere permiso: catalogos.cuadrantes.update)
 */
router.put("/:id", verificarToken, validateQueryCuadrantes, updateCuadrante);

/**
 * @route   DELETE /api/v1/cuadrantes/:id
 * @desc    Eliminar cuadrante (soft delete)
 * @access  Private (requiere permiso: catalogos.cuadrantes.delete)
 */
router.delete("/:id", verificarToken, validateQueryCuadrantes, deleteCuadrante);

/**
 * @route   PATCH /api/v1/cuadrantes/:id/estado
 * @desc    Activar o desactivar cuadrante
 * @access  Private (requiere permiso: catalogos.cuadrantes.update)
 */
router.patch(
  "/:id/estado",
  verificarToken,
  validateQueryCuadrantes,
  cambiarEstado
);

export default router;
