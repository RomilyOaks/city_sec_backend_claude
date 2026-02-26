/**
 * ===================================================
 * RUTAS: OperativosPersonalNovedades
 * ===================================================
 *
 * Ruta: src/routes/operativos-personal-novedades.routes.js
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @version 2.2.2
 * @date 2026-01-17
 *
 * Descripcion:
 * Define las rutas para la gestión de novedades atendidas en cuadrantes
 * de personal operativo (patrullaje a pie).
 *
 * Endpoints:
 * - GET /:cuadranteId/novedades - Obtener todas las novedades de un cuadrante
 * - GET /:cuadranteId/novedades/disponibles - Obtener novedades disponibles
 * - POST /:cuadranteId/novedades - Registrar nueva novedad
 * - PUT /novedades/:id - Actualizar novedad
 * - DELETE /novedades/:id - Eliminar novedad
 */

import { Router } from "express";
import { body, param } from "express-validator";
import {
  getAllNovedadesByCuadrante,
  getNovedadesDisponiblesByCuadrante,
  createNovedadInCuadrante,
  updateNovedadInCuadrante,
  deleteNovedadInCuadrante,
} from "../controllers/operativosPersonalNovedadesController.js";
import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router({ mergeParams: true });

const permisos = {
  read: "operativos.personal.novedades.read",
  create: "operativos.personal.novedades.create",
  update: "operativos.personal.novedades.update",
  delete: "operativos.personal.novedades.delete",
};

// Obtener novedades disponibles para el cuadrante (lista de novedades del sistema)
router.get(
  "/disponibles",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], [permisos.read]),
  getNovedadesDisponiblesByCuadrante
);

// Obtener todas las novedades de un cuadrante con información completa
router.get(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], [permisos.read]),
  getAllNovedadesByCuadrante
);

// Registrar una nueva novedad atendida en un cuadrante
router.post(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], [permisos.create]),
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
  registrarAuditoria("Registro de novedad atendida en cuadrante de personal operativo"),
  createNovedadInCuadrante
);

// Actualizar información de una novedad atendida
router.put(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], [permisos.update]),
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
  registrarAuditoria("Actualización de novedad atendida en cuadrante de personal operativo"),
  updateNovedadInCuadrante
);

// Eliminar una novedad atendida (soft delete)
router.delete(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], [permisos.delete]),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la novedad debe ser un número entero positivo."),
  ],
  handleValidationErrors,
  registrarAuditoria("Eliminación de novedad atendida en cuadrante de personal operativo"),
  deleteNovedadInCuadrante
);

export default router;
