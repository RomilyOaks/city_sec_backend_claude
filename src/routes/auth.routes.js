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
  changePasswordRequired,
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
// #swagger.tags = ['Auth']
// #swagger.summary = 'Registrar usuario'
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } } }
// #swagger.responses[201] = { description: 'Creado' }
// #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.post("/register", (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Registrar usuario'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } } }
  // #swagger.responses[201] = { description: 'Creado' }
  // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return register(req, res, next);
});

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión y obtener tokens JWT
 * @access  Public
 * @body    {username_or_email, password}
 * @returns {accessToken, refreshToken, usuario}
 */
// #swagger.tags = ['Auth']
// #swagger.summary = 'Login (JWT)'
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } }
// #swagger.responses[200] = { description: 'OK', schema: { $ref: "#/components/schemas/AuthTokensResponse" } }
// #swagger.responses[401] = { description: 'Credenciales incorrectas', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.post("/login", (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Login (JWT)'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } }
  // #swagger.responses[200] = { description: 'OK', schema: { $ref: "#/components/schemas/AuthTokensResponse" } }
  // #swagger.responses[401] = { description: 'Credenciales incorrectas', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return login(req, res, next);
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 * @body    {refreshToken}
 * @returns {accessToken}
 */
// #swagger.tags = ['Auth']
// #swagger.summary = 'Renovar access token'
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TokenRefreshRequest" } } } }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[401] = { description: 'Refresh token inválido', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.post("/refresh", (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Renovar access token'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TokenRefreshRequest" } } } }
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[401] = { description: 'Refresh token inválido', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return refreshToken(req, res, next);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión y revocar tokens
 * @access  Private (requiere autenticación)
 * @headers {Authorization: Bearer <token>}
 */
// #swagger.tags = ['Auth']
// #swagger.summary = 'Logout'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.post("/logout", authenticate, (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Logout'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return logout(req, res, next);
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private (requiere autenticación)
 * @body    {currentPassword, newPassword}
 * @headers {Authorization: Bearer <token>}
 */
// #swagger.tags = ['Auth']
// #swagger.summary = 'Cambiar password'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["currentPassword", "newPassword"], properties: { currentPassword: { type: "string" }, newPassword: { type: "string" } } } } } }
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.post("/change-password", authenticate, (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Cambiar password'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["currentPassword", "newPassword"], properties: { currentPassword: { type: "string" }, newPassword: { type: "string" } } } } } }
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return changePassword(req, res, next);
});

/**
 * @route   POST /api/auth/change-password-required
 * @desc    Cambio obligatorio de contraseña tras reset de admin (sin token).
 *          Valida userId + currentPassword, cambia password y retorna tokens JWT.
 * @access  Public
 * @body    { userId, currentPassword, newPassword }
 * @returns { accessToken, refreshToken, usuario }
 */
router.post("/change-password-required", (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Cambio obligatorio de password (sin token)'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["userId", "currentPassword", "newPassword"], properties: { userId: { type: "integer" }, currentPassword: { type: "string" }, newPassword: { type: "string" } } } } } }
  // #swagger.responses[200] = { description: 'OK - Contraseña cambiada y sesión iniciada' }
  // #swagger.responses[401] = { description: 'Contraseña actual incorrecta' }
  // #swagger.responses[403] = { description: 'Operación no permitida' }
  return changePasswordRequired(req, res, next);
});

/**
 * @route   GET /api/auth/me
 * @desc    Obtener datos del usuario autenticado actual
 * @access  Private (requiere autenticación)
 * @headers {Authorization: Bearer <token>}
 * @returns {usuario con roles y permisos}
 */
// #swagger.tags = ['Auth']
// #swagger.summary = 'Perfil actual (me)'
// #swagger.security = [{ bearerAuth: [] }]
// #swagger.responses[200] = { description: 'OK' }
// #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
router.get("/me", authenticate, (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Perfil actual (me)'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.responses[200] = { description: 'OK' }
  // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
  return getMe(req, res, next);
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar token para recuperar contraseña
 * @access  Public
 * @body    {email}
 */
// #swagger.tags = ['Auth']
// #swagger.summary = 'Solicitar recuperación de contraseña'
// #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", example: "user@example.com" } } } } } }
// #swagger.responses[200] = { description: 'OK' }
router.post("/forgot-password", (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Solicitar recuperación de contraseña'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", example: "user@example.com" } } } } } }
  // #swagger.responses[200] = { description: 'OK' }
  return forgotPassword(req, res, next);
});

/**
 * ============================================
 * RUTA DE DEBUG - authRoutes.js
 * ============================================
 */

// En tu archivo src/routes/auth.routes.js
// Agregar esta ruta:

import { debugToken } from "../controllers/authController.js";

// #swagger.tags = ['Auth']
// #swagger.summary = 'Debug token (dev)'
// #swagger.responses[200] = { description: 'OK' }
router.get("/debug/token", (req, res, next) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Debug token (dev)'
  // #swagger.responses[200] = { description: 'OK' }
  return debugToken(req, res, next);
});

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
