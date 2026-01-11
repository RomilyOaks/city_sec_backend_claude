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
 */

import { Router } from "express";
import { getAllVehiculos } from "../controllers/operativosVehiculosController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

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

export default router;
