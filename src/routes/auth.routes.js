/**
 * Rutas de Autenticación
 * Endpoints públicos y protegidos para autenticación
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  verificarToken,
  verificarRoles,
  ROLES,
} = require("../middlewares/authMiddleware");

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Público
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Administrador
 */
router.post(
  "/register",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  authController.register
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Privado
 */
router.post("/logout", verificarToken, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get("/me", verificarToken, authController.getProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Privado
 */
router.post("/change-password", verificarToken, authController.changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access  Público
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con código
 * @access  Público
 */
router.post("/reset-password", authController.resetPassword);

module.exports = router;
