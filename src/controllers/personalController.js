/**
 * ===================================================
 * CONTROLADOR: PersonalSeguridad
 * ===================================================
 *
 * Ruta: src/controllers/personalController.js
 *
 * VERSIÓN: 2.2.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Eliminados console.logs de debugging innecesarios
 * ✅ Eliminada validación de categoría (ahora en rutas)
 * ✅ Mantenidos solo logs de errores críticos
 * ✅ Código limpio y profesional
 * ✅ Documentación actualizada
 *
 * VERSIONES ANTERIORES:
 * - v2.1.1: Eliminados logs de depuración
 * - v2.1.0: Validación de categoría en actualizarLicencia
 * - v2.0.0: Refactorización completa
 *
 * Características:
 * - CRUD completo de personal
 * - Búsquedas especializadas
 * - Gestión de licencias
 * - Asignación de vehículos
 * - Estadísticas y reportes
 * - Soft delete
 *
 * @module controllers/personalController
 * @version 2.2.0
 * @date 2025-12-14
 */

import {
  PersonalSeguridad,
  Cargo,
  Ubigeo,
  Vehiculo,
  TipoVehiculo,
  Usuario,
  Novedad,
  TipoNovedad,
  EstadoNovedad,
} from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// ==========================================
// CRUD BÁSICO
// ==========================================

/**
 * Obtener todos los registros de personal con filtros y paginación
 * GET /api/v1/personal
 */
