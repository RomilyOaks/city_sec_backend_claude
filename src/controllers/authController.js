/**
 * ===================================================
 * CONTROLADOR: authController.js
 * ===================================================
 *
 * Ruta: src/controllers/authController.js
 *
 * Descripción:
 * Controlador de autenticación y gestión de usuarios del sistema de
 * Seguridad Ciudadana. Maneja login, registro, logout, verificación
 * de email, cambio de contraseña y gestión de tokens JWT.
 *
 * VERSIÓN: 2.1.0 - OPTIMIZADA Y CORREGIDA
 * - ✅ Acepta username, email o username_or_email en login
 * - ✅ Validación flexible de credenciales
 * - ✅ Mejor manejo de errores
 * - ✅ Logs de debugging mejorados
 * - ✅ Documentación JSDoc completa
 * - ✅ Validaciones robustas
 *
 * Características:
 * - Autenticación con JWT (Access + Refresh tokens)
 * - Control de intentos fallidos de login
 * - Bloqueo temporal de usuarios tras múltiples intentos
 * - Registro de nuevos usuarios con asignación de roles
 * - Cambio y recuperación de contraseña
 * - Gestión de sesiones y tokens
 * - Integración con sistema RBAC
 *
 * @module controllers/authController
 * @requires bcryptjs
 * @requires jsonwebtoken
 * @requires sequelize
 * @author Sistema de Seguridad Ciudadana
 * @version 2.1.0
 * @date 2025-12-12
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario, Rol, Permiso } from "../models/index.js";
import { Op } from "sequelize";

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

/**
 * Número máximo de intentos fallidos antes de bloquear
 * @constant {number}
 */
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

/**
 * Tiempo de bloqueo tras exceder intentos
 * Formato: "15m" = 15 minutos
 * @constant {string}
 */
const LOCK_TIME = process.env.LOCK_TIME || "15m";

/**
 * Longitud mínima de contraseña
 * @constant {number}
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Duración del access token
 * @constant {string}
 */
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || "2h";

/**
 * Duración del refresh token
 * @constant {string}
 */
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || "7d";

/**
 * Convierte el formato de tiempo (15m, 2h) a milisegundos
 * @private
 * @param {string} timeStr - Tiempo en formato "15m" o "2h"
 * @returns {number} Tiempo en milisegundos
 */
const parseTimeToMilliseconds = (timeStr) => {
  const match = timeStr.match(/^(\d+)([mh])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutos

  const value = parseInt(match[1]);
  const unit = match[2];

  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;

  return 15 * 60 * 1000;
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Valida que las variables de entorno JWT estén configuradas
 * @private
 * @throws {Error} Si falta alguna variable crítica
 */
const validarConfiguracionJWT = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado en variables de entorno");
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT_REFRESH_SECRET no está configurado en variables de entorno"
    );
  }
};

/**
 * Extrae permisos únicos de los roles de un usuario
 * @private
 * @param {Array} roles - Array de roles del usuario
 * @returns {Array} Array de slugs de permisos únicos
 */
const extraerPermisos = (roles) => {
  const permisos = [];
  if (roles) {
    roles.forEach((rol) => {
      if (rol.permisos) {
        rol.permisos.forEach((permiso) => {
          if (!permisos.includes(permiso.slug)) {
            permisos.push(permiso.slug);
          }
        });
      }
    });
  }
  return permisos;
};

/**
 * Normaliza una credencial (username o email) a minúsculas
 * @private
 * @param {string} credencial - Credencial a normalizar
 * @returns {string} Credencial en minúsculas
 */
const normalizarCredencial = (credencial) => {
  return credencial ? credencial.trim().toLowerCase() : "";
};

// ==========================================
// ENDPOINT: REGISTRO DE USUARIO
// ==========================================

