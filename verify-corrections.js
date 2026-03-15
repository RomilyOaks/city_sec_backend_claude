import mysql from "mysql2/promise";

async function verify() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Effata",
    database: "citizen_security_v2",
  });

  // Primero, obtener todas las novedades con historial
  const [novedades] = await conn.execute(
    "SELECT DISTINCT novedad_id FROM historial_estado_novedades ORDER BY novedad_id DESC LIMIT 5",
  );

  console.log("\n=== Últimas 5 novedades con historial ===");
  console.log(novedades.map((n) => n.novedad_id));

  // Ahora verificar la novedad más reciente con múltiples registros
  if (novedades.length > 0) {
    const novedad_id = novedades[0].novedad_id;
    console.log(`\n=== Historial de Novedad ${novedad_id} ===\n`);

    const [rows] = await conn.execute(
      `SELECT id, novedad_id, tiempo_en_estado_min, fecha_cambio 
       FROM historial_estado_novedades 
       WHERE novedad_id = ? 
       ORDER BY fecha_cambio`,
      [novedad_id],
    );

    console.log(`Total de cambios de estado: ${rows.length}`);
    rows.forEach((row, idx) => {
      console.log(`\nRegistro ${idx + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Tiempo en Estado: ${row.tiempo_en_estado_min} min`);
      console.log(`  Fecha Cambio: ${row.fecha_cambio}`);
    });
  }

  await conn.end();
}

verify();
