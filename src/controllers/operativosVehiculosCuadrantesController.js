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
  
  // Verificar que el usuario existe en el request
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: "error",
      message: "Usuario no autenticado",
    });
  }
  
  const { id: created_by } = req.user;

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

    // Validar que el cuadrante exista
    if (req.body.cuadrante_id) {
      const { Cuadrante } = models;
      const cuadrante = await Cuadrante.findByPk(req.body.cuadrante_id);
      if (!cuadrante) {
        return res.status(404).json({
          status: "error",
          message: "Cuadrante no encontrado",
        });
      }
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
    console.error("Error en createCuadranteInVehiculo:", error);
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
    console.log("🐛 DEBUG: Iniciando updateCuadranteInVehiculo para ID:", id);
    console.log("🐛 DEBUG: Datos recibidos:", req.body);
    console.log("🐛 DEBUG: Usuario actualizando:", updated_by);

    const cuadranteAsignado = await OperativosVehiculosCuadrantes.findByPk(id);
    if (!cuadranteAsignado) {
      console.log("🐛 DEBUG: Asignación de cuadrante no encontrada");
      return res.status(404).json({
        status: "error",
        message: "Asignación de cuadrante no encontrada",
      });
    }

    console.log("🐛 DEBUG: Asignación encontrada, actualizando...");

    // Validar que si se cambia el cuadrante, exista
    if (req.body.cuadrante_id && req.body.cuadrante_id !== cuadranteAsignado.cuadrante_id) {
      const { Cuadrante } = models;
      const nuevoCuadrante = await Cuadrante.findByPk(req.body.cuadrante_id);
      if (!nuevoCuadrante) {
        return res.status(400).json({
          status: "error",
          message: "El cuadrante especificado no existe",
        });
      }
    }

    // Validar lógica de fechas
    if (req.body.hora_salida && req.body.hora_ingreso) {
      const horaIngreso = new Date(req.body.hora_ingreso);
      const horaSalida = new Date(req.body.hora_salida);
      
      if (horaSalida <= horaIngreso) {
        return res.status(400).json({
          status: "error",
          message: "La hora de salida debe ser posterior a la hora de ingreso",
        });
      }
    }

    const updateData = {
      ...req.body,
      updated_by,
    };

    console.log("🐛 DEBUG: Datos a actualizar:", updateData);

    await cuadranteAsignado.update(updateData);

    console.log("🐛 DEBUG: Actualización exitosa");

    // Recargar con los datos actualizados y relaciones
    const cuadranteActualizado = await OperativosVehiculosCuadrantes.findByPk(id, {
      include: [
        {
          model: Cuadrante,
          as: "datosCuadrante",
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Asignación de cuadrante actualizada correctamente",
      data: cuadranteActualizado,
    });
  } catch (error) {
    console.error("🐛 DEBUG: Error en updateCuadranteInVehiculo:");
    console.error("🐛 DEBUG: Error message:", error.message);
    console.error("🐛 DEBUG: Error name:", error.name);
    console.error("🐛 DEBUG: Error stack:", error.stack);

    // Manejar errores específicos de Sequelize
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: "error",
        message: "Ya existe una asignación para este vehículo, cuadrante y hora de ingreso",
        error: error.message,
      });
    }

    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        status: "error",
        message: "Error de validación",
        errors,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Error al actualizar la asignación",
      error: error.message,
      debug: {
        name: error.name,
        id: req.params.id,
        body: req.body,
      }
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
