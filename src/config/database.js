/**
 * ============================================
 * CONFIGURACIÓN DE BASE DE DATOS (SEQUELIZE)
 * ============================================
 *
 * Ruta: src/config/database.js
 *
 * VERSIÓN: 3.0.0
 * ÚLTIMA ACTUALIZACIÓN: 2026-05-28
 *
 * CAMBIOS v3.0.0:
 * - ✅ Soporte dual MySQL (Railway) / PostgreSQL (Supabase)
 * - ✅ dialectOptions dinámico según DB_DIALECT
 * - ✅ DB_SCHEMA exportado para que los modelos lo consuman (Fase 4)
 * - ✅ IS_POSTGRES exportado para condicionales de tipo en modelos
 * - ✅ SSL configurable via DB_SSL (aplica en todos los entornos)
 * - ✅ Puerto por defecto según dialecto (3306 MySQL / 5432 Postgres)
 * - ✅ pool.min SIEMPRE 0 — lazy pool, no connections at startup
 *   (crítico para Railway cold-start: si min > 0 Sequelize abre
 *   conexiones TCP al instanciar, bloqueando el import del módulo)
 *
 * Variables de entorno nuevas:
 *   DB_DIALECT = mysql | postgres   (default: mysql)
 *   DB_SCHEMA  = citysecure         (solo aplica cuando DB_DIALECT=postgres; ignorado en MySQL)
 *   DB_SSL     = true | false        (default: false)
 */

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// ============================================
// VARIABLES DE ENTORNO
// ============================================

const NODE_ENV   = process.env.NODE_ENV   || "development";

// Dialecto activo: mysql (Railway) | postgres (Supabase)
export const DB_DIALECT   = process.env.DB_DIALECT || "mysql";
export const IS_POSTGRES  = DB_DIALECT === "postgres";

// Schema PostgreSQL: 'citysecure' para Supabase.
// MySQL no usa schemas — se exporta undefined para que schema:DB_SCHEMA en modelos
// quede como schema:undefined, que Sequelize ignora al construir queries MySQL.
export const DB_SCHEMA = IS_POSTGRES ? (process.env.DB_SCHEMA || "citysecure") : undefined;

// SSL — activa en ambos dialectos cuando DB_SSL=true
const DB_SSL = process.env.DB_SSL === "true";

// Conexión
const DB_HOST     = process.env.DB_HOST     || "127.0.0.1";
const DB_PORT     = parseInt(process.env.DB_PORT) || (IS_POSTGRES ? 5432 : 3306);
const DB_USER     = process.env.DB_USER     || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME     = process.env.DB_NAME     || "citizen_security_v2";
const DB_NAME_TEST = process.env.DB_NAME_TEST || "citizen_security_test";

// Pool — POOL_MIN siempre 0 (hardcodeado, jamás configurable via .env)
const POOL_MAX     = parseInt(process.env.DB_POOL_MAX)     || (NODE_ENV === "production" ? 20 : 5);
const POOL_MIN     = 0; // Lazy pool — NO mover esto a .env
const POOL_ACQUIRE = parseInt(process.env.DB_POOL_ACQUIRE) || 30000;
const POOL_IDLE    = parseInt(process.env.DB_POOL_IDLE)    || 5000;
const POOL_EVICT   = parseInt(process.env.DB_POOL_EVICT)   || 5000;

// Retry
const RETRY_MAX     = parseInt(process.env.DB_RETRY_MAX)     || 3;
const RETRY_TIMEOUT = parseInt(process.env.DB_RETRY_TIMEOUT) || 3000;

// Timezone
// MySQL acepta offset string ("-05:00"); PostgreSQL acepta nombre de zona ("America/Lima").
const DB_TIMEZONE = IS_POSTGRES
  ? (process.env.DB_TIMEZONE || "America/Lima")
  : (process.env.DB_TIMEZONE || "-05:00");

// Logging
const ENABLE_LOGGING = process.env.DB_LOGGING === "true";

// ============================================
// SSL
// SSL se configura igual para MySQL y PostgreSQL.
// rejectUnauthorized: false es necesario para Supabase
// (certificado de proxy que no coincide con el host directo).
// ============================================
const sslConfig = DB_SSL
  ? { require: true, rejectUnauthorized: false }
  : undefined;

// ============================================
// dialectOptions — diferente por dialecto
//
// MySQL  : charset, dateStrings, typeCast son indispensables para
//          el comportamiento correcto del driver mysql2.
// Postgres: esas opciones no existen; solo se agrega ssl si aplica.
// ============================================
const mysqlDialectOptions = {
  charset: "utf8mb4",
  dateStrings: true,
  typeCast: true,
  connectTimeout: 10000,
  ...(sslConfig && { ssl: sslConfig }),
};

