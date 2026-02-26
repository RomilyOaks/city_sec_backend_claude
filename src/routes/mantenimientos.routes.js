/**
 * ===================================================
 * RUTAS: Mantenimientos de Vehículos
 * ===================================================
 *
 * Ruta: src/routes/mantenimientos.routes.js
 *
 * Endpoints:
 * - GET    /api/v1/mantenimientos           - Listar con filtros
 * - GET    /api/v1/mantenimientos/:id       - Obtener por ID
 * - POST   /api/v1/mantenimientos           - Crear
 * - PUT    /api/v1/mantenimientos/:id       - Actualizar
 * - PATCH  /api/v1/mantenimientos/:id/estado- Cambiar estado (inmoviliza/libera vehículo)
 * - DELETE /api/v1/mantenimientos/:id       - Soft delete
 */

import express from "express";
const router = express.Router();

import {
  getMantenimientos,
  getMantenimientoById,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
  cambiarEstadoMantenimiento,
} from "../controllers/mantenimientosController.js";

import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

import {
  validateQueryMantenimientos,
  validateMantenimientoId,
  validateCreateMantenimiento,
  validateUpdateMantenimiento,
  validateCambiarEstadoMantenimiento,
} from "../validators/mantenimiento.validator.js";

import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

router.get(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], [
    "vehiculos.mantenimientos.read",
    "vehiculos.mantenimientos.create",
  ]),
  validateQueryMantenimientos,
  getMantenimientos
);

router.get(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], [
    "vehiculos.mantenimientos.read",
    "vehiculos.mantenimientos.create",
  ]),
  validateMantenimientoId,
  getMantenimientoById
);

router.post(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], ["vehiculos.mantenimientos.create"]),
  validateCreateMantenimiento,
  registrarAuditoria({
    entidad: "MantenimientoVehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  createMantenimiento
);

router.put(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["vehiculos.mantenimientos.update"]),
  validateUpdateMantenimiento,
  registrarAuditoria({
    entidad: "MantenimientoVehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  updateMantenimiento
);

router.patch(
  "/:id/estado",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador"], ["vehiculos.mantenimientos.update"]),
  validateCambiarEstadoMantenimiento,
  registrarAuditoria({
    entidad: "MantenimientoVehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  cambiarEstadoMantenimiento
);

router.delete(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin"], ["vehiculos.mantenimientos.delete"]),
  validateMantenimientoId,
  registrarAuditoria({
    entidad: "MantenimientoVehiculo",
    severidad: "ALTA",
    modulo: "Vehiculos",
  }),
  deleteMantenimiento
);

export default router;
