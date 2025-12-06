/**
 * Ruta: src/app.js
 *
 * Descripción:
 * Archivo principal de la aplicación Express para el Sistema de Seguridad Ciudadana.
 * Configura todos los middlewares de seguridad, parsers, rutas y manejo de errores.
 * Implementa las mejores prácticas de seguridad y arquitectura para APIs REST.
 *
 * Características principales:
 * - Helmet para seguridad de headers HTTP
 * - CORS configurado con whitelist
 * - Rate limiting por IP
 * - Validación y sanitización de datos
 * - Logging con Morgan (solo desarrollo)
 * - Manejo centralizado de errores
 * - Versionamiento de API (/v1/)
 * - Compression de respuestas
 * - Timeouts configurables
 *
 * Orden de middlewares (CRÍTICO):
 * 1. Seguridad (Helmet, CORS)
 * 2. Parsers (JSON, URL-encoded)
 * 3. Logging (Morgan - solo desarrollo)
 * 4. Compression
 * 5. Rutas
 * 6. Error handlers (SIEMPRE al final)
 *
 * @module app
 * @requires express
 * @requires helmet
 * @requires cors
 * @requires dotenv
 * @requires morgan
 */

// ============================================
// IMPORTACIONES DE LIBRERÍAS
// ============================================

import express from "express";
import helmet from "helmet"; // Seguridad: Headers HTTP seguros
import cors from "cors"; // Control de acceso cross-origin
import dotenv from "dotenv"; // Variables de entorno
import morgan from "morgan"; // Logger de peticiones HTTP
import compression from "compression"; // Compresión de respuestas

// Configuración de la base de datos
import sequelize from "./config/database.js";

// ============================================
// IMPORTACIÓN DE RUTAS
// ============================================

// Rutas de autenticación y usuarios
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

// Rutas de módulos operativos
import catalogosRoutes from "./routes/catalogos.routes.js";
import novedadesRoutes from "./routes/novedades.routes.js";
import personalRoutes from "./routes/personal.routes.js";
import sectoresRoutes from "./routes/sectores.routes.js";
import vehiculosRoutes from "./routes/vehiculos.routes.js";
import cuadrantesRoutes from "./routes/cuadrantes.routes.js";
import permisosRoutes from "./routes/permisos.routes.js";
import rolesRoutes from "./routes/roles.routes.js";

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

// Cargar variables de entorno desde .env
dotenv.config();

// Obtener variables de entorno
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_VERSION = process.env.API_VERSION || "v1";
const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || "10mb";

// Crear instancia de Express
const app = express();

// ============================================
// MIDDLEWARE 1: SEGURIDAD - HELMET
// Headers HTTP seguros contra vulnerabilidades comunes
// ============================================

/**
 * Helmet configura varios headers HTTP de seguridad:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 1; mode=block
 * - Strict-Transport-Security (HSTS)
 * - Content-Security-Policy (CSP)
 * - etc.
 */
