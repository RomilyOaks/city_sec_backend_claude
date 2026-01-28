/**
 * Ruta: src/app.js
 *
 * Descripción:
 * Archivo principal de la aplicación Express para el Sistema de Seguridad Ciudadana.
 * Configura todos los middlewares de seguridad, parsers, rutas y manejo de errores.
 *
 * VERSIÓN: 2.4.0
 * ÚLTIMA ACTUALIZACIÓN: 2025-12-23
 *
 * CAMBIOS v2.4.0:
 * - ✅ Migrado a usar index.routes.js centralizado
 * - ✅ Agregadas rutas del módulo Calles y Direcciones
 * - ✅ Simplificado registro de rutas
 *
 * CAMBIOS v2.2.0:
 * - ✅ Agregadas rutas de /cargos
 * - ✅ Health check dentro de /api/v1/health
 * - ✅ Eliminados valores hardcodeados
 * - ✅ Todo configurado desde .env
 *
 * @module app
 * @version 2.4.0
 * @date 2025-12-23
 */

// ============================================
// IMPORTACIONES DE LIBRERÍAS
// ============================================

import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import compression from "compression";

// Configuración de la base de datos
import sequelize from "./config/database.js";

// ============================================
// IMPORTACIÓN DE RUTAS CENTRALIZADO ✨ NUEVO
// ============================================

import indexRoutes from "./routes/index.routes.js";

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_VERSION = process.env.API_VERSION || "v1";
const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || "10mb";

const app = express();

import swaggerUI from "swagger-ui-express";
import fs from "fs";
import YAML from "yamljs";

const swaggerDocument = JSON.parse(
  fs.readFileSync(new URL("../swagger_output.json", import.meta.url))
);

if (swaggerDocument?.paths && typeof swaggerDocument.paths === "object") {
  const resolvedPaths = {};
  for (const [pathKey, pathValue] of Object.entries(swaggerDocument.paths)) {
    const newKey = pathKey.replaceAll("${API_VERSION}", API_VERSION);
    resolvedPaths[newKey] = pathValue;
  }
  swaggerDocument.paths = resolvedPaths;
}

if (process.env.SWAGGER_SERVER_URL) {
  swaggerDocument.servers = [
    {
      url: process.env.SWAGGER_SERVER_URL,
      description: NODE_ENV,
    },
  ];
} else {
  delete swaggerDocument.servers;
}

app.use(
  `/api/${API_VERSION}/docs`,
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocument)
);

app.get(`/api/${API_VERSION}/docs.json`, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(swaggerDocument);
});

app.get(`/api/${API_VERSION}/docs.yaml`, (req, res) => {
  res.setHeader("Content-Type", "application/yaml");
  res.status(200).send(YAML.stringify(swaggerDocument, 12));
});

// ============================================
// MIDDLEWARE 1: SEGURIDAD - HELMET
// ============================================

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
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ============================================
// MIDDLEWARE 2: SEGURIDAD - CORS
// ============================================

const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = [
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:4200",
      "http://127.0.0.1:5173",
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow any *.railway.app origin in production
    if (origin && origin.includes(".railway.app")) {
      return callback(null, true);
    }

    // Allow any localhost or 127.0.0.1 origin (dev proxies, etc.)
    if (
      origin &&
      (origin.includes("localhost") || origin.includes("127.0.0.1"))
    ) {
      return callback(null, true);
    }

    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ============================================
// MIDDLEWARE 3: PARSERS
// ============================================

app.use(
  express.json({
    limit: MAX_BODY_SIZE,
    strict: true,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: MAX_BODY_SIZE,
  })
);

// ============================================
// MIDDLEWARE 4: LOGGING
// ============================================

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============================================
// MIDDLEWARE 5: COMPRESSION
// ============================================

app.use(
  compression({
    threshold: 1024,
    level: 6,
  })
);

// ============================================
// MIDDLEWARE 6: TIMEOUT
// ============================================

const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS) || 30000;

app.use((req, res, next) => {
  req.setTimeout(TIMEOUT_MS);
  res.setTimeout(TIMEOUT_MS);
  next();
});

// ============================================
// MIDDLEWARE 7: SECURITY HEADERS ADICIONALES
// ============================================

app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-API-Version", API_VERSION);
  next();
});

// ============================================================================
// REGISTRO DE RUTAS CENTRALIZADO ✨ NUEVO v2.4.0
// ============================================================================

/**
 * Todas las rutas están centralizadas en routes/index.routes.js
 *
 * Módulos disponibles:
 * - /auth
 * - /usuarios, /roles, /permisos
 * - /novedades, /vehiculos, /personal
 * - /sectores, /cuadrantes
 * - /catalogos, /cargos
 * - /tipos-via, /calles, /calles-cuadrantes, /direcciones ← NUEVO
 * - /auditoria
 *
 * El router index.routes.js maneja:
 * - Logging de requests
 * - Health check en /api/v1/health
 * - Ruta raíz con info de API en /api/v1
 * - Manejo de 404
 */
console.log(`\n📦 Registrando rutas en /api/${API_VERSION}...`);

app.use(`/api/${API_VERSION}`, indexRoutes);

console.log(`✅ Rutas registradas correctamente\n`);

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// Este 404 captura rutas fuera de /api/v1
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.path,
    method: req.method,
    suggestion: `Verifique la documentación en /api/${API_VERSION}`,
  });
});

