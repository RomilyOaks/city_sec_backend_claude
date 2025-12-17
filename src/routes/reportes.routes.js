/**
 * ===================================================
 * RUTAS: Reportes operativos
 * ===================================================
 *
 * Ruta: src/routes/reportes.routes.js
 *
 * Endpoints:
 * - GET /api/v1/reportes/vehiculos-en-mantenimiento
 * - GET /api/v1/reportes/costos-mantenimiento
 */

import express from "express";
const router = express.Router();

import reportesController from "../controllers/reportesController.js";

import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

import {
  validateQueryVehiculosEnMantenimiento,
  validateQueryCostosMantenimiento,
} from "../validators/reportes.validator.js";

router.use(verificarToken);

router.get(
  "/vehiculos-en-mantenimiento",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["reportes.vehiculos.read", "reportes.mantenimientos.read"]),
  validateQueryVehiculosEnMantenimiento,
  reportesController.getVehiculosEnMantenimiento
);

router.get(
  "/costos-mantenimiento",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["reportes.vehiculos.read", "reportes.mantenimientos.read"]),
  validateQueryCostosMantenimiento,
  reportesController.getCostosMantenimiento
);

export default router;