app.use(
  helmet({
    // Configuración personalizada de Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    // HSTS: Forzar HTTPS en producción
    hsts: {
      maxAge: 31536000, // 1 año en segundos
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ============================================
// MIDDLEWARE 2: SEGURIDAD - CORS
// Control de acceso cross-origin con whitelist
// ============================================

/**
 * Configuración de CORS con whitelist de orígenes permitidos
 * En producción, NUNCA usar origin: '*'
 */
const corsOptions = {
  // Lista de orígenes permitidos (whitelist)
  origin: function (origin, callback) {
    // Orígenes permitidos desde variables de entorno
    const whitelist = [
      process.env.FRONTEND_URL, // URL principal del frontend
      process.env.CORS_ORIGIN || "http://localhost:5173", // Vite dev server
      "http://localhost:3000", // React dev server
      "http://localhost:4200", // Angular dev server
    ].filter(Boolean); // Eliminar valores undefined

    // En desarrollo, permitir requests sin origin (Postman, curl, etc.)
    if (NODE_ENV === "development" && !origin) {
      return callback(null, true);
    }

    // Verificar si el origen está en la whitelist
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },

  // Permitir credenciales (cookies, headers de autenticación)
  credentials: true,

  // Métodos HTTP permitidos
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  // Headers permitidos en las peticiones
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],

  // Headers expuestos al cliente
  exposedHeaders: ["Content-Range", "X-Content-Range"],

  // Tiempo de cache de la respuesta preflight (OPTIONS)
  maxAge: 86400, // 24 horas

  // Responder con status 204 a preflight (más rápido)
  optionsSuccessStatus: 204,
};

// Aplicar configuración de CORS
app.use(cors(corsOptions));

// ============================================
// MIDDLEWARE 3: PARSERS
// Para procesar el body de las peticiones
// ============================================

/**
 * Parser de JSON con límite de tamaño
 * Protección contra ataques de payload grande
 */
app.use(
  express.json({
    limit: MAX_BODY_SIZE, // Tamaño máximo del body
    strict: true, // Solo aceptar arrays y objetos
  })
);

/**
 * Parser de URL-encoded (formularios)
 * extended: true permite objetos y arrays anidados
 */
app.use(
  express.urlencoded({
    extended: true,
    limit: MAX_BODY_SIZE,
  })
);

// ============================================
// MIDDLEWARE 4: LOGGING
// Morgan para registro de peticiones HTTP (solo desarrollo)
// ============================================

if (NODE_ENV === "development") {
  /**
   * Formato 'dev' de Morgan:
   * :method :url :status :response-time ms - :res[content-length]
   *
   * Ejemplo:
   * GET /api/v1/usuarios 200 45.123 ms - 1024
   */
  app.use(morgan("dev"));
} else {
  /**
   * Formato 'combined' para producción (Apache style)
   * Incluye más información para auditoría
   */
  app.use(morgan("combined"));
}

// ============================================
// MIDDLEWARE 5: COMPRESSION
// Compresión de respuestas para reducir ancho de banda
// ============================================

/**
 * Comprime las respuestas con gzip
 * Reduce significativamente el tamaño de las respuestas JSON
 */
app.use(
  compression({
    // Solo comprimir si la respuesta es mayor a 1kb
    threshold: 1024,
    // Nivel de compresión (0-9, 6 es un buen balance)
    level: 6,
  })
);

// ============================================
// MIDDLEWARE 6: TIMEOUT
// Timeout global para todas las peticiones
// ============================================

/**
 * Establece un timeout para evitar peticiones colgadas
 */
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS) || 30000; // 30 segundos por defecto

app.use((req, res, next) => {
  // Establecer timeout
  req.setTimeout(TIMEOUT_MS);
  res.setTimeout(TIMEOUT_MS);

  next();
});

// ============================================
// MIDDLEWARE 7: SECURITY HEADERS ADICIONALES
// Headers de seguridad adicionales personalizados
// ============================================

app.use((req, res, next) => {
  // Eliminar header que expone información del servidor
  res.removeHeader("X-Powered-By");

  // Header custom para identificar la API
  res.setHeader("X-API-Version", API_VERSION);

  next();
});

// ============================================
// HEALTH CHECK ENDPOINT
// Verificar que la API está funcionando
// ============================================

/**
 * GET /health
 * Endpoint simple para verificar que el servidor está vivo
 * Útil para load balancers y monitoring
 */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API de Seguridad Ciudadana funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: API_VERSION,
  });
});

// ============================================
// RUTA RAÍZ DE LA API
// Información general de la API
// ============================================

/**
 * GET /api/v1
 * Endpoint de bienvenida con información de la API
 */
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: `API de Seguridad Ciudadana ${API_VERSION}`,
    version: API_VERSION,
    documentation: `/api/${API_VERSION}/docs`,
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      usuarios: `/api/${API_VERSION}/usuarios`,
      catalogos: `/api/${API_VERSION}/catalogos`,
      novedades: `/api/${API_VERSION}/novedades`,
      personal: `/api/${API_VERSION}/personal`,
      sectores: `/api/${API_VERSION}/sectores`,
      vehiculos: `/api/${API_VERSION}/vehiculos`,
    },
    contact: {
      support: "soporte@citysec.com",
      documentation: "https://docs.citysec.com",
    },
  });
});

// ============================================
// REGISTRO DE RUTAS CON VERSIONAMIENTO
// Todas las rutas usan el prefijo /api/v1/
// ============================================