// // ============================================
// MIDDLEWARE 4: REGISTRO DE RUTAS ✨ NUEVO
// ============================================

app.use(`/api/${API_VERSION}`, indexRoutes);

// ============================================
// MIDDLEWARE 5: MANEJO DE ERRORES
// ============================================

app.use((err, req, res, next) => {
  if (NODE_ENV === "development") {
    console.error("═══════════════════════════════════");
    console.error("ERROR CAPTURADO:");
    console.error("═══════════════════════════════════");
    console.error("Mensaje:", err.message);
    console.error("Stack:", err.stack);
    console.error("═══════════════════════════════════");
  }

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

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Ya existe un registro con estos datos",
      field: err.errors[0]?.path,
      value: err.errors[0]?.value,
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Referencia inválida a otro registro",
      table: err.table,
      field: err.fields,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
      code: "TOKEN_EXPIRED",
      expiredAt: err.expiredAt,
    });
  }

  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "Acceso no permitido por política CORS",
      code: "CORS_ERROR",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: `El tamaño del body excede el límite permitido (${MAX_BODY_SIZE})`,
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  if (err.code === "ETIMEDOUT" || err.timeout) {
    return res.status(408).json({
      success: false,
      message: "La petición excedió el tiempo límite",
      code: "REQUEST_TIMEOUT",
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Error interno del servidor";

  res.status(statusCode).json({
    success: false,
    message: message,
    code: err.code || "INTERNAL_ERROR",
    ...(NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
});

// ============================================
// FUNCIÓN PARA INICIAR EL SERVIDOR
// ============================================

const startServer = async () => {
  try {
    console.log("\n🔄 Iniciando servidor...\n");

    console.log("📊 Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente\n");

    if (NODE_ENV === "development" && process.env.SYNC_DB === "true") {
      console.log("🔄 Sincronizando modelos con la base de datos...");
      await sequelize.sync({ alter: false });
      console.log("✅ Modelos sincronizados\n");
    }

    app.listen(PORT, () => {
      console.log("┌─────────────────────────────────────────────────┐");
      console.log("│                                                 │");
      console.log(`│  🚀 Servidor iniciado exitosamente              │`);
      console.log("│                                                 │");
      console.log(`│  🌐 URL: http://localhost:${PORT}                  │`);
      console.log(
        `│  📚 API: http://localhost:${PORT}/api/${API_VERSION}           │`
      );
      console.log(
        `│  ❤️  Health: http://localhost:${PORT}/api/${API_VERSION}/health │`
      );
      console.log(
        `│  📖 Docs: http://localhost:${PORT}/api/${API_VERSION}/docs     │`
      );
      console.log("│                                                 │");
      console.log(`│  🔐 Ambiente: ${NODE_ENV.padEnd(28)}      │`);
      console.log(`│  📦 Versión API: ${API_VERSION.padEnd(24)}       │`);
      console.log("│                                                 │");
      console.log("└─────────────────────────────────────────────────┘\n");

      console.log("💡 Endpoints principales:");
      console.log(`  • POST   /api/${API_VERSION}/auth/login`);
      console.log(`  • GET    /api/${API_VERSION}/personal`);
      console.log(`  • GET    /api/${API_VERSION}/cargos`);
      console.log(`  • GET    /api/${API_VERSION}/tipos-novedad`);
      console.log(`  • GET    /api/${API_VERSION}/subtipos-novedad`);
      console.log(`  • GET    /api/${API_VERSION}/vehiculos`);
      console.log(`  • GET    /api/${API_VERSION}/novedades`);
      console.log("");
      console.log("📍 Módulo Calles y Direcciones:");
      console.log(`  • GET    /api/${API_VERSION}/tipos-via/activos`);
      console.log(`  • GET    /api/${API_VERSION}/calles`);
      console.log(`  • GET    /api/${API_VERSION}/direcciones`);
      console.log("");
      console.log("📋 Módulo Catálogos:");
      console.log(`  • GET    /api/${API_VERSION}/radios-tetra`);
      console.log(`  • GET    /api/${API_VERSION}/unidades-oficina`);
      console.log(`  • GET    /api/${API_VERSION}/cuadrantes-vehiculos-asignados`);
      console.log("");
      console.log(`📝 Documentación completa en /api/${API_VERSION}\n`);

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
    process.exit(1);
  }
};

// ============================================
// MANEJO DE SEÑALES DE TERMINACIÓN
// ============================================

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} recibido. Cerrando servidor gracefully...\n`);

  try {
    await sequelize.close();
    console.log("✅ Conexión a la base de datos cerrada\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el cierre:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================
// MANEJO DE ERRORES NO CAPTURADOS
// ============================================

process.on("uncaughtException", (error) => {
  console.error("\n❌ UNCAUGHT EXCEPTION:");
  console.error("═══════════════════════════════════");
  console.error(error);
  console.error("═══════════════════════════════════\n");

  if (NODE_ENV === "production") {
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  } else {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ UNHANDLED PROMISE REJECTION:");
  console.error("═══════════════════════════════════");
  console.error("Promesa:", promise);
  console.error("Razón:", reason);
  console.error("═══════════════════════════════════\n");

  if (NODE_ENV === "production") {
    gracefulShutdown("UNHANDLED_REJECTION");
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

if (NODE_ENV !== "test") {
  startServer();
}

// ============================================
// EXPORTAR APP (para testing)
// ============================================

export default app;
