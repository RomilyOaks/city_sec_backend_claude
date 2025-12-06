/**
 * ============================================
 * CORRECTOR DE IMPORTS EN RUTAS
 * ============================================
 *
 * Agrega extensión .js a imports de controllers y middlewares
 *
 * EJECUTAR: node fix-routes-imports.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN
// ============================================

const routesDir = "./src/routes";

// ============================================
// FUNCIONES
// ============================================

/**
 * Obtener todos los archivos .js
 */
function getJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getJsFiles(fullPath));
    } else if (item.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Corregir imports en un archivo
 */
function fixImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    let modified = content;
    let changes = [];

    // Patrón 1: import ... from "../controllers/xxxController"
    const pattern1 =
      /import\s+(.*?)\s+from\s+["'](\.\.\/controllers\/\w+)["']/g;
    if (pattern1.test(content)) {
      modified = modified.replace(
        /import\s+(.*?)\s+from\s+["'](\.\.\/controllers\/\w+)["']/g,
        'import $1 from "$2.js"'
      );
      changes.push("Agregada .js a controllers");
    }

    // Patrón 2: import ... from "../middlewares/xxxMiddleware"
    const pattern2 =
      /import\s+(.*?)\s+from\s+["'](\.\.\/middlewares\/\w+)["']/g;
    if (pattern2.test(content)) {
      modified = modified.replace(
        /import\s+(.*?)\s+from\s+["'](\.\.\/middlewares\/\w+)["']/g,
        'import $1 from "$2.js"'
      );
      changes.push("Agregada .js a middlewares");
    }

    // Patrón 3: cualquier import local sin .js
    const pattern3 = /import\s+(.*?)\s+from\s+["'](\.\.?\/[^"']+)["'](?!\.js)/g;
    const matches = [...content.matchAll(pattern3)];

    if (matches.length > 0) {
      for (const match of matches) {
        const fullMatch = match[0];
        const importPath = match[2];

        // No agregar .js si ya tiene extensión o es node_modules
        if (!importPath.includes(".") && !importPath.startsWith("node:")) {
          const fixed = fullMatch.replace(importPath, `${importPath}.js`);
          modified = modified.replace(fullMatch, fixed);
        }
      }
      changes.push("Agregada .js a imports locales");
    }

    // Verificar cambios
    if (modified === content) {
      return {
        status: "skip",
        message: "Sin cambios necesarios",
        changes: [],
      };
    }

    // Guardar archivo
    fs.writeFileSync(filePath, modified, "utf8");

    return {
      status: "success",
      message: "Imports corregidos",
      changes: changes,
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      changes: [],
    };
  }
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         CORRECTOR DE IMPORTS EN RUTAS                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const stats = {
    success: 0,
    skip: 0,
    error: 0,
  };

  // Obtener archivos
  const routesPath = path.join(process.cwd(), routesDir);
  const files = getJsFiles(routesPath);

  console.log(`📂 Procesando ${files.length} archivos de rutas...\n`);

  // Procesar cada archivo
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const result = fixImports(file);

    stats[result.status]++;

    const icon = {
      success: "✅",
      skip: "⏭️",
      error: "❌",
    }[result.status];

    console.log(`${icon} ${relativePath}`);

    if (result.changes.length > 0) {
      result.changes.forEach((change) => {
        console.log(`   ├─ ${change}`);
      });
    } else {
      console.log(`   └─ ${result.message}`);
    }
    console.log("");
  }

  // Resumen
  console.log("═".repeat(60));
  console.log("\n📊 RESUMEN:\n");
  console.log(`   ✅ Archivos corregidos: ${stats.success}`);
  console.log(`   ⏭️  Sin cambios: ${stats.skip}`);
  console.log(`   ❌ Errores: ${stats.error}`);
  console.log("\n");

  if (stats.success > 0) {
    console.log("🎉 Corrección completada!\n");
    console.log("👉 Siguiente paso: npm run dev\n");
  }

  console.log("═".repeat(60));
  console.log("\n");
}

main();
