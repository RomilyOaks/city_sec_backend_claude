/**
 * ===================================================
 * RUTAS: OperativosVehiculos
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2024-07-12
 *
 * Descripcion:
 * Define las rutas para el CRUD de vehículos asignados a turnos operativos.
 *
 * Endpoints:
 * - GET /:turnoId/vehiculos
 * - POST /:turnoId/vehiculos
 * - PUT /:turnoId/vehiculos/:id
 * - DELETE /:turnoId/vehiculos/:id
 */

import { Router } from "express";
import {
  getAllVehiculosByTurno,
  createVehiculoInTurno,
  updateVehiculoInTurno,
  deleteVehiculoInTurno,
  getCuadrantesByVehiculoAsignado,
  createCuadranteForVehiculo,
  updateCuadranteForVehiculo,
  deleteCuadranteForVehiculo,
  getNovedadesByCuadrante,
} from "../controllers/operativosVehiculosController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router({ mergeParams: true });

const permisos = {
  leer: "operativos.vehiculos.read",
  crear: "operativos.vehiculos.create",
  actualizar: "operativos.vehiculos.update",
  eliminar: "operativos.vehiculos.delete",
};

// Validaciones para la creación
const validateVehiculoData = [
  body("vehiculo_id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),
  body("conductor_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("ID de conductor inválido"),
  body("kilometraje_inicio")
    .isInt({ min: 0 })
    .withMessage("Kilometraje de inicio inválido"),
  body("hora_inicio")
    .isISO8601()
    .withMessage("Formato de hora de inicio inválido"),
  body("estado_operativo_id")
    .isInt({ min: 1 })
    .withMessage("ID de estado operativo inválido"),
];

// Validaciones para la actualización
const validateUpdateVehiculoData = [
  body("kilometraje_fin")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Kilometraje de fin inválido"),
  body("hora_fin")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Formato de hora de fin inválido"),
  // Agrega aquí otras validaciones para campos actualizables
];

router.get(
  "/",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  getAllVehiculosByTurno
);

router.post(
  "/",
  verificarToken,
  requireAnyPermission([permisos.crear]),
  validateVehiculoData,
  handleValidationErrors,
  registrarAuditoria(permisos.crear),
  createVehiculoInTurno
);

router.put(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.actualizar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  validateUpdateVehiculoData,
  handleValidationErrors,
  registrarAuditoria(permisos.actualizar),
  updateVehiculoInTurno
);

router.delete(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.eliminar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  handleValidationErrors,
  registrarAuditoria(permisos.eliminar),
  deleteVehiculoInTurno
);

router.get(
  "/:id/cuadrantes",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  handleValidationErrors,
  getCuadrantesByVehiculoAsignado
);

// Validaciones para la asignación de cuadrante
const validateCuadranteData = [
  body("cuadrante_id")
    .isInt({ min: 1 })
    .withMessage("ID de cuadrante inválido"),
  body("hora_ingreso")
    .isISO8601()
    .withMessage("Formato de hora de ingreso inválido"),
];

router.post(
  "/:id/cuadrantes",
  verificarToken,
  requireAnyPermission([permisos.crear]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  validateCuadranteData,
  handleValidationErrors,
  registrarAuditoria(permisos.crear),
  createCuadranteForVehiculo
);

// Validaciones para la actualización de cuadrante
const validateUpdateCuadranteData = [
  body("hora_salida")
    .isISO8601()
    .withMessage("Formato de hora de salida inválido"),
];

router.put(
  "/:id/cuadrantes/:cuadranteId",
  verificarToken,
  requireAnyPermission([permisos.actualizar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  param("cuadranteId")
    .isInt({ min: 1 })
    .withMessage("ID de asignación de cuadrante inválido"),
  validateUpdateCuadranteData,
  handleValidationErrors,
  registrarAuditoria(permisos.actualizar),
  updateCuadranteForVehiculo
);

router.delete(
  "/:id/cuadrantes/:cuadranteId",
  verificarToken,
  requireAnyPermission([permisos.eliminar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  param("cuadranteId")
    .isInt({ min: 1 })
    .withMessage("ID de asignación de cuadrante inválido"),
  handleValidationErrors,
  registrarAuditoria(permisos.eliminar),
  deleteCuadranteForVehiculo
);

router.get(
  "/:id/cuadrantes/:cuadranteId/novedades",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de asignación de vehículo inválido"),
  param("cuadranteId")
    .isInt({ min: 1 })
    .withMessage("ID de asignación de cuadrante inválido"),
  handleValidationErrors,
  getNovedadesByCuadrante
);

export default router;
