/**
 * ===================================================
 * RUTAS: TiposCopiloto
 * ===================================================
 *
 * @version 1.0.0
 * @date 2026-01-11
 *
 * Descripcion:
 * Define las rutas para gestionar los tipos de copiloto.
 *
 * Endpoints:
 * - GET /tipos-copiloto/activos
 * - GET /tipos-copiloto
 * - GET /tipos-copiloto/:id
 * - POST /tipos-copiloto
 * - PUT /tipos-copiloto/:id
 * - DELETE /tipos-copiloto/:id
 */

import { Router } from "express";
import {
  getTiposActivos,
  getAllTipos,
  getTipoById,
  createTipo,
  updateTipo,
  deleteTipo,
} from "../controllers/tipoCopilotoController.js";
import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { catalogRateLimit } from "../middlewares/rateLimitMiddleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router();

const permisos = {
  leer: "catalogos.tipos_copiloto.read",
  crear: "catalogos.tipos_copiloto.create",
  actualizar: "catalogos.tipos_copiloto.update",
  eliminar: "catalogos.tipos_copiloto.delete",
};

// Validaciones
const validateTipoData = [
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
 * GET /tipos-copiloto/activos
 * Obtener solo tipos activos (para dropdowns)
 */
router.get(
  "/activos",
  verificarToken,
  catalogRateLimit, // 🔥 ANTI-BUCLE: Máximo 5 solicitudes/minuto
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], [permisos.leer]),
  getTiposActivos
);

/**
 * GET /tipos-copiloto
 * Obtener todos los tipos con paginación
 */
router.get(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], [permisos.leer]),
  getAllTipos
);

/**
 * GET /tipos-copiloto/:id
 * Obtener un tipo por ID
 */
router.get(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], [permisos.leer]),
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  handleValidationErrors,
  getTipoById
);

/**
 * POST /tipos-copiloto
 * Crear un nuevo tipo
 */
router.post(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], [permisos.crear]),
  validateTipoData,
  handleValidationErrors,
  registrarAuditoria(permisos.crear),
  createTipo
);

/**
 * PUT /tipos-copiloto/:id
 * Actualizar un tipo
 */
router.put(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], [permisos.actualizar]),
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  validateTipoData,
  handleValidationErrors,
  registrarAuditoria(permisos.actualizar),
  updateTipo
);

/**
 * DELETE /tipos-copiloto/:id
 * Eliminar un tipo (soft delete)
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin"], [permisos.eliminar]),
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  handleValidationErrors,
  registrarAuditoria(permisos.eliminar),
  deleteTipo
);

export default router;
