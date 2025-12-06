/**
 * ============================================
 * SCRIPT DE CONVERSIÓN: CommonJS a ES Modules
 * ============================================
 *
 * Convierte automáticamente todos los archivos del proyecto
 * de CommonJS (require/module.exports) a ES Modules (import/export)
 *
 * IMPORTANTE: Este script hace backup automático antes de modificar
 *
 * USO: node convert-to-esm.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN
// ============================================

const MAKE_BACKUP = true; // Crear backup antes de modificar
const DRY_RUN = false; // true = solo simular, false = aplicar cambios

// Directorios a procesar
const directories = [
  "./src/models",
  "./src/controllers",
  "./src/middlewares",
  "./src/routes",
  "./src/utils",
  "./src/services",
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Buscar archivos .js recursivamente
 */
function findJsFiles(dir) {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findJsFiles(fullPath));
      } else if (item.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directorio no existe, continuar
  }

  return files;
}

/**
 * Crear backup de un archivo
 */
function createBackup(filePath) {
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Convertir require() a import
 */
function convertRequireToImport(content) {
  let modified = content;

  // Patrón 1: const something = require("path");
  modified = modified.replace(
    /const\s+(\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g,
    'import $1 from "$2"'
  );

  // Patrón 2: const { something } = require("path");
  modified = modified.replace(
    /const\s+\{([^}]+)\}\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g,
    'import {$1} from "$2"'
  );

  // Patrón 3: const something = require("path").submodule;
  modified = modified.replace(
    /const\s+(\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)\.(\w+)/g,
    'import { $3 as $1 } from "$2"'
  );

  return modified;
}

/**
 * Convertir module.exports a export
 */
function convertModuleExports(content) {
  let modified = content;

  // Patrón 1: module.exports = Something;
  modified = modified.replace(
    /module\.exports\s*=\s*(\w+)\s*;?\s*$/gm,
    "export default $1;"
  );

  // Patrón 2: module.exports = { ... };
  modified = modified.replace(/module\.exports\s*=\s*\{/g, "export default {");

  return modified;
}

/**
 * Procesar un archivo
 */
function processFile(filePath) {
  try {
    // Leer contenido original
    const originalContent = fs.readFileSync(filePath, "utf8");

    // Verificar si necesita conversión
    const needsConversion =
      originalContent.includes("require(") ||
      originalContent.includes("module.exports");

    if (!needsConversion) {
      return { status: "skip", message: "No necesita conversión" };
    }

    // Aplicar conversiones
    let convertedContent = originalContent;
    convertedContent = convertRequireToImport(convertedContent);
    convertedContent = convertModuleExports(convertedContent);

    // Verificar si hubo cambios
    if (convertedContent === originalContent) {
      return { status: "skip", message: "Sin cambios aplicables" };
    }

    // Crear backup si está habilitado
    if (MAKE_BACKUP && !DRY_RUN) {
      createBackup(filePath);
    }

    // Escribir archivo modificado (si no es dry run)
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, convertedContent, "utf8");
      return { status: "success", message: "Convertido exitosamente" };
    } else {
      return { status: "simulated", message: "Conversión simulada" };
    }
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║  CONVERSIÓN AUTOMÁTICA: CommonJS → ES Modules             ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

if (DRY_RUN) {
  console.log("⚠️  MODO SIMULACIÓN ACTIVADO - No se modificarán archivos\n");
}

if (MAKE_BACKUP && !DRY_RUN) {
  console.log("✅ Backup automático ACTIVADO\n");
}

const results = {
  success: 0,
  skip: 0,
  error: 0,
  simulated: 0,
};

console.log("🔄 Procesando archivos...\n");

for (const dir of directories) {
  const files = findJsFiles(dir);

  for (const file of files) {
    const result = processFile(file);
    results[result.status]++;

    const icon = {
      success: "✅",
      skip: "⏭️",
      error: "❌",
      simulated: "🔍",
    }[result.status];

    console.log(`${icon} ${file}`);
    if (result.message) {
      console.log(`   └─ ${result.message}`);
    }
  }
}

console.log("\n" + "═".repeat(60));
console.log("\n📊 RESUMEN DE CONVERSIÓN:\n");
console.log(`   ✅ Convertidos exitosamente: ${results.success}`);
console.log(`   ⏭️  Omitidos (ya correctos): ${results.skip}`);
console.log(`   ❌ Errores: ${results.error}`);
if (DRY_RUN) {
  console.log(`   🔍 Simulados: ${results.simulated}`);
}

if (MAKE_BACKUP && !DRY_RUN && results.success > 0) {
  console.log("\n💾 Archivos de backup creados con extensión .backup");
  console.log("   Para restaurar: mv archivo.js.backup archivo.js");
}

console.log("\n" + "═".repeat(60) + "\n");

if (results.error > 0) {
  console.log("⚠️  Algunos archivos tuvieron errores. Revisa manualmente.\n");
  process.exit(1);
} else if (results.success > 0 || results.simulated > 0) {
  console.log("🎉 Conversión completada exitosamente!\n");
  if (!DRY_RUN) {
    console.log("👉 Siguiente paso: npm run seed:rbac\n");
  } else {
    console.log("👉 Para aplicar cambios: Cambia DRY_RUN = false\n");
  }
} else {
  console.log("ℹ️  No se encontraron archivos para convertir.\n");
}
