/**
 * ===================================================
 * RUTAS: Talleres
 * ===================================================
 *
 * Ruta: src/routes/talleres.routes.js
 *
 * Endpoints:
 * - GET    /api/v1/talleres
 * - GET    /api/v1/talleres/:id
 * - POST   /api/v1/talleres
 * - PUT    /api/v1/talleres/:id
 * - DELETE /api/v1/talleres/:id (soft delete)
 */

import express from "express";
const router = express.Router();

import talleresController from "../controllers/talleresController.js";

import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

import {
  validateTallerId,
  validateQueryTalleres,
  validateCreateTaller,
  validateUpdateTaller,
} from "../validators/talleres.validator.js";

import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

router.use(verificarToken);

router.get(
  "/",
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission(["vehiculos.talleres.read", "vehiculos.mantenimientos.create"]),
  validateQueryTalleres,
  talleresController.getAllTalleres
);

router.get(
  "/:id",
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission(["vehiculos.talleres.read", "vehiculos.mantenimientos.create"]),
  validateTallerId,
  talleresController.getTallerById
);

router.post(
  "/",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["vehiculos.talleres.create"]),
  validateCreateTaller,
  registrarAuditoria({ entidad: "Taller", severidad: "MEDIA", modulo: "Vehiculos" }),
  talleresController.createTaller
);

router.put(
  "/:id",
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["vehiculos.talleres.update"]),
  validateUpdateTaller,
  registrarAuditoria({ entidad: "Taller", severidad: "MEDIA", modulo: "Vehiculos" }),
  talleresController.updateTaller
);

router.delete(
  "/:id",
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["vehiculos.talleres.delete"]),
  validateTallerId,
  registrarAuditoria({ entidad: "Taller", severidad: "ALTA", modulo: "Vehiculos" }),
  talleresController.deleteTaller
);

export default router;
