/**
 * SEED: Permisos del módulo Patrullaje — TD-P-005
 *
 * Crea los permisos patrullaje.sereno.read y patrullaje.conductor.read
 * y los asigna al rol "sereno" (ya existente en BD).
 *
 * Idempotente: puede ejecutarse varias veces sin duplicar datos.
 * EJECUTAR CON: node src/seeders/seedPatrullaje.js
 */

import { sequelize } from "../models/index.js";
import models from "../models/index.js";

const { Rol, Permiso } = models;

const permisosPatrullaje = [
  {
    modulo: "patrullaje",
    recurso: "sereno",
    accion: "read",
    descripcion: "Ver turno activo y asignación del sereno",
    es_sistema: false,
  },
  {
    modulo: "patrullaje",
    recurso: "conductor",
    accion: "read",
    descripcion: "Ver vehículo asignado como conductor",
    es_sistema: false,
  },
];

async function seedPatrullaje() {
  console.log("🔄 Iniciando seed de permisos de Patrullaje (TD-P-005)...");

  const transaction = await sequelize.transaction();

  try {
    await sequelize.authenticate();

    // 1. Verificar que el rol sereno existe (crearlo si no existe)
    const [rolSereno] = await Rol.findOrCreate({
      where: { slug: "sereno" },
      defaults: {
        nombre: "Sereno",
        descripcion: "Agente de serenazgo con acceso al APK de patrullaje",
        nivel_jerarquia: 8,
        es_sistema: false,
        color: "#10B981",
        estado: true,
      },
      transaction,
    });

    console.log(`   ✓ Rol sereno: id=${rolSereno.id} (nivel_jerarquia=${rolSereno.nivel_jerarquia})`);

    // 2. Crear permisos e importar RolPermiso dinámicamente (igual que seedRBAC)
    const { RolPermiso } = await import("../models/index.js");

    let permisosCreados = 0;
    for (const permisoData of permisosPatrullaje) {
      const slug = `${permisoData.modulo}.${permisoData.recurso}.${permisoData.accion}`;

      const [permiso, created] = await Permiso.findOrCreate({
        where: { modulo: permisoData.modulo, recurso: permisoData.recurso, accion: permisoData.accion },
        defaults: { ...permisoData, slug, estado: true },
        transaction,
      });

      if (created) permisosCreados++;
      console.log(`   ${created ? "✓ Creado" : "· Ya existe"} permiso: ${slug} (id=${permiso.id})`);

      // 3. Asignar permiso al rol sereno si no está ya asignado
      const [, asignado] = await RolPermiso.findOrCreate({
        where: { rol_id: rolSereno.id, permiso_id: permiso.id },
        defaults: { rol_id: rolSereno.id, permiso_id: permiso.id },
        transaction,
      });

      console.log(`   ${asignado ? "✓ Asignado" : "· Ya asignado"} ${slug} → sereno`);
    }

    await transaction.commit();

    console.log("\n✅ Seed completado:");
    console.log(`   Permisos nuevos: ${permisosCreados}`);
    console.log(`   Permisos verificados: ${permisosPatrullaje.length}`);
    console.log("\n   Verificar con:");
    console.log("   SELECT slug FROM permisos WHERE slug LIKE 'patrullaje%';");
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Error en seedPatrullaje:", err.message);
    throw err;
  } finally {
    await sequelize.close();
  }
}

seedPatrullaje().catch((err) => {
  console.error(err);
  process.exit(1);
});
