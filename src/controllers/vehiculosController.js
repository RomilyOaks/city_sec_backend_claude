/**
 * ===================================================
 * CONTROLADOR: src/controllers/vehiculosController.js
 * ====================================================
 *
 * Controlador de Vehículos - COMPLETO
 * Gestiona el CRUD completo de vehículos del sistema de seguridad
 * Incluye abastecimientos y disponibilidad
 */

import {
  Vehiculo,
  UnidadOficina,
  PersonalSeguridad,
  Novedad,
  TipoVehiculo,
  EstadoNovedad,
} from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Obtener todos los vehículos con filtros
 * @route GET /api/vehiculos
 */
export const getAllVehiculos = async (req, res) => {
  try {
    const {
      tipo,
      tipo_id,
      estado_operativo,
      unidad_id,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    // Filtro por tipo de vehículo (nombre o ID)
    if (tipo) {
      whereClause.tipo_vehiculo = tipo;
    }

    if (tipo_id) {
      whereClause.tipo_id = tipo_id;
    }

    if (estado_operativo) {
      whereClause.estado_operativo = estado_operativo;
    }

    if (unidad_id) {
      whereClause.unidad_oficina_id = unidad_id;
    }

    if (search) {
      whereClause[Op.or] = [
        { codigo_vehiculo: { [Op.like]: `%${search}%` } },
        { placa: { [Op.like]: `%${search}%` } },
        { marca: { [Op.like]: `%${search}%` } },
        { modelo: { [Op.like]: `%${search}%` } },
        { nombre: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Vehiculo.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["id", "nombre", "descripcion"],
        },
        {
          model: UnidadOficina,
          as: "unidad",
          attributes: ["id", "nombre", "codigo"],
        },
        {
          model: PersonalSeguridad,
          as: "conductorAsignado",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
      ],
      order: [["codigo_vehiculo", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener vehículos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los vehículos",
      error: error.message,
    });
  }
};

/**
 * Obtener vehículos disponibles (no asignados a novedades activas)
 * @route GET /api/vehiculos/disponibles
 */
export const getVehiculosDisponibles = async (req, res) => {
  try {
    const { tipo_id } = req.query;

    // Obtener IDs de vehículos que están asignados a novedades activas
    const vehiculosEnUso = await Novedad.findAll({
      where: {
        vehiculo_asignado_id: { [Op.ne]: null },
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: EstadoNovedad,
          as: "estado",
          where: {
            nombre: {
              [Op.notIn]: ["CERRADO", "CANCELADO", "FINALIZADO"],
            },
          },
        },
      ],
      attributes: ["vehiculo_asignado_id"],
      raw: true,
    });

    const idsEnUso = vehiculosEnUso.map((n) => n.vehiculo_asignado_id);

    // Buscar vehículos disponibles
    const whereClause = {
      estado: 1,
      deleted_at: null,
      id: { [Op.notIn]: idsEnUso.length > 0 ? idsEnUso : [0] },
    };

    // Filtrar por tipo si se especifica
    if (tipo_id) {
      whereClause.tipo_id = tipo_id;
    }

    const vehiculosDisponibles = await Vehiculo.findAll({
      where: whereClause,
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["id", "nombre"],
        },
        {
          model: UnidadOficina,
          as: "unidad",
          attributes: ["id", "nombre", "codigo"],
        },
      ],
      order: [["codigo_vehiculo", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: vehiculosDisponibles,
      total: vehiculosDisponibles.length,
    });
  } catch (error) {
    console.error("Error al obtener vehículos disponibles:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener vehículos disponibles",
      error: error.message,
    });
  }
};

/**
 * Obtener un vehículo por ID
 * @route GET /api/vehiculos/:id
 */
export const getVehiculoById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehiculo = await Vehiculo.findOne({
      where: {
        id,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
        },
        {
          model: UnidadOficina,
          as: "unidad",
        },
        {
          model: PersonalSeguridad,
          as: "conductorAsignado",
        },
      ],
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: vehiculo,
    });
  } catch (error) {
    console.error("Error al obtener vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el vehículo",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo vehículo
 * @route POST /api/vehiculos
 */
/**
 * Crear un nuevo vehículo
 * @route POST /api/vehiculos
 * 🔥 VERSIÓN CORREGIDA - Manejo correcto de transacciones
 */
export const createVehiculo = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      tipo_id,
      codigo_vehiculo,
      nombre,
      placa,
      marca,
      modelo_vehiculo, // 🔥 CORREGIDO: era "modelo"
      anio_vehiculo, // 🔥 CORREGIDO: era "anio"
      color_vehiculo, // 🔥 CORREGIDO: era "color"
      numero_motor,
      numero_chasis,
      kilometraje_inicial,
      capacidad_combustible,
      unidad_oficina_id,
      conductor_asignado_id,
      estado_operativo,
      soat,
      fec_soat,
      fec_manten,
      observaciones,
    } = req.body;

    // Validar campos requeridos
    if (!tipo_id || !placa || !unidad_oficina_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: tipo_id, placa, unidad_oficina_id",
      });
    }

    // Verificar que no exista la placa
    const vehiculoExistente = await Vehiculo.findOne({
      where: {
        placa: placa.toUpperCase(),
        estado: 1,
        deleted_at: null,
      },
      transaction,
    });

    if (vehiculoExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Ya existe un vehículo con esa placa",
      });
    }

    // Si se proporciona código, verificar que no exista
    if (codigo_vehiculo) {
      const codigoExistente = await Vehiculo.findOne({
        where: {
          codigo_vehiculo,
          estado: 1,
          deleted_at: null,
        },
        transaction,
      });

      if (codigoExistente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Ya existe un vehículo con ese código",
        });
      }
    }

    // Crear el vehículo (el hook beforeCreate generará el código si no se proporciona)
    const nuevoVehiculo = await Vehiculo.create(
      {
        tipo_id,
        codigo_vehiculo: codigo_vehiculo || null,
        nombre,
        placa: placa.toUpperCase(),
        marca,
        modelo_vehiculo,
        anio_vehiculo,
        color_vehiculo,
        numero_motor,
        numero_chasis,
        kilometraje_inicial: kilometraje_inicial || 0,
        kilometraje_actual: kilometraje_inicial || 0,
        capacidad_combustible,
        unidad_oficina_id,
        conductor_asignado_id,
        estado_operativo: estado_operativo || "DISPONIBLE",
        soat,
        fec_soat,
        fec_manten,
        observaciones,
        created_by: req.user.id,
      },
      { transaction }
    );

    // 🔥 IMPORTANTE: Hacer el commit ANTES de buscar con relaciones
    await transaction.commit();

    // 🔥 AHORA SÍ: Buscar el vehículo completo CON relaciones (SIN transacción)
    const vehiculoCompleto = await Vehiculo.findByPk(nuevoVehiculo.id, {
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["id", "nombre", "descripcion"],
        },
        {
          model: UnidadOficina,
          as: "unidad",
          attributes: ["id", "nombre", "codigo"],
        },
        {
          model: PersonalSeguridad,
          as: "conductorAsignado",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Vehículo creado exitosamente",
      data: vehiculoCompleto,
    });
  } catch (error) {
    // Si la transacción aún no se ha finalizado, hacer rollback
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error al crear vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el vehículo",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Actualizar un vehículo
 * @route PUT /api/vehiculos/:id
 */
export const updateVehiculo = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!vehiculo) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Verificar código o placa duplicados (excluyendo el actual)
    if (datosActualizacion.codigo_vehiculo || datosActualizacion.placa) {
      const duplicado = await Vehiculo.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            datosActualizacion.codigo_vehiculo && {
              codigo_vehiculo: datosActualizacion.codigo_vehiculo,
            },
            datosActualizacion.placa && {
              placa: datosActualizacion.placa.toUpperCase(),
            },
          ].filter(Boolean),
          estado: 1,
          deleted_at: null,
        },
        transaction,
      });

      if (duplicado) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Ya existe otro vehículo con ese código o placa",
        });
      }
    }

    // Normalizar placa si viene
    if (datosActualizacion.placa) {
      datosActualizacion.placa = datosActualizacion.placa.toUpperCase();
    }

    // Actualizar vehículo
    await vehiculo.update(
      {
        ...datosActualizacion,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Obtener vehículo actualizado con relaciones
    const vehiculoActualizado = await Vehiculo.findByPk(id, {
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["id", "nombre", "descripcion"],
        },
        {
          model: UnidadOficina,
          as: "unidad",
          attributes: ["id", "nombre", "codigo"],
        },
        {
          model: PersonalSeguridad,
          as: "conductorAsignado",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Vehículo actualizado exitosamente",
      data: vehiculoActualizado,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Error al actualizar vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el vehículo",
      error: error.message,
    });
  }
};

