/**
 * ============================================
 * PUNTO DE ENTRADA DEL SERVIDOR
 * ============================================
 *
 * Este archivo es el punto de entrada de la aplicación.
 * Se encarga de:
 * - Cargar variables de entorno
 * - Inicializar la base de datos
 * - Iniciar el servidor Express
 * - Manejar el cierre graceful del servidor
 */

// Cargar variables de entorno ANTES que cualquier otra cosa
require("dotenv").config();

const app = require("./src/app");
const { sequelize } = require("./src/models");
const logger = require("./src/utils/logger");

// Puerto desde variables de entorno o 3000 por defecto
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Función para iniciar el servidor
 */
const startServer = async () => {
  try {
    // ========================================
    // 1. VERIFICAR CONEXIÓN A BASE DE DATOS
    // ========================================
    logger.info("🔌 Conectando a la base de datos...");
    await sequelize.authenticate();
    logger.info("✅ Conexión a base de datos establecida correctamente");

    // ========================================
    // 2. SINCRONIZAR MODELOS (Solo en desarrollo)
    // ========================================
    // IMPORTANTE: En producción, usa migraciones en lugar de sync
    if (NODE_ENV === "development") {
      logger.info("🔄 Sincronizando modelos con la base de datos...");
      // alter: true ajusta las tablas sin eliminar datos
      // force: true eliminaría todas las tablas (¡PELIGROSO!)
      await sequelize.sync({ alter: false });
      logger.info("✅ Modelos sincronizados");
    }

    // ========================================
    // 3. INICIAR SERVIDOR EXPRESS
    // ========================================
    const server = app.listen(PORT, () => {
      logger.info("=".repeat(50));
      logger.info(`🚀 Servidor iniciado exitosamente`);
      logger.info(`📍 URL: http://localhost:${PORT}`);
      logger.info(`🌍 Entorno: ${NODE_ENV}`);
      logger.info(`📅 Fecha: ${new Date().toLocaleString("es-PE")}`);
      logger.info("=".repeat(50));
    });

    // ========================================
    // 4. CONFIGURAR CIERRE GRACEFUL
    // ========================================
    // Esto asegura que el servidor se cierre correctamente
    // cuando reciba señales de terminación

    const gracefulShutdown = async (signal) => {
      logger.info(`\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);

      server.close(async () => {
        logger.info("✅ Servidor HTTP cerrado");

        try {
          // Cerrar conexiones a base de datos
          await sequelize.close();
          logger.info("✅ Conexión a base de datos cerrada");

          logger.info("👋 Proceso terminado correctamente");
          process.exit(0);
        } catch (error) {
          logger.error("❌ Error al cerrar conexiones:", error);
          process.exit(1);
        }
      });

      // Si después de 10 segundos no se cerró, forzar cierre
      setTimeout(() => {
        logger.error("❌ No se pudo cerrar correctamente. Forzando cierre...");
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de terminación
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // ========================================
    // 5. MANEJAR ERRORES NO CAPTURADOS
    // ========================================

    // Errores no capturados en promesas
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("❌ Unhandled Rejection at:", promise);
      logger.error("Reason:", reason);
      // En producción, podrías querer cerrar el servidor aquí
      // process.exit(1);
    });

    // Excepciones no capturadas
    process.on("uncaughtException", (error) => {
      logger.error("❌ Uncaught Exception:", error);
      // Cerrar servidor inmediatamente
      process.exit(1);
    });
  } catch (error) {
    logger.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// ========================================
// INICIAR APLICACIÓN
// ========================================
startServer();

/**
 * NOTAS IMPORTANTES:
 *
 * 1. Variables de Entorno:
 *    - Siempre usa .env para configuración sensible
 *    - Nunca comitees el archivo .env al repositorio
 *    - Usa .env.example como plantilla
 *
 * 2. Base de Datos:
 *    - En desarrollo: sync puede ser útil
 *    - En producción: SIEMPRE usa migraciones
 *    - Nunca uses sync({ force: true }) en producción
 *
 * 3. Cierre Graceful:
 *    - Permite que las conexiones activas terminen
 *    - Cierra la BD correctamente
 *    - Evita pérdida de datos
 *
 * 4. Manejo de Errores:
 *    - Siempre captura errores no manejados
 *    - Logea todo para debugging
 *    - En producción, notifica a un sistema de monitoreo
 */
