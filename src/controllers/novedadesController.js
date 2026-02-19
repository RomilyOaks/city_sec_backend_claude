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
  RadioTetra,
  HistorialEstadoNovedad,
  Usuario,
} from "../models/index.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import { DEFAULT_UBIGEO_CODE } from "../config/constants.js";
import { getNowInTimezone, convertToTimezone, getDateInTimezone, rawDate } from "../utils/dateHelper.js";

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
      origen_llamada,
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
      // Usar rawDate para que mysql2 no aplique conversión timezone
      whereClause.fecha_hora_ocurrencia = {
        [Op.between]: [
          rawDate(`${fecha_inicio} 00:00:00`, sequelize),
          rawDate(`${fecha_fin} 23:59:59`, sequelize),
        ],
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

    if (origen_llamada) {
      whereClause.origen_llamada = origen_llamada;
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
      const sortFields = sort.split(",").map(f => f.trim());
      const sortOrders = order ? order.split(",").map(o => o.trim().toUpperCase()) : [];

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
        { model: RadioTetra, as: "radio_tetra", required: false, attributes: ["id", "radio_tetra_code", "descripcion", "estado"] },
        { model: PersonalSeguridad, as: "novedadPersonalCargo", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
        { model: PersonalSeguridad, as: "novedadPersonal2", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
        { model: PersonalSeguridad, as: "novedadPersonal3", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
        { model: PersonalSeguridad, as: "novedadPersonal4", required: false, attributes: ["id", "doc_numero", "nombres", "apellido_paterno", "apellido_materno"] },
        { model: Usuario, as: "usuarioDespacho", required: false, attributes: ["id", "username", "email"] },
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
      radio_tetra_id,
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

    // Convertir fecha_hora_ocurrencia a string Perú (evita doble conversión de mysql2)
    const fechaOcurrenciaLocal = fecha_hora_ocurrencia
      ? convertToTimezone(fecha_hora_ocurrencia)
      : getNowInTimezone();

    // Extraer hora del string "YYYY-MM-DD HH:mm:ss"
    const hora = parseInt(fechaOcurrenciaLocal.split(" ")[1].split(":")[0], 10);
    let turno = "MAÑANA";
    if (hora >= 14 && hora < 22) {
      turno = "TARDE";
    } else if (hora >= 22 || hora < 6) {
      turno = "NOCHE";
    }

    const nuevaNovedad = await Novedad.create(
      {
        novedad_code,
        fecha_hora_ocurrencia: rawDate(fechaOcurrenciaLocal, sequelize),
        fecha_hora_reporte: rawDate(getNowInTimezone(), sequelize),
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
        ubigeo_code: ubigeo_code || DEFAULT_UBIGEO_CODE,
        origen_llamada: origen_llamada || "TELEFONO_107",
        radio_tetra_id: radio_tetra_id || null,
        reportante_nombre,
        reportante_telefono,
        reportante_doc_identidad,
        es_anonimo: es_anonimo || 0,
        descripcion,
        observaciones,
        prioridad_actual: subtipo.prioridad || "MEDIA",
        turno,
        num_personas_afectadas: num_personas_afectadas || 0,
        usuario_registro: req.user.personal_seguridad_id,
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
        created_by: req.user.id,
        updated_by: req.user.id,
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

    // Validar que novedades despachadas solo sean editadas por el usuario que despachó
    if (novedad.usuario_despacho && novedad.usuario_despacho !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Solo el usuario que despachó esta novedad puede editarla",
      });
    }

    // NOTA: No creamos manualmente el registro en historial_estado_novedades
    // El trigger 'trg_novedades_incidentes_after_update' se encarga automáticamente
    // de crear el registro cuando detecta cambio en estado_novedad_id

    if (datosActualizacion.fecha_llegada && !novedad.fecha_llegada) {
      const tiempoRespuesta = Math.floor(
        (new Date(convertToTimezone(datosActualizacion.fecha_llegada)) -
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
      turno,
      observaciones,
      estado_novedad_id,
      requiere_seguimiento,
      fecha_proxima_revision,
      perdidas_materiales_estimadas,
      historial  // ✅ NUEVO: Objeto historial del frontend
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

    // Validar que re-despachos solo los haga el usuario que despachó originalmente
    if (novedad.usuario_despacho && novedad.usuario_despacho !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Solo el usuario que despachó esta novedad puede modificar la asignación",
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
    if (observaciones) datosActualizacion.observaciones = observaciones;
    if (fecha_llegada) datosActualizacion.fecha_llegada = rawDate(convertToTimezone(fecha_llegada), sequelize);
    if (requiere_seguimiento !== undefined) datosActualizacion.requiere_seguimiento = requiere_seguimiento;
    if (fecha_proxima_revision) datosActualizacion.fecha_proxima_revision = rawDate(convertToTimezone(fecha_proxima_revision), sequelize);
    if (perdidas_materiales_estimadas) datosActualizacion.perdidas_materiales_estimadas = perdidas_materiales_estimadas;
    // Fecha de despacho: usar la proporcionada o la actual (timezone Perú)
    datosActualizacion.fecha_despacho = rawDate(fecha_despacho ? convertToTimezone(fecha_despacho) : getNowInTimezone(), sequelize);
    // Registrar quién despacha (solo si aún no tiene usuario_despacho asignado)
    if (!novedad.usuario_despacho) {
      datosActualizacion.usuario_despacho = req.user.id;
    }
    
    // Actualizar estado: usar el proporcionado explícitamente o el de despacho automático
    if (estado_novedad_id) {
      datosActualizacion.estado_novedad_id = estado_novedad_id;
    } else if (estadoDespacho) {
      datosActualizacion.estado_novedad_id = estadoDespacho.id;
    }

    await novedad.update(datosActualizacion, { transaction });

    // Crear registro en historial manualmente con datos del frontend
    // IMPORTANTE: Esto evita que el trigger cree un registro sin observaciones
    // El frontend envía el objeto 'historial' con todos los campos necesarios
    if (historial && datosActualizacion.estado_novedad_id && datosActualizacion.estado_novedad_id !== estadoAnteriorId) {
      await HistorialEstadoNovedad.create(
        {
          novedad_id: id,
          estado_anterior_id: historial.estado_anterior_id || estadoAnteriorId,
          estado_nuevo_id: historial.estado_nuevo_id || datosActualizacion.estado_novedad_id,
          usuario_id: req.user.id,
          tiempo_en_estado_min: historial.tiempo_en_estado_min || null,
          observaciones: historial.observaciones || observaciones,
          fecha_cambio: rawDate(historial.fecha_cambio ? convertToTimezone(historial.fecha_cambio) : getNowInTimezone(), sequelize),
          metadata: historial.metadata || null,
          created_by: historial.created_by || req.user.id,
          updated_by: historial.updated_by || req.user.id,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const novedadActualizadaRecursos = await Novedad.findByPk(id, {
      include: [
        { model: UnidadOficina, as: "novedadUnidadOficina" },
        { model: Vehiculo, as: "novedadVehiculo" },
        { model: EstadoNovedad, as: "novedadEstado" },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Recursos asignados exitosamente",
      data: novedadActualizadaRecursos,
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
      deleted_at: rawDate(getNowInTimezone(), sequelize),
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
    // Usar rawDate para evitar doble conversión de mysql2 en WHERE
    const fechaHoyStr = getDateInTimezone(); // "YYYY-MM-DD" en hora Perú
    const hoy = rawDate(`${fechaHoyStr} 00:00:00`, sequelize);
    const [y, m, d] = fechaHoyStr.split("-").map(Number);
    const nextDay = new Date(y, m - 1, d + 1);
    const mañana = rawDate(`${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")} 00:00:00`, sequelize);

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

/**
 * Obtener estadísticas de novedades en atención
 * GET /api/v1/novedades/dashboard/en-atencion
 *
 * Retorna novedades con estados activos:
 * - DESPACHADA (2)
 * - EN RUTA (3)
 * - EN LUGAR (4)
 * - EN ATENCION (5)
 */
export const getNovedadesEnAtencion = async (req, res) => {
  try {
    // IDs de estados "en atención" (activos/en proceso)
    const ESTADOS_EN_ATENCION = [2, 3, 4, 5];

    // Condición base para novedades activas en atención
    const whereCondition = {
      estado_novedad_id: { [Op.in]: ESTADOS_EN_ATENCION },
      estado: 1,
      deleted_at: null,
    };

    // Total de novedades en atención
    const totalEnAtencion = await Novedad.count({
      where: whereCondition,
    });

    // Desglose por estado
    const porEstado = await Novedad.findAll({
      where: whereCondition,
      attributes: [
        "estado_novedad_id",
        [sequelize.fn("COUNT", sequelize.col("Novedad.id")), "cantidad"],
      ],
      include: [
        {
          model: EstadoNovedad,
          as: "novedadEstado",
          attributes: ["id", "nombre", "color_hex", "icono", "orden"],
        },
      ],
      group: ["estado_novedad_id", "novedadEstado.id"],
      order: [[{ model: EstadoNovedad, as: "novedadEstado" }, "orden", "ASC"]],
      raw: false,
    });

    // Desglose por prioridad
    const porPrioridad = await Novedad.findAll({
      where: whereCondition,
      attributes: [
        "prioridad_actual",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["prioridad_actual"],
      raw: true,
    });

    // Desglose por tipo de novedad
    const porTipo = await Novedad.findAll({
      where: whereCondition,
      attributes: [
        "tipo_novedad_id",
        [sequelize.fn("COUNT", sequelize.col("Novedad.id")), "cantidad"],
      ],
      include: [
        {
          model: TipoNovedad,
          as: "novedadTipoNovedad",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
      ],
      group: ["tipo_novedad_id", "novedadTipoNovedad.id"],
      raw: false,
    });

    // Lista detallada de novedades en atención (últimas 50)
    const novedadesDetalle = await Novedad.findAll({
      where: whereCondition,
      attributes: [
        "id",
        "novedad_code",
        "fecha_hora_ocurrencia",
        "localizacion",
        "prioridad_actual",
        "fecha_despacho",
        "tiempo_respuesta_min",
      ],
      include: [
        {
          model: EstadoNovedad,
          as: "novedadEstado",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
        {
          model: TipoNovedad,
          as: "novedadTipoNovedad",
          attributes: ["id", "nombre", "color_hex"],
        },
        {
          model: UnidadOficina,
          as: "novedadUnidadOficina",
          attributes: ["id", "nombre", "codigo"],
        },
        {
          model: Vehiculo,
          as: "novedadVehiculo",
          attributes: ["id", "placa", "codigo_vehiculo"],
        },
      ],
      order: [
        ["prioridad_actual", "DESC"],
        ["fecha_hora_ocurrencia", "ASC"],
      ],
      limit: 50,
    });

    res.status(200).json({
      success: true,
      message: "Novedades en atención obtenidas exitosamente",
      data: {
        totalEnAtencion,
        porEstado,
        porPrioridad,
        porTipo,
        novedadesDetalle,
        estadosIncluidos: ESTADOS_EN_ATENCION,
      },
    });
  } catch (error) {
    console.error("❌ Error en getNovedadesEnAtencion:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener novedades en atención",
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
  getNovedadesEnAtencion,
};
