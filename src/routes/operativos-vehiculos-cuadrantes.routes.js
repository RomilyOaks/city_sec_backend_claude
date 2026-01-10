/**
 * ===================================================
 * RUTAS: OperativosVehiculosCuadrantes
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2026-01-09
 *
 * Descripcion:
 * Define las rutas para la gestión de cuadrantes asignados a vehículos operativos.
 *
 * Endpoints:
 * - GET /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes: Obtener todos los cuadrantes de un vehículo operativo.
 * - POST /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes: Asignar un nuevo cuadrante a un vehículo operativo.
 * - PUT /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes/:id: Actualizar la información de un cuadrante en un vehículo operativo.
 * - DELETE /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes/:id: Eliminar la asignación de un cuadrante de un vehículo operativo.
 */

import { Router } from "express";
import { body, param } from "express-validator";
import {
  getAllCuadrantesByVehiculo,
  createCuadranteInVehiculo,
  updateCuadranteInVehiculo,
  deleteCuadranteInVehiculo,
} from "../controllers/operativosVehiculosCuadrantesController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router();

const permisos = {
  read: "operativos.vehiculos.cuadrantes.read",
  create: "operativos.vehiculos.cuadrantes.create",
  update: "operativos.vehiculos.cuadrantes.update",
  delete: "operativos.vehiculos.cuadrantes.delete",
};

// Rutas para OperativosVehiculosCuadrantes
router.get(
  "/:operativoVehiculoId/cuadrantes",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  getAllCuadrantesByVehiculo
);

router.post(
  "/:operativoVehiculoId/cuadrantes",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.create])(req, res, next),
  [
    param("operativoVehiculoId")
      .isInt()
      .withMessage("El ID del vehículo operativo debe ser un número entero."),
    body("cuadrante_id")
      .isInt()
      .withMessage("El ID del cuadrante debe ser un número entero."),
    body("hora_ingreso")
      .isISO8601()
      .withMessage("La hora de ingreso debe ser una fecha y hora válida."),
    body("observaciones")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Las observaciones no deben exceder los 500 caracteres."),
    body("incidentes_reportados")
      .optional()
      .isString()
      .withMessage("Los incidentes reportados deben ser una cadena de texto."),
  ],
  handleValidationErrors,
  registrarAuditoria("Registro de cuadrante en vehículo operativo"),
  createCuadranteInVehiculo
);

router.put(
  "/:operativoVehiculoId/cuadrantes/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  [
    param("operativoVehiculoId")
      .isInt()
      .withMessage("El ID del vehículo operativo debe ser un número entero."),
    param("id")
      .isInt()
      .withMessage("El ID del cuadrante asignado debe ser un número entero."),
    body("cuadrante_id")
      .optional()
      .isInt()
      .withMessage("El ID del cuadrante debe ser un número entero."),
    body("hora_ingreso")
      .optional()
      .isISO8601()
      .withMessage("La hora de ingreso debe ser una fecha y hora válida."),
    body("hora_salida")
      .optional()
      .isISO8601()
      .withMessage("La hora de salida debe ser una fecha y hora válida."),
    body("observaciones")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Las observaciones no deben exceder los 500 caracteres."),
    body("incidentes_reportados")
      .optional()
      .isString()
      .withMessage("Los incidentes reportados deben ser una cadena de texto."),
    body("estado_registro")
      .optional()
      .isInt({ min: 0, max: 1 })
      .withMessage("El estado de registro debe ser 0 o 1."),
  ],
  handleValidationErrors,
  registrarAuditoria("Actualización de cuadrante en vehículo operativo"),
  updateCuadranteInVehiculo
);

router.delete(
  "/:operativoVehiculoId/cuadrantes/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.delete])(req, res, next),
  [
    param("operativoVehiculoId")
      .isInt()
      .withMessage("El ID del vehículo operativo debe ser un número entero."),
    param("id")
      .isInt()
      .withMessage("El ID del cuadrante asignado debe ser un número entero."),
  ],
  handleValidationErrors,
  registrarAuditoria("Eliminación de cuadrante en vehículo operativo"),
  deleteCuadranteInVehiculo
);

export default router;
