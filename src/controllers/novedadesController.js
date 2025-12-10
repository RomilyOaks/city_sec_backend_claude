/**
 * ============================================
 * CONTROLADOR: src/controllers/novedadesController.js
 * ============================================
 *
 * Controlador de Novedades/Incidentes
 * Gestiona el CRUD de novedades e incidentes de seguridad ciudadana
 * Implementa control de acceso RBAC
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
 * Obtener todas las novedades con filtros opcionales
 * Permisos: operador, supervisor, administrador
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

    // Construir filtros dinámicos
    const whereClause = {
      estado: 1,
      deleted_at: null,
    };

    // Filtro por rango de fechas
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_hora = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    // Filtro por estado de Novedad
    if (estado_novedad_id) {
      whereClause.estado_novedad_id = estado_novedad_id;
    }

    // Filtro por prioridad
    if (prioridad) {
      whereClause.prioridad_actual = prioridad_actual;
    }

    // Filtro por sector
    if (sector_id) {
      whereClause.sector_id = sector_id;
    }

    // Filtro por tipo
    if (tipo_novedad_id) {
      whereClause.tipo_novedad_id = tipo_novedad_id;
    }

    // Búsqueda por texto
    if (search) {
      whereClause[Op.or] = [
        { novedad_code: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
        { localizacion: { [Op.like]: `%${search}%` } },
        { reportante_nombre: { [Op.like]: `%${search}%` } },
      ];
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Consulta con relaciones y paginación
    const { count, rows } = await Novedad.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TipoNovedad,
          as: "tipo",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
        {
          model: SubtipoNovedad,
          as: "subtipo",
          attributes: ["id", "nombre", "prioridad"],
        },
        {
          model: EstadoNovedad,
          as: "estado",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre", "sector_code"],
        },
        {
          model: Cuadrante,
          as: "cuadrante",
          attributes: ["id", "nombre", "cuadrante_code"],
        },
        {
          model: UnidadOficina,
          as: "unidad",
          attributes: ["id", "nombre", "codigo"],
        },
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "codigo_vehiculo", "placa"],
        },
        {
          model: PersonalSeguridad,
          as: "personal",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
        },
      ],
      order: [
        ["prioridad_actual", "DESC"],
        ["fecha_hora", "DESC"],
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
 * Permisos: operador, supervisor, administrador
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
        {
          model: TipoNovedad,
          as: "tipo",
        },
        {
          model: SubtipoNovedad,
          as: "subtipo",
        },
        {
          model: EstadoNovedad,
          as: "estado",
        },
        {
          model: Sector,
          as: "sector",
        },
        {
          model: Cuadrante,
          as: "cuadrante",
        },
        {
          model: UnidadOficina,
          as: "unidad",
        },
        {
          model: Vehiculo,
          as: "vehiculo",
        },
        {
          model: PersonalSeguridad,
          as: "personal",
        },
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
 * Permisos: operador, supervisor, administrador
 * @route POST /api/novedades
 */
