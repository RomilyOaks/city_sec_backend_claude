/**
 * ============================================
 * SEED: PERMISOS PARA ROL CONSULTA
 * ============================================
 * 
 * Seed específico para agregar permisos faltantes al rol "consulta"
 * Versión simplificada para evitar cuelgues
 */

import sequelize from "../config/database.js";
import { IS_POSTGRES } from "../config/database.js"; // eslint-disable-line no-unused-vars
import models from "../models/index.js";
import { Op } from "sequelize";

const { Rol, Permiso, RolPermiso } = models;

async function seedConsultaPermisos() {
  console.log("🔄 Iniciando seed de permisos para rol consulta...");
  
  try {
    await sequelize.authenticate();

    const consultaRole = await Rol.findOne({
      where: { slug: "consulta" }
    });

    if (!consultaRole) {
      return;
    }

    console.log(`✅ Rol 'consulta' encontrado (ID: ${consultaRole.id})`);

    // Permisos específicos que faltan
    const permisosFaltantes = [
      {
        modulo: "catalogos",
        recurso: "tipos_novedad",
        accion: "read",
        descripcion: "Ver tipos de novedad",
        slug: "catalogos.tipos_novedad.read"
      },
      {
        modulo: "catalogos",
        recurso: "subtipos_novedad",
        accion: "read",
        descripcion: "Ver subtipos de novedad",
        slug: "catalogos.subtipos_novedad.read"
      }
    ];

    console.log("📝 Procesando permisos faltantes...");

    for (const permisoData of permisosFaltantes) {
      
      const [permiso, created] = await Permiso.findOrCreate({
        where: {
          modulo: permisoData.modulo,
          recurso: permisoData.recurso,
          accion: permisoData.accion
        },
        defaults: {
          ...permisoData,
          estado: true,
          es_sistema: true
        }
      });

      if (created) {
        console.log(`✅ Permiso creado: ${permisoData.slug}`);
      } else {
        console.log(`ℹ️ Permiso existente: ${permisoData.slug}`);
      }

      // Asignar permiso al rol consulta
      const [asignacion, asignacionCreada] = await RolPermiso.findOrCreate({
        where: {
          rol_id: consultaRole.id,
          permiso_id: permiso.id
        },
        defaults: {
          created_by: 13,
          updated_by: 13
        }
      });

      if (asignacionCreada) {
        console.log(`✅ Permiso asignado a rol consulta: ${permisoData.slug}`);
      } else {
        console.log(`ℹ️ Permiso ya asignado: ${permisoData.slug}`);
      }
    }

    const permisosLectura = await Permiso.findAll({
      where: {
        accion: "read",
        [Op.or]: [
          { modulo: "novedades" },
          { modulo: "catalogos" },
          { modulo: "calles" },
          { modulo: "operativos" },
          { modulo: "reportes" }
        ]
      }
    });

    console.log(`📊 Se encontraron ${permisosLectura.length} permisos de lectura`);

    // Asignar todos los permisos de lectura al rol consulta
    let asignados = 0;
    for (const permiso of permisosLectura) {
      const [asignacion, creada] = await RolPermiso.findOrCreate({
        where: {
          rol_id: consultaRole.id,
          permiso_id: permiso.id
        },
        defaults: {
          created_by: 13,
          updated_by: 13
        }
      });

      if (creada) {
        asignados++;
      }
    }

    console.log(`✅ ${asignados} nuevos permisos de lectura asignados al rol consulta`);

    // Resumen final
    const totalPermisosRol = await RolPermiso.count({
      where: { rol_id: consultaRole.id }
    });

    console.log("\n🎉 SEED COMPLETADO");
    console.log(`📊 Total permisos del rol consulta: ${totalPermisosRol}`);

  } catch (error) {
    console.error("❌ Error durante el seed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await sequelize.close();
    console.log("🔌 Conexión cerrada");
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedConsultaPermisos();
}

export default seedConsultaPermisos;
