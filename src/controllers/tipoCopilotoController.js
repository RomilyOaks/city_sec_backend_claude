/**
 * ===================================================
 * CONTROLADOR: TipoCopiloto
 * ===================================================
 *
 * Ruta: src/controllers/tipoCopilotoController.js
 *
 * Descripción: Gestiona los tipos de copiloto para operativos.
 *
 * Endpoints:
 * - GET /api/v1/tipos-copiloto
 * - GET /api/v1/tipos-copiloto/activos
 * - GET /api/v1/tipos-copiloto/:id
 * - POST /api/v1/tipos-copiloto
 * - PUT /api/v1/tipos-copiloto/:id
 * - DELETE /api/v1/tipos-copiloto/:id
 */

import models from "../models/index.js";
const { TipoCopiloto } = models;

/**
 * Obtener todos los tipos de copiloto (solo activos, para dropdowns)
 * GET /api/v1/tipos-copiloto/activos
 */
export const getTiposActivos = async (req, res) => {
  try {
    const tipos = await TipoCopiloto.findAll({
      where: {
        estado: 1,
        deleted_at: null,
      },
      attributes: ["id", "codigo", "descripcion"],
      order: [["descripcion", "ASC"]],
    });

    res.status(200).json({
      success: true,
      message: "Tipos de copiloto activos obtenidos exitosamente",
      data: tipos,
    });
  } catch (error) {
    console.error("❌ Error en getTiposActivos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos de copiloto activos",
      error: error.message,
    });
  }
};

/**
 * Obtener todos los tipos de copiloto con paginación
 * GET /api/v1/tipos-copiloto
 */
export const getAllTipos = async (req, res) => {
  try {
    const { page = 1, limit = 50, estado } = req.query;

    const whereClause = {
      deleted_at: null,
    };

    if (estado !== undefined) {
      whereClause.estado = parseInt(estado);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await TipoCopiloto.findAndCountAll({
      where: whereClause,
      order: [["descripcion", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Tipos de copiloto obtenidos exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error en getAllTipos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos de copiloto",
      error: error.message,
    });
  }
};

/**
 * Obtener un tipo de copiloto por ID
 * GET /api/v1/tipos-copiloto/:id
 */
export const getTipoById = async (req, res) => {
  try {
    const { id } = req.params;

    const tipo = await TipoCopiloto.findOne({
      where: { id, deleted_at: null },
    });

    if (!tipo) {
      return res.status(404).json({
        success: false,
        message: "Tipo de copiloto no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tipo de copiloto obtenido exitosamente",
      data: tipo,
    });
  } catch (error) {
    console.error("❌ Error en getTipoById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el tipo de copiloto",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo tipo de copiloto
 * POST /api/v1/tipos-copiloto
 */
export const createTipo = async (req, res) => {
  try {
    const { codigo, descripcion, estado } = req.body;

    const nuevoTipo = await TipoCopiloto.create({
      codigo,
      descripcion,
      estado: estado !== undefined ? estado : 1,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Tipo de copiloto creado exitosamente",
      data: nuevoTipo,
    });
  } catch (error) {
    console.error("❌ Error en createTipo:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "El código ya existe",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear el tipo de copiloto",
      error: error.message,
    });
  }
};

/**
 * Actualizar un tipo de copiloto
 * PUT /api/v1/tipos-copiloto/:id
 */
export const updateTipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, descripcion, estado } = req.body;

    const tipoRecord = await TipoCopiloto.findOne({
      where: { id, deleted_at: null },
    });

    if (!tipoRecord) {
      return res.status(404).json({
        success: false,
        message: "Tipo de copiloto no encontrado",
      });
    }

    const updateData = {
      updated_by: req.user.id,
    };

    if (codigo !== undefined) updateData.codigo = codigo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (estado !== undefined) updateData.estado = estado;

    await tipoRecord.update(updateData);

    res.status(200).json({
      success: true,
      message: "Tipo de copiloto actualizado exitosamente",
      data: tipoRecord,
    });
  } catch (error) {
    console.error("❌ Error en updateTipo:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "El código ya existe",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar el tipo de copiloto",
      error: error.message,
    });
  }
};

/**
 * Eliminar un tipo de copiloto (soft delete)
 * DELETE /api/v1/tipos-copiloto/:id
 */
export const deleteTipo = async (req, res) => {
  try {
    const { id } = req.params;

    const tipo = await TipoCopiloto.findOne({
      where: { id, deleted_at: null },
    });

    if (!tipo) {
      return res.status(404).json({
        success: false,
        message: "Tipo de copiloto no encontrado",
      });
    }

    await tipo.destroy({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Tipo de copiloto eliminado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en deleteTipo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el tipo de copiloto",
      error: error.message,
    });
  }
};
