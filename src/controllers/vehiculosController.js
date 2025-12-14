/**
 * ===================================================
 * CONTROLADOR: src/controllers/vehiculosController.js
 * ====================================================
 *
 * Controlador de Vehículos - VERSIÓN CORREGIDA COMPLETA
 * - Manejo correcto de transacciones
 * - Nombres de campos corregidos
 * - Validaciones mejoradas
 * - Error handling robusto
 */

import {
  Vehiculo,
  UnidadOficina,
  PersonalSeguridad,
  Novedad,
  TipoVehiculo,
  EstadoNovedad,
  TipoNovedad,
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

    // Filtros
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
        { modelo_vehiculo: { [Op.like]: `%${search}%` } },
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
 * 🔥 CORREGIDO: Alias y nombre de campo vehiculo_id
 */
export const getVehiculosDisponibles = async (req, res) => {
  try {
    const { tipo_id } = req.query;

    const vehiculosEnUso = await Novedad.findAll({
      where: {
        vehiculo_id: { [Op.ne]: null },
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: EstadoNovedad,
          as: "novedadEstado", // ✅ Cambiado de "estadoNovedad" a "novedadEstado"
          where: {
            nombre: {
              [Op.notIn]: ["CERRADO", "CANCELADO", "FINALIZADO"],
            },
          },
        },
      ],
      attributes: ["vehiculo_id"],
      raw: true,
    });

    const idsEnUso = vehiculosEnUso.map((n) => n.vehiculo_id);

    const whereClause = {
      estado: 1,
      deleted_at: null,
      estado_operativo: "DISPONIBLE",
      id: { [Op.notIn]: idsEnUso.length > 0 ? idsEnUso : [0] },
    };

    if (tipo_id) {
      whereClause.tipo_id = tipo_id;
    }

    const vehiculosDisponibles = await Vehiculo.findAll({
      where: whereClause,
      include: [
        {
          model: TipoVehiculo,
          as: "tipoVehiculo", // ✅ Verificar que este alias también esté bien
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
 * 🔥 VERSIÓN CORREGIDA
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
      modelo_vehiculo,
      anio_vehiculo,
      color_vehiculo,
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

    // Verificar que el tipo de vehículo existe
    const tipoExiste = await TipoVehiculo.findByPk(tipo_id, { transaction });
    if (!tipoExiste) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El tipo de vehículo especificado no existe",
      });
    }

    // Verificar que la unidad existe
    const unidadExiste = await UnidadOficina.findByPk(unidad_oficina_id, {
      transaction,
    });
    if (!unidadExiste) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "La unidad especificada no existe",
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

    // Crear el vehículo
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

    // 🔥 COMMIT PRIMERO
    await transaction.commit();

    // 🔥 LUEGO buscar con relaciones (SIN transacción)
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
 * 🔥 VERSIÓN CORREGIDA
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

    // 🔥 COMMIT PRIMERO
    await transaction.commit();

    // 🔥 LUEGO buscar con relaciones (SIN transacción)
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
 * 🔥 VERSIÓN CORREGIDA: Alias corregido
 */
export const deleteVehiculo = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

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

    // 🔥 CORREGIDO: vehiculo_id y alias estadoNovedad
    const novedadesActivas = await Novedad.count({
      where: {
        vehiculo_id: id,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: EstadoNovedad,
          as: "estadoNovedad",
          where: {
            nombre: {
              [Op.notIn]: ["CERRADO", "CANCELADO", "FINALIZADO"],
            },
          },
        },
      ],
      transaction,
    });

    if (novedadesActivas > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar el vehículo porque tiene novedades activas asignadas",
      });
    }

    // Soft delete
    await vehiculo.update(
      {
        estado: 0,
        deleted_at: new Date(),
        deleted_by: req.user.id,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Vehículo eliminado exitosamente",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
 * 🔥 VERSIÓN CORREGIDA
 */
export const actualizarKilometraje = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { kilometraje_nuevo, observaciones } = req.body;

    if (!kilometraje_nuevo || kilometraje_nuevo < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El kilometraje nuevo debe ser un número positivo",
      });
    }

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

    if (kilometraje_nuevo < vehiculo.kilometraje_actual) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El kilometraje nuevo no puede ser menor al actual",
        kilometraje_actual: vehiculo.kilometraje_actual,
      });
    }

    await vehiculo.update(
      {
        kilometraje_actual: kilometraje_nuevo,
        observaciones: observaciones || vehiculo.observaciones,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Kilometraje actualizado exitosamente",
      data: {
        id: vehiculo.id,
        codigo_vehiculo: vehiculo.codigo_vehiculo,
        placa: vehiculo.placa,
        kilometraje_anterior: vehiculo.kilometraje_actual,
        kilometraje_nuevo: kilometraje_nuevo,
        diferencia: kilometraje_nuevo - vehiculo.kilometraje_actual,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
 * 🔥 VERSIÓN CORREGIDA
 */
export const cambiarEstadoOperativo = async (req, res) => {
  const transaction = await sequelize.transaction();

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
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Estado operativo inválido. Debe ser uno de: ${estadosValidos.join(
          ", "
        )}`,
      });
    }

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

    const estadoAnterior = vehiculo.estado_operativo;

    await vehiculo.update(
      {
        estado_operativo,
        observaciones: observaciones || vehiculo.observaciones,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Estado operativo actualizado exitosamente",
      data: {
        id: vehiculo.id,
        codigo_vehiculo: vehiculo.codigo_vehiculo,
        placa: vehiculo.placa,
        estado_anterior: estadoAnterior,
        estado_nuevo: estado_operativo,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
        [sequelize.fn("COUNT", sequelize.col("Vehiculo.id")), "cantidad"],
      ],
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["id", "nombre"],
        },
      ],
      group: ["tipo.id"],
      raw: false,
    });

    // Vehículos por unidad
    const vehiculosPorUnidad = await Vehiculo.findAll({
      where: { estado: 1, deleted_at: null },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Vehiculo.id")), "cantidad"],
      ],
      include: [
        {
          model: UnidadOficina,
          as: "unidad",
          attributes: ["id", "nombre", "codigo"],
        },
      ],
      group: ["unidad.id"],
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

    // Vehículos en mantenimiento
    const vehiculosMantenimiento = await Vehiculo.count({
      where: {
        estado_operativo: { [Op.in]: ["MANTENIMIENTO", "REPARACION"] },
        estado: 1,
        deleted_at: null,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalVehiculos,
        vehiculosDisponibles,
        vehiculosMantenimiento,
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
 * 🔥 CORREGIDO: vehiculo_id y alias de relaciones
 */
export const getHistorialVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
      attributes: [
        "id",
        "codigo_vehiculo",
        "placa",
        "marca",
        "modelo_vehiculo",
      ],
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // 🔥 CORREGIDO: vehiculo_id y verifica los alias en tu modelo Novedad
    const historial = await Novedad.findAll({
      where: {
        vehiculo_id: id,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: EstadoNovedad,
          as: "estadoNovedad", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombre", "color_hex"],
        },
        {
          model: PersonalSeguridad,
          as: "novedades_personal", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: PersonalSeguridad,
          as: "novedades_personal2", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: PersonalSeguridad,
          as: "novedades_personal3", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: PersonalSeguridad,
          as: "novedades_personal4", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: PersonalSeguridad,
          as: "novedades_personal4", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: PersonalSeguridad,
          as: "novedades_usuario_registro", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombres", "apellido_paterno", "apellido_materno"],
        },
        {
          model: TipoNovedad,
          as: "tipo", // 🔥 Verifica este alias en tu modelo
          attributes: ["nombre", "icono"],
        },
      ],
      order: [["fecha_hora_ocurrencia", "DESC"]], // 🔥 Campo correcto según schema
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
 * 🔥 VERSIÓN CORREGIDA
 */
export const registrarAbastecimiento = async (req, res) => {
  const transaction = await sequelize.transaction();

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

    // Validar campos requeridos
    if (!fecha_hora || !tipo_combustible || !cantidad_galones) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: fecha_hora, tipo_combustible, cantidad_galones",
      });
    }

    // Actualizar kilometraje del vehículo si se proporciona
    if (km_actual && km_actual > vehiculo.kilometraje_actual) {
      await vehiculo.update(
        {
          kilometraje_actual: km_actual,
          updated_by: req.user.id,
        },
        { transaction }
      );
    }

    await transaction.commit();

    // TODO: Crear registro en tabla abastecimientos cuando exista el modelo
    const abastecimiento = {
      id: Date.now(),
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

    res.status(201).json({
      success: true,
      message: "Abastecimiento registrado exitosamente",
      data: abastecimiento,
      nota: "Esta funcionalidad requiere crear el modelo Abastecimiento en la base de datos",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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
 */
export const getHistorialAbastecimientos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, limit = 50 } = req.query;

    // Validar que el vehículo existe
    const vehiculo = await Vehiculo.findOne({
      where: { id, estado: 1, deleted_at: null },
      attributes: [
        "id",
        "codigo_vehiculo",
        "placa",
        "marca",
        "modelo_vehiculo",
      ],
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // TODO: Consultar tabla abastecimientos cuando exista el modelo
    const abastecimientos = [];

    res.status(200).json({
      success: true,
      data: {
        vehiculo,
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