/**
 * Rutas de autenticación (públicas y privadas)
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/refresh
 * - etc.
 */
app.use(`/api/${API_VERSION}/auth`, authRoutes);

/**
 * Rutas de gestión de usuarios (requieren autenticación)
 * - GET /api/v1/usuarios
 * - POST /api/v1/usuarios
 * - etc.
 */
app.use(`/api/${API_VERSION}/usuarios`, usuariosRoutes);

/**
 * Rutas de catálogos del sistema
 */
app.use(`/api/${API_VERSION}/catalogos`, catalogosRoutes);

/**
 * Rutas de novedades e incidentes
 */
app.use(`/api/${API_VERSION}/novedades`, novedadesRoutes);

/**
 * Rutas de gestión de personal
 */
app.use(`/api/${API_VERSION}/personal`, personalRoutes);

/**
 * Rutas de sectores y cuadrantes
 */
app.use(`/api/${API_VERSION}/sectores`, sectoresRoutes);

/**
 * Rutas de vehículos y combustible
 */
app.use(`/api/${API_VERSION}/vehiculos`, vehiculosRoutes);

/**
 * Rutas de cuadrantes
 */
app.use(`/api/${API_VERSION}/cuadrantes`, cuadrantesRoutes);

/**
 * Rutas de permisos (solo admin)
 */
app.use(`/api/${API_VERSION}/permisos`, permisosRoutes);

/**
 * Rutas de roles (solo admin)
 */
app.use(`/api/${API_VERSION}/roles`, rolesRoutes);

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// Debe estar DESPUÉS de todas las rutas válidas
// ============================================

/**
 * Middleware para capturar rutas no encontradas
 * Se ejecuta si ninguna ruta anterior hizo match
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.path,
    method: req.method,
    suggestion: "Verifique la documentación de la API",
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// SIEMPRE debe ser el ÚLTIMO middleware
// ============================================

/**
 * Error handler global
 * Captura todos los errores de la aplicación
 *
 * IMPORTANTE: Este middleware debe tener 4 parámetros (err, req, res, next)
 * para que Express lo reconozca como error handler
 */
