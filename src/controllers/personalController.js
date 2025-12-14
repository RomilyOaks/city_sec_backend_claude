/**
 * ===================================================
 * CONTROLADOR: PersonalSeguridad (COMPLETO Y CORREGIDO)
 * ===================================================
 *
 * Ruta: src/controllers/personalController.js
 *
 * CORRECCIONES APLICADAS EN ESTA VERSIÓN:
 * - ✅ Validación de categoría de licencia en actualizarLicencia
 * - ✅ Normalización agresiva de guiones Unicode
 * - ✅ Logs detallados para debugging
 * - ✅ Mensajes de error descriptivos
 * - ✅ Todas las funciones previas mantenidas
 *
 * @version 2.1.1 Se eliminan logs de consola para categorias válidas
 * @date 2025-12-13
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
  try {
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

    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    // Búsqueda por texto
    if (search) {
      whereClause[Op.or] = [
        { nombres: { [Op.like]: `%${search}%` } },
        { apellido_paterno: { [Op.like]: `%${search}%` } },
        { apellido_materno: { [Op.like]: `%${search}%` } },
        { doc_numero: { [Op.like]: `%${search}%` } },
        { codigo_acceso: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filtros específicos
    if (cargo_id) whereClause.cargo_id = cargo_id;
    if (status) whereClause.status = status;
    if (doc_tipo) whereClause.doc_tipo = doc_tipo;
    if (regimen) whereClause.regimen = regimen;
    if (ubigeo_code) whereClause.ubigeo_code = ubigeo_code;

    // Filtro por licencia
    if (tiene_licencia === "true") {
      whereClause.licencia = { [Op.ne]: null };
    } else if (tiene_licencia === "false") {
      whereClause.licencia = null;
    }

    // Filtro por vehículo
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

    // Verificar si ya existe personal con el mismo documento
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

    // Validar cargo si se proporciona
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

    // Validar ubigeo si se proporciona
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

    // Validar vehículo si se asigna
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

      // Verificar que tenga licencia vigente
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

    // Crear el personal
    const nuevoPersonal = await PersonalSeguridad.create(
      {
        ...datosPersonal,
        created_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Obtener el personal con relaciones
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

    // Buscar personal
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

    // ==========================================
    // VALIDACIÓN: No permitir cambiar documento
    // ==========================================
    if (datosActualizacion.doc_tipo || datosActualizacion.doc_numero) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "No se permite cambiar el tipo o número de documento de identidad",
      });
    }

    // ==========================================
    // VALIDACIÓN: Cargo existe
    // ==========================================
    if (datosActualizacion.cargo_id) {
      const cargoExiste = await Cargo.findByPk(datosActualizacion.cargo_id, {
        transaction,
      });
      if (!cargoExiste) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "El cargo especificado no existe",
          campo: "cargo_id",
          valor_recibido: datosActualizacion.cargo_id,
        });
      }
    }

    // ==========================================
    // VALIDACIÓN: Ubigeo existe
    // ==========================================
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
          campo: "ubigeo_code",
          valor_recibido: datosActualizacion.ubigeo_code,
        });
      }
    }

    // ==========================================
    // ✅ VALIDACIÓN PROFESIONAL: Vehículo
    // ==========================================
    if (datosActualizacion.vehiculo_id !== undefined) {
      // Si intenta asignar un vehículo (no null)
      if (datosActualizacion.vehiculo_id !== null) {
        // 1. Verificar que el vehículo existe
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
            campo: "vehiculo_id",
            valor_recibido: datosActualizacion.vehiculo_id,
            sugerencia:
              "Verifique que el ID del vehículo sea correcto y esté activo",
          });
        }

        // 2. Verificar que el vehículo esté disponible
        if (vehiculo.estado_operativo !== "DISPONIBLE") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "El vehículo no está disponible para asignación",
            campo: "vehiculo_id",
            valor_recibido: datosActualizacion.vehiculo_id,
            estado_actual: vehiculo.estado_operativo,
            vehiculo: {
              id: vehiculo.id,
              codigo: vehiculo.codigo_vehiculo,
              placa: vehiculo.placa,
            },
          });
        }

        // 3. Verificar que no esté asignado a otro personal
        const personalConVehiculo = await PersonalSeguridad.findOne({
          where: {
            vehiculo_id: datosActualizacion.vehiculo_id,
            id: { [Op.ne]: id }, // Excluir el personal actual
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
            campo: "vehiculo_id",
            valor_recibido: datosActualizacion.vehiculo_id,
            asignado_a: {
              id: personalConVehiculo.id,
              nombre: personalConVehiculo.getNombreCompleto(),
              codigo: personalConVehiculo.codigo_acceso,
            },
            sugerencia: "Debe desasignar el vehículo del otro personal primero",
          });
        }

        // 4. Verificar que el personal tenga licencia vigente
        // Usar datos actualizados si se proporcionan, o los actuales
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
            campo: "vehiculo_id",
            datos_faltantes: {
              licencia: !licencia ? "requerida" : "ok",
              vigencia: !vigencia ? "requerida" : "ok",
            },
            sugerencia:
              "Incluya los campos 'licencia' y 'vigencia' en la solicitud o asígnelos previamente",
          });
        }

        // 5. Verificar que la licencia esté vigente
        if (new Date(vigencia) < new Date()) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message:
              "No se puede asignar un vehículo con licencia de conducir vencida",
            campo: "vigencia",
            valor_actual: vigencia,
            fecha_vencimiento: vigencia,
            dias_vencida: Math.ceil(
              (new Date() - new Date(vigencia)) / (1000 * 60 * 60 * 24)
            ),
            sugerencia: "Actualice la fecha de vigencia de la licencia",
          });
        }

        // 6. Actualizar estado del vehículo a EN_SERVICIO
        await vehiculo.update(
          {
            estado_operativo: "EN_SERVICIO",
            conductor_asignado_id: personal.id,
            updated_by: req.user.id,
          },
          { transaction }
        );
      } else {
        // Si intenta desasignar el vehículo (vehiculo_id: null)
        // Actualizar el vehículo anterior a DISPONIBLE si existe
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

    // ==========================================
    // ACTUALIZAR PERSONAL
    // ==========================================
    await personal.update(
      {
        ...datosActualizacion,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    // ==========================================
    // RESPUESTA CON DATOS ACTUALIZADOS
    // ==========================================
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

    // Manejo específico de errores de validación de Sequelize
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

    // Manejo de errores de foreign key (por si acaso)
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Error de integridad referencial",
        detalle: "El registro relacionado no existe o está inactivo",
        campo: error.fields?.[0] || "desconocido",
      });
    }

    // Error genérico
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

    // 1. Buscar personal (sin transacción ni lock)
    const personal = await PersonalSeguridad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    // 2. Verificar si tiene novedades activas
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

    // 3. Soft delete (usa el método del modelo que ya corregimos)
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

    // Buscar personal eliminado (sin transacción)
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

    // Restaurar
    await personal.restore(req.user.id);

    // Obtener personal restaurado con relaciones
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
 * Obtener estadísticas del personal
 * GET /api/v1/personal/stats
 */
