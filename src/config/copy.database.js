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

require("dotenv").config();

/**
 * Configuración de la base de datos
 * Se exporta un objeto con configuraciones para diferentes entornos
 */
module.exports = {
  // ========================================
  // ENTORNO DE DESARROLLO
  // ========================================
  development: {
    // Credenciales de conexión
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "citizen_security_v2",
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT) || 3306,

    // Dialecto: MySQL (también soporta postgres, sqlite, mssql)
    dialect: "mysql",

    // Configuración del pool de conexiones
    pool: {
      max: 5, // Máximo de conexiones simultáneas
      min: 0, // Mínimo de conexiones
      acquire: 30000, // Tiempo máximo (ms) para obtener conexión antes de error
      idle: 10000, // Tiempo máximo (ms) que una conexión puede estar inactiva
    },

    // Opciones de logging
    logging: console.log, // En desarrollo, mostrar queries SQL

    // Opciones adicionales
    define: {
      // Timestamps automáticos (createdAt, updatedAt)
      timestamps: true,

      // Usar snake_case para nombres de tablas y columnas
      underscored: true,

      // Prevenir eliminación en cascada accidental
      paranoid: false, // Si es true, usa soft deletes (deleted_at)

      // Nombrado de tablas
      freezeTableName: true, // No pluralizar nombres de tablas
    },

    // Timezone de MySQL
    timezone: "-05:00", // Perú (UTC-5)
  },

  // ========================================
  // ENTORNO DE TESTING
  // ========================================
  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_TEST || "citizen_security_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: "mysql",

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    // En tests, no mostrar queries SQL
    logging: false,

    define: {
      timestamps: true,
      underscored: true,
      paranoid: false,
      freezeTableName: true,
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
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: "mysql",

    // Pool más grande en producción
    pool: {
      max: 20, // Más conexiones simultáneas
      min: 5, // Mantener conexiones mínimas activas
      acquire: 60000, // Más tiempo de espera
      idle: 10000,
    },

    // En producción, no loguear queries (por performance)
    logging: false,

    define: {
      timestamps: true,
      underscored: true,
      paranoid: false,
      freezeTableName: true,
    },

    timezone: "-05:00",

    // Configuración SSL para conexiones seguras (si aplica)
    dialectOptions: {
      ssl:
        process.env.DB_SSL === "true"
          ? {
              require: true,
              rejectUnauthorized: false, // En algunos proveedores cloud
            }
          : false,

      // Configuraciones adicionales de MySQL
      connectTimeout: 60000,
    },
  },
};

/**
 * NOTAS IMPORTANTES:
 *
 * 1. Variables de Entorno:
 *    - Todas las credenciales deben estar en .env
 *    - Nunca hardcodear passwords en el código
 *    - Usa diferentes bases de datos para dev/test/prod
 *
 * 2. Pool de Conexiones:
 *    - Reutiliza conexiones en lugar de crear nuevas
 *    - Mejora significativamente el performance
 *    - Ajusta según tu carga de tráfico
 *
 * 3. Timezone:
 *    - Importante para fechas/horas correctas
 *    - Debe coincidir con el timezone de tu servidor MySQL
 *    - Perú usa UTC-5
 *
 * 4. Naming Conventions:
 *    - underscored: true → created_at, updated_at
 *    - freezeTableName: true → 'user' no se convierte en 'users'
 *
 * 5. Seguridad en Producción:
 *    - Usa SSL si tu proveedor lo requiere
 *    - No logues queries SQL (pueden contener datos sensibles)
 *    - Usa credenciales de solo lectura/escritura según necesites
 *
 * 6. Dialecto:
 *    - 'mysql' para MySQL/MariaDB
 *    - 'postgres' para PostgreSQL
 *    - 'sqlite' para SQLite
 *    - 'mssql' para SQL Server
 */