/**
 * POST /api/v1/auth/register
 * Registra un nuevo usuario en el sistema
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del nuevo usuario
 * @param {string} req.body.username - Nombre de usuario único
 * @param {string} req.body.email - Email único
 * @param {string} req.body.password - Contraseña (mín. 8 caracteres)
 * @param {string} [req.body.nombres] - Nombres del usuario
 * @param {string} [req.body.apellidos] - Apellidos del usuario
 * @param {string} [req.body.telefono] - Teléfono del usuario
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con datos del usuario creado
 *
 * @example
 * // Request
 * POST /api/v1/auth/register
 * {
 *   "username": "jperez",
 *   "email": "jperez@example.com",
 *   "password": "SecurePass123!",
 *   "nombres": "Juan",
 *   "apellidos": "Pérez García"
 * }
 *
 * // Response 201
 * {
 *   "success": true,
 *   "message": "Usuario registrado exitosamente",
 *   "data": {
 *     "id": 1,
 *     "username": "jperez",
 *     "email": "jperez@example.com"
 *   }
 * }
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, nombres, apellidos, telefono } =
      req.body;

    // ==========================================
    // VALIDACIONES
    // ==========================================

    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email y password son requeridos",
      });
    }

    // Validar longitud de contraseña
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Formato de email inválido",
      });
    }

    // ==========================================
    // VERIFICAR UNICIDAD
    // ==========================================

    // Verificar si el usuario ya existe (por username o email)
    const usuarioExistente = await Usuario.findOne({
      where: {
        [Op.or]: [
          { username: normalizarCredencial(username) },
          { email: normalizarCredencial(email) },
        ],
      },
    });

    if (usuarioExistente) {
      const campoExistente =
        usuarioExistente.username === normalizarCredencial(username)
          ? "username"
          : "email";
      return res.status(400).json({
        success: false,
        message: `El ${campoExistente} ya está registrado`,
      });
    }

    // ==========================================
    // CREAR USUARIO
    // ==========================================

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario
    const nuevoUsuario = await Usuario.create({
      username: normalizarCredencial(username),
      email: normalizarCredencial(email),
      password_hash,
      nombres: nombres || null,
      apellidos: apellidos || null,
      telefono: telefono || null,
      estado: "ACTIVO", // Cambiar a PENDIENTE si requieres verificación de email
      oauth_provider: "LOCAL",
    });

    // ==========================================
    // ASIGNAR ROL POR DEFECTO
    // ==========================================

    // Buscar el rol por defecto
    const rolBasico = await Rol.findOne({
      where: { slug: "operador" }, // Cambiar según tu lógica de negocio
    });

    // Asignar rol por defecto al usuario
    if (rolBasico) {
      await nuevoUsuario.addRoles([rolBasico]);
    }

    // TODO: Enviar email de verificación aquí
    // await enviarEmailVerificacion(nuevoUsuario.email);

    // ==========================================
    // RESPUESTA EXITOSA
    // ==========================================

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        nombres: nuevoUsuario.nombres,
        apellidos: nuevoUsuario.apellidos,
      },
    });
  } catch (error) {
    console.error("❌ Error en register:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ENDPOINT: LOGIN
// ==========================================

/**
 * POST /api/v1/auth/login
 * Autentica un usuario y genera tokens JWT
 *
 * ✅ MEJORADO: Acepta username, email o username_or_email
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Credenciales del usuario
 * @param {string} [req.body.username] - Nombre de usuario
 * @param {string} [req.body.email] - Email del usuario
 * @param {string} [req.body.username_or_email] - Username o email
 * @param {string} req.body.password - Contraseña
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con tokens y datos del usuario
 *
 * @example
 * // Request (opción 1 - usando username)
 * POST /api/v1/auth/login
 * {
 *   "username": "admin",
 *   "password": "Admin123!"
 * }
 *
 * // Request (opción 2 - usando email)
 * POST /api/v1/auth/login
 * {
 *   "email": "admin@example.com",
 *   "password": "Admin123!"
 * }
 *
 * // Request (opción 3 - usando username_or_email)
 * POST /api/v1/auth/login
 * {
 *   "username_or_email": "admin",
 *   "password": "Admin123!"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Login exitoso",
 *   "data": {
 *     "accessToken": "eyJhbG...",
 *     "refreshToken": "eyJhbG...",
 *     "usuario": {
 *       "id": 1,
 *       "username": "admin",
 *       "roles": ["super_admin"],
 *       "permisos": ["ALL"]
 *     }
 *   }
 * }
 */