export const getEstadisticasPersonal = async (req, res) => {
  try {
    const estadisticas = await PersonalSeguridad.getEstadisticas();

    // Estadísticas adicionales por cargo
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

    // Licencias por vencer (próximos 30 días)
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

    // Licencias vencidas
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
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await PersonalSeguridad.scope(
      "conLicenciaVigente"
    ).findAndCountAll({
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

    // Buscar personal (sin transacción)
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

    // Aplicar el cambio según el nuevo status
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

    console.log(
      `🚗 Iniciando asignación: Personal ${id} → Vehículo ${vehiculo_id}`
    );

    // ==========================================
    // 1. VALIDACIÓN: vehiculo_id requerido
    // ==========================================
    if (!vehiculo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El vehiculo_id es requerido",
      });
    }

    // ==========================================
    // 2. BUSCAR PERSONAL
    // ==========================================
    const personal = await PersonalSeguridad.findByPk(id, { transaction });

    if (!personal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personal no encontrado",
      });
    }

    // Validar que esté activo (flexible: acepta true o 1)
    if (!personal.estado || personal.deleted_at) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Personal inactivo o eliminado",
        estado: personal.estado,
        deleted_at: personal.deleted_at,
      });
    }

    // ==========================================
    // 3. VALIDACIONES DEL PERSONAL
    // ==========================================
    if (personal.status !== "Activo") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Solo se puede asignar vehículo a personal activo",
        status_actual: personal.status,
      });
    }

    if (personal.vehiculo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal ya tiene un vehículo asignado",
        vehiculo_actual: personal.vehiculo_id,
      });
    }

    // Validar licencia vigente
    if (!personal.tieneLicenciaVigente || !personal.tieneLicenciaVigente()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal debe tener licencia vigente",
        licencia: personal.licencia,
        vigencia: personal.vigencia,
      });
    }

    // ==========================================
    // 4. BUSCAR VEHÍCULO
    // ==========================================
    const vehiculo = await Vehiculo.findByPk(vehiculo_id, { transaction });

    if (!vehiculo) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Validar que esté activo (flexible)
    if (!vehiculo.estado || vehiculo.deleted_at) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Vehículo inactivo o eliminado",
        estado: vehiculo.estado,
        deleted_at: vehiculo.deleted_at,
      });
    }

    if (vehiculo.estado_operativo !== "DISPONIBLE") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El vehículo no está disponible",
        estado_operativo: vehiculo.estado_operativo,
      });
    }

    // ==========================================
    // 5. VERIFICAR ASIGNACIÓN MÚLTIPLE
    // ==========================================
    const otroPersonal = await PersonalSeguridad.findOne({
      where: {
        vehiculo_id: vehiculo_id,
        id: { [Op.ne]: id },
        estado: true, // Flexible: acepta boolean
        deleted_at: null,
      },
      transaction,
    });

    if (otroPersonal) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El vehículo ya está asignado a otro personal",
        asignado_a: otroPersonal.getNombreCompleto(),
      });
    }

    console.log(`✅ Validaciones OK, procediendo a actualizar...`);

    // ==========================================
    // 6. ACTUALIZAR PERSONAL
    // ==========================================
    await PersonalSeguridad.update(
      {
        vehiculo_id: vehiculo_id,
        licencia: personal.licencia,
        vigencia: personal.vigencia,
        categoria: personal.categoria,
        updated_by: req.user?.id || null,
        updated_at: new Date(),
      },
      {
        where: { id },
        transaction,
      }
    );

    console.log(`✅ Personal actualizado: vehiculo_id=${vehiculo_id}`);

    // ==========================================
    // 7. ACTUALIZAR VEHÍCULO
    // ==========================================
    await Vehiculo.update(
      {
        estado_operativo: "EN_SERVICIO",
        conductor_asignado_id: parseInt(id),
        updated_by: req.user?.id || null,
        updated_at: new Date(),
      },
      {
        where: { id: vehiculo_id },
        transaction,
      }
    );

    console.log(`✅ Vehículo actualizado: estado=EN_SERVICIO, conductor=${id}`);

    // ==========================================
    // 8. COMMIT - CRÍTICO
    // ==========================================
    await transaction.commit();
    console.log(`✅ Transaction committed exitosamente`);

    // ==========================================
    // 9. BUSCAR DATOS ACTUALIZADOS (sin transacción)
    // ==========================================
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

    console.log(`🎉 Asignación completada exitosamente`);

    // ==========================================
    // 10. RESPUESTA EXITOSA
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Vehículo asignado exitosamente",
      data: personalActualizado,
    });
  } catch (error) {
    // ==========================================
    // MANEJO DE ERRORES
    // ==========================================
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log(`⚠️ Transaction rolled back debido a error`);
    }

    console.error("❌ Error en asignarVehiculo:", error);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Error al asignar el vehículo",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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

    // Buscar personal
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

    // Verificar que tenga vehículo asignado
    if (!personal.vehiculo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal no tiene vehículo asignado",
        personal_id: personal.id,
        nombre_completo: personal.getNombreCompleto(),
      });
    }

    const vehiculoId = personal.vehiculo_id;

    // Buscar el vehículo para actualizarlo
    const vehiculo = await Vehiculo.findByPk(vehiculoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    // Desasignar vehículo del personal
    await personal.update(
      {
        vehiculo_id: null,
        updated_by: req.user?.id || null,
      },
      { transaction }
    );

    // Actualizar estado del vehículo SI existe
    if (vehiculo) {
      await vehiculo.update(
        {
          estado_operativo: "DISPONIBLE",
          conductor_asignado_id: null,
          updated_by: req.user?.id || null,
        },
        { transaction }
      );
    } else {
      console.warn(
        `⚠️ Vehículo ID ${vehiculoId} no encontrado, solo se desasignó del personal`
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
        vehiculo_actualizado: vehiculo ? true : false,
      },
    });
  } catch (error) {
    // Asegurar rollback
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("❌ Error en desasignarVehiculo:", error);

    // NO dejar que el servidor crashee
    res.status(500).json({
      success: false,
      message: "Error al desasignar el vehículo",
      error: error.message,
    });
  }
};

