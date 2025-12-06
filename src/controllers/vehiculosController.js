/**
 * vehiculosController.js
 * Controlador de Vehículos
 * Gestiona el CRUD de vehículos del sistema de seguridad
 * Incluye gestión de abastecimiento de combustible
 */

import {
  Vehiculo,
  TipoVehiculo,
  PersonalSeguridad,
  AbastecimientoCombustible,
  Novedad,
} from "../models/index.js";
import { Op } from "sequelize";

/**
 * Obtener todos los vehículos
 * Permisos: todos los usuarios autenticados
 * @route GET /api/vehiculos
 */
exports.getAllVehiculos = async (req, res) => {
  try {
    const { tipo_id, estado, search } = req.query;

    // Construir filtros
    const whereClause = {
      deleted_at: null,
    };

    if (tipo_id) {
      whereClause.tipo_id = tipo_id;
    }

    if (estado) {
      whereClause.estado = estado;
    }

    // Búsqueda por placa o código
    if (search) {
      whereClause[Op.or] = [
        { placa: { [Op.like]: `%${search}%` } },
        { codigo_vehiculo: { [Op.like]: `%${search}%` } },
        { nombre: { [Op.like]: `%${search}%` } },
      ];
    }

    const vehiculos = await Vehiculo.findAll({
      where: whereClause,
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["id", "nombre", "descripcion"],
        },
        {
          model: PersonalSeguridad,
          as: "personal_asignado",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
      ],
      order: [["codigo_vehiculo", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: vehiculos,
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
 * Obtener un vehículo por ID
 * Permisos: todos los usuarios autenticados
 * @route GET /api/vehiculos/:id
 */
exports.getVehiculoById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehiculo = await Vehiculo.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
        },
        {
          model: PersonalSeguridad,
          as: "personal_asignado",
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
 * Permisos: supervisor, administrador
 * @route POST /api/vehiculos
 */
exports.createVehiculo = async (req, res) => {
  try {
    const {
      tipo_id,
      codigo_vehiculo,
      nombre,
      placa,
      marca,
      soat,
      fec_soat,
      fec_manten,
    } = req.body;

    // Validar campos requeridos
    if (!tipo_id || !placa) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: tipo_id, placa",
      });
    }

    // Verificar si la placa ya existe
    const placaExistente = await Vehiculo.findOne({
      where: { placa, deleted_at: null },
    });

    if (placaExistente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un vehículo con esta placa",
      });
    }

    // Generar código automático si no se proporciona
    let codigoFinal = codigo_vehiculo;
    if (!codigoFinal) {
      const tipoVehiculo = await TipoVehiculo.findByPk(tipo_id);

      // Determinar prefijo según tipo
      let prefijo = "V"; // Por defecto
      if (tipoVehiculo) {
        if (tipoVehiculo.nombre.toLowerCase().includes("móvil")) prefijo = "M";
        else if (tipoVehiculo.nombre.toLowerCase().includes("moto"))
          prefijo = "H";
        else if (tipoVehiculo.nombre.toLowerCase().includes("camión"))
          prefijo = "C";
      }

      // Buscar último código con ese prefijo
      const ultimoVehiculo = await Vehiculo.findOne({
        where: {
          codigo_vehiculo: { [Op.like]: `${prefijo}-%` },
          deleted_at: null,
        },
        order: [["codigo_vehiculo", "DESC"]],
      });

      let siguienteNumero = 1;
      if (ultimoVehiculo) {
        const numeroActual = parseInt(
          ultimoVehiculo.codigo_vehiculo.split("-")[1]
        );
        siguienteNumero = numeroActual + 1;
      }

      codigoFinal = `${prefijo}-${String(siguienteNumero).padStart(2, "0")}`;
    }

    // Crear vehículo
    const nuevoVehiculo = await Vehiculo.create({
      tipo_id,
      codigo_vehiculo: codigoFinal,
      nombre,
      placa: placa.toUpperCase(),
      marca,
      soat,
      fec_soat,
      fec_manten,
      created_by: req.user.id,
    });

    // Obtener vehículo con relaciones
    const vehiculoCompleto = await Vehiculo.findByPk(nuevoVehiculo.id, {
      include: [{ model: TipoVehiculo, as: "tipo" }],
    });

    res.status(201).json({
      success: true,
      message: "Vehículo creado exitosamente",
      data: vehiculoCompleto,
    });
  } catch (error) {
    console.error("Error al crear vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el vehículo",
      error: error.message,
    });
  }
};

/**
 * Actualizar un vehículo
 * Permisos: supervisor, administrador
 * @route PUT /api/vehiculos/:id
 */
