/**
 * ============================================
 * RUTAS: src/routes/auditoriaAccion.routes.js
 * ============================================
 *
 * Rutas de Auditoría
 * Define los endpoints para consulta de registros de auditoría
 */

import express from "express";
const router = express.Router();

import * as auditoriaAccionController from "../controllers/auditoriaAccionController.js";

import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { auditarExportacion } from "../middlewares/auditoriaAccionMiddleware.js";
import { query, param, validationResult } from "express-validator";

// Middleware de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   GET /api/auditoria/stats
 * @desc    Obtener estadísticas de auditoría
 * @access  Supervisor, Administrador
 */
router.get(
  "/stats",
  verificarToken,
  verificarRoles(["supervisor", "admin"]),
  requireAnyPermission(["auditoria.estadisticas.read"]),
  [
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage("Fecha inicio inválida"),
    query("fecha_fin").optional().isISO8601().withMessage("Fecha fin inválida"),
    handleValidationErrors,
  ],
  auditoriaAccionController.getEstadisticas
);

/**
 * @route   GET /api/auditoria/mi-actividad
 * @desc    Obtener actividad reciente del usuario actual
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/mi-actividad",
  verificarToken,
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Límite debe estar entre 1 y 100"),
    handleValidationErrors,
  ],
  auditoriaAccionController.getMiActividad
);

/**
 * @route   GET /api/auditoria/export/csv
 * @desc    Exportar auditoría a CSV
 * @access  Supervisor, Administrador
 */
router.get(
  "/export/csv",
  verificarToken,
  verificarRoles(["supervisor", "admin"]),
  requireAnyPermission(["auditoria.registros.export"]),
  [
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage("Fecha inicio inválida"),
    query("fecha_fin").optional().isISO8601().withMessage("Fecha fin inválida"),
    handleValidationErrors,
  ],
  auditarExportacion("Auditoria"),
  auditoriaAccionController.exportarCSV
);

/**
 * @route   GET /api/auditoria/entidad/:entidad/:id
 * @desc    Obtener historial de auditoría de una entidad específica
 * @access  Supervisor, Administrador
 */
router.get(
  "/entidad/:entidad/:id",
  verificarToken,
  verificarRoles(["supervisor", "admin"]),
  requireAnyPermission(["auditoria.registros.read"]),
  [
    param("entidad").notEmpty().withMessage("Entidad es requerida"),
    param("id").isInt({ min: 1 }).withMessage("ID inválido"),
    handleValidationErrors,
  ],
  auditoriaAccionController.getHistorialEntidad
);

/**
 * @route   GET /api/auditoria/:id
 * @desc    Obtener un registro de auditoría por ID
 * @access  Supervisor, Administrador
 */
router.get(
  "/:id",
  verificarToken,
  verificarRoles(["supervisor", "admin"]),
  requireAnyPermission(["auditoria.registros.read"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID inválido"),
    handleValidationErrors,
  ],
  auditoriaAccionController.getAuditoriaAccionById // <-- USAR EL NOMBRE CORRECTO
);

/**
 * @route   GET /api/auditoria
 * @desc    Obtener registros de auditoría con filtros
 * @access  Supervisor, Administrador
 */
router.get(
  "/",
  verificarToken,
  verificarRoles(["supervisor", "admin"]),
  requireAnyPermission(["auditoria.registros.read"]),
  [
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage("Fecha inicio inválida"),
    query("fecha_fin").optional().isISO8601().withMessage("Fecha fin inválida"),
    query("usuario_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("usuario_id debe ser un número positivo"),
    query("accion")
      .optional()
      .isIn([
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "LOGIN_FAILED",
        "PASSWORD_CHANGE",
        "EXPORT",
        "IMPORT",
        "VIEW",
      ])
      .withMessage("Acción no válida"),
    query("severidad")
      .optional()
      .isIn(["BAJA", "MEDIA", "ALTA", "CRITICA"])
      .withMessage("Severidad no válida"),
    query("resultado")
      .optional()
      .isIn(["EXITOSO", "FALLIDO", "PARCIAL"])
      .withMessage("Resultado no válido"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page debe ser un número positivo"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    handleValidationErrors,
  ],
  auditoriaAccionController.getAuditorias
);

export default router;