/**
 * ✅ ACTUALIZAR LICENCIA (CON VALIDACIÓN DE CATEGORÍA)
 * PATCH /api/v1/personal/:id/licencia
 */
export const actualizarLicencia = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    let { licencia, categoria, vigencia } = req.body;

    // ✅ VALIDACIÓN DE CATEGORÍA (ANTES de actualizar)
    if (categoria) {
      // ✅ Normalización AGRESIVA
      categoria = categoria
        .trim()
        .toUpperCase()
        // Reemplazar TODOS los tipos de guiones por guion normal
        .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D−–—]/g, "-")
        // Remover espacios internos
        .replace(/\s+/g, "");

      // ✅ Categorías válidas
      const categoriasValidas = [
        "A-I",
        "A-IIA",
        "A-IIB",
        "A-IIIA",
        "A-IIIB",
        "A-IIIC",
        "B-I",
        "B-IIA",
        "B-IIB",
        "B-IIC",
      ];

      if (!categoriasValidas.includes(categoria)) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Errores de validación",
          errors: [
            {
              field: "categoria",
              message:
                "Categoría no válida.\n\n" +
                "Categorías válidas en Perú:\n" +
                "CLASE A: A-I, A-IIA, A-IIB, A-IIIA, A-IIIB, A-IIIC\n" +
                "CLASE B: B-I, B-IIA, B-IIB, B-IIC\n\n" +
                `Recibido: "${req.body.categoria}"\n` +
                `Normalizado: "${categoria}"`,
              value: req.body.categoria,
            },
          ],
        });
      }
    }

    // Buscar personal
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

    console.log("✅ Personal encontrado:", personal.getNombreCompleto());

    // Validar que si tiene vehículo, la nueva licencia debe estar vigente
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

    console.log("───────────────────────────────────────");
    console.log("💾 Actualizando licencia...");

    // Actualizar campos
    const datosActualizacion = {};
    if (licencia !== undefined) datosActualizacion.licencia = licencia;
    if (categoria !== undefined) datosActualizacion.categoria = categoria; // Ya normalizada
    if (vigencia !== undefined) datosActualizacion.vigencia = vigencia;
    datosActualizacion.updated_by = req.user?.id;

    await personal.update(datosActualizacion, { transaction });

    console.log("✅ Licencia actualizada");
    console.log("═══════════════════════════════════════");

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

    console.error("═══════════════════════════════════════");
    console.error("❌ ERROR en actualizarLicencia:");
    console.error(error);
    console.error("═══════════════════════════════════════");

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
        codigo_actual: personal.codigo_acceso,
      });
    }

    if (!personal.cargo_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El personal debe tener un cargo asignado para generar código",
      });
    }

    // Obtener prefijo del cargo
    const cargo = personal.PersonalSeguridadCargo;
    const prefijo = cargo.nombre
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    // Buscar el último código con ese prefijo
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

    // Generar código: PREFIJO-NUMERO (ej: SER-0001)
    const nuevoCodigo = `${prefijo}-${String(nuevoNumero).padStart(4, "0")}`;

    // Asignar código
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
        cargo: cargo.nombre,
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

    // Buscar novedades donde el personal aparece en cualquier posición
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
          as: "tipoNovedad",
          attributes: ["id", "nombre", "codigo"],
        },
        {
          model: EstadoNovedad,
          as: "estadoNovedad",
          attributes: ["id", "nombre"],
        },
        {
          model: Vehiculo,
          as: "vehiculoNovedad",
          attributes: ["id", "codigo_vehiculo", "placa"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: "Historial de novedades obtenido exitosamente",
      data: {
        personal: {
          id: personal.id,
          nombre_completo: personal.getNombreCompleto(),
          cargo_id: personal.cargo_id,
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

    // Calcular días restantes para cada uno
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