export const getAllPersonal = async (req, res) => {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`🔥 [${timestamp}] DEBUG: getAllPersonal INICIO`);
    console.log(`🔥 [${timestamp}] DEBUG: Query params:`, JSON.stringify(req.query, null, 2));
    console.log(`🔥 [${timestamp}] DEBUG: Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`🔥 [${timestamp}] DEBUG: Request URL: ${req.originalUrl}`);
    
    const {
      page = 1,
      limit = 20,
      search,
      cargo_id,
      status,
      doc_tipo,
      regimen,
      tiene_licencia,
      tiene_vehiculo,
      ubigeo_code,
      sort = "apellido_paterno",
      order = "ASC",
    } = req.query;

    console.log(`🔥 [${timestamp}] DEBUG: Parámetros procesados - page: ${page}, limit: ${limit}`);

    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    if (search) {
      whereClause[Op.or] = [
        { nombres: { [Op.like]: `%${search}%` } },
        { apellido_paterno: { [Op.like]: `%${search}%` } },
        { apellido_materno: { [Op.like]: `%${search}%` } },
        { doc_numero: { [Op.like]: `%${search}%` } },
        { codigo_acceso: { [Op.like]: `%${search}%` } },
      ];
      console.log(`🔥 [${timestamp}] DEBUG: Aplicando búsqueda por: ${search}`);
    }

    if (cargo_id) whereClause.cargo_id = cargo_id;
    if (status) whereClause.status = status;
    if (doc_tipo) whereClause.doc_tipo = doc_tipo;
    if (regimen) whereClause.regimen = regimen;
    if (ubigeo_code) whereClause.ubigeo_code = ubigeo_code;

    if (tiene_licencia === "true") {
      whereClause.licencia = { [Op.ne]: null };
    } else if (tiene_licencia === "false") {
      whereClause.licencia = null;
    }

    if (tiene_vehiculo === "true") {
      whereClause.vehiculo_id = { [Op.ne]: null };
    } else if (tiene_vehiculo === "false") {
      whereClause.vehiculo_id = null;
    }

    const offset = (page - 1) * limit;
    const sortFields = [
      "apellido_paterno",
      "apellido_materno",
      "nombres",
      "doc_numero",
      "fecha_ingreso",
      "status",
      "codigo_acceso",
      "created_at",
    ];
    const orderField = sortFields.includes(sort) ? sort : "apellido_paterno";
    const orderDir = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const { count, rows } = await PersonalSeguridad.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
        {
          model: Ubigeo,
          as: "PersonalSeguridadUbigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
        {
          model: Vehiculo,
          as: "PersonalSeguridadVehiculo",
          attributes: [
            "id",
            "codigo_vehiculo",
            "placa",
            "marca",
            "modelo_vehiculo",
          ],
        },
      ],
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    res.status(200).json({
      success: true,
      message: "Personal obtenido exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error en getAllPersonal:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el personal",
      error: error.message,
    });
  }
};

/**
 * Obtener un personal por ID
 * GET /api/v1/personal/:id
 */
export const getPersonalById = async (req, res) => {
  try {
    const { id } = req.params;

    const personal = await PersonalSeguridad.findOne({
      where: {
        id,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
        {
          model: Ubigeo,
          as: "PersonalSeguridadUbigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
        {
          model: Vehiculo,
          as: "PersonalSeguridadVehiculo",
          attributes: [
            "id",
            "codigo_vehiculo",
            "placa",
            "marca",
            "modelo_vehiculo",
            "tipo_id",
          ],
          include: [
            {
              model: TipoVehiculo,
              as: "tipoVehiculo",
              attributes: ["id", "nombre"],
            },
          ],
        },
        {
          model: Usuario,
          as: "creadorPersonalSeguridad",
          attributes: ["id", "username"],
        },
        {
          model: Usuario,
          as: "actualizadorPersonalSeguridad",
          attributes: ["id", "username"],
        },
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
      message: "Personal obtenido exitosamente",
      data: personal,
    });
  } catch (error) {
    console.error("❌ Error en getPersonalById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el personal",
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo personal
 * POST /api/v1/personal
 */
export const createPersonal = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const datosPersonal = req.body;

    const personalExistente = await PersonalSeguridad.findOne({
      where: {
        doc_tipo: datosPersonal.doc_tipo,
        doc_numero: datosPersonal.doc_numero,
        estado: 1,
        deleted_at: null,
      },
      transaction,
    });

    if (personalExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Ya existe un personal con ${datosPersonal.doc_tipo}: ${datosPersonal.doc_numero}`,
      });
    }

    if (datosPersonal.cargo_id) {
      const cargoExiste = await Cargo.findByPk(datosPersonal.cargo_id, {
        transaction,
      });
      if (!cargoExiste) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "El cargo especificado no existe",
        });
      }
    }

    if (datosPersonal.ubigeo_code) {
      const ubigeoExiste = await Ubigeo.findOne({
        where: { ubigeo_code: datosPersonal.ubigeo_code },
        transaction,
      });
      if (!ubigeoExiste) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "El código de ubigeo especificado no existe",
        });
      }
    }

    if (datosPersonal.vehiculo_id) {
      const vehiculo = await Vehiculo.findOne({
        where: {
          id: datosPersonal.vehiculo_id,
          estado_operativo: "DISPONIBLE",
          estado: 1,
          deleted_at: null,
        },
        transaction,
      });

      if (!vehiculo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "El vehículo especificado no existe o no está disponible",
        });
      }

      if (!datosPersonal.licencia || !datosPersonal.vigencia) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Para asignar un vehículo, el personal debe tener licencia y vigencia",
        });
      }

      if (new Date(datosPersonal.vigencia) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "No se puede asignar un vehículo con licencia vencida",
        });
      }
    }

    const nuevoPersonal = await PersonalSeguridad.create(
      {
        ...datosPersonal,
        created_by: req.user.id,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    const personalCompleto = await PersonalSeguridad.findByPk(
      nuevoPersonal.id,
      {
        include: [
          {
            model: Cargo,
            as: "PersonalSeguridadCargo",
            attributes: ["id", "nombre"],
          },
          {
            model: Ubigeo,
            as: "PersonalSeguridadUbigeo",
            attributes: [
              "ubigeo_code",
              "departamento",
              "provincia",
              "distrito",
            ],
          },
          {
            model: Vehiculo,
            as: "PersonalSeguridadVehiculo",
            attributes: ["id", "codigo_vehiculo", "placa"],
          },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Personal creado exitosamente",
      data: personalCompleto,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("❌ Error en createPersonal:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear el personal",
      error: error.message,
    });
  }
};

/**
 * Actualizar un personal existente
 * PUT /api/v1/personal/:id
 */
export const updatePersonal = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!personal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    if (datosActualizacion.doc_tipo || datosActualizacion.doc_numero) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "No se permite cambiar el tipo o número de documento de identidad",
      });
    }

    if (datosActualizacion.cargo_id) {
      const cargoExiste = await Cargo.findByPk(datosActualizacion.cargo_id, {
        transaction,
      });
      if (!cargoExiste) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "El cargo especificado no existe",
        });
      }
    }

    if (datosActualizacion.ubigeo_code) {
      const ubigeoExiste = await Ubigeo.findOne({
        where: { ubigeo_code: datosActualizacion.ubigeo_code },
        transaction,
      });
      if (!ubigeoExiste) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "El código de ubigeo especificado no existe",
        });
      }
    }

    if (datosActualizacion.vehiculo_id !== undefined) {
      if (datosActualizacion.vehiculo_id !== null) {
        const vehiculo = await Vehiculo.findOne({
          where: {
            id: datosActualizacion.vehiculo_id,
            estado: 1,
            deleted_at: null,
          },
          transaction,
        });

        if (!vehiculo) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "El vehículo especificado no existe o está inactivo",
          });
        }

        if (vehiculo.estado_operativo !== "DISPONIBLE") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "El vehículo no está disponible para asignación",
            estado_actual: vehiculo.estado_operativo,
          });
        }

        const personalConVehiculo = await PersonalSeguridad.findOne({
          where: {
            vehiculo_id: datosActualizacion.vehiculo_id,
            id: { [Op.ne]: id },
            estado: 1,
            deleted_at: null,
          },
          transaction,
        });

        if (personalConVehiculo) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "El vehículo ya está asignado a otro personal",
            asignado_a: {
              id: personalConVehiculo.id,
              nombre: personalConVehiculo.getNombreCompleto(),
            },
          });
        }

        const licencia =
          datosActualizacion.licencia !== undefined
            ? datosActualizacion.licencia
            : personal.licencia;

        const vigencia =
          datosActualizacion.vigencia !== undefined
            ? datosActualizacion.vigencia
            : personal.vigencia;

        if (!licencia || !vigencia) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message:
              "Para asignar un vehículo, el personal debe tener licencia de conducir y fecha de vigencia",
          });
        }

        if (new Date(vigencia) < new Date()) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message:
              "No se puede asignar un vehículo con licencia de conducir vencida",
          });
        }

        await vehiculo.update(
          {
            estado_operativo: "EN_SERVICIO",
            conductor_asignado_id: personal.id,
            updated_by: req.user.id,
          },
          { transaction }
        );
      } else {
        if (personal.vehiculo_id) {
          const vehiculoAnterior = await Vehiculo.findByPk(
            personal.vehiculo_id,
            { transaction }
          );

          if (vehiculoAnterior) {
            await vehiculoAnterior.update(
              {
                estado_operativo: "DISPONIBLE",
                conductor_asignado_id: null,
                updated_by: req.user.id,
              },
              { transaction }
            );
          }
        }
      }
    }

    await personal.update(
      {
        ...datosActualizacion,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    const personalActualizado = await PersonalSeguridad.findByPk(id, {
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
        {
          model: Ubigeo,
          as: "PersonalSeguridadUbigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
        {
          model: Vehiculo,
          as: "PersonalSeguridadVehiculo",
          attributes: [
            "id",
            "codigo_vehiculo",
            "placa",
            "marca",
            "modelo_vehiculo",
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Personal actualizado exitosamente",
      data: personalActualizado,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("❌ Error en updatePersonal:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar el personal",
      error: error.message,
    });
  }
};

/**
 * Eliminar un personal (soft delete)
 * DELETE /api/v1/personal/:id
 */
export const deletePersonal = async (req, res) => {
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

    const novedadesActivas = await Novedad.count({
      where: {
        [Op.or]: [
          { personal_cargo_id: id },
          { personal_seguridad2_id: id },
          { personal_seguridad3_id: id },
          { personal_seguridad4_id: id },
        ],
        estado: 1,
        deleted_at: null,
      },
    });

    if (novedadesActivas > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar el personal porque tiene novedades activas asignadas",
        novedades_activas: novedadesActivas,
      });
    }

    await personal.softDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: "Personal eliminado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en deletePersonal:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el personal",
      error: error.message,
    });
  }
};

