/**
 * ===================================================
 * CONTROLLER: OperativosPersonal
 * ===================================================
 *
 * Ruta: src/controllers/operativosPersonalController.js
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @version 2.2.2
 * @date 2026-01-17
 *
 * Descripcion:
 * Gestiona las operaciones CRUD para el personal asignado a patrullaje a pie
 * en los turnos operativos. Similar a OperativosVehiculos pero para personal
 * que patrulla a pie (serenazgo, policía, guardias, etc.).
 *
 * Endpoints:
 * - GET /: Obtener todos los registros de personal operativo con filtros y paginación.
 * - GET /:turnoId/personal: Obtener todo el personal de un turno.
 * - GET /:turnoId/personal/:id: Obtener un registro específico de personal.
 * - POST /:turnoId/personal: Asignar nuevo personal a un turno.
 * - PUT /personal/:id: Actualizar información de personal en un turno.
 * - DELETE /personal/:id: Eliminar asignación de personal de un turno.
 *
 * Cuadrantes:
 * - GET /personal/:id/cuadrantes: Obtener cuadrantes asignados al personal.
 * - POST /personal/:id/cuadrantes: Asignar un cuadrante al personal.
 * - PUT /personal/:id/cuadrantes/:cuadranteId: Actualizar asignación de cuadrante.
 * - DELETE /personal/:id/cuadrantes/:cuadranteId: Eliminar asignación de cuadrante.
 */

import models from "../models/index.js";
const {
  OperativosPersonal,
  OperativosPersonalCuadrantes,
  OperativosTurno,
  PersonalSeguridad,
  Cuadrante,
  Usuario,
  RadioTetra,
  EstadoOperativoRecurso,
  Sector,
} = models;
import { Op } from "sequelize";

/**
 * Obtener todos los registros de personal operativo con filtros y paginación
 * GET /api/v1/operativos-personal
 */
export const getAllPersonal = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      turno_id,
      personal_id,
      sereno_id,
      tipo_patrullaje,
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
    if (personal_id) whereClause.personal_id = personal_id;
    if (sereno_id) whereClause.sereno_id = sereno_id;
    if (tipo_patrullaje) whereClause.tipo_patrullaje = tipo_patrullaje;
    if (estado_operativo_id) whereClause.estado_operativo_id = estado_operativo_id;

    // Búsqueda por texto en nombre del personal o sereno
    if (search) {
      whereClause[Op.or] = [
        { "$personal.nombres$": { [Op.like]: `%${search}%` } },
        { "$personal.apellido_paterno$": { [Op.like]: `%${search}%` } },
        { "$personal.apellido_materno$": { [Op.like]: `%${search}%` } },
        { "$sereno.nombres$": { [Op.like]: `%${search}%` } },
        { "$sereno.apellido_paterno$": { [Op.like]: `%${search}%` } },
        { "$sereno.apellido_materno$": { [Op.like]: `%${search}%` } },
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
        model: PersonalSeguridad,
        as: "personal",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
      },
      {
        model: PersonalSeguridad,
        as: "sereno",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
      },
      {
        model: RadioTetra,
        as: "radio_tetra",
        attributes: ["id", "radio_tetra_code", "descripcion", "fecha_fabricacion", "estado"],
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
        as: "creadorOperativosPersonal",
        attributes: ["id", "username", "nombres", "apellidos"],
        required: false,
      },
      {
        model: Usuario,
        as: "actualizadorOperativosPersonal",
        attributes: ["id", "username", "nombres", "apellidos"],
        required: false,
      },
      {
        model: Usuario,
        as: "eliminadorOperativosPersonal",
        attributes: ["id", "username", "nombres", "apellidos"],
        required: false,
      },
    ];

    const { count, rows } = await OperativosPersonal.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    res.status(200).json({
      success: true,
      message: "Personal operativo obtenido exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el personal operativo",
      error: error.message,
    });
  }
};

/**
 * Obtener todo el personal asignado a un turno operativo
 * GET /:turnoId/personal
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAllPersonalByTurno = async (req, res) => {
  const { turnoId } = req.params;

  try {
    const turno = await OperativosTurno.findByPk(turnoId);
    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    const personal = await OperativosPersonal.findAll({
      where: {
        operativo_turno_id: turnoId,
        deleted_at: null,
        estado_registro: 1,
      },
      include: [
        {
          model: PersonalSeguridad,
          as: "personal",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: PersonalSeguridad,
          as: "sereno",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: EstadoOperativoRecurso,
          as: "estado_operativo",
          attributes: ["id", "descripcion"],
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
      data: personal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Obtener un registro específico de personal por ID dentro de un turno
 * GET /:turnoId/personal/:id
 */
