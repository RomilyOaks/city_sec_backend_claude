/**
 * ===================================================
 * CONTROLADOR: Estados de Novedad
 * ===================================================
 *
 * Ruta: src/controllers/estadoNovedadController.js
 *
 * VERSIÓN: 1.0.1
 * FECHA: 2025-12-14
 *
 * Descripción:
 * Controlador para gestión de estados del workflow de novedades.
 * Maneja CRUD completo con validaciones especiales para estado inicial.
 *
 * @module controllers/estadoNovedadController
 * @version 1.0.0
 */

import { EstadoNovedad } from "../models/index.js";
import { Op } from "sequelize";

// ==========================================
// LISTAR ESTADOS (GET /)
// ==========================================

const getAll = async (req, res) => {
  try {
    const { estado, es_estado_final, search } = req.query;

    const whereClause = { deleted_at: null };

    // Filtro por estado activo/inactivo
    if (estado !== undefined) {
      whereClause.estado = estado === "true" || estado === "1";
    }

    // Filtro por estados finales
    if (es_estado_final !== undefined) {
      whereClause.es_final = es_estado_final === "true";
    }

    // Búsqueda por nombre
    if (search) {
      whereClause.nombre = { [Op.like]: `%${search}%` };
    }

    const items = await EstadoNovedad.findAll({
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
    console.error("Error en getAll estados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estados de novedad",
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

    const item = await EstadoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Estado de novedad no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error en getById estado:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estado de novedad",
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
      descripcion,
      estado_code,
      color_hex,
      icono,
      orden,
      es_estado_inicial,
      es_estado_final,
      permite_edicion,
      requiere_unidad,
    } = req.body;

    // Validar que solo haya un estado inicial
    if (es_estado_inicial) {
      const estadoInicialExistente = await EstadoNovedad.findOne({
        where: {
          es_inicial: true,
          estado: true,
          deleted_at: null,
        },
      });

      if (estadoInicialExistente) {
        return res.status(400).json({
          success: false,
          message:
            "Ya existe un estado inicial en el sistema. Solo puede haber uno.",
        });
      }
    }

    // Crear estado
    const nuevo = await EstadoNovedad.create({
      nombre,
      descripcion,
      estado_code,
      color_hex,
      icono,
      orden,
      es_inicial: es_estado_inicial || false,
      es_final: es_estado_final || false,
      permite_edicion: permite_edicion !== undefined ? permite_edicion : true,
      requiere_unidad: requiere_unidad || false,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Estado de novedad creado exitosamente",
      data: nuevo,
    });
  } catch (error) {
    console.error("Error en create estado:", error);

    // Manejar error de hook (estado inicial duplicado)
    if (error.message && error.message.includes("estado inicial")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear estado de novedad",
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

    const item = await EstadoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Estado de novedad no encontrado",
      });
    }

    // Validar estado inicial único si se está cambiando
    if (datosActualizacion.es_estado_inicial && !item.es_inicial) {
      const estadoInicialExistente = await EstadoNovedad.findOne({
        where: {
          es_inicial: true,
          estado: true,
          deleted_at: null,
          id: { [Op.ne]: id },
        },
      });

      if (estadoInicialExistente) {
        return res.status(400).json({
          success: false,
          message:
            "Ya existe un estado inicial. Solo puede haber uno en el sistema.",
        });
      }
    }

    // Mapear campos del body a campos del modelo
    const camposActualizados = {
      ...datosActualizacion,
    };

    // Mapear es_estado_inicial a es_inicial
    if (datosActualizacion.es_estado_inicial !== undefined) {
      camposActualizados.es_inicial = datosActualizacion.es_estado_inicial;
      delete camposActualizados.es_estado_inicial;
    }

    // Mapear es_estado_final a es_final
    if (datosActualizacion.es_estado_final !== undefined) {
      camposActualizados.es_final = datosActualizacion.es_estado_final;
      delete camposActualizados.es_estado_final;
    }

    // Actualizar
    await item.update({
      ...camposActualizados,
      updated_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Estado de novedad actualizado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("Error en update estado:", error);

    // Manejar error de hook (estado inicial duplicado)
    if (error.message && error.message.includes("estado inicial")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar estado de novedad",
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

    const item = await EstadoNovedad.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Estado de novedad no encontrado",
      });
    }

    // No permitir eliminar el estado inicial
    if (item.es_inicial) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar el estado inicial del sistema",
      });
    }

    // Verificar si tiene novedades asociadas
    const { Novedad } = await import("../models/index.js");
    const tieneNovedades = await Novedad.count({
      where: {
        estado_novedad_id: id,
        deleted_at: null,
      },
    });

    if (tieneNovedades > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar. Tiene novedades asociadas a este estado",
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
      message: "Estado de novedad eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en remove estado:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar estado de novedad",
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
};
