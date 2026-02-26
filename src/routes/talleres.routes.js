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
  verificarRolesOPermisos,
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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], ["vehiculos.talleres.read", "vehiculos.mantenimientos.create"]),
  validateQueryTalleres,
  talleresController.getAllTalleres
);

router.get(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], ["vehiculos.talleres.read", "vehiculos.mantenimientos.create"]),
  validateTallerId,
  talleresController.getTallerById
);

router.post(
  "/",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["vehiculos.talleres.create"]),
  validateCreateTaller,
  registrarAuditoria({ entidad: "Taller", severidad: "MEDIA", modulo: "Vehiculos" }),
  talleresController.createTaller
);

router.put(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["vehiculos.talleres.update"]),
  validateUpdateTaller,
  registrarAuditoria({ entidad: "Taller", severidad: "MEDIA", modulo: "Vehiculos" }),
  talleresController.updateTaller
);

router.delete(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin"], ["vehiculos.talleres.delete"]),
  validateTallerId,
  registrarAuditoria({ entidad: "Taller", severidad: "ALTA", modulo: "Vehiculos" }),
  talleresController.deleteTaller
);

export default router;
