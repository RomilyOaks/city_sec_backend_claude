/**
 * ===================================================
 * RUTAS: Abastecimientos de Combustible
 * ===================================================
 *
 * Ruta: src/routes/abastecimientos.routes.js
 *
 * Descripción:
 * Endpoints REST para gestionar abastecimientos de combustible.
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-17
 *
 * Endpoints:
 * - GET    /api/v1/abastecimientos         - Listar con filtros
 * - GET    /api/v1/abastecimientos/:id     - Obtener por ID
 * - POST   /api/v1/abastecimientos         - Crear
 * - PUT    /api/v1/abastecimientos/:id     - Actualizar (datos complementarios)
 * - DELETE /api/v1/abastecimientos/:id     - Soft delete
 *
 * Nota:
 * - El proyecto maneja soft-delete para todas las tablas.
 * - Además se mantiene compatibilidad con los endpoints existentes en
 *   /vehiculos/:id/abastecimiento(s) (gestionados en vehiculos.routes.js).
 *
 * @module routes/abastecimientos
 */

import express from "express";
const router = express.Router();

import {
  getAbastecimientos,
  getAbastecimientoById,
  createAbastecimiento,
  updateAbastecimiento,
  deleteAbastecimiento,
} from "../controllers/abastecimientosController.js";

import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

import {
  validateCreateAbastecimiento,
  validateQueryAbastecimientos,
  validateAbastecimientoId,
} from "../validators/abastecimiento.validator.js";

import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

// ==========================================
// LISTADO Y CONSULTA
// ==========================================

router.get(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission([
    "vehiculos.abastecimiento.read",
    "vehiculos.abastecimiento.create",
  ]),
  validateQueryAbastecimientos,
  getAbastecimientos
);

router.get(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission([
    "vehiculos.abastecimiento.read",
    "vehiculos.abastecimiento.create",
  ]),
  validateAbastecimientoId,
  getAbastecimientoById
);

// ==========================================
// CREACIÓN
// ==========================================

router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission(["vehiculos.abastecimiento.create"]),
  validateCreateAbastecimiento,
  registrarAuditoria({
    entidad: "AbastecimientoCombustible",
    severidad: "BAJA",
    modulo: "Vehiculos",
  }),
  createAbastecimiento
);

// ==========================================
// ACTUALIZACIÓN
// ==========================================

router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["vehiculos.abastecimiento.update"]),
  validateAbastecimientoId,
  registrarAuditoria({
    entidad: "AbastecimientoCombustible",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  updateAbastecimiento
);

// ==========================================
// ELIMINACIÓN (SOFT DELETE)
// ==========================================

router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["vehiculos.abastecimiento.delete"]),
  validateAbastecimientoId,
  registrarAuditoria({
    entidad: "AbastecimientoCombustible",
    severidad: "ALTA",
    modulo: "Vehiculos",
  }),
  deleteAbastecimiento
);

export default router;
