/**
 * ============================================
 * RUTAS: src/routes/personal.routes.js
 * ============================================
 *
 * Rutas de Personal de Seguridad
 * Endpoints para gestión de personal con control RBAC
 */

import express from "express";
const router = express.Router();
import personalController from "../controllers/personalController.js";
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

/**
 * @route   GET /api/personal/disponibles
 * @desc    Obtener personal disponible (sin vehículo asignado)
 * @access  Operador, Supervisor, Administrador
 *
 */

router.get(
  "/disponibles",
  verificarToken,
  verificarRoles(["operador", "super_admin", "admin", "supervisor"]),
  personalController.getPersonalDisponible
);

/**
 * @route   GET /api/personal/stats
 * @desc    Obtener estadísticas del personal
 * @access  Supervisor, Administrador
 *
 * COMENTADO: Descomentar cuando exista personalController.getEstadisticasPersonal
 */

router.get(
  "/stats",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  personalController.getEstadisticasPersonal
);

/**
 * @route   GET /api/personal
 * @desc    Obtener todo el personal con filtros
 * @access  Todos los usuarios autenticados
 * @query   cargo_id, status, search, page, limit
 */
router.get("/", verificarToken, personalController.getAllPersonal);

/**
 * @route   GET /api/personal/:id
 * @desc    Obtener personal por ID
 * @access  Todos los usuarios autenticados
 */
router.get("/:id", verificarToken, personalController.getPersonalById);

/**
 * @route   POST /api/personal
 * @desc    Crear nuevo personal
 * @access  Supervisor, Administrador
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.personal.create"]),
  personalController.createPersonal
);

/**
 * @route   PUT /api/personal/:id
 * @desc    Actualizar personal existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.personal.update"]),
  personalController.updatePersonal
);

/**
 * @route   PATCH /api/personal/:id/estado
 * @desc    Cambiar estado del personal
 * @access  Supervisor, Administrador
 *
 * COMENTADO: Descomentar cuando exista personalController.cambiarEstadoPersonal
 */

router.patch(
  "/:id/estado",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  personalController.cambiarEstadoPersonal
);

/**
 * @route   DELETE /api/personal/:id
 * @desc    Eliminar personal (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["personal.personal.delete"]),
  personalController.deletePersonal
);

export default router;
