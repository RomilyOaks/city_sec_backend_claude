import seedRBAC from "./seedRBAC.js";
import seedEstadosNovedad from "./seedEstadosNovedad.js";
import seedOperativosTurno from "./seedOperativosTurno.js";
import seedBilling from "./seedBilling.js";
import sequelize from "../config/database.js";

const seeders = {
  rbac: seedRBAC,
  estados: seedEstadosNovedad,
  turnos: seedOperativosTurno,
  billing: seedBilling,
};

async function runSeeders() {
  try {
    await sequelize.authenticate();
    console.log("🗄️  Conexión a la base de datos verificada.");

    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log("🏃‍♂️ Ejecutando todos los seeders...");
      await seedRBAC();
      await seedEstadosNovedad();
      await seedOperativosTurno();
      await seedBilling();
      console.log("✅ Todos los seeders se han ejecutado exitosamente.");
    } else {
      for (const seederName of args) {
        if (seeders[seederName]) {
          console.log(`🏃‍♂️ Ejecutando seeder: ${seederName}`);
          await seeders[seederName]();
        } else {
          console.warn(`⚠️ Seeder '${seederName}' no encontrado.`);
        }
      }
      console.log("✅ Seeders especificados se han ejecutado.");
    }
  } catch (error) {
    console.error("❌ Error ejecutando los seeders:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("🚪 Conexión a la base de datos cerrada.");
  }
}

runSeeders();
