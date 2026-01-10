/**
 * ===================================================
 * CONTROLLER: OperativosVehiculosNovedades
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2026-01-09
 *
 * Descripcion:
 * Gestiona las operaciones CRUD para las novedades asignadas a vehículos operativos en cuadrantes.
 *
 * Endpoints:
 * - GET /:operativoVehiculoCuadranteId/novedades: Obtener todas las novedades de un cuadrante de vehículo operativo.
 * - GET /:operativoVehiculoCuadranteId/novedades/:id: Obtener una novedad específica de un cuadrante de vehículo operativo.
 * - POST /:operativoVehiculoCuadranteId/novedades: Asignar una nueva novedad a un cuadrante de vehículo operativo.
 * - PUT /:operativoVehiculoCuadranteId/novedades/:id: Actualizar la información de una novedad en un cuadrante de vehículo operativo.
 * - DELETE /:operativoVehiculoCuadranteId/novedades/:id: Eliminar la asignación de una novedad de un cuadrante de vehículo operativo.
 */

import models from "../models/index.js";
const { OperativosVehiculosNovedades, OperativosVehiculosCuadrantes, Novedad } =
  models;

/**
 * Obtener todas las novedades asignadas a un cuadrante de vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllNovedadesByCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;

  try {
    const operativoVehiculoCuadrante =
      await OperativosVehiculosCuadrantes.findByPk(
        cuadranteId
      );
    if (!operativoVehiculoCuadrante) {
      return res.status(404).json({
        status: "error",
        message: "Cuadrante de vehículo operativo no encontrado",
      });
    }

    const novedades = await OperativosVehiculosNovedades.findAll({
      where: { operativo_vehiculo_cuadrante_id: cuadranteId },
      include: [
        {
          model: Novedad,
          as: "novedad",
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: novedades,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva asignación de novedad a un cuadrante de vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createNovedadInCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;
  const created_by = req.user?.id || req.user?.usuario_id;

  try {
    const operativoVehiculoCuadrante =
      await OperativosVehiculosCuadrantes.findByPk(
        cuadranteId
      );
    if (!operativoVehiculoCuadrante) {
      return res.status(404).json({
        status: "error",
        message: "Cuadrante de vehículo operativo no encontrado",
      });
    }

    const newNovedadAsignada = await OperativosVehiculosNovedades.create({
      ...req.body,
      operativo_vehiculo_cuadrante_id: cuadranteId,
      created_by,
    });

    res.status(201).json({
      status: "success",
      message:
        "Novedad asignada al cuadrante de vehículo operativo correctamente",
      data: newNovedadAsignada,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al asignar la novedad",
      error: error.message,
    });
  }
};

/**
 * Actualizar una asignación de novedad en un cuadrante de vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateNovedadInCuadrante = async (req, res) => {
  const { id } = req.params;
  const updated_by = req.user?.id || req.user?.usuario_id;

  try {
    const novedadAsignada = await OperativosVehiculosNovedades.findByPk(id);
    if (!novedadAsignada) {
      return res.status(404).json({
        status: "error",
        message: "Asignación de novedad no encontrada",
      });
    }

    await novedadAsignada.update({
      ...req.body,
      updated_by,
    });

    res.status(200).json({
      status: "success",
      message: "Asignación de novedad actualizada correctamente",
      data: novedadAsignada,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al actualizar la asignación",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una asignación de novedad de un cuadrante de vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteNovedadInCuadrante = async (req, res) => {
  const { id } = req.params;
  const deleted_by = req.user?.id || req.user?.usuario_id;

  try {
    const novedadAsignada = await OperativosVehiculosNovedades.findByPk(id);
    if (!novedadAsignada) {
      return res.status(404).json({
        status: "error",
        message: "Asignación de novedad no encontrada",
      });
    }

    await novedadAsignada.update({
      deleted_by,
      estado: 0  // Marcar como inactivo al eliminar
    });
    await novedadAsignada.destroy();

    res.status(200).json({
      status: "success",
      message: "Asignación de novedad eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al eliminar la asignación",
      error: error.message,
    });
  }
};
