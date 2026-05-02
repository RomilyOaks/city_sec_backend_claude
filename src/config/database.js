/**
 * ============================================
 * CONFIGURACIÓN DE BASE DE DATOS (SEQUELIZE)
 * ============================================
 *
 * Ruta: src/config/database.js
 *
 * VERSIÓN: 2.1.0
 * ÚLTIMA ACTUALIZACIÓN: 2025-12-13
 *
 * CAMBIOS v2.1.0:
 * - ✅ Pool configurado desde .env (sin valores hardcodeados)
 * - ✅ Retry logic agregado
 * - ✅ Evict interval para limpieza de conexiones
 *
 * Configuración de Sequelize para conectar a MySQL.
 * Sequelize es un ORM (Object-Relational Mapping) que:
 * - Abstrae las consultas SQL
 * - Previene SQL injection automáticamente
 * - Maneja las relaciones entre tablas
 * - Facilita migraciones y seeders
 */

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// ============================================
// VARIABLES DE ENTORNO
// ============================================

const NODE_ENV = process.env.NODE_ENV || "development";
const DB_DIALECT = process.env.DB_DIALECT || "mysql";

// Conexión
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "citizen_security_v2";
const DB_NAME_TEST = process.env.DB_NAME_TEST || "citizen_security_test";

// Pool de conexiones (desde .env) - Optimizado para desarrollo
const POOL_MAX =
  parseInt(process.env.DB_POOL_MAX) || (NODE_ENV === "production" ? 20 : 5);
const POOL_MIN =
  parseInt(process.env.DB_POOL_MIN) || (NODE_ENV === "production" ? 5 : 1);
const POOL_ACQUIRE = parseInt(process.env.DB_POOL_ACQUIRE) || 30000; // 30 segundos (reducido)
const POOL_IDLE = parseInt(process.env.DB_POOL_IDLE) || 5000; // 5 segundos (reducido)
const POOL_EVICT = parseInt(process.env.DB_POOL_EVICT) || 5000; // 5 segundos (aumentado)

// Retry (desde .env)
const RETRY_MAX = parseInt(process.env.DB_RETRY_MAX) || 3;
const RETRY_TIMEOUT = parseInt(process.env.DB_RETRY_TIMEOUT) || 3000;

// Timezone
const DB_TIMEZONE = process.env.DB_TIMEZONE || "-05:00"; // Perú GMT-5

// Logging (solo se activa si DB_LOGGING=true explícitamente)
const ENABLE_LOGGING = process.env.DB_LOGGING === "true";

/**
 * Configuraciones por entorno
 * Separación clara entre: development, test y production
 */
const config = {
  // ========================================
  // ENTORNO DE DESARROLLO
  // ========================================
  development: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: ENABLE_LOGGING ? console.log : false,

    // Timeout de conexión para desarrollo
    acquireConnectionTimeout: 10000, // 10 segundos

    pool: {
      max: POOL_MAX,
      min: POOL_MIN,
      acquire: POOL_ACQUIRE,
      idle: POOL_IDLE,
      evict: POOL_EVICT,
      // Handle timeout errors gracefully
      handleDisconnects: true,
    },

    retry: {
      max: 2, // Reducido para desarrollo
      timeout: 2000, // Reducido para desarrollo
      match: [
        /ER_LOCK_WAIT_TIMEOUT/,
        /SQLITE_BUSY/,
        /ECONNRESET/,
        /ETIMEDOUT/,
        /ENOTFOUND/,
        /ENETUNREACH/,
        /ECONNREFUSED/,
      ],
    },

    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      timestamps: false,
    },

    dialectOptions: {
      charset: "utf8mb4",
      dateStrings: true,
      typeCast: true,
      // Timeout específico para MySQL
      connectTimeout: 10000,

    },

    timezone: DB_TIMEZONE,
  },

  // ========================================
  // ENTORNO DE TESTING
  // ========================================
  test: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME_TEST,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: false, // Desactivar logs en tests

    pool: {
      max: 5,
      min: 0,
      acquire: POOL_ACQUIRE,
      idle: POOL_IDLE,
      evict: POOL_EVICT,
    },

    retry: {
      max: RETRY_MAX,
      timeout: RETRY_TIMEOUT,
      match: [/ER_LOCK_WAIT_TIMEOUT/, /SQLITE_BUSY/],
    },

    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      timestamps: false,
    },

    dialectOptions: {
      charset: "utf8mb4",
      dateStrings: true,
      typeCast: true,
    },

    timezone: DB_TIMEZONE,
  },

  // ========================================
  // ENTORNO DE PRODUCCIÓN
  // ========================================
  production: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: false, // Desactivar logs en producción

    pool: {
      max: POOL_MAX,
      min: POOL_MIN,
      acquire: POOL_ACQUIRE,
      idle: POOL_IDLE,
      evict: POOL_EVICT,
    },

    retry: {
      max: RETRY_MAX,
      timeout: RETRY_TIMEOUT,
      match: [
        /ER_LOCK_WAIT_TIMEOUT/,
        /ECONNRESET/,
        /ETIMEDOUT/,
        /ENOTFOUND/,
        /ENETUNREACH/,
        /ECONNREFUSED/,
      ],
    },

    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      timestamps: false,
    },

    dialectOptions: {
      charset: "utf8mb4",
      dateStrings: true,
      typeCast: true,
      ssl:
        process.env.DB_SSL === "true"
          ? {
            require: true,
            rejectUnauthorized: false,
          }
          : undefined,
    },

    timezone: DB_TIMEZONE,
  },
};

/**
 * Determinar entorno actual y obtener configuración correspondiente
 */
const dbConfig = config[NODE_ENV];

/**
 * Crear instancia de Sequelize con la configuración del entorno actual
 */
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

/**
 * Función para probar conexión a la base de datos (se llama manualmente)
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      `✅ Conexión a base de datos exitosa - Entorno: ${NODE_ENV.toUpperCase()}`
    );
    console.log(`   📊 Base de datos: ${dbConfig.database}`);
    console.log(`   🖥️  Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(
      `   🔌 Pool: max=${dbConfig.pool.max}, min=${dbConfig.pool.min}`
    );
    return true;
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:");
    console.error(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.error(`   Database: ${dbConfig.database}`);
    console.error(`   User: ${dbConfig.username}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
};

// Exportar la instancia de Sequelize (export default)
export default sequelize;

// También exportar la configuración completa por si se necesita
export { config, dbConfig };
