/**
 * ============================================
 * SISTEMA DE LOGGING CON WINSTON
 * ============================================
 *
 * Winston es una librería de logging profesional que permite:
 * - Diferentes niveles de log (error, warn, info, debug)
 * - Múltiples transportes (consola, archivos, servicios externos)
 * - Rotación automática de archivos
 * - Formato personalizado
 * - Logs estructurados (JSON)
 */

import winston from "winston";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";

// ========================================
// NIVELES DE LOG
// ========================================
/**
 * Winston define niveles de severidad:
 * - error: 0 (más importante)
 * - warn: 1
 * - info: 2
 * - http: 3
 * - verbose: 4
 * - debug: 5
 * - silly: 6 (menos importante)
 *
 * Si el nivel es 'info', se loguean: error, warn, info (pero no debug)
 */

// ========================================
// FORMATO DE LOGS
// ========================================

/**
 * Formato personalizado para logs en consola (desarrollo)
 * Muestra: timestamp | nivel | mensaje | metadata
 */
const consoleFormat = winston.format.combine(
  // Agregar timestamp
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

  // Colorear por nivel
  winston.format.colorize({ all: true }),

  // Agregar metadata si existe
  winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] }),

  // Formato final
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    let log = `${timestamp} | ${level} | ${message}`;

    // Si hay metadata adicional, agregarla
    if (Object.keys(metadata).length > 0) {
      log += ` | ${JSON.stringify(metadata)}`;
    }

    return log;
  })
);

/**
 * Formato JSON para archivos (producción)
 * Facilita el análisis automatizado de logs
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Incluir stack traces
  winston.format.json() // Formato JSON
);

// ========================================
// CONFIGURACIÓN DE TRANSPORTES
// ========================================

/**
 * Transport para consola (desarrollo)
 */
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

/**
 * Transport para archivo de errores
 * Solo logs de nivel 'error'
 */
const errorFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, "../../logs/error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  format: fileFormat,
  maxSize: "20m", // Tamaño máximo por archivo
  maxFiles: "14d", // Mantener logs de 14 días
  zippedArchive: true, // Comprimir archivos antiguos
});

/**
 * Transport para archivo de todos los logs
 */
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, "../../logs/combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  format: fileFormat,
  maxSize: "20m",
  maxFiles: "14d",
  zippedArchive: true,
});

/**
 * Transport para logs de acceso HTTP
 */
const httpFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, "../../logs/http-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "http",
  format: fileFormat,
  maxSize: "20m",
  maxFiles: "7d",
  zippedArchive: true,
});

// ========================================
// CREAR LOGGER
// ========================================

/**
 * Configuración del logger según el entorno
 */
const logger = winston.createLogger({
  // Nivel por defecto
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // Transportes
  transports: [consoleTransport],

  // No salir del proceso en errores no capturados
  exitOnError: false,

  // Manejar errores del logger mismo
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/exceptions.log"),
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/rejections.log"),
    }),
  ],
});

// En producción, agregar transportes de archivo
if (process.env.NODE_ENV === "production") {
  logger.add(errorFileTransport);
  logger.add(combinedFileTransport);
  logger.add(httpFileTransport);
}

// ========================================
// MÉTODOS AUXILIARES
// ========================================

/**
 * Logger de HTTP requests
 * Uso: logger.logRequest(req, res, duration)
 */
logger.logRequest = (req, res, duration) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
};

/**
 * Logger de errores con contexto
 * Uso: logger.logError(error, req, context)
 */
logger.logError = (error, req = null, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...context,
  };

  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
    };
  }

  logger.error("Error capturado:", errorInfo);
};

/**
 * Logger de auditoría
 * Uso: logger.logAudit(action, userId, details)
 */
logger.logAudit = (action, userId, details = {}) => {
  logger.info(`[AUDIT] ${action}`, {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Logger de seguridad
 * Uso: logger.logSecurity(event, details)
 */
logger.logSecurity = (event, details = {}) => {
  logger.warn(`[SECURITY] ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// ========================================
// STREAM PARA MORGAN (HTTP Logger)
// ========================================

/**
 * Stream para integrar con Morgan (middleware de logging HTTP)
 * Permite que Morgan use nuestro logger
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// ========================================
// EXPORTAR LOGGER
// ========================================
export default logger;
/**
 * EJEMPLOS DE USO:
 *
 * 1. Logs básicos:
 *    logger.info('Servidor iniciado');
 *    logger.error('Error al conectar a BD', { error: err });
 *    logger.debug('Valor de variable:', { value: x });
 *
 * 2. Logs con contexto:
 *    logger.info('Usuario creado', { userId: 123, email: 'user@example.com' });
 *
 * 3. Logs de auditoría:
 *    logger.logAudit('user.login', userId, { ip: req.ip });
 *
 * 4. Logs de seguridad:
 *    logger.logSecurity('login.failed', { username, attempts: 3 });
 *
 * 5. Logs de errores:
 *    logger.logError(error, req, { userId: req.user.id });
 *
 * NOTAS IMPORTANTES:
 *
 * 1. Niveles en Producción:
 *    - Usa 'info' o superior en producción
 *    - 'debug' genera muchos logs, solo en desarrollo
 *
 * 2. Información Sensible:
 *    - NUNCA loguees contraseñas
 *    - NUNCA loguees tokens completos
 *    - Ten cuidado con PII (Personally Identifiable Information)
 *
 * 3. Rotación de Archivos:
 *    - Los archivos se rotan diariamente
 *    - Se comprimen automáticamente
 *    - Se eliminan después del tiempo configurado
 *
 * 4. Performance:
 *    - Los logs pueden afectar el performance
 *    - En producción, considera enviar logs a servicios externos
 *    - Opciones: Elasticsearch, Splunk, CloudWatch, Datadog
 *
 * 5. Estructura de Logs:
 *    - Usa formato JSON en producción
 *    - Facilita búsqueda y análisis
 *    - Permite alertas automáticas
 */
