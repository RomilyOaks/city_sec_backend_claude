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
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

// ==========================================
// RUTAS PÚBLICAS (requieren autenticación)
// ==========================================

/**
 * @route   GET /api/v1/cargos/stats
 * @desc    Obtener estadísticas de cargos
 * @access  Todos los usuarios autenticados
 */
router.get("/stats", verificarToken, verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.cargos.read"]), cargosController.getEstadisticas);

/**
 * @route   GET /api/v1/cargos/con-licencia
 * @desc    Obtener cargos que requieren licencia
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/con-licencia",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.cargos.read"]),
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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.cargos.read"]),
  cargosController.getCargosByCategoria
);

/**
 * @route   GET /api/v1/cargos
 * @desc    Obtener todos los cargos con filtros
 * @access  Todos los usuarios autenticados
 * @query   categoria, requiere_licencia, activos, page, limit
 */
router.get("/", verificarToken, verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.cargos.read"]), cargosController.getAllCargos);

/**
 * @route   GET /api/v1/cargos/:id
 * @desc    Obtener un cargo específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get("/:id", verificarToken, verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.cargos.read"]), cargosController.getCargoById);

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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["catalogos.cargos.create"]),
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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["catalogos.cargos.update"]),
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
  verificarRolesOPermisos(["super_admin", "admin"], ["catalogos.cargos.delete"]),
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
  verificarRolesOPermisos(["super_admin", "admin"], ["catalogos.cargos.create"]),
  cargosController.restoreCargo
);

export default router;
