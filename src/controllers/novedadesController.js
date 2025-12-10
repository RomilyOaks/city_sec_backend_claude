/**
 * ============================================
 * CONTROLADOR: src/controllers/novedadesController.js
 * ============================================
 * VERSIÓN CORREGIDA - Campos y alias consistentes
 */

import {
  Novedad,
  TipoNovedad,
  SubtipoNovedad,
  EstadoNovedad,
  Sector,
  Cuadrante,
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
 * @route GET /api/novedades
 */
const getAllNovedades = async (req, res) => {
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
    } = req.query;

    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    // 🔥 Filtro por rango de fechas (usar fecha_hora_ocurrencia)
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
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Novedad.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TipoNovedad,
          as: "novedadTipoNovedad", // 🔥 Usar alias definidos en index.js
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
      order: [
        ["prioridad_actual", "DESC"],
        ["fecha_hora_ocurrencia", "DESC"],
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
    console.error("Error al obtener novedades:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las novedades",
      error: error.message,
    });
  }
};

/**
 * Obtener una novedad por ID
 * @route GET /api/novedades/:id
 */
const getNovedadById = async (req, res) => {
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
      data: novedad,
    });
  } catch (error) {
    console.error("Error al obtener novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la novedad",
      error: error.message,
    });
  }
};

/**
 * Crear una nueva novedad
 * @route POST /api/novedades
 */
const createNovedad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      tipo_novedad_id,
      subtipo_novedad_id,
      fecha_hora_ocurrencia, // 🔥 Campo correcto
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
    } = req.body;

    // Validar campos requeridos
    if (
      !tipo_novedad_id ||
      !subtipo_novedad_id ||
      !fecha_hora_ocurrencia ||
      !descripcion
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: tipo_novedad_id, subtipo_novedad_id, fecha_hora_ocurrencia, descripcion",
      });
    }

    // Obtener estado inicial
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

    // Obtener prioridad del subtipo
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

    // Generar código único
    const ultimaNovedad = await Novedad.findOne({
      order: [["id", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const siguienteNumero = ultimaNovedad
      ? parseInt(ultimaNovedad.novedad_code) + 1
      : 1;
    const novedad_code = String(siguienteNumero).padStart(6, "0");

    // Determinar turno
    const hora = new Date(fecha_hora_ocurrencia).getHours();
    let turno = "MAÑANA";
    if (hora >= 14 && hora < 22) {
      turno = "TARDE";
    } else if (hora >= 22 || hora < 6) {
      turno = "NOCHE";
    }

    // Crear novedad
    const nuevaNovedad = await Novedad.create(
      {
        novedad_code,
        fecha_hora_ocurrencia, // 🔥 Campo correcto
        fecha_hora_reporte: new Date(),
        tipo_novedad_id,
        subtipo_novedad_id,
        estado_novedad_id: estadoInicial.id,
        sector_id,
        cuadrante_id,
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
        usuario_registro: req.user.id, // 🔥 Campo correcto
        created_by: req.user.id,
      },
      { transaction }
    );

    // Registrar historial
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

    // Obtener completa
    const novedadCompleta = await Novedad.findByPk(nuevaNovedad.id, {
      include: [
        { model: TipoNovedad, as: "novedadTipoNovedad" },
        { model: SubtipoNovedad, as: "novedadSubtipoNovedad" },
        { model: EstadoNovedad, as: "novedadEstado" },
        { model: Sector, as: "novedadSector" },
        { model: Cuadrante, as: "novedadCuadrante" },
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
    console.error("Error al crear novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la novedad",
      error: error.message,
    });
  }
};

/**
 * Actualizar novedad
 * @route PUT /api/novedades/:id
 */
const updateNovedad = async (req, res) => {
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

    // Registrar cambio de estado si aplica
    if (
      datosActualizacion.estado_novedad_id &&
      datosActualizacion.estado_novedad_id !== novedad.estado_novedad_id
    ) {
      const tiempoEstado = Math.floor(
        (Date.now() - new Date(novedad.updated_at)) / 60000
      );

      await HistorialEstadoNovedad.create(
        {
          novedad_id: id,
          estado_anterior_id: novedad.estado_novedad_id,
          estado_nuevo_id: datosActualizacion.estado_novedad_id,
          usuario_id: req.user.id,
          tiempo_en_estado_min: tiempoEstado,
          observaciones: datosActualizacion.observaciones_cambio_estado,
        },
        { transaction }
      );
    }

    // Calcular tiempo de respuesta
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
    console.error("Error al actualizar novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la novedad",
      error: error.message,
    });
  }
};

/**
 * Asignar recursos a una novedad
 * @route POST /api/novedades/:id/asignar
 */
const asignarRecursos = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { unidad_oficina_id, vehiculo_id, personal_cargo_id, km_inicial } =
      req.body;

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

    // Buscar estado "EN RUTA" o "DESPACHADO"
    const estadoDespacho = await EstadoNovedad.findOne({
      where: {
        nombre: { [Op.in]: ["EN RUTA", "DESPACHADO"] },
        estado: 1,
      },
      transaction,
    });

    const estadoAnteriorId = novedad.estado_novedad_id;

    await novedad.update(
      {
        unidad_oficina_id,
        vehiculo_id,
        personal_cargo_id,
        km_inicial,
        fecha_despacho: new Date(),
        estado_novedad_id: estadoDespacho
          ? estadoDespacho.id
          : novedad.estado_novedad_id,
        updated_by: req.user.id,
      },
      { transaction }
    );

    if (estadoDespacho && estadoDespacho.id !== estadoAnteriorId) {
      const tiempoEstado = Math.floor(
        (Date.now() - new Date(novedad.updated_at)) / 60000
      );

      await HistorialEstadoNovedad.create(
        {
          novedad_id: id,
          estado_anterior_id: estadoAnteriorId,
          estado_nuevo_id: estadoDespacho.id,
          usuario_id: req.user.id,
          tiempo_en_estado_min: tiempoEstado,
          observaciones: "Recursos asignados y unidad despachada",
        },
        { transaction }
      );
    }

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
    console.error("Error al asignar recursos:", error);
    res.status(500).json({
      success: false,
      message: "Error al asignar recursos",
      error: error.message,
    });
  }
};

