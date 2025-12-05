/**
 * personalController.js
 * Controlador de Personal de Seguridad
 * Gestiona el CRUD del personal del sistema de seguridad ciudadana
 */

const { PersonalSeguridad, Cargo, Ubigeo, Vehiculo } = require("../models");
const { Op } = require("sequelize");

/**
 * Obtener todo el personal con filtros
 * Permisos: todos los usuarios autenticados
 * @route GET /api/personal
 */
exports.getAllPersonal = async (req, res) => {
  try {
    const { cargo_id, status, search, page = 1, limit = 50 } = req.query;

    // Construir filtros
    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    if (cargo_id) {
      whereClause.cargo_id = cargo_id;
    }

    if (status) {
      whereClause.status = status;
    }

    // Búsqueda por nombre, apellidos o documento
    if (search) {
      whereClause[Op.or] = [
        { nombres: { [Op.like]: `%${search}%` } },
        { apellido_paterno: { [Op.like]: `%${search}%` } },
        { apellido_materno: { [Op.like]: `%${search}%` } },
        { doc_numero: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await PersonalSeguridad.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["id", "nombre"],
        },
        {
          model: Ubigeo,
          as: "ubigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
        {
          model: Vehiculo,
          as: "vehiculo_asignado",
          attributes: ["id", "codigo_vehiculo", "placa"],
        },
      ],
      order: [
        ["apellido_paterno", "ASC"],
        ["apellido_materno", "ASC"],
        ["nombres", "ASC"],
      ],
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
    console.error("Error al obtener personal:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el personal",
      error: error.message,
    });
  }
};

/**
 * Obtener personal por ID
 * Permisos: todos los usuarios autenticados
 * @route GET /api/personal/:id
 */
exports.getPersonalById = async (req, res) => {
  try {
    const { id } = req.params;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
      include: [
        { model: Cargo, as: "cargo" },
        { model: Ubigeo, as: "ubigeo" },
        { model: Vehiculo, as: "vehiculo_asignado" },
      ],
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: personal,
    });
  } catch (error) {
    console.error("Error al obtener personal:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el personal",
      error: error.message,
    });
  }
};

/**
 * Crear nuevo personal
 * Permisos: supervisor, administrador
 * @route POST /api/personal
 */
exports.createPersonal = async (req, res) => {
  try {
    const {
      doc_tipo,
      doc_numero,
      apellido_paterno,
      apellido_materno,
      nombres,
      sexo,
      fecha_nacimiento,
      nacionalidad,
      direccion,
      ubigeo_code,
      cargo_id,
      fecha_ingreso,
      status,
      licencia,
      categoria,
      vigencia,
      regimen,
      vehiculo_id,
      codigo_acceso,
      foto,
    } = req.body;

    // Validar campos requeridos
    if (!doc_numero || !apellido_paterno || !apellido_materno || !nombres) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: doc_numero, apellido_paterno, apellido_materno, nombres",
      });
    }

    // Verificar si el documento ya existe
    const personalExistente = await PersonalSeguridad.findOne({
      where: {
        doc_numero,
        doc_tipo: doc_tipo || "DNI",
        deleted_at: null,
      },
    });

    if (personalExistente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe personal registrado con este número de documento",
      });
    }

    // Crear personal
    const nuevoPersonal = await PersonalSeguridad.create({
      doc_tipo: doc_tipo || "DNI",
      doc_numero,
      apellido_paterno,
      apellido_materno,
      nombres,
      sexo,
      fecha_nacimiento,
      nacionalidad,
      direccion,
      ubigeo_code,
      cargo_id,
      fecha_ingreso: fecha_ingreso || new Date(),
      status: status || "Activo",
      licencia,
      categoria,
      vigencia,
      regimen,
      vehiculo_id,
      codigo_acceso,
      foto,
      created_by: req.user.id,
    });

    // Obtener personal completo con relaciones
    const personalCompleto = await PersonalSeguridad.findByPk(
      nuevoPersonal.id,
      {
        include: [
          { model: Cargo, as: "cargo" },
          { model: Ubigeo, as: "ubigeo" },
          { model: Vehiculo, as: "vehiculo_asignado" },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Personal creado exitosamente",
      data: personalCompleto,
    });
  } catch (error) {
    console.error("Error al crear personal:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el personal",
      error: error.message,
    });
  }
};