/**
 * Eliminar un vehículo (soft delete)
 * @route DELETE /api/vehiculos/:id
 */
export const deleteVehiculo = async (req, res) => {
  try {
    const { id } = req.params;

    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Verificar si está en uso en novedades activas
    const novedadesActivas = await Novedad.count({
      where: {
        vehiculo_asignado_id: id,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: EstadoNovedad,
          as: "estado",
          where: {
            nombre: {
              [Op.notIn]: ["CERRADO", "CANCELADO", "FINALIZADO"],
            },
          },
        },
      ],
    });

    if (novedadesActivas > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar el vehículo porque tiene novedades activas asignadas",
      });
    }

    await vehiculo.update({
      estado: 0,
      deleted_at: new Date(),
      updated_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Vehículo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el vehículo",
      error: error.message,
    });
  }
};

/**
 * Actualizar kilometraje del vehículo
 * @route PATCH /api/vehiculos/:id/kilometraje
 */
export const actualizarKilometraje = async (req, res) => {
  try {
    const { id } = req.params;
    const { kilometraje_nuevo, observaciones } = req.body;

    if (!kilometraje_nuevo || kilometraje_nuevo < 0) {
      return res.status(400).json({
        success: false,
        message: "El kilometraje nuevo debe ser un número positivo",
      });
    }

    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    if (kilometraje_nuevo < vehiculo.kilometraje_actual) {
      return res.status(400).json({
        success: false,
        message: "El kilometraje nuevo no puede ser menor al actual",
      });
    }

    await vehiculo.update({
      kilometraje_actual: kilometraje_nuevo,
      observaciones: observaciones || vehiculo.observaciones,
      updated_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Kilometraje actualizado exitosamente",
      data: vehiculo,
    });
  } catch (error) {
    console.error("Error al actualizar kilometraje:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el kilometraje",
      error: error.message,
    });
  }
};

