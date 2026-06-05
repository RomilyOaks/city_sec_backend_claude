import express from "express";
const router = express.Router();

import { analizarComprobante } from "../controllers/visionController.js";
import { validateAnalizarComprobante } from "../validators/vision.validator.js";
import { verificarToken, verificarRolesOPermisos } from "../middlewares/authMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

/**
 * POST /api/v1/vision/analizar
 *
 * Proxy OCR: recibe imagen en base64, la envía a Anthropic y devuelve
 * los datos del comprobante de combustible estructurados en JSON.
 *
 * Requiere permiso: vehiculos.combustible.ocr
 * Body: { imageBase64: string, mediaType: string }
 */
router.post(
  "/analizar",
  verificarToken,
  verificarRolesOPermisos(
    ["supervisor", "operador"],
    ["vehiculos.combustible.ocr"]
  ),
  validateAnalizarComprobante,
  handleValidationErrors,
  analizarComprobante
);

export default router;
