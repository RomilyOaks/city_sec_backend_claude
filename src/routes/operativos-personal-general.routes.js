/**
 * ===================================================
 * RUTAS GENERALES: OperativosPersonal
 * ===================================================
 *
 * Ruta: src/routes/operativos-personal-general.routes.js
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @version 2.2.2
 * @date 2026-01-17
 *
 * Descripcion:
 * Define las rutas generales para consultar personal operativo
 * con filtros y paginación, independiente de un turno específico.
 *
 * Endpoints:
 * - GET /operativos-personal - Listar todos con filtros
 */

import { Router } from "express";
import { getAllPersonal } from "../controllers/operativosPersonalController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

const router = Router();

const permisos = {
  leer: "operativos.personal.read",
};

/**
 * GET /operativos-personal
 * Obtener todo el personal operativo con filtros y paginación
 */
router.get(
  "/",
  verificarToken,
  requireAnyPermission([permisos.leer]),
  getAllPersonal
);

export default router;