app.use((err, req, res, next) => {
  // Log del error en consola (en desarrollo)
  if (NODE_ENV === "development") {
    console.error("═══════════════════════════════════");
    console.error("ERROR CAPTURADO:");
    console.error("═══════════════════════════════════");
    console.error("Mensaje:", err.message);
    console.error("Stack:", err.stack);
    console.error("═══════════════════════════════════");
  }

  // Errores de validación de Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
    });
  }

  // Errores de unique constraint de Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Ya existe un registro con estos datos",
      field: err.errors[0]?.path,
      value: err.errors[0]?.value,
    });
  }

  // Errores de foreign key de Sequelize
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Referencia inválida a otro registro",
      table: err.table,
      field: err.fields,
    });
  }

  // Errores de JWT (JsonWebTokenError)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
      code: "INVALID_TOKEN",
    });
  }

  // Token expirado (TokenExpiredError)
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
      code: "TOKEN_EXPIRED",
      expiredAt: err.expiredAt,
    });
  }

  // Errores de CORS
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "Acceso no permitido por política CORS",
      code: "CORS_ERROR",
    });
  }

  // Errores de body demasiado grande
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: `El tamaño del body excede el límite permitido (${MAX_BODY_SIZE})`,
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  // Errores de timeout
  if (err.code === "ETIMEDOUT" || err.timeout) {
    return res.status(408).json({
      success: false,
      message: "La petición excedió el tiempo límite",
      code: "REQUEST_TIMEOUT",
    });
  }

  // Error genérico
  // En producción, NO exponer detalles del error
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Error interno del servidor";

  res.status(statusCode).json({
    success: false,
    message: message,
    code: err.code || "INTERNAL_ERROR",
    // Solo incluir stack trace en desarrollo
    ...(NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
});

// ============================================
// FUNCIÓN PARA INICIAR EL SERVIDOR
// ============================================

/**
 * Inicia el servidor Express después de conectar a la BD
 */
const startServer = async () => {
  try {
    console.log("\n🔄 Iniciando servidor...\n");

    // 1. Verificar conexión a la base de datos
    console.log("📊 Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente\n");

    // 2. Sincronizar modelos (solo en desarrollo si SYNC_DB=true)
    if (NODE_ENV === "development" && process.env.SYNC_DB === "true") {
      console.log("🔄 Sincronizando modelos con la base de datos...");
      await sequelize.sync({ alter: false }); // No alterar tablas existentes
      console.log("✅ Modelos sincronizados\n");
    }

    // 3. Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log("┌─────────────────────────────────────────────┐");
      console.log("│                                             │");
      console.log(`│  🚀 Servidor iniciado exitosamente          │`);
      console.log("│                                             │");
      console.log(`│  🌐 URL: http://localhost:${PORT}             │`);
      console.log(
        `│  📚 API: http://localhost:${PORT}/api/${API_VERSION}      │`
      );
      console.log(`│  ❤️  Health: http://localhost:${PORT}/health  │`);
      console.log("│                                             │");
      console.log(`│  🔐 Ambiente: ${NODE_ENV.padEnd(28)}│`);
      console.log(`│  📦 Versión API: ${API_VERSION.padEnd(24)}│`);
      console.log("│                                             │");
      console.log("└─────────────────────────────────────────────┘\n");

      console.log("💡 Endpoints principales:");
      console.log(`  • POST   /api/${API_VERSION}/auth/register`);
      console.log(`  • POST   /api/${API_VERSION}/auth/login`);
      console.log(`  • POST   /api/${API_VERSION}/auth/refresh`);
      console.log(`  • GET    /api/${API_VERSION}/auth/me`);
      console.log(`  • GET    /api/${API_VERSION}/usuarios`);
      console.log(`  • POST   /api/${API_VERSION}/usuarios`);
      console.log(`  • GET    /api/${API_VERSION}/catalogos`);
      console.log(`  • GET    /api/${API_VERSION}/novedades`);
      console.log("");
      console.log("📝 Documentación completa en /api/${API_VERSION}\n");

      // Advertencias de seguridad en desarrollo
      if (NODE_ENV === "development") {
        console.log("⚠️  MODO DESARROLLO:");
        console.log("  - Logs detallados habilitados");
        console.log("  - CORS permite requests sin origin");
        console.log("  - Stack traces en errores\n");
      }
    });
  } catch (error) {
    console.error("\n❌ Error al iniciar el servidor:");
    console.error("═══════════════════════════════════");
    console.error(error);
    console.error("═══════════════════════════════════\n");
    process.exit(1); // Salir con código de error
  }
};

// ============================================
// MANEJO DE SEÑALES DE TERMINACIÓN
// Graceful shutdown
// ============================================

/**
 * Maneja el cierre graceful del servidor
 * Cierra conexiones de BD antes de terminar el proceso
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} recibido. Cerrando servidor gracefully...\n`);

  try {
    // Cerrar conexión a la BD
    await sequelize.close();
    console.log("✅ Conexión a la base de datos cerrada\n");

    // Salir con código exitoso
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el cierre:", error);
    process.exit(1);
  }
};

// Escuchar señales de terminación
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================
// MANEJO DE ERRORES NO CAPTURADOS
// Última línea de defensa
// ============================================

/**
 * Captura excepciones no manejadas
 * Estas deberían ser raras si el código está bien escrito
 */
process.on("uncaughtException", (error) => {
  console.error("\n❌ UNCAUGHT EXCEPTION:");
  console.error("═══════════════════════════════════");
  console.error(error);
  console.error("═══════════════════════════════════\n");

  // En producción, intentar cerrar gracefully
  if (NODE_ENV === "production") {
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  } else {
    // En desarrollo, salir inmediatamente
    process.exit(1);
  }
});

/**
 * Captura promesas rechazadas no manejadas
 * Ocurren cuando una promesa es rechazada sin catch
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ UNHANDLED PROMISE REJECTION:");
  console.error("═══════════════════════════════════");
  console.error("Promesa:", promise);
  console.error("Razón:", reason);
  console.error("═══════════════════════════════════\n");

  // En producción, intentar cerrar gracefully
  if (NODE_ENV === "production") {
    gracefulShutdown("UNHANDLED_REJECTION");
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

startServer();

// ============================================
// EXPORTAR APP (para testing)
// ============================================

export default app;
