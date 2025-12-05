/**
 * Configuración de Conexión a Base de Datos
 * Sequelize + MySQL
 */

require("dotenv").config();

module.exports = {
  // Configuración para desarrollo
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "citizen_security_v2",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
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

  // Configuración para pruebas
  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_TEST || "citizen_security_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false, // Desactivar logs en tests
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },

  // Configuración para producción
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
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

// Exportar configuración según el entorno
const env = process.env.NODE_ENV || "development";
module.exports = module.exports[env];
