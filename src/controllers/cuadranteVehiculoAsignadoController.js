/**
 * File: src/controllers/cuadranteVehiculoAsignadoController.js
 * @version 1.0.0
 * @description Controlador para gestión de asignaciones de vehículos a cuadrantes
 *
 * Funcionalidades:
 * - CRUD completo de asignaciones
 * - Reactivación de soft-deletes
 * - Validación de unique constraint
 * - Manejo de relaciones y auditoría
 *
 * @module src/controllers/cuadranteVehiculoAsignadoController.js
 */

import { Op } from "sequelize";
import CuadranteVehiculoAsignado from "../models/CuadranteVehiculoAsignado.js";
import Cuadrante from "../models/Cuadrante.js";
import Vehiculo from "../models/Vehiculo.js";
import Usuario from "../models/Usuario.js";

/**
 * Obtener todas las asignaciones con paginación y filtros
 */
export const getAllAsignaciones = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      estado = "",
      cuadrante_id = "",
      vehiculo_id = "",
      sort = "created_at",
      order = "DESC",
    } = req.query;

    // Construir where clause
    const whereClause = {
      deleted_at: null,
    };

    if (estado !== "") {
      if (estado === "true") {
        // Activos: estado = 1 y no eliminados
        whereClause.estado = 1;
        whereClause.deleted_at = null;
      } else {
        // Eliminados: soft-deleted (deleted_at no es null)
        whereClause.deleted_at = { [Op.not]: null };
      }
    } else {
      // Por defecto, solo mostrar no eliminados
      whereClause.deleted_at = null;
    }

    if (cuadrante_id) {
      whereClause.cuadrante_id = cuadrante_id;
    }

    if (vehiculo_id) {
      whereClause.vehiculo_id = vehiculo_id;
    }

    // Búsqueda por observaciones o datos relacionados
    if (search) {
      whereClause[Op.or] = [
        { observaciones: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const sortFields = [
      "id",
      "cuadrante_id",
      "vehiculo_id",
      "created_at",
      "updated_at",
      "estado",
    ];
    const orderField = sortFields.includes(sort) ? sort : "created_at";
    const orderDir = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { count, rows } = await CuadranteVehiculoAsignado.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "placa", "marca", "modelo_vehiculo"],
        },
        {
          model: Usuario,
          as: "creadorAsignacion",
          attributes: ["id", "username", "nombres", "apellidos"],
        },
        {
          model: Usuario,
          as: "actualizadorAsignacion",
          attributes: ["id", "username", "nombres", "apellidos"],
        },
      ],
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Asignaciones obtenidas exitosamente",
      data: {
        asignaciones: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          total: count,
          hasNext: page * limit < count,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error en getAllAsignaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las asignaciones",
      error: error.message,
    });
  }
};

/**
 * Obtener asignación por ID
 */
export const getAsignacionById = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await CuadranteVehiculoAsignado.findByPk(id, {
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "placa", "marca", "modelo_vehiculo"],
        },
        {
          model: Usuario,
          as: "creadorAsignacion",
          attributes: ["id", "username", "nombres", "apellidos"],
        },
        {
          model: Usuario,
          as: "actualizadorAsignacion",
          attributes: ["id", "username", "nombres", "apellidos"],
        },
      ],
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asignación obtenida exitosamente",
      data: asignacion,
    });
  } catch (error) {
    console.error("Error en getAsignacionById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la asignación",
      error: error.message,
    });
  }
};

/**
 * Crear nueva asignación
 */
export const createAsignacion = async (req, res) => {
  try {
    const {
      cuadrante_id,
      vehiculo_id,
      observaciones,
      estado = 1,
    } = req.body;

    // Validar que existan cuadrante y vehículo
    const cuadrante = await Cuadrante.findByPk(cuadrante_id);
    if (!cuadrante) {
      return res.status(400).json({
        success: false,
        message: "El cuadrante especificado no existe",
        code: "CUADRANTE_NOT_FOUND",
      });
    }

    const vehiculo = await Vehiculo.findByPk(vehiculo_id);
    if (!vehiculo) {
      return res.status(400).json({
        success: false,
        message: "El vehículo especificado no existe",
        code: "VEHICULO_NOT_FOUND",
      });
    }

    // Verificar unique constraint
    const existeAsignacion = await CuadranteVehiculoAsignado.existeAsignacion(
      cuadrante_id,
      vehiculo_id
    );

    if (existeAsignacion) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una asignación para este cuadrante y vehículo",
        code: "DUPLICATE_ASSIGNMENT",
      });
    }

    // Crear asignación
    const nuevaAsignacion = await CuadranteVehiculoAsignado.create({
      cuadrante_id,
      vehiculo_id,
      observaciones: observaciones || null,
      estado: estado ? 1 : 0,
      created_by: req.user.id,
    });

    // Obtener asignación con relaciones
    const asignacionCompleta = await CuadranteVehiculoAsignado.findByPk(
      nuevaAsignacion.id,
      {
        include: [
          {
            model: Cuadrante,
            as: "cuadrante",
            attributes: ["id", "nombre", "cuadrante_code"],
          },
          {
            model: Vehiculo,
            as: "vehiculo",
            attributes: ["id", "placa", "marca", "modelo_vehiculo"],
          },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Asignación creada exitosamente",
      data: asignacionCompleta,
    });
  } catch (error) {
    console.error("Error en createAsignacion:", error);
    
    // Manejar errores de validación
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors,
      });
    }

    // Manejar error de constraint
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Ya existe una asignación para este cuadrante y vehículo",
        code: "DUPLICATE_ASSIGNMENT",
      });
    }

    // Error de foreign key
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Error de referencia: El ID proporcionado no existe",
        code: "FOREIGN_KEY_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear la asignación",
      error: error.message,
    });
  }
};

