/**
 * ===================================================
 * RUTAS: Tracking GPS de Vehículos de Patrullaje
 * ===================================================
 *
 * Ruta: src/routes/tracking.routes.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-05-27
 *
 * Descripción:
 * Define los endpoints del sistema de tracking GPS en tiempo
 * real para los vehículos de patrullaje del serenazgo.
 *
 * Todos los endpoints requieren autenticación JWT.
 *
 * ENDPOINTS:
 * ──────────────────────────────────────────────────────────
 * POST   /tracking/ubicacion
 *   Recibe posición GPS desde la app "CitySecure Tracking
 *   Patrol Units". Rate limit: 1 req / 3 s por vehiculo_id.
 *   Permiso: tracking.vehiculos.update
 *
 * GET    /tracking/activos
 *   Lista vehículos con posición en los últimos 10 minutos.
 *   Permiso: tracking.vehiculos.read
 *
 * GET    /tracking/vehiculo/:vehiculoId/ruta
 *   Historial de posiciones para reconstruir ruta de turno.
 *   Query: fecha_inicio, fecha_fin, limit (máx 500)
 *   Permiso: tracking.vehiculos.read
 *
 * GET    /tracking/novedad/:novedadId/vehiculos-cercanos
 *   Unidades activas más próximas a una novedad (Haversine).
 *   Devuelve máx 5 vehículos con ETA estimado.
 *   Permiso: tracking.vehiculos.read
 * ──────────────────────────────────────────────────────────
 *
 * PERMISOS RBAC:
 *   - tracking.vehiculos.update → app móvil de serenos
 *   - tracking.vehiculos.read  → dashboard de serenazgo
 *
 * @module routes/tracking
 * @version 1.0.0
 * @date 2026-05-27
 */

import express from "express";
const router = express.Router();

import {
  updateUbicacion,
  getActivos,
  getRutaVehiculo,
  getVehiculosCercanos,
} from "../controllers/trackingController.js";

import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

import {
  validarUbicacion,
  validarVehiculoIdParam,
  validarRangoDeFechas,
  validarNovedadIdParam,
  handleValidationErrors,
} from "../validators/tracking.validators.js";

// ============================================================
// ROLES CON ACCESO DE LECTURA (dashboard)
// ============================================================
const ROLES_LECTURA = ["super_admin", "admin", "supervisor", "operador", "consulta"];

// ============================================================
// ROLES CON ACCESO DE ESCRITURA (app móvil de serenos)
// Los serenos normalmente tendrán rol 'operador' o 'usuario_basico'
// + el permiso 'tracking.vehiculos.update'
// ============================================================
const ROLES_ESCRITURA = ["super_admin", "admin", "supervisor", "operador"];

// ─────────────────────────────────────────────────────────────

/**
 * @route   POST /api/v1/tracking/ubicacion
 * @desc    Recibe y persiste la posición GPS actual de un vehículo.
 *          Hace UPSERT en tracking_vehiculos e INSERT en tracking_historial.
 *          Emite evento SSE 'vehiculo:posicion' al dashboard.
 * @access  Roles: operador, supervisor, admin, super_admin
 *          Permiso: tracking.vehiculos.update
 * @body    { vehiculo_id, lat, lng, velocidad?, precision_gps?, bateria_dispositivo? }
 * @returns { success, data: { vehiculo_id, placa, lat, lng, updated_at } }
 */
router.post(
  "/ubicacion",
  verificarToken,
  verificarRolesOPermisos(ROLES_ESCRITURA, ["tracking.vehiculos.update"]),
  validarUbicacion,
  handleValidationErrors,
  // #swagger.tags = ['Tracking GPS']
  // #swagger.summary = 'Actualizar posición GPS de un vehículo'
  // #swagger.description = 'Recibe y persiste la posición GPS actual de un vehículo de patrullaje. Hace UPSERT en tracking_vehiculos e INSERT en tracking_historial. Emite evento SSE vehiculo:posicion al dashboard. Rate limit: 1 req / 3 s por vehiculo_id.'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingUbicacionRequest" } } } }
  // #swagger.responses[200] = { description: 'Posición actualizada correctamente', content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingUbicacionResponse" } } } }
  // #swagger.responses[400] = { description: 'Datos de validación inválidos', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[403] = { description: 'Sin permiso tracking.vehiculos.update', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[404] = { description: 'Vehículo no encontrado o inactivo', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[429] = { description: 'Rate limit — esperar N segundos', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  updateUbicacion
);

// ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/tracking/activos
 * @desc    Lista todos los vehículos con posición activa en los últimos 10 minutos.
 *          Incluye datos de vehículo, personal conductor y operativo/turno activo.
 * @access  Roles: consulta, operador, supervisor, admin, super_admin
 *          Permiso: tracking.vehiculos.read
 * @returns { success, data: { vehiculos: [...], total } }
 */
