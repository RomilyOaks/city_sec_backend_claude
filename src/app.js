/**
 * Ruta: src/app.js
 * Descripción: Archivo principal de la aplicación Express
 * Configura middlewares, rutas, manejo de errores y conexión a base de datos
 * Punto de entrada del servidor backend
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";

// Importar rutas
import catalogosRoutes from "./routes/catalogos.routes.js";
import novedadesRoutes from "./routes/novedades.routes.js";
import personalRoutes from "./routes/personal.routes.js";
import sectoresRoutes from "./routes/sectores.routes.js";
import vehiculosRoutes from "./routes/vehiculos.routes.js";

// Importar nuevas rutas de autenticación y usuarios
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

// Cargar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();

/**
 * ============================================
 * CONFIGURACIÓN DE MIDDLEWARES
 * ============================================
 */

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear datos de formularios
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // En producción, especificar origen exacto
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware para logging de peticiones (desarrollo)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

/**
 * ============================================
 * RUTA DE HEALTH CHECK
 * ============================================
 */

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API de Seguridad Ciudadana funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * ============================================
 * REGISTRO DE RUTAS DE LA API
 * ============================================
 */

// Ruta raíz de la API
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API de Seguridad Ciudadana v2.0",
    version: "2.0.0",
    endpoints: {
      auth: "/api/auth",
      usuarios: "/api/usuarios",
      catalogos: "/api/catalogos",
      novedades: "/api/novedades",
      personal: "/api/personal",
      sectores: "/api/sectores",
      vehiculos: "/api/vehiculos",
    },
    documentation: "/api/docs",
  });
});

// Rutas de autenticación (públicas y privadas)
app.use("/api/auth", authRoutes);

// Rutas de gestión de usuarios (requieren autenticación)
app.use("/api/usuarios", usuariosRoutes);

// Rutas de módulos operativos (requieren autenticación)
app.use("/api/catalogos", catalogosRoutes);
app.use("/api/novedades", novedadesRoutes);
app.use("/api/personal", personalRoutes);
app.use("/api/sectores", sectoresRoutes);
app.use("/api/vehiculos", vehiculosRoutes);

/**
 * ============================================
 * MANEJO DE RUTAS NO ENCONTRADAS (404)
 * ============================================
 */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.path,
    method: req.method,
  });
});

/**
 * ============================================
 * MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
 * ============================================
 */

app.use((err, req, res, next) => {
  console.error("Error capturado:", err);

  // Errores de validación de Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Errores de unique constraint de Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Ya existe un registro con estos datos",
      field: err.errors[0]?.path,
    });
  }

  // Errores de foreign key de Sequelize
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Referencia inválida a otro registro",
    });
  }

  // Errores de JWT
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
      code: "TOKEN_EXPIRED",
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/**
 * ============================================
 * FUNCIÓN PARA INICIAR EL SERVIDOR
 * ============================================
 */

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    console.log("🔄 Verificando conexión a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente");

    // Sincronizar modelos (solo en desarrollo, en producción usar migraciones)
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SYNC_DB === "true"
    ) {
      console.log("🔄 Sincronizando modelos con la base de datos...");
      await sequelize.sync({ alter: false }); // No alterar tablas existentes
      console.log("✅ Modelos sincronizados");
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log("\n┌─────────────────────────────────────────────┐");
      console.log("│                                             │");
      console.log(`│  🚀 Servidor iniciado en puerto ${PORT}      │`);
      console.log("│                                             │");
      console.log(`│  🌐 URL: http://localhost:${PORT}             │`);
      console.log(`│  📚 API: http://localhost:${PORT}/api         │`);
      console.log(`│  ❤️  Health: http://localhost:${PORT}/health  │`);
      console.log("│                                             │");
      console.log(
        `│  🔐 Ambiente: ${
          process.env.NODE_ENV || "development"
        }              │`
      );
      console.log("│                                             │");
      console.log("└─────────────────────────────────────────────┘\n");

      console.log("💡 Endpoints disponibles:");
      console.log("  • POST   /api/auth/register");
      console.log("  • POST   /api/auth/login");
      console.log("  • POST   /api/auth/refresh");
      console.log("  • POST   /api/auth/logout");
      console.log("  • GET    /api/auth/me");
      console.log("  • GET    /api/usuarios");
      console.log("  • POST   /api/usuarios");
      console.log("  • PUT    /api/usuarios/:id");
      console.log("  • DELETE /api/usuarios/:id\n");
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

/**
 * ============================================
 * MANEJO DE SEÑALES DE TERMINACIÓN
 * ============================================
 */

// Manejar cierre graceful del servidor
process.on("SIGTERM", async () => {
  console.log("\n🛑 SIGTERM recibido. Cerrando servidor...");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\n🛑 SIGINT recibido. Cerrando servidor...");
  await sequelize.close();
  process.exit(0);
});

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

/**
 * ============================================
 * INICIAR SERVIDOR
 * ============================================
 */

startServer();

// Exportar app para testing
export default app;
