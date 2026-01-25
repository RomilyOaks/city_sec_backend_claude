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
 * @route GET /api/v1/estados-novedad
 * @desc  Listar estados de novedad
 * @access Private (todos autenticados)
 */
router.get("/", validateQuery, estadoNovedadController.getAll);

/**
 * @route GET /api/v1/estados-novedad/siguientes/:estadoActualId
 * @desc  Obtener estados siguientes para dropdown (orden >= estado actual)
 * @access Private (todos autenticados)
 *
 * NOTA: Esta ruta debe estar ANTES de /:id para evitar conflictos
 *
 * USO EN FRONTEND:
 * - Cuando la novedad está en estado 2 (Despachado), el dropdown solo mostrará
 *   estados con orden >= 2 (Despachado, En Atención, Resuelto, etc.)
 * - Esto evita que el usuario pueda "retroceder" en el workflow
 */
router.get("/siguientes/:estadoActualId", validateId, estadoNovedadController.getSiguientes);

/**
 * @route GET /api/v1/estados-novedad/:id
 * @desc  Obtener estado de novedad por ID
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
