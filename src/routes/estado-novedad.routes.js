/**
 * Ruta: src/routes/estado-novedad.routes.js
 * VERSIÓN: 1.0.0
 */

import express from "express";
import estadoNovedadController from "../controllers/estadoNovedadController.js";
import {
  verificarToken,
  verificarRoles,
} from "../middlewares/authMiddleware.js";
import {
  validateCreate,
  validateUpdate,
  validateId,
  validateQuery,
} from "../validators/estado-novedad.validator.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route GET /api/v1/tipos-novedad
 * @desc  Listar tipos de novedad
 * @access Private (todos autenticados)
 */
router.get("/", validateQuery, estadoNovedadController.getAll);

/**
 * @route GET /api/v1/tipos-novedad/:id
 * @desc  Obtener tipo de novedad por ID
 * @access Private (todos autenticados)
 */
router.get("/:id", validateId, estadoNovedadController.getById);

/**
 * @route POST /api/v1/tipos-novedad
 * @desc  Crear tipo de novedad
 * @access Private (admin, supervisor)
 */
router.post(
  "/",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  validateCreate,
  estadoNovedadController.create
);

/**
 * @route PUT /api/v1/tipos-novedad/:id
 * @desc  Actualizar tipo de novedad
 * @access Private (admin, supervisor)
 */
router.put(
  "/:id",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  validateUpdate,
  estadoNovedadController.update
);

/**
 * @route DELETE /api/v1/tipos-novedad/:id
 * @desc  Eliminar tipo de novedad
 * @access Private (admin)
 */
router.delete(
  "/:id",
  verificarRoles(["super_admin", "admin"]),
  validateId,
  estadoNovedadController.remove
);

export default router;
