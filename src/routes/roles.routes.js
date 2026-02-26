/**
 * ============================================
 * RUTAS: src/routes/roles.routes.js
 * ============================================
 *
 * Definición de rutas para la gestión de roles del sistema RBAC.
 * Los roles agrupan permisos y definen niveles de acceso.
 *
 * IMPORTANTE: Solo super_admin y admin deben tener acceso a estas rutas.
 *
 * Rutas disponibles:
 * - GET    /api/v1/roles                    - Listar roles
 * - GET    /api/v1/roles/:id                - Obtener por ID
 * - GET    /api/v1/roles/:id/permisos       - Permisos del rol
 * - GET    /api/v1/roles/slug/:slug         - Buscar por slug
 * - POST   /api/v1/roles                    - Crear rol
 * - PUT    /api/v1/roles/:id                - Actualizar rol
 * - DELETE /api/v1/roles/:id                - Eliminar rol
 * - POST   /api/v1/roles/:id/permisos       - Asignar permisos
 * - DELETE /api/v1/roles/:id/permisos/:permisoId - Quitar permiso
 */

import express from "express";
import {
  getRoles,
  getRolById,
  getPermisosDeRol,
  getUsuariosDeRol,
  getRolBySlug,
  createRol,
  updateRol,
  deleteRol,
  asignarPermisos,
  quitarPermiso,
} from "../controllers/rolesController.js";

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
 * @route   GET /api/v1/roles
 * @desc    Listar roles con paginación y filtros
 * @access  Private (super_admin, admin)
 * @query   {number} page - Número de página (default: 1)
 * @query   {number} limit - Items por página (default: 10)
 * @query   {boolean} activos - Solo activos (default: true)
 * @query   {boolean} incluir_permisos - Incluir permisos (default: false)
 * @query   {string} search - Búsqueda en nombre o slug
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Listar roles'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
// #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 10 }
// #swagger.parameters['activos'] = { in: 'query', required: false, type: 'boolean', example: true }
// #swagger.parameters['incluir_permisos'] = { in: 'query', required: false, type: 'boolean', example: false }
// #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'admin' }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
// #swagger.responses[403] = { description: 'No autorizado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get("/", verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.read"]), (req, res, next) => {
  // #swagger.tags = ['Roles']
  // #swagger.summary = 'Listar roles'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
  // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 10 }
  // #swagger.parameters['activos'] = { in: 'query', required: false, type: 'boolean', example: true }
  // #swagger.parameters['incluir_permisos'] = { in: 'query', required: false, type: 'boolean', example: false }
  // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'admin' }
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[403] = { description: 'No autorizado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return getRoles(req, res, next);
});

/**
 * @route   GET /api/v1/roles/slug/:slug
 * @desc    Buscar rol por slug
 * @access  Private (super_admin, admin)
 * @params  {string} slug - Slug del rol (ej: super_admin, operador)
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Obtener rol por slug'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['slug'] = { in: 'path', required: true, type: 'string', example: 'super_admin' }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get(
  "/slug/:slug",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Obtener rol por slug'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['slug'] = { in: 'path', required: true, type: 'string', example: 'super_admin' }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getRolBySlug(req, res, next);
  }
);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Obtener rol específico por ID con sus permisos
 * @access  Private (super_admin, admin)
 * @params  {number} id - ID del rol
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Obtener rol por ID'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get("/:id", verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.read"]), (req, res, next) => {
  // #swagger.tags = ['Roles']
  // #swagger.summary = 'Obtener rol por ID'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return getRolById(req, res, next);
});

/**
 * @route   GET /api/v1/roles/:id/permisos
 * @desc    Obtener permisos asignados a un rol
 * @access  Private (super_admin, admin)
 * @params  {number} id - ID del rol
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Listar permisos de un rol'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get(
  "/:id/permisos",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Listar permisos de un rol'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getPermisosDeRol(req, res, next);
  }
);

/**
 * @route   GET /api/v1/roles/:id/usuarios
 * @desc    Obtener usuarios asignados a un rol
 * @access  Private (super_admin, admin)
 * @params  {number} id - ID del rol
 */
router.get(
  "/:id/usuarios",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Listar usuarios de un rol'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getUsuariosDeRol(req, res, next);
  }
);

