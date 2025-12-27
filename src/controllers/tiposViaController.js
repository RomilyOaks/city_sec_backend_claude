/**
 * ============================================================================
 * ARCHIVO: src/controllers/tiposViaController.js
 * VERSIÓN: 2.3.0
 * DESCRIPCIÓN: Controlador para gestión de tipos de vía
 *              Maneja operaciones CRUD y consultas especiales
 * ============================================================================
 *
 * CAMBIOS v2.3.0:
 * - ✅ Implementado soft-delete completo con deleted_by
 * - ✅ Método eliminar ahora usa destroy() para paranoid
 * - ✅ Agregada captura de userId para auditoría
 * - ✅ TipoVia ahora sigue el mismo estándar que otras tablas
 *
 * CAMBIOS v2.2.3:
 * - ✅ Agregados console.log para debugging
 * - ✅ Logs en cada paso crítico
 * - ✅ Manejo de errores mejorado con stacktrace
 *
 * @author Claude AI
 * @date 2025-12-27
 * ============================================================================
 */

import TipoVia from "../models/TipoVia.js";
import Calle from "../models/Calle.js";
import { Op } from "sequelize";

/**
 * ============================================================================
 * FUNCIONES AUXILIARES
 * ============================================================================
 */

/**
 * Formatea la respuesta exitosa estándar
 */
const formatSuccessResponse = (
  data,
  message = "Operación exitosa",
  total = null
) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (total !== null) {
    response.total = total;
  }

  return response;
};

/**
 * Formatea la respuesta de error estándar
 */
const formatErrorResponse = (message, error = null) => {
  return {
    success: false,
    message,
    error: error?.message || null,
    stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
  };
};

/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL
 * ============================================================================
 */