exports.updateVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const vehiculo = await Vehiculo.findOne({
      where: { id, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Verificar placa duplicada si se está cambiando
    if (
      datosActualizacion.placa &&
      datosActualizacion.placa !== vehiculo.placa
    ) {
      const placaExistente = await Vehiculo.findOne({
        where: {
          placa: datosActualizacion.placa,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (placaExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro vehículo con esta placa",
        });
      }
    }

    // Actualizar vehículo
    await vehiculo.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    // Obtener vehículo actualizado
    const vehiculoActualizado = await Vehiculo.findByPk(id, {
      include: [
        { model: TipoVehiculo, as: "tipo" },
        { model: PersonalSeguridad, as: "personal_asignado" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Vehículo actualizado exitosamente",
      data: vehiculoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el vehículo",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) un vehículo
 * Permisos: administrador
 * @route DELETE /api/vehiculos/:id
 */
exports.deleteVehiculo = async (req, res) => {
  try {
    const { id } = req.params;

    const vehiculo = await Vehiculo.findOne({
      where: { id, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Soft delete
    await vehiculo.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: req.user.id,
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
 * Registrar abastecimiento de combustible
 * Permisos: operador, supervisor, administrador
 * @route POST /api/vehiculos/:id/abastecimiento
 */
exports.registrarAbastecimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha_hora,
      tipo_combustible,
      km_llegada,
      cantidad,
      unidad,
      importe,
      precio_unitario,
      grifo_nombre,
      grifo_ruc,
      factura_boleta,
      moneda,
      personal_id,
      observaciones,
    } = req.body;

    // Validar campos requeridos
    if (!fecha_hora || !tipo_combustible || !km_llegada || !cantidad) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    // Verificar que el vehículo existe
    const vehiculo = await Vehiculo.findOne({
      where: { id, deleted_at: null },
    });

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Crear registro de abastecimiento
    const abastecimiento = await AbastecimientoCombustible.create({
      vehiculo_id: id,
      fecha_hora,
      tipo_combustible,
      km_llegada,
      cantidad,
      unidad: unidad || "LITROS",
      importe,
      precio_unitario,
      grifo_nombre,
      grifo_ruc,
      factura_boleta,
      moneda: moneda || "PEN",
      personal_id: personal_id || req.user.id,
      observaciones,
      created_by: req.user.id,
    });

    // Obtener abastecimiento con relaciones
    const abastecimientoCompleto = await AbastecimientoCombustible.findByPk(
      abastecimiento.id,
      {
        include: [
          {
            model: Vehiculo,
            as: "vehiculo",
            attributes: ["id", "codigo_vehiculo", "placa"],
          },
          {
            model: PersonalSeguridad,
            as: "personal",
            attributes: ["id", "nombres", "apellido_paterno"],
          },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Abastecimiento registrado exitosamente",
      data: abastecimientoCompleto,
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
 * Permisos: todos los usuarios autenticados
 * @route GET /api/vehiculos/:id/abastecimientos
 */
exports.getHistorialAbastecimientos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, limit = 50 } = req.query;

    const whereClause = {
      vehiculo_id: id,
      estado: 1,
      deleted_at: null,
    };

    // Filtro por rango de fechas
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_hora = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    const abastecimientos = await AbastecimientoCombustible.findAll({
      where: whereClause,
      include: [
        {
          model: PersonalSeguridad,
          as: "personal",
          attributes: ["id", "nombres", "apellido_paterno"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
      limit: parseInt(limit),
    });

    // Calcular estadísticas
    const totalGalones = abastecimientos.reduce((sum, a) => {
      const cantidad = a.unidad === "GALONES" ? a.cantidad : a.cantidad / 3.785;
      return sum + parseFloat(cantidad);
    }, 0);

    const totalImporte = abastecimientos.reduce(
      (sum, a) => sum + parseFloat(a.importe || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: abastecimientos,
      estadisticas: {
        total_registros: abastecimientos.length,
        total_galones: totalGalones.toFixed(2),
        total_importe: totalImporte.toFixed(2),
        promedio_por_carga:
          abastecimientos.length > 0
            ? (totalImporte / abastecimientos.length).toFixed(2)
            : 0,
      },
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

/**
 * Obtener vehículos disponibles (sin asignar a novedades activas)
 * Permisos: operador, supervisor, administrador
 * @route GET /api/vehiculos/disponibles
 */
exports.getVehiculosDisponibles = async (req, res) => {
  try {
    // Obtener IDs de vehículos actualmente asignados
    const vehiculosAsignados = await Novedad.findAll({
      where: {
        vehiculo_id: { [Op.ne]: null },
        estado_novedad_id: {
          [Op.notIn]: [
            /* IDs de estados finales */
          ],
        },
        estado: 1,
        deleted_at: null,
      },
      attributes: ["vehiculo_id"],
      raw: true,
    });

    const idsAsignados = vehiculosAsignados.map((n) => n.vehiculo_id);

    // Obtener vehículos disponibles
    const vehiculosDisponibles = await Vehiculo.findAll({
      where: {
        id: { [Op.notIn]: idsAsignados },
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
        },
      ],
      order: [["codigo_vehiculo", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: vehiculosDisponibles,
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

export default exports;
