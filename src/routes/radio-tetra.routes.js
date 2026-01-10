/**
 * ===================================================
 * RUTAS: Radios TETRA
 * ===================================================
 *
 * Ruta: src/routes/radio-tetra.routes.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-06
 *
 * Descripción:
 * Define las rutas para el módulo de radios TETRA.
 * Incluye autenticación, autorización y validación.
 *
 * Endpoints:
 * - GET    /api/radios-tetra              → Listar radios con filtros
 * - GET    /api/radios-tetra/disponibles  → Listar radios disponibles
 * - GET    /api/radios-tetra/:id          → Obtener radio por ID
 * - POST   /api/radios-tetra              → Crear nuevo radio
 * - PUT    /api/radios-tetra/:id          → Actualizar radio
 * - DELETE /api/radios-tetra/:id          → Eliminar radio (soft)
 * - PATCH  /api/radios-tetra/:id/asignar  → Asignar a personal
 * - PATCH  /api/radios-tetra/:id/desasignar → Desasignar
 * - PATCH  /api/radios-tetra/:id/activar   → Activar radio
 * - PATCH  /api/radios-tetra/:id/desactivar → Desactivar radio
 *
 * @module routes/radio-tetra
 * @requires express
 * @requires controllers/radioTetraController
 * @requires middlewares/validators/radio-tetra.validator
 * @requires middlewares/auth/auth.middleware
 * @requires middlewares/auth/permission.middleware
 * @version 1.0.0
 * @date 2026-01-06
 */

import express from "express";
const router = express.Router();
import radioTetraController from "../controllers/radioTetraController.js";
import {
  validateRadioId,
  validateCreateRadio,
  validateUpdateRadio,
  validateAsignarPersonal,
  validateQueryRadios,
} from "../middlewares/validators/radio-tetra.validator.js";
//import { verifyToken } from "../middlewares/auth/auth.middleware.js";
/*
import {
  requireAnyPermission,
  requireAllPermissions,
} from "../middlewares/auth/permission.middleware.js";
*/
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

/**
 * =====================================================
 * TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
 * =====================================================
 */
//router.use(verifyToken);

/**
 * =====================================================
 * GET /api/radios-tetra/disponibles
 * =====================================================
 * Listar radios disponibles (sin asignar y activos)
 * Para usar en dropdowns del frontend
 *
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/disponibles",
  verificarToken,
  requireAnyPermission(["catalogos.radios_tetra.read"]),
  (req, res, next) => {
    return radioTetraController.getRadiosDisponibles(req, res, next);
  }
);

/**
 * =====================================================
 * GET /api/radios-tetra
 * =====================================================
 * Listar todos los radios con filtros y paginación
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 10)
 * - search: búsqueda por código o descripción
 * - estado: filtrar por estado (true/false)
 * - asignado: filtrar por asignación (true/false/all)
 * - personal_seguridad_id: filtrar por personal específico
 *
 * @access  Requiere permiso de lectura
 */
router.get(
  "/",
  verificarToken,
  requireAnyPermission(["catalogos.radios_tetra.read"]),
  validateQueryRadios,
  (req, res, next) => {
    return radioTetraController.getAllRadios(req, res, next);
  }
);

/**
 * =====================================================
 * GET /api/radios-tetra/:id
 * =====================================================
 * Obtener un radio por su ID
 *
 * @access  Requiere permiso de lectura
 */
router.get(
  "/:id",
  verificarToken,
  requireAnyPermission(["catalogos.radios_tetra.read"]),
  validateRadioId,
  (req, res, next) => {
    return radioTetraController.getRadioById(req, res, next);
  }
);

/**
 * =====================================================
 * POST /api/radios-tetra
 * =====================================================
 * Crear un nuevo radio TETRA
 *
 * Body:
 * - radio_tetra_code: string (10 chars, opcional si se autogenera)
 * - descripcion: string (50 chars, opcional)
 * - personal_seguridad_id: integer (opcional)
 * - fecha_fabricacion: date (opcional)
 * - estado: boolean (default: true)
 *
 * @access  Requiere permiso de creación
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["catalogos.radios_tetra.create"]),
  validateCreateRadio,
  (req, res, next) => {
    return radioTetraController.createRadio(req, res, next);
  }
);

/**
 * =====================================================
 * PUT /api/radios-tetra/:id
 * =====================================================
 * Actualizar un radio TETRA existente
 *
 * @access  Requiere permiso de actualización
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["catalogos.radios_tetra.update"]),
  validateRadioId,
  validateUpdateRadio,
  (req, res, next) => {
    return radioTetraController.updateRadio(req, res, next);
  }
);

/**
 * =====================================================
 * DELETE /api/radios-tetra/:id
 * =====================================================
 * Eliminar un radio TETRA (soft delete)
 *
 * @access  Requiere permiso de eliminación
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["catalogos.radios_tetra.delete"]),
  validateRadioId,
  (req, res, next) => {
    return radioTetraController.deleteRadio(req, res, next);
  }
);

/**
 * =====================================================
 * PATCH /api/radios-tetra/:id/asignar
 * =====================================================
 * Asignar un radio a personal de seguridad
 *
 * Body:
 * - personal_seguridad_id: integer (required)
 *
 * @access  Requiere permiso de actualización
 */
router.patch(
  "/:id/asignar",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission([
    "catalogos.radios_tetra.update",
    "catalogos.radios_tetra.asignar",
  ]),
  validateRadioId,
  validateAsignarPersonal,
  (req, res, next) => {
    return radioTetraController.asignarAPersonal(req, res, next);
  }
);

/**
 * =====================================================
 * PATCH /api/radios-tetra/:id/desasignar
 * =====================================================
 * Desasignar un radio (liberar para reasignación)
 *
 * @access  Requiere permiso de actualización
 */
router.patch(
  "/:id/desasignar",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission([
    "catalogos.radios_tetra.update",
    "catalogos.radios_tetra.asignar",
  ]),
  validateRadioId,
  (req, res, next) => {
    return radioTetraController.desasignarRadio(req, res, next);
  }
);

/**
 * =====================================================
 * PATCH /api/radios-tetra/:id/activar
 * =====================================================
 * Activar un radio
 *
 * @access  Requiere permiso de actualización
 */
router.patch(
  "/:id/activar",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["catalogos.radios_tetra.update"]),
  validateRadioId,
  (req, res, next) => {
    return radioTetraController.activarRadio(req, res, next);
  }
);

/**
 * =====================================================
 * PATCH /api/radios-tetra/:id/desactivar
 * =====================================================
 * Desactivar un radio
 *
 * @access  Requiere permiso de actualización
 */
router.patch(
  "/:id/desactivar",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["catalogos.radios_tetra.update"]),
  validateRadioId,
  (req, res, next) => {
    return radioTetraController.desactivarRadio(req, res, next);
  }
);

export default router;