const createNovedad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      tipo_novedad_id,
      subtipo_novedad_id,
      fecha_hora,
      localizacion,
      referencia,
      latitud,
      longitud,
      ubigeo,
      origen_llamada,
      reportante_nombre,
      reportante_telefono,
      reportante_dni,
      descripcion,
      observaciones,
      sector_id,
      cuadrante_id,
      tipo_icono_novedad,
    } = req.body;

    // Validar campos requeridos
    if (!tipo_novedad_id || !subtipo_novedad_id || !fecha_hora) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: tipo_novedad_id, subtipo_novedad_id, fecha_hora",
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

    // Generar código de novedad único
    const ultimaNovedad = await Novedad.findOne({
      order: [["id", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const siguienteNumero = ultimaNovedad
      ? parseInt(ultimaNovedad.novedad_code) + 1
      : 1;
    const novedad_code = String(siguienteNumero).padStart(6, "0");

    // Determinar turno basado en la hora
    const hora = new Date(fecha_hora).getHours();
    let turno = "MAÑANA";
    if (hora >= 14 && hora < 22) {
      turno = "TARDE";
    } else if (hora >= 22 || hora < 6) {
      turno = "NOCHE";
    }

    // Crear la novedad
    const nuevaNovedad = await Novedad.create(
      {
        novedad_code,
        fecha_hora,
        tipo_icono_novedad,
        tipo_novedad_id,
        subtipo_novedad_id,
        estado_novedad_id,
        sector_id,
        cuadrante_id,
        localizacion,
        referencia,
        latitud,
        longitud,
        ubigeo,
        origen_llamada: origen_llamada || "TELEFONO_107",
        reportante_nombre,
        reportante_telefono,
        reportante_dni,
        descripcion,
        observaciones,
        prioridad_actual: subtipo.prioridad,
        turno,
        created_by: req.user.id,
      },
      { transaction }
    );

    // Registrar cambio de estado inicial
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

    // Obtener novedad completa con relaciones
    const novedadCompleta = await Novedad.findByPk(nuevaNovedad.id, {
      include: [
        { model: TipoNovedad, as: "tipo" },
        { model: SubtipoNovedad, as: "subtipo" },
        { model: EstadoNovedad, as: "estado" },
        { model: Sector, as: "sector" },
        { model: Cuadrante, as: "cuadrante" },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Novedad creada exitosamente",
      data: novedadCompleta,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al crear novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la novedad",
      error: error.message,
    });
  }
};

/**
 * Actualizar una novedad existente
 * Permisos: supervisor, administrador
 * @route PUT /api/novedades/:id
 */
const updateNovedad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Buscar la novedad
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

    // Calcular tiempo de respuesta si se registra llegada
    if (datosActualizacion.fecha_llegada && !novedad.fecha_llegada) {
      const tiempoRespuesta = Math.floor(
        (new Date(datosActualizacion.fecha_llegada) -
          new Date(novedad.fecha_hora)) /
          60000
      );
      datosActualizacion.tiempo_respuesta_min = tiempoRespuesta;
    }

    // Actualizar novedad
    await novedad.update(
      {
        ...datosActualizacion,
        updated_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Obtener novedad actualizada con relaciones
    const novedadActualizada = await Novedad.findByPk(id, {
      include: [
        { model: TipoNovedad, as: "tipo" },
        { model: SubtipoNovedad, as: "subtipo" },
        { model: EstadoNovedad, as: "estado" },
        { model: Sector, as: "sector" },
        { model: Cuadrante, as: "cuadrante" },
        { model: UnidadOficina, as: "unidad" },
        { model: Vehiculo, as: "vehiculo" },
        { model: PersonalSeguridad, as: "personal" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Novedad actualizada exitosamente",
      data: novedadActualizada,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al actualizar novedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la novedad",
      error: error.message,
    });
  }
};

/**
 * Asignar unidad y recursos a una novedad
 * Permisos: operador, supervisor, administrador
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

    // Registrar cambio de estado si cambió
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
        { model: UnidadOficina, as: "unidad" },
        { model: Vehiculo, as: "vehiculo" },
        { model: PersonalSeguridad, as: "personal" },
        { model: EstadoNovedad, as: "estado" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Recursos asignados exitosamente",
      data: novedadActualizada,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al asignar recursos:", error);
    res.status(500).json({
      success: false,
      message: "Error al asignar recursos",
      error: error.message,
    });
  }
};

/**
 * Eliminar (soft delete) una novedad
 * Permisos: administrador
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

    // Soft delete
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
 * Obtener historial de estados de una novedad
 * Permisos: operador, supervisor, administrador
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
          as: "usuario",
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
 * Obtener dashboard con estadísticas de novedades
 * Permisos: todos los usuarios autenticados
 * @route GET /api/novedades/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    // Novedades del día agrupadas por estado
    const novedadesPorEstado = await Novedad.findAll({
      where: {
        fecha_hora: {
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
          as: "estado",
          attributes: ["nombre", "color_hex", "icono"],
        },
      ],
      group: ["estado_novedad_id", "estado.id"],
      raw: false,
    });

    // Novedades por tipo del día
    const novedadesPorTipo = await Novedad.findAll({
      where: {
        fecha_hora: {
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
          as: "tipo",
          attributes: ["nombre", "color_hex", "icono"],
        },
      ],
      group: ["tipo_novedad_id", "tipo.id"],
      raw: false,
    });

    // Novedades por prioridad
    const novedadesPorPrioridad = await Novedad.findAll({
      where: {
        fecha_hora: {
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

    // Tiempo promedio de respuesta del día
    const tiempoPromedio = await Novedad.findOne({
      where: {
        fecha_hora: {
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

    // Total de novedades del día
    const totalNovedades = await Novedad.count({
      where: {
        fecha_hora: {
          [Op.gte]: hoy,
          [Op.lt]: mañana,
        },
        estado: 1,
        deleted_at: null,
      },
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