const pgDialectOptions = {
  ...(sslConfig && { ssl: sslConfig }),
};

const dialectOptions = IS_POSTGRES ? pgDialectOptions : mysqlDialectOptions;

// ============================================
// define — opciones globales de modelo
//
// charset/collate son MySQL-only; en PostgreSQL se omiten.
// El schema NO se setea aquí: cada modelo lo declara
// explícitamente con schema: DB_SCHEMA (Fase 4).
// ============================================
const mysqlDefine = {
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
  timestamps: false,
};

const pgDefine = {
  timestamps: false,
};

const defineOptions = IS_POSTGRES ? pgDefine : mysqlDefine;

// ============================================
// retry — patrones de error por dialecto
// ============================================
const retryPatternsDev = IS_POSTGRES
  ? [/ECONNRESET/, /ETIMEDOUT/, /ENOTFOUND/, /ENETUNREACH/, /ECONNREFUSED/]
  : [/ER_LOCK_WAIT_TIMEOUT/, /SQLITE_BUSY/, /ECONNRESET/, /ETIMEDOUT/, /ENOTFOUND/, /ENETUNREACH/, /ECONNREFUSED/];

const retryPatternsProd = IS_POSTGRES
  ? [/ECONNRESET/, /ETIMEDOUT/, /ENOTFOUND/, /ENETUNREACH/, /ECONNREFUSED/]
  : [/ER_LOCK_WAIT_TIMEOUT/, /ECONNRESET/, /ETIMEDOUT/, /ENOTFOUND/, /ENETUNREACH/, /ECONNREFUSED/];

// ============================================
// CONFIGURACIONES POR ENTORNO
// ============================================
const config = {
  // ----------------------------------------
  // DEVELOPMENT
  // ----------------------------------------
  development: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host:     DB_HOST,
    port:     DB_PORT,
    dialect:  DB_DIALECT,
    logging:  ENABLE_LOGGING ? console.log : false,
    acquireConnectionTimeout: 10000,
    pool: {
      max:    POOL_MAX,
      min:    POOL_MIN,
      acquire: POOL_ACQUIRE,
      idle:    POOL_IDLE,
      evict:   POOL_EVICT,
      handleDisconnects: true,
    },
    retry: {
      max:     2,
      timeout: 2000,
      match:   retryPatternsDev,
    },
    define:         defineOptions,
    dialectOptions: dialectOptions,
    timezone:       DB_TIMEZONE,
  },

  // ----------------------------------------
  // TEST
  // ----------------------------------------
  test: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME_TEST,
    host:     DB_HOST,
    port:     DB_PORT,
    dialect:  DB_DIALECT,
    logging:  false,
    pool: {
      max:    5,
      min:    POOL_MIN,
      acquire: POOL_ACQUIRE,
      idle:    POOL_IDLE,
      evict:   POOL_EVICT,
    },
    retry: {
      max:     RETRY_MAX,
      timeout: RETRY_TIMEOUT,
      match:   retryPatternsDev,
    },
    define:         defineOptions,
    dialectOptions: dialectOptions,
    timezone:       DB_TIMEZONE,
  },

  // ----------------------------------------
  // PRODUCTION
  // ----------------------------------------
  production: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host:     DB_HOST,
    port:     DB_PORT,
    dialect:  DB_DIALECT,
    logging:  false,
    pool: {
      max:    POOL_MAX,
      min:    POOL_MIN,
      acquire: POOL_ACQUIRE,
      idle:    POOL_IDLE,
      evict:   POOL_EVICT,
    },
    retry: {
      max:     RETRY_MAX,
      timeout: RETRY_TIMEOUT,
      match:   retryPatternsProd,
    },
    define:         defineOptions,
    dialectOptions: dialectOptions,
    timezone:       DB_TIMEZONE,
  },
};

// ============================================
// INSTANCIA SEQUELIZE
// ============================================
const dbConfig = config[NODE_ENV] || config.development;

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// ============================================
// TEST DE CONEXIÓN (llamada manual)
// ============================================
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión a DB exitosa — Entorno: ${NODE_ENV.toUpperCase()}`);
    console.log(`   📊 Database: ${dbConfig.database}`);
    console.log(`   🖥️  Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   🔌 Dialect: ${DB_DIALECT.toUpperCase()} | Schema: ${DB_SCHEMA ?? "(MySQL — sin schema)"}`);
    console.log(`   🏊 Pool: max=${dbConfig.pool.max}, min=${dbConfig.pool.min}`);
    return true;
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:");
    console.error(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.error(`   Database: ${dbConfig.database}`);
    console.error(`   Dialect: ${DB_DIALECT}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
};

export default sequelize;
export { config, dbConfig };
