/**
 * ===================================================
 * RUTAS: Configuración del Sistema
 * ===================================================
 * Ruta: src/routes/config.routes.js
 *
 * Endpoints públicos para obtener configuración
 */

import express from "express";
import { getConfig, getDefaultUbigeo } from "../controllers/configController.js";

const router = express.Router();

/**
 * @route   GET /api/v1/config
 * @desc    Obtener configuración general del sistema
 * @access  Público
 */
router.get("/", getConfig);

/**
 * @route   GET /api/v1/config/ubigeo-default
 * @desc    Obtener ubigeo por defecto
 * @access  Público
 */
router.get("/ubigeo-default", getDefaultUbigeo);

export default router;
