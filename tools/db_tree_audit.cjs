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

function normalizeTableName(tableName) {
  if (!tableName) return "";
  if (typeof tableName === "string") return tableName;
  // Sequelize can return { tableName, schema, delimiter } in some dialects
  if (typeof tableName === "object" && tableName.tableName) return tableName.tableName;
  return String(tableName);
}

function statusMark(exists) {
  return exists ? "OK" : "FALTANTE";
}

async function getDbTables(sequelize) {
  const qi = sequelize.getQueryInterface();
  const tables = await qi.showAllTables();

  // MySQL usually returns array of strings. Other dialects may return objects.
  const normalized = tables.map((t) => {
    if (typeof t === "string") return t;
    if (t && typeof t === "object") {
      return t.tableName || t.name || t.TABLE_NAME || JSON.stringify(t);
    }
    return String(t);
  });

  return new Set(normalized);
}

function buildExpectedFromModels(models) {
  // models is expected to be an object of Sequelize models
  const expected = [];
  for (const [modelName, model] of Object.entries(models)) {
    if (!model || typeof model.getTableName !== "function") continue;
    const tableName = normalizeTableName(model.getTableName());
    expected.push({ modelName, tableName });
  }
  // deterministic
  expected.sort((a, b) => a.tableName.localeCompare(b.tableName));
  return expected;
}

function groupModels(expected) {
  // Grouping is for display only (tree). Adjust anytime.
  const groups = {
    "Catálogos": new Set([
      "Cargo",
      "TipoVehiculo",
      "Ubigeo",
      "TipoNovedad",
      "SubtipoNovedad",
      "EstadoNovedad",
      "UnidadOficina",
    ]),
    "Ubicación": new Set(["Sector", "Cuadrante"]),
    "Recursos operativos": new Set([
      "Vehiculo",
      "PersonalSeguridad",
      "Taller",
      "AbastecimientoCombustible",
      "MantenimientoVehiculo",
    ]),
    "Novedades/Incidentes": new Set(["Novedad", "HistorialEstadoNovedad"]),
    "Auth/RBAC": new Set(["Usuario", "Rol", "Permiso", "UsuarioRol", "UsuarioRoles"]),
    "Auditoría": new Set(["HistorialUsuario", "LoginIntento", "AuditoriaAccion"]),
    "Otros": new Set(),
  };

  const grouped = {
    "Catálogos": [],
    "Ubicación": [],
    "Recursos operativos": [],
    "Novedades/Incidentes": [],
    "Auth/RBAC": [],
    "Auditoría": [],
    "Otros": [],
  };

  for (const e of expected) {
    let placed = false;
    for (const [groupName, set] of Object.entries(groups)) {
      if (groupName === "Otros") continue;
      if (set.has(e.modelName)) {
        grouped[groupName].push(e);
        placed = true;
        break;
      }
    }
    if (!placed) grouped["Otros"].push(e);
  }

  return grouped;
}

function printTree({ groupedExpected, dbTables }) {
  const lines = [];
  lines.push("city_sec_backend_claude/");
  lines.push(" src/");
  lines.push("  models/  (validación contra BD)");

  const allExpectedTableNames = new Set();

  for (const [groupName, entries] of Object.entries(groupedExpected)) {
    if (!entries.length) continue;
    lines.push(`   ${groupName}/`);

    for (const { modelName, tableName } of entries) {
      allExpectedTableNames.add(tableName);
      const exists = dbTables.has(tableName);
      lines.push(
        `    - ${modelName} -> ${tableName}  [${statusMark(exists)}]`
      );
    }
  }

  // EXTRA tables in DB but not represented by models
  const extras = Array.from(dbTables)
    .filter((t) => !allExpectedTableNames.has(t))
    .sort((a, b) => a.localeCompare(b));

  if (extras.length) {
    lines.push("   BD extras (sin modelo Sequelize):");
    for (const t of extras) lines.push(`    - ${t}  [EXTRA]`);
  }

  return lines.join("\n");
}

async function main() {
  await loadEnv();

  // Import ESM modules from CJS
  const projectRoot = path.resolve(__dirname, "..");
  const modelsIndexPath = path.join(projectRoot, "src", "models", "index.js");

  const modelsModule = await import(pathToFileURL(modelsIndexPath).href);

  // Some parts of the codebase import named exports (Rol, Permiso, etc.)
  // and also default export (models object). We'll accept either.
  const models = modelsModule.default || modelsModule;

  const sequelize = modelsModule.sequelize || modelsModule.default?.sequelize || modelsModule.default?.Sequelize;

  // Fallback: sequelize can be obtained from any model
  const anyModel = Object.values(models).find((m) => m && m.sequelize);
  const sequelizeInstance = sequelize || (anyModel ? anyModel.sequelize : null);

  if (!sequelizeInstance) {
    throw new Error(
      "No se pudo obtener la instancia de sequelize desde src/models/index.js"
    );
  }

  console.log("=== DB TREE AUDIT ===");
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);

  await sequelizeInstance.authenticate();

  const dbTables = await getDbTables(sequelizeInstance);
  const expected = buildExpectedFromModels(models);
  const groupedExpected = groupModels(expected);

  console.log("\n" + printTree({ groupedExpected, dbTables }) + "\n");

  const missing = expected.filter((e) => !dbTables.has(e.tableName));
  console.log(`Modelos detectados: ${expected.length}`);
  console.log(`Tablas en BD: ${dbTables.size}`);
  console.log(`FALTANTES (modelos sin tabla): ${missing.length}`);

  if (missing.length) {
    console.log("\n--- FALTANTES ---");
    for (const m of missing) console.log(`${m.modelName} -> ${m.tableName}`);
  }

  await sequelizeInstance.close();
}

main().catch(async (err) => {
  console.error("❌ Error en db_tree_audit:", err);
  process.exit(1);
});
