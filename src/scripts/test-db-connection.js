/**
 * src/scripts/test-db-connection.js
 *
 * Verifica la conexión a la base de datos activa (MySQL o PostgreSQL)
 * y comprueba la existencia de las tablas principales de CitySecure.
 *
 * Uso:
 *   node src/scripts/test-db-connection.js
 *
 * Lee el dialecto activo desde DB_DIALECT (.env).
 * Para Supabase: asegurarse de que DB_DIALECT=postgres, DB_SCHEMA=citysecure y DB_SSL=true.
 */

import dotenv from "dotenv";
dotenv.config();

import sequelize, { DB_DIALECT, DB_SCHEMA, IS_POSTGRES } from "../config/database.js";

// Tablas a verificar (sin prefijo de schema — Sequelize lo aplica según DB_SCHEMA)
const TABLAS_REQUERIDAS = [
  "usuarios",
  "roles",
  "permisos",
  "novedades_incidentes",
  "operativos_turno",
  "personal_seguridad",
  "vehiculos",
  "sectores",
  "cuadrantes",
  "tracking_vehiculos",
];

/**
 * Verifica si una tabla existe en el schema activo.
 * Usa information_schema que está disponible en MySQL y PostgreSQL.
 */
async function tablaExiste(nombreTabla) {
  const schemaCondition = IS_POSTGRES
    ? `table_schema = '${DB_SCHEMA}'`
    : "table_schema = DATABASE()";

  const [rows] = await sequelize.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_name = :tabla
       AND ${schemaCondition}`,
    {
      replacements: { tabla: nombreTabla },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return rows !== undefined;
}

async function main() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║   CitySecure — Test de conexión a DB       ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log();
  console.log(`  Dialecto : ${DB_DIALECT.toUpperCase()}`);
  console.log(`  Schema   : ${IS_POSTGRES ? DB_SCHEMA : "(MySQL — sin schema)"}`);
  console.log(`  Host     : ${process.env.DB_HOST}:${process.env.DB_PORT || (IS_POSTGRES ? 5432 : 3306)}`);
  console.log(`  Database : ${process.env.DB_NAME}`);
  console.log(`  SSL      : ${process.env.DB_SSL === "true" ? "activo" : "inactivo"}`);
  console.log();

  // ── 1. Autenticación ──────────────────────────────────────────
  console.log("── Paso 1: Autenticación ─────────────────────");
  try {
    await sequelize.authenticate();
    console.log("  ✅ Conexión exitosa\n");
  } catch (error) {
    console.error("  ❌ Error de conexión:", error.message);
    console.error("\n  Verifica las variables de entorno en .env:");
    console.error("    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME");
    if (IS_POSTGRES) {
      console.error("    DB_SSL=true (requerido para Supabase)");
      console.error("    DB_SCHEMA=citysecure");
    }
    process.exit(1);
  }

  // ── 2. Verificación del schema (solo PostgreSQL) ──────────────
  if (IS_POSTGRES) {
    console.log("── Paso 2: Verificar schema ───────────────────");
    try {
      const [schemaRows] = await sequelize.query(
        `SELECT schema_name
         FROM information_schema.schemata
         WHERE schema_name = :schema`,
        {
          replacements: { schema: DB_SCHEMA },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (schemaRows) {
        console.log(`  ✅ Schema '${DB_SCHEMA}' existe\n`);
      } else {
        console.error(`  ❌ Schema '${DB_SCHEMA}' NO existe.`);
        console.error("     Crear manualmente en Supabase SQL Editor:");
        console.error(`     CREATE SCHEMA ${DB_SCHEMA};\n`);
        process.exit(1);
      }
    } catch (error) {
      console.error("  ❌ Error al verificar schema:", error.message);
      process.exit(1);
    }
  }

  // ── 3. Verificación de tablas ─────────────────────────────────
  console.log("── Paso 3: Verificar tablas principales ──────");

  let ok = 0;
  let faltantes = 0;
  const tablasFaltantes = [];

  for (const tabla of TABLAS_REQUERIDAS) {
    try {
      const existe = await tablaExiste(tabla);
      if (existe) {
        console.log(`  ✅ ${tabla}`);
        ok++;
      } else {
        console.log(`  ❌ ${tabla}  ← NO EXISTE`);
        tablasFaltantes.push(tabla);
        faltantes++;
      }
    } catch (error) {
      console.log(`  ❌ ${tabla}  ← ERROR: ${error.message}`);
      tablasFaltantes.push(tabla);
      faltantes++;
    }
  }

  // ── 4. Resumen ────────────────────────────────────────────────
  console.log();
  console.log("── Resumen ────────────────────────────────────");
  console.log(`  Tablas encontradas : ${ok} / ${TABLAS_REQUERIDAS.length}`);
  console.log(`  Tablas faltantes   : ${faltantes}`);

  if (faltantes === 0) {
    console.log();
    console.log("  ✅ Base de datos lista para CitySecure.");

    // Mostrar conteo rápido de datos si hay conexión
    if (IS_POSTGRES) {
      try {
        const [[rolesRow], [permisosRow], [usuariosRow]] = await Promise.all([
          sequelize.query(
            `SELECT COUNT(*) AS total FROM ${DB_SCHEMA}.roles`,
            { type: sequelize.QueryTypes.SELECT }
          ),
          sequelize.query(
            `SELECT COUNT(*) AS total FROM ${DB_SCHEMA}.permisos`,
            { type: sequelize.QueryTypes.SELECT }
          ),
          sequelize.query(
            `SELECT COUNT(*) AS total FROM ${DB_SCHEMA}.usuarios`,
            { type: sequelize.QueryTypes.SELECT }
          ),
        ]);
        console.log();
        console.log("── Datos RBAC ─────────────────────────────────");
        console.log(`  Roles    : ${rolesRow.total}`);
        console.log(`  Permisos : ${permisosRow.total}`);
        console.log(`  Usuarios : ${usuariosRow.total}`);
        if (parseInt(rolesRow.total) === 0 || parseInt(permisosRow.total) === 0) {
          console.log();
          console.log("  ⚠️  Las tablas RBAC están vacías.");
          console.log("     Ejecutar en Supabase SQL Editor:");
          console.log("     → supabase/migrations/002_citysecure_seeds.sql");
        }
      } catch {
        // Conteo opcional — no es crítico
      }
    }
  } else {
    console.log();
    console.log("  ⚠️  Tablas faltantes:");
    tablasFaltantes.forEach(t => console.log(`       - ${t}`));
    console.log();
    if (IS_POSTGRES) {
      console.log("  Ejecutar en Supabase SQL Editor (ver supabase/migrations/SUPABASE_SETUP.md):");
      console.log("  → supabase/migrations/001_citysecure_schema.sql");
    } else {
      console.log("  Ejecutar: npm run db:migrate");
    }
    process.exit(1);
  }

  await sequelize.close();
}

main().catch((error) => {
  console.error("\n❌ Error inesperado:", error.message);
  if (error.stack) console.error(error.stack);
  process.exit(1);
});
