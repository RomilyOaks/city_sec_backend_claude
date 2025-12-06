/**
 * ============================================
 * CORRECTOR DE DOBLE EXTENSIÓN .js.js
 * ============================================
 *
 * Corrige imports que tienen .js.js y los deja solo con .js
 *
 * EJECUTAR: node fix-double-extension.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// FUNCIONES
// ============================================

/**
 * Obtener todos los archivos .js recursivamente
 */
function getAllJsFiles(dir) {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.includes("node_modules")) {
          files.push(...getAllJsFiles(fullPath));
        } else if (item.endsWith(".js")) {
          files.push(fullPath);
        }
      } catch (err) {
        // Ignorar archivos inaccesibles
      }
    }
  } catch (err) {
    // Directorio no existe
  }

  return files;
}

/**
 * Corregir doble extensión en un archivo
 */
function fixDoubleExtension(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Buscar .js.js
    if (!content.includes(".js.js")) {
      return {
        status: "skip",
        message: "Sin doble extensión",
      };
    }

    // Reemplazar .js.js por .js
    const fixed = content.replace(/\.js\.js/g, ".js");

    // Verificar cambios
    if (fixed === content) {
      return {
        status: "skip",
        message: "Sin cambios",
      };
    }

    // Guardar archivo corregido
    fs.writeFileSync(filePath, fixed, "utf8");

    return {
      status: "success",
      message: "Doble extensión corregida",
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message,
    };
  }
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║      CORRECTOR DE DOBLE EXTENSIÓN .js.js → .js            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const stats = {
    success: 0,
    skip: 0,
    error: 0,
  };

  // Buscar todos los archivos .js en src/
  const srcPath = path.join(process.cwd(), "src");
  const files = getAllJsFiles(srcPath);

  console.log(`📂 Analizando ${files.length} archivos...\n`);

  // Procesar cada archivo
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const result = fixDoubleExtension(file);

    stats[result.status]++;

    if (result.status === "success") {
      console.log(`✅ ${relativePath}`);
      console.log(`   └─ ${result.message}\n`);
    }
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
    console.log("👉 Siguiente paso: npm run seed:rbac\n");
  } else {
    console.log("ℹ️  No se encontraron archivos con doble extensión\n");
  }

  console.log("═".repeat(60));
  console.log("\n");
}

main();
