/**
 * ============================================
 * MIDDLEWARE: src/middlewares/authMiddleware.js
 * ============================================
 *
 * Middleware de autenticación y autorización
 * VERSIÓN FINAL - Corregida y Simplificada
 */

import jwt from "jsonwebtoken";
import { Usuario, Rol, Permiso } from "../models/index.js";

/**
 * Verificar token JWT
 */
export const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No se proporcionó un token de autenticación",
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario básico primero
    const usuario = await Usuario.findByPk(decoded.id || decoded.userId);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
        debug: {
          token_id: decoded.id || decoded.userId,
        },
      });
    }

    if (usuario.estado !== "ACTIVO") {
      return res.status(403).json({
        success: false,
        message: "Usuario inactivo",
      });
    }

    // Buscar roles y permisos del usuario
    const usuarioConRoles = await Usuario.findByPk(usuario.id, {
      include: [
        {
          model: Rol,
          as: "roles",
          through: {
            attributes: [],
          },
          include: [
            {
              model: Permiso,
              as: "permisos",
              attributes: ["id", "modulo", "recurso", "accion", "slug"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    // Obtener el rol principal
    let rolPrincipal = null;
    let roles = [];

    if (usuarioConRoles.roles && usuarioConRoles.roles.length > 0) {
      roles = usuarioConRoles.roles.map((r) => r.nombre);
      rolPrincipal = usuarioConRoles.roles[0].nombre; // Tomar el primero como principal
    }

    // Si no tiene roles, asignar valores por defecto
    if (roles.length === 0) {
      console.warn(
        `⚠️ Usuario ${usuario.username} (ID: ${usuario.id}) sin roles asignados`
      );
      roles = ["sin_rol"];
      rolPrincipal = "sin_rol";
    }

    // Combinar permisos de todos los roles
    const todosLosPermisos = new Set();
    if (usuarioConRoles.roles) {
      usuarioConRoles.roles.forEach((rol) => {
        if (rol.permisos) {
          rol.permisos.forEach((permiso) => {
            todosLosPermisos.add(permiso.slug);
          });
        }
      });
    }

    // Adjuntar usuario al request
    req.user = {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      rol: rolPrincipal,
      roles: roles,
      permisos: Array.from(todosLosPermisos),
    };

    next();
  } catch (error) {
    console.error("❌ Error en verificarToken:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al verificar el token",
      error: error.message,
    });
  }
};

/**
 * Verificar roles permitidos
 * @param {Array} rolesPermitidos - Array de roles permitidos
 */
export const verificarRoles = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const tieneRolPermitido = req.user.roles.some((rol) =>
      rolesPermitidos.includes(rol)
    );

    if (!tieneRolPermitido) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción",
        requiredRoles: rolesPermitidos,
        userRoles: req.user.roles,
      });
    }

    next();
  };
};

/**
 * Verificar permisos específicos (formato: modulo.recurso.accion)
 * Requiere que el usuario tenga AL MENOS UNO de los permisos especificados
 * @param {Array} permisosRequeridos - Array de slugs de permisos
 */
export const requireAnyPermission = (permisosRequeridos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Super Admin y Admin siempre pasan
    if (
      req.user.roles.includes("super_admin") ||
      req.user.roles.includes("Super Administrador")
    ) {
      return next();
    }

    // Verificar si el usuario tiene al menos uno de los permisos requeridos
    const tienePermiso = permisosRequeridos.some((permiso) =>
      req.user.permisos.includes(permiso)
    );

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        message: "No tienes los permisos necesarios para realizar esta acción",
        requiredPermissions: permisosRequeridos,
        userPermissions: req.user.permisos.slice(0, 10), // Solo los primeros 10 para no saturar
      });
    }

    next();
  };
};

/**
 * Verificar permisos específicos
 * Requiere que el usuario tenga TODOS los permisos especificados
 * @param {Array} permisosRequeridos - Array de slugs de permisos
 */
export const requireAllPermissions = (permisosRequeridos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Super Admin siempre pasa
    if (
      req.user.roles.includes("super_admin") ||
      req.user.roles.includes("Super Administrador")
    ) {
      return next();
    }

    // Verificar si el usuario tiene todos los permisos requeridos
    const tieneTodosLosPermisos = permisosRequeridos.every((permiso) =>
      req.user.permisos.includes(permiso)
    );

    if (!tieneTodosLosPermisos) {
      return res.status(403).json({
        success: false,
        message:
          "No tienes todos los permisos necesarios para realizar esta acción",
        requiredPermissions: permisosRequeridos,
      });
    }

    next();
  };
};

/**
 * Verificar permiso por módulo (cualquier acción en el módulo)
 * @param {String} modulo - Nombre del módulo (ej: 'vehiculos')
 */
export const requireModuleAccess = (modulo) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Super Admin siempre pasa
    if (
      req.user.roles.includes("super_admin") ||
      req.user.roles.includes("Super Administrador")
    ) {
      return next();
    }

    // Verificar si el usuario tiene algún permiso del módulo
    const tieneAccesoAlModulo = req.user.permisos.some((permiso) =>
      permiso.startsWith(`${modulo}.`)
    );

    if (!tieneAccesoAlModulo) {
      return res.status(403).json({
        success: false,
        message: `No tienes acceso al módulo ${modulo}`,
      });
    }

    next();
  };
};

/**
 * Middleware opcional - solo verifica si hay usuario autenticado
 * pero no requiere permisos específicos
 */
export const autenticacionOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id || decoded.userId, {
      include: [
        {
          model: Rol,
          as: "roles",
          through: { attributes: [] },
          include: [
            {
              model: Permiso,
              as: "permisos",
              attributes: ["id", "modulo", "recurso", "accion", "slug"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (usuario && usuario.estado === 1) {
      const rolPrincipal = usuario.roles?.[0]?.nombre || "sin_rol";

      const todosLosPermisos = new Set();
      usuario.roles?.forEach((rol) => {
        rol.permisos?.forEach((permiso) => {
          todosLosPermisos.add(permiso.slug);
        });
      });

      req.user = {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: rolPrincipal,
        roles: usuario.roles?.map((r) => r.nombre) || [],
        permisos: Array.from(todosLosPermisos),
      };
    }

    next();
  } catch (error) {
    // Si hay error, continuar sin usuario
    next();
  }
};

export default {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
  requireAllPermissions,
  requireModuleAccess,
  autenticacionOpcional,
};