// ============================================
// RUTAS DE MODIFICACIÓN (CREATE, UPDATE, DELETE)
// ============================================

/**
 * @route   POST /api/v1/roles
 * @desc    Crear nuevo rol
 * @access  Private (super_admin, admin con permiso create)
 * @body    {Object} rol - Datos del rol
 * @body    {string} rol.nombre - Nombre del rol (requerido)
 * @body    {string} rol.slug - Slug único (requerido)
 * @body    {string} [rol.descripcion] - Descripción
 * @body    {number} [rol.nivel_jerarquia] - Nivel jerárquico (default: 5)
 * @body    {string} [rol.color] - Color hex (default: #6B7280)
 * @body    {Array<number>} [rol.permisos] - Array de IDs de permisos
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Crear rol'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RolCreateRequest" } } } }
// #swagger.responses[201] = { description: 'Creado' }
// #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.post("/", verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.create"]), (req, res, next) => {
  // #swagger.tags = ['Roles']
  // #swagger.summary = 'Crear rol'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RolCreateRequest" } } } }
  // #swagger.responses[201] = { description: 'Creado' }
  // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return createRol(req, res, next);
});

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Actualizar rol existente
 * @access  Private (super_admin, admin con permiso update)
 * @params  {number} id - ID del rol
 * @body    {Object} rol - Datos a actualizar
 * @body    {string} [rol.nombre] - Nombre
 * @body    {string} [rol.descripcion] - Descripción
 * @body    {number} [rol.nivel_jerarquia] - Nivel jerárquico
 * @body    {string} [rol.color] - Color hex
 *
 * NOTA: No se pueden editar roles del sistema (es_sistema=true)
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Actualizar rol'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RolUpdateRequest" } } } }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.put("/:id", verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.update"]), (req, res, next) => {
  // #swagger.tags = ['Roles']
  // #swagger.summary = 'Actualizar rol'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RolUpdateRequest" } } } }
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return updateRol(req, res, next);
});

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Eliminar rol (soft delete)
 * @access  Private (super_admin, admin con permiso delete)
 * @params  {number} id - ID del rol
 *
 * ADVERTENCIAS:
 * - No se pueden eliminar roles del sistema
 * - No se pueden eliminar roles con usuarios asignados
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Eliminar rol (soft delete)'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
// #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.delete("/:id", verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles.delete"]), (req, res, next) => {
  // #swagger.tags = ['Roles']
  // #swagger.summary = 'Eliminar rol (soft delete)'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return deleteRol(req, res, next);
});

// ============================================
// RUTAS DE GESTIÓN DE PERMISOS DEL ROL
// ============================================

/**
 * @route   POST /api/v1/roles/:id/permisos
 * @desc    Asignar permisos a un rol (reemplaza los existentes)
 * @access  Private (super_admin, admin con permiso assign)
 * @params  {number} id - ID del rol
 * @body    {Array<number>} permisos - Array de IDs de permisos
 *
 * NOTA: Esta operación REEMPLAZA todos los permisos actuales del rol
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Asignar permisos a rol (reemplaza actuales)'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleAssignPermisosRequest" } } } }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.post(
  "/:id/permisos",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles_permisos.assign"]),
  (req, res, next) => {
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Asignar permisos a rol (reemplaza actuales)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleAssignPermisosRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return asignarPermisos(req, res, next);
  }
);

/**
 * @route   DELETE /api/v1/roles/:id/permisos/:permisoId
 * @desc    Quitar un permiso específico de un rol
 * @access  Private (super_admin, admin con permiso assign)
 * @params  {number} id - ID del rol
 * @params  {number} permisoId - ID del permiso a quitar
 */
// #swagger.tags = ['Roles']
// #swagger.summary = 'Quitar permiso de un rol'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
// #swagger.parameters['permisoId'] = { in: 'path', required: true, type: 'integer', example: 10 }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.delete(
  "/:id/permisos/:permisoId",
  verificarRolesOPermisos(["super_admin", "admin"], ["usuarios.roles_permisos.assign"]),
  (req, res, next) => {
    // #swagger.tags = ['Roles']
    // #swagger.summary = 'Quitar permiso de un rol'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.parameters['permisoId'] = { in: 'path', required: true, type: 'integer', example: 10 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return quitarPermiso(req, res, next);
  }
);

export default router;
