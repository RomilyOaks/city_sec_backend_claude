/**
 * ===================================================
 * RUTAS: OperativosVehiculosNovedades
 * ===================================================
 *
 * @author Codi Express
 * @version 2.0.0
 * @date 2026-01-14
 *
 * Descripcion:
 * Define las rutas para la gestión de novedades atendidas en cuadrantes de vehículos operativos.
 * Incluye información completa de todos los niveles superiores.
 *
 * Endpoints:
 * - GET /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades: Obtener todas las novedades de un cuadrante con información completa.
 * - POST /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades: Registrar una nueva novedad atendida en un cuadrante.
 * - PUT /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades/:id: Actualizar información de una novedad atendida.
 * - DELETE /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades/:id: Eliminar una novedad atendida (soft delete).
 */

import { Router } from "express";
import { body, param } from "express-validator";
import {
  getAllNovedadesByCuadrante,
  createNovedadInCuadrante,
  updateNovedadInCuadrante,
  deleteNovedadInCuadrante,
} from "../controllers/operativosVehiculosNovedadesController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router({ mergeParams: true });

const permisos = {
  read: "operativos.vehiculos.novedades.read",
  create: "operativos.vehiculos.novedades.create",
  update: "operativos.vehiculos.novedades.update",
  delete: "operativos.vehiculos.novedades.delete",
};

// Obtener todas las novedades de un cuadrante con información completa
router.get(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  getAllNovedadesByCuadrante
);

// Registrar una nueva novedad atendida en un cuadrante
router.post(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.create])(req, res, next),
  [
    body("novedad_id")
      .isInt({ min: 1 })
      .withMessage("El ID de la novedad debe ser un número entero positivo."),
    body("reportado")
      .optional()
      .isISO8601()
      .withMessage("La fecha de reporte debe ser una fecha y hora válida."),
    body("atendido")
      .optional()
      .isISO8601()
      .withMessage("La fecha de atención debe ser una fecha y hora válida."),
    body("estado")
      .optional()
      .isInt({ min: 0, max: 2 })
      .withMessage("El estado debe ser 0 (Inactivo), 1 (Activo) o 2 (Atendido)."),
    body("prioridad")
      .optional()
      .isIn(["BAJA", "MEDIA", "ALTA", "URGENTE"])
      .withMessage("La prioridad debe ser BAJA, MEDIA, ALTA o URGENTE."),
    body("observaciones")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Las observaciones no deben exceder los 1000 caracteres."),
    body("acciones_tomadas")
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage("Las acciones tomadas no deben exceder los 2000 caracteres."),
    body("resultado")
      .optional()
      .isIn(["PENDIENTE", "RESUELTO", "ESCALADO", "CANCELADO"])
      .withMessage("El resultado debe ser PENDIENTE, RESUELTO, ESCALADO o CANCELADO."),
  ],
  handleValidationErrors,
  registrarAuditoria("Registro de novedad atendida en cuadrante de vehículo operativo"),
  createNovedadInCuadrante
);

// Actualizar información de una novedad atendida
router.put(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la novedad debe ser un número entero positivo."),
    body("novedad_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID de la novedad debe ser un número entero positivo."),
    body("reportado")
      .optional()
      .isISO8601()
      .withMessage("La fecha de reporte debe ser una fecha y hora válida."),
    body("atendido")
      .optional()
      .isISO8601()
      .withMessage("La fecha de atención debe ser una fecha y hora válida."),
    body("estado")
      .optional()
      .isInt({ min: 0, max: 2 })
      .withMessage("El estado debe ser 0 (Inactivo), 1 (Activo) o 2 (Atendido)."),
    body("prioridad")
      .optional()
      .isIn(["BAJA", "MEDIA", "ALTA", "URGENTE"])
      .withMessage("La prioridad debe ser BAJA, MEDIA, ALTA o URGENTE."),
    body("observaciones")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Las observaciones no deben exceder los 1000 caracteres."),
    body("acciones_tomadas")
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage("Las acciones tomadas no deben exceder los 2000 caracteres."),
    body("resultado")
      .optional()
      .isIn(["PENDIENTE", "RESUELTO", "ESCALADO", "CANCELADO"])
      .withMessage("El resultado debe ser PENDIENTE, RESUELTO, ESCALADO o CANCELADO."),
  ],
  handleValidationErrors,
  registrarAuditoria("Actualización de novedad atendida en cuadrante de vehículo operativo"),
  updateNovedadInCuadrante
);

// Eliminar una novedad atendida (soft delete)
router.delete(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.delete])(req, res, next),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la novedad debe ser un número entero positivo."),
  ],
  handleValidationErrors,
  registrarAuditoria("Eliminación de novedad atendida en cuadrante de vehículo operativo"),
  deleteNovedadInCuadrante
);

export default router;
