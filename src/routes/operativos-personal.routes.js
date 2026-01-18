/**
 * ===================================================
 * RUTAS: OperativosPersonal
 * ===================================================
 *
 * Ruta: src/routes/operativos-personal.routes.js
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @version 2.2.2
 * @date 2026-01-17
 *
 * Descripcion:
 * Define las rutas para el CRUD de personal asignado a patrullaje a pie
 * en turnos operativos.
 *
 * Endpoints Personal:
 * - GET /:turnoId/personal - Obtener todo el personal de un turno
 * - GET /:turnoId/personal/:id - Obtener un registro específico
 * - POST /:turnoId/personal - Asignar personal a un turno
 * - PUT /personal/:id - Actualizar asignación
 * - DELETE /personal/:id - Eliminar asignación
 *
 * Endpoints Cuadrantes:
 * - GET /personal/:id/cuadrantes - Obtener cuadrantes del personal
 * - POST /personal/:id/cuadrantes - Asignar cuadrante
 * - PUT /personal/:id/cuadrantes/:cuadranteId - Actualizar cuadrante
 * - DELETE /personal/:id/cuadrantes/:cuadranteId - Eliminar cuadrante
 */

import { Router } from "express";
import {
  getAllPersonalByTurno,
  getPersonalById,
  createPersonalInTurno,
  updatePersonalInTurno,
  deletePersonalInTurno,
  getCuadrantesByPersonalAsignado,
  createCuadranteForPersonal,
  updateCuadranteForPersonal,
  deleteCuadranteForPersonal,
} from "../controllers/operativosPersonalController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router({ mergeParams: true });

// Permisos para Personal Operativo (CRUD del personal asignado al turno)
const permisosPersonal = {
  leer: "operativos.personal.read",
  crear: "operativos.personal.create",
  actualizar: "operativos.personal.update",
  eliminar: "operativos.personal.delete",
};

// Permisos para Cuadrantes del Personal (CRUD de cuadrantes asignados al personal)
const permisosCuadrantes = {
  leer: "operativos.personal.cuadrantes.read",
  crear: "operativos.personal.cuadrantes.create",
  actualizar: "operativos.personal.cuadrantes.update",
  eliminar: "operativos.personal.cuadrantes.delete",
};