router.get(
  "/activos",
  verificarToken,
  verificarRolesOPermisos(ROLES_LECTURA, ["tracking.vehiculos.read"]),
  // #swagger.tags = ['Tracking GPS']
  // #swagger.summary = 'Listar vehículos con posición activa'
  // #swagger.description = 'Devuelve todos los vehículos con posición GPS actualizada en los últimos 10 minutos. Incluye datos del vehículo, personal conductor y operativo/turno activo.'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.responses[200] = { description: 'Lista de vehículos activos', content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingActivosResponse" } } } }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[403] = { description: 'Sin permiso tracking.vehiculos.read', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  getActivos
);

// ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/tracking/vehiculo/:vehiculoId/ruta
 * @desc    Devuelve el historial de posiciones GPS de un vehículo
 *          en un rango de tiempo. Útil para reconstruir la ruta
 *          patrullada durante un turno.
 * @access  Roles: consulta, operador, supervisor, admin, super_admin
 *          Permiso: tracking.vehiculos.read
 * @params  vehiculoId — ID del vehículo
 * @query   fecha_inicio (ISO 8601), fecha_fin (ISO 8601), limit (1-500, default 500)
 * @returns { success, data: { vehiculo, fecha_inicio, fecha_fin, total_puntos, ruta: [...] } }
 */
router.get(
  "/vehiculo/:vehiculoId/ruta",
  verificarToken,
  verificarRolesOPermisos(ROLES_LECTURA, ["tracking.vehiculos.read"]),
  validarVehiculoIdParam,
  validarRangoDeFechas,
  handleValidationErrors,
  // #swagger.tags = ['Tracking GPS']
  // #swagger.summary = 'Historial de ruta de un vehículo'
  // #swagger.description = 'Devuelve el historial de posiciones GPS de un vehículo en un rango de tiempo. Útil para reconstruir la ruta patrullada durante un turno. Máximo 500 puntos por consulta.'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['vehiculoId'] = { in: 'path', required: true, type: 'integer', example: 1 }
  // #swagger.parameters['fecha_inicio'] = { in: 'query', required: true, type: 'string', example: '2026-05-27T06:00:00.000Z' }
  // #swagger.parameters['fecha_fin'] = { in: 'query', required: true, type: 'string', example: '2026-05-27T14:00:00.000Z' }
  // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 500, description: 'Máximo 500 puntos' }
  // #swagger.responses[200] = { description: 'Historial de ruta', content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingRutaResponse" } } } }
  // #swagger.responses[400] = { description: 'Parámetros inválidos', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[403] = { description: 'Sin permiso tracking.vehiculos.read', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[404] = { description: 'Vehículo no encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  getRutaVehiculo
);

// ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/tracking/novedad/:novedadId/vehiculos-cercanos
 * @desc    Calcula los vehículos activos más cercanos a una novedad
 *          usando la fórmula Haversine en SQL. Devuelve máximo 5
 *          unidades ordenadas por distancia, con tiempo estimado de llegada.
 *          Solo considera vehículos con posición en los últimos 10 minutos.
 * @access  Roles: consulta, operador, supervisor, admin, super_admin
 *          Permiso: tracking.vehiculos.read
 * @params  novedadId — ID de la novedad
 * @returns { success, data: { novedad_id, coordenadas_novedad, vehiculos_cercanos: [...] } }
 */
router.get(
  "/novedad/:novedadId/vehiculos-cercanos",
  verificarToken,
  verificarRolesOPermisos(ROLES_LECTURA, ["tracking.vehiculos.read"]),
  validarNovedadIdParam,
  handleValidationErrors,
  // #swagger.tags = ['Tracking GPS']
  // #swagger.summary = 'Vehículos activos más cercanos a una novedad'
  // #swagger.description = 'Calcula los vehículos de patrullaje activos más próximos a una novedad usando la fórmula Haversine en SQL. Devuelve máximo 5 unidades ordenadas por distancia con tiempo estimado de llegada (ETA). Solo considera vehículos con posición en los últimos 10 minutos.'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['novedadId'] = { in: 'path', required: true, type: 'integer', example: 42 }
  // #swagger.responses[200] = { description: 'Vehículos cercanos con ETA', content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingVehiculosCercanosResponse" } } } }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[403] = { description: 'Sin permiso tracking.vehiculos.read', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[404] = { description: 'Novedad no encontrada', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[422] = { description: 'La novedad no tiene coordenadas GPS', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  getVehiculosCercanos
);

export default router;