const tiposViaController = {
  /**
   * Listar todos los tipos de vía con paginación
   */
  listarTodos: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", estado = null } = req.query;

      const offset = (page - 1) * limit;

      // Construir filtros
      const where = {};

      if (search) {
        where[Op.or] = [
          { codigo: { [Op.like]: `%${search}%` } },
          { nombre: { [Op.like]: `%${search}%` } },
          { abreviatura: { [Op.like]: `%${search}%` } },
        ];
      }

      if (estado !== null) {
        where.estado = parseInt(estado);
      }

      // Consultar BD
      const { count, rows } = await TipoVia.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ["orden", "ASC"],
          ["nombre", "ASC"],
        ],
      });

      return res.status(200).json({
        success: true,
        message: "Tipos de vía obtenidos exitosamente",
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("❌ Error al listar tipos de vía:", error);
      console.error("Stack trace:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      return res
        .status(500)
        .json(formatErrorResponse("Error al listar tipos de vía", error));
    }
  },

  /**
   * Listar solo tipos de vía activos (sin paginación)
   * Usado en selects/combos de formularios
   */
  listarActivos: async (req, res) => {
    try {
      let tiposActivos;

      // Si existe el método estático, usarlo
      if (typeof TipoVia.getActivos === "function") {
        tiposActivos = await TipoVia.getActivos();
      } else {
        // Fallback: consulta manual
        tiposActivos = await TipoVia.findAll({
          where: { estado: 1 },
          attributes: ["id", "codigo", "nombre", "abreviatura", "orden"],
          order: [
            ["orden", "ASC"],
            ["nombre", "ASC"],
          ],
        });
      }

      const response = formatSuccessResponse(
        tiposActivos,
        "Tipos de vía activos obtenidos exitosamente"
      );

      return res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error al listar tipos de vía activos:", error);
      console.error("Stack trace:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      if (error.sql) console.error("SQL:", error.sql);
      return res
        .status(500)
        .json(
          formatErrorResponse("Error al obtener tipos de vía activos", error)
        );
    }
  },

  /**
   * Obtener tipo de vía por ID
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;

      const tipoVia = await TipoVia.findByPk(id);

      if (!tipoVia) {
        return res
          .status(404)
          .json(formatErrorResponse("Tipo de vía no encontrado"));
      }

      // Contar calles asociadas
      const totalCalles = await Calle.count({
        where: { tipo_via_id: id, estado: 1 },
      });

      return res.status(200).json(
        formatSuccessResponse(
          {
            ...tipoVia.toJSON(),
            total_calles: totalCalles,
          },
          "Tipo de vía obtenido exitosamente"
        )
      );
    } catch (error) {
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener tipo de vía", error));
    }
  },

  /**
   * Crear nuevo tipo de vía
   */
  crear: async (req, res) => {
    try {
      const { codigo, nombre, abreviatura, descripcion, orden } = req.body;

      // Normalizar código a mayúsculas
      const codigoUpper = codigo.toUpperCase();

      // Verificar si ya existe
      const existente = await TipoVia.findOne({
        where: { codigo: codigoUpper },
      });

      if (existente) {
        return res
          .status(400)
          .json(formatErrorResponse("El código de tipo de vía ya existe"));
      }

      // Crear tipo de vía
      const nuevoTipoVia = await TipoVia.create({
        codigo: codigoUpper,
        nombre,
        abreviatura,
        descripcion,
        orden: orden || 999,
        estado: 1,
      });

      return res
        .status(201)
        .json(
          formatSuccessResponse(nuevoTipoVia, "Tipo de vía creado exitosamente")
        );
    } catch (error) {
      return res
        .status(500)
        .json(formatErrorResponse("Error al crear tipo de vía", error));
    }
  },

  /**
   * Actualizar tipo de vía
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;

      const tipoVia = await TipoVia.findByPk(id);

      if (!tipoVia) {
        return res
          .status(404)
          .json(formatErrorResponse("Tipo de vía no encontrado"));
      }

      // Si se actualiza el código, verificar que no exista
      if (req.body.codigo) {
        const codigoUpper = req.body.codigo.toUpperCase();
        const existente = await TipoVia.findOne({
          where: {
            codigo: codigoUpper,
            id: { [Op.ne]: id },
          },
        });

        if (existente) {
          return res
            .status(400)
            .json(formatErrorResponse("El código ya está en uso"));
        }

        req.body.codigo = codigoUpper;
      }

      await tipoVia.update(req.body);

      return res
        .status(200)
        .json(
          formatSuccessResponse(tipoVia, "Tipo de vía actualizado exitosamente")
        );
    } catch (error) {
      return res
        .status(500)
        .json(formatErrorResponse("Error al actualizar tipo de vía", error));
    }
  },

  /**
   * Eliminar tipo de vía (soft delete)
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const tipoVia = await TipoVia.findByPk(id);

      if (!tipoVia) {
        return res
          .status(404)
          .json(formatErrorResponse("Tipo de vía no encontrado"));
      }

      // Verificar si tiene calles asociadas
      const callesAsociadas = await Calle.count({
        where: { tipo_via_id: id, estado: 1 },
      });

      if (callesAsociadas > 0) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              `No se puede eliminar. Tiene ${callesAsociadas} calles asociadas.`
            )
          );
      }

      // Soft delete: cambiar estado a 0, deleted_by y deleted_at
      await tipoVia.update({
        estado: 0,
        deleted_by: userId,
      });

      // Llamar destroy() para establecer deleted_at
      await tipoVia.destroy();

      return res
        .status(200)
        .json(
          formatSuccessResponse(null, "Tipo de vía eliminado exitosamente")
        );
    } catch (error) {
      return res
        .status(500)
        .json(formatErrorResponse("Error al eliminar tipo de vía", error));
    }
  },

  /**
   * Activar tipo de vía
   */
  activar: async (req, res) => {
    try {
      const { id } = req.params;

      const tipoVia = await TipoVia.findByPk(id);

      if (!tipoVia) {
        return res
          .status(404)
          .json(formatErrorResponse("Tipo de vía no encontrado"));
      }

      await tipoVia.update({ estado: 1 });

      return res
        .status(200)
        .json(
          formatSuccessResponse(tipoVia, "Tipo de vía activado exitosamente")
        );
    } catch (error) {
      return res
        .status(500)
        .json(formatErrorResponse("Error al activar tipo de vía", error));
    }
  },

  /**
   * Desactivar tipo de vía
   */
  desactivar: async (req, res) => {
    try {
      const { id } = req.params;

      const tipoVia = await TipoVia.findByPk(id);

      if (!tipoVia) {
        return res
          .status(404)
          .json(formatErrorResponse("Tipo de vía no encontrado"));
      }

      // Verificar calles activas
      const callesActivas = await Calle.count({
        where: { tipo_via_id: id, estado: 1 },
      });

      if (callesActivas > 0) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              `No se puede desactivar. Tiene ${callesActivas} calles activas.`
            )
          );
      }

      await tipoVia.update({ estado: 0 });

      return res
        .status(200)
        .json(
          formatSuccessResponse(tipoVia, "Tipo de vía desactivado exitosamente")
        );
    } catch (error) {
      return res
        .status(500)
        .json(formatErrorResponse("Error al desactivar tipo de vía", error));
    }
  },
};

export default tiposViaController;
