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
  verificarRolesOPermisos,
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
// IMPORTAR RATE LIMITING (TEMPORAL ANTI-BUCLE)
// ==========================================
import { catalogRateLimit } from "../middlewares/rateLimitMiddleware.js";

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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["vehiculos.vehiculos.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Estadísticas de vehículos'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return vehiculosController.getEstadisticasVehiculos(req, res, next);
  }
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
  catalogRateLimit, // 🔥 ANTI-BUCLE: Máximo 5 solicitudes/minuto
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["vehiculos.vehiculos.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Listar vehículos disponibles'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['tipo_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[403] = { description: 'No autorizado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[429] = { description: 'Too Many Requests - Posible bucle infinito', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return vehiculosController.getVehiculosDisponibles(req, res, next);
  }
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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["vehiculos.vehiculos.read"]),
  validateQueryParams,
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Listar vehículos'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['tipo_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['estado_operativo'] = { in: 'query', required: false, type: 'string', example: 'OPERATIVO' }
    // #swagger.parameters['unidad_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'toyota' }
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 10 }
    // #swagger.responses[200] = { description: 'OK' }
    return vehiculosController.getAllVehiculos(req, res, next);
  }
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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["vehiculos.vehiculos.read"]),
  validateVehiculoId,
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Historial de uso del vehículo (novedades)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 50 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return vehiculosController.getHistorialVehiculo(req, res, next);
  }
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
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["vehiculos.vehiculos.read"]),
  validateVehiculoId,
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Historial de abastecimientos de un vehículo'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.parameters['fecha_inicio'] = { in: 'query', required: false, type: 'string', example: '2025-01-01' }
    // #swagger.parameters['fecha_fin'] = { in: 'query', required: false, type: 'string', example: '2025-01-31' }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 50 }
    // #swagger.responses[200] = { description: 'OK' }
    return vehiculosController.getHistorialAbastecimientos(req, res, next);
  }
);

/**
 * @route   GET /api/v1/vehiculos/:id/mantenimientos
 * @desc    Obtener historial de mantenimientos de un vehículo
 * @access  Todos los usuarios autenticados
 * @query   estado_mantenimiento, taller_id, limit (opcionales)
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get(
  "/:id/mantenimientos",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["vehiculos.vehiculos.read"]),
  validateVehiculoId,
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Historial de mantenimientos de un vehículo'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.parameters['estado_mantenimiento'] = { in: 'query', required: false, type: 'string', example: 'PENDIENTE' }
    // #swagger.parameters['taller_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 50 }
    // #swagger.responses[200] = { description: 'OK' }
    return vehiculosController.getHistorialMantenimientos(req, res, next);
  }
);

/**
 * @route   GET /api/v1/vehiculos/:id
 * @desc    Obtener un vehículo específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["vehiculos.vehiculos.read"]),
  validateVehiculoId,
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Obtener vehículo por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return vehiculosController.getVehiculoById(req, res, next);
  }
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
  verificarRolesOPermisos(["super_admin", "admin"], ["vehiculos.vehiculos.create"]),
  validateCreateVehiculo,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Crear vehículo'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VehiculoCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return vehiculosController.createVehiculo(req, res, next);
  }
);

/**
 * @route   PUT /api/v1/vehiculos/:id
 * @desc    Actualizar un vehículo existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["vehiculos.vehiculos.update"]),
  validateUpdateVehiculo,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Actualizar vehículo'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VehiculoUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return vehiculosController.updateVehiculo(req, res, next);
  }
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
  verificarRolesOPermisos(["operador", "supervisor", "admin", "super_admin"], [
    "vehiculos.kilometraje.update",
    "vehiculos.vehiculos.update",
  ]),
  validateActualizarKilometraje,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "BAJA",
    modulo: "Vehiculos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Actualizar kilometraje'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VehiculoKilometrajeRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    return vehiculosController.actualizarKilometraje(req, res, next);
  }
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
  verificarRolesOPermisos(["operador", "supervisor", "admin", "super_admin"], [
    "vehiculos.estado.update",
    "vehiculos.vehiculos.update",
  ]),
  validateCambiarEstado,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Cambiar estado operativo'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VehiculoEstadoRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    return vehiculosController.cambiarEstadoOperativo(req, res, next);
  }
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
  verificarRolesOPermisos(["operador", "supervisor", "admin", "super_admin"], [
    "vehiculos.abastecimiento.create",
    "vehiculos.vehiculos.update",
  ]),
  validateRegistrarAbastecimiento,
  registrarAuditoria({
    entidad: "Abastecimiento",
    severidad: "BAJA",
    modulo: "Vehiculos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Registrar abastecimiento'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VehiculoAbastecimientoRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    return vehiculosController.registrarAbastecimiento(req, res, next);
  }
);

/**
 * @route   DELETE /api/v1/vehiculos/:id
 * @desc    Eliminar un vehículo (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin"], ["vehiculos.vehiculos.delete"]),
  validateVehiculoId,
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "ALTA",
    modulo: "Vehiculos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Vehiculos']
    // #swagger.summary = 'Eliminar vehículo (soft delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return vehiculosController.deleteVehiculo(req, res, next);
  }
);

export default router;
