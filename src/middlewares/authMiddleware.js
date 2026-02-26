/**
 * ============================================
 * MIDDLEWARE: src/middlewares/authMiddleware.js
 * ============================================
 *
 * Middleware de autenticación y autorización
 * VERSIÓN CORREGIDA - Usa SLUGS para comparación
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

    if (!usuario.estado || usuario.estado === 0) {
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
          // 🔥 IMPORTANTE: Ahora incluimos el campo 'slug'
          attributes: ["id", "nombre", "slug"],
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

    // Obtener el rol principal y SLUGS
    let rolPrincipal = null;
    let roles = [];
    let rolSlugs = []; // 🔥 NUEVO: Array de slugs para comparación

    if (usuarioConRoles.roles && usuarioConRoles.roles.length > 0) {
      roles = usuarioConRoles.roles.map((r) => r.nombre);
      rolSlugs = usuarioConRoles.roles.map((r) => r.slug); // 🔥 SLUGS
      rolPrincipal = usuarioConRoles.roles[0].nombre; // Tomar el primero como principal
    }

    // Si no tiene roles, asignar valores por defecto
    if (roles.length === 0) {
      console.warn(
        `⚠️ Usuario ${usuario.username} (ID: ${usuario.id}) sin roles asignados`
      );
      roles = ["sin_rol"];
      rolSlugs = ["sin_rol"];
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
      personal_seguridad_id: usuario.personal_seguridad_id || null,
      rol: rolPrincipal,
      roles: roles, // Nombres legibles
      rolSlugs: rolSlugs, // 🔥 NUEVO: Slugs para comparación
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
 * 🔥 AHORA USA SLUGS PARA COMPARACIÓN
 * @param {Array} rolesPermitidos - Array de SLUGS de roles permitidos
 */
export const verificarRoles = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // 🔥 NUEVO: Usamos rolSlugs directamente (sin normalización)
    const rolesUsuario = req.user.rolSlugs || [];

    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const tieneRolPermitido = rolesUsuario.some((rolSlug) =>
      rolesPermitidos.includes(rolSlug)
    );

    if (!tieneRolPermitido) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción",
        requiredRoles: rolesPermitidos,
        userRoles: req.user.roles, // Mostramos nombres legibles
        userRoleSlugs: rolesUsuario, // 🔥 NUEVO: Para debug
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

    // 🔥 SIMPLIFICADO: Usamos rolSlugs directamente
    const rolesUsuario = req.user.rolSlugs || [];

    // Super Admin y Admin siempre pasan (usando slugs)
    const rolesAdmin = ["super_admin", "admin"];
    const esAdmin = rolesUsuario.some((rolSlug) =>
      rolesAdmin.includes(rolSlug)
    );

    if (esAdmin) {
      console.log("✅ Usuario es Admin, acceso garantizado");
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
        userPermissions: req.user.permisos.slice(0, 10),
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

    // 🔥 SIMPLIFICADO: Usamos rolSlugs directamente
    const rolesUsuario = req.user.rolSlugs || [];

    // Super Admin y Admin siempre pasan
    const rolesAdmin = ["super_admin", "admin"];
    const esAdmin = rolesUsuario.some((rolSlug) =>
      rolesAdmin.includes(rolSlug)
    );

    if (esAdmin) {
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
 * Verificar roles del sistema O permisos por slug (lógica OR).
 * Permite acceso si el usuario tiene alguno de los roles del sistema
 * especificados O si tiene alguno de los permisos requeridos.
 * Super Admin y Admin siempre pasan.
 *
 * @param {Array} rolesPermitidos - Slugs de roles del sistema (ej: ['operador', 'supervisor'])
 * @param {Array} permisosRequeridos - Slugs de permisos (ej: ['novedades.incidentes.create'])
 */
export const verificarRolesOPermisos = (rolesPermitidos, permisosRequeridos = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const rolesUsuario = req.user.rolSlugs || [];

    // Super Admin y Admin siempre pasan
    const rolesAdmin = ["super_admin", "admin"];
    if (rolesUsuario.some((slug) => rolesAdmin.includes(slug))) {
      return next();
    }

    // Tiene algún rol del sistema permitido?
    const tieneRolSistema = rolesUsuario.some((slug) =>
      rolesPermitidos.includes(slug)
    );
    if (tieneRolSistema) return next();

    // Tiene alguno de los permisos requeridos?
    if (permisosRequeridos.length > 0) {
      const tienePermiso = permisosRequeridos.some((p) =>
        req.user.permisos.includes(p)
      );
      if (tienePermiso) return next();
    }

    return res.status(403).json({
      success: false,
      message: "No tienes permisos para realizar esta acción",
      requiredRoles: rolesPermitidos,
      requiredPermissions: permisosRequeridos,
      userRoles: req.user.roles,
      userRoleSlugs: rolesUsuario,
    });
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

    // 🔥 SIMPLIFICADO: Usamos rolSlugs directamente
    const rolesUsuario = req.user.rolSlugs || [];

    // Super Admin y Admin siempre pasan
    const rolesAdmin = ["super_admin", "admin"];
    const esAdmin = rolesUsuario.some((rolSlug) =>
      rolesAdmin.includes(rolSlug)
    );

    if (esAdmin) {
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
          attributes: ["id", "nombre", "slug"], // 🔥 Incluir slug
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
      const rolSlugs = usuario.roles?.map((r) => r.slug) || ["sin_rol"];

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
        personal_seguridad_id: usuario.personal_seguridad_id || null,
        rol: rolPrincipal,
        roles: usuario.roles?.map((r) => r.nombre) || [],
        rolSlugs: rolSlugs, // 🔥 NUEVO
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
  verificarRolesOPermisos,
  requireAnyPermission,
  requireAllPermissions,
  requireModuleAccess,
  autenticacionOpcional,
};