/**
 * Cambiar estado operativo del vehículo
 * @route PATCH /api/vehiculos/:id/estado
 */
export const cambiarEstadoOperativo = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_operativo, observaciones } = req.body;

    const estadosValidos = [
      "DISPONIBLE",
      "EN_SERVICIO",
      "MANTENIMIENTO",
      "REPARACION",
      "FUERA_DE_SERVICIO",
      "INACTIVO",
    ];

    if (!estadosValidos.includes(estado_operativo)) {
      return res.status(400).json({
        success: false,
        message: `Estado operativo inválido. Debe ser uno de: ${estadosValidos.join(
          ", "
        )}`,
      });
    }

    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    await vehiculo.update({
      estado_operativo,
      observaciones: observaciones || vehiculo.observaciones,
      updated_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Estado operativo actualizado exitosamente",
      data: vehiculo,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar el estado operativo",
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de vehículos
 * @route GET /api/vehiculos/stats
 */
export const getEstadisticasVehiculos = async (req, res) => {
  try {
    // Total de vehículos
    const totalVehiculos = await Vehiculo.count({
      where: { estado: 1, deleted_at: null },
    });

    // Vehículos por estado operativo
    const vehiculosPorEstado = await Vehiculo.findAll({
      where: { estado: 1, deleted_at: null },
      attributes: [
        "estado_operativo",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["estado_operativo"],
      raw: true,
    });

    // Vehículos por tipo
    const vehiculosPorTipo = await Vehiculo.findAll({
      where: { estado: 1, deleted_at: null },
      attributes: [
        "tipo_id",
        [sequelize.fn("COUNT", sequelize.col("Vehiculo.id")), "cantidad"],
      ],
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["nombre"],
        },
      ],
      group: ["tipo_id", "tipo.id"],
      raw: false,
    });

    // Vehículos por unidad
    const vehiculosPorUnidad = await Vehiculo.findAll({
      where: { estado: 1, deleted_at: null },
      attributes: [
        "unidad_oficina_id",
        [sequelize.fn("COUNT", sequelize.col("Vehiculo.id")), "cantidad"],
      ],
      include: [
        {
          model: UnidadOficina,
          as: "unidad",
          attributes: ["nombre", "codigo"],
        },
      ],
      group: ["unidad_oficina_id", "unidad.id"],
      raw: false,
    });

    // Vehículos disponibles
    const vehiculosDisponibles = await Vehiculo.count({
      where: {
        estado_operativo: "DISPONIBLE",
        estado: 1,
        deleted_at: null,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalVehiculos,
        vehiculosDisponibles,
        vehiculosPorEstado,
        vehiculosPorTipo,
        vehiculosPorUnidad,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de vehículos",
      error: error.message,
    });
  }
};

/**
 * Obtener historial de uso del vehículo (novedades asignadas)
 * @route GET /api/vehiculos/:id/historial
 */
export const getHistorialVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Obtener novedades donde participó este vehículo
    const historial = await Novedad.findAll({
      where: {
        vehiculo_asignado_id: id,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: EstadoNovedad,
          as: "estado",
          attributes: ["nombre", "color_hex"],
        },
        {
          model: PersonalSeguridad,
          as: "personalAsignado",
          attributes: ["nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: TipoNovedad,
          as: "tipoNovedad",
          attributes: ["nombre", "icono"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: {
        vehiculo,
        total_servicios: historial.length,
        historial,
      },
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial del vehículo",
      error: error.message,
    });
  }
};

/**
 * Registrar abastecimiento de combustible
 * @route POST /api/vehiculos/:id/abastecimiento
 * NOTA: Esta funcionalidad requiere crear el modelo Abastecimiento
 */
export const registrarAbastecimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha_hora,
      tipo_combustible,
      cantidad_galones,
      precio_galon,
      importe_total,
      km_actual,
      grifo,
      observaciones,
    } = req.body;

    // Validar que el vehículo existe
    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Validar campos requeridos
    if (!fecha_hora || !tipo_combustible || !cantidad_galones) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: fecha_hora, tipo_combustible, cantidad_galones",
      });
    }

    // TODO: Crear registro en tabla abastecimientos
    // Por ahora, retornamos información simulada
    const abastecimiento = {
      id: Date.now(), // Temporal
      vehiculo_id: id,
      fecha_hora,
      tipo_combustible,
      cantidad_galones,
      precio_galon: precio_galon || 0,
      importe_total: importe_total || cantidad_galones * (precio_galon || 0),
      km_actual: km_actual || vehiculo.kilometraje_actual,
      grifo,
      observaciones,
      registrado_por: req.user.id,
      created_at: new Date(),
    };

    // Actualizar kilometraje del vehículo si se proporciona
    if (km_actual && km_actual > vehiculo.kilometraje_actual) {
      await vehiculo.update({
        kilometraje_actual: km_actual,
        updated_by: req.user.id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Abastecimiento registrado exitosamente",
      data: abastecimiento,
      nota: "Esta funcionalidad requiere crear el modelo Abastecimiento en la base de datos",
    });
  } catch (error) {
    console.error("Error al registrar abastecimiento:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar el abastecimiento",
      error: error.message,
    });
  }
};

/**
 * Obtener historial de abastecimientos de un vehículo
 * @route GET /api/vehiculos/:id/abastecimientos
 * NOTA: Esta funcionalidad requiere crear el modelo Abastecimiento
 */
export const getHistorialAbastecimientos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, limit = 50 } = req.query;

    // Validar que el vehículo existe
    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // TODO: Consultar tabla abastecimientos
    // Por ahora, retornamos array vacío
    const abastecimientos = [];

    res.status(200).json({
      success: true,
      data: {
        vehiculo: {
          id: vehiculo.id,
          codigo_vehiculo: vehiculo.codigo_vehiculo,
          placa: vehiculo.placa,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
        },
        total_abastecimientos: abastecimientos.length,
        abastecimientos,
      },
      nota: "Esta funcionalidad requiere crear el modelo Abastecimiento en la base de datos",
    });
  } catch (error) {
    console.error("Error al obtener historial de abastecimientos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial de abastecimientos",
      error: error.message,
    });
  }
};
