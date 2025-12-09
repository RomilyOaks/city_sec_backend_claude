/*
 * =============================================
 * Ruta: src/controllers/authController.js
 * ============================================
 * Descripción: Controlador de autenticación y gestión de usuarios
 * Maneja login, registro, logout, verificación de email, cambio de contraseña
 * y gestión de tokens JWT. Utiliza modelos Sequelize en lugar de queries directas.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario, Rol, Permiso } from "../models/index.js";
import { Op } from "sequelize";

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en el sistema
 * @body {username, email, password, nombres, apellidos}
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, nombres, apellidos, telefono } =
      req.body;

    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email y password son requeridos",
      });
    }

    // Verificar si el usuario ya existe (por username o email)
    const usuarioExistente = await Usuario.findOne({
      where: {
        [Op.or]: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: "El username o email ya están registrados",
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario
    const nuevoUsuario = await Usuario.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password_hash,
      nombres,
      apellidos,
      telefono,
      estado: "PENDIENTE", // Por defecto, hasta que verifique su email
      oauth_provider: "LOCAL",
    });

    // Buscar el rol por defecto (ej: 'usuario_basico')
    const rolBasico = await Rol.findOne({
      where: { slug: "usuario_basico" },
    });

    // Asignar rol por defecto al usuario
    if (rolBasico) {
      await nuevoUsuario.addRol(rolBasico);
    }

    // TODO: Enviar email de verificación aquí
    // await enviarEmailVerificacion(nuevoUsuario.email);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente. Por favor verifica tu email.",
      data: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        nombres: nuevoUsuario.nombres,
        apellidos: nuevoUsuario.apellidos,
      },
    });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
};

/**
 * ============================================
 * ENDPOINT DE DEBUG - authController.js
 * ============================================
 *
 * Agregar este endpoint temporalmente para depurar
 */

// En tu archivo src/controllers/authController.js
// Agregar esta función:

