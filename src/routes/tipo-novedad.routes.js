/**
 * Ruta: src/routes/tipo-novedad.routes.js
 * VERSIÓN: 1.0.0
 */

import express from "express";
import tipoNovedadController from "../controllers/tipoNovedadController.js";
import {
  verificarToken,
  verificarRoles,
} from "../middlewares/authMiddleware.js";
import {
  validateCreate,
  validateUpdate,
  validateId,
  validateQuery,
} from "../validators/tipo-novedad.validator.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route GET /api/v1/tipos-novedad
 * @desc  Listar tipos de novedad
 * @access Private (todos autenticados)
 */
router.get("/", validateQuery, tipoNovedadController.getAll);

/**
 * @route GET /api/v1/tipos-novedad/:id
 * @desc  Obtener tipo de novedad por ID
 * @access Private (todos autenticados)
 */
router.get("/:id", validateId, tipoNovedadController.getById);

/**
 * @route POST /api/v1/tipos-novedad
 * @desc  Crear tipo de novedad
 * @access Private (admin, supervisor)
 */
router.post(
  "/",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  validateCreate,
  tipoNovedadController.create
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
  tipoNovedadController.update
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
  tipoNovedadController.remove
);

export default router;
