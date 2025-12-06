/**
 * novedadesController.js
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
  //HistorialEstadoNovedad,
} from "../models/index.js";
import { Op } from "sequelize";

/**
 * Obtener todas las novedades con filtros opcionales
 * Permisos: operador, supervisor, administrador
 * @route GET /api/novedades
 */
exports.getAllNovedades = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      estado_id,
      prioridad,
      sector_id,
      tipo_id,
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

    // Filtro por estado
    if (estado_id) {
      whereClause.estado_novedad_id = estado_id;
    }

    // Filtro por prioridad
    if (prioridad) {
      whereClause.prioridad_actual = prioridad;
    }

    // Filtro por sector
    if (sector_id) {
      whereClause.sector_id = sector_id;
    }

    // Filtro por tipo
    if (tipo_id) {
      whereClause.tipo_novedad_id = tipo_id;
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
exports.getNovedadById = async (req, res) => {
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
exports.createNovedad = async (req, res) => {
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
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: tipo_novedad_id, subtipo_novedad_id, fecha_hora",
      });
    }

    // Obtener estado inicial
    const estadoInicial = await EstadoNovedad.findOne({
      where: { es_inicial: 1, estado: 1 },
    });

    if (!estadoInicial) {
      return res.status(500).json({
        success: false,
        message: "No se encontró un estado inicial configurado",
      });
    }

    // Obtener prioridad del subtipo
    const subtipo = await SubtipoNovedad.findByPk(subtipo_novedad_id);
    if (!subtipo) {
      return res.status(404).json({
        success: false,
        message: "Subtipo de novedad no encontrado",
      });
    }

    // Generar código de novedad único
    const ultimaNovedad = await Novedad.findOne({
      order: [["id", "DESC"]],
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
    const nuevaNovedad = await Novedad.create({
      novedad_code,
      fecha_hora,
      tipo_icono_novedad,
      tipo_novedad_id,
      subtipo_novedad_id,
      estado_novedad_id: estadoInicial.id,
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
      created_by: req.user.id, // Usuario autenticado
    });

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
exports.updateNovedad = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Buscar la novedad
    const novedad = await Novedad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!novedad) {
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
        (Date.now() - novedad.updated_at) / 60000
      ); // minutos

      await HistorialEstadoNovedad.create({
        novedad_id: id,
        estado_anterior_id: novedad.estado_novedad_id,
        estado_nuevo_id: datosActualizacion.estado_novedad_id,
        usuario_id: req.user.id,
        tiempo_en_estado_min: tiempoEstado,
        observaciones: datosActualizacion.observaciones_cambio_estado,
      });
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
    await novedad.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

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
exports.asignarRecursos = async (req, res) => {
  try {
    const { id } = req.params;
    const { unidad_oficina_id, vehiculo_id, personal_cargo_id, km_inicial } =
      req.body;

    const novedad = await Novedad.findOne({
      where: { id, estado: 1, deleted_at: null },
    });

    if (!novedad) {
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
    });

    await novedad.update({
      unidad_oficina_id,
      vehiculo_id,
      personal_cargo_id,
      km_inicial,
      fecha_despacho: new Date(),
      estado_novedad_id: estadoDespacho
        ? estadoDespacho.id
        : novedad.estado_novedad_id,
      updated_by: req.user.id,
    });

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
exports.deleteNovedad = async (req, res) => {
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
exports.getHistorialEstados = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialEstadoNovedad.findAll({
      where: { novedad_id: id },
      include: [
        {
          model: EstadoNovedad,
          as: "estado_anterior",
          attributes: ["id", "nombre", "color_hex"],
        },
        {
          model: EstadoNovedad,
          as: "estado_nuevo",
          attributes: ["id", "nombre", "color_hex"],
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
exports.getDashboardStats = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Novedades del día agrupadas por estado
    const novedadesHoy = await Novedad.findAll({
      where: {
        fecha_hora: { [Op.gte]: hoy },
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: EstadoNovedad,
          as: "estado",
          attributes: ["nombre", "color_hex"],
        },
      ],
      attributes: [
        "estado_novedad_id",
        "prioridad_actual",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["estado_novedad_id", "prioridad_actual"],
    });

    // Novedades por tipo del día
    const novedadesPorTipo = await Novedad.findAll({
      where: {
        fecha_hora: { [Op.gte]: hoy },
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: TipoNovedad,
          as: "tipo",
          attributes: ["nombre", "color_hex"],
        },
      ],
      attributes: [
        "tipo_novedad_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["tipo_novedad_id"],
    });

    // Tiempo promedio de respuesta del día
    const tiempoPromedio = await Novedad.findOne({
      where: {
        fecha_hora: { [Op.gte]: hoy },
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
    });

    res.status(200).json({
      success: true,
      data: {
        novedadesHoy,
        novedadesPorTipo,
        tiempoPromedioRespuesta: tiempoPromedio?.promedio || 0,
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

export default exports;
