/**
 * Script para ejecutar el seeder de Estados de Novedad
 * 
 * Ejecutar con: node src/seeders/runSeedEstados.js
 */

import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../models/index.js";
import { seedEstadosNovedad } from "./seedEstadosNovedad.js";

async function run() {
  try {
    console.log("🚀 Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión establecida\n");

    await seedEstadosNovedad();

    console.log("\n✅ Seed completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error ejecutando seed:", error);
    process.exit(1);
  }
}

run();