// Validaciones para la creación de personal operativo
const validatePersonalData = [
  body("personal_id").isInt({ min: 1 }).withMessage("ID de personal inválido"),
  body("tipo_patrullaje")
    .optional()
    .isIn(["SERENAZGO", "PPFF", "GUARDIA", "VIGILANTE", "OTRO"])
    .withMessage("Tipo de patrullaje debe ser: SERENAZGO, PPFF, GUARDIA, VIGILANTE u OTRO"),
  body("sereno_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("ID de sereno/compañero inválido"),
  body("radio_tetra_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("ID de radio TETRA inválido"),
  body("hora_inicio")
    .isISO8601()
    .withMessage("Formato de hora de inicio inválido"),
  body("estado_operativo_id")
    .isInt({ min: 1 })
    .withMessage("ID de estado operativo inválido"),
  body("chaleco_balistico")
    .optional()
    .isBoolean()
    .withMessage("Chaleco balístico debe ser booleano"),
  body("porra_policial")
    .optional()
    .isBoolean()
    .withMessage("Porra policial debe ser booleano"),
  body("esposas")
    .optional()
    .isBoolean()
    .withMessage("Esposas debe ser booleano"),
  body("linterna")
    .optional()
    .isBoolean()
    .withMessage("Linterna debe ser booleano"),
  body("kit_primeros_auxilios")
    .optional()
    .isBoolean()
    .withMessage("Kit de primeros auxilios debe ser booleano"),
];

// Validaciones para la actualización
const validateUpdatePersonalData = [
  body("hora_fin")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Formato de hora de fin inválido"),
  body("tipo_patrullaje")
    .optional()
    .isIn(["SERENAZGO", "PPFF", "GUARDIA", "VIGILANTE", "OTRO"])
    .withMessage("Tipo de patrullaje debe ser: SERENAZGO, PPFF, GUARDIA, VIGILANTE u OTRO"),
  body("observaciones")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage("Las observaciones no deben exceder los 500 caracteres"),
];

// ============================================================
// RUTAS DE PERSONAL OPERATIVO
// ============================================================

// Obtener todo el personal de un turno
router.get(
  "/",
  verificarToken,
  requireAnyPermission([permisosPersonal.leer]),
  getAllPersonalByTurno
);

// Obtener un registro específico de personal
router.get(
  "/:id",
  verificarToken,
  requireAnyPermission([permisosPersonal.leer]),
  param("id").isInt({ min: 1 }).withMessage("ID de personal inválido"),
  handleValidationErrors,
  getPersonalById
);

// Crear nueva asignación de personal
router.post(
  "/",
  verificarToken,
  requireAnyPermission([permisosPersonal.crear]),
  validatePersonalData,
  handleValidationErrors,
  registrarAuditoria(permisosPersonal.crear),
  createPersonalInTurno
);

// Actualizar asignación de personal
router.put(
  "/:id",
  verificarToken,
  requireAnyPermission([permisosPersonal.actualizar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  validateUpdatePersonalData,
  handleValidationErrors,
  registrarAuditoria(permisosPersonal.actualizar),
  updatePersonalInTurno
);

// Eliminar asignación de personal
router.delete(
  "/:id",
  verificarToken,
  requireAnyPermission([permisosPersonal.eliminar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  handleValidationErrors,
  registrarAuditoria(permisosPersonal.eliminar),
  deletePersonalInTurno
);

// ============================================================
// RUTAS DE CUADRANTES DEL PERSONAL
// ============================================================

// Obtener cuadrantes asignados a un personal
router.get(
  "/:id/cuadrantes",
  verificarToken,
  requireAnyPermission([permisosCuadrantes.leer]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  handleValidationErrors,
  getCuadrantesByPersonalAsignado
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

// Asignar cuadrante a un personal
router.post(
  "/:id/cuadrantes",
  verificarToken,
  requireAnyPermission([permisosCuadrantes.crear]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  validateCuadranteData,
  handleValidationErrors,
  registrarAuditoria(permisosCuadrantes.crear),
  createCuadranteForPersonal
);

// Validaciones para la actualización de cuadrante
const validateUpdateCuadranteData = [
  body("hora_salida")
    .optional()
    .isISO8601()
    .withMessage("Formato de hora de salida inválido"),
  body("observaciones")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage("Las observaciones no deben exceder los 500 caracteres"),
  body("incidentes_reportados")
    .optional({ nullable: true })
    .isString()
    .withMessage("Los incidentes reportados deben ser texto"),
];

// Actualizar asignación de cuadrante
router.put(
  "/:id/cuadrantes/:cuadranteId",
  verificarToken,
  requireAnyPermission([permisosCuadrantes.actualizar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  param("cuadranteId")
    .isInt({ min: 1 })
    .withMessage("ID de asignación de cuadrante inválido"),
  validateUpdateCuadranteData,
  handleValidationErrors,
  registrarAuditoria(permisosCuadrantes.actualizar),
  updateCuadranteForPersonal
);

// Eliminar asignación de cuadrante
router.delete(
  "/:id/cuadrantes/:cuadranteId",
  verificarToken,
  requireAnyPermission([permisosCuadrantes.eliminar]),
  param("id").isInt({ min: 1 }).withMessage("ID de asignación inválido"),
  param("cuadranteId")
    .isInt({ min: 1 })
    .withMessage("ID de asignación de cuadrante inválido"),
  handleValidationErrors,
  registrarAuditoria(permisosCuadrantes.eliminar),
  deleteCuadranteForPersonal
);

export default router;