/**
 * Actualizar asignación existente
 */
export const updateAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cuadrante_id,
      vehiculo_id,
      observaciones,
      estado,
    } = req.body;

    // Buscar asignación existente
    const asignacion = await CuadranteVehiculoAsignado.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación no encontrada",
      });
    }

    // Verificar unique constraint si se cambian cuadrante o vehículo
    if (
      cuadrante_id !== asignacion.cuadrante_id ||
      vehiculo_id !== asignacion.vehiculo_id
    ) {
      const existeAsignacion = await CuadranteVehiculoAsignado.existeAsignacion(
        cuadrante_id,
        vehiculo_id,
        id
      );

      if (existeAsignacion) {
        return res.status(409).json({
          success: false,
          message: "Ya existe una asignación para este cuadrante y vehículo",
          code: "DUPLICATE_ASSIGNMENT",
        });
      }
    }

    // Validar que existan cuadrante y vehículo si se proporcionan
    if (cuadrante_id) {
      const cuadrante = await Cuadrante.findByPk(cuadrante_id);
      if (!cuadrante) {
        return res.status(400).json({
          success: false,
          message: "El cuadrante especificado no existe",
          code: "CUADRANTE_NOT_FOUND",
        });
      }
    }

    if (vehiculo_id) {
      const vehiculo = await Vehiculo.findByPk(vehiculo_id);
      if (!vehiculo) {
        return res.status(400).json({
          success: false,
          message: "El vehículo especificado no existe",
          code: "VEHICULO_NOT_FOUND",
        });
      }
    }

    // Actualizar asignación
    await asignacion.update({
      cuadrante_id: cuadrante_id || asignacion.cuadrante_id,
      vehiculo_id: vehiculo_id || asignacion.vehiculo_id,
      observaciones: observaciones !== undefined ? observaciones : asignacion.observaciones,
      estado: estado !== undefined ? (estado ? 1 : 0) : asignacion.estado,
      updated_by: req.user.id,
    });

    // Obtener asignación actualizada con relaciones
    const asignacionActualizada = await CuadranteVehiculoAsignado.findByPk(id, {
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "placa", "marca", "modelo_vehiculo"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Asignación actualizada exitosamente",
      data: asignacionActualizada,
    });
  } catch (error) {
    console.error("Error en updateAsignacion:", error);
    
    // Manejar errores de validación
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar la asignación",
      error: error.message,
    });
  }
};

/**
 * Eliminar asignación (soft delete)
 */
export const deleteAsignacion = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await CuadranteVehiculoAsignado.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación no encontrada",
      });
    }

    await asignacion.softDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: "Asignación eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteAsignacion:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la asignación",
      error: error.message,
    });
  }
};

/**
 * Reactivar asignación (restaurar soft delete)
 */
export const reactivarAsignacion = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await CuadranteVehiculoAsignado.findOne({
      where: {
        id,
        deleted_at: { [Op.not]: null },
      },
      paranoid: false,
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación eliminada no encontrada",
      });
    }

    await asignacion.reactivar(req.user.id);

    // Obtener asignación reactivada con relaciones
    const asignacionReactivada = await CuadranteVehiculoAsignado.findByPk(id, {
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "placa", "marca", "modelo_vehiculo"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Asignación reactivada exitosamente",
      data: asignacionReactivada,
    });
  } catch (error) {
    console.error("Error en reactivarAsignacion:", error);
    res.status(500).json({
      success: false,
      message: "Error al reactivar la asignación",
      error: error.message,
    });
  }
};

/**
 * Activar/Desactivar asignación
 */
export const toggleEstadoAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const asignacion = await CuadranteVehiculoAsignado.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación no encontrada",
      });
    }

    if (estado) {
      await asignacion.activar(req.user.id);
    } else {
      await asignacion.desactivar(req.user.id);
    }

    // Obtener asignación actualizada
    const asignacionActualizada = await CuadranteVehiculoAsignado.findByPk(id, {
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "placa", "marca", "modelo_vehiculo"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Asignación ${estado ? "activada" : "desactivada"} exitosamente`,
      data: asignacionActualizada,
    });
  } catch (error) {
    console.error("Error en toggleEstadoAsignacion:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar el estado de la asignación",
      error: error.message,
    });
  }
};

/**
 * Obtener asignaciones eliminadas (para reactivación)
 */
export const getAsignacionesEliminadas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sort = "deleted_at",
      order = "DESC",
    } = req.query;

    const whereClause = {
      deleted_at: { [Op.not]: null },
    };

    if (search) {
      whereClause[Op.or] = [
        { observaciones: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await CuadranteVehiculoAsignado.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "placa", "marca", "modelo_vehiculo"],
        },
        {
          model: Usuario,
          as: "eliminadorAsignacion",
          attributes: ["id", "username", "nombres", "apellidos"],
        },
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      paranoid: false,
    });

    res.status(200).json({
      success: true,
      message: "Asignaciones eliminadas obtenidas exitosamente",
      data: {
        asignaciones: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          total: count,
          hasNext: page * limit < count,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error en getAsignacionesEliminadas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las asignaciones eliminadas",
      error: error.message,
    });
  }
};
