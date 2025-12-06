/**
 * ============================================
 * CONFIGURACIÓN DE BASE DE DATOS (SEQUELIZE)
 * ============================================
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

// Dialecto de base de datos
const DB_DIALECT = "mysql";

/**
 * Configuraciones por entorno
 * Separación clara entre: development, test y production
 */
const config = {
  // ========================================
  // ENTORNO DE DESARROLLO
  // ========================================
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "citizen_security_v2",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: DB_DIALECT,
    logging: console.log, // Mostrar queries SQL en consola
    pool: {
      max: 10, // Máximo de conexiones en el pool
      min: 0, // Mínimo de conexiones en el pool
      acquire: 30000, // Tiempo máximo (ms) para obtener conexión
      idle: 10000, // Tiempo máximo (ms) de inactividad antes de liberar conexión
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      timestamps: false, // Desactivar timestamps por defecto (lo manejamos manualmente)
    },
    dialectOptions: {
      charset: "utf8mb4",
      dateStrings: true,
      typeCast: true,
    },
    timezone: "-05:00", // Zona horaria de Perú (GMT-5)
  },

  // ========================================
  // ENTORNO DE TESTING
  // ========================================
  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_TEST || "citizen_security_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: DB_DIALECT,
    logging: false, // Desactivar logs en tests
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
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
    timezone: "-05:00",
  },

  // ========================================
  // ENTORNO DE PRODUCCIÓN
  // ========================================
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: DB_DIALECT,
    logging: false, // Desactivar logs en producción
    pool: {
      max: 20, // Más conexiones en producción
      min: 5,
      acquire: 30000,
      idle: 10000,
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
      ssl: {
        require: true,
        rejectUnauthorized: false, // Para conexiones SSL en producción
      },
    },
    timezone: "-05:00",
  },
};

/**
 * Determinar entorno actual y obtener configuración correspondiente
 */
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

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
 * Probar conexión a la base de datos
 */
sequelize
  .authenticate()
  .then(() => {
    console.log(
      `✅ Conexión a base de datos exitosa - Entorno: ${env.toUpperCase()}`
    );
  })
  .catch((error) => {
    console.error("❌ Error al conectar a la base de datos:", error.message);
  });

// Exportar la instancia de Sequelize (export default)
export default sequelize;

// También exportar la configuración completa por si se necesita
export { config, dbConfig };
