/**
 * Rutas de Sectores y Cuadrantes
 * Endpoints para gestión territorial
 */

import express from "express";
const router = express.Router();
import sectoresController from "../controllers/sectoresController.js";
import {
  verificarToken,
  verificarRoles,
  registrarAccion,
  ROLES,
} from "../middlewares/authMiddleware.js";

// ==================== SECTORES ====================

/**
 * @route   GET /api/sectores
 * @desc    Obtener todos los sectores
 * @access  Todos los usuarios autenticados
 * @query   estado, zona_code
 */
router.get("/", verificarToken, sectoresController.getAllSectores);

/**
 * @route   GET /api/sectores/:id
 * @desc    Obtener un sector por ID
 * @access  Todos los usuarios autenticados
 */
router.get("/:id", verificarToken, sectoresController.getSectorById);

/**
 * @route   POST /api/sectores
 * @desc    Crear un nuevo sector
 * @access  Supervisor, Administrador
 */
router.post(
  "/",
  verificarToken,
  verificarRoles([ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  registrarAccion("CREAR_SECTOR"),
  sectoresController.createSector
);

/**
 * @route   PUT /api/sectores/:id
 * @desc    Actualizar un sector
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles([ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  registrarAccion("ACTUALIZAR_SECTOR"),
  sectoresController.updateSector
);

/**
 * @route   DELETE /api/sectores/:id
 * @desc    Eliminar un sector (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  registrarAccion("ELIMINAR_SECTOR"),
  sectoresController.deleteSector
);

// ==================== CUADRANTES ====================

/**
 * @route   GET /api/cuadrantes
 * @desc    Obtener todos los cuadrantes
 * @access  Todos los usuarios autenticados
 * @query   sector_id, estado
 */
router.get("/cuadrantes", verificarToken, sectoresController.getAllCuadrantes);

/**
 * @route   GET /api/cuadrantes/:id
 * @desc    Obtener un cuadrante por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/cuadrantes/:id",
  verificarToken,
  sectoresController.getCuadranteById
);

/**
 * @route   POST /api/cuadrantes
 * @desc    Crear un nuevo cuadrante
 * @access  Supervisor, Administrador
 */
router.post(
  "/cuadrantes",
  verificarToken,
  verificarRoles([ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  registrarAccion("CREAR_CUADRANTE"),
  sectoresController.createCuadrante
);

/**
 * @route   PUT /api/cuadrantes/:id
 * @desc    Actualizar un cuadrante
 * @access  Supervisor, Administrador
 */
router.put(
  "/cuadrantes/:id",
  verificarToken,
  verificarRoles([ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  registrarAccion("ACTUALIZAR_CUADRANTE"),
  sectoresController.updateCuadrante
);

/**
 * @route   DELETE /api/cuadrantes/:id
 * @desc    Eliminar un cuadrante (soft delete)
 * @access  Administrador
 */
router.delete(
  "/cuadrantes/:id",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  registrarAccion("ELIMINAR_CUADRANTE"),
  sectoresController.deleteCuadrante
);

export default router;
