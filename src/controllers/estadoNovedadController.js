/**
 * ===================================================
 * CONTROLADOR: Estados de Novedad
 * ===================================================
 *
 * Ruta: src/controllers/estadoNovedadController.js
 *
 * VERSIÓN: 1.0.3 (Validación previa de duplicados y estado inicial)
 * FECHA: 2025-12-15
 *
 * @module controllers/estadoNovedadController
 * @version 1.0.2
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
      color_hex,
      icono,
      orden,
      es_estado_inicial,
      es_estado_final,
      permite_edicion,
      requiere_unidad,
    } = req.body;

    // Validar nombre duplicado
    const nombreExistente = await EstadoNovedad.findOne({
      where: {
        nombre: nombre,
        deleted_at: null,
      },
    });

    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un estado con el nombre "${nombre}"`,
      });
    }

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

    // Manejar error de unique constraint de Sequelize (por si acaso)
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path || "campo";
      const value = error.errors[0]?.value || "";
      return res.status(400).json({
        success: false,
        message: `Ya existe un estado con este ${field}: "${value}"`,
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

    // Validar nombre duplicado si cambió
    if (
      datosActualizacion.nombre &&
      datosActualizacion.nombre !== item.nombre
    ) {
      const nombreExistente = await EstadoNovedad.findOne({
        where: {
          nombre: datosActualizacion.nombre,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: `Ya existe otro estado con el nombre "${datosActualizacion.nombre}"`,
        });
      }
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
    const camposActualizados = { ...datosActualizacion };

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

    // Manejar error de unique constraint de Sequelize
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path || "campo";
      const value = error.errors[0]?.value || "";
      return res.status(400).json({
        success: false,
        message: `Ya existe un estado con este ${field}: "${value}"`,
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
// OBTENER ESTADOS SIGUIENTES (GET /siguientes/:estadoActualId)
// ==========================================

/**
 * Obtener estados siguientes para dropdown
 * Solo devuelve estados con orden >= al estado actual
 * Útil para que el frontend muestre solo estados válidos para transición
 *
 * @param {number} estadoActualId - ID del estado actual de la novedad
 * @returns {Array} Lista de estados con orden >= al estado actual
 *
 * EJEMPLO:
 * Si estado actual es 2 (Despachado, orden=2), retorna estados con orden >= 2
 * Es decir: Despachado (2), En Atención (3), Resuelto (4), Cerrado (5), etc.
 */
const getSiguientes = async (req, res) => {
  try {
    const { estadoActualId } = req.params;

    // Obtener el estado actual para conocer su orden
    const estadoActual = await EstadoNovedad.findOne({
      where: { id: estadoActualId, deleted_at: null },
    });

    if (!estadoActual) {
      return res.status(404).json({
        success: false,
        message: "Estado actual no encontrado",
      });
    }

    // Obtener estados con orden >= al orden del estado actual
    const estadosSiguientes = await EstadoNovedad.findAll({
      where: {
        orden: { [Op.gte]: estadoActual.orden },
        estado: true,
        deleted_at: null,
      },
      order: [["orden", "ASC"]],
      attributes: ["id", "nombre", "color_hex", "icono", "orden", "es_final", "descripcion"],
    });

    res.status(200).json({
      success: true,
      message: "Estados siguientes obtenidos exitosamente",
      data: estadosSiguientes,
      estadoActual: {
        id: estadoActual.id,
        nombre: estadoActual.nombre,
        orden: estadoActual.orden,
      },
      info: {
        total: estadosSiguientes.length,
        descripcion: "Solo se muestran estados con orden >= al estado actual para garantizar transiciones válidas",
      },
    });
  } catch (error) {
    console.error("Error en getSiguientes estados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estados siguientes",
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
  getSiguientes,
};
