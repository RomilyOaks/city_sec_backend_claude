/**
 * File: src/routes/tipo-novedad.routes.js
 * @version 1.1.0
 * @description Rutas para gestión de tipos de novedad (categorías principales)
 * 
 * Endpoints:
 * - GET /api/v1/tipos-novedad - Listar tipos activos
 * - GET /api/v1/tipos-novedad/:id - Obtener tipo por ID
 * - POST /api/v1/tipos-novedad - Crear nuevo tipo
 * - PUT /api/v1/tipos-novedad/:id - Actualizar existente
 * - DELETE /api/v1/tipos-novedad/:id - Soft delete
 * - PATCH /api/v1/tipos-novedad/:id/reactivar - Reactivar eliminado
 * - GET /api/v1/tipos-novedad/eliminadas - Listar eliminados
 * 
 * @module src/routes/tipo-novedad.routes.js
 * @version 1.1.0
 * @date 2026-01-29
 */

import { Router } from "express";
import { query } from "express-validator";
import tipoNovedadController from "../controllers/tipoNovedadController.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";
import {
  validateCreate,
  validateUpdate,
  validateId,
  validateQuery,
} from "../validators/tipo-novedad.validator.js";

const router = Router();

const permisos = {
  read: "catalogos.tipos_novedad.read",
  create: "catalogos.tipos_novedad.create",
  update: "catalogos.tipos_novedad.update",
  delete: "catalogos.tipos_novedad.delete",
};

/**
 * @route   GET /api/v1/tipos-novedad
 * @desc    Obtener todos los tipos de novedad
 * @access  Usuarios con permiso de lectura
 */
router.get(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  validateQuery,
  (req, res, next) => {
    // #swagger.tags = ['Tipos Novedad']
    // #swagger.summary = 'Listar tipos de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['estado'] = { in: 'query', required: false, type: 'string', enum: ['true', 'false', '1', '0'], example: 'true' }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'Robo' }
    // #swagger.responses[200] = { description: 'OK' }
    return tipoNovedadController.getAll(req, res, next);
  }
);

/**
 * @route   GET /api/v1/tipos-novedad/:id
 * @desc    Obtener tipo de novedad por ID
 * @access  Usuarios con permiso de lectura
 */
router.get(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  validateId,
  (req, res, next) => {
    // #swagger.tags = ['Tipos Novedad']
    // #swagger.summary = 'Obtener tipo de novedad por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Tipo de novedad no encontrado' }
    return tipoNovedadController.getById(req, res, next);
  }
);

/**
 * @route   POST /api/v1/tipos-novedad
 * @desc    Crear nuevo tipo de novedad
 * @access  Usuarios con permiso de creación
 */
router.post(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.create])(req, res, next),
  validateCreate,
  handleValidationErrors,
  registrarAuditoria("Creación de tipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Tipos Novedad']
    // #swagger.summary = 'Crear tipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TipoNovedadCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación' }
    return tipoNovedadController.create(req, res, next);
  }
);

/**
 * @route   PUT /api/v1/tipos-novedad/:id
 * @desc    Actualizar tipo de novedad existente
 * @access  Usuarios con permiso de actualización
 */
router.put(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  validateId,
  validateUpdate,
  handleValidationErrors,
  registrarAuditoria("Actualización de tipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Tipos Novedad']
    // #swagger.summary = 'Actualizar tipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TipoNovedadUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación' }
    // #swagger.responses[404] = { description: 'Tipo de novedad no encontrado' }
    return tipoNovedadController.update(req, res, next);
  }
);

/**
 * @route   DELETE /api/v1/tipos-novedad/:id
 * @desc    Eliminar tipo de novedad (soft delete)
 * @access  Usuarios con permiso de eliminación
 */
router.delete(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.delete])(req, res, next),
  validateId,
  handleValidationErrors,
  registrarAuditoria("Eliminación de tipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Tipos Novedad']
    // #swagger.summary = 'Eliminar tipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Tipo de novedad no encontrado' }
    // #swagger.responses[400] = { description: 'No se puede eliminar - tiene dependencias' }
    return tipoNovedadController.remove(req, res, next);
  }
);

/**
 * @route   PATCH /api/v1/tipos-novedad/:id/reactivar
 * @desc    Reactivar tipo de novedad eliminado
 * @access  Usuarios con permiso de actualización
 */
router.patch(
  "/:id/reactivar",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  validateId,
  handleValidationErrors,
  registrarAuditoria("Reactivación de tipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Tipos Novedad']
    // #swagger.summary = 'Reactivar tipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Tipo de novedad no encontrado' }
    // #swagger.responses[400] = { description: 'Tipo de novedad no está eliminado' }
    return tipoNovedadController.reactivar(req, res, next);
  }
);

/**
 * @route   GET /api/v1/tipos-novedad/eliminadas
 * @desc    Listar tipos de novedad eliminados
 * @access  Usuarios con permiso de lectura
 */
router.get(
  "/eliminadas",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  [
    query("search")
      .optional()
      .isString()
      .withMessage("El búsqueda debe ser texto"),
  ],
  handleValidationErrors,
  (req, res, next) => {
    // #swagger.tags = ['Tipos Novedad']
    // #swagger.summary = 'Listar tipos de novedad eliminados'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'Robo' }
    // #swagger.responses[200] = { description: 'OK' }
    return tipoNovedadController.getEliminadas(req, res, next);
  }
);

export default router;
