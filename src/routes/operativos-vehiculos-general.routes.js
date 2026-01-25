/**
 * ===================================================
 * RUTAS GENERALES: OperativosVehiculos
 * ===================================================
 *
 * @version 1.0.0
 * @date 2026-01-11
 *
 * Descripcion:
 * Define las rutas generales para consultar vehículos operativos
 * con filtros y paginación, independiente de un turno específico.
 *
 * Endpoints:
 * - GET /operativos-vehiculos - Listar todos con filtros
 * - GET /operativos-vehiculos/:id - Obtener vehículo por ID
 */

import { Router } from "express";
import { getAllVehiculos, getVehiculoByIdGeneral } from "../controllers/operativosVehiculosController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { param } from "express-validator";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router();

const permisos = {
  leer: "operativos.vehiculos.read",
};

/**
 * GET /operativos-vehiculos
 * Obtener todos los vehículos operativos con filtros y paginación
 */
router.get(
  "/",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  getAllVehiculos
);

/**
 * GET /operativos-vehiculos/:id
 * Obtener un vehículo operativo por ID con datos completos
 */
router.get(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),
  handleValidationErrors,
  getVehiculoByIdGeneral
);

export default router;
