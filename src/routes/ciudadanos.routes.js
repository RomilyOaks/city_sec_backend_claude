import express from "express";
import multer from "multer";
import * as ciudadanosAuthController    from "../controllers/ciudadanosAuthController.js";
import * as reportesCiudadanoController from "../controllers/reportesCiudadanoController.js";
import * as playasController            from "../controllers/playasController.js";
import { verificarTokenCiudadano }      from "../middlewares/supabaseAuthMiddleware.js";
import { handleValidationErrors }       from "../middlewares/handleValidationErrors.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../validators/ciudadanosValidator.js";
import {
  validateCrearReporte,
  validateEliminarReporte,
} from "../validators/reportesCiudadanoValidator.js";

const router = express.Router();

const maxFileSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB ?? "5", 10)) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: maxFileSizeBytes },
});

const uploadReporte = upload.fields([
  { name: "foto_1", maxCount: 1 },
  { name: "foto_2", maxCount: 1 },
  { name: "audio",  maxCount: 1 },
]);

// ─── Auth ciudadano ────────────────────────────────────────────────────────────
router.post("/auth/register",
  validateRegister, handleValidationErrors,
  ciudadanosAuthController.register
);
router.post("/auth/login",
  validateLogin, handleValidationErrors,
  ciudadanosAuthController.login
);
router.get("/auth/me",
  verificarTokenCiudadano,
  ciudadanosAuthController.me
);
router.post("/auth/forgot-password",
  validateForgotPassword, handleValidationErrors,
  ciudadanosAuthController.forgotPassword
);
router.post("/auth/reset-password",
  validateResetPassword, handleValidationErrors,
  ciudadanosAuthController.resetPassword
);

// ─── Reportes ciudadano ────────────────────────────────────────────────────────
router.post("/reportes",
  verificarTokenCiudadano,
  uploadReporte,
  validateCrearReporte, handleValidationErrors,
  reportesCiudadanoController.crearReporte
);
router.get("/reportes/mis-reportes",
  verificarTokenCiudadano,
  reportesCiudadanoController.misReportes
);
router.delete("/reportes/:id",
  verificarTokenCiudadano,
  validateEliminarReporte, handleValidationErrors,
  reportesCiudadanoController.eliminarReporte
);

// ─── Catálogos públicos ────────────────────────────────────────────────────────
router.get("/playas", playasController.getPlayas);

export default router;
