/**
 * Ruta: src/routes/usuarios.routes.js
 * Descripción: Rutas para gestión administrativa de usuarios
 * Todas las rutas requieren autenticación y permisos específicos de administración
 */

import express from "express";
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  resetPassword,
  cambiarEstado,
} from "../controllers/usuariosController.js";
import {
  authenticate,
  requirePermission,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Todas las rutas requieren autenticación
 */
router.use(authenticate);

/**
 * @route   GET /api/usuarios
 * @desc    Listar usuarios con filtros y paginación
 * @access  Private (requiere permiso: usuarios.read)
 * @query   {page, limit, estado, rol, search}
 */
router.get("/", requirePermission("usuarios.read"), getUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario específico por ID
 * @access  Private (requiere permiso: usuarios.read)
 */
router.get("/:id", requirePermission("usuarios.read"), getUsuarioById);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario
 * @access  Private (requiere permiso: usuarios.create)
 * @body    {username, email, password, nombres, apellidos, roles, estado}
 */
router.post("/", requirePermission("usuarios.create"), createUsuario);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario existente
 * @access  Private (requiere permiso: usuarios.update)
 * @body    {nombres, apellidos, telefono, email, estado, roles}
 */
router.put("/:id", requirePermission("usuarios.update"), updateUsuario);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Private (requiere permiso: usuarios.delete)
 */
router.delete("/:id", requirePermission("usuarios.delete"), deleteUsuario);

/**
 * @route   POST /api/usuarios/:id/reset-password
 * @desc    Resetear contraseña de un usuario
 * @access  Private (requiere permiso: usuarios.reset_password)
 * @body    {newPassword}
 */
router.post(
  "/:id/reset-password",
  requireAnyPermission(["usuarios.reset_password", "usuarios.admin"]),
  resetPassword
);

/**
 * @route   PUT /api/usuarios/:id/estado
 * @desc    Cambiar estado de un usuario (ACTIVO/INACTIVO/BLOQUEADO)
 * @access  Private (requiere permiso: usuarios.update_estado)
 * @body    {estado}
 */
router.put(
  "/:id/estado",
  requireAnyPermission(["usuarios.update_estado", "usuarios.admin"]),
  cambiarEstado
);

/**
 * TODO: Rutas adicionales a implementar:
 *
 * GET /api/usuarios/:id/roles
 * - Obtener roles del usuario
 *
 * POST /api/usuarios/:id/roles
 * - Asignar roles al usuario
 * - Body: {roles: [id1, id2, ...]}
 *
 * DELETE /api/usuarios/:id/roles/:rolId
 * - Quitar un rol específico del usuario
 *
 * GET /api/usuarios/:id/permisos
 * - Obtener todos los permisos del usuario (consolidados)
 *
 * POST /api/usuarios/:id/permisos
 * - Asignar permiso directo al usuario
 * - Body: {permiso_id, tipo: 'CONCEDER' | 'DENEGAR'}
 *
 * GET /api/usuarios/:id/sesiones
 * - Obtener sesiones activas del usuario
 *
 * POST /api/usuarios/:id/cerrar-sesiones
 * - Cerrar todas las sesiones activas del usuario
 *
 * GET /api/usuarios/:id/auditoria
 * - Obtener historial de auditoría del usuario
 */

export default router;
