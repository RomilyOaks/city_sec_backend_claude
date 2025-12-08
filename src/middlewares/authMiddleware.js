/**
 * ============================================
 * MIDDLEWARE: src/middlewares/authMiddleware.js
 * ============================================
 * VERSION CON DEBUG - Agregar console.logs temporalmente
 */

import jwt from "jsonwebtoken";
import { Usuario, Rol, Permiso, UsuarioRol } from "../models/index.js";

/**
 * Verificar token JWT
 */
export const verificarToken = async (req, res, next) => {
  try {
    // 🔍 DEBUG 1: Ver qué headers llegan
    console.log("=== DEBUG AUTH MIDDLEWARE ===");
    console.log("1. Headers completos:", req.headers);
    console.log("2. Authorization header:", req.headers.authorization);

    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ ERROR: No hay Bearer token");
      return res.status(401).json({
        success: false,
        message: "No se proporcionó un token de autenticación",
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // 🔍 DEBUG 2: Ver el token extraído
    console.log(
      "3. Token extraído (primeros 50 chars):",
      token.substring(0, 50) + "..."
    );
    console.log("4. JWT_SECRET existe:", !!process.env.JWT_SECRET);
    console.log(
      "5. JWT_SECRET (primeros 20 chars):",
      process.env.JWT_SECRET?.substring(0, 20) + "..."
    );

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 DEBUG 3: Ver el token decodificado
    console.log("6. Token decodificado exitosamente:", decoded);

    // Buscar usuario con sus roles y permisos
    const usuario = await Usuario.findByPk(decoded.id, {
      include: [
        {
          model: Rol,
          as: "roles",
          through: {
            model: UsuarioRol,
            as: "usuarioRol",
            where: {
              estado: 1,
            },
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

    // 🔍 DEBUG 4: Ver si se encontró el usuario
    console.log(
      "7. Usuario encontrado:",
      usuario ? `ID: ${usuario.id}, Username: ${usuario.username}` : "NULL"
    );

    if (!usuario) {
      console.log("❌ ERROR: Usuario no encontrado en la base de datos");
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (usuario.estado !== 1) {
      console.log("❌ ERROR: Usuario inactivo");
      return res.status(403).json({
        success: false,
        message: "Usuario inactivo",
      });
    }

    // Obtener el rol principal
    const rolPrincipal =
      usuario.roles.find((rol) => rol.UsuarioRol?.es_principal === 1) ||
      usuario.roles[0];

    // 🔍 DEBUG 5: Ver roles y permisos
    console.log(
      "8. Roles del usuario:",
      usuario.roles.map((r) => r.nombre)
    );
    console.log("9. Rol principal:", rolPrincipal?.nombre);

    if (!rolPrincipal) {
      console.log("❌ ERROR: Usuario sin roles asignados");
      return res.status(403).json({
        success: false,
        message: "Usuario sin roles asignados",
      });
    }

    // Combinar permisos de todos los roles del usuario
    const todosLosPermisos = new Set();
    usuario.roles.forEach((rol) => {
      if (rol.permisos) {
        rol.permisos.forEach((permiso) => {
          todosLosPermisos.add(permiso.slug);
        });
      }
    });

    // 🔍 DEBUG 6: Ver permisos
    console.log("10. Permisos del usuario:", Array.from(todosLosPermisos));

    // Adjuntar usuario al request
    req.user = {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      rol: rolPrincipal.nombre,
      roles: usuario.roles.map((r) => r.nombre),
      permisos: Array.from(todosLosPermisos),
    };

    console.log("✅ Autenticación exitosa");
    console.log("=== FIN DEBUG ===\n");

    next();
  } catch (error) {
    // 🔍 DEBUG 7: Ver el error completo
    console.log("❌ ERROR EN VERIFICAR TOKEN:");
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);
    console.log("Error completo:", error);
    console.log("=== FIN DEBUG ===\n");

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
        debug: error.message,
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
        debug: error.message,
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
 * @param {Array} permisosRequeridos - Array de slugs de permisos (ej: ['vehiculos.vehiculos.create'])
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
      req.user.roles.includes("admin")
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
        userPermissions: req.user.permisos,
      });
    }

    next();
  };
};

/**
 * Verificar permisos específicos (formato: modulo.recurso.accion)
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

    // Super Admin y Admin siempre pasan
    if (
      req.user.roles.includes("super_admin") ||
      req.user.roles.includes("admin")
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
        userPermissions: req.user.permisos,
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

    // Admin siempre pasa
    if (req.user.roles.includes("admin")) {
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

    const usuario = await Usuario.findByPk(decoded.id, {
      include: [
        {
          model: Rol,
          as: "roles",
          through: {
            model: UsuarioRol,
            as: "usuarioRol",
            where: { estado: 1 },
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

    if (usuario && usuario.estado === 1) {
      const rolPrincipal =
        usuario.roles.find((rol) => rol.UsuarioRol?.es_principal === 1) ||
        usuario.roles[0];

      const todosLosPermisos = new Set();
      usuario.roles.forEach((rol) => {
        if (rol.permisos) {
          rol.permisos.forEach((permiso) => {
            todosLosPermisos.add(permiso.slug);
          });
        }
      });

      req.user = {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: rolPrincipal?.nombre,
        roles: usuario.roles.map((r) => r.nombre),
        permisos: Array.from(todosLosPermisos),
      };
    }

    next();
  } catch (error) {
    // Si hay error, continuar sin usuario
    next();
  }
};
