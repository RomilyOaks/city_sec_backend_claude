/**
 * ===================================================
 * RUTAS: Unidades/Oficinas
 * ===================================================
 *
 * Ruta: src/routes/unidad-oficina.routes.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-15
 *
 * @module routes/unidad-oficina.routes
 * @version 1.0.0
 */

import express from "express";
import unidadOficinaController from "../controllers/unidadOficinaController.js";
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import {
  validateCreate,
  validateUpdate,
  validateId,
  validateQuery,
} from "../validators/unidad-oficina.validator.js";

const router = express.Router();

// ==========================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ==========================================

router.use(verificarToken);

// ==========================================
// RBAC: PERMISOS PARA CRUD Y ACCIONES
// ==========================================

const permisos = {
  read: "catalogos.unidades.read",
  create: "catalogos.unidades.create",
  update: "catalogos.unidades.update",
  delete: "catalogos.unidades.delete",
};

// ==========================================
// ENDPOINTS
// ==========================================

/**
 * @route   GET /api/v1/unidades-oficina
 * @desc    Listar unidades/oficinas
 * @access  Private (todos autenticados)
 * @query   tipo, estado, ubigeo, search
 */
router.get(
  "/",
  requireAnyPermission([permisos.read]),
  validateQuery,
  unidadOficinaController.getAll,
);

/**
 * @route   GET /api/v1/unidades-oficina/:id
 * @desc    Obtener unidad/oficina por ID
 * @access  Private (todos autenticados)
 */
router.get(
  "/:id",
  validateId,
  requireAnyPermission([permisos.read]),
  unidadOficinaController.getById,
);

/**
 * @route   POST /api/v1/unidades-oficina
 * @desc    Crear unidad/oficina
 * @access  Private (admin, supervisor)
 */
router.post(
  "/",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission([permisos.create]),
  validateCreate,
  unidadOficinaController.create,
);

/**
 * @route   PUT /api/v1/unidades-oficina/:id
 * @desc    Actualizar unidad/oficina
 * @access  Private (admin, supervisor)
 */
router.put(
  "/:id",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission([permisos.update]),
  validateUpdate,
  unidadOficinaController.update,
);

/**
 * @route   DELETE /api/v1/unidades-oficina/:id
 * @desc    Eliminar unidad/oficina (soft delete)
 * @access  Private (admin)
 */
router.delete(
  "/:id",
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission([permisos.delete]),
  validateId,
  unidadOficinaController.remove,
);

// ==========================================
// EXPORTAR ROUTER
// ==========================================

export default router;
