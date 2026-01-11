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
const { OperativosTurno, PersonalSeguridad, Usuario, Sector } = models;
import { Op } from "sequelize";

// ==========================================
// CRUD BÁSICO
// ==========================================

/**
 * Obtener todos los turnos con filtros y paginación
 * GET /api/v1/turnos
 */
export const getAllTurnos = async (req, res) => {
  try {
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

    const whereClause = {
      deleted_at: null,
    };

    // Búsqueda por texto (operador o supervisor)
    // Este filtro se aplicará en las relaciones incluidas, no aquí

    // Filtros específicos
    if (personal_id) whereClause.operador_id = personal_id;
    if (operador_id) whereClause.operador_id = operador_id;
    if (supervisor_id) whereClause.supervisor_id = supervisor_id;
    if (sector_id) whereClause.sector_id = sector_id;
    if (turno) whereClause.turno = turno;
    if (estado) whereClause.estado = estado;

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

    // Configurar includes con filtros opcionales por búsqueda
    const includeOptions = [
      {
        model: PersonalSeguridad,
        as: "operador",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        required: false,
        ...(search && {
          where: {
            [Op.or]: [
              { nombres: { [Op.like]: `%${search}%` } },
              { apellido_paterno: { [Op.like]: `%${search}%` } },
              { apellido_materno: { [Op.like]: `%${search}%` } },
            ],
          },
        }),
      },
      {
        model: PersonalSeguridad,
        as: "supervisor",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        required: false,
      },
      {
        model: Sector,
        as: "sector",
        attributes: ["id", "nombre", "codigo"],
        required: false,
      },
      {
        model: Usuario,
        as: "usuarioRegistro",
        attributes: ["id", "username"],
        required: false,
      },
    ];

    const { count, rows } = await OperativosTurno.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

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
    console.error("❌ Error en getAllTurnos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los turnos",
      error: error.message,
    });
  }
};

/**
 * Obtener un turno por ID
 * GET /api/v1/turnos/:id
 */
export const getTurnoById = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await OperativosTurno.findOne({
      where: {
        id,
        deleted_at: null,
      },
      include: [
        {
          model: PersonalSeguridad,
          as: "personal",
        },
        {
          model: Usuario,
          as: "usuarioRegistro",
        },
      ],
    });

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

    const nuevoTurno = await OperativosTurno.create({
      operador_id,
      supervisor_id,
      sector_id,
      fecha,
      fecha_hora_inicio,
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
      personal_id,
      fecha_hora_inicio,
      fecha_hora_fin,
      estado,
      novedades,
    } = req.body;

    const turno = await OperativosTurno.findOne({
      where: { id, deleted_at: null },
    });

    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    await turno.update({
      personal_id,
      fecha_hora_inicio,
      fecha_hora_fin,
      estado,
      novedades,
      updated_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Turno actualizado exitosamente",
      data: turno,
    });
  } catch (error) {
    console.error("❌ Error en updateTurno:", error);
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
      where: { id, deleted_at: null },
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
