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
  verificarRolesOPermisos,
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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.sectores.read"]),
  validateQuerySectores,
  sectoresController.getAllSectores
);

// GET /sectores/:id
router.get(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["sectores.sectores.read"]),
  validateSectorId,
  sectoresController.getSectorById
);

// POST /sectores
router.post(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["sectores.sectores.create"]),
  validateCreateSector,
  sectoresController.createSector
);

// PUT /sectores/:id
router.put(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["sectores.sectores.update"]),
  validateUpdateSector,
  sectoresController.updateSector
);

// DELETE /sectores/:id
router.delete(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin"], ["sectores.sectores.delete"]),
  validateSectorId,
  sectoresController.deleteSector
);

export default router;
