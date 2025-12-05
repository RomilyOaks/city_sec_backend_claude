/**
 * ============================================
 * CONFIGURACIÓN DE LA APLICACIÓN EXPRESS
 * ============================================
 *
 * Este archivo configura toda la aplicación Express:
 * - Middlewares de seguridad
 * - Parsers de body
 * - CORS
 * - Rutas
 * - Manejo de errores
 */

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler.middleware");
const routes = require("./routes");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// ========================================
// CREAR APLICACIÓN EXPRESS
// ========================================
const app = express();

// ========================================
// 1. MIDDLEWARES DE SEGURIDAD
// ========================================

/**
 * Helmet: Configura headers HTTP para mayor seguridad
 * Protege contra:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME sniffing
 * - Y más...
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Permite embeds de otros orígenes si es necesario
  })
);

/**
 * CORS: Configuración de Cross-Origin Resource Sharing
 * Permite que el frontend (en otro puerto/dominio) acceda a la API
 */
const corsOptions = {
  // Orígenes permitidos (frontend)
  origin: function (origin, callback) {
    // Lista blanca de orígenes permitidos
    const whitelist = [
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN || "http://localhost:5173", // Vite default port
      "http://localhost:3000", // React default
      "http://localhost:4200", // Angular default
    ].filter(Boolean); // Eliminar undefined

    // Permitir requests sin origin (Postman, curl, etc) en desarrollo
    if (!origin && process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  // Headers permitidos
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
  ],
  // Métodos HTTP permitidos
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Permitir envío de cookies
  credentials: true,
  // Cache de preflight requests (24 horas)
  maxAge: 86400,
};

app.use(cors(corsOptions));

// ========================================
// 2. PARSERS DE BODY
// ========================================

/**
 * express.json(): Parsea el body de requests con Content-Type: application/json
 * limit: Tamaño máximo del body (protección contra ataques de payload grande)
 */
app.use(express.json({ limit: "10mb" }));

/**
 * express.urlencoded(): Parsea el body de forms HTML
 * extended: true permite objetos y arrays anidados
 */
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Morgan - Logger de peticiones HTTP
 * Solo en desarrollo
 */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ========================================
// 3. LOGGING DE REQUESTS (Desarrollo)
// ========================================

if (process.env.NODE_ENV === "development") {
  /**
   * Middleware personalizado para logear cada request
   * Útil para debugging en desarrollo
   */
  app.use((req, res, next) => {
    const start = Date.now();

    // Cuando la respuesta termina, calcular tiempo
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info(
        `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
      );
    });

    next();
  });
}

// ========================================
// 4. HEALTH CHECK ENDPOINT
// ========================================

/**
 * Endpoint simple para verificar que el servidor está funcionando
 * Útil para:
 * - Load balancers
 * - Sistemas de monitoreo
 * - Docker health checks
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

/**
 * Endpoint raíz - información básica de la API
 */
app.get("/", (req, res) => {
  res.json({
    message: "🚓 API de Seguridad Ciudadana",
    version: process.env.API_VERSION || "v1",
    documentation: "/api-docs", // Futura documentación Swagger
    endpoints: {
      health: "/health",
      api: `/api/${process.env.API_VERSION || "v1"}`,
    },
  });
});

// ========================================
// 5. RUTAS DE LA API
// ========================================

/**
 * Todas las rutas de la API están bajo /api/v1
 * Esto permite versionado de la API
 * Ejemplo: /api/v1/auth/login, /api/v1/users, etc.
 */
app.use(`/api/${process.env.API_VERSION || "v1"}`, routes);

// ========================================
// 6. MANEJO DE RUTAS NO ENCONTRADAS (404)
// ========================================

/**
 * Si ninguna ruta coincide, responder con 404
 * Este middleware debe estar DESPUÉS de todas las rutas
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint no encontrado",
    path: req.originalUrl,
    method: req.method,
  });
});

// ========================================
// 7. MANEJO GLOBAL DE ERRORES
// ========================================

/**
 * Middleware para capturar y manejar todos los errores
 * Debe ser el ÚLTIMO middleware
 *
 */
app.use((err, req, res, next) => {
  console.error("Error capturado:", err);

  // Error de validación de Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: err.errors.map((e) => ({
        campo: e.path,
        mensaje: e.message,
      })),
    });
  }

  // Error de unique constraint de Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Ya existe un registro con estos datos",
      campo: err.errors[0]?.path,
    });
  }

  // Error de foreign key de Sequelize
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Error de integridad referencial",
      detalle: "El registro está relacionado con otros datos",
    });
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
    });
  }

  // Error genérico del servidor
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ========================================
// EXPORTAR APLICACIÓN
// ========================================
// ==================== INICIALIZACIÓN ====================

/**
 * Función para iniciar el servidor
 */
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await db.sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente");

    // Sincronizar modelos (solo en desarrollo)
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SYNC_DB === "true"
    ) {
      await db.sequelize.sync({ alter: false });
      console.log("✅ Modelos sincronizados con la base de datos");
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log("🚀 Servidor corriendo en:", `http://localhost:${PORT}`);
      console.log("📝 Documentación API:", `http://localhost:${PORT}/api/docs`);
      console.log("🏥 Health Check:", `http://localhost:${PORT}/api/health`);
      console.log("🌍 Entorno:", process.env.NODE_ENV || "development");
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

// Manejo de errores no capturados
process.on("unhandledRejection", (err) => {
  console.error("❌ Error no manejado (Promise Rejection):", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Error no capturado (Exception):", err);
  process.exit(1);
});

// Manejo de señales de terminación
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM recibido, cerrando servidor gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT recibido, cerrando servidor gracefully...");
  process.exit(0);
});

module.exports = app;

/**
 * NOTAS IMPORTANTES:
 *
 * 1. Orden de Middlewares:
 *    - El orden es CRÍTICO en Express
 *    - Los middlewares se ejecutan en el orden que se definen
 *    - Seguridad → Parsers → Rutas → Errores
 *
 * 2. Seguridad:
 *    - Helmet para headers seguros
 *    - CORS configurado apropiadamente
 *    - Límites en tamaño de body
 *    - Rate limiting (se agrega en routes)
 *
 * 3. CORS:
 *    - Configurar correctamente para producción
 *    - Usar whitelist de orígenes
 *    - No usar origin: '*' en producción
 *
 * 4. Error Handling:
 *    - Siempre debe ser el último middleware
 *    - Captura errores de toda la aplicación
 *    - No expone detalles sensibles en producción
 *
 * 5. Logging:
 *    - Útil en desarrollo para debugging
 *    - En producción, usar herramientas especializadas
 *    - Nunca logear información sensible
 */
