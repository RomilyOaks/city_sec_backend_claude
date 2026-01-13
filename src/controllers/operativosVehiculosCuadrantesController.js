/**
 * ===================================================
 * CONTROLLER: OperativosVehiculosCuadrantes
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2024-07-12
 *
 * Descripcion:
 * Gestiona las operaciones CRUD para los cuadrantes asignados a vehículos operativos.
 *
 * Endpoints:
 * - GET /:operativoVehiculoId/cuadrantes: Obtener todos los cuadrantes de un vehículo operativo.
 * - GET /:operativoVehiculoId/cuadrantes/:id: Obtener un cuadrante específico de un vehículo operativo.
 * - POST /:operativoVehiculoId/cuadrantes: Asignar un nuevo cuadrante a un vehículo operativo.
 * - PUT /:operativoVehiculoId/cuadrantes/:id: Actualizar la información de un cuadrante en un vehículo operativo.
 * - DELETE /:operativoVehiculoId/cuadrantes/:id: Eliminar la asignación de un cuadrante de un vehículo operativo.
 */

import models from "../models/index.js";
const { OperativosVehiculosCuadrantes, OperativosVehiculos, Cuadrante } =
  models;

/**
 * Obtener todos los cuadrantes asignados a un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllCuadrantesByVehiculo = async (req, res) => {
  const { vehiculoId } = req.params;

  try {
    const operativoVehiculo = await OperativosVehiculos.findByPk(
      vehiculoId
    );
    if (!operativoVehiculo) {
      return res.status(404).json({
        status: "error",
        message: "Vehículo operativo no encontrado",
      });
    }

    const cuadrantes = await OperativosVehiculosCuadrantes.findAll({
      where: { operativo_vehiculo_id: vehiculoId },
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: cuadrantes,
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
 * Crear una nueva asignación de cuadrante a un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createCuadranteInVehiculo = async (req, res) => {
  const { vehiculoId } = req.params;
  const { created_by } = req.user; // Asumiendo que el usuario está en req.user

  try {
    const operativoVehiculo = await OperativosVehiculos.findByPk(
      vehiculoId
    );
    if (!operativoVehiculo) {
      return res.status(404).json({
        status: "error",
        message: "Vehículo operativo no encontrado",
      });
    }

    const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create({
      ...req.body,
      operativo_vehiculo_id: vehiculoId,
      created_by,
    });

    res.status(201).json({
      status: "success",
      message: "Cuadrante asignado al vehículo operativo correctamente",
      data: newCuadranteAsignado,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al asignar el cuadrante",
      error: error.message,
    });
  }
};

/**
 * Actualizar una asignación de cuadrante en un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateCuadranteInVehiculo = async (req, res) => {
  const { id } = req.params;
  const { updated_by } = req.user;

  try {
    const cuadranteAsignado = await OperativosVehiculosCuadrantes.findByPk(id);
    if (!cuadranteAsignado) {
      return res.status(404).json({
        status: "error",
        message: "Asignación de cuadrante no encontrada",
      });
    }

    await cuadranteAsignado.update({
      ...req.body,
      updated_by,
    });

    res.status(200).json({
      status: "success",
      message: "Asignación de cuadrante actualizada correctamente",
      data: cuadranteAsignado,
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
 * Eliminar (soft delete) una asignación de cuadrante de un vehículo operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteCuadranteInVehiculo = async (req, res) => {
  const { id } = req.params;
  const { deleted_by } = req.user;

  try {
    const cuadranteAsignado = await OperativosVehiculosCuadrantes.findByPk(id);
    if (!cuadranteAsignado) {
      return res.status(404).json({
        status: "error",
        message: "Asignación de cuadrante no encontrada",
      });
    }

    await cuadranteAsignado.update({ deleted_by });
    await cuadranteAsignado.destroy();

    res.status(200).json({
      status: "success",
      message: "Asignación de cuadrante eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al eliminar la asignación",
      error: error.message,
    });
  }
};
