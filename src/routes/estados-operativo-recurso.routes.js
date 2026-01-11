/**
 * ===================================================
 * RUTAS: EstadosOperativoRecurso
 * ===================================================
 *
 * @version 1.0.0
 * @date 2026-01-11
 *
 * Descripcion:
 * Define las rutas para gestionar los estados operativos de recursos.
 *
 * Endpoints:
 * - GET /estados-operativo-recurso/activos
 * - GET /estados-operativo-recurso
 * - GET /estados-operativo-recurso/:id
 * - POST /estados-operativo-recurso
 * - PUT /estados-operativo-recurso/:id
 * - DELETE /estados-operativo-recurso/:id
 */

import { Router } from "express";
import {
  getEstadosActivos,
  getAllEstados,
  getEstadoById,
  createEstado,
  updateEstado,
  deleteEstado,
} from "../controllers/estadoOperativoRecursoController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router();

const permisos = {
  leer: "catalogos.estados_operativo.read",
  crear: "catalogos.estados_operativo.create",
  actualizar: "catalogos.estados_operativo.update",
  eliminar: "catalogos.estados_operativo.delete",
};

// Validaciones
const validateEstadoData = [
  body("codigo")
    .notEmpty()
    .withMessage("El código es requerido")
    .isLength({ max: 10 })
    .withMessage("El código no puede tener más de 10 caracteres"),
  body("descripcion")
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isLength({ max: 35 })
    .withMessage("La descripción no puede tener más de 35 caracteres"),
  body("estado")
    .optional()
    .isInt({ min: 0, max: 1 })
    .withMessage("El estado debe ser 0 o 1"),
];

/**
 * GET /estados-operativo-recurso/activos
 * Obtener solo estados activos (para dropdowns)
 */
router.get(
  "/activos",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  getEstadosActivos
);

/**
 * GET /estados-operativo-recurso
 * Obtener todos los estados con paginación
 */
router.get(
  "/",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  getAllEstados
);

/**
 * GET /estados-operativo-recurso/:id
 * Obtener un estado por ID
 */
router.get(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  handleValidationErrors,
  getEstadoById
);

/**
 * POST /estados-operativo-recurso
 * Crear un nuevo estado
 */
router.post(
  "/",
  verificarToken,
  requireAnyPermission([permisos.crear]),
  validateEstadoData,
  handleValidationErrors,
  registrarAuditoria(permisos.crear),
  createEstado
);

/**
 * PUT /estados-operativo-recurso/:id
 * Actualizar un estado
 */
router.put(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.actualizar]),
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  validateEstadoData,
  handleValidationErrors,
  registrarAuditoria(permisos.actualizar),
  updateEstado
);

/**
 * DELETE /estados-operativo-recurso/:id
 * Eliminar un estado (soft delete)
 */
router.delete(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.eliminar]),
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  handleValidationErrors,
  registrarAuditoria(permisos.eliminar),
  deleteEstado
);

export default router;
