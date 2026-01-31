/**
 * ===================================================
 * CONTROLADOR: Subtipos de Novedad
 * ===================================================
 *
 * File: src/controllers/subtipoNovedadController.js
 * @version 1.1.0
 * @date 2026-01-29
 *
 * Descripción:
 * Controlador para gestión de subtipos de novedad (subcategorías).
 * Maneja CRUD completo con validaciones, soft delete y reactivación.
 * 
 * Funcionalidades:
 * - CRUD completo con soft delete
 * - Reactivación de registros eliminados
 * - Listado de eliminados para recuperación
 * - Validación de dependencias con novedades
 * - Auditoría completa
 * 
 * Endpoints:
 * - GET /api/v1/subtipos-novedad - Listar subtipos activos
 * - GET /api/v1/subtipos-novedad/:id - Obtener por ID
 * - POST /api/v1/subtipos-novedad - Crear nuevo subtipo
 * - PUT /api/v1/subtipos-novedad/:id - Actualizar existente
 * - DELETE /api/v1/subtipos-novedad/:id - Soft delete
 * - PATCH /api/v1/subtipos-novedad/:id/reactivar - Reactivar eliminado
 * - GET /api/v1/subtipos-novedad/eliminados - Listar eliminados
 *
 * @module controllers/subtipoNovedadController
 * @version 1.1.0
 */

import { SubtipoNovedad, TipoNovedad, Novedad } from "../models/index.js";
import { Op } from "sequelize";

// ==========================================
// LISTAR SUBTIPOS (GET /)
// ==========================================

const getAll = async (req, res) => {
  try {
    const { tipo_novedad_id, estado, search } = req.query;

    const whereClause = { deleted_at: null };

    // Filtro por estado
    if (estado !== undefined) {
      whereClause.estado = estado === "true" || estado === "1";
    }

    // Filtro por tipo de novedad
    if (tipo_novedad_id) {
      whereClause.tipo_novedad_id = tipo_novedad_id;
    }

    // Búsqueda por nombre o código
    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { subtipo_code: { [Op.like]: `%${search}%` } },
      ];
    }

    const items = await SubtipoNovedad.findAll({
      where: whereClause,
      include: [
        {
          model: TipoNovedad,
          as: "subtipoNovedadTipoNovedad",
          attributes: ["id", "nombre", "tipo_code"],
        },
      ],
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
    console.error("Error en getAll subtipos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener subtipos de novedad",
      error: error.message,
    });
  }
};

// ==========================================
// OBTENER POR ID (GET /:id)
// ==========================================

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await SubtipoNovedad.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: TipoNovedad,
          as: "subtipoNovedadTipoNovedad",
          attributes: ["id", "nombre", "tipo_code"],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Subtipo de novedad no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error en getById subtipo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener subtipo de novedad",
      error: error.message,
    });
  }
};

// ==========================================
// CREAR (POST /)
// ==========================================

const create = async (req, res) => {
  try {
    const {
      nombre,
      tipo_novedad_id,
      descripcion,
      subtipo_code,
      color_hex,
      icono,
      orden,
      prioridad,
      tiempo_respuesta_min,
      requiere_ambulancia,
      requiere_bomberos,
      requiere_pnp,
    } = req.body;

    const subtipoCodeNormalizado = subtipo_code
      ? String(subtipo_code).toUpperCase().trim()
      : null;

    // Validar que el tipo de novedad existe
    const tipoNovedad = await TipoNovedad.findOne({
      where: { id: tipo_novedad_id, estado: true, deleted_at: null },
    });

    if (!tipoNovedad) {
      return res.status(404).json({
        success: false,
        message: "Tipo de novedad no encontrado o inactivo",
      });
    }

    // Verificar código duplicado
    if (subtipoCodeNormalizado) {
      const existente = await SubtipoNovedad.findOne({
        where: { subtipo_code: subtipoCodeNormalizado, deleted_at: null },
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un subtipo de novedad con este código",
        });
      }
    }

    // Crear subtipo
    const nuevo = await SubtipoNovedad.create({
      nombre,
      tipo_novedad_id,
      descripcion,
      subtipo_code: subtipoCodeNormalizado,
      color_hex,
      icono,
      orden,
      prioridad,
      tiempo_respuesta_min,
      requiere_ambulancia,
      requiere_bomberos,
      requiere_pnp,
      created_by: req.user.id,
    });

    // Obtener subtipo completo con relación
    const subtipoCompleto = await SubtipoNovedad.findByPk(nuevo.id, {
      include: [
        {
          model: TipoNovedad,
          as: "subtipoNovedadTipoNovedad",
          attributes: ["id", "nombre", "tipo_code"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Subtipo de novedad creado exitosamente",
      data: subtipoCompleto,
    });
  } catch (error) {
    console.error("Error en create subtipo:", error);

    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message: "Código de Subtipo ya existe",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear subtipo de novedad",
      error: error.message,
    });
  }
};

