/**
 * ===================================================
 * RUTAS: Grifos
 * ===================================================
 *
 * Ruta: src/routes/grifos.routes.js
 *
 * Descripción:
 * Rutas para búsqueda de grifos registrados en abastecimientos.
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-04-18
 */

import { Router } from "express";
import { getGrifos, getSugerenciasGrifos } from "../controllers/grifosController.js";

const router = Router();

/**
 * GET /api/v1/grifos
 * Obtener lista de grifos registrados
 */
router.get("/", getGrifos);

/**
 * GET /api/v1/grifos/sugerencias
 * Obtener sugerencias de grifos para autocompletar
 */
router.get("/sugerencias", getSugerenciasGrifos);

export default router;
