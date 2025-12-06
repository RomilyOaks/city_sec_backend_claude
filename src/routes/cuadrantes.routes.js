/**
 * Ruta: src/routes/cuadrantes.routes.js
 *
 * Descripción:
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
 *
 * @module routes/cuadrantes
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
  authenticate,
  requirePermission,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// Crear router de Express
const router = express.Router();

/**
 * Middleware de autenticación para todas las rutas
 * Todas las rutas de cuadrantes requieren autenticación
 */
router.use(authenticate);

// ============================================
// RUTAS DE CONSULTA (READ)
// ============================================

/**
 * @route   GET /api/v1/cuadrantes
 * @desc    Listar cuadrantes con paginación y filtros
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 * @query   {number} page - Número de página (default: 1)
 * @query   {number} limit - Items por página (default: 10)
 * @query   {number} sector_id - Filtrar por sector
 * @query   {boolean} activos - Solo activos (default: true)
 * @query   {string} search - Búsqueda por nombre o código
 */
router.get("/", requirePermission("catalogos.cuadrantes.read"), getCuadrantes);

/**
 * @route   GET /api/v1/cuadrantes/cercanos
 * @desc    Buscar cuadrantes cercanos a una ubicación (geoespacial)
 * @access  Private (requiere permiso: catalogos.cuadrantes.read)
 * @query   {number} lat - Latitud
 * @query   {number} lng - Longitud
 * @query   {number} radius - Radio en km (default: 5)
 *
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id
 * para que /cercanos no se interprete como un ID
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
 * @params  {number} sectorId - ID del sector
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
 * @params  {string} code - Código del cuadrante
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
 * @params  {number} id - ID del cuadrante
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
 * @body    {Object} cuadrante - Datos del cuadrante
 * @body    {string} cuadrante.nombre - Nombre (requerido)
 * @body    {number} cuadrante.sector_id - ID del sector (requerido)
 * @body    {string} [cuadrante.cuadrante_code] - Código (opcional, se genera automático)
 * @body    {string} [cuadrante.zona_code] - Código de zona
 * @body    {number} [cuadrante.latitud] - Latitud
 * @body    {number} [cuadrante.longitud] - Longitud
 * @body    {Object} [cuadrante.poligono_json] - Polígono GeoJSON
 * @body    {number} [cuadrante.radio_metros] - Radio en metros
 * @body    {string} [cuadrante.color_mapa] - Color hex (ej: #10B981)
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
 * @params  {number} id - ID del cuadrante
 * @body    {Object} cuadrante - Datos a actualizar
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
 * @params  {number} id - ID del cuadrante
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
 * @params  {number} id - ID del cuadrante
 * @body    {boolean} estado - true para activar, false para desactivar
 */
router.patch(
  "/:id/estado",
  requirePermission("catalogos.cuadrantes.update"),
  cambiarEstado
);

// Exportar router
export default router;
