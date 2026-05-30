/**
 * scripts/export-mysql-to-supabase.js
 *
 * Lee tablas de catálogo desde MySQL (Railway) y genera:
 *   supabase/migrations/004_seed_data_from_mysql.sql
 *
 * Uso:
 *   node scripts/export-mysql-to-supabase.js
 *
 * Requiere: variables DB_* en .env apuntando a MySQL (DB_DIALECT=mysql).
 * No modifica ningún dato — solo lectura.
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(
  __dirname,
  "../supabase/migrations/004_seed_data_from_mysql.sql"
);
const BATCH_SIZE = 100; // filas por sentencia INSERT

// ─── Orden FK-safe ───────────────────────────────────────────────────────────
//  Grupo 1: sin dependencias externas
//  Grupo 2: dependen de grupo 1
//  Grupo 3: dependen de grupo 2
//  Grupo 4: dependen de grupo 3
//  Grupo 5: FK nullable a personal_seguridad (no migrado → NULL)
// ─────────────────────────────────────────────────────────────────────────────

const TABLES = [
  // ── Grupo 1 ──────────────────────────────────────────────────────────────
  { name: "ubigeo",                pk: "ubigeo_code" }, // sin secuencia SERIAL
  { name: "tipos_via",             pk: "id"           },
  { name: "tipos_vehiculo",        pk: "id"           },
  { name: "tipos_copiloto",        pk: "id"           },
  { name: "catalogo_desperfectos", pk: "id"           },
  { name: "estados_novedad",       pk: "id"           },
  { name: "horarios_turnos",       pk: "turno"        }, // PK string, sin secuencia
  { name: "tipos_novedad",         pk: "id"           },
  { name: "cargos",                pk: "id"           },
  { name: "permisos",              pk: "id"           },
  // ── Grupo 2 ──────────────────────────────────────────────────────────────
  { name: "unidades_oficina",      pk: "id"           },
  { name: "subtipos_novedad",      pk: "id"           },
  { name: "sectores",              pk: "id"           },
  // ── Grupo 3 ──────────────────────────────────────────────────────────────
  { name: "subsectores",           pk: "id"           }, // requerido por cuadrantes
  { name: "cuadrantes",            pk: "id"           },
  { name: "calles",                pk: "id"           },
  // ── Grupo 4 ──────────────────────────────────────────────────────────────
  { name: "calles_cuadrantes",     pk: "id"           },
  { name: "direcciones",           pk: "id"           },
  // ── Grupo 5 ──────────────────────────────────────────────────────────────
  { name: "radios_tetra",          pk: "id"           },
];

// ─── FK a tablas NO migradas → forzar NULL ───────────────────────────────────
// Tablas no migradas: usuarios, personal_seguridad, vehiculos, roles
const NULL_FK = {
  tipos_via:            ["created_by", "updated_by", "deleted_by"],
  tipos_vehiculo:       ["created_by", "updated_by", "deleted_by"],
  tipos_copiloto:       ["created_by", "updated_by", "deleted_by"],
  catalogo_desperfectos: ["created_by", "updated_by", "deleted_by"],
  estados_novedad:      ["created_by", "updated_by", "deleted_by"],
  horarios_turnos:      ["created_by", "updated_by", "deleted_by"],
  tipos_novedad:        ["created_by", "updated_by", "deleted_by"],
  subtipos_novedad:     ["created_by", "updated_by", "deleted_by"],
  cargos:               ["created_by", "updated_by", "deleted_by"],
  permisos:             ["updated_by"],                   // solo tiene updated_by
  unidades_oficina:     ["created_by", "updated_by", "deleted_by"],
  sectores:             ["supervisor_id", "created_by", "updated_by", "deleted_by"],
  subsectores:          ["personal_supervisor_id", "created_by", "updated_by", "deleted_by"],
  cuadrantes:           ["personal_supervisor_id", "created_by", "updated_by", "deleted_by"],
  calles:               ["created_by", "updated_by", "deleted_by"],
  calles_cuadrantes:    ["created_by", "updated_by", "deleted_by"],
  direcciones:          ["created_by", "updated_by", "deleted_by"],
  radios_tetra:         ["personal_seguridad_id", "created_by", "updated_by", "deleted_by"],
};

// ─── Columnas BOOLEAN en PostgreSQL (TINYINT 0/1 en MySQL) ───────────────────
// Las columnas que son SMALLINT en PG (tipos_via.estado, calles.estado, etc.)
// NO están aquí — se exportan como entero y PG las acepta sin conversión.
const BOOLEAN_COLS = {
  tipos_vehiculo:        ["estado"],
  catalogo_desperfectos: ["activo", "estado"],
  estados_novedad:       ["estado", "es_inicial", "es_final", "requiere_unidad"],
  tipos_novedad:         ["estado", "requiere_unidad"],
  subtipos_novedad:      ["estado", "requiere_ambulancia", "requiere_bomberos", "requiere_pnp"],
  cargos:                ["estado", "requiere_licencia"],
  permisos:              ["es_sistema", "estado"],
  unidades_oficina:      ["activo_24h", "estado"],
  sectores:              ["estado"],
  cuadrantes:            ["estado"],
  radios_tetra:          ["estado"],
};

// ─── Columnas generadas por trigger en PostgreSQL → excluir del INSERT ────────
const SKIP_COLS = {
  calles:      new Set(["nombre_completo"]),
  direcciones: new Set(["direccion_completa"]),
};

// ─── Conversión de valores MySQL → SQL literal PostgreSQL ────────────────────
function pgVal(val, isBoolean) {
  if (val === null || val === undefined) return "NULL";

  if (isBoolean) {
    // TINYINT(1) en MySQL → TRUE/FALSE en PostgreSQL
    return val ? "TRUE" : "FALSE";
  }

  if (val instanceof Date) {
    // DATETIME / TIMESTAMP → TIMESTAMPTZ literal
    const iso = val.toISOString(); // "2024-01-15T10:30:00.000Z"
    return `'${iso.replace("T", " ").slice(0, 23)}+00'`;
  }

  if (Buffer.isBuffer(val)) {
    return `'\\x${val.toString("hex")}'`;
  }

  if (typeof val === "object") {
    // JSON column → serializar y escapar comillas
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }

  if (typeof val === "number") {
    return String(val);
  }

  if (typeof val === "boolean") {
    return val ? "TRUE" : "FALSE";
  }

  // VARCHAR / TEXT: solo escapar comillas simples
  // (PostgreSQL con standard_conforming_strings=ON no necesita escapar backslash)
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── Exportar una tabla ───────────────────────────────────────────────────────
async function exportTable(conn, tableName) {
  const nullCols  = new Set(NULL_FK[tableName]   || []);
  const boolCols  = new Set(BOOLEAN_COLS[tableName] || []);
  const skipCols  = SKIP_COLS[tableName]          || new Set();

  const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);

  if (rows.length === 0) {
    return { count: 0, sql: `-- ${tableName}: sin datos\n` };
  }

  // Columnas finales (excluir las generadas por trigger)
  const columns = Object.keys(rows[0]).filter(
    (col) => !skipCols.has(col)
  );
  const colList = columns.map((c) => `"${c}"`).join(", ");

  const sqlChunks = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const valueLines = batch.map((row) => {
      const vals = columns.map((col) => {
        if (nullCols.has(col)) return "NULL";
        return pgVal(row[col], boolCols.has(col));
      });
      return `  (${vals.join(", ")})`;
    });

    sqlChunks.push(
      `INSERT INTO citysecure.${tableName} (${colList})\nVALUES\n` +
      valueLines.join(",\n") +
      `\nON CONFLICT DO NOTHING;\n`
    );
  }

  return { count: rows.length, sql: sqlChunks.join("\n") };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Verificar que se está apuntando a MySQL
  const dialect = process.env.DB_DIALECT || "mysql";
  if (dialect !== "mysql") {
    console.error(`❌ Este script requiere DB_DIALECT=mysql (actual: ${dialect})`);
    console.error("   Apunte .env a MySQL antes de ejecutar.");
    process.exit(1);
  }

  console.log("🔌 Conectando a MySQL...");
  console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
  console.log(`   DB:   ${process.env.DB_NAME}`);

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || "127.0.0.1",
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "citizen_security_v2",
    charset:  "utf8mb4",
  });

  const now = new Date().toISOString();
  const header = `-- ============================================================
-- CitySecure — Seed data exportado desde MySQL
-- Archivo: 004_seed_data_from_mysql.sql
-- Generado: ${now}
-- Script:   scripts/export-mysql-to-supabase.js
--
-- Tablas incluidas (${TABLES.length}):
${TABLES.map((t) => `--   ${t.name}`).join("\n")}
--
-- INSTRUCCIONES:
--   Ejecutar en Supabase SQL Editor DESPUÉS de:
--     001_citysecure_schema.sql
--     002_citysecure_seeds.sql (roles + permisos sistema)
--     003_...  (si existe)
--
--   Si ya corriste 002_seeds.sql, la tabla 'permisos' puede
--   tener conflictos — ON CONFLICT DO NOTHING los ignora.
--
-- FK NULLADAS (tablas no migradas):
--   created_by / updated_by / deleted_by → NULL (usuarios)
--   supervisor_id, personal_supervisor_id → NULL (personal_seguridad)
--   personal_seguridad_id (radios_tetra) → NULL
-- ============================================================

SET search_path TO citysecure;

`;

  const lines   = [header];
  const summary = [];

  for (const table of TABLES) {
    process.stdout.write(`  📤 ${table.name.padEnd(26)}`);
    try {
      const { count, sql } = await exportTable(conn, table.name);
      const sectionHeader =
        `-- ──────────────────────────────────────────────────────────\n` +
        `-- ${table.name}  (${count} registros)\n` +
        `-- ──────────────────────────────────────────────────────────\n`;
      lines.push(sectionHeader + sql);
      summary.push({ table: table.name, count, ok: true });
      console.log(`${count} registros`);
    } catch (err) {
      const msg = `❌ Error: ${err.message}`;
      lines.push(`-- ${table.name}: ${msg}\n`);
      summary.push({ table: table.name, count: 0, ok: false, error: err.message });
      console.log(msg);
    }
  }

  // ─── Resetear secuencias SERIAL ──────────────────────────────────────────
  // Necesario para que nuevos INSERTs vía API no colisionen con los IDs migrados.
  const seqTables = TABLES.filter(
    (t) => t.pk === "id" && summary.find((s) => s.table === t.name && s.count > 0)
  );

  if (seqTables.length > 0) {
    const seqLines = seqTables.map(
      (t) =>
        `SELECT setval('citysecure.${t.name}_id_seq', ` +
        `COALESCE((SELECT MAX(id) FROM citysecure.${t.name}), 1));`
    );
    lines.push(
      `\n-- ──────────────────────────────────────────────────────────\n` +
      `-- Resetear secuencias SERIAL (evitar colisión con IDs migrados)\n` +
      `-- ──────────────────────────────────────────────────────────\n` +
      seqLines.join("\n") + "\n"
    );
  }

  lines.push(`\n-- FIN: ${new Date().toISOString()}\n`);

  // ─── Escribir archivo ─────────────────────────────────────────────────────
  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf8");
  await conn.end();

  // ─── Resumen ──────────────────────────────────────────────────────────────
  const total = summary.reduce((s, r) => s + r.count, 0);
  const errors = summary.filter((r) => !r.ok);

  console.log("\n─────────────────────────────────────────────────");
  console.log("📊 RESUMEN DE EXPORTACIÓN");
  console.log("─────────────────────────────────────────────────");

  const maxLen = Math.max(...summary.map((r) => r.table.length));
  for (const row of summary) {
    const icon = row.ok ? "✅" : "❌";
    const cnt  = row.ok ? String(row.count).padStart(6) : " ERROR";
    console.log(`  ${icon}  ${row.table.padEnd(maxLen)}  ${cnt}  registros`);
  }

  console.log("─────────────────────────────────────────────────");
  console.log(`  Total exportado : ${total.toLocaleString()} registros`);
  console.log(`  Tablas OK       : ${summary.length - errors.length} / ${summary.length}`);
  if (errors.length > 0) {
    console.log(`  Errores         : ${errors.map((e) => e.table).join(", ")}`);
  }
  console.log(`\n✅ Archivo generado: supabase/migrations/004_seed_data_from_mysql.sql`);
}

main().catch((err) => {
  console.error("❌ Error fatal:", err.message);
  process.exit(1);
});