export const login = async (req, res) => {
  try {
    // ==========================================
    // VALIDACIÓN DE CONFIGURACIÓN
    // ==========================================

    try {
      validarConfiguracionJWT();
    } catch (error) {
      console.error("❌ ERROR CRÍTICO:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error de configuración del servidor",
        error: "Contacte al administrador",
      });
    }

    // ==========================================
    // EXTRACCIÓN DE DATOS
    // ==========================================

    // ✅ MEJORADO: Acepta múltiples formatos de credenciales
    const { username_or_email, username, email, password } = req.body;

    // Obtener la credencial (prioridad: username_or_email > username > email)
    const credencial = username_or_email || username || email;

    // Información de la solicitud
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers["user-agent"];

    // ==========================================
    // VALIDACIONES
    // ==========================================

    // Validar que se haya proporcionado una credencial
    if (!credencial) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar username o email",
      });
    }

    // Validar que se haya proporcionado contraseña
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "La contraseña es requerida",
      });
    }

    // ==========================================
    // BÚSQUEDA DEL USUARIO
    // ==========================================

    // Buscar usuario por username o email
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { username: normalizarCredencial(credencial) },
          { email: normalizarCredencial(credencial) },
        ],
      },
      include: [
        {
          model: Rol,
          as: "roles",
          through: {
            attributes: [],
            where: { estado: 1 },
          },
          include: [
            {
              model: Permiso,
              as: "permisos",
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    // Usuario no encontrado
    if (!usuario) {
      // TODO: Registrar intento fallido en login_intentos
      console.log(
        `⚠️  Intento de login fallido: Usuario no encontrado - ${credencial}`
      );
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    // ==========================================
    // VERIFICACIONES DE ESTADO
    // ==========================================

    // Verificar si el usuario está bloqueado temporalmente
    if (usuario.locked_until && new Date() < new Date(usuario.locked_until)) {
      const minutosRestantes = Math.ceil(
        (new Date(usuario.locked_until) - new Date()) / 60000
      );
      return res.status(403).json({
        success: false,
        message: `Usuario bloqueado temporalmente. Intente nuevamente en ${minutosRestantes} minutos.`,
      });
    }

    // Verificar si el usuario está activo
    if (usuario.estado !== "ACTIVO") {
      console.log(
        `⚠️  Intento de login con usuario ${usuario.estado}: ${credencial}`
      );
      return res.status(403).json({
        success: false,
        message: `Usuario ${usuario.estado.toLowerCase()}. Contacte al administrador.`,
      });
    }

    // ==========================================
    // VERIFICACIÓN DE CONTRASEÑA
    // ==========================================

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValido) {
      // Incrementar intentos fallidos
      const nuevosIntentos = usuario.failed_login_attempts + 1;
      const datosActualizacion = {
        failed_login_attempts: nuevosIntentos,
      };

      // Bloquear después de MAX_LOGIN_ATTEMPTS intentos
      if (nuevosIntentos >= MAX_LOGIN_ATTEMPTS) {
        const lockTimeMs = parseTimeToMilliseconds(LOCK_TIME);
        datosActualizacion.locked_until = new Date(Date.now() + lockTimeMs);
      }

      await usuario.update(datosActualizacion);

      console.log(
        `⚠️  Intento ${nuevosIntentos} de login fallido para: ${credencial}`
      );

      // TODO: Registrar intento fallido en login_intentos

      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
        intentosRestantes:
          nuevosIntentos >= MAX_LOGIN_ATTEMPTS
            ? 0
            : MAX_LOGIN_ATTEMPTS - nuevosIntentos,
      });
    }

    // ==========================================
    // LOGIN EXITOSO
    // ==========================================

    // Resetear intentos fallidos y actualizar última conexión
    await usuario.update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date(),
      last_login_ip: ip_address,
      last_activity_at: new Date(),
    });

    console.log(`✅ Login exitoso: ${usuario.username} (ID: ${usuario.id})`);

    // TODO: Registrar login exitoso en login_intentos y auditoria_acciones

    // ==========================================
    // VERIFICAR CAMBIO DE CONTRASEÑA
    // ==========================================

    // Verificar si debe cambiar contraseña
    if (usuario.require_password_change) {
      return res.json({
        success: true,
        requirePasswordChange: true,
        message: "Debe cambiar su contraseña antes de continuar",
        userId: usuario.id,
      });
    }

    // ==========================================
    // PREPARAR DATOS DEL TOKEN
    // ==========================================

    // Extraer permisos únicos
    const permisos = extraerPermisos(usuario.roles);

    // Generar payload del JWT
    const payload = {
      userId: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles.map((r) => r.slug),
      permisos: permisos,
    };

    // ==========================================
    // GENERAR TOKENS
    // ==========================================

    // Generar Access Token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRATION,
    });

    // Generar Refresh Token
    const refreshToken = jwt.sign(
      { userId: usuario.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    console.log(`🔑 Tokens generados para usuario: ${usuario.username}`);

    // TODO: Guardar refresh token en la tabla tokens_acceso

    // ==========================================
    // RESPUESTA EXITOSA
    // ==========================================

    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        accessToken,
        refreshToken,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          foto_perfil: usuario.foto_perfil,
          roles: usuario.roles.map((r) => ({
            id: r.id,
            nombre: r.nombre,
            slug: r.slug,
            color: r.color,
          })),
          permisos: permisos,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ENDPOINT: REFRESH TOKEN
// ==========================================

/**
 * POST /api/v1/auth/refresh
 * Renueva el access token usando el refresh token
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del refresh
 * @param {string} req.body.refreshToken - Refresh token válido
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con nuevo access token
 *
 * @example
 * // Request
 * POST /api/v1/auth/refresh
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Validar que se haya proporcionado el refresh token
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token requerido",
      });
    }

    // ==========================================
    // VERIFICAR REFRESH TOKEN
    // ==========================================

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      console.log("⚠️  Refresh token inválido o expirado");
      return res.status(401).json({
        success: false,
        message: "Refresh token inválido o expirado",
      });
    }

    // ==========================================
    // BUSCAR USUARIO
    // ==========================================

    // Buscar usuario con sus roles y permisos
    const usuario = await Usuario.findByPk(decoded.userId, {
      include: [
        {
          model: Rol,
          as: "roles",
          through: {
            attributes: [],
            where: { estado: 1 },
          },
          include: [
            {
              model: Permiso,
              as: "permisos",
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    // Validar que el usuario exista y esté activo
    if (!usuario || usuario.estado !== "ACTIVO") {
      return res.status(401).json({
        success: false,
        message: "Usuario no válido",
      });
    }

    // TODO: Verificar que el refresh token exista en tokens_acceso y no esté revocado

    // ==========================================
    // GENERAR NUEVO ACCESS TOKEN
    // ==========================================

    // Extraer permisos
    const permisos = extraerPermisos(usuario.roles);

    // Generar payload
    const payload = {
      userId: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles.map((r) => r.slug),
      permisos: permisos,
    };

    // Generar nuevo access token
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRATION,
    });

    console.log(`🔄 Access token renovado para: ${usuario.username}`);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error("❌ Error en refreshToken:", error);
    res.status(500).json({
      success: false,
      message: "Error al renovar token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ENDPOINT: LOGOUT
// ==========================================

/**
 * POST /api/v1/auth/logout
 * Cierra la sesión del usuario y revoca sus tokens
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.usuario - Usuario autenticado (del middleware)
 * @param {Object} res - Response de Express
 * @returns {Object} JSON confirmando logout
 *
 * @example
 * // Request
 * POST /api/v1/auth/logout
 * Headers: { Authorization: "Bearer eyJhbGci..." }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Logout exitoso"
 * }
 */
export const logout = async (req, res) => {
  try {
    const userId = req.usuario.userId;

    console.log(`👋 Logout de usuario ID: ${userId}`);

    // TODO: Revocar tokens en la tabla tokens_acceso
    // TODO: Eliminar sesión activa en la tabla sesiones
    // TODO: Registrar logout en auditoria_acciones

    res.json({
      success: true,
      message: "Logout exitoso",
    });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    res.status(500).json({
      success: false,
      message: "Error al cerrar sesión",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ENDPOINT: CAMBIAR CONTRASEÑA
// ==========================================

/**
 * POST /api/v1/auth/change-password
 * Cambia la contraseña del usuario autenticado
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.usuario - Usuario autenticado
 * @param {Object} req.body - Datos del cambio
 * @param {string} req.body.currentPassword - Contraseña actual
 * @param {string} req.body.newPassword - Nueva contraseña
 * @param {Object} res - Response de Express
 * @returns {Object} JSON confirmando cambio de contraseña
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.usuario.userId;
    const { currentPassword, newPassword } = req.body;

    // ==========================================
    // VALIDACIONES
    // ==========================================

    // Validar campos requeridos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual y nueva contraseña son requeridas",
      });
    }

    // Validar longitud mínima de la nueva contraseña
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      });
    }

    // Validar que las contraseñas no sean iguales
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe ser diferente a la actual",
      });
    }

    // ==========================================
    // BUSCAR USUARIO
    // ==========================================

    const usuario = await Usuario.findByPk(userId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // ==========================================
    // VERIFICAR CONTRASEÑA ACTUAL
    // ==========================================

    const passwordValido = await bcrypt.compare(
      currentPassword,
      usuario.password_hash
    );

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: "Contraseña actual incorrecta",
      });
    }

    // TODO: Verificar que la nueva contraseña no esté en el historial
    // (consultar password_historial)

    // ==========================================
    // ACTUALIZAR CONTRASEÑA
    // ==========================================

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await usuario.update({
      password_hash: newPasswordHash,
      password_changed_at: new Date(),
      require_password_change: false,
      updated_by: userId,
    });

    console.log(`🔐 Contraseña cambiada para usuario: ${usuario.username}`);

    res.json({
      success: true,
      message: "Contraseña cambiada exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en changePassword:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar contraseña",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ENDPOINT: PERFIL DEL USUARIO
// ==========================================

/**
 * GET /api/v1/auth/profile
 * Obtiene los datos del usuario autenticado actual
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.usuario - Usuario autenticado
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con datos completos del usuario
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.usuario.userId;

    // ==========================================
    // BUSCAR USUARIO CON RELACIONES
    // ==========================================

    const usuario = await Usuario.findByPk(userId, {
      attributes: {
        exclude: [
          "password_hash",
          "two_factor_secret",
          "oauth_token",
          "oauth_refresh_token",
        ],
      },
      include: [
        {
          model: Rol,
          as: "roles",
          through: {
            attributes: [],
            where: { estado: 1 },
          },
          attributes: ["id", "nombre", "slug", "color", "nivel_jerarquia"],
          include: [
            {
              model: Permiso,
              as: "permisos",
              through: { attributes: [] },
              attributes: ["id", "slug", "modulo", "recurso", "accion"],
            },
          ],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // ==========================================
    // PREPARAR PERMISOS ÚNICOS
    // ==========================================

    const permisos = [];
    if (usuario.roles) {
      usuario.roles.forEach((rol) => {
        if (rol.permisos) {
          rol.permisos.forEach((permiso) => {
            if (!permisos.find((p) => p.slug === permiso.slug)) {
              permisos.push({
                slug: permiso.slug,
                modulo: permiso.modulo,
                recurso: permiso.recurso,
                accion: permiso.accion,
              });
            }
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...usuario.toJSON(),
        permisos,
      },
    });
  } catch (error) {
    console.error("❌ Error en getMe:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del usuario",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ENDPOINT: RECUPERAR CONTRASEÑA
// ==========================================

/**
 * POST /api/v1/auth/forgot-password
 * Solicita un token para recuperar contraseña
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos de recuperación
 * @param {string} req.body.email - Email del usuario
 * @param {Object} res - Response de Express
 * @returns {Object} JSON confirmando envío de instrucciones
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email es requerido",
      });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({
      where: { email: normalizarCredencial(email) },
    });

    // Por seguridad, siempre respondemos lo mismo aunque el usuario no exista
    if (!usuario) {
      console.log(
        `⚠️  Solicitud de recuperación para email no existente: ${email}`
      );
      return res.json({
        success: true,
        message:
          "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
      });
    }

    console.log(
      `📧 Solicitud de recuperación de contraseña para: ${usuario.username}`
    );

    // TODO: Generar token de recuperación
    // TODO: Guardar en password_resets
    // TODO: Enviar email con el link de recuperación

    res.json({
      success: true,
      message:
        "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
    });
  } catch (error) {
    console.error("❌ Error en forgotPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar solicitud",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// ENDPOINT DE DEBUG (SOLO DESARROLLO)
// ==========================================

/**
 * GET /api/v1/auth/debug-token
 * Endpoint de debugging para verificar tokens y permisos
 * SOLO DEBE ESTAR ACTIVO EN DESARROLLO
 *
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con información de debug
 */
export const debugToken = async (req, res) => {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({
      success: false,
      message: "Endpoint no disponible",
    });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No se proporcionó token",
      });
    }

    const token = authHeader.substring(7);

    // Decodificar sin verificar (solo para debug)
    const decoded = jwt.decode(token);

    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Token inválido - no se pudo decodificar",
      });
    }

    // Buscar el usuario en la BD
    const usuario = await Usuario.findByPk(decoded.userId, {
      attributes: ["id", "username", "email", "estado"],
      include: [
        {
          model: Rol,
          as: "roles",
          through: {
            attributes: ["es_principal", "estado"],
            where: { estado: 1 },
          },
          required: false,
          include: [
            {
              model: Permiso,
              as: "permisos",
              attributes: ["id", "slug"],
              through: { attributes: [] },
              required: false,
            },
          ],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado en la base de datos",
        decoded_token: decoded,
        user_id_from_token: decoded.userId,
      });
    }

    res.status(200).json({
      success: true,
      debug: {
        token_decoded: decoded,
        usuario_encontrado: true,
        usuario_data: usuario,
        roles_count: usuario.roles?.length || 0,
        roles: usuario.roles || [],
        permisos_total:
          usuario.roles?.reduce(
            (acc, rol) => acc + (rol.permisos?.length || 0),
            0
          ) || 0,
      },
    });
  } catch (error) {
    console.error("❌ Error en debug:", error);
    res.status(500).json({
      success: false,
      message: "Error en debug",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// ==========================================
// EXPORTACIONES
// ==========================================

export default {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getMe,
  forgotPassword,
  debugToken,
};
