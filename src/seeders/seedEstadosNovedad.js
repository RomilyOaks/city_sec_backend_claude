/**
 * Seeder para Estados de Novedad
 * 
 * Configura los estados básicos del flujo de novedades/incidentes
 * incluyendo el estado inicial requerido para crear nuevas novedades.
 * 
 * @module seeders/seedEstadosNovedad
 */

import EstadoNovedad from "../models/EstadoNovedad.js";
import { IS_POSTGRES } from "../config/database.js"; // eslint-disable-line no-unused-vars

const estadosNovedad = [
  {
    nombre: "Pendiente De Registro",
    descripcion: "Novedad registrada, pendiente de asignación",
    color_hex: "#F59E0B",
    icono: "clock",
    orden: 1,
    es_inicial: true,
    es_final: false,
    requiere_unidad: false,
    estado: true,
  },
  {
    nombre: "Asignado",
    descripcion: "Unidad asignada para atender la novedad",
    color_hex: "#3B82F6",
    icono: "user-check",
    orden: 2,
    es_inicial: false,
    es_final: false,
    requiere_unidad: true,
    estado: true,
  },
  {
    nombre: "En Camino",
    descripcion: "Unidad en camino al lugar del incidente",
    color_hex: "#8B5CF6",
    icono: "navigation",
    orden: 3,
    es_inicial: false,
    es_final: false,
    requiere_unidad: true,
    estado: true,
  },
  {
    nombre: "En Sitio",
    descripcion: "Unidad llegó al lugar del incidente",
    color_hex: "#06B6D4",
    icono: "map-pin",
    orden: 4,
    es_inicial: false,
    es_final: false,
    requiere_unidad: true,
    estado: true,
  },
  {
    nombre: "En Atención",
    descripcion: "Atendiendo el incidente",
    color_hex: "#10B981",
    icono: "activity",
    orden: 5,
    es_inicial: false,
    es_final: false,
    requiere_unidad: true,
    estado: true,
  },
  {
    nombre: "Resuelto",
    descripcion: "Incidente resuelto satisfactoriamente",
    color_hex: "#22C55E",
    icono: "check-circle",
    orden: 6,
    es_inicial: false,
    es_final: true,
    requiere_unidad: false,
    estado: true,
  },
  {
    nombre: "Cerrado",
    descripcion: "Caso cerrado y archivado",
    color_hex: "#6B7280",
    icono: "archive",
    orden: 7,
    es_inicial: false,
    es_final: true,
    requiere_unidad: false,
    estado: true,
  },
  {
    nombre: "Cancelado",
    descripcion: "Novedad cancelada (falsa alarma, duplicado, etc.)",
    color_hex: "#EF4444",
    icono: "x-circle",
    orden: 8,
    es_inicial: false,
    es_final: true,
    requiere_unidad: false,
    estado: true,
  },
];

export async function seedEstadosNovedad() {
  console.log("🔄 Iniciando seed de Estados de Novedad...");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const estadoData of estadosNovedad) {
    try {
      const [estado, wasCreated] = await EstadoNovedad.findOrCreate({
        where: { nombre: estadoData.nombre },
        defaults: estadoData,
      });

      if (wasCreated) {
        created++;
        console.log(`  ✅ Creado: ${estadoData.nombre}`);
      } else {
        // Actualizar si es necesario (especialmente es_inicial)
        const needsUpdate = 
          estado.es_inicial !== estadoData.es_inicial ||
          estado.es_final !== estadoData.es_final ||
          estado.estado !== estadoData.estado;

        if (needsUpdate) {
          await estado.update({
            es_inicial: estadoData.es_inicial,
            es_final: estadoData.es_final,
            estado: estadoData.estado,
            color_hex: estadoData.color_hex,
            icono: estadoData.icono,
            orden: estadoData.orden,
          });
          updated++;
          console.log(`  🔄 Actualizado: ${estadoData.nombre}`);
        } else {
          skipped++;
          console.log(`  ⏭️  Ya existe: ${estadoData.nombre}`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error con ${estadoData.nombre}:`, error.message);
    }
  }

  console.log("\n📊 Resumen Estados de Novedad:");
  console.log(`   - Creados: ${created}`);
  console.log(`   - Actualizados: ${updated}`);
  console.log(`   - Sin cambios: ${skipped}`);

  // Verificar que existe el estado inicial
  const estadoInicial = await EstadoNovedad.findOne({
    where: { es_inicial: true, estado: true },
  });

  if (estadoInicial) {
    console.log(`\n✅ Estado inicial configurado: "${estadoInicial.nombre}" (${estadoInicial.estado_code})`);
  } else {
    console.error("\n❌ ERROR: No se pudo configurar el estado inicial");
  }

  return { created, updated, skipped };
}

export default seedEstadosNovedad;
