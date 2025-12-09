/**
 * Ruta: src/routes/auth.routes.js
 * Descripción: Definición de rutas para autenticación y gestión de usuarios
 * Incluye endpoints para registro, login, logout, renovación de tokens,
 * cambio de contraseña y recuperación de cuenta
 */

import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getMe,
  forgotPassword,
} from "../controllers/authController.js";
import { verificarToken as authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 * @body    {username, email, password, nombres, apellidos, telefono?}
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión y obtener tokens JWT
 * @access  Public
 * @body    {username_or_email, password}
 * @returns {accessToken, refreshToken, usuario}
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 * @body    {refreshToken}
 * @returns {accessToken}
 */
router.post("/refresh", refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión y revocar tokens
 * @access  Private (requiere autenticación)
 * @headers {Authorization: Bearer <token>}
 */
router.post("/logout", authenticate, logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private (requiere autenticación)
 * @body    {currentPassword, newPassword}
 * @headers {Authorization: Bearer <token>}
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener datos del usuario autenticado actual
 * @access  Private (requiere autenticación)
 * @headers {Authorization: Bearer <token>}
 * @returns {usuario con roles y permisos}
 */
router.get("/me", authenticate, getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar token para recuperar contraseña
 * @access  Public
 * @body    {email}
 */
router.post("/forgot-password", forgotPassword);

/**
 * ============================================
 * RUTA DE DEBUG - authRoutes.js
 * ============================================
 */

// En tu archivo src/routes/auth.routes.js
// Agregar esta ruta:

import { debugToken } from "../controllers/authController.js";

router.get("/debug/token", debugToken);

/**
 * TODO: Implementar rutas adicionales:
 *
 * POST /api/auth/reset-password
 * - Resetear contraseña usando token de recuperación
 * - Body: {token, newPassword}
 *
 * POST /api/auth/verify-email
 * - Verificar email del usuario
 * - Body: {token}
 *
 * POST /api/auth/resend-verification
 * - Reenviar email de verificación
 * - Body: {email}
 *
 * POST /api/auth/enable-2fa
 * - Habilitar autenticación de dos factores
 * - Requires: authenticate middleware
 *
 * POST /api/auth/verify-2fa
 * - Verificar código 2FA durante login
 * - Body: {userId, code}
 *
 * POST /api/auth/disable-2fa
 * - Deshabilitar 2FA
 * - Requires: authenticate middleware
 * - Body: {password, code}
 */

export default router;
