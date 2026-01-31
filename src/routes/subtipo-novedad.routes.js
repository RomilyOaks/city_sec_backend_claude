/**
 * File: src/routes/subtipo-novedad.routes.js
 * @version 1.1.0
 * @description Rutas para gestión de subtipos de novedad (subcategorías)
 * 
 * Endpoints:
 * - GET /api/v1/subtipos-novedad - Listar subtipos activos
 * - GET /api/v1/subtipos-novedad/:id - Obtener subtipo por ID
 * - POST /api/v1/subtipos-novedad - Crear nuevo subtipo
 * - PUT /api/v1/subtipos-novedad/:id - Actualizar existente
 * - DELETE /api/v1/subtipos-novedad/:id - Soft delete
 * - PATCH /api/v1/subtipos-novedad/:id/reactivar - Reactivar eliminado
 * - GET /api/v1/subtipos-novedad/eliminados - Listar eliminados
 * 
 * @module src/routes/subtipo-novedad.routes.js
 * @version 1.1.0
 * @date 2026-01-29
 */

import { Router } from "express";
import subtipoNovedadController from "../controllers/subtipoNovedadController.js";
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
} from "../validators/subtipo-novedad.validator.js";

const router = Router();

const permisos = {
  read: "catalogos.tipos_novedad.read",
  create: "catalogos.tipos_novedad.create",
  update: "catalogos.tipos_novedad.update",
  delete: "catalogos.tipos_novedad.delete",
};

/**
 * @route   GET /api/v1/subtipos-novedad
 * @desc    Obtener todos los subtipos de novedad
 * @access  Usuarios con permiso de lectura
 */
router.get(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  validateQuery,
  (req, res, next) => {
    // #swagger.tags = ['Subtipos Novedad']
    // #swagger.summary = 'Listar subtipos de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['tipo_novedad_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['estado'] = { in: 'query', required: false, type: 'string', enum: ['true', 'false', '1', '0'], example: 'true' }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'Hurto' }
    // #swagger.responses[200] = { description: 'OK' }
    return subtipoNovedadController.getAll(req, res, next);
  }
);

/**
 * @route   GET /api/v1/subtipos-novedad/:id
 * @desc    Obtener subtipo de novedad por ID
 * @access  Usuarios con permiso de lectura
 */
router.get(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  validateId,
  (req, res, next) => {
    // #swagger.tags = ['Subtipos Novedad']
    // #swagger.summary = 'Obtener subtipo de novedad por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Subtipo de novedad no encontrado' }
    return subtipoNovedadController.getById(req, res, next);
  }
);

/**
 * @route   POST /api/v1/subtipos-novedad
 * @desc    Crear nuevo subtipo de novedad
 * @access  Usuarios con permiso de creación
 */
router.post(
  "/",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.create])(req, res, next),
  validateCreate,
  handleValidationErrors,
  registrarAuditoria("Creación de subtipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Subtipos Novedad']
    // #swagger.summary = 'Crear subtipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SubtipoNovedadCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación' }
    return subtipoNovedadController.create(req, res, next);
  }
);

/**
 * @route   PUT /api/v1/subtipos-novedad/:id
 * @desc    Actualizar subtipo de novedad existente
 * @access  Usuarios con permiso de actualización
 */
router.put(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  validateId,
  validateUpdate,
  handleValidationErrors,
  registrarAuditoria("Actualización de subtipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Subtipos Novedad']
    // #swagger.summary = 'Actualizar subtipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SubtipoNovedadUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación' }
    // #swagger.responses[404] = { description: 'Subtipo de novedad no encontrado' }
    return subtipoNovedadController.update(req, res, next);
  }
);

/**
 * @route   DELETE /api/v1/subtipos-novedad/:id
 * @desc    Eliminar subtipo de novedad (soft delete)
 * @access  Usuarios con permiso de eliminación
 */
router.delete(
  "/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.delete])(req, res, next),
  validateId,
  handleValidationErrors,
  registrarAuditoria("Eliminación de subtipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Subtipos Novedad']
    // #swagger.summary = 'Eliminar subtipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Subtipo de novedad no encontrado' }
    // #swagger.responses[400] = { description: 'No se puede eliminar - tiene dependencias' }
    return subtipoNovedadController.remove(req, res, next);
  }
);

/**
 * @route   PATCH /api/v1/subtipos-novedad/:id/reactivar
 * @desc    Reactivar subtipo de novedad eliminado
 * @access  Usuarios con permiso de actualización
 */
router.patch(
  "/:id/reactivar",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  validateId,
  handleValidationErrors,
  registrarAuditoria("Reactivación de subtipo de novedad"),
  (req, res, next) => {
    // #swagger.tags = ['Subtipos Novedad']
    // #swagger.summary = 'Reactivar subtipo de novedad'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Subtipo de novedad no encontrado' }
    // #swagger.responses[400] = { description: 'Subtipo de novedad no está eliminado' }
    return subtipoNovedadController.reactivar(req, res, next);
  }
);

/**
 * @route   GET /api/v1/subtipos-novedad/eliminados
 * @desc    Listar subtipos de novedad eliminados
 * @access  Usuarios con permiso de lectura
 */
router.get(
  "/eliminados",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  [
    query("tipo_novedad_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID del tipo de novedad debe ser un entero positivo"),
    query("search")
      .optional()
      .isString()
      .withMessage("La búsqueda debe ser texto"),
  ],
  handleValidationErrors,
  (req, res, next) => {
    // #swagger.tags = ['Subtipos Novedad']
    // #swagger.summary = 'Listar subtipos de novedad eliminados'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['tipo_novedad_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'Hurto' }
    // #swagger.responses[200] = { description: 'OK' }
    return subtipoNovedadController.getEliminados(req, res, next);
  }
);

export default router;
