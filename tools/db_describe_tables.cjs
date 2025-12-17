/* eslint-disable no-console */

const path = require("path");
const { pathToFileURL } = require("url");

async function loadEnv() {
  try {
    const dotenv = require("dotenv");
    dotenv.config();
  } catch {
    // ignore
  }
}

async function main() {
  await loadEnv();

  const tables = [
    "email_verifications",
    "password_resets",
    "password_historial",
    "sesiones",
    "tokens_acceso",
    "usuario_permisos",
    "rol_permisos",
  ];

  const projectRoot = path.resolve(__dirname, "..");
  const modelsIndexPath = path.join(projectRoot, "src", "models", "index.js");
  const modelsModule = await import(pathToFileURL(modelsIndexPath).href);

  const models = modelsModule.default || modelsModule;
  const anyModel = Object.values(models).find((m) => m && m.sequelize);
  const sequelize = modelsModule.sequelize || (anyModel ? anyModel.sequelize : null);

  if (!sequelize) {
    throw new Error("No se pudo obtener sequelize desde src/models/index.js");
  }

  console.log("=== DB DESCRIBE TABLES ===");
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);

  await sequelize.authenticate();

  const qi = sequelize.getQueryInterface();

  for (const tableName of tables) {
    console.log("\n" + "=".repeat(80));
    console.log(`TABLE: ${tableName}`);
    console.log("=".repeat(80));

    try {
      const desc = await qi.describeTable(tableName);
      console.log(JSON.stringify(desc, null, 2));
    } catch (err) {
      console.log(`No se pudo describir tabla '${tableName}': ${err.message}`);
    }
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
