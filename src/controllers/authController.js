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
import crypto from "crypto";
import { Usuario, Rol, Permiso, UsuarioRol, LoginIntento, TokenAcceso, Sesion } from "../models/index.js";
import PasswordReset from "../models/PasswordReset.js";
import PasswordHistorial from "../models/PasswordHistorial.js";
import { enviarEmailRecuperacionPassword } from "../services/emailService.js";
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
// HELPERS DE SEGURIDAD (Sprint 1)
// ==========================================

/**
 * Genera SHA-256 de un token para almacenamiento seguro (nunca guardar en claro)
 * @param {string} token
 * @returns {string} hash hex
 */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Convierte duración de expiración JWT ("2h", "7d", "15m") a milisegundos
 * @param {string} timeStr
 * @returns {number}
 */
const parseJwtExpToMs = (timeStr = "7d") => {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7 días
  const val = parseInt(match[1]);
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * (units[match[2]] || 86_400_000);
};

/**
 * Detecta tipo de dispositivo desde el User-Agent
 * @param {string} userAgent
 * @returns {"DESKTOP"|"MOBILE"|"TABLET"|"OTHER"}
 */
const detectarDispositivo = (userAgent = "") => {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "TABLET";
  if (/mobile|android|iphone|ipod/.test(ua)) return "MOBILE";
  if (/windows|macintosh|linux|x11/.test(ua)) return "DESKTOP";
  return "OTHER";
};

/**
 * Registra un intento de login (fire-and-forget — nunca bloquea el flujo principal)
 * @param {Object} data
 */
const registrarIntentoLogin = async (data) => {
  try {
    await LoginIntento.create(data);
  } catch (err) {
    console.error("⚠️  No se pudo registrar intento de login:", err.message);
  }
};

/**
 * Guarda un refresh token en tokens_acceso (fire-and-forget)
 * @param {Object} data
 */
const guardarRefreshToken = async (data) => {
  try {
    await TokenAcceso.create({ token_type: "REFRESH", ...data });
  } catch (err) {
    console.error("⚠️  No se pudo guardar refresh token:", err.message);
  }
};

/**
 * Crea una sesión activa en la tabla sesiones (fire-and-forget)
 * @param {Object} data
 */
const crearSesion = async (data) => {
  try {
    await Sesion.create(data);
  } catch (err) {
    console.error("⚠️  No se pudo crear sesión:", err.message);
  }
};

/**
 * Calcula la duración del bloqueo según cuántas veces ha sido bloqueado el usuario.
 * Bloqueo progresivo: 5m → 15m → 1h → 24h
 * @param {number} bloqueoCount - Valor actual de bloqueos_acumulados (antes de incrementar)
 * @returns {number} Duración en milisegundos
 */
const calcularDuracionBloqueo = (bloqueoCount) => {
  const duraciones = [
    5 * 60 * 1000,       // 1er bloqueo: 5 min
    15 * 60 * 1000,      // 2do: 15 min
    60 * 60 * 1000,      // 3ro: 1 hora
    24 * 60 * 60 * 1000, // 4to en adelante: 24 horas
  ];
  return duraciones[Math.min(bloqueoCount, duraciones.length - 1)];
};

/**
 * Formatea milisegundos restantes en texto legible para el usuario
 * @param {number} ms
 * @returns {string}
 */
