/**
 * Ruta: src/app.js
 *
 * Descripción:
 * Archivo principal de la aplicación Express para el Sistema de Seguridad Ciudadana.
 * Configura todos los middlewares de seguridad, parsers, rutas y manejo de errores.
 *
 * VERSIÓN: 2.2.0
 * ÚLTIMA ACTUALIZACIÓN: 2025-12-13
 *
 * CAMBIOS v2.2.0:
 * - ✅ Agregadas rutas de /cargos
 * - ✅ Health check dentro de /api/v1/health
 * - ✅ Eliminados valores hardcodeados
 * - ✅ Todo configurado desde .env
 *
 * @module app
 * @version 2.2.0
 * @date 2025-12-13
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
import auditoriaAccionRoutes from "./routes/auditoriaAcciones.routes.js";
import abastecimientosRoutes from "./routes/abastecimientos.routes.js";
import mantenimientosRoutes from "./routes/mantenimientos.routes.js";
import talleresRoutes from "./routes/talleres.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";

// Rutas de catalogos
import cargosRoutes from "./routes/cargos.routes.js";
import tipoNovedadRoutes from "./routes/tipo-novedad.routes.js";
import subtipoNovedadRoutes from "./routes/subtipo-novedad.routes.js";
import estadoNovedadRoutes from "./routes/estado-novedad.routes.js";
import unidadOficinaRoutes from "./routes/unidad-oficina.routes.js";

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

const swaggerDocument = JSON.parse(
  fs.readFileSync(new URL("../swagger_output.json", import.meta.url))
);

app.use(
  `/api/${API_VERSION}/docs`,
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocument)
);

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
      process.env.CORS_ORIGIN || "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:4200",
    ].filter(Boolean);

    if (NODE_ENV === "development" && !origin) {
      return callback(null, true);
    }

    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
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

// ============================================
// HEALTH CHECK ENDPOINT (FUERA DE VERSIONAMIENTO)
// Mantener para load balancers
// ============================================

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
// ============================================

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
      mantenimientos: `/api/${API_VERSION}/mantenimientos`,
      talleres: `/api/${API_VERSION}/talleres`,
      reportes: `/api/${API_VERSION}/reportes`,
      cuadrantes: `/api/${API_VERSION}/cuadrantes`,
      cargos: `/api/${API_VERSION}/cargos`, // ✅ AGREGADO
      tipos_novedad: `/api/${API_VERSION}/tipos-novedad`, // ✅ NUEVO
      subtipos_novedad: `/api/${API_VERSION}/subtipos-novedad`, // ✅ NUEVO
      estados_novedad: `/api/${API_VERSION}/estados-novedad`, // ✅ NUEVO
      abastecimientos: `/api/${API_VERSION}/abastecimientos`, // ✅ NUEVO
    },
    contact: {
      support: "soporte@citysec.com",
      documentation: "https://docs.citysec.com",
    },
  });
});

// ============================================
// REGISTRO DE RUTAS CON VERSIONAMIENTO
// ============================================

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/usuarios`, usuariosRoutes);
app.use(`/api/${API_VERSION}/catalogos`, catalogosRoutes);
app.use(`/api/${API_VERSION}/novedades`, novedadesRoutes);
app.use(`/api/${API_VERSION}/personal`, personalRoutes);
app.use(`/api/${API_VERSION}/sectores`, sectoresRoutes);
app.use(`/api/${API_VERSION}/vehiculos`, vehiculosRoutes);
app.use(`/api/${API_VERSION}/cuadrantes`, cuadrantesRoutes);
app.use(`/api/${API_VERSION}/permisos`, permisosRoutes);
app.use(`/api/${API_VERSION}/roles`, rolesRoutes);
app.use(`/api/${API_VERSION}/auditoria`, auditoriaAccionRoutes);
app.use(`/api/${API_VERSION}/abastecimientos`, abastecimientosRoutes);
app.use(`/api/${API_VERSION}/mantenimientos`, mantenimientosRoutes);
app.use(`/api/${API_VERSION}/talleres`, talleresRoutes);
app.use(`/api/${API_VERSION}/reportes`, reportesRoutes);

// Rutas de cargos
app.use(`/api/${API_VERSION}/cargos`, cargosRoutes);

// Rutas de Tipos, Subtipos, Estados de Novedad y Unidades de Oficinas
app.use(`/api/${API_VERSION}/tipos-novedad`, tipoNovedadRoutes);
app.use(`/api/${API_VERSION}/subtipos-novedad`, subtipoNovedadRoutes);
app.use(`/api/${API_VERSION}/estados-novedad`, estadoNovedadRoutes);
app.use(`/api/${API_VERSION}/unidades-oficina`, unidadOficinaRoutes);

// ============================================
// ✅ HEALTH CHECK DENTRO DE VERSIONAMIENTO
// ============================================

app.get(`/api/${API_VERSION}/health`, async (req, res) => {
  try {
    await sequelize.authenticate();

    const dbStatus = {
      connected: true,
      type: sequelize.config.dialect,
      host: sequelize.config.host,
      database: sequelize.config.database,
    };

    res.status(200).json({
      success: true,
      message: "API funcionando correctamente",
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: NODE_ENV,
      uptime: Math.floor(process.uptime()),
      database: dbStatus,
      memory: {
        usage:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        unit: "MB",
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Servicio no disponible",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ============================================

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
      console.log(`  • GET    /api/${API_VERSION}/cargos         ✅ NEW`);
      console.log(`  • GET    /api/${API_VERSION}/tipos-novedad  ✅ NEW`);
      console.log(`  • GET    /api/${API_VERSION}/subtipos-novedad  ✅ NEW`);
      console.log(`  • GET    /api/${API_VERSION}/vehiculos`);
      console.log(`  • GET    /api/${API_VERSION}/novedades`);
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
