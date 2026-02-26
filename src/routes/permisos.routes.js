/**
 * Ruta: src/routes/permisos.routes.js
 *
 * Descripción:
 * Definición de rutas para la gestión de permisos del sistema RBAC.
 * Los permisos definen acciones específicas que pueden realizar los usuarios.
 *
 * IMPORTANTE: Solo super_admin y admin deben tener acceso a estas rutas.
 *
 * Rutas disponibles:
 * - GET    /api/v1/permisos              - Listar permisos
 * - GET    /api/v1/permisos/:id          - Obtener por ID
 * - GET    /api/v1/permisos/slug/:slug   - Buscar por slug
 * - GET    /api/v1/permisos/modulo/:modulo - Permisos de un módulo
 * - POST   /api/v1/permisos              - Crear permiso
 * - PUT    /api/v1/permisos/:id          - Actualizar permiso
 * - DELETE /api/v1/permisos/:id          - Eliminar permiso
 * - PATCH  /api/v1/permisos/:id/estado   - Cambiar estado
 *
 * @module routes/permisos
 */

import express from "express";
import {
  getPermisos,
  getPermisoById,
  getPermisoBySlug,
  getPermisosByModulo,
} from "../controllers/permisosController.js";

import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Middleware de autenticación y rol
 * Todas las rutas requieren ser super_admin o admin
 */
router.use(verificarToken);

// ============================================
// RUTAS DE CONSULTA (READ)
// ============================================

/**
 * @route   GET /api/v1/permisos
 * @desc    Listar permisos con filtros y paginación
 * @access  Private (super_admin, admin)
 * @query   {number} page - Número de página (default: 1)
 * @query   {number} limit - Items por página (default: 50)
 * @query   {string} modulo - Filtrar por módulo
 * @query   {string} recurso - Filtrar por recurso
 * @query   {boolean} activos - Solo activos (default: true)
 * @query   {string} search - Búsqueda en slug o descripción
 */
// #swagger.tags = ['Permisos']
// #swagger.summary = 'Listar permisos (read-only)'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
// #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 50 }
// #swagger.parameters['modulo'] = { in: 'query', required: false, type: 'string', example: 'usuarios' }
// #swagger.parameters['recurso'] = { in: 'query', required: false, type: 'string', example: 'roles' }
// #swagger.parameters['activos'] = { in: 'query', required: false, type: 'boolean', example: true }
// #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'usuarios.roles' }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
// #swagger.responses[403] = { description: 'No autorizado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get(
  "/",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.permisos.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Permisos']
    // #swagger.summary = 'Listar permisos (read-only)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 50 }
    // #swagger.parameters['modulo'] = { in: 'query', required: false, type: 'string', example: 'usuarios' }
    // #swagger.parameters['recurso'] = { in: 'query', required: false, type: 'string', example: 'roles' }
    // #swagger.parameters['activos'] = { in: 'query', required: false, type: 'boolean', example: true }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'usuarios.roles' }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[403] = { description: 'No autorizado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getPermisos(req, res, next);
  }
);

/**
 * @route   GET /api/v1/permisos/modulo/:modulo
 * @desc    Obtener permisos de un módulo específico
 * @access  Private (super_admin, admin)
 * @params  {string} modulo - Nombre del módulo
 */
// #swagger.tags = ['Permisos']
// #swagger.summary = 'Listar permisos por módulo'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['modulo'] = { in: 'path', required: true, type: 'string', example: 'usuarios' }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get(
  "/modulo/:modulo",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.permisos.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Permisos']
    // #swagger.summary = 'Listar permisos por módulo'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['modulo'] = { in: 'path', required: true, type: 'string', example: 'usuarios' }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getPermisosByModulo(req, res, next);
  }
);

/**
 * @route   GET /api/v1/permisos/slug/:slug
 * @desc    Buscar permiso por slug
 * @access  Private (super_admin, admin)
 * @params  {string} slug - Slug del permiso (ej: usuarios.usuarios.create)
 */
// #swagger.tags = ['Permisos']
// #swagger.summary = 'Obtener permiso por slug'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['slug'] = { in: 'path', required: true, type: 'string', example: 'usuarios.roles.read' }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get(
  "/slug/:slug",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.permisos.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Permisos']
    // #swagger.summary = 'Obtener permiso por slug'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['slug'] = { in: 'path', required: true, type: 'string', example: 'usuarios.roles.read' }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getPermisoBySlug(req, res, next);
  }
);

/**
 * @route   GET /api/v1/permisos/:id
 * @desc    Obtener permiso específico por ID
 * @access  Private (super_admin, admin)
 * @params  {number} id - ID del permiso
 */
// #swagger.tags = ['Permisos']
// #swagger.summary = 'Obtener permiso por ID'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.permisos.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Permisos']
    // #swagger.summary = 'Obtener permiso por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getPermisoById(req, res, next);
  }
);

export default router;
