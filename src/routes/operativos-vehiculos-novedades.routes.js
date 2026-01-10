/**
 * ===================================================
 * RUTAS: OperativosVehiculosNovedades
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2026-01-09
 *
 * Descripcion:
 * Define las rutas para la gestión de novedades asignadas a vehículos operativos en cuadrantes.
 *
 * Endpoints:
 * - GET /api/v1/operativos/vehiculos/cuadrantes/:operativoVehiculoCuadranteId/novedades: Obtener todas las novedades de un cuadrante de vehículo operativo.
 * - POST /api/v1/operativos/vehiculos/cuadrantes/:operativoVehiculoCuadranteId/novedades: Asignar una nueva novedad a un cuadrante de vehículo operativo.
 * - PUT /api/v1/operativos/vehiculos/cuadrantes/:operativoVehiculoCuadranteId/novedades/:id: Actualizar la información de una novedad en un cuadrante de vehículo operativo.
 * - DELETE /api/v1/operativos/vehiculos/cuadrantes/:operativoVehiculoCuadranteId/novedades/:id: Eliminar la asignación de una novedad de un cuadrante de vehículo operativo.
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

// Rutas para OperativosVehiculosNovedades
router.get(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  getAllNovedadesByCuadrante
);

router.post(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.create])(req, res, next),
  [
    body("novedad_id")
      .isInt()
      .withMessage("El ID de la novedad debe ser un número entero."),
    body("reportado")
      .optional()
      .isISO8601()
      .withMessage("La fecha de reporte debe ser una fecha y hora válida."),
    body("estado")
      .optional()
      .isInt({ min: 0, max: 1 })
      .withMessage("El estado debe ser 0 o 1."),
    body("observaciones")
      .optional()
      .isString()
      .withMessage("Las observaciones deben ser una cadena de texto."),
  ],
  handleValidationErrors,
  registrarAuditoria("Registro de novedad en cuadrante de vehículo operativo"),
  createNovedadInCuadrante
);

router.put(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  [
    param("id")
      .isInt()
      .withMessage("El ID de la novedad asignada debe ser un número entero."),
    body("novedad_id")
      .optional()
      .isInt()
      .withMessage("El ID de la novedad debe ser un número entero."),
    body("reportado")
      .optional()
      .isISO8601()
      .withMessage("La fecha de reporte debe ser una fecha y hora válida."),
    body("estado")
      .optional()
      .isInt({ min: 0, max: 1 })
      .withMessage("El estado debe ser 0 o 1."),
    body("observaciones")
      .optional()
      .isString()
      .withMessage("Las observaciones deben ser una cadena de texto."),
  ],
  handleValidationErrors,
  registrarAuditoria(
    "Actualización de novedad en cuadrante de vehículo operativo"
  ),
  updateNovedadInCuadrante
);

router.delete(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.delete])(req, res, next),
  [
    param("id")
      .isInt()
      .withMessage("El ID de la novedad asignada debe ser un número entero."),
  ],
  handleValidationErrors,
  registrarAuditoria(
    "Eliminación de novedad en cuadrante de vehículo operativo"
  ),
  deleteNovedadInCuadrante
);

export default router;
