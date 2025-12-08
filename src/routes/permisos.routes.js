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
  createPermiso,
  updatePermiso,
  deletePermiso,
  cambiarEstado,
} from "../controllers/permisosController.js";

import {
  verificarToken,
  verificarRoles as requireRole,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Middleware de autenticación y rol
 * Todas las rutas requieren ser super_admin o admin
 */
router.use(verificarToken);
router.use(requireRole(["super_admin", "admin"]));

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
router.get("/", requireAnyPermission("usuarios.permisos.read"), getPermisos);

/**
 * @route   GET /api/v1/permisos/modulo/:modulo
 * @desc    Obtener permisos de un módulo específico
 * @access  Private (super_admin, admin)
 * @params  {string} modulo - Nombre del módulo
 */
router.get(
  "/modulo/:modulo",
  requireAnyPermission("usuarios.permisos.read"),
  getPermisosByModulo
);

/**
 * @route   GET /api/v1/permisos/slug/:slug
 * @desc    Buscar permiso por slug
 * @access  Private (super_admin, admin)
 * @params  {string} slug - Slug del permiso (ej: usuarios.usuarios.create)
 */
router.get(
  "/slug/:slug",
  requireAnyPermission("usuarios.permisos.read"),
  getPermisoBySlug
);

/**
 * @route   GET /api/v1/permisos/:id
 * @desc    Obtener permiso específico por ID
 * @access  Private (super_admin, admin)
 * @params  {number} id - ID del permiso
 */
router.get(
  "/:id",
  requireAnyPermission("usuarios.permisos.read"),
  getPermisoById
);

// ============================================
// RUTAS DE MODIFICACIÓN (CREATE, UPDATE, DELETE)
// ============================================

/**
 * @route   POST /api/v1/permisos
 * @desc    Crear nuevo permiso
 * @access  Private (super_admin, admin con permiso create)
 * @body    {Object} permiso - Datos del permiso
 * @body    {string} permiso.modulo - Módulo (requerido)
 * @body    {string} permiso.recurso - Recurso (requerido)
 * @body    {string} permiso.accion - Acción (requerido)
 * @body    {string} [permiso.descripcion] - Descripción
 */
router.post(
  "/",
  requireAnyPermission("usuarios.permisos.create"),
  createPermiso
);

/**
 * @route   PUT /api/v1/permisos/:id
 * @desc    Actualizar permiso existente
 * @access  Private (super_admin, admin con permiso update)
 * @params  {number} id - ID del permiso
 * @body    {Object} permiso - Datos a actualizar
 * @body    {string} [permiso.descripcion] - Descripción
 *
 * NOTA: Solo se puede actualizar la descripción.
 *       No se puede cambiar módulo, recurso o acción de un permiso existente.
 */
router.put(
  "/:id",
  requireAnyPermission("usuarios.permisos.update"),
  updatePermiso
);

/**
 * @route   DELETE /api/v1/permisos/:id
 * @desc    Eliminar permiso (permanente)
 * @access  Private (super_admin, admin con permiso delete)
 * @params  {number} id - ID del permiso
 *
 * ADVERTENCIA: No se pueden eliminar permisos del sistema (es_sistema=true)
 */
router.delete(
  "/:id",
  requireAnyPermission("usuarios.permisos.delete"),
  deletePermiso
);

/**
 * @route   PATCH /api/v1/permisos/:id/estado
 * @desc    Activar o desactivar permiso
 * @access  Private (super_admin, admin con permiso update)
 * @params  {number} id - ID del permiso
 * @body    {boolean} estado - true para activar, false para desactivar
 *
 * NOTA: Los permisos inactivos no se pueden asignar a roles.
 */
router.patch(
  "/:id/estado",
  requireAnyPermission("usuarios.permisos.update"),
  cambiarEstado
);

export default router;
