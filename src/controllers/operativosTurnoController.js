/**
 * ===================================================
 * CONTROLADOR: OperativosTurno
 * ===================================================
 *
 * Ruta: src/controllers/operativosTurnoController.js
 *
 * Descripción: Gestiona los turnos del personal operativo.
 *
 *
 * Características:
 * - CRUD completo de turnos
 * - Búsquedas y filtros
 * - Soft delete
 *
 * @module controllers/operativosTurnoController
 * @version 1.0.0
 * @date 2024-07-29
 */

import models from "../models/index.js";
const { OperativosTurno, PersonalSeguridad, Usuario, Sector, HorariosTurnos } = models;
import { Op } from "sequelize";
import { getTimeInTimezone, getDateInTimezone } from "../utils/dateHelper.js";

// ==========================================
// CRUD BÁSICO
// ==========================================

/**
 * Obtener todos los turnos con filtros y paginación
 * GET /api/v1/turnos
 */
export const getAllTurnos = async (req, res) => {
  try {
    console.log("🐛 DEBUG: Iniciando getAllTurnos");
    console.log("🐛 DEBUG: URL:", req.originalUrl);
    console.log("🐛 DEBUG: Method:", req.method);
    console.log("🐛 DEBUG: Query params:", req.query);
    
    const {
      page = 1,
      limit = 20,
      search,
      personal_id,
      operador_id,
      supervisor_id,
      sector_id,
      turno,
      estado,
      fecha,
      fecha_inicio,
      fecha_fin,
      sort = "fecha",
      order = "DESC",
    } = req.query;

    console.log("🐛 DEBUG: Construyendo whereClause");

    const whereClause = {
      deleted_at: null,
      estado_registro: 1,
    };

    // Filtros específicos
    if (personal_id) whereClause.operador_id = personal_id;
    if (operador_id) whereClause.operador_id = operador_id;
    if (supervisor_id) whereClause.supervisor_id = supervisor_id;
    if (sector_id) whereClause.sector_id = sector_id;
    if (turno) whereClause.turno = turno;
    if (estado) whereClause.estado = estado;

    // Búsqueda por texto en operador O supervisor
    // Usamos subquery para buscar en PersonalSeguridad
    if (search) {
      whereClause[Op.or] = [
        {
          "$operador.nombres$": { [Op.like]: `%${search}%` },
        },
        {
          "$operador.apellido_paterno$": { [Op.like]: `%${search}%` },
        },
        {
          "$operador.apellido_materno$": { [Op.like]: `%${search}%` },
        },
        {
          "$supervisor.nombres$": { [Op.like]: `%${search}%` },
        },
        {
          "$supervisor.apellido_paterno$": { [Op.like]: `%${search}%` },
        },
        {
          "$supervisor.apellido_materno$": { [Op.like]: `%${search}%` },
        },
      ];
    }

    // Filtro por fecha exacta
    if (fecha) {
      whereClause.fecha = fecha;
    }

    // Filtro por rango de fechas
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin],
      };
    } else if (fecha_inicio) {
      whereClause.fecha = { [Op.gte]: fecha_inicio };
    } else if (fecha_fin) {
      whereClause.fecha = { [Op.lte]: fecha_fin };
    }

    const offset = (page - 1) * limit;
    const orderField = sort;
    const orderDir = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    console.log("🐛 DEBUG: Configurando includes");

    // Configurar includes - La búsqueda ya está en whereClause principal
    const includeOptions = [
      {
        model: PersonalSeguridad,
        as: "operador",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        required: false,
        association: OperativosTurno.associations.operador,
      },
      {
        model: PersonalSeguridad,
        as: "supervisor", 
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        required: false,
        association: OperativosTurno.associations.supervisor,
      },
      {
        model: Sector,
        as: "sector",
        attributes: ["id", "nombre", "sector_code"],
        required: false,
      },
      {
        model: Usuario,
        as: "usuarioRegistro",
        attributes: ["id", "username"],
        required: false,
      },
    ];

    console.log("🐛 DEBUG: Include options configurados:", includeOptions.map(i => ({ model: i.model.name, as: i.as })));
    console.log("🐛 DEBUG: Ejecutando OperativosTurno.findAndCountAll...");

    const { count, rows } = await OperativosTurno.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    console.log("🐛 DEBUG: Consulta ejecutada exitosamente. Count:", count, "Rows:", rows.length);

    res.status(200).json({
      success: true,
      message: "Turnos obtenidos exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("🐛 DEBUG: Error en getAllTurnos:");
    console.error("🐛 DEBUG: URL:", req.originalUrl);
    console.error("🐛 DEBUG: Method:", req.method);
    console.error("🐛 DEBUG: Query params:", req.query);
    console.error("🐛 DEBUG: Error message:", error.message);
    console.error("🐛 DEBUG: Error name:", error.name);
    console.error("🐛 DEBUG: Error stack:", error.stack);
    
    // Si es un error de asociaciones de Sequelize, mostrar detalles adicionales
    if (error.name === 'SequelizeAssociationError' || error.message.includes('associated')) {
      console.error("🐛 DEBUG: Error de asociaciones detectado");
      console.error("🐛 DEBUG: Error completo:", JSON.stringify(error, null, 2));
    }

    // Intentar identificar qué include está causando el problema
    if (error.message.includes('PersonalSeguridad')) {
      console.error("🐛 DEBUG: El error está relacionado con PersonalSeguridad");
      console.error("🐛 DEBUG: Revisando includes de PersonalSeguridad...");
      
      // Mostrar todas las asociaciones de PersonalSeguridad disponibles
      try {
        console.log("🐛 DEBUG: Asociaciones de OperativosTurno:", Object.keys(OperativosTurno.associations));
        console.log("🐛 DEBUG: Asociaciones de PersonalSeguridad:", Object.keys(PersonalSeguridad.associations));
      } catch (assocError) {
        console.error("🐛 DEBUG: Error al obtener asociaciones:", assocError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error al obtener los turnos",
      error: error.message,
      debug: {
        name: error.name,
        isAssociationError: error.name === 'SequelizeAssociationError' || error.message.includes('associated'),
        url: req.originalUrl,
        method: req.method,
        query: req.query
      }
    });
  }
};

/**
 * Obtener un turno por ID
 * GET /api/v1/turnos/:id
 */
export const getTurnoById = async (req, res) => {
  try {
    console.log("🐛 DEBUG: Iniciando getTurnoById");
    console.log("🐛 DEBUG: URL:", req.originalUrl);
    console.log("🐛 DEBUG: Params:", req.params);
    
    const { id } = req.params;

    console.log("🐛 DEBUG: Ejecutando OperativosTurno.findByPk...");

    const turno = await OperativosTurno.findOne({
      where: {
        id,
        deleted_at: null,
        estado_registro: 1,
      },
      include: [
        {
          model: PersonalSeguridad,
          as: "operador",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: PersonalSeguridad,
          as: "supervisor",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: Usuario,
          as: "usuarioRegistro",
        },
      ],
    });

    console.log("🐛 DEBUG: Turno consultado. Encontrado:", !!turno);

    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Turno obtenido exitosamente",
      data: turno,
    });
  } catch (error) {
    console.error("❌ Error en getTurnoById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el turno",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo turno
 * POST /api/v1/turnos
 *
 * LÓGICA DE FECHA PARA TURNOS NOCTURNOS:
 * Si el turno cruza medianoche (ej: 23:00 - 07:00) y el registro se crea
 * entre 00:00 y hora_fin, la fecha del turno debe ser el día ANTERIOR
 * (cuando realmente empezó el turno).
 */
export const createTurno = async (req, res) => {
  try {
    const {
      operador_id,
      supervisor_id,
      sector_id,
      fecha,
      fecha_hora_inicio,
      fecha_hora_fin,
      estado,
      observaciones,
      turno,
    } = req.body;

    // Si no se proporciona supervisor_id, obtenerlo del sector
    let supervisorIdFinal = supervisor_id;
    if (!supervisor_id && sector_id) {
      const sector = await Sector.findByPk(sector_id, {
        attributes: ['supervisor_id']
      });
      if (sector) {
        supervisorIdFinal = sector.supervisor_id;
      }
    }

    // ========================================
    // CALCULAR FECHA CORRECTA PARA EL TURNO
    // ========================================
    // NOTA: Solo se ajusta el campo 'fecha' (fecha del turno operativo)
    // El campo 'fecha_hora_inicio' mantiene la fecha/hora REAL de asignación del recurso
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

    const nuevoTurno = await OperativosTurno.create({
      operador_id,
      supervisor_id: supervisorIdFinal,
      sector_id,
      fecha: fechaFinal,
      fecha_hora_inicio, // Mantiene la fecha/hora REAL de asignación
      fecha_hora_fin,
      estado,
      observaciones,
      turno,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Turno creado exitosamente",
      data: nuevoTurno,
    });
  } catch (error) {
    console.error("❌ Error en createTurno:", error);

    // Detectar error de constraint única para turno duplicado
    if (error.name === "SequelizeUniqueConstraintError") {
      // En Sequelize, el constraint puede estar en varios lugares
      // Verificar si es la constraint de turno duplicado buscando en múltiples propiedades
      const isDateTurnoSectorDuplicate =
        error.fields?.uq_fecha_turno_sector || // El constraint está aquí
        error.parent?.constraint === "uq_fecha_turno_sector" ||
        error.original?.constraint === "uq_fecha_turno_sector" ||
        (error.parent?.sqlMessage &&
          error.parent.sqlMessage.includes("uq_fecha_turno_sector"));

      if (isDateTurnoSectorDuplicate) {
        return res.status(409).json({
          code: "DUPLICATE_TURNO",
          message:
            "Ya existe un turno operativo para esta fecha, sector y turno",
          success: false,
          details: {
            fecha: req.body.fecha,
            turno: req.body.turno,
            sector_id: req.body.sector_id,
          },
        });
      }
    }

    // Error de foreign key constraint
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        code: "FOREIGN_KEY_ERROR",
        message: "Error de referencia: El ID proporcionado no existe",
        success: false,
        details: {
          field: error.index,
          table: error.table,
          value: error.value,
        },
      });
    }

    // Errores de validación de Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Error de validación",
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    // Error genérico
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Error interno del servidor",
      success: false,
    });
  }
};

