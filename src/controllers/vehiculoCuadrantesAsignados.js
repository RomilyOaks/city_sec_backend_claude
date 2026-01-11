import models from "../models/index.js";
const { VehiculoCuadrantesAsignados, Vehiculo, Cuadrante, Usuario } = models;
import { Op } from "sequelize";

/**
 * Include para auditoría y relaciones de VehiculoCuadrantesAsignados
 */
const vehiculoCuadranteAsignadoInclude = [
  {
    model: Vehiculo,
    as: "vehiculo",
    attributes: ["id", "codigo_vehiculo", "placa", "marca", "modelo_vehiculo"],
  },
  {
    model: Cuadrante,
    as: "cuadrante",
    attributes: ["id", "cuadrante_code", "nombre"],
  },
  {
    model: Usuario,
    as: "creadoPor",
    attributes: ["id", "username", "email"],
  },
  {
    model: Usuario,
    as: "actualizadoPor",
    attributes: ["id", "username", "email"],
  },
  {
    model: Usuario,
    as: "eliminadoPor",
    attributes: ["id", "username", "email"],
  },
];

/**
 * Obtener todas las asignaciones de vehículos a cuadrantes
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllVehiculoCuadrantesAsignados = async (req, res) => {
  try {
    const { estado, vehiculo_id, cuadrante_id, search, page, limit } =
      req.query;

    const whereClause = {
      deleted_at: null,
    };

    if (estado !== undefined) {
      whereClause.estado = estado;
    }
    if (vehiculo_id) {
      whereClause.vehiculo_id = vehiculo_id;
    }
    if (cuadrante_id) {
      whereClause.cuadrante_id = cuadrante_id;
    }

    // Búsqueda por texto en observaciones
    if (search && search.trim().length > 0) {
      whereClause[Op.or] = [{ observaciones: { [Op.like]: `%${search}%` } }];
    }

    // Calcular paginación
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 15;
    const offset = (pageNumber - 1) * pageSize;

    // Contar total de registros
    const totalItems = await VehiculoCuadrantesAsignados.count({
      where: whereClause,
    });

    const asignaciones = await VehiculoCuadrantesAsignados.findAll({
      where: whereClause,
      include: vehiculoCuadranteAsignadoInclude,
      limit: pageSize,
      offset: offset,
      order: [["id", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        asignaciones: asignaciones,
        pagination: {
          current_page: pageNumber,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / pageSize),
          items_per_page: pageSize,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las asignaciones de vehículos a cuadrantes",
      error: error.message,
    });
  }
};

/**
 * Obtener una asignación de vehículo a cuadrante por ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getVehiculoCuadrantesAsignadosById = async (req, res) => {
  try {
    const { id } = req.params;
    const asignacion = await VehiculoCuadrantesAsignados.findOne({
      where: { id, deleted_at: null },
      include: vehiculoCuadranteAsignadoInclude,
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: asignacion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener la asignación",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva asignación de vehículo a cuadrante
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createVehiculoCuadrantesAsignados = async (req, res) => {
  try {
    const { vehiculo_id, cuadrante_id, observaciones } = req.body;
    const { id: created_by } = req.user;

    // Validar campos requeridos
    if (!vehiculo_id || !cuadrante_id) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: vehiculo_id, cuadrante_id",
      });
    }

    // Verificar si ya existe una asignación para el mismo vehículo y cuadrante
    const asignacionExistente = await VehiculoCuadrantesAsignados.findOne({
      where: { vehiculo_id, cuadrante_id, deleted_at: null },
    });

    if (asignacionExistente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una asignación para este vehículo y cuadrante",
      });
    }

    const newAsignacion = await VehiculoCuadrantesAsignados.create({
      vehiculo_id,
      cuadrante_id,
      observaciones,
      created_by,
      updated_by: created_by,
    });

    const asignacionCompleta = await VehiculoCuadrantesAsignados.findByPk(
      newAsignacion.id,
      {
        include: vehiculoCuadranteAsignadoInclude,
      }
    );

    res.status(201).json({
      success: true,
      message: "Asignación creada exitosamente",
      data: asignacionCompleta,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear la asignación",
      error: error.message,
    });
  }
};

/**
 * Actualizar una asignación de vehículo a cuadrante
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateVehiculoCuadrantesAsignados = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehiculo_id, cuadrante_id, observaciones, estado } = req.body;
    const { id: updated_by } = req.user;

    const asignacion = await VehiculoCuadrantesAsignados.findOne({
      where: { id, deleted_at: null },
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación no encontrada",
      });
    }

    // Verificar duplicidad si se cambian vehiculo_id o cuadrante_id
    if (
      (vehiculo_id && vehiculo_id !== asignacion.vehiculo_id) ||
      (cuadrante_id && cuadrante_id !== asignacion.cuadrante_id)
    ) {
      const existingDuplicate = await VehiculoCuadrantesAsignados.findOne({
        where: {
          vehiculo_id: vehiculo_id || asignacion.vehiculo_id,
          cuadrante_id: cuadrante_id || asignacion.cuadrante_id,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (existingDuplicate) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una asignación para este vehículo y cuadrante",
        });
      }
    }

    await asignacion.update({
      vehiculo_id: vehiculo_id || asignacion.vehiculo_id,
      cuadrante_id: cuadrante_id || asignacion.cuadrante_id,
      observaciones: observaciones || asignacion.observaciones,
      estado: estado !== undefined ? estado : asignacion.estado,
      updated_by,
    });

    const asignacionActualizada = await VehiculoCuadrantesAsignados.findByPk(
      id,
      {
        include: vehiculoCuadranteAsignadoInclude,
      }
    );

    res.status(200).json({
      success: true,
      message: "Asignación actualizada exitosamente",
      data: asignacionActualizada,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar la asignación",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una asignación de vehículo a cuadrante
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteVehiculoCuadrantesAsignados = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: deleted_by } = req.user;

    const asignacion = await VehiculoCuadrantesAsignados.findOne({
      where: { id, deleted_at: null },
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación no encontrada",
      });
    }

    await asignacion.update({
      estado: 0,
      deleted_by,
      deleted_at: new Date(),
    });
    await asignacion.destroy(); // Realiza el soft delete

    res.status(200).json({
      success: true,
      message: "Asignación eliminada exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar la asignación",
      error: error.message,
    });
  }
};

export default {
  getAllVehiculoCuadrantesAsignados,
  getVehiculoCuadrantesAsignadosById,
  createVehiculoCuadrantesAsignados,
  updateVehiculoCuadrantesAsignados,
  deleteVehiculoCuadrantesAsignados,
};