// ==========================================
// ACTUALIZAR (PUT /:id)
// ==========================================

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    if (datosActualizacion?.subtipo_code) {
      datosActualizacion.subtipo_code = String(datosActualizacion.subtipo_code)
        .toUpperCase()
        .trim();
    }

    const item = await SubtipoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Subtipo de novedad no encontrado",
      });
    }

    // Validar tipo_novedad_id si se está actualizando
    if (datosActualizacion.tipo_novedad_id) {
      const tipoNovedad = await TipoNovedad.findOne({
        where: {
          id: datosActualizacion.tipo_novedad_id,
          estado: true,
          deleted_at: null,
        },
      });

      if (!tipoNovedad) {
        return res.status(404).json({
          success: false,
          message: "Tipo de novedad no encontrado o inactivo",
        });
      }
    }

    // Verificar código duplicado si cambió
    if (
      datosActualizacion.subtipo_code &&
      datosActualizacion.subtipo_code !== item.subtipo_code
    ) {
      const existente = await SubtipoNovedad.findOne({
        where: {
          subtipo_code: datosActualizacion.subtipo_code,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro subtipo de novedad con este código",
        });
      }
    }

    // Actualizar
    await item.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    // Obtener subtipo actualizado
    const subtipoActualizado = await SubtipoNovedad.findByPk(id, {
      include: [
        {
          model: TipoNovedad,
          as: "subtipoNovedadTipoNovedad",
          attributes: ["id", "nombre", "tipo_code"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Subtipo de novedad actualizado exitosamente",
      data: subtipoActualizado,
    });
  } catch (error) {
    console.error("Error en update subtipo:", error);

    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message: "Código de Subtipo ya existe",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar subtipo de novedad",
      error: error.message,
    });
  }
};

// ==========================================
// ELIMINAR (DELETE /:id)
// ==========================================

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await SubtipoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Subtipo de novedad no encontrado",
      });
    }

    // Verificar si tiene novedades asociadas
    const tieneNovedades = await Novedad.count({
      where: {
        subtipo_novedad_id: id,
        deleted_at: null,
      },
    });

    if (tieneNovedades > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar. Tiene novedades asociadas a este subtipo",
      });
    }

    // Soft delete
    await item.update({
      estado: false,
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Subtipo de novedad eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en remove subtipo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar subtipo de novedad",
      error: error.message,
    });
  }
};

/**
 * Obtener subtipos de novedad eliminados (para reactivación)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const getEliminados = async (req, res) => {
  try {
    const { tipo_novedad_id, search } = req.query;

    const whereClause = {
      deleted_at: { [Op.not]: null },
    };

    // Filtro por tipo de novedad
    if (tipo_novedad_id) {
      whereClause.tipo_novedad_id = tipo_novedad_id;
    }

    // Búsqueda por nombre o código
    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { subtipo_code: { [Op.like]: `%${search}%` } },
      ];
    }

    const items = await SubtipoNovedad.findAll({
      where: whereClause,
      include: [
        {
          model: TipoNovedad,
          as: "tipoNovedad",
          attributes: ["id", "nombre", "tipo_code"],
        },
      ],
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
    console.error("❌ Error en subtipoNovedadController.getEliminados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener subtipos de novedad eliminados",
      error: error.message,
    });
  }
};

/**
 * Reactivar subtipo de novedad eliminado
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const reactivar = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await SubtipoNovedad.findByPk(id, {
      include: [
        {
          model: TipoNovedad,
          as: "tipoNovedad",
          attributes: ["id", "nombre", "tipo_code"],
        },
      ],
      paranoid: false, // Incluir eliminados
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Subtipo de novedad no encontrado",
      });
    }

    if (!item.deleted_at) {
      return res.status(400).json({
        success: false,
        message: "El subtipo de novedad no está eliminado",
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
      message: "Subtipo de novedad reactivado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("❌ Error en subtipoNovedadController.reactivar:", error);
    res.status(500).json({
      success: false,
      message: "Error al reactivar subtipo de novedad",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTAR
// ==========================================

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  getEliminados,
  reactivar,
};