export const getPersonalById = async (req, res) => {
  const { turnoId, id } = req.params;

  try {
    const turno = await OperativosTurno.findByPk(turnoId);
    if (!turno) {
      return res.status(404).json({
        success: false,
        message: "Turno no encontrado",
      });
    }

    const personal = await OperativosPersonal.findOne({
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
          model: PersonalSeguridad,
          as: "personal",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: PersonalSeguridad,
          as: "sereno",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "doc_tipo", "doc_numero"],
        },
        {
          model: EstadoOperativoRecurso,
          as: "estado_operativo",
          attributes: ["id", "descripcion"],
        },
        {
          model: RadioTetra,
          as: "radio_tetra",
          attributes: ["id", "radio_tetra_code", "descripcion"],
        },
        {
          model: Usuario,
          as: "creadorOperativosPersonal",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "actualizadorOperativosPersonal",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "eliminadorOperativosPersonal",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
      ],
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Registro de personal no encontrado en este turno",
      });
    }

    res.status(200).json({
      success: true,
      data: personal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva asignación de personal a un turno
 * POST /:turnoId/personal
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createPersonalInTurno = async (req, res) => {
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

    // Validar que el personal no esté ya asignado al turno (solo registros activos)
    if (req.body.personal_id) {
      const personalExistente = await OperativosPersonal.findOne({
        where: {
          operativo_turno_id: turnoId,
          personal_id: req.body.personal_id,
          estado_registro: 1,
          deleted_at: null,
        },
      });

      if (personalExistente) {
        return res.status(400).json({
          success: false,
          message: "Personal ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }
    }

    // Validar que el sereno/compañero no sea el mismo que el personal principal
    if (req.body.sereno_id && req.body.personal_id === req.body.sereno_id) {
      return res.status(400).json({
        success: false,
        message: "El compañero de patrullaje debe ser diferente al personal principal",
      });
    }

    const newPersonalAsignado = await OperativosPersonal.create({
      ...req.body,
      operativo_turno_id: turnoId,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: "Personal asignado al turno correctamente",
      data: newPersonalAsignado,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintName = error.parent?.constraint;
      const fields = error.fields || {};

      if (constraintName === "uq_turno_personal" || fields.personal_id) {
        return res.status(400).json({
          success: false,
          message: "Personal ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }

      // Error genérico de unicidad
      return res.status(400).json({
        success: false,
        message: "Personal ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
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
      message: "Error al asignar el personal",
      error: error.message,
    });
  }
};

/**
 * Actualizar una asignación de personal en un turno
 * PUT /personal/:id
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updatePersonalInTurno = async (req, res) => {
  const { id } = req.params;
  const { id: updated_by } = req.user;

  try {
    const personalAsignado = await OperativosPersonal.findByPk(id);
    if (!personalAsignado) {
      return res.status(404).json({
        success: false,
        message: "Asignación de personal no encontrada",
      });
    }

    // Validar que el personal no esté ya asignado al turno (solo registros activos, excluyendo el actual)
    if (req.body.personal_id) {
      const personalExistente = await OperativosPersonal.findOne({
        where: {
          operativo_turno_id: personalAsignado.operativo_turno_id,
          personal_id: req.body.personal_id,
          estado_registro: 1,
          deleted_at: null,
          id: { [Op.ne]: id }, // Excluir el registro actual
        },
      });

      if (personalExistente) {
        return res.status(400).json({
          success: false,
          message: "Personal ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }
    }

    // Validar que el sereno/compañero no sea el mismo que el personal principal
    const personalPrincipalId = req.body.personal_id || personalAsignado.personal_id;
    const serenoId = req.body.sereno_id !== undefined ? req.body.sereno_id : personalAsignado.sereno_id;

    if (serenoId && personalPrincipalId === serenoId) {
      return res.status(400).json({
        success: false,
        message: "El compañero de patrullaje debe ser diferente al personal principal",
      });
    }

    await personalAsignado.update({
      ...req.body,
      updated_by,
    });

    res.status(200).json({
      success: true,
      message: "Asignación de personal actualizada correctamente",
      data: personalAsignado,
    });
  } catch (error) {
    // Constraints de unicidad
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintName = error.parent?.constraint;
      const fields = error.fields || {};

      if (constraintName === "uq_turno_personal" || fields.personal_id) {
        return res.status(400).json({
          success: false,
          message: "Personal ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Personal ya ha sido asignado en el mismo sector, turno y fecha de los Operativos",
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
 * Eliminar (soft delete) una asignación de personal de un turno
 * DELETE /personal/:id
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deletePersonalInTurno = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const personalAsignado = await OperativosPersonal.findOne({
      where: { id, deleted_at: null, estado_registro: 1 },
    });

    if (!personalAsignado) {
      return res.status(404).json({
        success: false,
        message: "Asignación de personal no encontrada",
      });
    }

    // Soft delete usando el hook beforeDestroy
    await personalAsignado.destroy({
      userId: userId,
    });

    res.status(200).json({
      success: true,
      message: "Asignación de personal eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar la asignación",
      error: error.message,
    });
  }
};

// ============================================================
// MÉTODOS PARA CUADRANTES DEL PERSONAL
// ============================================================

/**
 * Obtener los cuadrantes asignados a un personal
 * GET /personal/:id/cuadrantes
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getCuadrantesByPersonalAsignado = async (req, res) => {
  const { id } = req.params;

  try {
    const asignacion = await OperativosPersonal.findByPk(id, {
      include: [
        {
          model: OperativosPersonalCuadrantes,
          as: "cuadrantesAsignados",
          attributes: [
            "id",
            "operativo_personal_id",
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
              as: "creadorOperativosPersonalCuadrantes",
              attributes: ["id", "username", "nombres", "apellidos"]
            },
            {
              model: Usuario,
              as: "actualizadorOperativosPersonalCuadrantes",
              attributes: ["id", "username", "nombres", "apellidos"]
            },
            {
              model: Usuario,
              as: "eliminadorOperativosPersonalCuadrantes",
              attributes: ["id", "username", "nombres", "apellidos"]
            },
          ],
        },
      ],
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Asignación de personal no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: asignacion.cuadrantesAsignados,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los cuadrantes del personal",
      error: error.message,
    });
  }
};

/**
 * Asignar un cuadrante a un personal
 * POST /personal/:id/cuadrantes
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createCuadranteForPersonal = async (req, res) => {
  const { id } = req.params; // id de OperativosPersonal
  const { cuadrante_id, hora_ingreso } = req.body;
  const { id: created_by } = req.user;

  try {
    // Verificar que la asignación del personal exista
    const personalAsignado = await OperativosPersonal.findByPk(id);
    if (!personalAsignado) {
      return res.status(404).json({
        success: false,
        message: "Asignación de personal no encontrada",
      });
    }

    // Crear la nueva asignación de cuadrante
    const nuevoCuadranteAsignado = await OperativosPersonalCuadrantes.create({
      operativo_personal_id: id,
      cuadrante_id,
      hora_ingreso,
      created_by,
    });

    // Recargar con datos completos para respuesta
    const cuadranteCompleto = await OperativosPersonalCuadrantes.findByPk(nuevoCuadranteAsignado.id, {
      include: [
        {
          model: Cuadrante,
          as: "datosCuadrante",
        },
        {
          model: Usuario,
          as: "creadorOperativosPersonalCuadrantes",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Cuadrante asignado al personal correctamente",
      data: cuadranteCompleto,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al asignar el cuadrante al personal",
      error: error.message,
    });
  }
};

/**
 * Actualizar una asignación de cuadrante a un personal
 * PUT /personal/:id/cuadrantes/:cuadranteId
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateCuadranteForPersonal = async (req, res) => {
  const { id, cuadranteId } = req.params;
  const { hora_salida, observaciones, incidentes_reportados } = req.body;
  const { id: updated_by } = req.user;

  try {
    const asignacion = await OperativosPersonalCuadrantes.findOne({
      where: {
        operativo_personal_id: id,
        id: cuadranteId,
      },
      attributes: [
        "id",
        "operativo_personal_id",
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
      observaciones,
      incidentes_reportados,
      updated_by,
    });

    // Recargar con datos completos para respuesta
    const asignacionActualizada = await OperativosPersonalCuadrantes.findByPk(asignacion.id, {
      include: [
        {
          model: Cuadrante,
          as: "datosCuadrante",
        },
        {
          model: Usuario,
          as: "creadorOperativosPersonalCuadrantes",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
        {
          model: Usuario,
          as: "actualizadorOperativosPersonalCuadrantes",
          attributes: ["id", "username", "nombres", "apellidos"]
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Asignación de cuadrante actualizada correctamente",
      data: asignacionActualizada,
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
 * Eliminar (soft delete) una asignación de cuadrante de un personal
 * DELETE /personal/:id/cuadrantes/:cuadranteId
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteCuadranteForPersonal = async (req, res) => {
  const { id, cuadranteId } = req.params;
  const { id: deleted_by } = req.user;

  try {
    const asignacion = await OperativosPersonalCuadrantes.findOne({
      where: {
        operativo_personal_id: id,
        id: cuadranteId,
      },
      attributes: [
        "id",
        "operativo_personal_id",
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
