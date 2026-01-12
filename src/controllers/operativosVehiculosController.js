/**
 * ===================================================
 * CONTROLLER: OperativosVehiculos
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2024-07-12
 *
 * Descripcion:
 * Gestiona las operaciones CRUD para los vehículos asignados a los turnos operativos.
 *
 * Endpoints:
 * - GET /:turnoId/vehiculos: Obtener todos los vehículos de un turno.
 * - GET /:turnoId/vehiculos/:id: Obtener un vehículo específico de un turno.
 * - POST /:turnoId/vehiculos: Asignar un nuevo vehículo a un turno.
 * - PUT /:turnoId/vehiculos/:id: Actualizar la información de un vehículo en un turno.
 * - DELETE /:turnoId/vehiculos/:id: Eliminar la asignación de un vehículo de un turno.
 */

import models from "../models/index.js";
const {
  OperativosVehiculos,
  OperativosTurno,
  Vehiculo,
  PersonalSeguridad,
  OperativosVehiculosCuadrantes,
  Cuadrante,
  Usuario,
} = models;
import { Op } from "sequelize";

/**
 * Obtener todos los vehículos operativos con filtros y paginación
 * GET /api/v1/operativos-vehiculos
 */
export const getAllVehiculos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      turno_id,
      vehiculo_id,
      conductor_id,
      copiloto_id,
      estado_operativo_id,
      fecha_inicio,
      fecha_fin,
      sort = "hora_inicio",
      order = "DESC",
    } = req.query;

    const whereClause = {
      deleted_at: null,
      estado_registro: 1,
    };

    // Filtros específicos
    if (turno_id) whereClause.operativo_turno_id = turno_id;
    if (vehiculo_id) whereClause.vehiculo_id = vehiculo_id;
    if (conductor_id) whereClause.conductor_id = conductor_id;
    if (copiloto_id) whereClause.copiloto_id = copiloto_id;
    if (estado_operativo_id) whereClause.estado_operativo_id = estado_operativo_id;

    // Búsqueda por texto en placa de vehículo O nombre de conductor O copiloto
    if (search) {
      whereClause[Op.or] = [
        { "$vehiculo.placa$": { [Op.like]: `%${search}%` } },
        { "$vehiculo.marca$": { [Op.like]: `%${search}%` } },
        { "$conductor.nombres$": { [Op.like]: `%${search}%` } },
        { "$conductor.apellido_paterno$": { [Op.like]: `%${search}%` } },
        { "$conductor.apellido_materno$": { [Op.like]: `%${search}%` } },
        { "$copiloto.nombres$": { [Op.like]: `%${search}%` } },
        { "$copiloto.apellido_paterno$": { [Op.like]: `%${search}%` } },
        { "$copiloto.apellido_materno$": { [Op.like]: `%${search}%` } },
      ];
    }

    // Filtro por rango de fechas usando hora_inicio
    if (fecha_inicio && fecha_fin) {
      whereClause.hora_inicio = {
        [Op.between]: [fecha_inicio, fecha_fin],
      };
    } else if (fecha_inicio) {
      whereClause.hora_inicio = { [Op.gte]: fecha_inicio };
    } else if (fecha_fin) {
      whereClause.hora_inicio = { [Op.lte]: fecha_fin };
    }

    const offset = (page - 1) * limit;
    const orderField = sort;
    const orderDir = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const includeOptions = [
      {
        model: Vehiculo,
        as: "vehiculo",
        attributes: [
          "id",
          "placa",
          "marca",
          "modelo_vehiculo",
          "anio_vehiculo",
          "codigo_vehiculo",
          "color_vehiculo",
          "estado_operativo",
        ],
        required: false,
      },
      {
        model: PersonalSeguridad,
        as: "conductor",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        required: false,
      },
      {
        model: PersonalSeguridad,
        as: "copiloto",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        required: false,
      },
      {
        model: OperativosTurno,
        as: "turno",
        attributes: ["id", "fecha", "turno", "estado"],
        required: false,
      },
      {
        model: Usuario,
        as: "creador",
        attributes: ["id", "username", "nombres", "apellidos"],
        required: false,
      },
      {
        model: Usuario,
        as: "actualizador",
        attributes: ["id", "username", "nombres", "apellidos"],
        required: false,
      },
      {
        model: Usuario,
        as: "eliminador",
        attributes: ["id", "username", "nombres", "apellidos"],
        required: false,
      },
    ];

    const { count, rows } = await OperativosVehiculos.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    res.status(200).json({
      success: true,
      message: "Vehículos operativos obtenidos exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error en getAllVehiculos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los vehículos operativos",
      error: error.message,
    });
  }
};

