/**
 * File: src/controllers/tipoNovedadController.js
 * @version 1.1.0
 * @description Controlador para gestión de tipos de novedad (categorías principales)
 * 
 * Funcionalidades:
 * - CRUD completo con soft delete
 * - Reactivación de registros eliminados
 * - Listado de eliminados para recuperación
 * - Validación de dependencias con subtipos
 * - Auditoría completa
 * 
 * Endpoints:
 * - GET /api/v1/tipos-novedad - Listar tipos activos
 * - GET /api/v1/tipos-novedad/:id - Obtener por ID
 * - POST /api/v1/tipos-novedad - Crear nuevo tipo
 * - PUT /api/v1/tipos-novedad/:id - Actualizar existente
 * - DELETE /api/v1/tipos-novedad/:id - Soft delete
 * - PATCH /api/v1/tipos-novedad/:id/reactivar - Reactivar eliminado
 * - GET /api/v1/tipos-novedad/eliminadas - Listar eliminados
 * 
 * @module src/controllers/tipoNovedadController
 * @version 1.1.0
 * @date 2026-01-29
 */

import { TipoNovedad, SubtipoNovedad } from "../models/index.js";
import { Op } from "sequelize";

// LISTAR (GET /)
const getAll = async (req, res) => {
  try {
    const { estado, search } = req.query;

    const whereClause = { deleted_at: null };

    if (estado !== undefined) {
      whereClause.estado = estado === "true" || estado === "1";
    }

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { tipo_code: { [Op.like]: `%${search}%` } },
      ];
    }

    const items = await TipoNovedad.findAll({
      where: whereClause,
      order: [
        ["orden", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("❌ Error en tipoNovedadController.getAll:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos de novedad",
      error: error.message,
    });
  }
};

// OBTENER POR ID (GET /:id)
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await TipoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Tipo de novedad no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener tipo de novedad",
      error: error.message,
    });
  }
};

// CREAR (POST /)
const create = async (req, res) => {
  try {
    const { nombre, descripcion, tipo_code, color, icono, orden } = req.body;

    // Verificar código duplicado
    if (tipo_code) {
      const existente = await TipoNovedad.findOne({
        where: { tipo_code, deleted_at: null },
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un tipo de novedad con este código",
        });
      }
    }

    const nuevo = await TipoNovedad.create({
      nombre,
      descripcion,
      tipo_code,
      color,
      icono,
      orden,
      created_by: req.user.id,
      updated_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Tipo de novedad creado exitosamente",
      data: nuevo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear tipo de novedad",
      error: error.message,
    });
  }
};

// ACTUALIZAR (PUT /:id)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const item = await TipoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Tipo de novedad no encontrado",
      });
    }

    // Verificar código duplicado si cambió
    if (
      datosActualizacion.tipo_code &&
      datosActualizacion.tipo_code !== item.tipo_code
    ) {
      const existente = await TipoNovedad.findOne({
        where: {
          tipo_code: datosActualizacion.tipo_code,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro tipo de novedad con este código",
        });
      }
    }

    await item.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Tipo de novedad actualizado exitosamente",
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar tipo de novedad",
      error: error.message,
    });
  }
};

// ELIMINAR (DELETE /:id)
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await TipoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Tipo de novedad no encontrado",
      });
    }

    // Verificar si tiene subtipos asociados
    const { SubtipoNovedad } = await import("../models/index.js");
    const tieneSubtipos = await SubtipoNovedad.count({
      where: {
        tipo_novedad_id: id,
        deleted_at: null,
      },
    });

    if (tieneSubtipos > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar. Tiene subtipos de novedad asociados",
      });
    }

    await item.update({
      estado: false,
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Tipo de novedad eliminado exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar tipo de novedad",
      error: error.message,
    });
  }
};

/**
 * Obtener tipos de novedad eliminados (para reactivación)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const getEliminadas = async (req, res) => {
  try {
    const { search } = req.query;

    const whereClause = {
      deleted_at: { [Op.not]: null },
    };

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { tipo_code: { [Op.like]: `%${search}%` } },
      ];
    }

    const items = await TipoNovedad.findAll({
      where: whereClause,
      order: [
        ["deleted_at", "DESC"],
        ["nombre", "ASC"],
      ],
      paranoid: false, // Incluir eliminados
    });

    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error("❌ Error en tipoNovedadController.getEliminadas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos de novedad eliminados",
      error: error.message,
    });
  }
};

/**
 * Reactivar tipo de novedad eliminado
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const reactivar = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await TipoNovedad.findByPk(id, {
      paranoid: false, // Incluir eliminados
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Tipo de novedad no encontrado",
      });
    }

    if (!item.deleted_at) {
      return res.status(400).json({
        success: false,
        message: "El tipo de novedad no está eliminado",
      });
    }

    // Reactivar
    await item.update({
      estado: true,
      deleted_at: null,
      deleted_by: null,
      updated_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Tipo de novedad reactivado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("❌ Error en tipoNovedadController.reactivar:", error);
    res.status(500).json({
      success: false,
      message: "Error al reactivar tipo de novedad",
      error: error.message,
    });
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  getEliminadas,
  reactivar,
};
