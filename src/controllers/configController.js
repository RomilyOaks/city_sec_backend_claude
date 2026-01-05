/**
 * ===================================================
 * CONTROLADOR: Configuración del Sistema
 * ===================================================
 * Ruta: src/controllers/configController.js
 *
 * Endpoints para obtener configuración del sistema
 * (valores por defecto, constantes, etc.)
 */

import { DEFAULT_UBIGEO_CODE, DEFAULT_UBIGEO_INFO } from "../config/constants.js";

/**
 * Obtener configuración general del sistema
 * GET /api/v1/config
 */
export const getConfig = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        ubigeo_default: DEFAULT_UBIGEO_INFO,
        app_name: "City Sec Backend",
        version: "1.0.0"
      }
    });
  } catch (error) {
    console.error("❌ Error en getConfig:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener configuración",
      error: error.message
    });
  }
};

/**
 * Obtener solo el ubigeo por defecto
 * GET /api/v1/config/ubigeo-default
 */
export const getDefaultUbigeo = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: DEFAULT_UBIGEO_INFO
    });
  } catch (error) {
    console.error("❌ Error en getDefaultUbigeo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ubigeo por defecto",
      error: error.message
    });
  }
};

export default {
  getConfig,
  getDefaultUbigeo
};
