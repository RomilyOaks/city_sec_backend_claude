/**
 * ===================================================
 * RUTAS: Novedades/Incidentes
 * ===================================================
 *
 * Ruta: src/routes/novedades.routes.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Actualizado import de validadores a validators/
 * ✅ Arquitectura consistente con personal.routes.js
 * ✅ Documentación mejorada
 *
 * Descripción:
 * Define los endpoints REST para gestión de novedades e incidentes
 * con control de acceso RBAC y validaciones centralizadas.
 *
 * @module routes/novedades
 * @requires express
 * @version 2.0.0
 * @date 2025-12-14
 */

import express from "express";
const router = express.Router();

// ==========================================
// IMPORTAR CONTROLADORES
// ==========================================
import novedadesController from "../controllers/novedadesController.js";
import * as historialController from "../controllers/historialEstadoNovedadController.js";

// ==========================================
// IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
// ==========================================
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// ==========================================
// IMPORTAR VALIDADORES (NUEVA UBICACIÓN)
// ==========================================
import {
  validateCreateNovedad,
  validateUpdateNovedad,
  validateAsignarRecursos,
  validateQueryNovedades,
  validateNovedadId,
} from "../validators/novedad.validator.js"; // ✅ CAMBIO AQUÍ

// ==========================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ==========================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

// ==========================================
// RUTAS ESPECIALES (ANTES DE /:id)
// ==========================================

/**
 * @route   GET /api/v1/novedades/dashboard/stats
 * @desc    Obtener estadísticas para el dashboard
 * @access  Todos los usuarios autenticados
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get(
  "/dashboard/stats",
  verificarToken,
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Estadísticas para dashboard'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return novedadesController.getDashboardStats(req, res, next);
  }
);

/**
 * @route   GET /api/v1/novedades/:id/historial
 * @desc    Obtener historial de cambios de estado de una novedad
 * @access  Operador, Supervisor, Administrador
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get(
  "/:id/historial",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  validateNovedadId,
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Historial de estados de una novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return novedadesController.getHistorialEstados(req, res, next);
  }
);

// ==========================================
// RUTAS CRUD PRINCIPALES
// ==========================================

/**
 * @route   GET /api/v1/novedades
 * @desc    Obtener todas las novedades con filtros
 * @access  Operador, Supervisor, Administrador
 * @query   fecha_inicio, fecha_fin, estado_id, prioridad, sector_id, tipo_id, search, page, limit
 */
router.get(
  "/",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  validateQueryNovedades,
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Listar novedades/incidentes'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['fecha_inicio'] = { in: 'query', required: false, type: 'string', example: '2025-01-01' }
    // #swagger.parameters['fecha_fin'] = { in: 'query', required: false, type: 'string', example: '2025-01-31' }
    // #swagger.parameters['estado_novedad_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['prioridad_actual'] = { in: 'query', required: false, type: 'string', example: 'ALTA' }
    // #swagger.parameters['sector_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['tipo_novedad_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'robo' }
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 50 }
    // #swagger.responses[200] = { description: 'OK' }
    return novedadesController.getAllNovedades(req, res, next);
  }
);

/**
 * @route   GET /api/v1/novedades/:id
 * @desc    Obtener una novedad específica por ID
 * @access  Operador, Supervisor, Administrador
 */
router.get(
  "/:id",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  validateNovedadId,
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Obtener novedad por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return novedadesController.getNovedadById(req, res, next);
  }
);

/**
 * @route   POST /api/v1/novedades
 * @desc    Crear una nueva novedad
 * @access  Operador, Supervisor, Administrador
 * @body    tipo_novedad_id, subtipo_novedad_id, fecha_hora_ocurrencia, localizacion, descripcion, etc.
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission([
    "novedades.incidentes.create",
    "novedades.novedades.create",
  ]),
  validateCreateNovedad,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "MEDIA",
    modulo: "Novedades",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Crear novedad/incidente'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NovedadCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return novedadesController.createNovedad(req, res, next);
  }
);

/**
 * @route   PUT /api/v1/novedades/:id
 * @desc    Actualizar una novedad existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["novedades.incidentes.update"]),
  validateUpdateNovedad,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "MEDIA",
    modulo: "Novedades",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Actualizar novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NovedadUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return novedadesController.updateNovedad(req, res, next);
  }
);

// ==========================================
// RUTAS DE ACCIONES ESPECIALES
// ==========================================

/**
 * @route   POST /api/v1/novedades/:id/asignar
 * @desc    Asignar recursos (unidad, vehículo, personal) a una novedad
 * @access  Operador, Supervisor, Administrador
 */
router.post(
  "/:id/asignar",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission(["novedades.asignacion.execute"]),
  validateAsignarRecursos,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "MEDIA",
    modulo: "Novedades",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Asignar recursos a novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NovedadAsignarRecursosRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return novedadesController.asignarRecursos(req, res, next);
  }
);

/**
 * @route   DELETE /api/v1/novedades/:id
 * @desc    Eliminar una novedad (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin"]),
  requireAnyPermission(["novedades.incidentes.delete"]),
  validateNovedadId,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "ALTA",
    modulo: "Novedades",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Eliminar novedad (soft delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return novedadesController.deleteNovedad(req, res, next);
  }
);

// ==========================================
// RUTAS DE HISTORIAL DE ESTADOS
// ==========================================

/**
 * @route   GET /api/v1/novedades/:novedadId/historial
 * @desc    Obtener historial de estados de una novedad
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:novedadId/historial",
  verificarToken,
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Obtener historial de estados de una novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['novedadId'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Novedad no encontrada' }
    return historialController.getHistorialByNovedad(req, res, next);
  }
);

/**
 * @route   POST /api/v1/novedades/:novedadId/historial
 * @desc    Registrar cambio de estado manual
 * @access  Operador, Supervisor, Administrador
 */
router.post(
  "/:novedadId/historial",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission(["novedades.incidentes.update"]),
  registrarAuditoria({
    entidad: "HistorialEstadoNovedad",
    severidad: "MEDIA",
    modulo: "Novedades",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Novedades']
    // #swagger.summary = 'Registrar cambio de estado manual'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['novedadId'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[404] = { description: 'Novedad no encontrada' }
    return historialController.createHistorialEstado(req, res, next);
  }
);

export default router;
