/**
 * authMiddleware.js
 * Middleware de Autenticación y Control de Acceso Basado en Roles (RBAC)
 * Valida tokens JWT y verifica permisos de usuario
 */

const jwt = require("jsonwebtoken");
const { Usuario, Rol, Permiso } = require("../models");

/**
 * Middleware para verificar autenticación con JWT
 * Valida el token y agrega los datos del usuario al request
 */
exports.verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado. Acceso denegado.",
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Formato de token inválido",
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la base de datos
    const usuario = await Usuario.findOne({
      where: {
        id: decoded.id,
        estado: 1, // Usuario activo
      },
      include: [
        {
          model: Rol,
          as: "rol",
          include: [
            {
              model: Permiso,
              as: "permisos",
              through: { attributes: [] }, // Excluir tabla intermedia
            },
          ],
        },
      ],
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado o inactivo",
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol.nombre,
      rol_id: usuario.rol_id,
      permisos: usuario.rol.permisos.map((p) => p.nombre),
    };

    next();
  } catch (error) {
    console.error("Error en verificación de token:", error);

    // Diferentes tipos de errores JWT
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

    res.status(500).json({
      success: false,
      message: "Error al verificar autenticación",
      error: error.message,
    });
  }
};

/**
 * Middleware para verificar roles específicos
 * Uso: verificarRoles(['administrador', 'supervisor'])
 * @param {Array} rolesPermitidos - Array de nombres de roles permitidos
 */
exports.verificarRoles = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Verificar si el rol del usuario está en los roles permitidos
      if (!rolesPermitidos.includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(
            ", "
          )}`,
          rolActual: req.user.rol,
        });
      }

      next();
    } catch (error) {
      console.error("Error en verificación de roles:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar roles",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar permisos específicos
 * Uso: verificarPermisos(['crear_novedad', 'editar_novedad'])
 * @param {Array} permisosRequeridos - Array de nombres de permisos requeridos
 */
exports.verificarPermisos = (permisosRequeridos) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Administradores tienen todos los permisos
      if (req.user.rol === "administrador") {
        return next();
      }

      // Verificar si el usuario tiene todos los permisos requeridos
      const tienePermisos = permisosRequeridos.every((permiso) =>
        req.user.permisos.includes(permiso)
      );

      if (!tienePermisos) {
        return res.status(403).json({
          success: false,
          message: "No tienes los permisos necesarios para esta acción",
          permisosRequeridos,
          permisosActuales: req.user.permisos,
        });
      }

      next();
    } catch (error) {
      console.error("Error en verificación de permisos:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar permisos",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario es propietario del recurso o tiene rol permitido
 * Útil para operaciones donde el usuario solo puede modificar sus propios recursos
 * @param {Array} rolesExentos - Roles que pueden acceder a cualquier recurso
 */
exports.verificarPropietarioORol = (
  rolesExentos = ["administrador", "supervisor"]
) => {
  return (req, res, next) => {
    try {
      // Si el usuario tiene un rol exento, permitir acceso
      if (rolesExentos.includes(req.user.rol)) {
        return next();
      }

      // Verificar si el usuario es el creador del recurso
      // El ID del creador debe estar en req.recurso.created_by
      // Este campo debe ser establecido previamente por otro middleware
      if (req.recurso && req.recurso.created_by === req.user.id) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "No tienes permisos para modificar este recurso",
      });
    } catch (error) {
      console.error("Error en verificación de propietario:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar propietario",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware para limitar acceso según estado de la novedad
 * Ejemplo: Solo permitir edición si la novedad no está cerrada
 */
exports.verificarEstadoRecurso = (estadosPermitidos) => {
  return (req, res, next) => {
    try {
      if (!req.recurso) {
        return res.status(400).json({
          success: false,
          message: "Recurso no encontrado en el contexto de la petición",
        });
      }

      // Verificar si el estado del recurso está en los estados permitidos
      if (!estadosPermitidos.includes(req.recurso.estado)) {
        return res.status(403).json({
          success: false,
          message: `Esta acción no está permitida para recursos en estado: ${req.recurso.estado}`,
          estadosPermitidos,
        });
      }

      next();
    } catch (error) {
      console.error("Error en verificación de estado:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar estado del recurso",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware opcional: permite acceso sin autenticación
 * Útil para rutas públicas que también pueden ser accedidas por usuarios autenticados
 */
exports.autenticacionOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Si no hay token, continuar sin autenticación
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Intentar verificar el token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const usuario = await Usuario.findOne({
        where: { id: decoded.id, estado: 1 },
        include: [
          {
            model: Rol,
            as: "rol",
            include: [{ model: Permiso, as: "permisos" }],
          },
        ],
      });

      if (usuario) {
        req.user = {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          rol: usuario.rol.nombre,
          rol_id: usuario.rol_id,
          permisos: usuario.rol.permisos.map((p) => p.nombre),
        };
      }
    } catch (tokenError) {
      // Si hay error en el token, simplemente continuar sin usuario
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Error en autenticación opcional:", error);
    req.user = null;
    next();
  }
};

/**
 * Middleware para logging de acciones
 * Registra quién realizó qué acción y cuándo
 */
exports.registrarAccion = (accion) => {
  return async (req, res, next) => {
    try {
      // Crear log de auditoría
      const { LogAuditoria } = require("../models");

      await LogAuditoria.create({
        usuario_id: req.user?.id,
        accion,
        tabla: req.baseUrl.split("/")[2], // Extrae nombre de tabla de la URL
        registro_id: req.params.id,
        ip: req.ip,
        user_agent: req.get("user-agent"),
        datos_request: JSON.stringify({
          method: req.method,
          body: req.body,
          params: req.params,
          query: req.query,
        }),
      });

      next();
    } catch (error) {
      // No bloquear la petición si falla el log
      console.error("Error al registrar acción:", error);
      next();
    }
  };
};

/**
 * Definición de roles del sistema
 */
exports.ROLES = {
  ADMINISTRADOR: "administrador",
  SUPERVISOR: "supervisor",
  OPERADOR: "operador",
  VISUALIZADOR: "visualizador",
};

/**
 * Definición de permisos del sistema
 */
exports.PERMISOS = {
  // Novedades
  CREAR_NOVEDAD: "crear_novedad",
  EDITAR_NOVEDAD: "editar_novedad",
  ELIMINAR_NOVEDAD: "eliminar_novedad",
  VER_NOVEDAD: "ver_novedad",
  ASIGNAR_RECURSOS: "asignar_recursos",

  // Vehículos
  CREAR_VEHICULO: "crear_vehiculo",
  EDITAR_VEHICULO: "editar_vehiculo",
  ELIMINAR_VEHICULO: "eliminar_vehiculo",
  VER_VEHICULO: "ver_vehiculo",

  // Personal
  CREAR_PERSONAL: "crear_personal",
  EDITAR_PERSONAL: "editar_personal",
  ELIMINAR_PERSONAL: "eliminar_personal",
  VER_PERSONAL: "ver_personal",

  // Reportes
  VER_REPORTES: "ver_reportes",
  EXPORTAR_REPORTES: "exportar_reportes",

  // Configuración
  GESTIONAR_USUARIOS: "gestionar_usuarios",
  GESTIONAR_ROLES: "gestionar_roles",
  CONFIGURAR_SISTEMA: "configurar_sistema",
};

module.exports = exports;
