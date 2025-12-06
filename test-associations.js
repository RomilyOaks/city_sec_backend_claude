// test-associations.js
import models from "./src/models/index.js";

const { Usuario, Rol, Permiso, Vehiculo, TipoVehiculo } = models;

async function testAssociations() {
  try {
    // Test 1: Usuario con Roles
    const usuario = await Usuario.findOne({
      include: [{ model: Rol, as: "roles" }],
    });
    console.log("✅ Usuario-Rol association works");

    // Test 2: Vehiculo con TipoVehiculo
    const vehiculo = await Vehiculo.findOne({
      include: [{ model: TipoVehiculo, as: "tipo" }],
    });
    console.log("✅ Vehiculo-TipoVehiculo association works");

    console.log("\n🎉 Todas las asociaciones funcionan correctamente!");
  } catch (error) {
    console.error("❌ Error en asociaciones:", error.message);
  }
  process.exit(0);
}

testAssociations();
