/**
 * Ruta: src/routes/ubigeoRoutes.js
 * Descripción: Rutas para gestión de ubigeos
 */

import express from "express";
import { getUbigeos, getUbigeoByCode } from "../controllers/ubigeoController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas protegidas
router.get("/", authenticateToken, getUbigeos);
router.get("/:code", authenticateToken, getUbigeoByCode);

export default router;
