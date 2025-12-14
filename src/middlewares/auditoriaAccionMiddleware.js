/**
 * ============================================
 * MIDDLEWARE: src/middlewares/auditoriaAccionMiddleware.js
 * ============================================
 *
 * Middleware para registro automático de auditoría
 * Intercepta operaciones y registra acciones en el sistema
 */

import { AuditoriaAccion } from "../models/index.js";

/**
 * Obtener IP del cliente
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
};

/**
 * Obtener user agent
 */
const getUserAgent = (req) => {
  return req.headers["user-agent"] || "Unknown";
};

/**
 * Middleware principal de auditoría
 * Registra automáticamente las operaciones CRUD
 */
export const registrarAuditoria = (options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para capturar la respuesta
    res.json = function (data) {
      const duracion = Date.now() - startTime;

      // Solo registrar si la operación fue exitosa o según configuración
      const debeRegistrar =
        options.registrarSiempre ||
        (data.success !== false && res.statusCode < 400);

      if (debeRegistrar) {
        // Determinar acción basado en el método HTTP
        let accion = "VIEW";
        if (req.method === "POST") accion = "CREATE";
        else if (req.method === "PUT" || req.method === "PATCH")
          accion = "UPDATE";
        else if (req.method === "DELETE") accion = "DELETE";

        // Determinar entidad desde la ruta
        const pathParts = req.path.split("/").filter(Boolean);
        const entidad = options.entidad || pathParts[1] || "desconocido";

        // Determinar ID de la entidad
        const entidad_id = req.params.id || data.data?.id || null;

        // Construir descripción
        const descripcion =
          options.descripcion ||
          `${accion} en ${entidad}${entidad_id ? ` (ID: ${entidad_id})` : ""}`;

        // Determinar severidad
        let severidad = options.severidad || "BAJA";
        if (accion === "DELETE") severidad = "ALTA";
        else if (accion === "UPDATE") severidad = "MEDIA";

        // Registrar en auditoría
        AuditoriaAccion.registrar({
          usuario_id: req.user?.id || null,
          accion,
          entidad,
          entidad_id,
          descripcion,
          datos_anteriores: options.datosAnteriores || null,
          datos_nuevos: options.datosNuevos || req.body || null,
          ip_address: getClientIp(req),
          user_agent: getUserAgent(req),
          metadata: {
            metodo: req.method,
            ruta: req.originalUrl,
            query: req.query,
            statusCode: res.statusCode,
          },
          severidad,
          modulo: options.modulo || entidad,
          resultado: data.success === false ? "FALLO" : "EXITO",
          error_mensaje:
            data.message && data.success === false ? data.message : null,
          duracion_ms: duracion,
        }).catch((error) => {
          console.error("Error al registrar auditoría:", error);
        });
      }

      // Llamar al método original
      return originalJson(data);
    };

    next();
  };
};

/**
 * Registrar acción manual de auditoría
 * Para casos específicos que requieren más control
 */
export const registrarAccionManual = async (req, datos) => {
  try {
    await AuditoriaAccion.registrar({
      usuario_id: req.user?.id || null,
      ip_address: getClientIp(req),
      user_agent: getUserAgent(req),
      metadata: {
        metodo: req.method,
        ruta: req.originalUrl,
        query: req.query,
      },
      ...datos,
    });
  } catch (error) {
    console.error("Error al registrar acción manual:", error);
  }
};

/**
 * Middleware para auditar operaciones de autenticación
 */
export const auditarAutenticacion = async (
  req,
  accion,
  resultado,
  mensaje = null
) => {
  try {
    await AuditoriaAccion.registrar({
      usuario_id: req.user?.id || null,
      accion,
      entidad: "Usuario",
      entidad_id: req.user?.id || null,
      descripcion: mensaje || `Intento de ${accion}`,
      ip_address: getClientIp(req),
      user_agent: getUserAgent(req),
      metadata: {
        username: req.body?.username || req.body?.email,
      },
      severidad: resultado === "FALLIDO" ? "MEDIA" : "BAJA",
      modulo: "Autenticacion",
      resultado,
      error_mensaje: resultado === "FALLIDO" ? mensaje : null,
    });
  } catch (error) {
    console.error("Error al auditar autenticación:", error);
  }
};

/**
 * Middleware para auditar cambios en datos críticos
 */
export const auditarCambiosCriticos = (entidad, severidad = "ALTA") => {
  return async (req, res, next) => {
    // Guardar el método original
    const originalJson = res.json.bind(res);
    let datosAnteriores = null;

    // Si es UPDATE, intentar obtener datos anteriores
    if ((req.method === "PUT" || req.method === "PATCH") && req.params.id) {
      // Los datos anteriores deben ser pasados por el controlador
      datosAnteriores = req.datosAnteriores || null;
    }

    res.json = function (data) {
      if (data.success) {
        AuditoriaAccion.registrar({
          usuario_id: req.user?.id,
          accion:
            req.method === "POST"
              ? "CREATE"
              : req.method === "DELETE"
              ? "DELETE"
              : "UPDATE",
          entidad,
          entidad_id: req.params.id || data.data?.id,
          descripcion: `Modificación de ${entidad} crítico`,
          datos_anteriores: datosAnteriores,
          datos_nuevos: req.body,
          ip_address: getClientIp(req),
          user_agent: getUserAgent(req),
          severidad,
          modulo: entidad,
          resultado: "EXITOSO",
        }).catch((error) => {
          console.error("Error al registrar auditoría crítica:", error);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware para auditar exportaciones de datos
 */
export const auditarExportacion = (tipoExportacion) => {
  return async (req, res, next) => {
    await AuditoriaAccion.registrar({
      usuario_id: req.user?.id,
      accion: "EXPORT",
      entidad: tipoExportacion,
      descripcion: `Exportación de ${tipoExportacion}`,
      ip_address: getClientIp(req),
      user_agent: getUserAgent(req),
      metadata: {
        filtros: req.query,
        formato: req.query.formato || "excel",
      },
      severidad: "MEDIA",
      modulo: "Reportes",
      resultado: "EXITOSO",
    }).catch((error) => {
      console.error("Error al auditar exportación:", error);
    });

    next();
  };
};

export default {
  registrarAuditoria,
  registrarAccionManual,
  auditarAutenticacion,
  auditarCambiosCriticos,
  auditarExportacion,
};
