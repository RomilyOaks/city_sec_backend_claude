/**
 * index.route.js
 * Configuración Principal de Rutas
 * Centraliza todas las rutas de la API con prefijos y middlewares globales
 */

import express from "express";
const router = express.Router();

// Importar routers de módulos
import novedadesRoutes from "./novedades.routes.js";
import vehiculosRoutes from "./vehiculos.routes.js";
import personalRoutes from "./personal.routes.js";
import sectoresRoutes from "./sectores.routes.js";
import cuadrantesRoutes from "./cuadrantes.routes.js";
import authRoutes from "./auth.routes.js";
import catalogosRoutes from "./catalogos.routes.js";
import reportesRoutes from "./reportes.routes.js";

// Middleware global para logging de requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Rutas públicas (sin autenticación)
 */
router.use("/auth", authRoutes); // Login, registro, recuperar contraseña

/**
 * Rutas protegidas (requieren autenticación)
 * Todas las rutas siguientes requieren token JWT válido
 */

// Módulo de Novedades/Incidentes
router.use("/novedades", novedadesRoutes);

// Módulo de Vehículos
router.use("/vehiculos", vehiculosRoutes);

// Módulo de Personal
router.use("/personal", personalRoutes);

// Módulo de Sectores
router.use("/sectores", sectoresRoutes);

// Módulo de Cuadrantes
router.use("/cuadrantes", cuadrantesRoutes);

// Catálogos (tipos, subtipos, estados, etc.)
router.use("/catalogos", catalogosRoutes);

// Reportes y estadísticas
router.use("/reportes", reportesRoutes);

/**
 * Ruta de health check
 * Verifica que la API esté funcionando
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || "1.0.0",
  });
});

/**
 * Ruta no encontrada (404)
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

export default router;
