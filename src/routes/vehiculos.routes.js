/**
 * ===================================================
 * RUTAS: Vehículos
 * ===================================================
 *
 * Ruta: src/routes/vehiculos.routes.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Imports actualizados a validators/vehiculo.validator.js
 * ✅ Validaciones centralizadas (sin inline)
 * ✅ Headers con versionado
 * ✅ Documentación completa
 *
 * Descripción:
 * Define los endpoints REST para gestión de vehículos con control RBAC.
 * Todos los nombres de campos corregidos según schema de BD.
 *
 * Endpoints Disponibles (13):
 *
 * Consultas:
 * - GET    /vehiculos/stats - Estadísticas
 * - GET    /vehiculos/disponibles - Vehículos disponibles
 * - GET    /vehiculos - Listar con filtros
 * - GET    /vehiculos/:id - Obtener uno
 *
 * CRUD:
 * - POST   /vehiculos - Crear vehículo
 * - PUT    /vehiculos/:id - Actualizar
 * - DELETE /vehiculos/:id - Eliminar (soft)
 *
 * Operaciones:
 * - PATCH  /vehiculos/:id/kilometraje - Actualizar KM
 * - PATCH  /vehiculos/:id/estado - Cambiar estado
 *
 * Historial:
 * - GET    /vehiculos/:id/historial - Historial de novedades
 * - GET    /vehiculos/:id/abastecimientos - Historial combustible
 * - POST   /vehiculos/:id/abastecimiento - Registrar carga
 *
 * Permisos Requeridos:
 * - Lectura: operador, supervisor, admin
 * - Escritura: supervisor, admin
 * - Eliminación: admin
 *
 * @module routes/vehiculos
 * @requires express
 * @version 2.0.0
 * @date 2025-12-14
 */

import express from "express";
const router = express.Router();

// ==========================================
// IMPORTAR CONTROLADOR
// ==========================================
import * as vehiculosController from "../controllers/vehiculosController.js";

// ==========================================
// IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
// ==========================================
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// ==========================================
// IMPORTAR VALIDADORES CENTRALIZADOS ✅
// ==========================================
import {
  validateCreateVehiculo,
  validateUpdateVehiculo,
  validateActualizarKilometraje,
  validateCambiarEstado,
  validateRegistrarAbastecimiento,
  validateVehiculoId,
  validateQueryParams,
} from "../validators/vehiculo.validator.js";

// ==========================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ==========================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

// ==========================================
// RUTAS ESPECIALES (ANTES DE /:id)
// ==========================================

/**
 * @route   GET /api/v1/vehiculos/stats
 * @desc    Obtener estadísticas de vehículos
 * @access  Todos los usuarios autenticados
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get(
  "/stats",
  verificarToken,
  vehiculosController.getEstadisticasVehiculos
);

/**
 * @route   GET /api/v1/vehiculos/disponibles
 * @desc    Obtener vehículos disponibles (no asignados a novedades activas)
 * @access  Operador, Supervisor, Administrador
 * @query   tipo_id (opcional)
 */
router.get(
  "/disponibles",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  vehiculosController.getVehiculosDisponibles
);

// ==========================================
// RUTAS CRUD PRINCIPALES
// ==========================================

/**
 * @route   GET /api/v1/vehiculos
 * @desc    Obtener todos los vehículos con filtros opcionales
 * @access  Todos los usuarios autenticados
 * @query   tipo_id, estado_operativo, unidad_id, search, page, limit
 */
router.get(
  "/",
  verificarToken,
  validateQueryParams,
  vehiculosController.getAllVehiculos
);

/**
 * @route   GET /api/v1/vehiculos/:id/historial
 * @desc    Obtener historial de uso del vehículo (novedades)
 * @access  Todos los usuarios autenticados
 * @query   limit (opcional)
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get(
  "/:id/historial",
  verificarToken,
  validateVehiculoId,
  vehiculosController.getHistorialVehiculo
);

/**
 * @route   GET /api/v1/vehiculos/:id/abastecimientos
 * @desc    Obtener historial de abastecimientos de un vehículo
 * @access  Todos los usuarios autenticados
 * @query   fecha_inicio, fecha_fin, limit (opcionales)
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get(
  "/:id/abastecimientos",
  verificarToken,
  validateVehiculoId,
  vehiculosController.getHistorialAbastecimientos
);

/**
 * @route   GET /api/v1/vehiculos/:id
 * @desc    Obtener un vehículo específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  verificarToken,
  validateVehiculoId,
  vehiculosController.getVehiculoById
);

/**
 * @route   POST /api/v1/vehiculos
 * @desc    Crear un nuevo vehículo
 * @access  Supervisor, Administrador
 * @body    tipo_id, placa, unidad_oficina_id (requeridos)
 *          marca, modelo_vehiculo, anio_vehiculo, color_vehiculo, etc (opcionales)
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["vehiculos.vehiculos.create"]),
  validateCreateVehiculo,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  vehiculosController.createVehiculo
);

/**
 * @route   PUT /api/v1/vehiculos/:id
 * @desc    Actualizar un vehículo existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["vehiculos.vehiculos.update"]),
  validateUpdateVehiculo,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  vehiculosController.updateVehiculo
);

// ==========================================
// RUTAS DE OPERACIONES ESPECIALES
// ==========================================

/**
 * @route   PATCH /api/v1/vehiculos/:id/kilometraje
 * @desc    Actualizar kilometraje del vehículo
 * @access  Operador, Supervisor, Administrador
 * @body    kilometraje_nuevo (requerido), observaciones (opcional)
 */
router.patch(
  "/:id/kilometraje",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin", "super_admin"]),
  requireAnyPermission([
    "vehiculos.kilometraje.update",
    "vehiculos.vehiculos.update",
  ]),
  validateActualizarKilometraje,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "BAJA",
    modulo: "Vehiculos",
  }),
  vehiculosController.actualizarKilometraje
);

/**
 * @route   PATCH /api/v1/vehiculos/:id/estado
 * @desc    Cambiar estado operativo del vehículo
 * @access  Operador, Supervisor, Administrador
 * @body    estado_operativo (requerido), observaciones (opcional)
 */
router.patch(
  "/:id/estado",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin", "super_admin"]),
  requireAnyPermission([
    "vehiculos.estado.update",
    "vehiculos.vehiculos.update",
  ]),
  validateCambiarEstado,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  vehiculosController.cambiarEstadoOperativo
);

/**
 * @route   POST /api/v1/vehiculos/:id/abastecimiento
 * @desc    Registrar abastecimiento de combustible
 * @access  Operador, Supervisor, Administrador
 * @body    fecha_hora, tipo_combustible, cantidad_galones (requeridos)
 *          precio_galon, km_actual, grifo, observaciones (opcionales)
 */
router.post(
  "/:id/abastecimiento",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin", "super_admin"]),
  requireAnyPermission([
    "vehiculos.abastecimiento.create",
    "vehiculos.vehiculos.update",
  ]),
  validateRegistrarAbastecimiento,
  registrarAuditoria({
    entidad: "Abastecimiento",
    severidad: "BAJA",
    modulo: "Vehiculos",
  }),
  vehiculosController.registrarAbastecimiento
);

/**
 * @route   DELETE /api/v1/vehiculos/:id
 * @desc    Eliminar un vehículo (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["vehiculos.vehiculos.delete"]),
  validateVehiculoId,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "ALTA",
    modulo: "Vehiculos",
  }),
  vehiculosController.deleteVehiculo
);

export default router;
