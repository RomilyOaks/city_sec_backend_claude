/**
 * ===================================================
 * CONTROLADOR: Novedades/Incidentes
 * ===================================================
 *
 * Ruta: src/controllers/novedadesController.js
 *
 * VERSIÓN: 2.2.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Eliminados console.logs de debugging
 * ✅ Mantenidos solo logs de errores críticos
 * ✅ Código limpio y profesional
 * ✅ Documentación completa
 * ✅ Validaciones en rutas (no en controlador)
 *
 * VERSIONES ANTERIORES:
 * - v1.0.0: Versión inicial
 *
 * Características:
 * - CRUD completo de novedades
 * - Gestión de estados
 * - Asignación de recursos
 * - Dashboard y estadísticas
 * - Historial de cambios
 *
 * @module controllers/novedadesController
 * @version 2.2.0
 * @date 2025-12-14
 */

import {
  Novedad,
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
  Sector,
  Cuadrante,
  Direccion,
  UnidadOficina,
  Vehiculo,
  PersonalSeguridad,
  HistorialEstadoNovedad,
  Usuario,
} from "../models/index.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";

/**
 * Obtener todas las novedades con filtros
 * GET /api/v1/novedades
 */
export const getAllNovedades = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      estado_novedad_id,
      prioridad_actual,
      sector_id,
      tipo_novedad_id,
      search,
      page = 1,
      limit = 50,
      sort,
      order,
    } = req.query;

    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_hora_ocurrencia = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    if (estado_novedad_id) {
      whereClause.estado_novedad_id = estado_novedad_id;
    }

    if (prioridad_actual) {
      whereClause.prioridad_actual = prioridad_actual;
    }

    if (sector_id) {
      whereClause.sector_id = sector_id;
    }

    if (tipo_novedad_id) {
      whereClause.tipo_novedad_id = tipo_novedad_id;
    }

    if (search) {
      whereClause[Op.or] = [
        { novedad_code: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
        { localizacion: { [Op.like]: `%${search}%` } },
        { reportante_nombre: { [Op.like]: `%${search}%` } },
        { reportante_telefono: { [Op.like]: `%${search}%` } },
        { reportante_doc_identidad: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    // Validar campo de ordenamiento (whitelist de seguridad)
    const validSortFields = [
      "novedad_code",
      "fecha_hora_ocurrencia",
      "fecha_hora_reporte",
      "prioridad_actual",
      "created_at",
      "updated_at",
      "id",
    ];

    // Determinar campo(s) y orden de ordenamiento
    // Soporta múltiples campos separados por comas: sort=prioridad_actual,novedad_code&order=asc,desc
    let orderClause = [];

    if (sort) {
      const sortFields = sort.split(',').map(f => f.trim());
      const sortOrders = order ? order.split(',').map(o => o.trim().toUpperCase()) : [];

      sortFields.forEach((field, index) => {
        // Validar que el campo esté en la whitelist
        if (validSortFields.includes(field)) {
          // Usar el orden correspondiente o 'DESC' por defecto
          const fieldOrder = sortOrders[index] && ["ASC", "DESC"].includes(sortOrders[index])
            ? sortOrders[index]
            : "DESC";
          orderClause.push([field, fieldOrder]);
        }
      });
    }

    // Si no hay ordenamiento válido, usar por defecto fecha_hora_ocurrencia DESC
    if (orderClause.length === 0) {
      orderClause = [["fecha_hora_ocurrencia", "DESC"]];
    }

    const { count, rows } = await Novedad.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TipoNovedad,
          as: "novedadTipoNovedad",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
        {
          model: SubtipoNovedad,
          as: "novedadSubtipoNovedad",
          attributes: ["id", "nombre", "prioridad"],
        },
        {
          model: EstadoNovedad,
          as: "novedadEstado",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
        {
          model: Sector,
          as: "novedadSector",
          attributes: ["id", "nombre", "sector_code"],
        },
        {
          model: Cuadrante,
          as: "novedadCuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: UnidadOficina,
          as: "novedadUnidadOficina",
          attributes: ["id", "nombre", "codigo"],
        },
        {
          model: Vehiculo,
          as: "novedadVehiculo",
          attributes: ["id", "codigo_vehiculo", "placa"],
        },
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Novedades obtenidas exitosamente",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error en getAllNovedades:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las novedades",
      error: error.message,
    });
  }
};

/**
 * Obtener una novedad por ID
 * GET /api/v1/novedades/:id
 */
export const getNovedadById = async (req, res) => {
  try {
    const { id } = req.params;

    const novedad = await Novedad.findOne({
      where: {
        id,
        estado: 1,
        deleted_at: null,
      },
      include: [
        { model: TipoNovedad, as: "novedadTipoNovedad" },
        { model: SubtipoNovedad, as: "novedadSubtipoNovedad" },
        { model: EstadoNovedad, as: "novedadEstado" },
        { model: Sector, as: "novedadSector" },
        { model: Cuadrante, as: "novedadCuadrante" },
        { model: UnidadOficina, as: "novedadUnidadOficina" },
        { model: Vehiculo, as: "novedadVehiculo" },
        { model: PersonalSeguridad, as: "novedadPersonalCargo", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
        { model: PersonalSeguridad, as: "novedadPersonal2", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
        { model: PersonalSeguridad, as: "novedadPersonal3", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
        { model: PersonalSeguridad, as: "novedadPersonal4", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
      ],
    });

    if (!novedad) {
      return res.status(404).json({
        success: false,
        message: "Novedad no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Novedad obtenida exitosamente",
      data: novedad,
    });
  } catch (error) {
    console.error("❌ Error en getNovedadById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la novedad",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva novedad
 * POST /api/v1/novedades
 *
 * NOTA IMPORTANTE: Este endpoint crea manualmente el primer registro en historial
 * porque el trigger solo se ejecuta en UPDATE, no en INSERT.
 * Todos los cambios posteriores de estado son manejados automáticamente por el trigger.
 */
export const createNovedad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      tipo_novedad_id,
      subtipo_novedad_id,
      fecha_hora_ocurrencia,
      localizacion,
      referencia_ubicacion,
      latitud,
      longitud,
      ubigeo_code,
      origen_llamada,
      reportante_nombre,
      reportante_telefono,
      reportante_doc_identidad,
      es_anonimo,
      descripcion,
      observaciones,
      sector_id,
      cuadrante_id,
      direccion_id,
      num_personas_afectadas,
    } = req.body;

    const estadoInicial = await EstadoNovedad.findOne({
      where: { es_inicial: 1, estado: 1 },
      transaction,
    });

    if (!estadoInicial) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: "No se encontró un estado inicial configurado",
      });
    }

    const subtipo = await SubtipoNovedad.findByPk(subtipo_novedad_id, {
      transaction,
    });

    if (!subtipo) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Subtipo de novedad no encontrado",
      });
    }

    const ultimaNovedad = await Novedad.findOne({
      order: [["id", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const siguienteNumero = ultimaNovedad
      ? parseInt(ultimaNovedad.novedad_code) + 1
      : 1;
    const novedad_code = String(siguienteNumero).padStart(6, "0");

    const hora = new Date(fecha_hora_ocurrencia).getHours();
    let turno = "MAÑANA";
    if (hora >= 14 && hora < 22) {
      turno = "TARDE";
    } else if (hora >= 22 || hora < 6) {
      turno = "NOCHE";
    }

    const nuevaNovedad = await Novedad.create(
      {
        novedad_code,
        fecha_hora_ocurrencia,
        fecha_hora_reporte: new Date(),
        tipo_novedad_id,
        subtipo_novedad_id,
        estado_novedad_id: estadoInicial.id,
        sector_id,
        cuadrante_id,
        direccion_id,
        localizacion,
        referencia_ubicacion,
        latitud,
        longitud,
        ubigeo_code,
        origen_llamada: origen_llamada || "TELEFONO_107",
        reportante_nombre,
        reportante_telefono,
        reportante_doc_identidad,
        es_anonimo: es_anonimo || 0,
        descripcion,
        observaciones,
        prioridad_actual: subtipo.prioridad || "MEDIA",
        turno,
        num_personas_afectadas: num_personas_afectadas || 0,
        usuario_registro: req.user.id,
        created_by: req.user.id,
        updated_by: req.user.id,
      },
      { transaction }
    );

    // Crear registro inicial en historial (trigger no se ejecuta en INSERT)
    await HistorialEstadoNovedad.create(
      {
        novedad_id: nuevaNovedad.id,
        estado_anterior_id: null,
        estado_nuevo_id: estadoInicial.id,
        usuario_id: req.user.id,
        observaciones: "Novedad creada",
      },
      { transaction }
    );

    await transaction.commit();

    const novedadCompleta = await Novedad.findByPk(nuevaNovedad.id, {
      include: [
        { model: TipoNovedad, as: "novedadTipoNovedad" },
        { model: SubtipoNovedad, as: "novedadSubtipoNovedad" },
        { model: EstadoNovedad, as: "novedadEstado" },
        { model: Sector, as: "novedadSector" },
        { model: Cuadrante, as: "novedadCuadrante" },
        { model: Direccion, as: "direccion" },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Novedad creada exitosamente",
      data: novedadCompleta,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("❌ Error en createNovedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la novedad",
      error: error.message,
    });
  }
};

/**
 * Actualizar novedad
 * PUT /api/v1/novedades/:id
 */
export const updateNovedad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const novedad = await Novedad.findOne({
      where: { id, estado: 1, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!novedad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Novedad no encontrada",
      });
    }

    // NOTA: No creamos manualmente el registro en historial_estado_novedades
    // El trigger 'trg_novedades_incidentes_after_update' se encarga automáticamente
    // de crear el registro cuando detecta cambio en estado_novedad_id

    if (datosActualizacion.fecha_llegada && !novedad.fecha_llegada) {
      const tiempoRespuesta = Math.floor(
        (new Date(datosActualizacion.fecha_llegada) -
          new Date(novedad.fecha_hora_ocurrencia)) /
          60000
      );
      datosActualizacion.tiempo_respuesta_min = tiempoRespuesta;
    }

    await novedad.update(
      {
        ...datosActualizacion,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    const novedadActualizada = await Novedad.findByPk(id, {
      include: [
        { model: TipoNovedad, as: "novedadTipoNovedad" },
        { model: SubtipoNovedad, as: "novedadSubtipoNovedad" },
        { model: EstadoNovedad, as: "novedadEstado" },
        { model: Sector, as: "novedadSector" },
        { model: Cuadrante, as: "novedadCuadrante" },
        { model: UnidadOficina, as: "novedadUnidadOficina" },
        { model: Vehiculo, as: "novedadVehiculo" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Novedad actualizada exitosamente",
      data: novedadActualizada,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("❌ Error en updateNovedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la novedad",
      error: error.message,
    });
  }
};

/**
 * Asignar recursos a una novedad
 * POST /api/v1/novedades/:id/asignar
 */
export const asignarRecursos = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { 
      unidad_oficina_id, 
      vehiculo_id, 
      personal_cargo_id,
      personal_seguridad2_id,
      personal_seguridad3_id,
      personal_seguridad4_id,
      km_inicial,
      km_final,
      fecha_despacho,
      fecha_llegada,
      fecha_cierre,
      turno,
      tiempo_respuesta_minutos,
      observaciones,
      estado_novedad_id,
      requiere_seguimiento,
      fecha_proxima_revision,
      perdidas_materiales_estimadas
    } = req.body;

    const novedad = await Novedad.findOne({
      where: { id, estado: 1, deleted_at: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!novedad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Novedad no encontrada",
      });
    }

    const estadoDespacho = await EstadoNovedad.findOne({
      where: {
        nombre: { [Op.in]: ["EN RUTA", "DESPACHADO", "Asignado"] },
        estado: 1,
      },
      transaction,
    });

    const estadoAnteriorId = novedad.estado_novedad_id;

    // Construir objeto de actualización
    const datosActualizacion = {
      updated_by: req.user.id,
    };

    if (unidad_oficina_id) datosActualizacion.unidad_oficina_id = unidad_oficina_id;
    if (vehiculo_id) datosActualizacion.vehiculo_id = vehiculo_id;
    if (personal_cargo_id) datosActualizacion.personal_cargo_id = personal_cargo_id;
    if (personal_seguridad2_id) datosActualizacion.personal_seguridad2_id = personal_seguridad2_id;
    if (personal_seguridad3_id) datosActualizacion.personal_seguridad3_id = personal_seguridad3_id;
    if (personal_seguridad4_id) datosActualizacion.personal_seguridad4_id = personal_seguridad4_id;
    if (km_inicial) datosActualizacion.km_inicial = km_inicial;
    if (km_final) datosActualizacion.km_final = km_final;
    if (turno) datosActualizacion.turno = turno;
    if (tiempo_respuesta_minutos) datosActualizacion.tiempo_respuesta_minutos = tiempo_respuesta_minutos;
    if (observaciones) datosActualizacion.observaciones = observaciones;
    if (fecha_llegada) datosActualizacion.fecha_llegada = new Date(fecha_llegada);
    if (fecha_cierre) datosActualizacion.fecha_cierre = new Date(fecha_cierre);
    if (requiere_seguimiento !== undefined) datosActualizacion.requiere_seguimiento = requiere_seguimiento;
    if (fecha_proxima_revision) datosActualizacion.fecha_proxima_revision = new Date(fecha_proxima_revision);
    if (perdidas_materiales_estimadas) datosActualizacion.perdidas_materiales_estimadas = perdidas_materiales_estimadas;
    
    // Fecha de despacho: usar la proporcionada o la actual
    datosActualizacion.fecha_despacho = fecha_despacho ? new Date(fecha_despacho) : new Date();
    
    // Actualizar estado: usar el proporcionado explícitamente o el de despacho automático
    if (estado_novedad_id) {
      datosActualizacion.estado_novedad_id = estado_novedad_id;
    } else if (estadoDespacho) {
      datosActualizacion.estado_novedad_id = estadoDespacho.id;
    }

    await novedad.update(datosActualizacion, { transaction });

    // NOTA: No creamos manualmente el registro en historial_estado_novedades
    // El trigger 'trg_novedades_incidentes_after_update' se encarga automáticamente
    // de crear el registro cuando detecta cambio en estado_novedad_id

    await transaction.commit();

    const novedadActualizada = await Novedad.findByPk(id, {
      include: [
        { model: UnidadOficina, as: "novedadUnidadOficina" },
        { model: Vehiculo, as: "novedadVehiculo" },
        { model: EstadoNovedad, as: "novedadEstado" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Recursos asignados exitosamente",
      data: novedadActualizada,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("❌ Error en asignarRecursos:", error);
    res.status(500).json({
      success: false,
      message: "Error al asignar recursos",
      error: error.message,
    });
  }
};

/**
 * Eliminar novedad (soft delete)
 * DELETE /api/v1/novedades/:id
 */
export const deleteNovedad = async (req, res) => {
  try {
    const { id } = req.params;

    const novedad = await Novedad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!novedad) {
      return res.status(404).json({
        success: false,
        message: "Novedad no encontrada",
      });
    }

    await novedad.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Novedad eliminada exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en deleteNovedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la novedad",
      error: error.message,
    });
  }
};

/**
 * Obtener historial de estados
 * GET /api/v1/novedades/:id/historial
 */
export const getHistorialEstados = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialEstadoNovedad.findAll({
      where: { novedad_id: id },
      include: [
        {
          model: EstadoNovedad,
          as: "estadoAnterior",
          attributes: ["id", "nombre", "color_hex"],
        },
        {
          model: EstadoNovedad,
          as: "estadoNuevo",
          attributes: ["id", "nombre", "color_hex"],
        },
        {
          model: Usuario,
          as: "historialEstadoNovedadUsuario",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["fecha_cambio", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Historial obtenido exitosamente",
      data: historial,
      total: historial.length,
    });
  } catch (error) {
    console.error("❌ Error en getHistorialEstados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial de estados",
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas del dashboard
 * GET /api/v1/novedades/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Usar zona horaria de Perú (UTC-5)
    const ahora = new Date();
    const offsetPeru = -5 * 60; // UTC-5 en minutos
    const ahoraPeru = new Date(ahora.getTime() + (offsetPeru - ahora.getTimezoneOffset()) * 60000);
    
    const hoy = new Date(ahoraPeru);
    hoy.setHours(0, 0, 0, 0);

    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const totalNovedades = await Novedad.count({
      where: {
        fecha_hora_ocurrencia: {
          [Op.gte]: hoy,
          [Op.lt]: mañana,
        },
        estado: 1,
        deleted_at: null,
      },
    });

    const novedadesPorEstado = await Novedad.findAll({
      where: {
        fecha_hora_ocurrencia: {
          [Op.gte]: hoy,
          [Op.lt]: mañana,
        },
        estado: 1,
        deleted_at: null,
      },
      attributes: [
        "estado_novedad_id",
        [sequelize.fn("COUNT", sequelize.col("Novedad.id")), "cantidad"],
      ],
      include: [
        {
          model: EstadoNovedad,
          as: "novedadEstado",
          attributes: ["nombre", "color_hex", "icono"],
        },
      ],
      group: ["estado_novedad_id", "novedadEstado.id"],
      raw: false,
    });

    const novedadesPorTipo = await Novedad.findAll({
      where: {
        fecha_hora_ocurrencia: {
          [Op.gte]: hoy,
          [Op.lt]: mañana,
        },
        estado: 1,
        deleted_at: null,
      },
      attributes: [
        "tipo_novedad_id",
        [sequelize.fn("COUNT", sequelize.col("Novedad.id")), "cantidad"],
      ],
      include: [
        {
          model: TipoNovedad,
          as: "novedadTipoNovedad",
          attributes: ["nombre", "color_hex", "icono"],
        },
      ],
      group: ["tipo_novedad_id", "novedadTipoNovedad.id"],
      raw: false,
    });

    const novedadesPorPrioridad = await Novedad.findAll({
      where: {
        fecha_hora_ocurrencia: {
          [Op.gte]: hoy,
          [Op.lt]: mañana,
        },
        estado: 1,
        deleted_at: null,
      },
      attributes: [
        "prioridad_actual",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["prioridad_actual"],
      raw: true,
    });

    const tiempoPromedio = await Novedad.findOne({
      where: {
        fecha_hora_ocurrencia: {
          [Op.gte]: hoy,
          [Op.lt]: mañana,
        },
        tiempo_respuesta_min: { [Op.ne]: null },
        estado: 1,
        deleted_at: null,
      },
      attributes: [
        [
          sequelize.fn("AVG", sequelize.col("tiempo_respuesta_min")),
          "promedio",
        ],
      ],
      raw: true,
    });

    res.status(200).json({
      success: true,
      message: "Estadísticas obtenidas exitosamente",
      data: {
        totalNovedades,
        novedadesPorEstado,
        novedadesPorTipo,
        novedadesPorPrioridad,
        tiempoPromedioRespuesta: Math.round(tiempoPromedio?.promedio || 0),
        fecha: hoy,
      },
    });
  } catch (error) {
    console.error("❌ Error en getDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del dashboard",
      error: error.message,
    });
  }
};

export default {
  getAllNovedades,
  getNovedadById,
  createNovedad,
  updateNovedad,
  asignarRecursos,
  deleteNovedad,
  getHistorialEstados,
  getDashboardStats,
};