/**
 * Eliminar novedad (soft delete)
 * @route DELETE /api/novedades/:id
 */
const deleteNovedad = async (req, res) => {
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
    console.error("Error al eliminar novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la novedad",
      error: error.message,
    });
  }
};

/**
 * Obtener historial de estados
 * @route GET /api/novedades/:id/historial
 */
const getHistorialEstados = async (req, res) => {
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
      order: [["fecha_cambio", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: historial,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial de estados",
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas del dashboard
 * @route GET /api/novedades/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    // Total del día
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

    // Por estado
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

    // Por tipo
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

    // Por prioridad
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

    // Tiempo promedio de respuesta
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
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del dashboard",
      error: error.message,
    });
  }
};

// 🔥 IMPORTANTE: Crear archivo novedadValidation.js con estas validaciones corregidas
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

/**
 * VALIDACIONES - Crear archivo: src/middlewares/novedadValidation.js
 *
 * body("origen_llamada")
 *   .optional()
 *   .isIn([
 *     "TELEFONO_107",
 *     "BOTON_PANICO",
 *     "CAMARA",
 *     "PATRULLAJE",
 *     "CIUDADANO",
 *     "INTERVENCION_DIRECTA",
 *     "OTROS"
 *   ])
 *   .withMessage("Origen de llamada no válido"),
 *
 * body("fecha_hora_ocurrencia") // 🔥 NO "fecha_hora"
 *   .notEmpty()
 *   .withMessage("La fecha y hora son requeridas")
 *   .isISO8601()
 *   .withMessage("La fecha debe estar en formato ISO 8601"),
 */
