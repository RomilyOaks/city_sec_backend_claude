/**
 * ===================================================
 * HELPER: Operativos Helper Service
 * ===================================================
 *
 * Ruta: src/services/operativosHelperService.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-25
 *
 * Descripción:
 * Funciones helper para manejar operaciones de turnos operativos.
 * Proporciona métodos para buscar o crear turnos operativos
 * con manejo correcto de timezone y validaciones.
 */

import models from "../models/index.js";
const { OperativosTurno, HorariosTurnos, Sector, RadioTetra } = models;
import { getDateInTimezone, getTimeInTimezone } from "../utils/dateHelper.js";

/**
 * Busca un turno operativo existente o crea uno nuevo
 * @param {Object} params - Parámetros para buscar/crear turno
 * @param {number} params.sector_id - ID del sector
 * @param {string} params.turno - Nombre del turno (MAÑANA, TARDE, NOCHE)
 * @param {string} params.fecha - Fecha en formato YYYY-MM-DD (opcional)
 * @param {number} params.operador_id - ID del operador (opcional)
 * @param {number} params.supervisor_id - ID del supervisor (opcional)
 * @param {number} created_by - ID del usuario que crea
 * @returns {Object} Turno operativo encontrado o creado
 */
export const findOrCreateOperativoTurno = async (params, created_by) => {
  try {
    const { sector_id, turno, fecha, operador_id, supervisor_id } = params;
    
    // Usar fecha actual si no se proporciona
    const fechaFinal = fecha || getDateInTimezone();
    
    console.log(`🔍 Buscando turno operativo: fecha=${fechaFinal}, turno=${turno}, sector=${sector_id}`);
    
    // Primero intentar encontrar un turno existente
    let operativoExistente = await OperativosTurno.findOne({
      where: {
        fecha: fechaFinal,
        turno: turno,
        sector_id: sector_id,
        deleted_at: null,
        estado_registro: 1
      }
    });

    if (operativoExistente) {
      console.log(`✅ Turno operativo encontrado: ID=${operativoExistente.id}`);
      return {
        success: true,
        data: operativoExistente,
        action: "found"
      };
    }

    console.log("⚠️ No se encontró turno operativo, creando nuevo...");
    
    // Si no existe, crear uno nuevo
    const nuevoTurno = await createOperativoTurno({
      sector_id,
      turno,
      fecha: fechaFinal,
      operador_id,
      supervisor_id,
      created_by
    });

    return {
      success: true,
      data: nuevoTurno,
      action: "created"
    };

  } catch (error) {
    console.error("❌ Error en findOrCreateOperativoTurno:", error);
    
    // Manejar error de duplicado específico
    if (error.name === "SequelizeUniqueConstraintError" || 
        error.original?.code === "ER_DUP_ENTRY") {
      // Si hay error de duplicado, intentar buscar nuevamente
      try {
        const operativoExistente = await OperativosTurno.findOne({
          where: {
            fecha: params.fecha || getDateInTimezone(),
            turno: params.turno,
            sector_id: params.sector_id,
            deleted_at: null,
            estado_registro: 1
          }
        });

        if (operativoExistente) {
          console.log(`✅ Turno operativo encontrado después de error de duplicado: ID=${operativoExistente.id}`);
          return {
            success: true,
            data: operativoExistente,
            action: "found_after_error"
          };
        }
      } catch (retryError) {
        console.error("❌ Error al reintentar búsqueda:", retryError);
      }
    }

    throw new Error(`No se pudo encontrar el operativo existente para fecha ${params.fecha || getDateInTimezone()}, turno ${params.turno}, sector ${params.sector_id}`);
  }
};

/**
 * Crea un nuevo turno operativo
 * @param {Object} params - Parámetros para crear turno
 * @returns {Object} Turno operativo creado
 */
