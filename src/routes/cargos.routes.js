/**
 * ===================================================
 * RUTAS: cargos.routes.js
 * ===================================================
 *
 * Ruta: src/routes/cargos.routes.js
 *
 * Descripción:
 * Rutas para la gestión de cargos/puestos de trabajo.
 * Define los endpoints REST con control de acceso RBAC.
 *
 * VERSIÓN: 1.0.0
 * - ✅ CRUD completo
 * - ✅ Control RBAC
 * - ✅ Validaciones
 * - ✅ Endpoints de consulta
 *
 * @module routes/cargos
 * @author Sistema de Seguridad Ciudadana
 * @version 1.0.0
 * @date 2025-12-12
 */

import express from "express";
const router = express.Router();
import cargosController from "../controllers/cargosController.js";
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// ==========================================
// RUTAS PÚBLICAS (requieren autenticación)
// ==========================================

/**
 * @route   GET /api/v1/cargos/stats
 * @desc    Obtener estadísticas de cargos
 * @access  Todos los usuarios autenticados
 */
router.get("/stats", verificarToken, cargosController.getEstadisticas);

/**
 * @route   GET /api/v1/cargos/con-licencia
 * @desc    Obtener cargos que requieren licencia
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/con-licencia",
  verificarToken,
  cargosController.getCargosConLicencia
);

/**
 * @route   GET /api/v1/cargos/categoria/:categoria
 * @desc    Obtener cargos por categoría
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/categoria/:categoria",
  verificarToken,
  cargosController.getCargosByCategoria
);

/**
 * @route   GET /api/v1/cargos
 * @desc    Obtener todos los cargos con filtros
 * @access  Todos los usuarios autenticados
 * @query   categoria, requiere_licencia, activos, page, limit
 */
router.get("/", verificarToken, cargosController.getAllCargos);

/**
 * @route   GET /api/v1/cargos/:id
 * @desc    Obtener un cargo específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get("/:id", verificarToken, cargosController.getCargoById);

// ==========================================
// RUTAS PROTEGIDAS (Admin y Supervisor)
// ==========================================

/**
 * @route   POST /api/v1/cargos
 * @desc    Crear un nuevo cargo
 * @access  Admin, Supervisor
 * @body    nombre, descripcion, nivel_jerarquico, categoria, requiere_licencia, etc.
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["catalogos.cargos.create"]),
  cargosController.createCargo
);

/**
 * @route   PUT /api/v1/cargos/:id
 * @desc    Actualizar un cargo existente
 * @access  Admin, Supervisor
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["catalogos.cargos.update"]),
  cargosController.updateCargo
);

/**
 * @route   DELETE /api/v1/cargos/:id
 * @desc    Eliminar un cargo (soft delete)
 * @access  Admin
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["catalogos.cargos.delete"]),
  cargosController.deleteCargo
);

/**
 * @route   POST /api/v1/cargos/:id/restore
 * @desc    Restaurar un cargo eliminado
 * @access  Admin
 */
router.post(
  "/:id/restore",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["catalogos.cargos.create"]),
  cargosController.restoreCargo
);

export default router;
