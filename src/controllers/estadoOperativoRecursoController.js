/**
 * ===================================================
 * CONTROLADOR: EstadoOperativoRecurso
 * ===================================================
 *
 * Ruta: src/controllers/estadoOperativoRecursoController.js
 *
 * Descripción: Gestiona los estados operativos de recursos (vehículos, personal).
 *
 * Endpoints:
 * - GET /api/v1/estados-operativo-recurso
 * - GET /api/v1/estados-operativo-recurso/activos
 * - GET /api/v1/estados-operativo-recurso/:id
 * - POST /api/v1/estados-operativo-recurso
 * - PUT /api/v1/estados-operativo-recurso/:id
 * - DELETE /api/v1/estados-operativo-recurso/:id
 */

import models from "../models/index.js";
const { EstadoOperativoRecurso } = models;

/**
 * Obtener todos los estados operativos (solo activos, para dropdowns)
 * GET /api/v1/estados-operativo-recurso/activos
 */
export const getEstadosActivos = async (req, res) => {
  try {
    const estados = await EstadoOperativoRecurso.findAll({
      where: {
        estado: 1,
        deleted_at: null,
      },
      attributes: ["id", "codigo", "descripcion"],
      order: [["descripcion", "ASC"]],
    });

    res.status(200).json({
      success: true,
      message: "Estados operativos activos obtenidos exitosamente",
      data: estados,
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`🔥 ERROR en getEstadosActivos:`, error.message);
    console.error(`🔥 Error stack:`, error.stack);
    console.error(`🔥 [${timestamp}] DEBUG: ERROR en getEstadosActivos:`, error.message);
    console.error(`🔥 [${timestamp}] DEBUG: Error stack:`, error.stack);
    
    res.status(500).json({
      success: false,
      message: "Error al obtener estados operativos activos",
      error: error.message,
    });
  }
};

/**
 * Obtener todos los estados operativos con paginación
 * GET /api/v1/estados-operativo-recurso
 */
export const getAllEstados = async (req, res) => {
  try {
    const { page = 1, limit = 50, estado } = req.query;

    const whereClause = {
      deleted_at: null,
    };

    if (estado !== undefined) {
      whereClause.estado = parseInt(estado);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await EstadoOperativoRecurso.findAndCountAll({
      where: whereClause,
      order: [["descripcion", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Estados operativos obtenidos exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error en getAllEstados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estados operativos",
      error: error.message,
    });
  }
};

/**
 * Obtener un estado operativo por ID
 * GET /api/v1/estados-operativo-recurso/:id
 */
export const getEstadoById = async (req, res) => {
  try {
    const { id } = req.params;

    const estado = await EstadoOperativoRecurso.findOne({
      where: { id, deleted_at: null },
    });

    if (!estado) {
      return res.status(404).json({
        success: false,
        message: "Estado operativo no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Estado operativo obtenido exitosamente",
      data: estado,
    });
  } catch (error) {
    console.error("❌ Error en getEstadoById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el estado operativo",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo estado operativo
 * POST /api/v1/estados-operativo-recurso
 */
export const createEstado = async (req, res) => {
  try {
    const { codigo, descripcion, estado } = req.body;

    const nuevoEstado = await EstadoOperativoRecurso.create({
      codigo,
      descripcion,
      estado: estado !== undefined ? estado : 1,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Estado operativo creado exitosamente",
      data: nuevoEstado,
    });
  } catch (error) {
    console.error("❌ Error en createEstado:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "El código ya existe",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear el estado operativo",
      error: error.message,
    });
  }
};

/**
 * Actualizar un estado operativo
 * PUT /api/v1/estados-operativo-recurso/:id
 */
export const updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, descripcion, estado } = req.body;

    const estadoRecord = await EstadoOperativoRecurso.findOne({
      where: { id, deleted_at: null },
    });

    if (!estadoRecord) {
      return res.status(404).json({
        success: false,
        message: "Estado operativo no encontrado",
      });
    }

    const updateData = {
      updated_by: req.user.id,
    };

    if (codigo !== undefined) updateData.codigo = codigo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (estado !== undefined) updateData.estado = estado;

    await estadoRecord.update(updateData);

    res.status(200).json({
      success: true,
      message: "Estado operativo actualizado exitosamente",
      data: estadoRecord,
    });
  } catch (error) {
    console.error("❌ Error en updateEstado:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "El código ya existe",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado operativo",
      error: error.message,
    });
  }
};

/**
 * Eliminar un estado operativo (soft delete)
 * DELETE /api/v1/estados-operativo-recurso/:id
 */
export const deleteEstado = async (req, res) => {
  try {
    const { id } = req.params;

    const estado = await EstadoOperativoRecurso.findOne({
      where: { id, deleted_at: null },
    });

    if (!estado) {
      return res.status(404).json({
        success: false,
        message: "Estado operativo no encontrado",
      });
    }

    await estado.destroy({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Estado operativo eliminado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en deleteEstado:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el estado operativo",
      error: error.message,
    });
  }
};