/**
 * Actualizar un turno por ID
 * PUT /api/v1/turnos/:id
 */
export const updateTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      operador_id,
      supervisor_id,
      sector_id,
      turno,
      fecha,
      fecha_hora_inicio,
      fecha_hora_fin,
      estado,
      observaciones,
    } = req.body;

    const turnoRecord = await OperativosTurno.findOne({
      where: { id, deleted_at: null, estado_registro: 1 },
    });

    if (!turnoRecord) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    // Construir objeto de actualización solo con campos enviados
    const updateData = {
      updated_by: req.user.id,
    };

    if (operador_id !== undefined) updateData.operador_id = operador_id;
    if (supervisor_id !== undefined) updateData.supervisor_id = supervisor_id;
    if (sector_id !== undefined) updateData.sector_id = sector_id;
    if (turno !== undefined) updateData.turno = turno;
    if (fecha !== undefined) updateData.fecha = fecha;
    if (fecha_hora_inicio !== undefined)
      updateData.fecha_hora_inicio = fecha_hora_inicio;
    if (fecha_hora_fin !== undefined)
      updateData.fecha_hora_fin = fecha_hora_fin;
    if (estado !== undefined) updateData.estado = estado;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    await turnoRecord.update(updateData);

    // Recargar con las relaciones
    await turnoRecord.reload({
      include: [
        {
          model: PersonalSeguridad,
          as: "operador",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
          association: OperativosTurno.associations.operador,
        },
        {
          model: PersonalSeguridad,
          as: "supervisor",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
          association: OperativosTurno.associations.supervisor,
        },
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre", "sector_code"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Turno actualizado exitosamente",
      data: turnoRecord,
    });
  } catch (error) {
    console.error("❌ Error en updateTurno:", error);

    // Detectar error de constraint única para turno duplicado
    if (error.name === "SequelizeUniqueConstraintError") {
      const isDateTurnoSectorDuplicate =
        error.fields?.uq_fecha_turno_sector ||
        error.parent?.constraint === "uq_fecha_turno_sector" ||
        error.original?.constraint === "uq_fecha_turno_sector" ||
        (error.parent?.sqlMessage &&
          error.parent.sqlMessage.includes("uq_fecha_turno_sector"));

      if (isDateTurnoSectorDuplicate) {
        return res.status(409).json({
          code: "DUPLICATE_TURNO",
          message:
            "Ya existe un turno operativo para esta fecha, sector y turno",
          success: false,
          details: {
            fecha: req.body.fecha,
            turno: req.body.turno,
            sector_id: req.body.sector_id,
          },
        });
      }
    }

    // Errores de validación de Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Error de validación",
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    // Error genérico
    res.status(500).json({
      success: false,
      message: "Error al actualizar el turno",
      error: error.message,
    });
  }
};

/**
 * Eliminar un turno por ID (soft delete)
 * DELETE /api/v1/turnos/:id
 */
export const deleteTurno = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await OperativosTurno.findOne({
      where: { id, deleted_at: null, estado_registro: 1 },
    });

    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    // Soft delete usando el método destroy de Sequelize
    await turno.destroy({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Turno eliminado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en deleteTurno:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el turno",
      error: error.message,
    });
  }
};
