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
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

import {
  validateQueryVehiculosEnMantenimiento,
  validateQueryCostosMantenimiento,
} from "../validators/reportes.validator.js";

router.use(verificarToken);

router.get(
  "/vehiculos-en-mantenimiento",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["reportes.vehiculos.read", "reportes.mantenimientos.read"]),
  validateQueryVehiculosEnMantenimiento,
  reportesController.getVehiculosEnMantenimiento
);

router.get(
  "/costos-mantenimiento",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["reportes.vehiculos.read", "reportes.mantenimientos.read"]),
  validateQueryCostosMantenimiento,
  reportesController.getCostosMantenimiento
);

export default router;