/**
 * Obtener todos los vehículos asignados a un turno operativo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllVehiculosByTurno = async (req, res) => {
  const { turnoId } = req.params;

  try {
    const turno = await OperativosTurno.findByPk(turnoId);
    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    const vehiculos = await OperativosVehiculos.findAll({
      where: {
        operativo_turno_id: turnoId,
        deleted_at: null,
        estado_registro: 1,
      },
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: [
            "id",
            "placa",
            "marca",
            "modelo_vehiculo",
            "anio_vehiculo",
            "codigo_vehiculo",
            "color_vehiculo",
            "estado_operativo",
          ],
        },
        {
          model: PersonalSeguridad,
          as: "conductor",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: PersonalSeguridad,
          as: "copiloto",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "username", "nombres", "apellidos"],
          required: false,
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "username", "nombres", "apellidos"],
          required: false,
        },
        {
          model: Usuario,
          as: "eliminador",
          attributes: ["id", "username", "nombres", "apellidos"],
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Vehículos del turno obtenidos exitosamente",
      data: vehiculos,
    });
  } catch (error) {
    console.error("❌ Error en getAllVehiculosByTurno:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva asignación de vehículo a un turno
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createVehiculoInTurno = async (req, res) => {
  const { turnoId } = req.params;
  const { id: created_by } = req.user;

  try {
    const turno = await OperativosTurno.findByPk(turnoId);
    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    // Validar que el vehículo no esté ya asignado al turno (solo registros activos)
    if (req.body.vehiculo_id) {
      const vehiculoExistente = await OperativosVehiculos.findOne({
        where: {
          operativo_turno_id: turnoId,
          vehiculo_id: req.body.vehiculo_id,
          estado_registro: 1,
          deleted_at: null,
        },
      });

      if (vehiculoExistente) {
        return res.status(400).json({
          success: false,
          message: "Vehículo ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }
    }

    // Validar que el conductor no esté ya asignado a otro vehículo en el turno (solo registros activos)
    if (req.body.conductor_id) {
      const conductorExistente = await OperativosVehiculos.findOne({
        where: {
          operativo_turno_id: turnoId,
          conductor_id: req.body.conductor_id,
          estado_registro: 1,
          deleted_at: null,
        },
      });

      if (conductorExistente) {
        return res.status(400).json({
          success: false,
          message: "Conductor ya fue asignado a otro vehículo en el mismo sector, turno y fecha de los Operativos",
        });
      }
    }

    const newVehiculoAsignado = await OperativosVehiculos.create({
      ...req.body,
      operativo_turno_id: turnoId,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: "Vehículo asignado al turno correctamente",
      data: newVehiculoAsignado,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      // Detectar el tipo de constraint violado
      const constraintName = error.parent?.constraint;
      const fields = error.fields || {};

      // Mensajes específicos según el constraint
      if (constraintName === "uq_turno_conductor" || fields.conductor_id) {
        return res.status(400).json({
          success: false,
          message: "Conductor ya fue asignado a otro vehículo en el mismo sector, turno y fecha de los Operativos",
        });
      }

      if (
        constraintName === "no_turno_vehiculo" ||
        (typeof constraintName === "string" && constraintName.includes("turno_vehiculo")) ||
        fields.vehiculo_id
      ) {
        return res.status(400).json({
          success: false,
          message: "Vehículo ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }

      // Error genérico de unicidad
      return res.status(400).json({
        success: false,
        message: "Vehículo ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        detalles: error.errors.map((e) => e.message),
      });
    }

    // Errores de validación general
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errores: error.errors.map((e) => ({
          campo: e.path,
          mensaje: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al asignar el vehículo",
      error: error.message,
    });
  }
};

/**
 * Actualizar una asignación de vehículo en un turno
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateVehiculoInTurno = async (req, res) => {
  const { id } = req.params;
  const { id: updated_by } = req.user;

  try {
    const vehiculoAsignado = await OperativosVehiculos.findByPk(id);
    if (!vehiculoAsignado) {
      return res.status(404).json({
        success: false,
        message: "Asignación de vehículo no encontrada",
      });
    }

    // Validar que el vehículo no esté ya asignado al turno (solo registros activos, excluyendo el actual)
    if (req.body.vehiculo_id) {
      const vehiculoExistente = await OperativosVehiculos.findOne({
        where: {
          operativo_turno_id: vehiculoAsignado.operativo_turno_id,
          vehiculo_id: req.body.vehiculo_id,
          estado_registro: 1,
          deleted_at: null,
          id: { [Op.ne]: id }, // Excluir el registro actual
        },
      });

      if (vehiculoExistente) {
        return res.status(400).json({
          success: false,
          message: "Vehículo ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }
    }

    // Validar que el conductor no esté ya asignado a otro vehículo en el turno (solo registros activos, excluyendo el actual)
    if (req.body.conductor_id) {
      const conductorExistente = await OperativosVehiculos.findOne({
        where: {
          operativo_turno_id: vehiculoAsignado.operativo_turno_id,
          conductor_id: req.body.conductor_id,
          estado_registro: 1,
          deleted_at: null,
          id: { [Op.ne]: id }, // Excluir el registro actual
        },
      });

      if (conductorExistente) {
        return res.status(400).json({
          success: false,
          message: "Conductor ya fue asignado a otro vehículo en el mismo sector, turno y fecha de los Operativos",
        });
      }
    }

    await vehiculoAsignado.update({
      ...req.body,
      updated_by,
    });

    res.status(200).json({
      success: true,
      message: "Asignación de vehículo actualizada correctamente",
      data: vehiculoAsignado,
    });
  } catch (error) {
    // Constraint de kilometraje
    if (
      error.name === "SequelizeDatabaseError" &&
      error.parent?.code === "ER_CHECK_CONSTRAINT_VIOLATED" &&
      error.parent?.sqlMessage?.includes("chk_kilometraje_vehiculo")
    ) {
      return res.status(400).json({
        success: false,
        message: "El kilometraje final no puede ser menor que el kilometraje inicial",
      });
    }

    // Constraints de unicidad
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintName = error.parent?.constraint;
      const fields = error.fields || {};

      if (constraintName === "uq_turno_conductor" || fields.conductor_id) {
        return res.status(400).json({
          success: false,
          message: "Conductor ya fue asignado a otro vehículo en el mismo sector, turno y fecha de los Operativos",
        });
      }

      if (
        constraintName === "no_turno_vehiculo" ||
        (typeof constraintName === "string" && constraintName.includes("turno_vehiculo")) ||
        fields.vehiculo_id
      ) {
        return res.status(400).json({
          success: false,
          message: "Vehículo ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Vehículo ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
      });
    }

    // Errores de validación general
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errores: error.errors.map((e) => ({
          campo: e.path,
          mensaje: e.message,
        })),
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
 * Eliminar (soft delete) una asignación de vehículo de un turno
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteVehiculoInTurno = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const vehiculoAsignado = await OperativosVehiculos.findOne({
      where: { id, deleted_at: null, estado_registro: 1 },
    });

    if (!vehiculoAsignado) {
      return res.status(404).json({
        success: false,
        message: "Asignación de vehículo no encontrada",
      });
    }

    // Soft delete usando el hook beforeDestroy
    await vehiculoAsignado.destroy({
      userId: userId,
    });

    res.status(200).json({
      success: true,
      message: "Asignación de vehículo eliminada correctamente",
    });
  } catch (error) {
    console.error("❌ Error en deleteVehiculoInTurno:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la asignación",
      error: error.message,
    });
  }
};

/**
 * Obtener los cuadrantes asignados a un vehículo de un turno
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getCuadrantesByVehiculoAsignado = async (req, res) => {
  const { id } = req.params;

  try {
    const asignacion = await OperativosVehiculos.findByPk(id, {
      include: [
        {
          model: OperativosVehiculosCuadrantes,
          as: "cuadrantesAsignados",
          attributes: [
            "id",
            "operativo_vehiculo_id",
            "cuadrante_id",
            "hora_ingreso",
            "hora_salida",
            "observaciones",
            "incidentes_reportados",
            "estado_registro",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
            "deleted_by",
            "deleted_at",
          ],
          include: [
            {
              model: Cuadrante,
              as: "datosCuadrante",
            },
          ],
        },
      ],
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación de vehículo no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: asignacion.cuadrantesAsignados,
    });
  } catch (error) {
    console.error("Error al obtener los cuadrantes del vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los cuadrantes del vehículo",
      error: error.message,
    });
  }
};

/**
 * Asignar un cuadrante a un vehículo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createCuadranteForVehiculo = async (req, res) => {
  const { id } = req.params; // id de OperativosVehiculos
  const { cuadrante_id, hora_ingreso } = req.body;
  const { id: created_by } = req.user;

  try {
    // Verificar que la asignación del vehículo exista
    const vehiculoAsignado = await OperativosVehiculos.findByPk(id);
    if (!vehiculoAsignado) {
      return res.status(404).json({
        success: false,
        message: "Asignación de vehículo no encontrada",
      });
    }

    // Crear la nueva asignación de cuadrante
    const nuevoCuadranteAsignado = await OperativosVehiculosCuadrantes.create({
      operativo_vehiculo_id: id,
      cuadrante_id,
      hora_ingreso,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: "Cuadrante asignado al vehículo correctamente",
      data: nuevoCuadranteAsignado,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al asignar el cuadrante al vehículo",
      error: error.message,
    });
  }
};

/**
 * Actualizar una asignación de cuadrante a un vehículo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateCuadranteForVehiculo = async (req, res) => {
  const { id, cuadranteId } = req.params;
  const { hora_salida } = req.body;
  const { id: updated_by } = req.user;

  try {
    const asignacion = await OperativosVehiculosCuadrantes.findOne({
      where: {
        operativo_vehiculo_id: id,
        id: cuadranteId,
      },
      // Seleccionar explícitamente los campos del modelo para evitar errores de asociación
      attributes: [
        "id",
        "operativo_vehiculo_id",
        "cuadrante_id",
        "hora_ingreso",
        "hora_salida",
        "observaciones",
        "incidentes_reportados",
        "estado_registro",
        "created_by",
        "created_at",
        "updated_by",
        "updated_at",
        "deleted_by",
        "deleted_at",
      ],
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación de cuadrante no encontrada",
      });
    }

    await asignacion.update({
      hora_salida,
      updated_by,
    });

    res.status(200).json({
      success: true,
      message: "Asignación de cuadrante actualizada correctamente",
      data: asignacion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar la asignación de cuadrante",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una asignación de cuadrante de un vehículo
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteCuadranteForVehiculo = async (req, res) => {
  const { id, cuadranteId } = req.params;
  const { id: deleted_by } = req.user;

  try {
    const asignacion = await OperativosVehiculosCuadrantes.findOne({
      where: {
        operativo_vehiculo_id: id,
        id: cuadranteId,
      },
      // Seleccionar explícitamente los campos del modelo para evitar errores de asociación
      attributes: [
        "id",
        "operativo_vehiculo_id",
        "cuadrante_id",
        "hora_ingreso",
        "hora_salida",
        "observaciones",
        "incidentes_reportados",
        "estado_registro",
        "created_by",
        "created_at",
        "updated_by",
        "updated_at",
        "deleted_by",
        "deleted_at",
      ],
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación de cuadrante no encontrada",
      });
    }

    // Actualizar campos para borrado lógico
    await asignacion.update({
      estado_registro: 0,
      deleted_by,
    });
    // Ejecutar borrado lógico (paranoid: true)
    await asignacion.destroy();

    res.status(200).json({
      success: true,
      message: "Asignación de cuadrante eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar la asignación de cuadrante",
      error: error.message,
    });
  }
};

/**
 * Obtener las novedades de una asignación de cuadrante
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getNovedadesByCuadrante = async (req, res) => {
  const { cuadranteId } = req.params;

  try {
    // 1. Buscar el registro de OperativosVehiculosCuadrantes
    const operativoCuadrante = await OperativosVehiculosCuadrantes.findByPk(
      cuadranteId,
      {
        attributes: ["id", "operativo_vehiculo_id", "cuadrante_id"], // Solo necesitamos estos atributos
      }
    );

    if (!operativoCuadrante) {
      return res.status(404).json({
        success: false,
        message: "Cuadrante operativo no encontrado",
      });
    }

    // 2. Obtener las novedades asociadas a este operativo_vehiculo_cuadrante_id
    const novedades = await models.OperativosVehiculosNovedades.findAll({
      where: {
        operativo_vehiculo_cuadrante_id: operativoCuadrante.id,
      },
      attributes: [
        // Añadimos esta línea para especificar los atributos de OperativosVehiculosNovedades
        "id",
        "operativo_vehiculo_cuadrante_id",
        "novedad_id",
        "reportado",
        "estado",
        "observaciones",
        "created_at",
        "updated_at",
        "deleted_at",
        "created_by",
        "updated_by",
        "deleted_by",
      ],
      include: [
        {
          model: models.Novedad,
          as: "novedad", // Alias corregido según la asociación definida
        },
        {
          model: models.OperativosVehiculosCuadrantes,
          as: "cuadranteOperativo",
          attributes: ["id", "operativo_vehiculo_id", "cuadrante_id", "hora_ingreso", "hora_salida"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: novedades,
    });
  } catch (error) {
    console.error("Error al obtener las novedades del cuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las novedades del cuadrante",
      error: error.message,
    });
  }
};
