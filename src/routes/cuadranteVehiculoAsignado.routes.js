/**
 * File: src/routes/cuadranteVehiculoAsignado.routes.js
 * @version 1.0.0
 * @description Rutas para gestión de asignaciones de vehículos a cuadrantes
 *
 * Endpoints:
 * - GET /api/v1/cuadrantes-vehiculos-asignados - Listar asignaciones
 * - GET /api/v1/cuadrantes-vehiculos-asignados/:id - Obtener asignación por ID
 * - POST /api/v1/cuadrantes-vehiculos-asignados - Crear asignación
 * - PUT /api/v1/cuadrantes-vehiculos-asignados/:id - Actualizar asignación
 * - DELETE /api/v1/cuadrantes-vehiculos-asignados/:id - Eliminar asignación (soft delete)
 * - PATCH /api/v1/cuadrantes-vehiculos-asignados/:id/reactivar - Reactivar asignación
 * - PATCH /api/v1/cuadrantes-vehiculos-asignados/:id/estado - Cambiar estado
 * - GET /api/v1/cuadrantes-vehiculos-asignados/eliminadas - Listar eliminadas
 *
 * @module src/routes/cuadranteVehiculoAsignado.routes.js
 */

import { Router } from "express";
import {
  body,
  param,
  query,
  validationResult,
} from "express-validator";
import {
  getAllAsignaciones,
  getAsignacionById,
  createAsignacion,
  updateAsignacion,
  deleteAsignacion,
  reactivarAsignacion,
  toggleEstadoAsignacion,
  getAsignacionesEliminadas,
} from "../controllers/cuadranteVehiculoAsignadoController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

const router = Router();

const permisos = {
  read: "catalogos.cuadrantes_vehiculos_asignados.read",
  create: "catalogos.cuadrantes_vehiculos_asignados.create",
  update: "catalogos.cuadrantes_vehiculos_asignados.update",
  delete: "catalogos.cuadrantes_vehiculos_asignados.delete",
};
// ============================================
// VALIDACIONES
// ============================================

// Validaciones para crear/actualizar
const validacionesAsignacion = [
  body("cuadrante_id")
    .notEmpty()
    .withMessage("El ID del cuadrante es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del cuadrante debe ser un número positivo"),
  
  body("vehiculo_id")
    .notEmpty()
    .withMessage("El ID del vehículo es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del vehículo debe ser un número positivo"),
  
  body("observaciones")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("Las observaciones deben ser texto")
    .isLength({ max: 500 })
    .withMessage("Las observaciones no pueden exceder 500 caracteres"),
  
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser true o false"),
];

// Validaciones para parámetros
const validacionesParamId = [
  param("id")
    .notEmpty()
    .withMessage("El ID es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID debe ser un número positivo"),
];

// Validaciones para query params
const validacionesQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número positivo"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe estar entre 1 y 100"),
  
  query("estado")
    .optional()
    .isIn(["true", "false"])
    .withMessage("El estado debe ser true o false"),
  
  query("cuadrante_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID del cuadrante debe ser un número positivo"),
  
  query("vehiculo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID del vehículo debe ser un número positivo"),
  
  query("sort")
    .optional()
    .isIn(["id", "cuadrante_id", "vehiculo_id", "created_at", "updated_at", "estado"])
    .withMessage("El campo de ordenación no es válido"),
  
  query("order")
    .optional()
    .isIn(["ASC", "DESC"])
    .withMessage("El orden debe ser ASC o DESC"),
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: errors.array(),
    });
  }
  next();
};

// ============================================
// RUTAS PÚBLICAS (con autenticación)
// ============================================

/**
 * GET /api/v1/cuadrantes-vehiculos-asignados
 * Listar todas las asignaciones con paginación y filtros
 */
router.get(
  "/",
  verificarToken,
  requireAnyPermission([permisos.read]),
  validacionesQuery,
  handleValidationErrors,
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Listar asignaciones de vehículos a cuadrantes'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 10 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'observaciones' }
    // #swagger.parameters['estado'] = { in: 'query', required: false, type: 'boolean', example: true }
    // #swagger.parameters['cuadrante_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['vehiculo_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['sort'] = { in: 'query', required: false, type: 'string', example: 'created_at' }
    // #swagger.parameters['order'] = { in: 'query', required: false, type: 'string', example: 'DESC' }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autorizado' }
    // #swagger.responses[403] = { description: 'Prohibido' }
    return getAllAsignaciones(req, res, next);
  }
);