const formatearTiempoRestante = (ms) => {
  const minutos = Math.ceil(ms / 60000);
  if (minutos < 60) return `${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  const horas = Math.ceil(minutos / 60);
  return `${horas} hora${horas !== 1 ? "s" : ""}`;
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
      await UsuarioRol.create({
        usuario_id: nuevoUsuario.id,
        rol_id: rolBasico.id,
        created_by: nuevoUsuario.id,
        updated_by: nuevoUsuario.id,
        fecha_asignacion: new Date(),
      });
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
      registrarIntentoLogin({
        username_or_email: credencial,
        ip_address,
        user_agent,
        intento_exitoso: 0,
        razon_fallo: "usuario_no_encontrado",
      });
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
      const msRestantes = new Date(usuario.locked_until) - new Date();
      return res.status(403).json({
        success: false,
        message: `Usuario bloqueado temporalmente. Intente nuevamente en ${formatearTiempoRestante(msRestantes)}.`,
        lockout_count: usuario.bloqueos_acumulados || 0,
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

      // Bloqueo progresivo al alcanzar MAX_LOGIN_ATTEMPTS
      if (nuevosIntentos >= MAX_LOGIN_ATTEMPTS) {
        const bloqueoActual = usuario.bloqueos_acumulados || 0;
        const duracionMs = calcularDuracionBloqueo(bloqueoActual);
        datosActualizacion.locked_until = new Date(Date.now() + duracionMs);
        datosActualizacion.bloqueos_acumulados = bloqueoActual + 1;
        datosActualizacion.failed_login_attempts = 0; // reinicia ciclo de intentos

        await usuario.update(datosActualizacion);

        console.log(
          `🔒 Usuario ${credencial} bloqueado por ${formatearTiempoRestante(duracionMs)} (bloqueo #${bloqueoActual + 1})`
        );

        registrarIntentoLogin({
          username_or_email: credencial,
          ip_address,
          user_agent,
          intento_exitoso: 0,
          razon_fallo: "password_incorrecto",
          usuario_id: usuario.id,
        });

        return res.status(403).json({
          success: false,
          message: `Acceso bloqueado por demasiados intentos fallidos. Intente nuevamente en ${formatearTiempoRestante(duracionMs)}.`,
          lockout_count: bloqueoActual + 1,
        });
      }

      await usuario.update(datosActualizacion);

      console.log(
        `⚠️  Intento ${nuevosIntentos} de login fallido para: ${credencial}`
      );

      registrarIntentoLogin({
        username_or_email: credencial,
        ip_address,
        user_agent,
        intento_exitoso: 0,
        razon_fallo: "password_incorrecto",
        usuario_id: usuario.id,
      });

      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
        intentosRestantes: MAX_LOGIN_ATTEMPTS - nuevosIntentos,
      });
    }

    // ==========================================
    // LOGIN EXITOSO
    // ==========================================

    // Resetear intentos fallidos, bloqueo progresivo y actualizar última conexión
    await usuario.update({
      failed_login_attempts: 0,
      locked_until: null,
      bloqueos_acumulados: 0,
      last_login_at: new Date(),
      last_login_ip: ip_address,
      last_activity_at: new Date(),
    });

    console.log(`✅ Login exitoso: ${usuario.username} (ID: ${usuario.id})`);

    // ✅ Registrar login exitoso en login_intentos
    registrarIntentoLogin({
      username_or_email: credencial,
      ip_address,
      user_agent,
      intento_exitoso: 1,
      usuario_id: usuario.id,
    });

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

    // Generar JTI único para el refresh token (permite revocación individual)
    const jti = crypto.randomUUID();

    // Generar Refresh Token (incluye jti para trazabilidad)
    const refreshToken = jwt.sign(
      { userId: usuario.id, jti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    console.log(`🔑 Tokens generados para usuario: ${usuario.username}`);

    // ✅ Guardar refresh token en tokens_acceso
    const refreshExpiresAt = new Date(Date.now() + parseJwtExpToMs(JWT_REFRESH_EXPIRATION));
    guardarRefreshToken({
      usuario_id: usuario.id,
      token_hash: hashToken(refreshToken),
      jti,
      client_ip: ip_address,
      user_agent,
      expires_at: refreshExpiresAt,
    });

    // ✅ Crear sesión activa en sesiones
    crearSesion({
      usuario_id: usuario.id,
      session_id: crypto.randomUUID(),
      ip_address,
      user_agent,
      device_type: detectarDispositivo(user_agent),
      expires_at: refreshExpiresAt,
      is_current: 1,
    });

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
          personal_seguridad_id: usuario.personal_seguridad_id,
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
 *   "refreshToken": "ACCESS_TOKEN_EXAMPLE"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "ACCESS_TOKEN_EXAMPLE"
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

    // ✅ Verificar que el refresh token no esté revocado en tokens_acceso
    // Solo aplica a tokens emitidos después de Sprint 1 (llevan jti en el payload)
    if (decoded.jti) {
      const tokenRecord = await TokenAcceso.findOne({
        where: { jti: decoded.jti, revoked_at: null },
      });
      if (!tokenRecord) {
        console.log(`⛔ Refresh token revocado o no registrado — jti: ${decoded.jti}`);
        return res.status(401).json({
          success: false,
          message: "Refresh token revocado o inválido",
        });
      }
    }

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
 * Headers: { Authorization: "Bearer ACCESS_TOKEN_EXAMPLE" }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Logout exitoso"
 * }
 */
export const logout = async (req, res) => {
  try {
    // El middleware verificarToken setea req.user (compatibilidad con patrón legacy req.usuario)
    const userId = req.user?.id || req.usuario?.userId || req.usuario?.id;

    console.log(`👋 Logout de usuario ID: ${userId}`);

    // ✅ Revocar todos los refresh tokens activos del usuario
    try {
      const revocados = await TokenAcceso.update(
        {
          revoked_at: new Date(),
          revocation_reason: "logout",
        },
        {
          where: {
            usuario_id: userId,
            revoked_at: null,
          },
        }
      );
      console.log(`🔒 Tokens revocados: ${revocados[0]} registro(s)`);
    } catch (err) {
      console.error("⚠️  Error al revocar tokens:", err.message);
    }

    // ✅ Cerrar todas las sesiones activas del usuario
    try {
      const cerradas = await Sesion.update(
        { is_current: 0 },
        {
          where: {
            usuario_id: userId,
            is_current: 1,
          },
        }
      );
      console.log(`🚪 Sesiones cerradas: ${cerradas[0]} registro(s)`);
    } catch (err) {
      console.error("⚠️  Error al cerrar sesiones:", err.message);
    }

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
    // Compatibilidad: req.user (middleware actual) o req.usuario (legacy)
    const userId = req.user?.id || req.usuario?.userId || req.usuario?.id;
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
    const bufCurrent = Buffer.from(currentPassword);
    const bufNew = Buffer.from(newPassword);
    const samePassword =
      bufCurrent.length === bufNew.length &&
      crypto.timingSafeEqual(bufCurrent, bufNew);
    if (samePassword) {
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

    // Verificar que la nueva contraseña no esté en el historial (últimas 5)
    const HISTORIAL_LIMITE = 5;
    const historial = await PasswordHistorial.findAll({
      where: { usuario_id: userId },
      order: [["created_at", "DESC"]],
      limit: HISTORIAL_LIMITE,
    });
    for (const h of historial) {
      const repetida = await bcrypt.compare(newPassword, h.password_hash);
      if (repetida) {
        return res.status(400).json({
          success: false,
          message: `La nueva contraseña no puede ser igual a las últimas ${HISTORIAL_LIMITE} contraseñas usadas`,
        });
      }
    }

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

    // Guardar en historial (fire-and-forget)
    PasswordHistorial.create({ usuario_id: userId, password_hash: newPasswordHash }).catch(() => {});

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
    const userId = req.user.id;

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
// ENDPOINT: CAMBIO OBLIGATORIO DE CONTRASEÑA (sin token)
// ==========================================

/**
 * POST /api/v1/auth/change-password-required
 * Cambia la contraseña cuando el backend exige cambio obligatorio.
 * El usuario aún NO tiene token JWT (login incompleto).
 * Valida userId + currentPassword, cambia la contraseña y devuelve tokens
 * para completar el login automáticamente.
 *
 * @body { userId, currentPassword, newPassword }
 * @returns { accessToken, refreshToken, usuario }
 */
export const changePasswordRequired = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "userId, currentPassword y newPassword son requeridos",
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      });
    }

    const bufCurrent = Buffer.from(currentPassword);
    const bufNew = Buffer.from(newPassword);
    const samePassword =
      bufCurrent.length === bufNew.length &&
      crypto.timingSafeEqual(bufCurrent, bufNew);
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe ser diferente a la actual",
      });
    }

    const usuario = await Usuario.findByPk(userId, {
      include: [
        {
          model: Rol,
          as: "roles",
          through: { attributes: [], where: { estado: 1 } },
          include: [{ model: Permiso, as: "permisos", through: { attributes: [] } }],
        },
      ],
    });

    if (!usuario || usuario.estado !== "ACTIVO" || !usuario.require_password_change) {
      return res.status(403).json({
        success: false,
        message: "Operación no permitida",
      });
    }

    const passwordValido = await bcrypt.compare(currentPassword, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await usuario.update({
      password_hash: newHash,
      password_changed_at: new Date(),
      require_password_change: false,
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date(),
    });

    validarConfiguracionJWT();

    const permisos = extraerPermisos(usuario.roles);
    const payload = {
      userId: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles.map((r) => r.slug),
      permisos,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRATION,
    });
    const refreshToken = jwt.sign(
      { userId: usuario.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    res.json({
      success: true,
      message: "Contraseña actualizada. Sesión iniciada exitosamente.",
      data: {
        accessToken,
        refreshToken,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          personal_seguridad_id: usuario.personal_seguridad_id,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          foto_perfil: usuario.foto_perfil,
          roles: usuario.roles.map((r) => ({
            id: r.id,
            nombre: r.nombre,
            slug: r.slug,
            color: r.color,
          })),
          permisos,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en changePasswordRequired:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar contraseña",
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

    // Invalidar tokens previos no usados
    await PasswordReset.update(
      { used_at: new Date() },
      { where: { email: usuario.email, used_at: null } }
    );

    // Generar token seguro
    const tokenPlain = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(tokenPlain).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await PasswordReset.create({
      email: usuario.email,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: req.ip,
    });

    // FRONTEND_PUBLIC_URL → URL pública accesible desde el navegador del usuario (emails)
    // FRONTEND_URL        → puede ser .railway.internal (tráfico interno), NO usar en emails
    const frontendPublicUrl =
      process.env.FRONTEND_PUBLIC_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173";
    const resetLink = `${frontendPublicUrl}/reset-password?token=${tokenPlain}&email=${encodeURIComponent(usuario.email)}`;

    try {
      await enviarEmailRecuperacionPassword({
        email: usuario.email,
        username: usuario.username,
        resetLink,
      });
      console.log(`✅ Email de recuperación enviado a: ${usuario.email}`);
    } catch (emailErr) {
      console.error("❌ Error al enviar email de recuperación:", emailErr.message);
    }

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
// RESET PASSWORD (consumir token de recuperación)
// ==========================================

export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ success: false, message: "Token, email y nueva contraseña son requeridos" });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ success: false, message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const registro = await PasswordReset.findOne({
      where: {
        email: normalizarCredencial(email),
        token_hash: tokenHash,
        used_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!registro) {
      return res.status(400).json({ success: false, message: "Token inválido o expirado" });
    }

    const usuario = await Usuario.findOne({ where: { email: normalizarCredencial(email) } });
    if (!usuario) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Verificar que no coincida con contraseña actual
    const mismaActual = await bcrypt.compare(newPassword, usuario.password_hash);
    if (mismaActual) {
      return res.status(400).json({ success: false, message: "La nueva contraseña debe ser diferente a la actual" });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await usuario.update({
      password_hash: newPasswordHash,
      password_changed_at: new Date(),
      require_password_change: false,
    });

    // Marcar token como usado
    await registro.update({ used_at: new Date() });

    // Guardar en historial (fire-and-forget)
    PasswordHistorial.create({ usuario_id: usuario.id, password_hash: newPasswordHash }).catch(() => {});

    console.log(`🔐 Contraseña restablecida via token para: ${usuario.username}`);

    res.json({ success: true, message: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("❌ Error en resetPassword:", error);
    res.status(500).json({ success: false, message: "Error al restablecer contraseña" });
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
  resetPassword,
  debugToken,
};
