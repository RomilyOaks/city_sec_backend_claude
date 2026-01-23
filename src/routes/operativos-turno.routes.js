/**
 * ===================================================
 * RUTAS: OperativosTurno
 * ===================================================
 *
 * Ruta: src/routes/operativos-turno.routes.js
 *
 * Descripción: Define las rutas para el CRUD de turnos de operativos.
 *
 * @version 1.0.0
 * @date 2026-01-09
 */

import express from "express";
const router = express.Router();

import * as turnosController from "../controllers/operativosTurnoController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { body, param, validationResult } from "express-validator";
import { Op } from "sequelize";
import { Sector, PersonalSeguridad } from "../models/index.js";

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

const validateTurno = [
  body("operador_id").isInt().withMessage("El ID del operador es requerido."),
  body("operador_id").custom(async (operador_id) => {
    const operador = await PersonalSeguridad.findByPk(operador_id);
    if (!operador) {
      throw new Error(`El operador con ID ${operador_id} no existe.`);
    }
    return true;
  }),
  body("supervisor_id")
    .optional()
    .isInt()
    .withMessage("El ID del supervisor debe ser un número entero."),
  body("supervisor_id").custom(async (supervisor_id, { req }) => {
    if (supervisor_id) {
      const supervisor = await PersonalSeguridad.findByPk(supervisor_id);
      if (!supervisor) {
        throw new Error(`El supervisor con ID ${supervisor_id} no existe.`);
      }
    }
    return true;
  }),
  body("sector_id").isInt().withMessage("El ID del sector es requerido."),
  body("fecha").isISO8601().withMessage("La fecha es requerida."),
  body("fecha_hora_inicio")
    .isISO8601()
    .withMessage("La fecha y hora de inicio son requeridas."),
  body("fecha_hora_fin")
    .optional()
    .isISO8601()
    .withMessage("El formato de la fecha y hora de fin no es válido."),
  body("estado")
    .optional()
    .isIn(["ACTIVO", "CERRADO", "ANULADO"])
    .withMessage("El estado debe ser uno de: ACTIVO, CERRADO, ANULADO."),
  body("observaciones").optional().isString(),
  
  // Validación personalizada: asegurar que el sector tenga supervisor si no se proporciona supervisor_id
  body("sector_id").custom(async (sector_id, { req }) => {
    if (!req.body.supervisor_id) {
      const sector = await Sector.findByPk(sector_id, {
        attributes: ['supervisor_id']
      });
      
      if (!sector) {
        throw new Error("El sector especificado no existe.");
      }
      
      if (!sector.supervisor_id) {
        throw new Error("El sector no tiene un supervisor asignado. Debe proporcionar un supervisor_id o asignar un supervisor al sector.");
      }
    }
    return true;
  }),
];

const validateUpdateTurno = [
  body("operador_id")
    .optional()
    .isInt()
    .withMessage("El ID del operador debe ser un número entero."),
  body("supervisor_id")
    .optional()
    .isInt()
    .withMessage("El ID del supervisor debe ser un número entero."),
  body("sector_id")
    .optional()
    .isInt()
    .withMessage("El ID del sector debe ser un número entero."),
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe tener un formato válido."),
  body("fecha_hora_inicio")
    .optional()
    .isISO8601()
    .withMessage("La fecha y hora de inicio deben tener un formato válido."),
  body("fecha_hora_fin")
    .optional()
    .isISO8601()
    .withMessage("El formato de la fecha y hora de fin no es válido."),
  body("estado")
    .optional()
    .isIn(["ACTIVO", "CERRADO", "ANULADO"])
    .withMessage("El estado no es válido."),
  body("observaciones").optional().isString(),
];

// ==========================================
// RUTAS
// ==========================================

router.get(
  "/",
  verificarToken,
  requireAnyPermission(["operativos.turnos.read"]),
  turnosController.getAllTurnos
);

router.get(
  "/:id",
  verificarToken,
  requireAnyPermission(["operativos.turnos.read"]),
  param("id").isInt().withMessage("El ID debe ser un número entero."),
  handleValidationErrors,
  turnosController.getTurnoById
);

router.post(
  "/",
  verificarToken,
  requireAnyPermission(["operativos.turnos.create"]),
  validateTurno,
  handleValidationErrors,
  registrarAuditoria("Creación de turno"),
  turnosController.createTurno
);

router.put(
  "/:id",
  verificarToken,
  requireAnyPermission(["operativos.turnos.update"]),
  param("id").isInt().withMessage("El ID debe ser un número entero."),
  validateUpdateTurno,
  handleValidationErrors,
  registrarAuditoria("Actualización de turno"),
  turnosController.updateTurno
);

router.delete(
  "/:id",
  verificarToken,
  requireAnyPermission(["operativos.turnos.delete"]),
  param("id").isInt().withMessage("El ID debe ser un número entero."),
  handleValidationErrors,
  registrarAuditoria("Eliminación de turno"),
  turnosController.deleteTurno
);

import operativosVehiculosRoutes from "./operativos-vehiculos.routes.js";

// ... (código existente)

// Anidar las rutas de vehículos
router.use("/:turnoId/vehiculos", operativosVehiculosRoutes);

export default router;
