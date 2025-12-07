/**
 * ============================================
 * RUTAS: src/routes/cuadrantes.routes.js
 * ============================================
 *
 * Definición de rutas para la gestión de cuadrantes de patrullaje.
 * Todas las rutas requieren autenticación y permisos específicos.
 *
 * Rutas disponibles:
 * - GET    /api/v1/cuadrantes                 - Listar cuadrantes
 * - GET    /api/v1/cuadrantes/:id             - Obtener cuadrante por ID
 * - GET    /api/v1/cuadrantes/sector/:sectorId - Cuadrantes de un sector
 * - GET    /api/v1/cuadrantes/codigo/:code    - Buscar por código
 * - GET    /api/v1/cuadrantes/cercanos        - Búsqueda geoespacial
 * - POST   /api/v1/cuadrantes                 - Crear cuadrante
 * - PUT    /api/v1/cuadrantes/:id             - Actualizar cuadrante
 * - DELETE /api/v1/cuadrantes/:id             - Eliminar cuadrante
 * - PATCH  /api/v1/cuadrantes/:id/estado      - Cambiar estado
 */

import express from "express";
import {
  getCuadrantes,
  getCuadranteById,
  getCuadrantesBySector,
  getCuadranteByCode,
  getCuadrantesCercanos,
  createCuadrante,
  updateCuadrante,
  deleteCuadrante,
  cambiarEstado,
} from "../controllers/cuadrantesController.js";

import {
  verificarToken,
  requirePermission,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

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
router.get("/", requirePermission("catalogos.cuadrantes.read"), getCuadrantes);

/**
 * @route   GET /api/v1/cuadrantes/cercanos
 * @desc    Buscar cuadrantes cercanos a una ubicación (geoespacial)
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 *
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id
 */
router.get(
  "/cercanos",
  requirePermission("catalogos.cuadrantes.read"),
  getCuadrantesCercanos
);

/**
 * @route   GET /api/v1/cuadrantes/sector/:sectorId
 * @desc    Obtener cuadrantes de un sector específico
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */
router.get(
  "/sector/:sectorId",
  requirePermission("catalogos.cuadrantes.read"),
  getCuadrantesBySector
);

/**
 * @route   GET /api/v1/cuadrantes/codigo/:code
 * @desc    Buscar cuadrante por código único
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */
router.get(
  "/codigo/:code",
  requirePermission("catalogos.cuadrantes.read"),
  getCuadranteByCode
);

/**
 * @route   GET /api/v1/cuadrantes/:id
 * @desc    Obtener cuadrante específico por ID
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 */
router.get(
  "/:id",
  requirePermission("catalogos.cuadrantes.read"),
  getCuadranteById
);

// ============================================
// RUTAS DE MODIFICACIÓN (CREATE, UPDATE, DELETE)
// ============================================

/**
 * @route   POST /api/v1/cuadrantes
 * @desc    Crear nuevo cuadrante
 * @access  Private (requiere permiso: catalogos.cuadrantes.create)
 */
router.post(
  "/",
  requirePermission("catalogos.cuadrantes.create"),
  createCuadrante
);

/**
 * @route   PUT /api/v1/cuadrantes/:id
 * @desc    Actualizar cuadrante existente
 * @access  Private (requiere permiso: catalogos.cuadrantes.update)
 */
router.put(
  "/:id",
  requirePermission("catalogos.cuadrantes.update"),
  updateCuadrante
);

/**
 * @route   DELETE /api/v1/cuadrantes/:id
 * @desc    Eliminar cuadrante (soft delete)
 * @access  Private (requiere permiso: catalogos.cuadrantes.delete)
 */
router.delete(
  "/:id",
  requirePermission("catalogos.cuadrantes.delete"),
  deleteCuadrante
);

/**
 * @route   PATCH /api/v1/cuadrantes/:id/estado
 * @desc    Activar o desactivar cuadrante
 * @access  Private (requiere permiso: catalogos.cuadrantes.update)
 */
router.patch(
  "/:id/estado",
  requirePermission("catalogos.cuadrantes.update"),
  cambiarEstado
);

export default router;
