import models from "../models/index.js";
const { OperativosTurno, PersonalSeguridad, Usuario } = models;

async function seedOperativosTurno() {
  try {
    console.log("🌱 Iniciando seeder de turnos de operativos...");

    // Obtener personal y usuarios para asociar
    const personalList = await PersonalSeguridad.findAll({ limit: 5 });
    const userList = await Usuario.findAll({ where: { rol_id: 1 }, limit: 1 }); // Asumimos rol 1 = Admin

    if (personalList.length === 0 || userList.length === 0) {
      console.log(
        "No se encontró suficiente personal o usuarios para generar los turnos. Abortando seeder."
      );
      return;
    }

    const adminUser = userList[0];

    const turnos = [
      {
        personal_id: personalList[0].id,
        fecha_hora_inicio: new Date("2024-07-28T08:00:00"),
        fecha_hora_fin: new Date("2024-07-28T16:00:00"),
        estado: "Finalizado",
        novedades: "Sin novedades durante el turno.",
        usuario_registro_id: adminUser.id,
        created_by: adminUser.id,
      },
      {
        personal_id: personalList[1].id,
        fecha_hora_inicio: new Date("2024-07-28T16:00:00"),
        fecha_hora_fin: new Date("2024-07-29T00:00:00"),
        estado: "Finalizado",
        novedades: "Se atendió una incidencia menor en el cuadrante 5.",
        usuario_registro_id: adminUser.id,
        created_by: adminUser.id,
      },
      {
        personal_id: personalList[2].id,
        fecha_hora_inicio: new Date("2024-07-29T00:00:00"),
        fecha_hora_fin: new Date("2024-07-29T08:00:00"),
        estado: "Finalizado",
        novedades: "Turno tranquilo.",
        usuario_registro_id: adminUser.id,
        created_by: adminUser.id,
      },
      {
        personal_id: personalList[3].id,
        fecha_hora_inicio: new Date("2024-07-29T08:00:00"),
        estado: "Activo",
        novedades: "Inicio de turno.",
        usuario_registro_id: adminUser.id,
        created_by: adminUser.id,
      },
    ];

    for (const turnoData of turnos) {
      await OperativosTurno.findOrCreate({
        where: {
          personal_id: turnoData.personal_id,
          fecha_hora_inicio: turnoData.fecha_hora_inicio,
        },
        defaults: turnoData,
      });
    }

    console.log("✅ Seeder de turnos de operativos finalizado con éxito.");
  } catch (error) {
    console.error("❌ Error en el seeder de turnos de operativos:", error);
    process.exit(1);
  }
}

export default seedOperativosTurno;