export const debugToken = async (req, res) => {
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
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.decode(token);

    // Buscar el usuario en la BD
    const { Usuario, Rol, Permiso } = await import("../models/index.js");

    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ["id", "username", "email", "estado"],
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado en la base de datos",
        decoded_token: decoded,
        user_id_from_token: decoded.id,
      });
    }

    // Intentar buscar con roles
    const usuarioConRoles = await Usuario.findByPk(decoded.id, {
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

    res.status(200).json({
      success: true,
      debug: {
        token_decoded: decoded,
        usuario_encontrado: !!usuario,
        usuario_data: usuario,
        roles_count: usuarioConRoles?.roles?.length || 0,
        roles: usuarioConRoles?.roles || [],
        permisos_total:
          usuarioConRoles?.roles?.reduce(
            (acc, rol) => acc + (rol.permisos?.length || 0),
            0
          ) || 0,
      },
    });
  } catch (error) {
    console.error("Error en debug:", error);
    res.status(500).json({
      success: false,
      message: "Error en debug",
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * POST /api/auth/login
 * Autentica un usuario y genera tokens JWT
 * @body {username_or_email, password}
 */
export const login = async (req, res) => {
  try {
    // ✅ DEBUGGING: Verificar variables de entorno
    console.log("🔍 DEBUG - Variables JWT:");
    console.log("   JWT_SECRET existe:", !!process.env.JWT_SECRET);
    console.log("   JWT_SECRET length:", process.env.JWT_SECRET?.length);
    console.log(
      "   JWT_REFRESH_SECRET existe:",
      !!process.env.JWT_REFRESH_SECRET
    );
    console.log("   NODE_ENV:", process.env.NODE_ENV);

    // ✅ VALIDACIÓN: Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error("❌ ERROR CRÍTICO: JWT_SECRET no está definido");
      return res.status(500).json({
        success: false,
        message: "Error de configuración del servidor",
        error: "JWT_SECRET no configurado - contacte al administrador",
      });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      console.error("❌ ERROR CRÍTICO: JWT_REFRESH_SECRET no está definido");
      return res.status(500).json({
        success: false,
        message: "Error de configuración del servidor",
        error: "JWT_REFRESH_SECRET no configurado - contacte al administrador",
      });
    }
    const { username_or_email, password } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers["user-agent"];

    // Validar campos requeridos
    if (!username_or_email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/email y password son requeridos",
      });
    }

    // Buscar usuario por username o email
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { username: username_or_email.toLowerCase() },
          { email: username_or_email.toLowerCase() },
        ],
      },
      include: [
        {
          model: Rol,
          as: "roles",
          include: [
            {
              model: Permiso,
              as: "permisos",
            },
          ],
        },
      ],
    });

    // Usuario no encontrado
    if (!usuario) {
      // TODO: Registrar intento fallido en login_intentos
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    // Verificar si el usuario está bloqueado
    if (usuario.locked_until && new Date() < new Date(usuario.locked_until)) {
      return res.status(403).json({
        success: false,
        message: "Usuario bloqueado temporalmente. Intente más tarde.",
      });
    }

    // Verificar si el usuario está activo
    if (usuario.estado !== "ACTIVO") {
      return res.status(403).json({
        success: false,
        message: `Usuario ${usuario.estado.toLowerCase()}. Contacte al administrador.`,
      });
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValido) {
      // Incrementar intentos fallidos
      await usuario.update({
        failed_login_attempts: usuario.failed_login_attempts + 1,
        // Bloquear por 15 minutos después de 5 intentos fallidos
        locked_until:
          usuario.failed_login_attempts >= 4
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null,
      });

      // TODO: Registrar intento fallido en login_intentos

      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    // ¡Login exitoso!

    // Resetear intentos fallidos
    await usuario.update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date(),
      last_login_ip: ip_address,
      last_activity_at: new Date(),
    });

    // TODO: Registrar login exitoso en login_intentos y auditoria_acciones

    // Verificar si debe cambiar contraseña
    if (usuario.require_password_change) {
      return res.json({
        success: true,
        requirePasswordChange: true,
        message: "Debe cambiar su contraseña antes de continuar",
        userId: usuario.id,
      });
    }

    // Preparar permisos del usuario
    const permisos = [];
    if (usuario.roles) {
      usuario.roles.forEach((rol) => {
        if (rol.permisos) {
          rol.permisos.forEach((permiso) => {
            if (!permisos.includes(permiso.slug)) {
              permisos.push(permiso.slug);
            }
          });
        }
      });
    }

    // Generar payload del JWT
    const payload = {
      userId: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles.map((r) => r.slug),
      permisos: permisos,
    };

    // ✅ DEBUGGING: Logs antes de generar tokens
    console.log("🔑 Generando Access Token...");
    console.log("   Payload:", JSON.stringify(payload, null, 2));
    console.log("   JWT_SECRET presente:", !!process.env.JWT_SECRET);

    // Generar Access Token (válido por 1 hora)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("✅ Access Token generado exitosamente");

    // ✅ DEBUGGING: Logs antes de generar refresh token
    console.log("🔑 Generando Refresh Token...");

    // Generar Refresh Token (válido por 7 días)
    const refreshToken = jwt.sign(
      { userId: usuario.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Refresh Token generado exitosamente");

    // TODO: Guardar refresh token en la tabla tokens_acceso

    // Responder con tokens y datos del usuario
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
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/refresh
 * Renueva el access token usando el refresh token
 * @body {refreshToken}
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token requerido",
      });
    }

    // Verificar el refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Refresh token inválido o expirado",
      });
    }

    // Buscar usuario con sus roles y permisos
    const usuario = await Usuario.findByPk(decoded.userId, {
      include: [
        {
          model: Rol,
          as: "roles",
          include: [
            {
              model: Permiso,
              as: "permisos",
            },
          ],
        },
      ],
    });

    if (!usuario || usuario.estado !== "ACTIVO") {
      return res.status(401).json({
        success: false,
        message: "Usuario no válido",
      });
    }

    // TODO: Verificar que el refresh token exista en tokens_acceso y no esté revocado

    // Preparar permisos
    const permisos = [];
    if (usuario.roles) {
      usuario.roles.forEach((rol) => {
        if (rol.permisos) {
          rol.permisos.forEach((permiso) => {
            if (!permisos.includes(permiso.slug)) {
              permisos.push(permiso.slug);
            }
          });
        }
      });
    }

    // Generar nuevo access token
    const payload = {
      userId: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles.map((r) => r.slug),
      permisos: permisos,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error("Error en refreshToken:", error);
    res.status(500).json({
      success: false,
      message: "Error al renovar token",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario y revoca sus tokens
 * @headers {Authorization: Bearer <token>}
 */
export const logout = async (req, res) => {
  try {
    const userId = req.usuario.userId; // Viene del middleware authMiddleware

    // TODO: Revocar tokens en la tabla tokens_acceso
    // TODO: Eliminar sesión activa en la tabla sesiones
    // TODO: Registrar logout en auditoria_acciones

    res.json({
      success: true,
      message: "Logout exitoso",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({
      success: false,
      message: "Error al cerrar sesión",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 * @body {currentPassword, newPassword}
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.usuario.userId;
    const { currentPassword, newPassword } = req.body;

    // Validar campos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual y nueva contraseña son requeridas",
      });
    }

    // Validar longitud mínima de la nueva contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 8 caracteres",
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findByPk(userId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar contraseña actual
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

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña (el trigger trg_usuario_password_change se encargará del historial)
    await usuario.update({
      password_hash: newPasswordHash,
      password_changed_at: new Date(),
      require_password_change: false,
      updated_by: userId,
    });

    res.json({
      success: true,
      message: "Contraseña cambiada exitosamente",
    });
  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar contraseña",
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Obtiene los datos del usuario autenticado actual
 * @headers {Authorization: Bearer <token>}
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.usuario.userId;

    // Buscar usuario con sus relaciones
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
          attributes: ["id", "nombre", "slug", "color", "nivel_jerarquia"],
          include: [
            {
              model: Permiso,
              as: "permisos",
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

    // Preparar permisos únicos
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
    console.error("Error en getMe:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del usuario",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Solicita un token para recuperar contraseña
 * @body {email}
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
      where: { email: email.toLowerCase() },
    });

    // Por seguridad, siempre respondemos lo mismo aunque el usuario no exista
    if (!usuario) {
      return res.json({
        success: true,
        message:
          "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
      });
    }

    // TODO: Generar token de recuperación
    // TODO: Guardar en password_resets
    // TODO: Enviar email con el link de recuperación

    res.json({
      success: true,
      message:
        "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar solicitud",
      error: error.message,
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getMe,
  forgotPassword,
};
