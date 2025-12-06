/**
 * Script para convertir todos los require() a import en el proyecto
 * Ejecutar con: node fix-imports.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios a revisar
const directories = [
  "./src/models",
  "./src/controllers",
  "./src/middlewares",
  "./src/routes",
  "./src/utils",
  "./src/services",
];

// Función para buscar archivos .js recursivamente
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

// Función para analizar un archivo
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const issues = [];

  // Buscar require()
  const requireMatches = content.match(/const\s+.*?\s*=\s*require\s*\(/g);
  if (requireMatches) {
    issues.push(`❌ ${requireMatches.length} require() encontrados`);
  }

  // Buscar module.exports
  const moduleExportsMatches = content.match(/module\.exports\s*=/g);
  if (moduleExportsMatches) {
    issues.push(`❌ ${moduleExportsMatches.length} module.exports encontrados`);
  }

  return issues;
}

// Analizar todos los archivos
console.log("🔍 Analizando proyecto...\n");

let totalIssues = 0;
const problematicFiles = [];

for (const dir of directories) {
  const files = findJsFiles(dir);

  for (const file of files) {
    const issues = analyzeFile(file);

    if (issues.length > 0) {
      totalIssues += issues.length;
      problematicFiles.push({ file, issues });
      console.log(`📄 ${file}`);
      issues.forEach((issue) => console.log(`   ${issue}`));
      console.log("");
    }
  }
}

console.log("=".repeat(60));
console.log(`\n📊 RESUMEN:`);
console.log(`   Archivos con problemas: ${problematicFiles.length}`);
console.log(`   Total de issues: ${totalIssues}\n`);

if (problematicFiles.length > 0) {
  console.log("🔧 Archivos que necesitan corrección:");
  problematicFiles.forEach(({ file }) => {
    console.log(`   - ${file}`);
  });
}
