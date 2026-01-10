import seedRBAC from "./seedRBAC.js";
import seedEstadosNovedad from "./seedEstadosNovedad.js";
import seedOperativosTurno from "./seedOperativosTurno.js";
import { sequelize } from "../config/database.js";

const seeders = {
  rbac: seedRBAC,
  estados: seedEstadosNovedad,
  turnos: seedOperativosTurno,
};

async function runSeeders() {
  try {
    await sequelize.sync({ force: false }); // `force: false` para no borrar datos existentes
    console.log("🗄️  Base de datos sincronizada.");

    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log("🏃‍♂️ Ejecutando todos los seeders...");
      await seedRBAC();
      await seedEstadosNovedad();
      await seedOperativosTurno();
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