const createOperativoTurno = async (params) => {
  const { sector_id, turno, fecha, operador_id, supervisor_id, created_by } = params;
  
  // ========================================
  // CALCULAR FECHA CORRECTA PARA EL TURNO
  // ========================================
  let fechaFinal = fecha;

  // Si se proporciona el nombre del turno, verificar si cruza medianoche
  if (turno) {
    const horarioTurno = await HorariosTurnos.findOne({
      where: {
        turno: turno,
        estado: 1,
        deleted_at: null,
      },
    });

    if (horarioTurno && horarioTurno.cruza_medianoche) {
      // Obtener hora actual en timezone de Perú
      const horaActual = getTimeInTimezone(); // "HH:MM:SS"
      const horaFin = horarioTurno.hora_fin; // "07:00:00"

      // Si la hora actual es menor que hora_fin (estamos después de medianoche)
      // entonces el turno empezó el día anterior
      if (horaActual < horaFin) {
        // Calcular fecha del día anterior
        const fechaActual = getDateInTimezone(); // "YYYY-MM-DD"
        const fechaDate = new Date(fechaActual + "T12:00:00"); // Mediodía para evitar problemas de timezone
        fechaDate.setDate(fechaDate.getDate() - 1);

        // Formatear como YYYY-MM-DD
        const year = fechaDate.getFullYear();
        const month = String(fechaDate.getMonth() + 1).padStart(2, "0");
        const day = String(fechaDate.getDate()).padStart(2, "0");
        fechaFinal = `${year}-${month}-${day}`;
      }
    }
  }

  // Obtener supervisor del sector si no se proporciona
  let supervisorIdFinal = supervisor_id;
  if (!supervisor_id && sector_id) {
    const sector = await Sector.findByPk(sector_id, {
      attributes: ["supervisor_id"]
    });
    if (sector) {
      supervisorIdFinal = sector.supervisor_id;
    }
  }

  const nuevoTurno = await OperativosTurno.create({
    operador_id,
    supervisor_id: supervisorIdFinal,
    sector_id,
    fecha: fechaFinal,
    fecha_hora_inicio: new Date(), // Mantiene la fecha/hora REAL de asignación
    estado: "ACTIVO",
    turno,
    created_by,
  });

  console.log(`✅ Turno operativo creado: ID=${nuevoTurno.id}, fecha=${nuevoTurno.fecha}`);
  return nuevoTurno;
};

/**
 * Busca turnos operativos por criterios
 * @param {Object} params - Parámetros de búsqueda
 * @returns {Array} Lista de turnos operativos
 */
export const findOperativosTurnos = async (params) => {
  try {
    const { fecha, turno, sector_id, limit = 10, offset = 0 } = params;
    
    const whereClause = {
      deleted_at: null,
      estado_registro: 1
    };

    if (fecha) whereClause.fecha = fecha;
    if (turno) whereClause.turno = turno;
    if (sector_id) whereClause.sector_id = sector_id;

    const turnos = await OperativosTurno.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.PersonalSeguridad,
          as: "operador",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: models.PersonalSeguridad,
          as: "supervisor",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: models.Sector,
          as: "sector",
          attributes: ["id", "nombre", "sector_code"],
        },
      ],
      order: [["fecha", "DESC"], ["turno", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      success: true,
      data: turnos.rows,
      total: turnos.count,
      hasMore: offset + limit < turnos.count
    };

  } catch (error) {
    console.error("❌ Error en findOperativosTurnos:", error);
    throw new Error(`Error al buscar turnos operativos: ${error.message}`);
  }
};

/**
 * Obtiene el radio TETRA asignado a un personal de seguridad
 * @param {number} personalId - ID del personal de seguridad
 * @returns {number|null} ID del radio asignado o null si no tiene
 */
export const obtenerRadioDelPersonal = async (personalId) => {
  if (!personalId) return null;

  try {
    const radio = await RadioTetra.findOne({
      where: {
        personal_seguridad_id: personalId,
        estado: true,
        deleted_at: null
      },
      attributes: ["id", "radio_tetra_code"]
    });

    if (radio) {
      console.log(`📻 Radio encontrado para personal ${personalId}: ID=${radio.id}, código=${radio.radio_tetra_code}`);
      return radio.id;
    }

    console.log(`📻 No se encontró radio asignado para personal ${personalId}`);
    return null;
  } catch (error) {
    console.error(`❌ Error al buscar radio del personal ${personalId}:`, error.message);
    return null;
  }
};

export default {
  findOrCreateOperativoTurno,
  findOperativosTurnos,
  obtenerRadioDelPersonal
};
