/**
 * ===================================================
 * RUTAS: Sectores
 * ===================================================
 *
 * Ruta: src/routes/sectores.routes.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Validaciones centralizadas
 * ✅ Headers profesionales
 * ✅ Imports actualizados
 *
 * Descripción:
 * Define endpoints REST para gestión de sectores territoriales.
 *
 * Endpoints (5):
 * - GET    /sectores - Listar sectores
 * - GET    /sectores/:id - Obtener sector
 * - POST   /sectores - Crear sector
 * - PUT    /sectores/:id - Actualizar sector
 * - DELETE /sectores/:id - Eliminar sector
 *
 * @module routes/sectores
 * @version 2.0.0
 * @date 2025-12-14
 */

import express from "express";
const router = express.Router();
import sectoresController from "../controllers/sectoresController.js";
import {
  verificarToken,
  verificarRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateCreateSector,
  validateUpdateSector,
  validateSectorId,
  validateQuerySectores,
} from "../validators/sector.validator.js";

// GET /sectores
router.get(
  "/",
  verificarToken,
  validateQuerySectores,
  sectoresController.getAllSectores
);

// GET /sectores/:id
router.get(
  "/:id",
  verificarToken,
  validateSectorId,
  sectoresController.getSectorById
);

// POST /sectores
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  validateCreateSector,
  sectoresController.createSector
);

// PUT /sectores/:id
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  validateUpdateSector,
  sectoresController.updateSector
);

// DELETE /sectores/:id
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  validateSectorId,
  sectoresController.deleteSector
);

export default router;
