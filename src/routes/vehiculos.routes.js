/**
 * ============================================
 * RUTAS: src/routes/vehiculos.routes.js
 * ============================================
 *
 * Rutas de Vehículos
 * Define los endpoints REST para gestión de vehículos con control RBAC
 */

import express from "express";
const router = express.Router();
import vehiculosController from "../controllers/vehiculosController.js";
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
  ROLES,
} from "../middlewares/authMiddleware.js";

/**
 * @route   GET /api/vehiculos/disponibles
 * @desc    Obtener vehículos disponibles (no asignados a novedades activas)
 * @access  Operador, Supervisor, Administrador
 */
router.get(
  "/disponibles",
  verificarToken,
  verificarRoles([ROLES.OPERADOR, ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  vehiculosController.getVehiculosDisponibles
);

/**
 * @route   GET /api/vehiculos
 * @desc    Obtener todos los vehículos con filtros opcionales
 * @access  Todos los usuarios autenticados
 * @query   tipo_id, estado, search
 */
router.get("/", verificarToken, vehiculosController.getAllVehiculos);

/**
 * @route   GET /api/vehiculos/:id
 * @desc    Obtener un vehículo específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get("/:id", verificarToken, vehiculosController.getVehiculoById);

/**
 * @route   POST /api/vehiculos
 * @desc    Crear un nuevo vehículo
 * @access  Supervisor, Administrador
 * @body    tipo_id, placa, marca, nombre, etc.
 */
router.post(
  "/",
  verificarToken,
  verificarRoles([ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  requireAnyPermission(["vehiculos.vehiculos.create"]),
  vehiculosController.createVehiculo
);

/**
 * @route   PUT /api/vehiculos/:id
 * @desc    Actualizar un vehículo existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles([ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  requireAnyPermission(["vehiculos.vehiculos.update"]),
  vehiculosController.updateVehiculo
);

/**
 * @route   DELETE /api/vehiculos/:id
 * @desc    Eliminar un vehículo (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  requireAnyPermission(["vehiculos.vehiculos.delete"]),
  vehiculosController.deleteVehiculo
);

/**
 * @route   POST /api/vehiculos/:id/abastecimiento
 * @desc    Registrar abastecimiento de combustible
 * @access  Operador, Supervisor, Administrador
 * @body    fecha_hora, tipo_combustible, cantidad, km_llegada, etc.
 */
router.post(
  "/:id/abastecimiento",
  verificarToken,
  verificarRoles([ROLES.OPERADOR, ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  vehiculosController.registrarAbastecimiento
);

/**
 * @route   GET /api/vehiculos/:id/abastecimientos
 * @desc    Obtener historial de abastecimientos de un vehículo
 * @access  Todos los usuarios autenticados
 * @query   fecha_inicio, fecha_fin, limit
 */
router.get(
  "/:id/abastecimientos",
  verificarToken,
  vehiculosController.getHistorialAbastecimientos
);

export default router;
