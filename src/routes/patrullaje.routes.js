import express from "express";
const router = express.Router();

import { getTurnoActivo } from "../controllers/patrullajeController.js";
import { validateGetTurnoActivo } from "../validators/patrullaje.validator.js";
import { verificarToken, requireAnyPermission } from "../middlewares/authMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

/**
 * GET /api/v1/patrullaje/turno-activo
 *
 * Devuelve el turno activo del sereno autenticado junto con su vehículo
 * y cuadrante asignados. Si no hay turno activo o no hay asignación,
 * responde { success: true, data: null }.
 *
 * Requiere permiso: patrullaje.sereno.read
 */
router.get(
  "/turno-activo",
  verificarToken,
  requireAnyPermission(["patrullaje.sereno.read"]),
  validateGetTurnoActivo,
  handleValidationErrors,
  getTurnoActivo
);

export default router;
