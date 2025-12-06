/**
 * ============================================
 * CORRECTOR DE RUTAS DE IMPORTACIÓN
 * ============================================
 *
 * Corrige las rutas relativas en los imports de los modelos
 * para que apunten correctamente a ../config/database.js
 *
 * EJECUTAR: node fix-import-paths.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  makeBackup: true,
  modelsDir: "./src/models",
};

// Correcciones de rutas específicas
const PATH_CORRECTIONS = [
  {
    description: "Corregir ruta de database.js en modelos",
    // Buscar imports incorrectos (pueden tener varias formas)
    patterns: [
      /import\s+sequelize\s+from\s+["']\.\.\/\.\.\/config\/database\.js["']/g,
      /import\s+sequelize\s+from\s+["']\.\.\/config\/database\.js["']/g,
      /import\s+sequelize\s+from\s+["']config\/database\.js["']/g,
    ],
    // Reemplazo correcto
    replacement: 'import sequelize from "../config/database.js"',
  },
  {
    description: "Asegurar .js en imports locales",
    // Agregar .js a imports sin extensión
    pattern: /import\s+(.*?)\s+from\s+["'](\.\.?\/[^"']+)["'](?!\.js)/g,
    replacement: 'import $1 from "$2.js"',
  },
];

// ============================================
// FUNCIONES
// ============================================

/**
 * Obtener todos los archivos .js en un directorio
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
 * Corregir rutas en un archivo
 */
function fixImportPaths(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    let modified = content;
    let changesApplied = [];

    // Aplicar cada corrección
    for (const correction of PATH_CORRECTIONS) {
      if (correction.patterns) {
        // Múltiples patrones
        for (const pattern of correction.patterns) {
          const before = modified;
          modified = modified.replace(pattern, correction.replacement);

          if (modified !== before) {
            changesApplied.push(correction.description);
            break; // Solo registrar una vez por tipo de corrección
          }
        }
      } else if (correction.pattern) {
        // Un solo patrón
        const before = modified;
        modified = modified.replace(correction.pattern, correction.replacement);

        if (modified !== before) {
          changesApplied.push(correction.description);
        }
      }
    }

    // Si no hubo cambios, retornar
    if (modified === content) {
      return {
        status: "skip",
        message: "Sin cambios necesarios",
        changes: [],
      };
    }

    // Crear backup
    if (CONFIG.makeBackup) {
      fs.writeFileSync(`${filePath}.backup2`, content, "utf8");
    }

    // Escribir archivo corregido
    fs.writeFileSync(filePath, modified, "utf8");

    return {
      status: "success",
      message: "Rutas corregidas",
      changes: changesApplied,
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
  console.log("║          CORRECTOR DE RUTAS DE IMPORTACIÓN                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const stats = {
    success: 0,
    skip: 0,
    error: 0,
  };

  // Obtener archivos de modelos
  const modelsPath = path.join(process.cwd(), CONFIG.modelsDir);
  const files = getJsFiles(modelsPath);

  console.log(
    `📂 Procesando ${files.length} archivos en ${CONFIG.modelsDir}\n`
  );

  // Procesar cada archivo
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const result = fixImportPaths(file);

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

  if (CONFIG.makeBackup && stats.success > 0) {
    console.log("💾 Backups creados con extensión .backup2\n");
  }

  if (stats.success > 0) {
    console.log("🎉 Corrección completada!\n");
    console.log("👉 Siguiente paso: npm run seed:rbac\n");
  }

  console.log("═".repeat(60));
  console.log("\n");
}

main();