/**
 * Actualizar personal existente
 * Permisos: supervisor, administrador
 * @route PUT /api/personal/:id
 */
exports.updatePersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    // Verificar documento duplicado si se está cambiando
    if (
      datosActualizacion.doc_numero &&
      datosActualizacion.doc_numero !== personal.doc_numero
    ) {
      const docExistente = await PersonalSeguridad.findOne({
        where: {
          doc_numero: datosActualizacion.doc_numero,
          doc_tipo: datosActualizacion.doc_tipo || personal.doc_tipo,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (docExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro personal con este número de documento",
        });
      }
    }

    // Actualizar personal
    await personal.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    // Obtener personal actualizado
    const personalActualizado = await PersonalSeguridad.findByPk(id, {
      include: [
        { model: Cargo, as: "cargo" },
        { model: Ubigeo, as: "ubigeo" },
        { model: Vehiculo, as: "vehiculo_asignado" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Personal actualizado exitosamente",
      data: personalActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar personal:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el personal",
      error: error.message,
    });
  }
};

/**
 * Cambiar estado del personal (Activo/Inactivo/Suspendido/Retirado)
 * Permisos: supervisor, administrador
 * @route PATCH /api/personal/:id/estado
 */
exports.cambiarEstadoPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, fecha_baja, motivo } = req.body;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    // Validar estado
    const estadosValidos = ["Activo", "Inactivo", "Suspendido", "Retirado"];
    if (!estadosValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados válidos: ${estadosValidos.join(
          ", "
        )}`,
      });
    }

    await personal.update({
      status,
      fecha_baja: ["Retirado", "Inactivo"].includes(status)
        ? fecha_baja || new Date()
        : null,
      updated_by: req.user.id,
    });

    // Registrar en historial si existe tabla de auditoría
    // await HistorialPersonal.create({ ... });

    res.status(200).json({
      success: true,
      message: `Estado del personal cambiado a: ${status}`,
      data: personal,
    });
  } catch (error) {
    console.error("Error al cambiar estado del personal:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado del personal",
      error: error.message,
    });
  }
};

/**
 * Eliminar personal (soft delete)
 * Permisos: administrador
 * @route DELETE /api/personal/:id
 */
exports.deletePersonal = async (req, res) => {
  try {
    const { id } = req.params;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    // Soft delete
    await personal.update({
      estado: 0,
      status: "Retirado",
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Personal eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar personal:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el personal",
      error: error.message,
    });
  }
};

/**
 * Obtener personal disponible (activo y sin vehículo asignado)
 * Permisos: operador, supervisor, administrador
 * @route GET /api/personal/disponibles
 */
exports.getPersonalDisponible = async (req, res) => {
  try {
    const personalDisponible = await PersonalSeguridad.findAll({
      where: {
        status: "Activo",
        vehiculo_id: null,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["id", "nombre"],
        },
      ],
      order: [
        ["apellido_paterno", "ASC"],
        ["nombres", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: personalDisponible,
    });
  } catch (error) {
    console.error("Error al obtener personal disponible:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener personal disponible",
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas del personal
 * Permisos: supervisor, administrador
 * @route GET /api/personal/stats
 */
exports.getEstadisticasPersonal = async (req, res) => {
  try {
    const { sequelize } = require("../models");

    // Total por estado
    const porEstado = await PersonalSeguridad.findAll({
      where: { estado: 1, deleted_at: null },
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["status"],
    });

    // Total por cargo
    const porCargo = await PersonalSeguridad.findAll({
      where: { status: "Activo", estado: 1, deleted_at: null },
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["nombre"],
        },
      ],
      attributes: [
        "cargo_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["cargo_id"],
    });

    // Personal con vehículo asignado
    const conVehiculo = await PersonalSeguridad.count({
      where: {
        status: "Activo",
        vehiculo_id: { [Op.ne]: null },
        estado: 1,
        deleted_at: null,
      },
    });

    const sinVehiculo = await PersonalSeguridad.count({
      where: {
        status: "Activo",
        vehiculo_id: null,
        estado: 1,
        deleted_at: null,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        porEstado,
        porCargo,
        asignacionVehiculos: {
          conVehiculo,
          sinVehiculo,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del personal",
      error: error.message,
    });
  }
};

module.exports = exports;
