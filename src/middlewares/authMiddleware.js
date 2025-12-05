/**
 * Ruta: src/middlewares/authMiddleware.js
 * Descripción: Middleware de autenticación JWT y autorización RBAC
 * Verifica tokens JWT, carga datos del usuario y verifica permisos
 * específicos basados en roles y permisos directos
 */

import jwt from "jsonwebtoken";
import { Usuario, Rol, Permiso } from "../models/index.js";

/**
 * Middleware principal de autenticación
 * Verifica que el usuario tenga un token JWT válido
 */
export const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado",
      });
    }

    // Extraer el token (quitar "Bearer ")
    const token = authHeader.substring(7);

    // Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expirado",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    // TODO: Verificar que el token no esté revocado en tokens_acceso

    // Verificar que el usuario existe y está activo
    const usuario = await Usuario.findByPk(decoded.userId, {
      attributes: ["id", "username", "email", "estado", "deleted_at"],
    });

    if (!usuario || usuario.deleted_at !== null) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (usuario.estado !== "ACTIVO") {
      return res.status(403).json({
        success: false,
        message: "Usuario inactivo o bloqueado",
      });
    }

    // Agregar información del usuario al request para uso posterior
    req.usuario = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles || [],
      permisos: decoded.permisos || [],
    };

    // TODO: Actualizar last_activity_at del usuario

    next();
  } catch (error) {
    console.error("Error en authenticate middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar autenticación",
      error: error.message,
    });
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga al menos uno de los roles especificados
 * @param {Array<string>} rolesPermitidos - Array de slugs de roles permitidos
 * @returns {Function} Middleware function
 *
 * Ejemplo de uso:
 * router.get('/admin', authenticate, requireRole(['super_admin', 'admin']), controller)
 */
export const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Verificar que tenga al menos uno de los roles requeridos
      const tieneRol = req.usuario.roles.some((rol) =>
        rolesPermitidos.includes(rol)
      );

      if (!tieneRol) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para acceder a este recurso",
          requiredRoles: rolesPermitidos,
        });
      }

      next();
    } catch (error) {
      console.error("Error en requireRole middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar rol",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware de autorización por permisos
 * Verifica que el usuario tenga el permiso específico requerido
 * @param {string} permisoRequerido - Slug del permiso (ej: 'novedades.incidentes.create')
 * @returns {Function} Middleware function
 *
 * Ejemplo de uso:
 * router.post('/novedades', authenticate, requirePermission('novedades.incidentes.create'), controller)
 */
export const requirePermission = (permisoRequerido) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Verificar que tenga el permiso requerido
      const tienePermiso = req.usuario.permisos.includes(permisoRequerido);

      if (!tienePermiso) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para realizar esta acción",
          requiredPermission: permisoRequerido,
        });
      }

      next();
    } catch (error) {
      console.error("Error en requirePermission middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar permiso",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware de autorización por múltiples permisos
 * Verifica que el usuario tenga TODOS los permisos especificados
 * @param {Array<string>} permisosRequeridos - Array de slugs de permisos
 * @returns {Function} Middleware function
 *
 * Ejemplo de uso:
 * router.put('/config', authenticate, requireAllPermissions(['config.read', 'config.write']), controller)
 */
export const requireAllPermissions = (permisosRequeridos) => {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Verificar que tenga TODOS los permisos requeridos
      const tieneTodos = permisosRequeridos.every((permiso) =>
        req.usuario.permisos.includes(permiso)
      );

      if (!tieneTodos) {
        return res.status(403).json({
          success: false,
          message: "No tienes todos los permisos necesarios para esta acción",
          requiredPermissions: permisosRequeridos,
        });
      }

      next();
    } catch (error) {
      console.error("Error en requireAllPermissions middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar permisos",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware de autorización por alguno de varios permisos
 * Verifica que el usuario tenga AL MENOS UNO de los permisos especificados
 * @param {Array<string>} permisosRequeridos - Array de slugs de permisos
 * @returns {Function} Middleware function
 *
 * Ejemplo de uso:
 * router.get('/reports', authenticate, requireAnyPermission(['reports.view', 'reports.admin']), controller)
 */
export const requireAnyPermission = (permisosRequeridos) => {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Verificar que tenga AL MENOS UNO de los permisos
      const tieneAlguno = permisosRequeridos.some((permiso) =>
        req.usuario.permisos.includes(permiso)
      );

      if (!tieneAlguno) {
        return res.status(403).json({
          success: false,
          message:
            "No tienes ninguno de los permisos necesarios para esta acción",
          requiredPermissions: permisosRequeridos,
        });
      }

      next();
    } catch (error) {
      console.error("Error en requireAnyPermission middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar permisos",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware opcional de autenticación
 * Similar a authenticate pero no falla si no hay token
 * Útil para endpoints que tienen contenido público y contenido para usuarios autenticados
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Si no hay header, continuar sin autenticación
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.usuario = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const usuario = await Usuario.findByPk(decoded.userId, {
        attributes: ["id", "username", "email", "estado", "deleted_at"],
      });

      if (
        usuario &&
        usuario.deleted_at === null &&
        usuario.estado === "ACTIVO"
      ) {
        req.usuario = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          roles: decoded.roles || [],
          permisos: decoded.permisos || [],
        };
      } else {
        req.usuario = null;
      }
    } catch (error) {
      // Si el token es inválido, simplemente continuar sin autenticación
      req.usuario = null;
    }

    next();
  } catch (error) {
    console.error("Error en optionalAuthenticate middleware:", error);
    req.usuario = null;
    next();
  }
};

/**
 * Helper function para verificar si un usuario tiene un permiso específico
 * Útil para usar dentro de controladores
 * @param {Object} usuario - Objeto de usuario de req.usuario
 * @param {string} permisoSlug - Slug del permiso a verificar
 * @returns {boolean}
 */
export const hasPermission = (usuario, permisoSlug) => {
  if (!usuario || !usuario.permisos) return false;
  return usuario.permisos.includes(permisoSlug);
};

/**
 * Helper function para verificar si un usuario tiene un rol específico
 * @param {Object} usuario - Objeto de usuario de req.usuario
 * @param {string} rolSlug - Slug del rol a verificar
 * @returns {boolean}
 */
export const hasRole = (usuario, rolSlug) => {
  if (!usuario || !usuario.roles) return false;
  return usuario.roles.includes(rolSlug);
};

export default {
  authenticate,
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  optionalAuthenticate,
  hasPermission,
  hasRole,
};