/**
 * GET /api/v1/cuadrantes-vehiculos-asignados/eliminadas
 * Listar asignaciones eliminadas (para reactivación)
 */
router.get(
  "/eliminadas",
  verificarToken,
  requireAnyPermission([permisos.read]),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sort").optional().isIn(["deleted_at", "created_at"]),
    query("order").optional().isIn(["ASC", "DESC"]),
    handleValidationErrors,
  ],
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Listar asignaciones eliminadas'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.responses[200] = { description: 'OK' }
    return getAsignacionesEliminadas(req, res, next);
  }
);

/**
 * GET /api/v1/cuadrantes-vehiculos-asignados/:id
 * Obtener asignación por ID
 */
router.get(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.read]),
  validacionesParamId,
  handleValidationErrors,
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Obtener asignación por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado' }
    return getAsignacionById(req, res, next);
  }
);

/**
 * POST /api/v1/cuadrantes-vehiculos-asignados
 * Crear nueva asignación
 */
router.post(
  "/",
  verificarToken,
  requireAnyPermission([permisos.create]),
  validacionesAsignacion,
  handleValidationErrors,
  registrarAuditoria({
    entidad: "CuadranteVehiculoAsignado",
    severidad: "MEDIA",
    modulo: "Catálogos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Crear nueva asignación'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['asignacion'] = { in: 'body', required: true, schema: { $ref: '#/components/schemas/AsignacionCreate' } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Error de validación' }
    // #swagger.responses[409] = { description: 'Asignación duplicada' }
    return createAsignacion(req, res, next);
  }
);

/**
 * PUT /api/v1/cuadrantes-vehiculos-asignados/:id
 * Actualizar asignación existente
 */
router.put(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.update]),
  [...validacionesParamId, ...validacionesAsignacion],
  handleValidationErrors,
  registrarAuditoria({
    entidad: "CuadranteVehiculoAsignado",
    severidad: "MEDIA",
    modulo: "Catálogos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Actualizar asignación'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.parameters['asignacion'] = { in: 'body', required: true, schema: { $ref: '#/components/schemas/AsignacionUpdate' } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado' }
    return updateAsignacion(req, res, next);
  }
);

/**
 * DELETE /api/v1/cuadrantes-vehiculos-asignados/:id
 * Eliminar asignación (soft delete)
 */
router.delete(
  "/:id",
  verificarToken,
  requireAnyPermission([permisos.delete]),
  validacionesParamId,
  handleValidationErrors,
  registrarAuditoria({
    entidad: "CuadranteVehiculoAsignado",
    severidad: "ALTA",
    modulo: "Catálogos",
    accion: "DELETE",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Eliminar asignación (soft delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado' }
    return deleteAsignacion(req, res, next);
  }
);

/**
 * PATCH /api/v1/cuadrantes-vehiculos-asignados/:id/reactivar
 * Reactivar asignación eliminada
 */
router.patch(
  "/:id/reactivar",
  verificarToken,
  requireAnyPermission([permisos.create]),
  validacionesParamId,
  handleValidationErrors,
  registrarAuditoria({
    entidad: "CuadranteVehiculoAsignado",
    severidad: "MEDIA",
    modulo: "Catálogos",
    accion: "REACTIVATE",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Reactivar asignación eliminada'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado' }
    return reactivarAsignacion(req, res, next);
  }
);

/**
 * PATCH /api/v1/cuadrantes-vehiculos-asignados/:id/estado
 * Cambiar estado de asignación (activar/desactivar)
 */
router.patch(
  "/:id/estado",
  verificarToken,
  requireAnyPermission([permisos.update]),
  [
    ...validacionesParamId,
    body("estado")
      .notEmpty()
      .withMessage("El estado es requerido")
      .isBoolean()
      .withMessage("El estado debe ser true o false"),
    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "CuadranteVehiculoAsignado",
    severidad: "BAJA",
    modulo: "Catálogos",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Cuadrantes Vehículos Asignados']
    // #swagger.summary = 'Cambiar estado de asignación'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.parameters['estado'] = { in: 'body', required: true, schema: { type: 'object', properties: { estado: { type: 'boolean' } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado' }
    return toggleEstadoAsignacion(req, res, next);
  }
);

export default router;