/**
 * Restaurar un personal eliminado
 * POST /api/v1/personal/:id/restore
 */
export const restorePersonal = async (req, res) => {
  try {
    const { id } = req.params;

    const personal = await PersonalSeguridad.findOne({
      where: {
        id,
        deleted_at: { [Op.ne]: null },
      },
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado o no está eliminado",
      });
    }

    await personal.restore(req.user.id);

    const personalRestaurado = await PersonalSeguridad.findByPk(id, {
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Personal restaurado exitosamente",
      data: personalRestaurado,
    });
  } catch (error) {
    console.error("❌ Error en restorePersonal:", error);
    res.status(500).json({
      success: false,
      message: "Error al restaurar el personal",
      error: error.message,
    });
  }
};
// ==========================================
// BÚSQUEDAS ESPECIALES
// ==========================================

/**
 * Obtener personal para selectores/dropdowns
 * GET /api/v1/personal/selector
 *
 * Devuelve solo campos básicos de todo el personal activo,
 * sin límite de paginación, optimizado para selectores.
 */
export const getPersonalSelector = async (req, res) => {
  try {
    const personal = await PersonalSeguridad.findAll({
      where: {
        estado: 1,
        deleted_at: null,
      },
      attributes: [
        "id",
        "nombres",
        "apellido_paterno",
        "apellido_materno",
        "doc_tipo",
        "doc_numero",
        "sexo",
        "nacionalidad",
      ],
      order: [
        ["apellido_paterno", "ASC"],
        ["apellido_materno", "ASC"],
        ["nombres", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      message: "Personal para selector obtenido exitosamente",
      data: personal,
      total: personal.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el personal para selector",
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas del personal
 * GET /api/v1/personal/stats
 */
export const getEstadisticasPersonal = async (req, res) => {
  try {
    const estadisticas = await PersonalSeguridad.getEstadisticas();

    const porCargo = await PersonalSeguridad.findAll({
      attributes: [
        "cargo_id",
        [
          sequelize.fn("COUNT", sequelize.col("PersonalSeguridadCargo.id")),
          "total",
        ],
      ],
      where: {
        status: "Activo",
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["nombre"],
        },
      ],
      group: ["cargo_id", "PersonalSeguridadCargo.id"],
    });

    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);

    const licenciasPorVencer = await PersonalSeguridad.count({
      where: {
        vigencia: {
          [Op.between]: [hoy, treintaDias],
        },
        licencia: { [Op.ne]: null },
        status: "Activo",
        estado: 1,
        deleted_at: null,
      },
    });

    const licenciasVencidas = await PersonalSeguridad.count({
      where: {
        vigencia: {
          [Op.lt]: hoy,
        },
        licencia: { [Op.ne]: null },
        status: "Activo",
        estado: 1,
        deleted_at: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Estadísticas obtenidas exitosamente",
      data: {
        resumen: estadisticas,
        por_cargo: porCargo,
        licencias: {
          por_vencer_30_dias: licenciasPorVencer,
          vencidas: licenciasVencidas,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en getEstadisticasPersonal:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
};

/**
 * Obtener solo conductores (personal con licencia vigente)
 * GET /api/v1/personal/conductores
 */
export const getConductores = async (req, res) => {
  try {
    const { page = 1, limit = 50, disponible } = req.query;
    const offset = (page - 1) * limit;

    // Si disponible=true, excluir conductores que ya tienen vehículo asignado
    const whereClause = {};
    if (disponible === "true") {
      const idsAsignados = await Vehiculo.findAll({
        attributes: ["conductor_asignado_id"],
        where: {
          conductor_asignado_id: { [Op.ne]: null },
        },
        paranoid: true, // excluye soft-deleted
        raw: true,
      });
      const idsOcupados = idsAsignados.map((v) => v.conductor_asignado_id);
      if (idsOcupados.length > 0) {
        whereClause.id = { [Op.notIn]: idsOcupados };
      }
    }

    const { count, rows } = await PersonalSeguridad.scope(
      "conLicenciaVigente"
    ).findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
        {
          model: Vehiculo,
          as: "PersonalSeguridadVehiculo",
          attributes: ["id", "codigo_vehiculo", "placa"],
        },
      ],
      order: [["apellido_paterno", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Conductores obtenidos exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error en getConductores:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener conductores",
      error: error.message,
    });
  }
};

/**
 * Obtener personal disponible (sin vehículo asignado)
 * GET /api/v1/personal/disponibles
 */
export const getPersonalDisponible = async (req, res) => {
  try {
    const personalDisponible = await PersonalSeguridad.scope(
      "disponibles"
    ).findAll({
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["apellido_paterno", "ASC"]],
    });

    res.status(200).json({
      success: true,
      message: "Personal disponible obtenido exitosamente",
      data: personalDisponible,
      total: personalDisponible.length,
    });
  } catch (error) {
    console.error("❌ Error en getPersonalDisponible:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener personal disponible",
      error: error.message,
    });
  }
};

/**
 * Obtener personal por cargo específico
 * GET /api/v1/personal/cargo/:cargoId
 */
export const getPersonalPorCargo = async (req, res) => {
  try {
    const { cargoId } = req.params;

    const cargo = await Cargo.findByPk(cargoId);

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: "Cargo no encontrado",
      });
    }

    const personal = await PersonalSeguridad.findByCargo(cargoId);

    res.status(200).json({
      success: true,
      message: `Personal con cargo "${cargo.nombre}" obtenido exitosamente`,
      cargo: {
        id: cargo.id,
        nombre: cargo.nombre,
      },
      data: personal,
      total: personal.length,
    });
  } catch (error) {
    console.error("❌ Error en getPersonalPorCargo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener personal por cargo",
      error: error.message,
    });
  }
};

/**
 * Buscar personal por documento
 * GET /api/v1/personal/documento/:doc
 */
export const getPersonalByDocumento = async (req, res) => {
  try {
    const { doc } = req.params;
    const partes = doc.split("-");

    if (partes.length !== 2) {
      return res.status(400).json({
        success: false,
        message:
          "Formato inválido. Use: TIPO-NUMERO (ej: DNI-12345678, CE-123456789)",
      });
    }

    const [tipoDoc, numeroDoc] = partes;
    const tiposValidos = ["DNI", "CE", "PASAPORTE", "PTP"];
    const tipoDocNormalizado =
      tipoDoc === "CE" ? "Carnet Extranjeria" : tipoDoc;

    if (!tiposValidos.includes(tipoDoc)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de documento inválido. Use: ${tiposValidos.join(", ")}`,
      });
    }

    const personal = await PersonalSeguridad.findByDocumento(
      tipoDocNormalizado,
      numeroDoc
    );

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado con ese documento",
      });
    }

    res.status(200).json({
      success: true,
      message: "Personal encontrado",
      data: personal,
    });
  } catch (error) {
    console.error("❌ Error en getPersonalByDocumento:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar personal por documento",
      error: error.message,
    });
  }
};

/**
 * Obtener personal por status laboral
 * GET /api/v1/personal/status/:status
 */
export const getPersonalPorStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const statusValidos = ["Activo", "Inactivo", "Suspendido", "Retirado"];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Use: ${statusValidos.join(", ")}`,
      });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await PersonalSeguridad.findAndCountAll({
      where: {
        status,
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["apellido_paterno", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: `Personal con status "${status}" obtenido exitosamente`,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error en getPersonalPorStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener personal por status",
      error: error.message,
    });
  }
};

// ==========================================
// ACCIONES ESPECIALES
// ==========================================

/**
 * Cambiar status laboral del personal
 * PATCH /api/v1/personal/:id/status
 */
export const cambiarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observaciones } = req.body;

    const statusValidos = ["Activo", "Inactivo", "Suspendido", "Retirado"];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Use: ${statusValidos.join(", ")}`,
      });
    }

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    const statusAnterior = personal.status;

    if (status === "Retirado") {
      await personal.darDeBaja(new Date(), req.user.id);
    } else if (status === "Suspendido") {
      await personal.suspender();
      personal.updated_by = req.user.id;
      await personal.save();
    } else if (status === "Activo" && statusAnterior === "Retirado") {
      await personal.reactivar();
      personal.updated_by = req.user.id;
      await personal.save();
    } else {
      personal.status = status;
      personal.updated_by = req.user.id;
      await personal.save();
    }

    res.status(200).json({
      success: true,
      message: `Status actualizado de "${statusAnterior}" a "${status}"`,
      data: {
        id: personal.id,
        nombre_completo: personal.getNombreCompleto(),
        status_anterior: statusAnterior,
        status_nuevo: status,
        observaciones,
      },
    });
  } catch (error) {
    console.error("❌ Error en cambiarStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar el status",
      error: error.message,
    });
  }
};

/**
 * Asignar un vehículo al personal
 * PATCH /api/v1/personal/:id/asignar-vehiculo
 */
export const asignarVehiculo = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const { id } = req.params;
    const { vehiculo_id } = req.body;

    if (!vehiculo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El vehiculo_id es requerido",
      });
    }

    const personal = await PersonalSeguridad.findByPk(id, { transaction });

    if (!personal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    if (!personal.estado || personal.deleted_at) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Personal inactivo o eliminado",
      });
    }

    if (personal.status !== "Activo") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Solo se puede asignar vehículo a personal activo",
      });
    }

    if (personal.vehiculo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal ya tiene un vehículo asignado",
      });
    }

    if (!personal.tieneLicenciaVigente || !personal.tieneLicenciaVigente()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal debe tener licencia vigente",
      });
    }

    const vehiculo = await Vehiculo.findByPk(vehiculo_id, { transaction });

    if (!vehiculo) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    if (!vehiculo.estado || vehiculo.deleted_at) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Vehículo inactivo o eliminado",
      });
    }

    if (vehiculo.estado_operativo !== "DISPONIBLE") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El vehículo no está disponible",
      });
    }

    const otroPersonal = await PersonalSeguridad.findOne({
      where: {
        vehiculo_id: vehiculo_id,
        id: { [Op.ne]: id },
        estado: true,
        deleted_at: null,
      },
      transaction,
    });

    if (otroPersonal) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El vehículo ya está asignado a otro personal",
      });
    }

    // Usar update sobre la instancia para que validaciones/hook tengan acceso
    // a los valores existentes (licencia/categoria/vigencia), evitando ValidationError
    await personal.update(
      {
        vehiculo_id: vehiculo_id,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    await Vehiculo.update(
      {
        estado_operativo: "EN_SERVICIO",
        conductor_asignado_id: parseInt(id),
        updated_by: req.user?.id || null,
      },
      {
        where: { id: vehiculo_id },
        transaction,
      }
    );

    await transaction.commit();

    const personalActualizado = await PersonalSeguridad.findByPk(id, {
      include: [
        {
          model: Vehiculo,
          as: "PersonalSeguridadVehiculo",
          attributes: [
            "id",
            "codigo_vehiculo",
            "placa",
            "marca",
            "modelo_vehiculo",
          ],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Vehículo asignado exitosamente",
      data: personalActualizado,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("❌ Error en asignarVehiculo:", error);

    if (error?.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al asignar el vehículo",
      error: error.message,
    });
  }
};

/**
 * Desasignar vehículo del personal
 * DELETE /api/v1/personal/:id/desasignar-vehiculo
 */
export const desasignarVehiculo = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!personal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    if (!personal.vehiculo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal no tiene vehículo asignado",
      });
    }

    const vehiculoId = personal.vehiculo_id;

    const vehiculo = await Vehiculo.findByPk(vehiculoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    await personal.update(
      {
        vehiculo_id: null,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    if (vehiculo) {
      await vehiculo.update(
        {
          estado_operativo: "DISPONIBLE",
          conductor_asignado_id: null,
          updated_by: req.user?.id || null,
        },
        { transaction }
      );
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Vehículo desasignado exitosamente",
      data: {
        personal_id: personal.id,
        nombre_completo: personal.getNombreCompleto(),
        vehiculo_desasignado: vehiculoId,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("❌ Error en desasignarVehiculo:", error);

    res.status(500).json({
      success: false,
      message: "Error al desasignar el vehículo",
      error: error.message,
    });
  }
};

/**
 * Actualizar licencia de conducir
 * PATCH /api/v1/personal/:id/licencia
 *
 * NOTA: La validación de categoría se realiza en las rutas
 */
export const actualizarLicencia = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { licencia, categoria, vigencia } = req.body;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!personal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    if (personal.vehiculo_id && vigencia) {
      if (new Date(vigencia) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message:
            "No se puede actualizar a una licencia vencida si el personal tiene vehículo asignado",
        });
      }
    }

    const datosActualizacion = {};
    if (licencia !== undefined) datosActualizacion.licencia = licencia;
    if (categoria !== undefined) datosActualizacion.categoria = categoria;
    if (vigencia !== undefined) datosActualizacion.vigencia = vigencia;
    datosActualizacion.updated_by = req.user?.id;

    await personal.update(datosActualizacion, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Licencia actualizada exitosamente",
      data: {
        id: personal.id,
        nombre_completo: personal.getNombreCompleto(),
        licencia: personal.licencia,
        categoria: personal.categoria,
        vigencia: personal.vigencia,
        licencia_vigente: personal.tieneLicenciaVigente(),
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("❌ Error en actualizarLicencia:", error);

    res.status(500).json({
      success: false,
      message: "Error al actualizar la licencia",
      error: error.message,
    });
  }
};

/**
 * Generar código de acceso automático
 * POST /api/v1/personal/:id/generar-codigo
 */
export const generarCodigoAcceso = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!personal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    if (personal.codigo_acceso) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal ya tiene un código de acceso asignado",
      });
    }

    if (!personal.cargo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal debe tener un cargo asignado para generar código",
      });
    }

    const cargo = personal.PersonalSeguridadCargo;
    const prefijo = cargo.nombre
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    const ultimoPersonal = await PersonalSeguridad.findOne({
      where: {
        codigo_acceso: {
          [Op.like]: `${prefijo}-%`,
        },
      },
      order: [["codigo_acceso", "DESC"]],
      transaction,
    });

    let nuevoNumero = 1;
    if (ultimoPersonal && ultimoPersonal.codigo_acceso) {
      const partes = ultimoPersonal.codigo_acceso.split("-");
      if (partes.length === 2) {
        const numeroActual = parseInt(partes[1]);
        if (!isNaN(numeroActual)) {
          nuevoNumero = numeroActual + 1;
        }
      }
    }

    const nuevoCodigo = `${prefijo}-${String(nuevoNumero).padStart(4, "0")}`;

    await personal.update(
      {
        codigo_acceso: nuevoCodigo,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Código de acceso generado exitosamente",
      data: {
        id: personal.id,
        nombre_completo: personal.getNombreCompleto(),
        codigo_acceso: nuevoCodigo,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("❌ Error en generarCodigoAcceso:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el código de acceso",
      error: error.message,
    });
  }
};

/**
 * Verificar vigencia de licencia de conducir
 * GET /api/v1/personal/:id/verificar-licencia
 */
export const verificarLicenciaVigente = async (req, res) => {
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

    if (!personal.licencia) {
      return res.status(200).json({
        success: true,
        message: "El personal no tiene licencia registrada",
        data: {
          tiene_licencia: false,
          licencia_vigente: false,
        },
      });
    }

    const hoy = new Date();
    const vigencia = new Date(personal.vigencia);
    const diasRestantes = Math.ceil((vigencia - hoy) / (1000 * 60 * 60 * 24));

    const esVigente = personal.tieneLicenciaVigente();

    let estado = "";
    if (diasRestantes < 0) {
      estado = "VENCIDA";
    } else if (diasRestantes <= 30) {
      estado = "POR_VENCER";
    } else {
      estado = "VIGENTE";
    }

    res.status(200).json({
      success: true,
      message: "Verificación de licencia completada",
      data: {
        id: personal.id,
        nombre_completo: personal.getNombreCompleto(),
        tiene_licencia: true,
        licencia: personal.licencia,
        categoria: personal.categoria,
        vigencia: personal.vigencia,
        licencia_vigente: esVigente,
        dias_restantes: diasRestantes,
        estado,
      },
    });
  } catch (error) {
    console.error("❌ Error en verificarLicenciaVigente:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar la licencia",
      error: error.message,
    });
  }
};

/**
 * Obtener historial de novedades del personal
 * GET /api/v1/personal/:id/historial-novedades
 */
export const getHistorialNovedades = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    const novedades = await Novedad.findAll({
      where: {
        [Op.or]: [
          { personal_cargo_id: id },
          { personal_seguridad2_id: id },
          { personal_seguridad3_id: id },
          { personal_seguridad4_id: id },
        ],
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: TipoNovedad,
          as: "novedadTipoNovedad",
          attributes: ["id", "nombre", ["tipo_code", "codigo"]],
        },
        {
          model: EstadoNovedad,
          as: "novedadEstado",
          attributes: ["id", "nombre"],
        },
        {
          model: Vehiculo,
          as: "novedadVehiculo",
          attributes: ["id", "codigo_vehiculo", "placa"],
        },
      ],
      order: [["fecha_hora_ocurrencia", "DESC"]],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: "Historial de novedades obtenido exitosamente",
      data: {
        personal: {
          id: personal.id,
          nombre_completo: personal.getNombreCompleto(),
        },
        novedades,
        total: novedades.length,
      },
    });
  } catch (error) {
    console.error("❌ Error en getHistorialNovedades:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial de novedades",
      error: error.message,
    });
  }
};

/**
 * Obtener personal con licencias por vencer
 * GET /api/v1/personal/licencias-por-vencer?dias=30
 */
export const getLicenciasPorVencer = async (req, res) => {
  try {
    const { dias = 30 } = req.query;

    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + parseInt(dias));

    const personal = await PersonalSeguridad.findAll({
      where: {
        licencia: { [Op.ne]: null },
        vigencia: {
          [Op.between]: [hoy, fechaLimite],
        },
        status: "Activo",
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["vigencia", "ASC"]],
    });

    const personalConDias = personal.map((p) => {
      const vigencia = new Date(p.vigencia);
      const diffTime = vigencia - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...p.toJSON(),
        dias_restantes: diffDays,
      };
    });

    res.status(200).json({
      success: true,
      message: `Personal con licencias por vencer en los próximos ${dias} días`,
      data: personalConDias,
      total: personalConDias.length,
      filtros: {
        dias_adelante: parseInt(dias),
        fecha_limite: fechaLimite.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("❌ Error en getLicenciasPorVencer:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener licencias por vencer",
      error: error.message,
    });
  }
};

/**
 * =====================================================
 * GET /api/personal/buscar-para-dropdown
 * =====================================================
 * Búsqueda optimizada de personal para dropdowns
 * 
 * Query params:
 * - q: término de búsqueda (mínimo 3 caracteres)
 * - limit: número de resultados (default 20, max 50)
 * 
 * Campos devueltos:
 * - id, nombres, apellido_paterno, apellido_materno
 * - doc_tipo, doc_numero, codigo_acceso
 * 
 * @access Requiere permiso de lectura de personal
 */
export const buscarPersonalParaDropdown = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    // Validaciones
    if (!q || q.length < 3) {
      return res.status(400).json({
        success: false,
        message: "El término de búsqueda debe tener al menos 3 caracteres",
        code: "INVALID_SEARCH_TERM"
      });
    }

    const limitNum = Math.min(parseInt(limit), 50);

    // Construir condición de búsqueda optimizada
    const searchConditions = [];
    const searchTerms = q.trim().split(/\s+/);

    if (searchTerms.length === 1) {
      // Búsqueda simple por un término
      searchConditions.push(
        { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
        { apellido_materno: { [Op.like]: `${searchTerms[0]}%` } },
        { nombres: { [Op.like]: `${searchTerms[0]}%` } }
      );
    } else if (searchTerms.length === 2) {
      // Búsqueda por dos términos (probablemente apellido paterno + materno)
      searchConditions.push(
        {
          [Op.and]: [
            { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
            { apellido_materno: { [Op.like]: `${searchTerms[1]}%` } }
          ]
        },
        {
          [Op.and]: [
            { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
            { nombres: { [Op.like]: `${searchTerms[1]}%` } }
          ]
        }
      );
    } else {
      // Búsqueda por más de dos términos
      searchConditions.push(
        {
          [Op.and]: [
            { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
            { apellido_materno: { [Op.like]: `${searchTerms[1]}%` } },
            { nombres: { [Op.like]: `${searchTerms.slice(2).join(" ")}%` } }
          ]
        }
      );
    }

    const personal = await PersonalSeguridad.findAll({
      where: {
        [Op.or]: searchConditions,
        estado: "Activo",
        deleted_at: null
      },
      attributes: [
        "id",
        "nombres",
        "apellido_paterno",
        "apellido_materno",
        "doc_tipo",
        "doc_numero",
        "codigo_acceso"
      ],
      limit: limitNum,
      order: [
        ["apellido_paterno", "ASC"],
        ["apellido_materno", "ASC"],
        ["nombres", "ASC"]
      ]
    });

    // Formatear resultados para mejor UX
    const resultadosFormateados = personal.map(p => ({
      ...p.toJSON(),
      nombre_completo: `${p.apellido_paterno} ${p.apellido_materno}, ${p.nombres}`,
      documento: `${p.doc_tipo}-${p.doc_numero}`,
      display_text: `${p.apellido_paterno} ${p.apellido_materno}, ${p.nombres} (${p.doc_numero})`
    }));

    res.status(200).json({
      success: true,
      data: resultadosFormateados,
      meta: {
        query: q,
        count: resultadosFormateados.length,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error("❌ Error en buscarPersonalParaDropdown:", error);
    
    res.status(500).json({
      success: false,
      message: "Error al buscar personal para dropdown",
      error: error.message
    });
  }
};
