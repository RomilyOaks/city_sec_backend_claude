/**
 * ===================================================
 * RUTAS: Operativos Combinados
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2026-03-16
 *
 * Descripcion:
 * Define las rutas para la consulta combinada de operativos
 * de vehículos y personal para una misma novedad.
 *
 * Endpoints:
 * - GET /api/v1/operativos/novedades/:novedadId/combinadas: Obtener ambos operativos para una novedad
 */

import { Router } from "express";
import { param } from "express-validator";
import {
  getOperativosCombinadosPorNovedad,
} from "../controllers/operativosCombinadosController.js";
import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router();

const permisos = {
  read: "operativos.combinados.read",
};

// Obtener operativos combinados para una novedad específica
router.get(
  "/novedades/:novedadId/combinadas",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], [permisos.read]),
  [
    param("novedadId")
      .isInt({ min: 1 })
      .withMessage("El ID de la novedad debe ser un número entero positivo."),
  ],
  handleValidationErrors,
  getOperativosCombinadosPorNovedad
);

export default router;
