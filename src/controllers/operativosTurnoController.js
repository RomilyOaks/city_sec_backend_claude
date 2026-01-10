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
const { OperativosTurno, PersonalSeguridad, Usuario } = models;
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
      estado,
      fecha_inicio,
      fecha_fin,
      sort = "fecha_hora_inicio",
      order = "DESC",
    } = req.query;

    const whereClause = {
      deleted_at: null,
    };

    if (search) {
      whereClause[Op.or] = [{ novedades: { [Op.like]: `%${search}%` } }];
    }

    if (personal_id) whereClause.operador_id = personal_id;
    if (estado) whereClause.estado = estado;
    if (fecha_inicio)
      whereClause.fecha_hora_inicio = { [Op.gte]: new Date(fecha_inicio) };
    if (fecha_fin)
      whereClause.fecha_hora_fin = { [Op.lte]: new Date(fecha_fin) };

    const offset = (page - 1) * limit;
    const orderField = sort;
    const orderDir = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { count, rows } = await OperativosTurno.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PersonalSeguridad,
          as: "personal",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: Usuario,
          as: "usuarioRegistro",
          attributes: ["id", "username"],
        },
      ],
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
    res.status(500).json({
      success: false,
      message: "Error al crear el turno",
      error: error.message,
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
