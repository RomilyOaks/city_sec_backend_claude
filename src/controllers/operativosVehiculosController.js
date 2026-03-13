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
  TipoVehiculo,
  PersonalSeguridad,
  OperativosVehiculosCuadrantes,
  Cuadrante,
  Usuario,
  TipoCopiloto,
  RadioTetra,
  EstadoOperativoRecurso,
  Sector,
} = models;
import { Op } from "sequelize";
import { obtenerRadioDelPersonal } from "../services/operativosHelperService.js";
import { convertToTimezone } from "../utils/dateHelper.js";

/**
 * Obtener un vehículo operativo por ID (general)
 * GET /api/v1/operativos-vehiculos/:id
 */
export const getVehiculoByIdGeneral = async (req, res) => {
  const { id } = req.params;

  try {
    const vehiculo = await OperativosVehiculos.findOne({
      where: {
        id,
        deleted_at: null,
        estado_registro: 1,
      },
      include: [
        {
          model: OperativosTurno,
          as: "turno",
          include: [
            {
              model: PersonalSeguridad,
              as: "operador",
              attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
            },
            {
              model: PersonalSeguridad,
              as: "supervisor",
              attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
            },
            {
              model: Sector,
              as: "sector",
              attributes: ["id", "nombre", "sector_code"],
            },
          ],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          include: [
            {
              model: TipoVehiculo,
              as: "tipoVehiculo",
              attributes: ["id", "nombre"],
            },
            {
              model: models.UnidadOficina,
              as: "unidad",
              attributes: ["id", "nombre"],
            },
          ],
        },
        {
          model: PersonalSeguridad,
          as: "conductor",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: PersonalSeguridad,
          as: "copiloto",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: EstadoOperativoRecurso,
          as: "estado_operativo",
          attributes: ["id", "descripcion"],
        },
        {
          model: TipoCopiloto,
          as: "tipo_copiloto",
          attributes: ["id", "codigo", "descripcion"],
        },
        {
          model: RadioTetra,
          as: "radio_tetra",
          attributes: ["id", "radio_tetra_code", "descripcion"],
        },
        {
          model: Usuario,
          as: "creadoPorUsuario",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "actualizadoPorUsuario", 
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "eliminadoPorUsuario",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
      ],
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo operativo no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehículo operativo obtenido exitosamente",
      data: vehiculo,
    });
  } catch (error) {
    console.error("Error en getVehiculoByIdGeneral:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el vehículo operativo",
      error: error.message,
    });
  }
};
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
        include: [
          {
            model: TipoVehiculo,
            as: "tipoVehiculo",
            attributes: ["id", "nombre"],
            required: false,
          },
          {
            model: models.UnidadOficina,
            as: "unidad",
            attributes: ["id", "nombre"],
            required: false,
          },
        ],
        required: false,
      },
      {
        model: PersonalSeguridad,
        as: "conductor",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
      },
      {
        model: PersonalSeguridad,
        as: "copiloto",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
      },
      {
        model: TipoCopiloto,
        as: "tipo_copiloto",
        attributes: ["id", "descripcion", "estado"],
        required: false,
      },
      {
        model: RadioTetra,
        as: "radio_tetra",
        attributes: [
          "id",
          "radio_tetra_code",
          "descripcion",
          "fecha_fabricacion",
          "estado",
        ],
        required: false,
      },
      {
        model: EstadoOperativoRecurso,
        as: "estado_operativo",
        attributes: ["id", "descripcion", "estado"],
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
          include: [
            {
              model: TipoVehiculo,
              as: "tipoVehiculo",
              attributes: ["id", "nombre"],
            },
            {
              model: models.UnidadOficina,
              as: "unidad",
              attributes: ["id", "nombre"],
            },
          ],
        },
        {
          model: PersonalSeguridad,
          as: "conductor",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: PersonalSeguridad,
          as: "copiloto",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: EstadoOperativoRecurso,
          as: "estado_operativo",
          attributes: ["id", "descripcion"],
        },
        {
          model: TipoCopiloto,
          as: "tipo_copiloto",
          attributes: ["id", "codigo", "descripcion"],
        },
        {
          model: RadioTetra,
          as: "radio_tetra",
          attributes: ["id", "radio_tetra_code", "descripcion"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: vehiculos,
    });
  } catch (error) {
    console.error("Error en getAllVehiculosByTurno:", error.message);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Obtener un vehículo específico por ID dentro de un turno
 * GET /:turnoId/vehiculos/:id
 */
export const getVehiculoById = async (req, res) => {
  const { turnoId, id } = req.params;

  try {
    const turno = await OperativosTurno.findByPk(turnoId);
    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    const vehiculo = await OperativosVehiculos.findOne({
      where: {
        id: id,
        operativo_turno_id: turnoId,
        deleted_at: null,
        estado_registro: 1,
      },
      include: [
        {
          model: OperativosTurno,
          as: "turno",
          include: [
            {
              model: PersonalSeguridad,
              as: "operador",
              attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
            },
            {
              model: PersonalSeguridad,
              as: "supervisor",
              attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
            },
            {
              model: Sector,
              as: "sector",
              attributes: ["id", "nombre", "sector_code"],
            },
          ],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          include: [
            {
              model: TipoVehiculo,
              as: "tipoVehiculo",
              attributes: ["id", "nombre"],
            },
            {
              model: models.UnidadOficina,
              as: "unidad",
              attributes: ["id", "nombre"],
            },
          ],
        },
        {
          model: PersonalSeguridad,
          as: "conductor",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: PersonalSeguridad,
          as: "copiloto",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: EstadoOperativoRecurso,
          as: "estado_operativo",
          attributes: ["id", "descripcion"],
        },
        {
          model: TipoCopiloto,
          as: "tipo_copiloto",
          attributes: ["id", "codigo", "descripcion"],
        },
        {
          model: RadioTetra,
          as: "radio_tetra",
          attributes: ["id", "radio_tetra_code", "descripcion"],
        },
        {
          model: Usuario,
          as: "creadoPorUsuario",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "actualizadoPorUsuario", 
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "eliminadoPorUsuario",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
      ],
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado en este turno",
      });
    }

    res.status(200).json({
      success: true,
      data: vehiculo,
    });
  } catch (error) {
    console.error("Error en getVehiculoById:", error.message);
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

    // ========================================
    // AUTO-POBLAR radio_tetra_id SI NO SE ENVÍA
    // ========================================
    // Si no se envía radio_tetra_id, buscar si el conductor o copiloto tiene radio asignado
    let radio_tetra_id = req.body.radio_tetra_id || null;
    if (!radio_tetra_id && (req.body.conductor_id || req.body.copiloto_id)) {
      // Primero intentar con el conductor
      radio_tetra_id = await obtenerRadioDelPersonal(req.body.conductor_id);
      // Si el conductor no tiene radio, intentar con el copiloto
      if (!radio_tetra_id && req.body.copiloto_id) {
        radio_tetra_id = await obtenerRadioDelPersonal(req.body.copiloto_id);
      }
      if (radio_tetra_id) {
        console.log(`📻 Radio auto-asignado al vehículo: ${radio_tetra_id}`);
      }
    }

    const newVehiculoAsignado = await OperativosVehiculos.create({
      ...req.body,
      radio_tetra_id, // Usar el radio encontrado (o null si no hay)
      operativo_turno_id: turnoId,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: "Vehículo asignado al turno correctamente",
      data: newVehiculoAsignado,
    });
  } catch (error) {
    console.error("Error en createVehiculoInTurno:", error.message);

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
 * 
 * Campos actualizables:
 * - conductor_id, copiloto_id, tipo_copiloto_id
 * - radio_tetra_id, estado_operativo_id
 * - kilometraje_inicio, hora_inicio, nivel_combustible_inicio
 * - kilometraje_fin, hora_fin, nivel_combustible_fin
 * - kilometraje_recarga, hora_recarga, combustible_litros, importe_recarga, nivel_combustible_recarga
 * - observaciones
 * 
 * Validaciones:
 * - kilometraje_fin >= kilometraje_inicio
 * - Si hay kilometraje_recarga, debe haber hora_recarga (y viceversa)
 * - kilometraje_recarga, combustible_litros, importe_recarga deben ser números positivos
 * - nivel_combustible_recarga debe ser: LLENO, 3/4, 1/2, 1/4, RESERVA
 * 
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

    // ========================================
    // VALIDAR CAMPOS DE RECARGA DE COMBUSTIBLE
    // ========================================
    const {
      kilometraje_recarga,
      hora_recarga,
      combustible_litros,
      importe_recarga,
      nivel_combustible_recarga
    } = req.body;

    // Validar que si hay kilometraje de recarga, también haya hora de recarga
    if (kilometraje_recarga && !hora_recarga) {
      return res.status(400).json({
        success: false,
        message: "Si especifica kilometraje de recarga, debe especificar la hora de recarga",
      });
    }

    // Validar que si hay hora de recarga, también haya kilometraje de recarga
    if (hora_recarga && !kilometraje_recarga) {
      return res.status(400).json({
        success: false,
        message: "Si especifica hora de recarga, debe especificar el kilometraje de recarga",
      });
    }

    // Validar formato de hora de recarga si se proporciona
    if (hora_recarga) {
      try {
        convertToTimezone(hora_recarga);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Formato de hora de recarga inválido. Use formato YYYY-MM-DD HH:mm:ss",
        });
      }
    }

    // Validar valores numéricos
    if (kilometraje_recarga !== undefined && kilometraje_recarga !== null) {
      if (isNaN(kilometraje_recarga) || kilometraje_recarga < 0) {
        return res.status(400).json({
          success: false,
          message: "El kilometraje de recarga debe ser un número positivo",
        });
      }
    }

    if (combustible_litros !== undefined && combustible_litros !== null) {
      if (isNaN(combustible_litros) || combustible_litros <= 0) {
        return res.status(400).json({
          success: false,
          message: "Los litros de combustible deben ser un número mayor a cero",
        });
      }
    }

    if (importe_recarga !== undefined && importe_recarga !== null) {
      if (isNaN(importe_recarga) || importe_recarga <= 0) {
        return res.status(400).json({
          success: false,
          message: "El importe de recarga debe ser un número mayor a cero",
        });
      }
    }

    // Validar ENUM de nivel de combustible
    if (nivel_combustible_recarga !== undefined && nivel_combustible_recarga !== null) {
      const nivelesValidos = ["LLENO", "3/4", "1/2", "1/4", "RESERVA"];
      if (!nivelesValidos.includes(nivel_combustible_recarga)) {
        return res.status(400).json({
          success: false,
          message: `El nivel de combustible debe ser uno de: ${nivelesValidos.join(", ")}`,
        });
      }
    }

    // ========================================
    // AUTO-POBLAR radio_tetra_id SI NO SE ENVÍA
    // ========================================
    // Si no se envía radio_tetra_id, buscar si el conductor o copiloto tiene radio asignado
    let radio_tetra_id = req.body.radio_tetra_id;

    // Solo auto-buscar si se está actualizando conductor/copiloto y no se envía radio_tetra_id
    if (radio_tetra_id === undefined || radio_tetra_id === null) {
      const conductor_id = req.body.conductor_id !== undefined ? req.body.conductor_id : vehiculoAsignado.conductor_id;
      const copiloto_id = req.body.copiloto_id !== undefined ? req.body.copiloto_id : vehiculoAsignado.copiloto_id;

      if (conductor_id || copiloto_id) {
        // Primero intentar con el conductor
        radio_tetra_id = await obtenerRadioDelPersonal(conductor_id);
        // Si el conductor no tiene radio, intentar con el copiloto
        if (!radio_tetra_id && copiloto_id) {
          radio_tetra_id = await obtenerRadioDelPersonal(copiloto_id);
        }
        if (radio_tetra_id) {
          console.log(`📻 Radio auto-asignado en actualización de vehículo: ${radio_tetra_id}`);
        }
      }
    }

    await vehiculoAsignado.update({
      ...req.body,
      radio_tetra_id: radio_tetra_id !== undefined ? radio_tetra_id : vehiculoAsignado.radio_tetra_id,
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
            {
              model: Usuario,
              as: "creadorOperativosVehiculosCuadrantes",
              attributes: ["id", "username", "nombres", "apellidos"]
            },
            {
              model: Usuario,
              as: "actualizadorOperativosVehiculosCuadrantes",
              attributes: ["id", "username", "nombres", "apellidos"]
            },
            {
              model: Usuario,
              as: "eliminadorOperativosVehiculosCuadrantes",
              attributes: ["id", "username", "nombres", "apellidos"]
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
  const { cuadrante_id, hora_ingreso, observaciones, incidentes_reportados } = req.body;
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

    // Convertir hora_ingreso a formato completo si viene solo HH:MM
    let horaIngresoCompleta = hora_ingreso;
    if (hora_ingreso && hora_ingreso.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      const hoy = new Date();
      const [horas, minutos] = hora_ingreso.split(":");
      hoy.setHours(parseInt(horas), parseInt(minutos), 0, 0);
      horaIngresoCompleta = hoy.toISOString();
    }

    // Crear la nueva asignación de cuadrante
    const nuevoCuadranteAsignado = await OperativosVehiculosCuadrantes.create({
      operativo_vehiculo_id: id,
      cuadrante_id,
      hora_ingreso: horaIngresoCompleta,
      observaciones: observaciones || null,
      incidentes_reportados: incidentes_reportados || null,
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
  const { hora_salida, observaciones, incidentes_reportados } = req.body;
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

    const updateData = { hora_salida, updated_by };
    if ("observaciones" in req.body) {
      updateData.observaciones = observaciones === "" ? null : observaciones;
    }
    if ("incidentes_reportados" in req.body) {
      updateData.incidentes_reportados = incidentes_reportados === "" ? null : incidentes_reportados;
    }

    await asignacion.update(updateData);

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
