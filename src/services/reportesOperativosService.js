/**
 * ===================================================
 * SERVICIO: Reportes Operativos
 * ===================================================
 *
 * Ruta: src/services/reportesOperativosService.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-04-23
 *
 * Descripción:
 * Servicio para gestión de reportes de operativos de patrullaje.
 * Implementa queries optimizados basados en los SQL proporcionados
 * para operativos vehiculares, a pie y novedades.
 *
 * @author Windsurf AI
 * @supervisor Romily Oaks
 * @version 1.0.0
 */

import { Op, Sequelize, QueryTypes } from "sequelize";
import models from "../models/index.js";
import { sequelize as db } from "../models/index.js";

const {
  Novedad,
  OperativosVehiculos,
  OperativosVehiculosCuadrantes,
  OperativosVehiculosNovedades,
  OperativosTurno,
  OperativosPersonal,
  OperativosPersonalCuadrantes,
  OperativosPersonalNovedades,
  PersonalSeguridad,
  Cargo,
  Vehiculo,
  TipoVehiculo,
  Cuadrante,
  Sector,
  RadioTetra,
  TipoCopiloto,
  EstadoOperativoRecurso,
  TipoNovedad,
  SubtipoNovedad
} = models;

/**
 * Construye filtros para consultas de reportes
 * @param {Object} queryParams - Parámetros de la query
 * @returns {Object} Objeto de filtros Sequelize
 */
const buildFilters = (queryParams) => {
  const filters = {};

  // Filtros de fecha
  if (queryParams.fecha_inicio || queryParams.fecha_fin) {
    filters.fecha_hora_ocurrencia = {};
    if (queryParams.fecha_inicio) {
      filters.fecha_hora_ocurrencia[Op.gte] = new Date(`${queryParams.fecha_inicio}T00:00:00.000Z`);
    }
    if (queryParams.fecha_fin) {
      filters.fecha_hora_ocurrencia[Op.lte] = new Date(`${queryParams.fecha_fin}T23:59:59.999Z`);
    }
  }

  // Filtros de novedad
  if (queryParams.estado_novedad !== undefined) {
    filters.estado = queryParams.estado_novedad;
  } else {
    filters.estado = 1; // Solo novedades activas por defecto
  }

  // Soft delete
  if (!queryParams.include_deleted) {
    filters.deleted_at = null;
  }

  return filters;
};

/**
 * Construye opciones de paginación y ordenamiento
 * @param {Object} queryParams - Parámetros de la query
 * @returns {Object} Objeto de opciones
 */
const buildPaginationOptions = (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = Math.min(parseInt(queryParams.limit) || 50, 1000);
  const offset = (page - 1) * limit;

  const sort = queryParams.sort || "fecha_hora_ocurrencia";
  const order = queryParams.order?.toUpperCase() === "ASC" ? "ASC" : "DESC";

  return {
    limit,
    offset,
    order: [[sort, order]],
    pagination: {
      page,
      limit,
      totalPages: 0,
      total: 0
    }
  };
};

/**
 * Obtiene operativos vehiculares con novedades atendidas usando SQL directo
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Datos de operativos vehiculares
 */
export const getOperativosVehiculares = async (queryParams = {}) => {
  try {
    const { fecha_inicio, fecha_fin, estado_novedad_id, page = 1, limit = 10 } = queryParams;
    
    // Sanitización de parámetros con valores por defecto
    const today = new Date();
    const defaultFechaInicio = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split("T")[0];
    const defaultFechaFin = today.toISOString().split("T")[0];
    
    const sanitizedFechaInicio = fecha_inicio ? fecha_inicio.replace(/[^0-9-]/g, "") : defaultFechaInicio;
    const sanitizedFechaFin = fecha_fin ? fecha_fin.replace(/[^0-9-]/g, "") : defaultFechaFin;
    const sanitizedEstadoNovedadId = estado_novedad_id ? parseInt(estado_novedad_id) : null;
    const sanitizedPage = Math.max(1, parseInt(page)) || 1;
    const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit))) || 10;
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    // Query SQL completo basado en el documento actualizado con todos los campos y alias correctos
    const baseQuery = `
      SELECT 
        ot.fecha fecha_turno,
        ht.nro_orden nro_orden_turno,
        ot.turno,
        ht.hora_inicio turno_horario_inicio,
        ht.hora_fin turno_horario_fin,
        ot.fecha_hora_inicio inicio_operativo_sector,
        ot.fecha_hora_fin fin_operativo_sector,
        ot.operador_id,
        CONCAT(usr.username, ', ', usr.nombres, ' ', usr.apellidos) AS Usuario_Operador_Sistema,
        carg_sis.nombre Cargo_Usuario_Operador,
        ot.sector_id,
        sec.sector_code,
        sec.nombre nombre_sector,
        ot.supervisor_id,
        CONCAT(ps1.nombres, ', ', ps1.apellido_paterno, ' ', ps1.apellido_materno) AS Supervisor_Sector,
        carg_sup.nombre Cargo_Supervisor,
        ot.observaciones observaciones_turno,
        ot.estado estado_operativo_sector,
        ot.updated_by,
        CONCAT(usr4.username, ', ', usr4.nombres, ' ', usr4.apellidos) AS Usuario_Actualizador_Turno,
        carg_t.nombre Cargo_Usuario_Actualizador_Turno,
        ot.updated_at Fecha_Turno_Actualizado,
        ov.vehiculo_id,
        tv.nombre tipo_vehiculo,
        v.codigo_vehiculo,
        v.nombre nombre_vehiculo,
        v.placa placa_vehiculo,
        v.marca marca_vehiculo,
        v.soat soat_vehiculo,
        v.fec_soat vencimiento_soat,
        v.fec_manten proximo_mantenimiento_vehiculo,
        ov.conductor_id,
        CONCAT(ps2.nombres, ', ', ps2.apellido_paterno, ' ', ps2.apellido_materno) AS Nombres_conductor,
        carg_chof.nombre Cargo_Conductor,
        ov.copiloto_id,
        CONCAT(ps3.nombres, ', ', ps3.apellido_paterno, ' ', ps3.apellido_materno) AS Nombres_copiloto,
        carg_copi.nombre Cargo_Copiloto,
        ov.tipo_copiloto_id,
        tcp.descripcion tipo_copiloto,
        ov.radio_tetra_id,
        rt.radio_tetra_code,
        rt.descripcion Descripcion_Radio_Tetra,
        ov.estado_operativo_id,
        Sts_Opr.descripcion estado_patrullaje_vehiculo,
        ov.kilometraje_inicio,
        ov.hora_inicio,
        ov.nivel_combustible_inicio,
        ov.kilometraje_recarga,
        ov.hora_recarga,
        ov.combustible_litros,
        ov.importe_recarga,
        ov.nivel_combustible_recarga,
        ov.kilometraje_fin,
        ov.hora_fin,
        ov.nivel_combustible_fin,
        ov.kilometros_recorridos,
        ov.observaciones observaciones_operativo_vehicular,
        ov.estado_registro Estado_registro_Operativo_Vehicular,
        ov.updated_by,
        CONCAT(usr3.username, ', ', usr3.nombres, ' ', usr3.apellidos) AS Usuario_Actualiza_Operativo_Vehiculo,
        carg_uov.nombre Cargo_Usuario_Actualiza_Operativo_Vehiculo,
        ov.updated_at Actualizacion_Operativo_Vehiculo,
        ovc.cuadrante_id,
        cua.cuadrante_code,
        cua.nombre nombre_cuadrante,
        cua.zona_code,
        ovc.hora_ingreso,
        ovc.hora_salida,
        ovc.tiempo_minutos,
        ovc.observaciones observaciones_operativo_cuadrante,
        ovc.incidentes_reportados incidentes_reportados_cuadrante,
        ovn.reportado,
        ovn.atendido,
        ovn.estado Estado_Operativo_Novedad,
        ovn.prioridad,
        ovn.observaciones Observaciones_Operativo_Novedad,
        ovn.updated_by,
        CONCAT(usr2.username, ', ', usr2.nombres, ' ', usr2.apellidos) AS Usuario_Actualiza_Operativo_Novedad,
        carg.nombre cargo_Usuario_Actualiza_Operativo_Novedad,
        ovn.updated_at Operativo_Novedad_Actualizada,
        ovn.acciones_tomadas,
        ni.id novedad_id,
        ni.novedad_code,
        ni.fecha_hora_ocurrencia,
        tn.nombre AS tipo_novedad_nombre,
        stn.nombre subtipo_novedad,
        stn.prioridad Prioridad_Novedad,
        ni.descripcion descripcion_novedad,
        ni.estado estado_novedad,
        ni.origen_llamada,
        ni.ubigeo_code,
        ni.direccion_id,
        ni.localizacion,
        ni.referencia_ubicacion,
        ni.latitud,
        ni.longitud,
        ni.ajustado_en_mapa,
        ni.fecha_ajuste_mapa,
        ni.radio_tetra_id,
        ni.es_anonimo,
        ni.reportante_nombre,
        ni.reportante_telefono,
        ni.reportante_doc_identidad,
        ni.observaciones observaciones_novedad,
        ni.personal_cargo_id,
        CONCAT(ps_aCargo.nombres, ', ', ps_aCargo.apellido_paterno, ' ', ps_aCargo.apellido_materno) AS Nombres_Personal_a_Cargo,
        carg_aCargo.nombre Cargo_Personal,
        ni.fecha_despacho,
        ni.usuario_despacho,
        CONCAT(usr_desp.username, ', ', usr_desp.nombres, ' ', usr_desp.apellidos) AS nombre_usuario_despacho,
        carg_desp.nombre Cargo_Usuario_Despacho,
        ni.fecha_llegada,
        ni.fecha_cierre,
        ni.usuario_cierre,
        CONCAT(usr_cier.username, ', ', usr_cier.nombres, ' ', usr_cier.apellidos) AS nombre_usuario_cierre,
        carg_cier.nombre Cargo_Usuario_Cierre,
        ni.km_inicial,
        ni.km_final,
        stn.tiempo_respuesta_min Base_Tiempo_Minimo,
        ni.tiempo_respuesta_min,
        ni.tiempo_respuesta_min_operativo,
        ni.prioridad_actual,
        ni.requiere_seguimiento,
        ni.fecha_proxima_revision,
        ni.num_personas_afectadas,
        ni.perdidas_materiales_estimadas,
        ni.estado_novedad_id,
        en.nombre estado_novedad_actual
      FROM novedades_incidentes ni
        INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id
        LEFT JOIN subtipos_novedad stn ON ni.subtipo_novedad_id = stn.id
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        INNER JOIN operativos_turno ot ON ov.operativo_turno_id = ot.id
        INNER JOIN horarios_turnos ht ON ot.turno = ht.turno
        INNER JOIN usuarios usr ON ot.operador_id = usr.id
        INNER JOIN personal_seguridad ps_sis ON usr.personal_seguridad_id = ps_sis.id
        LEFT JOIN cargos carg_sis ON ps_sis.cargo_id = carg_sis.id
        INNER JOIN sectores sec ON ot.sector_id = sec.id
        INNER JOIN personal_seguridad ps1 ON ot.supervisor_id = ps1.id
        LEFT JOIN cargos carg_sup ON ps1.cargo_id = carg_sup.id
        INNER JOIN vehiculos v ON ov.vehiculo_id = v.id
        INNER JOIN tipos_vehiculo tv ON v.tipo_id = tv.id
        LEFT JOIN personal_seguridad ps2 ON ov.conductor_id = ps2.id
        LEFT JOIN cargos carg_chof ON ps2.cargo_id = carg_chof.id
        LEFT JOIN personal_seguridad ps3 ON ov.copiloto_id = ps3.id
        LEFT JOIN cargos carg_copi ON ps3.cargo_id = carg_copi.id
        LEFT JOIN tipos_copiloto tcp ON ov.tipo_copiloto_id = tcp.id
        LEFT JOIN radios_tetra rt ON ov.radio_tetra_id = rt.id
        INNER JOIN cuadrantes cua ON ovc.cuadrante_id = cua.id
        LEFT JOIN usuarios usr2 ON ovn.updated_by = usr2.id
        LEFT JOIN personal_seguridad ps4 ON usr2.personal_seguridad_id = ps4.id
        LEFT JOIN cargos carg ON ps4.cargo_id = carg.id
        LEFT JOIN usuarios usr3 ON ov.updated_by = usr3.id
        LEFT JOIN personal_seguridad ps_uov ON usr3.personal_seguridad_id = ps_uov.id
        LEFT JOIN cargos carg_uov ON ps_uov.cargo_id = carg.id
        LEFT JOIN usuarios usr4 ON ot.updated_by = usr4.id
        LEFT JOIN personal_seguridad ps_t ON usr4.personal_seguridad_id = ps_t.id
        LEFT JOIN cargos carg_t ON ps_t.cargo_id = carg_t.id
        LEFT JOIN personal_seguridad ps_aCargo ON ni.personal_cargo_id = ps_aCargo.id
        LEFT JOIN cargos carg_aCargo ON ps_aCargo.cargo_id = carg_aCargo.id
        LEFT JOIN usuarios usr_desp ON ni.usuario_despacho = usr_desp.id
        LEFT JOIN personal_seguridad ps_desp ON usr_desp.personal_seguridad_id = ps_desp.id
        LEFT JOIN cargos carg_desp ON ps_desp.cargo_id = carg_desp.id
        LEFT JOIN usuarios usr_cier ON ni.usuario_cierre = usr_cier.id
        LEFT JOIN personal_seguridad ps_cier ON usr_cier.personal_seguridad_id = ps_cier.id
        LEFT JOIN cargos carg_cier ON ps_cier.cargo_id = carg_cier.id
        LEFT JOIN estados_operativo_recurso Sts_Opr ON ov.estado_operativo_id = Sts_Opr.id
      LEFT JOIN estados_novedad en ON ni.estado_novedad_id = en.id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
      ORDER BY ot.fecha, ht.nro_orden, ot.fecha_hora_inicio
      LIMIT ? OFFSET ?
    `;

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
    `;

    // Preparar replacements dinámicamente
    const baseReplacements = [sanitizedFechaInicio, sanitizedFechaFin];
    const countReplacements = [sanitizedFechaInicio, sanitizedFechaFin];
    
    if (sanitizedEstadoNovedadId) {
      baseReplacements.push(sanitizedEstadoNovedadId, sanitizedLimit, offset);
      countReplacements.push(sanitizedEstadoNovedadId);
    } else {
      baseReplacements.push(sanitizedLimit, offset);
    }

    // Ejecutar queries usando Sequelize con SQL directo
    const [results, countResult] = await Promise.all([
      models.sequelize.query(baseQuery, {
        replacements: baseReplacements,
        type: Sequelize.QueryTypes.SELECT
      }),
      models.sequelize.query(countQuery, {
        replacements: countReplacements,
        type: Sequelize.QueryTypes.SELECT
      })
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / sanitizedLimit);

    return {
      success: true,
      data: results,
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        total,
        totalPages
      },
      filters_applied: {
        fecha_inicio: sanitizedFechaInicio,
        fecha_fin: sanitizedFechaFin,
        estado: 1,
        estado_novedad_id: sanitizedEstadoNovedadId
      }
    };

  } catch (error) {
    console.error("❌ Error en getOperativosVehiculares:", error);
    throw new Error(`Error al obtener operativos vehiculares: ${error.message}`);
  }
};

/**
 * Obtiene resumen estadístico de operativos vehiculares
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export const getResumenVehicular = async (queryParams = {}) => {
  try {
    const { fecha_inicio, fecha_fin, estado_novedad_id } = queryParams;
    
    // Sanitización de parámetros
    const today = new Date();
    const defaultFechaInicio = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split("T")[0];
    const defaultFechaFin = today.toISOString().split("T")[0];
    
    const sanitizedFechaInicio = fecha_inicio ? fecha_inicio.replace(/[^0-9-]/g, "") : defaultFechaInicio;
    const sanitizedFechaFin = fecha_fin ? fecha_fin.replace(/[^0-9-]/g, "") : defaultFechaFin;
    const sanitizedEstadoNovedadId = estado_novedad_id ? parseInt(estado_novedad_id) : null;

    // Preparar replacements dinámicamente para todos los queries
    const replacements = sanitizedEstadoNovedadId ? 
      [sanitizedFechaInicio, sanitizedFechaFin, sanitizedEstadoNovedadId] : 
      [sanitizedFechaInicio, sanitizedFechaFin];

    // Query SQL directo para resumen vehicular
    const [
      totalNovedades,
      novedadesPorTurno,
      novedadesPorSector,
      novedadesPorPrioridad,
      novedadesPorTipo,
      novedadesPorEstado
    ] = await Promise.all([
      // Total de novedades atendidas por operativos vehiculares
      models.sequelize.query(`
      SELECT COUNT(*) as total
      FROM novedades_incidentes ni
      INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
    `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Novedades por turno
      models.sequelize.query(`
      SELECT 
        ot.turno,
        COUNT(*) as total
      FROM novedades_incidentes ni
      INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
      INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
      INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
      INNER JOIN operativos_turno ot ON ov.operativo_turno_id = ot.id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
      GROUP BY ot.turno
      ORDER BY ot.turno
    `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Novedades por sector
      models.sequelize.query(`
      SELECT 
        sec.nombre as sector,
        COUNT(*) as total
      FROM novedades_incidentes ni
      INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
      INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
      INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
      INNER JOIN operativos_turno ot ON ov.operativo_turno_id = ot.id
      INNER JOIN sectores sec ON ot.sector_id = sec.id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
      GROUP BY sec.id, sec.nombre
      ORDER BY total DESC
    `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Novedades por prioridad
      models.sequelize.query(`
      SELECT 
        ni.prioridad_actual,
        COUNT(*) as total
      FROM novedades_incidentes ni
      INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
      GROUP BY ni.prioridad_actual
      ORDER BY total DESC
    `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Novedades por tipo
      models.sequelize.query(`
      SELECT 
        tn.nombre as tipo_novedad,
        COUNT(*) as total
      FROM novedades_incidentes ni
      INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
      INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
      GROUP BY tn.id, tn.nombre
      ORDER BY total DESC
    `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Novedades por estado de novedad
      models.sequelize.query(`
      SELECT 
        en.nombre as estado_novedad_actual,
        COUNT(*) as total
      FROM novedades_incidentes ni
      INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
      LEFT JOIN estados_novedad en ON ni.estado_novedad_id = en.id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
      GROUP BY ni.estado_novedad_id, en.nombre
      ORDER BY total DESC
    `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      })
    ]);

    return {
      success: true,
      data: {
        total_novedades: totalNovedades[0]?.total || 0,
        novedades_por_turno: novedadesPorTurno,
        novedades_por_sector: novedadesPorSector,
        novedades_por_prioridad: novedadesPorPrioridad,
        novedades_por_tipo: novedadesPorTipo,
        novedades_por_estado: novedadesPorEstado,
        filters_applied: {
          fecha_inicio: sanitizedFechaInicio,
          fecha_fin: sanitizedFechaFin,
          estado: 1,
          estado_novedad_id: sanitizedEstadoNovedadId
        }
      }
    };

  } catch (error) {
    console.error("❌ Error en getResumenVehicular:", error);
    throw new Error(`Error al obtener resumen vehicular: ${error.message}`);
  }
};

/**
 * Obtiene estadísticas avanzadas de operativos vehiculares
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Estadísticas detalladas
 */
export const getEstadisticasVehiculares = async (queryParams = {}) => {
  try {
    const { fecha_inicio, fecha_fin, estado_novedad_id } = queryParams;
    
    // Sanitización de parámetros
    const today = new Date();
    const defaultFechaInicio = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split("T")[0];
    const defaultFechaFin = today.toISOString().split("T")[0];
    
    const sanitizedFechaInicio = fecha_inicio ? fecha_inicio.replace(/[^0-9-]/g, "") : defaultFechaInicio;
    const sanitizedFechaFin = fecha_fin ? fecha_fin.replace(/[^0-9-]/g, "") : defaultFechaFin;
    const sanitizedEstadoNovedadId = estado_novedad_id ? parseInt(estado_novedad_id) : null;

    // Preparar replacements dinámicamente
    const replacements = sanitizedEstadoNovedadId ? 
      [sanitizedFechaInicio, sanitizedFechaFin, sanitizedEstadoNovedadId] : 
      [sanitizedFechaInicio, sanitizedFechaFin];

    // Query SQL directo para estadísticas avanzadas
    const [
      resumenGeneral,
      porTurno,
      porSector,
      porVehiculo,
      porConductor,
      porEstado,
      tendenciasTemporales
    ] = await Promise.all([
      // Resumen general
      models.sequelize.query(`
        SELECT 
          COUNT(DISTINCT ov.id) as total_operativos,
          COUNT(*) as total_novedades,
          AVG(ni.tiempo_respuesta_min) as promedio_tiempo_respuesta,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM novedades_incidentes ni2 
            WHERE DATE(ni2.fecha_hora_ocurrencia) BETWEEN ? AND ? 
            AND ni2.estado = 1 AND ni2.deleted_at IS NULL), 2) as tasa_atencion
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1
          AND ni.deleted_at IS NULL
          ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
      `, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin, ...replacements],
        type: Sequelize.QueryTypes.SELECT
      }),

      // Estadísticas por turno
      models.sequelize.query(`
        SELECT 
          ot.turno,
          COUNT(*) as total_novedades,
          AVG(ni.tiempo_respuesta_min) as promedio_tiempo_respuesta,
          COUNT(DISTINCT ov.id) as total_operativos
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        INNER JOIN operativos_turno ot ON ov.operativo_turno_id = ot.id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1
          AND ni.deleted_at IS NULL
          ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
        GROUP BY ot.turno
        ORDER BY total_novedades DESC
      `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Estadísticas por sector
      models.sequelize.query(`
        SELECT 
          sec.nombre as sector,
          COUNT(*) as total_novedades,
          AVG(ni.tiempo_respuesta_min) as promedio_tiempo_respuesta,
          COUNT(DISTINCT ov.id) as total_operativos
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        INNER JOIN operativos_turno ot ON ov.operativo_turno_id = ot.id
        INNER JOIN sectores sec ON ot.sector_id = sec.id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1
          AND ni.deleted_at IS NULL
          ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
        GROUP BY sec.id, sec.nombre
        ORDER BY total_novedades DESC
      `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Estadísticas por vehículo
      models.sequelize.query(`
        SELECT 
          v.placa,
          v.marca,
          v.modelo_vehiculo,
          COUNT(*) as total_novedades,
          AVG(ni.tiempo_respuesta_min) as promedio_tiempo_respuesta,
          COUNT(DISTINCT ov.id) as total_operativos
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        INNER JOIN vehiculos v ON ov.vehiculo_id = v.id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1
          AND ni.deleted_at IS NULL
          ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
        GROUP BY v.id, v.placa, v.marca, v.modelo_vehiculo
        ORDER BY total_novedades DESC
        LIMIT 10
      `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Estadísticas por conductor
      models.sequelize.query(`
        SELECT 
          CONCAT(ps.nombres, ', ', ps.apellido_paterno, ' ', ps.apellido_materno) as conductor,
          COUNT(*) as total_novedades,
          AVG(ni.tiempo_respuesta_min) as promedio_tiempo_respuesta,
          COUNT(DISTINCT ov.id) as total_operativos
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        INNER JOIN personal_seguridad ps ON ov.conductor_id = ps.id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1
          AND ni.deleted_at IS NULL
          ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
        GROUP BY ps.id, ps.nombres, ps.apellido_paterno, ps.apellido_materno
        ORDER BY total_novedades DESC
        LIMIT 10
      `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Estadísticas por estado de novedad
      models.sequelize.query(`
        SELECT 
          en.nombre as estado_novedad_actual,
          COUNT(*) as total_novedades,
          AVG(ni.tiempo_respuesta_min) as promedio_tiempo_respuesta
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        LEFT JOIN estados_novedad en ON ni.estado_novedad_id = en.id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1
          AND ni.deleted_at IS NULL
          ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
        GROUP BY ni.estado_novedad_id, en.nombre
        ORDER BY total_novedades DESC
      `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      }),

      // Tendencias temporales (por día)
      models.sequelize.query(`
        SELECT 
          DATE(ni.fecha_hora_ocurrencia) as fecha,
          COUNT(*) as total_novedades,
          AVG(ni.tiempo_respuesta_min) as promedio_tiempo_respuesta,
          COUNT(DISTINCT ov.id) as total_operativos
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1
          AND ni.deleted_at IS NULL
          ${sanitizedEstadoNovedadId ? "AND ni.estado_novedad_id = ?" : ""}
        GROUP BY DATE(ni.fecha_hora_ocurrencia)
        ORDER BY fecha ASC
      `, {
        replacements: replacements,
        type: Sequelize.QueryTypes.SELECT
      })
    ]);

    const resumen = resumenGeneral[0] || {};

    return {
      success: true,
      data: {
        resumen_general: {
          total_operativos: parseInt(resumen.total_operativos) || 0,
          total_novedades: parseInt(resumen.total_novedades) || 0,
          promedio_tiempo_respuesta: parseFloat(resumen.promedio_tiempo_respuesta) || 0,
          tasa_atencion: parseFloat(resumen.tasa_atencion) || 0
        },
        por_turno: porTurno.map(item => ({
          turno: item.turno,
          total_novedades: parseInt(item.total_novedades) || 0,
          promedio_tiempo_respuesta: parseFloat(item.promedio_tiempo_respuesta) || 0,
          total_operativos: parseInt(item.total_operativos) || 0
        })),
        por_sector: porSector.map(item => ({
          sector: item.sector,
          total_novedades: parseInt(item.total_novedades) || 0,
          promedio_tiempo_respuesta: parseFloat(item.promedio_tiempo_respuesta) || 0,
          total_operativos: parseInt(item.total_operativos) || 0
        })),
        por_vehiculo: porVehiculo.map(item => ({
          placa: item.placa,
          marca: item.marca,
          modelo: item.modelo_vehiculo,
          total_novedades: parseInt(item.total_novedades) || 0,
          promedio_tiempo_respuesta: parseFloat(item.promedio_tiempo_respuesta) || 0,
          total_operativos: parseInt(item.total_operativos) || 0
        })),
        por_conductor: porConductor.map(item => ({
          conductor: item.conductor,
          total_novedades: parseInt(item.total_novedades) || 0,
          promedio_tiempo_respuesta: parseFloat(item.promedio_tiempo_respuesta) || 0,
          total_operativos: parseInt(item.total_operativos) || 0
        })),
        por_estado: porEstado.map(item => ({
          estado_novedad_actual: item.estado_novedad_actual,
          total_novedades: parseInt(item.total_novedades) || 0,
          promedio_tiempo_respuesta: parseFloat(item.promedio_tiempo_respuesta) || 0
        })),
        tendencias_temporales: tendenciasTemporales.map(item => ({
          fecha: item.fecha,
          total_novedades: parseInt(item.total_novedades) || 0,
          promedio_tiempo_respuesta: parseFloat(item.promedio_tiempo_respuesta) || 0,
          total_operativos: parseInt(item.total_operativos) || 0
        }))
      },
      filters_applied: {
        fecha_inicio: sanitizedFechaInicio,
        fecha_fin: sanitizedFechaFin,
        estado: 1,
        estado_novedad_id: sanitizedEstadoNovedadId
      }
    };

  } catch (error) {
    console.error("❌ Error en getEstadisticasVehiculares:", error);
    throw new Error(`Error al obtener estadísticas vehiculares: ${error.message}`);
  }
};

/**
 * Obtiene operativos a pie con novedades atendidas
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Datos de operativos a pie
 */
export const getOperativosPie = async (queryParams = {}) => {
  try {
    const { fecha_inicio, fecha_fin, page = 1, limit = 10 } = queryParams;
    
    // Sanitización de parámetros
    const today = new Date();
    const defaultFechaInicio = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split("T")[0];
    const defaultFechaFin = today.toISOString().split("T")[0];
    
    const sanitizedFechaInicio = fecha_inicio ? fecha_inicio.replace(/[^0-9-]/g, "") : defaultFechaInicio;
    const sanitizedFechaFin = fecha_fin ? fecha_fin.replace(/[^0-9-]/g, "") : defaultFechaFin;
    const sanitizedPage = Math.max(1, parseInt(page)) || 1;
    const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit))) || 10;
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    // Usar SQL directo para operativos a pie (exactamente como en documentación)
    const baseQuery = `
      SELECT 
        -- Datos del Turno
        ot.fecha fecha_turno,
        ht.nro_orden nro_orden_turno,
        ot.turno, 
        ht.hora_inicio turno_horario_inicio,
        ht.hora_fin turno_horario_fin,
        ot.fecha_hora_inicio inicio_operativo_sector,
        ot.fecha_hora_fin fin_operativo_sector,
        ot.operador_id, CONCAT(usr.username,', ',usr.nombres,' ',usr.apellidos) as Operador_Sistema,
        ot.sector_id, sec.sector_code, sec.nombre nombre_sector,
        ot.supervisor_id,
        CONCAT(ps1.nombres,', ',ps1.apellido_paterno,' ',ps1.apellido_materno) as Supervisor_Sector,
        CargSup.nombre Cargo_Supervisor,
        ot.observaciones observaciones_turno,
        ot.estado estado_operativo_sector,
        ot.updated_by,
        CONCAT(usr4.username,', ',usr4.nombres,' ',usr4.apellidos) as Usuario_Actualizador_Turno,
        carg_t.nombre Cargo_Actualizador_Turno, ot.updated_at Fecha_Actualizador_Turno,
        
        -- Datos del Personal Principal
        ps2.doc_tipo, ps2.doc_numero,
        CONCAT(ps2.nombres,', ',ps2.apellido_paterno,' ',ps2.apellido_materno) as Personal_asignado,
        ps2.cargo_id, carg2.nombre Cargo_Personal_Asignado,
        ps2.nacionalidad, ps2.status estado_personal_asignado, ps2.regimen,
        
        -- Datos del Cuadrante
        opc.cuadrante_id, cua.cuadrante_code, 
        cua.nombre nombre_cuadrante, 
        cua.zona_code,
        opc.hora_ingreso, opc.hora_salida, opc.tiempo_minutos, 
        opc.observaciones observaciones_operativo_cuadrante , opc.incidentes_reportados,
        
        -- Datos del Operativo Personal
        op.sereno_id Personal_Auxiliar,
        CONCAT(ps3.nombres,', ',ps3.apellido_paterno,' ',ps3.apellido_materno) as Nombres_Personal_Auxiliar,
        carg_ser.nombre Cargo_Personal_Auxiliar,
        op.radio_tetra_id,
        rt.radio_tetra_code, rt.descripcion Descripcion_Radio_Tetra,
        op.estado_operativo_id, 
        Sts_Opr.descripcion estado_patrullaje_pie,
        op.tipo_patrullaje, op.chaleco_balistico, op.porra_policial, op.esposas, op.linterna, op.kit_primeros_auxilios,
        op.hora_inicio hora_inicio_operativo, op.hora_fin hora_fin_operativo, 
        op.observaciones observaciones_operativo_pie, 
        op.estado_registro estado_operativo_pie,
        op.updated_by,
        CONCAT(usr3.username,', ',usr3.nombres,' ',usr3.apellidos) as Usuario_Actualizador_Patrullaje_Pie,
        carg5.nombre Cargo_Actualizador_Patrullaje_Pie,
        op.updated_at Fecha_Actualizado_Patrullaje_Pie,
        
        -- Datos de Atención
        opn.reportado, opn.atendido, opn.resultado, opn.prioridad, 
        opn.observaciones observaciones_operativo_novedad,
        opn.updated_by,
        CONCAT(usr2.username,', ',usr2.nombres,' ',usr2.apellidos) as Usuario_Actualizador_Novedad,
        carg_n.nombre Cargo_Actualizador_Novedad, opn.updated_at Fecha_Actualizador_Novedad,
        opn.acciones_tomadas, 
        
        -- Datos de la Novedad
        ni.id novedad_id, ni.novedad_code, ni.fecha_hora_ocurrencia, 
        tn.nombre tipo_novedad_nombre,
        ni.subtipo_novedad_id, stn.nombre sub_tipo_novedad_nombre, stn.prioridad,  
        ni.descripcion descripcion_novedad, 
        ni.estado estado_novedad, ni.origen_llamada, ni.direccion_id, ni.localizacion, ni.referencia_ubicacion,
        ni.latitud, ni.longitud, ni.ajustado_en_mapa, ni.fecha_ajuste_mapa, ni.radio_tetra_id, ni.es_anonimo,
        ni.reportante_nombre, ni.reportante_telefono, ni.reportante_doc_identidad, 
        ni.descripcion descripcion_novedad,
        ni.observaciones observaciones_novedad,
        ni.personal_cargo_id, 
        CONCAT(ps_aCargo.nombres,', ',ps_aCargo.apellido_paterno,' ',ps_aCargo.apellido_materno) as Nombres_Personal_a_Cargo,
        carg_aCargo.nombre Cargo_Personal,
        ni.fecha_despacho, ni.usuario_despacho,
        CONCAT(usr_desp.username,', ',usr_desp.nombres,' ',usr_desp.apellidos) as nombre_usuario_despacho,
        carg_desp.nombre Cargo_Despachador,
        ni.fecha_llegada, ni.fecha_cierre,
        ni.usuario_cierre,
        CONCAT(usr_cier.username,', ',usr_cier.nombres,' ',usr_cier.apellidos) as nombre_usuario_cierre,
        carg_cier.nombre Cargo_Usuario_Cierre,
        ni.km_inicial, ni.km_final, 
        stn.tiempo_respuesta_min Base_Tiempo_Minimo, ni.tiempo_respuesta_min, ni.tiempo_respuesta_min_operativo,
        ni.prioridad_actual, ni.requiere_seguimiento, ni.fecha_proxima_revision, ni.num_personas_afectadas,
        ni.perdidas_materiales_estimadas, 
        ni.estado_novedad_id , en.nombre estado_novedad_actual 
        
      FROM novedades_incidentes ni
      INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id 
      LEFT JOIN subtipos_novedad stn on ni.subtipo_novedad_id = stn.id 
      INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id 
      INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id 
      INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id 
      INNER JOIN operativos_turno ot ON op.operativo_turno_id = ot.id 
      INNER JOIN horarios_turnos ht ON ot.turno = ht.turno 
      INNER JOIN usuarios usr ON ot.operador_id = usr.id  
      INNER JOIN SECTORES sec ON ot.sector_id = sec.id  
      INNER JOIN personal_seguridad ps1 ON ot.supervisor_id = ps1.id   -- Supervisor Sector
      LEFT JOIN cargos CargSup ON ps1.cargo_id = CargSup.id 
      
      INNER JOIN personal_seguridad ps2 ON op.personal_id = ps2.id     -- Personal Asignado
      LEFT JOIN cargos carg2 ON ps2.cargo_id = carg2.id 
      
      LEFT JOIN personal_seguridad ps3 ON op.sereno_id = ps3.id        -- Sereno acompañante (opcional)
      LEFT JOIN cargos carg_ser ON ps3.cargo_id = carg_ser.id 
      
      LEFT JOIN citizen_security_v2.radios_tetra rt ON op.radio_tetra_id = rt.id 
      INNER JOIN citizen_security_v2.cuadrantes cua ON opc.cuadrante_id = cua.id  
      
      LEFT JOIN usuarios usr2 ON opn.updated_by = usr2.id  					-- Usuario_Actualizador_Novedad
      LEFT JOIN personal_seguridad ps4 ON usr2.personal_seguridad_id = ps4.id -- Nombres_Usuario_Actualizador_Novedad
      LEFT JOIN cargos carg_n ON ps4.cargo_id = carg_n.id 					-- Cargo_Usuario_Actualizador_Novedad
      
      LEFT JOIN usuarios usr3 ON op.updated_by = usr3.id  						-- Usuario_Actualizador_Personal
      LEFT JOIN personal_seguridad ps5 ON usr3.personal_seguridad_id = ps5.id 	-- Nombres_Usuario_Actualizador_Personal
      LEFT JOIN cargos carg5 ON ps5.cargo_id = carg5.id 							-- Cargo_Usuario_Actualizador_Personal
      
      LEFT JOIN usuarios usr4 ON ot.updated_by = usr4.id  						-- Usuario_Actualizador_Turno
      LEFT JOIN personal_seguridad ps_t ON usr4.personal_seguridad_id = ps_t.id  	-- Nombres_Usuario_Actualizador_Turno
      LEFT JOIN cargos carg_t ON ps_t.cargo_id = carg_t.id 						-- Cargo_Usuario_Actualizador_Turno 
      
      LEFT JOIN usuarios usr_desp ON ni.usuario_despacho = usr_desp.id  					-- Usuario_Despacho
      LEFT JOIN personal_seguridad ps_desp ON usr_desp.personal_seguridad_id = ps_desp.id -- Nombres_Usuario_Despacho
      LEFT JOIN cargos carg_desp ON ps_desp.cargo_id = carg_desp.id 						-- Cargo_Usuario_Despacho
      
      LEFT JOIN usuarios usr_cier ON ni.usuario_cierre = usr_cier.id  					-- Usuario_Cierre
      LEFT JOIN personal_seguridad ps_cier ON usr_cier.personal_seguridad_id = ps_cier.id -- Nombres_Usuario_Cierre
      LEFT JOIN cargos carg_cier ON ps_cier.cargo_id = carg_cier.id 						-- Cargo_Usuario_Cierre
      
      LEFT JOIN personal_seguridad ps_aCargo ON ni.personal_cargo_id = ps_aCargo.id 	-- Nombres_Personal_a_Cargo
      LEFT JOIN cargos carg_aCargo ON ps_aCargo.cargo_id = carg_aCargo.id 			-- Cargo_Personal a Cargo
      
      LEFT JOIN estados_operativo_recurso Sts_Opr ON op.estado_operativo_id = Sts_Opr.id
      
      LEFT JOIN estados_novedad en ON ni.estado_novedad_id = en.id 	
      
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1 AND ni.deleted_at IS NULL 
      ORDER BY ot.fecha, ht.nro_orden, ot.fecha_hora_inicio;
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM novedades_incidentes ni
      INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id
      INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id
      INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id
      WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
        AND ni.estado = 1
        AND ni.deleted_at IS NULL
        AND opn.estado_registro = 1
        AND opc.estado_registro = 1
        AND op.estado_registro = 1
    `;

    // Ejecutar queries en paralelo
    const [resultadoVehiculares, totalCount] = await Promise.all([
      models.sequelize.query(baseQuery, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin, sanitizedLimit, offset],
        type: Sequelize.QueryTypes.SELECT
      }),
      models.sequelize.query(countQuery, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin],
        type: Sequelize.QueryTypes.SELECT
      })
    ]);

    const operativos = resultadoVehiculares;
    const total = totalCount[0]?.total || 0;

    return {
      success: true,
      data: operativos,
      pagination: {
        current_page: sanitizedPage,
        total_pages: Math.ceil(total / sanitizedLimit),
        total_records: total,
        records_per_page: sanitizedLimit,
        has_next: sanitizedPage < Math.ceil(total / sanitizedLimit),
        has_prev: sanitizedPage > 1
      },
      filters_applied: {
        fecha_inicio: sanitizedFechaInicio,
        fecha_fin: sanitizedFechaFin,
        estado: 1
      }
    };

  } catch (error) {
    console.error("❌ Error en getOperativosPie:", error);
    throw new Error(`Error al obtener operativos a pie: ${error.message}`);
  }
};

/**
 * Formatea los datos de operativos a pie para respuesta (SQL directo)
 * @param {Array} operativos - Datos brutos de SQL directo
 * @returns {Array} Datos formateados
 */
export const formatOperativosPieForExport = (operativos) => {
  return operativos.map(operativo => {
    return {
      // === DATOS PRINCIPALES ===
      id: operativo.novedad_id,
      codigo_novedad: operativo.novedad_code,
      fecha_hora_ocurrencia: operativo.fecha_hora_ocurrencia,
      fecha_registro: operativo.created_at,
      tipo_novedad: operativo.tipo_novedad_nombre,
      subtipo_novedad: operativo.sub_tipo_novedad_nombre,
      subtipo_novedad_id: operativo.subtipo_novedad_id,
      descripcion: operativo.descripcion_novedad,
      estado_novedad_actual: operativo.estado_novedad_actual,
      estado_novedad_id: operativo.estado_novedad_id,
      prioridad_actual: operativo.prioridad_actual,
      prioridad: operativo.prioridad,
      tiempo_respuesta_minutos: operativo.tiempo_respuesta_min,
      tiempo_respuesta_min_operativo: operativo.tiempo_respuesta_min_operativo,
      base_tiempo_minimo: operativo.Base_Tiempo_Minimo,
      requiere_seguimiento: operativo.requiere_seguimiento,
      fecha_proxima_revision: operativo.fecha_proxima_revision,
      num_personas_afectadas: operativo.num_personas_afectadas,
      perdidas_materiales_estimadas: operativo.perdidas_materiales_estimadas,
      observaciones: operativo.observaciones_novedad,
      acciones_tomadas: operativo.acciones_tomadas,
      
      // === DATOS DE UBICACIÓN ===
      localizacion: operativo.localizacion,
      direccion_id: operativo.direccion_id,
      referencia_ubicacion: operativo.referencia_ubicacion,
      latitud: operativo.latitud,
      longitud: operativo.longitud,
      ajustado_en_mapa: operativo.ajustado_en_mapa,
      fecha_ajuste_mapa: operativo.fecha_ajuste_mapa,
      ubigeo_code: operativo.ubigeo_code,
      
      // === DATOS DEL REPORTE ===
      origen_llamada: operativo.origen_llamada,
      radio_tetra_id: operativo.radio_tetra_id,
      reportante_nombre: operativo.reportante_nombre,
      reportante_telefono: operativo.reportante_telefono,
      reportante_doc_identidad: operativo.reportante_doc_identidad,
      es_anonimo: operativo.es_anonimo,
      
      // === DATOS DEL TURNO ===
      fecha_turno: operativo.fecha_turno,
      nro_orden_turno: operativo.nro_orden_turno,
      turno: operativo.turno,
      turno_horario_inicio: operativo.turno_horario_inicio,
      turno_horario_fin: operativo.turno_horario_fin,
      observaciones_turno: operativo.observaciones_turno,
      
      // === DATOS DEL SECTOR ===
      sector_id: operativo.sector_id,
      sector_code: operativo.sector_code,
      nombre_sector: operativo.nombre_sector,
      supervisor_id: operativo.supervisor_id,
      supervisor_sector: operativo.Supervisor_Sector,
      cargo_supervisor: operativo.Cargo_Supervisor,
      
      // === DATOS DEL PERSONAL ASIGNADO ===
      personal_asignado: operativo.Personal_asignado,
      doc_tipo: operativo.doc_tipo,
      doc_numero: operativo.doc_numero,
      cargo_id: operativo.cargo_id,
      cargo_personal_asignado: operativo.Cargo_Personal_Asignado,
      nacionalidad: operativo.nacionalidad,
      regimen: operativo.regimen,
      estado_personal_asignado: operativo.estado_personal_asignado,
      
      // === DATOS DEL CUADRANTE ===
      cuadrante_id: operativo.cuadrante_id,
      cuadrante_code: operativo.cuadrante_code,
      nombre_cuadrante: operativo.nombre_cuadrante,
      zona_code: operativo.zona_code,
      hora_ingreso: operativo.hora_ingreso,
      hora_salida: operativo.hora_salida,
      tiempo_minutos: operativo.tiempo_minutos,
      incidentes_reportados: operativo.incidentes_reportados,
      
      // === DATOS DEL PERSONAL AUXILIAR ===
      personal_auxiliar: operativo.Personal_Auxiliar,
      nombres_personal_auxiliar: operativo.Nombres_Personal_Auxiliar,
      cargo_personal_auxiliar: operativo.Cargo_Personal_Auxiliar,
      
      // === DATOS DE EQUIPAMIENTO ===
      radio_tetra_code: operativo.radio_tetra_code,
      descripcion_radio_tetra: operativo.Descripcion_Radio_Tetra,
      chaleco_balistico: operativo.chaleco_balistico,
      porra_policial: operativo.porra_policial,
      esposas: operativo.esposas,
      linterna: operativo.linterna,
      kit_primeros_auxilios: operativo.kit_primeros_auxilios,
      
      // === DATOS DEL OPERATIVO ===
      tipo_patrullaje: operativo.tipo_patrullaje,
      hora_inicio_operativo: operativo.hora_inicio_operativo,
      hora_fin_operativo: operativo.hora_fin_operativo,
      estado_operativo_id: operativo.estado_operativo_id,
      estado_patrullaje_pie: operativo.estado_patrullaje_pie,
      estado_operativo_pie: operativo.estado_operativo_pie,
      observaciones_operativo_pie: operativo.observaciones_operativo_pie,
      
      // === DATOS DE ATENCIÓN ===
      reportado: operativo.reportado,
      atendido: operativo.atendido,
      resultado: operativo.resultado,
      fecha_despacho: operativo.fecha_despacho,
      fecha_llegada: operativo.fecha_llegada,
      fecha_cierre: operativo.fecha_cierre,
      
      // === DATOS DE USUARIOS ===
      operador_id: operativo.operador_id,
      operador_sistema: operativo.Operador_Sistema,
      usuario_despacho: operativo.usuario_despacho,
      nombre_usuario_despacho: operativo.nombre_usuario_despacho,
      cargo_despachador: operativo.Cargo_Despachador,
      usuario_cierre: operativo.usuario_cierre,
      nombre_usuario_cierre: operativo.nombre_usuario_cierre,
      cargo_usuario_cierre: operativo.Cargo_Usuario_Cierre,
      
      // === METADATOS ===
      estado_operativo_sector: operativo.estado_operativo_sector,
      inicio_operativo_sector: operativo.inicio_operativo_sector,
      fin_operativo_sector: operativo.fin_operativo_sector
    };
  });
};

/**
 * Formatea los datos de operativos a pie para respuesta (Sequelize ORM)
 * @param {Array} operativos - Datos brutos de la base
 * @returns {Array} Datos formateados
 */
export const formatOperativosPie = (operativos) => {
  return operativos.map(operativo => {
    const novedad = operativo.dataValues;
    const opn = novedad.operativosPersonalNovedades?.dataValues;
    const opc = opn?.cuadranteOperativo?.dataValues;
    const op = opc?.operativoPersonal?.dataValues;
    const ot = op?.turno?.dataValues;
    const personal = op?.personal?.dataValues;
    const sereno = op?.sereno?.dataValues;
    const cuadrante = opc?.datosCuadrante?.dataValues;
    const sector = ot?.sector?.dataValues;
    const supervisor = ot?.supervisor?.dataValues;
    const operador = ot?.operador?.dataValues;

    return {
      // Información del Turno
      fecha: ot?.fecha,
      nro_orden: null, // TODO: Obtener de HorariosTurnos si se necesita
      turno: ot?.turno,
      turno_horario_inicio: null, // TODO: Obtener de HorariosTurnos si se necesita
      turno_horario_fin: null, // TODO: Obtener de HorariosTurnos si se necesita,
      fecha_hora_inicio: ot?.fecha_hora_inicio,
      fecha_hora_fin: ot?.fecha_hora_fin,
      operador_id: ot?.operador_id,
      operador_sistema: operador ? 
        `${operador.username}, ${operador.personal_seguridad?.nombres} ${operador.personal_seguridad?.apellido_paterno} ${operador.personal_seguridad?.apellido_materno}` : null,
      cargo_operador: operador?.personal_seguridad?.cargo?.nombre,
      
      // Información del Sector
      sector_id: sector?.id,
      sector_code: sector?.sector_code,
      nombre_sector: sector?.nombre,
      supervisor_id: supervisor?.id,
      supervisor_sector: supervisor ? 
        `${supervisor.nombres}, ${supervisor.apellido_paterno} ${supervisor.apellido_materno}` : null,
      cargo_supervisor: supervisor?.PersonalSeguridadCargo?.nombre,
      
      // Información del Personal Asignado
      personal_id: personal?.id,
      doc_tipo: personal?.doc_tipo,
      doc_numero: personal?.doc_numero,
      personal_asignado: personal ? 
        `${personal.nombres}, ${personal.apellido_paterno} ${personal.apellido_materno}` : null,
      cargo_personal_asignado: personal?.PersonalSeguridadCargo?.nombre,
      nacionalidad: personal?.nacionalidad,
      status: personal?.status,
      regimen: personal?.regimen,
      
      // Personal Auxiliar/Sereno
      personal_auxiliar_id: op?.sereno_id,
      nombres_personal_auxiliar: sereno ? 
        `${sereno.nombres}, ${sereno.apellido_paterno} ${sereno.apellido_materno}` : null,
      cargo_personal_auxiliar: sereno?.PersonalSeguridadCargo?.nombre,
      
      // Información Operativa
      radio_tetra_id: op?.radio_tetra_id,
      radio_tetra_code: op?.radio_tetra?.radio_tetra_code,
      descripcion_radio_tetra: op?.radio_tetra?.descripcion,
      estado_operativo: op?.estado_operativo?.descripcion,
      tipo_patrullaje: op?.tipo_patrullaje,
      chaleco_balistico: op?.chaleco_balistico,
      porra_policial: op?.porra_policial,
      esposas: op?.esposas,
      linterna: op?.linterna,
      kit_primeros_auxilios: op?.kit_primeros_auxilios,
      hora_inicio: op?.hora_inicio,
      hora_fin: op?.hora_fin,
      
      // Información de Cuadrantes
      cuadrante_id: cuadrante?.id,
      cuadrante_code: cuadrante?.cuadrante_code,
      nombre_cuadrante: cuadrante?.nombre,
      zona_code: cuadrante?.zona_code,
      hora_ingreso_cuadrante: opc?.hora_ingreso,
      hora_salida_cuadrante: opc?.hora_salida,
      tiempo_minutos_cuadrante: opc?.tiempo_minutos,
      
      // Información de Novedades
      novedad_id: novedad.id,
      novedad_code: novedad.novedad_code,
      fecha_hora_ocurrencia: novedad.fecha_hora_ocurrencia,
      tipo_novedad_nombre: novedad.novedadTipoNovedad?.nombre,
      subtipo_novedad: novedad.novedadSubtipoNovedad?.nombre,
      prioridad_novedad: novedad.novedadSubtipoNovedad?.prioridad,
      descripcion_novedad: novedad.descripcion,
      estado_novedad: novedad.estado,
      origen_llamada: novedad.origen_llamada,
      direccion_id: novedad.direccion_id,
      localizacion: novedad.localizacion,
      referencia_ubicacion: novedad.referencia_ubicacion,
      latitud: novedad.latitud,
      longitud: novedad.longitud,
      
      // Tiempos de Respuesta
      tiempo_respuesta_min: novedad.tiempo_respuesta_min,
      tiempo_respuesta_min_operativo: novedad.tiempo_respuesta_min_operativo,
      prioridad_actual: novedad.prioridad_actual,
      
      // Información de Atención
      reportado: opn?.reportado,
      atendido: opn?.atendido,
      resultado: opn?.resultado,
      prioridad_operativo: opn?.prioridad,
      acciones_tomadas: opn?.acciones_tomadas,
      
      // Auditoría
      updated_by: opn?.updated_by,
      updated_at: opn?.updated_at
    };
  });
};

/**
 * Obtiene resumen estadístico de operativos a pie
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export const getResumenPie = async (queryParams = {}) => {
  try {
    const filters = buildFilters(queryParams);
    
    // Extraer fechas directamente de queryParams para SQL
    const fecha_inicio = queryParams.fecha_inicio || "2026-04-01";
    const fecha_fin = queryParams.fecha_fin || "2026-04-30";

    // Estadísticas básicas para operativos a pie usando SQL directo
    const [
      totalNovedades,
      novedadesPorTurno,
      novedadesPorSector,
      novedadesPorPrioridad,
      novedadesPorTipo
    ] = await Promise.all([
      // Total de novedades atendidas por personal a pie
      db.query(`
        SELECT COUNT(DISTINCT ni.id) as total
        FROM novedades_incidentes ni
        INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id 
        INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id 
        INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id 
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 AND ni.deleted_at IS NULL
      `, {
        replacements: [fecha_inicio, fecha_fin],
        type: QueryTypes.SELECT
      }).then(result => result[0].total),

      // Novedades por turno (personal a pie)
      db.query(`
        SELECT 
          ot.turno,
          COUNT(DISTINCT ni.id) as total
        FROM novedades_incidentes ni
        INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id 
        INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id 
        INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id 
        INNER JOIN operativos_turno ot ON op.operativo_turno_id = ot.id 
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 AND ni.deleted_at IS NULL
        GROUP BY ot.turno
        ORDER BY total DESC
      `, {
        replacements: [fecha_inicio, fecha_fin],
        type: QueryTypes.SELECT
      }),

      // Novedades por sector (personal a pie)
      db.query(`
        SELECT 
          sec.sector_code,
          sec.nombre as sector_nombre,
          COUNT(DISTINCT ni.id) as total
        FROM novedades_incidentes ni
        INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id 
        INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id 
        INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id 
        INNER JOIN operativos_turno ot ON op.operativo_turno_id = ot.id 
        INNER JOIN SECTORES sec ON ot.sector_id = sec.id 
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 AND ni.deleted_at IS NULL
        GROUP BY sec.sector_code, sec.nombre
        ORDER BY total DESC
      `, {
        replacements: [fecha_inicio, fecha_fin],
        type: QueryTypes.SELECT
      }),

      // Novedades por prioridad (personal a pie)
      db.query(`
        SELECT 
          ni.prioridad_actual,
          COUNT(DISTINCT ni.id) as total
        FROM novedades_incidentes ni
        INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id 
        INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id 
        INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id 
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 AND ni.deleted_at IS NULL
        GROUP BY ni.prioridad_actual
        ORDER BY total DESC
      `, {
        replacements: [fecha_inicio, fecha_fin],
        type: QueryTypes.SELECT
      }),

      // Novedades por tipo (personal a pie)
      db.query(`
        SELECT 
          tn.nombre as tipo_novedad,
          COUNT(DISTINCT ni.id) as total
        FROM novedades_incidentes ni
        INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id 
        INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id 
        INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id 
        INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id 
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 AND ni.deleted_at IS NULL
        GROUP BY tn.nombre
        ORDER BY total DESC
      `, {
        replacements: [fecha_inicio, fecha_fin],
        type: QueryTypes.SELECT
      })
    ]);

    return {
      success: true,
      data: {
        total_novedades: totalNovedades,
        novedades_por_turno: novedadesPorTurno,
        novedades_por_sector: novedadesPorSector,
        novedades_por_prioridad: novedadesPorPrioridad,
        novedades_por_tipo: novedadesPorTipo,
        filters_applied: filters
      }
    };

  } catch (error) {
    console.error("❌ Error en getResumenPie:", error);
    throw new Error(`Error al obtener resumen de operativos a pie: ${error.message}`);
  }
};

/**
 * Obtiene novedades no atendidas por ningún operativo (vehicular o a pie)
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Datos de novedades no atendidas
 */
export const getNovedadesNoAtendidas = async (queryParams = {}) => {
  try {
    // Extraer parámetros de fecha para SQL directo
    const fecha_inicio = queryParams.fecha_inicio || null;
    const fecha_fin = queryParams.fecha_fin || null;
    const page = parseInt(queryParams.page) || 1;
    const limit = Math.min(parseInt(queryParams.limit) || 50, 1000);
    const offset = (page - 1) * limit;

    // SQL para obtener novedades no atendidas (usando NOT EXISTS para evitar GROUP BY)
    const query = `
      SELECT DISTINCT
        ni.id,
        ni.novedad_code,
        ni.fecha_hora_ocurrencia,
        ni.fecha_hora_reporte,
        ni.created_at,
        ni.tipo_novedad_id,
        ni.subtipo_novedad_id,
        ni.estado_novedad_id,
        ni.sector_id,
        ni.cuadrante_id,
        ni.direccion_id,
        ni.localizacion,
        ni.referencia_ubicacion,
        ni.latitud,
        ni.longitud,
        ni.ajustado_en_mapa,
        ni.fecha_ajuste_mapa,
        ni.ubigeo_code,
        ni.origen_llamada,
        ni.radio_tetra_id,
        ni.reportante_nombre,
        ni.reportante_telefono,
        ni.reportante_doc_identidad,
        ni.es_anonimo,
        ni.descripcion,
        ni.observaciones,
        ni.prioridad_actual,
        ni.gravedad,
        ni.usuario_registro,
        ni.unidad_oficina_id,
        ni.vehiculo_id,
        ni.personal_cargo_id,
        ni.personal_seguridad2_id,
        ni.personal_seguridad3_id,
        ni.personal_seguridad4_id,
        ni.fecha_despacho,
        ni.usuario_despacho,
        ni.fecha_llegada,
        ni.fecha_cierre,
        ni.usuario_cierre,
        ni.km_inicial,
        ni.km_final,
        ni.tiempo_respuesta_min,
        ni.tiempo_respuesta_min_operativo,
        ni.turno,
        ni.parte_adjuntos,
        ni.fotos_adjuntas,
        ni.videos_adjuntos,
        ni.requiere_seguimiento,
        ni.fecha_proxima_revision,
        ni.num_personas_afectadas,
        ni.perdidas_materiales_estimadas,
        ni.estado,
        ni.created_by,
        ni.updated_by,
        ni.deleted_at,
        ni.deleted_by,
        ni.usuario_cierre,
        ni.updated_at,
        tn.nombre as tipo_novedad_nombre,
        stn.nombre as subtipo_novedad_nombre,
        stn.prioridad as subtipo_prioridad
      FROM novedades_incidentes ni
      INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id
      LEFT JOIN subtipos_novedad stn ON ni.subtipo_novedad_id = stn.id
      WHERE ni.estado = 1 
        AND ni.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM operativos_personal_novedades opn 
          WHERE opn.novedad_id = ni.id AND opn.deleted_at IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM operativos_vehiculos_novedades ovn 
          WHERE ovn.novedad_id = ni.id AND ovn.deleted_at IS NULL
        )
        ${fecha_inicio && fecha_fin ? "AND DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?" : ""}
      ORDER BY ni.fecha_hora_ocurrencia DESC
      LIMIT ? OFFSET ?
    `;

    const replacements = fecha_inicio && fecha_fin 
      ? [fecha_inicio, fecha_fin, limit, offset]
      : [limit, offset];

    const novedades = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Query para contar total (sin paginación)
    const countQuery = `
      SELECT COUNT(DISTINCT ni.id) as total
      FROM novedades_incidentes ni
      INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id
      LEFT JOIN subtipos_novedad stn ON ni.subtipo_novedad_id = stn.id
      WHERE ni.estado = 1 
        AND ni.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM operativos_personal_novedades opn 
          WHERE opn.novedad_id = ni.id AND opn.deleted_at IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM operativos_vehiculos_novedades ovn 
          WHERE ovn.novedad_id = ni.id AND ovn.deleted_at IS NULL
        )
        ${fecha_inicio && fecha_fin ? "AND DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?" : ""}
    `;

    const countReplacements = fecha_inicio && fecha_fin ? [fecha_inicio, fecha_fin] : [];
    const countResult = await db.query(countQuery, {
      replacements: countReplacements,
      type: QueryTypes.SELECT
    });

    const total = countResult[0]?.total || 0;

    return {
      success: true,
      data: novedades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters_applied: {
        fecha_inicio,
        fecha_fin,
        estado: 1
      },
      query_info: {
        query_type: "NOT_EXISTS",
        total_registros: novedades.length,
        total_sin_paginar: total
      }
    };

  } catch (error) {
    console.error("❌ Error en getNovedadesNoAtendidas:", error);
    throw new Error(`Error al obtener novedades no atendidas: ${error.message}`);
  }
};

/**
 * Formatea los datos de novedades no atendidas para respuesta
 * @param {Array} novedades - Datos brutos de la base
 * @returns {Array} Datos formateados
 */
export const formatNovedadesNoAtendidas = (novedades) => {
  return novedades.map(novedad => {
    const data = novedad.dataValues;

    return {
      // Información básica de la novedad
      novedad_id: data.id,
      novedad_code: data.novedad_code,
      fecha_hora_ocurrencia: data.fecha_hora_ocurrencia,
      fecha_registro: data.created_at,
      
      // Tipo y subtipo
      tipo_novedad_id: data.tipo_novedad_id,
      tipo_novedad_nombre: data.novedadTipoNovedad?.nombre,
      subtipo_novedad_id: data.subtipo_novedad_id,
      subtipo_novedad: data.novedadSubtipoNovedad?.nombre,
      prioridad_novedad: data.novedadSubtipoNovedad?.prioridad,
      
      // Descripción y ubicación
      descripcion: data.descripcion,
      origen_llamada: data.origen_llamada,
      direccion_id: data.direccion_id,
      localizacion: data.localizacion,
      referencia_ubicacion: data.referencia_ubicacion,
      latitud: data.latitud,
      longitud: data.longitud,
      
      // Estado y prioridad
      estado_novedad: data.estado,
      prioridad_actual: data.prioridad_actual,
      
      // Tiempos de respuesta
      tiempo_respuesta_min: data.tiempo_respuesta_min,
      tiempo_respuesta_min_operativo: data.tiempo_respuesta_min_operativo,
      
      // Personal asignado (si existe)
      personal_cargo_id: data.personal_cargo_id,
      usuario_despacho_id: data.usuario_despacho,
      usuario_cierre_id: data.usuario_cierre,
      
      // Auditoría
      created_by: data.created_by,
      created_at: data.created_at,
      updated_by: data.updated_by,
      updated_at: data.updated_at,
      
      // Estado de atención
      estado_atencion: "NO_ATENDIDA",
      tipo_atencion_faltante: detectarTipoAtencionFaltante(data)
    };
  });
};

/**
 * Detecta qué tipo de atención falta para una novedad
 * @param {Object} novedad - Datos de la novedad
 * @returns {Array} Tipos de atención faltantes
 */
const detectarTipoAtencionFaltante = (novedad) => {
  const faltantes = [];
  
  // Si no tiene relación con operativos personales, falta atención a pie
  if (!novedad.operativosPersonalNovedades || novedad.operativosPersonalNovedades.length === 0) {
    faltantes.push("PATRULLAJE_A_PIE");
  }
  
  // Si no tiene relación con operativos vehiculares, falta atención vehicular
  if (!novedad.operativosVehiculosNovedades || novedad.operativosVehiculosNovedades.length === 0) {
    faltantes.push("PATRULLAJE_VEHICULAR");
  }
  
  return faltantes;
};

/**
 * Obtiene resumen estadístico de novedades no atendidas
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export const getResumenNovedadesNoAtendidas = async (queryParams = {}) => {
  try {
    const filters = buildFilters(queryParams);

    // Obtener novedades no atendidas
    const result = await getNovedadesNoAtendidas({ ...queryParams, limit: 10000, page: 1 });
    const novedades = result.data;
    
    // Estadísticas básicas
    const totalNovedades = novedades.length;
    
    // Agrupar por tipo de novedad
    const novedadesPorTipo = {};
    novedades.forEach(novedad => {
      const tipo = novedad.novedadTipoNovedad?.nombre || "SIN_TIPO";
      novedadesPorTipo[tipo] = (novedadesPorTipo[tipo] || 0) + 1;
    });
    
    // Agrupar por prioridad
    const novedadesPorPrioridad = {};
    novedades.forEach(novedad => {
      const prioridad = novedad.novedadSubtipoNovedad?.prioridad || "SIN_PRIORIDAD";
      novedadesPorPrioridad[prioridad] = (novedadesPorPrioridad[prioridad] || 0) + 1;
    });
    
    // Agrupar por tipo de atención faltante
    const atencionFaltante = {};
    novedades.forEach(novedad => {
      const faltantes = detectarTipoAtencionFaltante(novedad);
      faltantes.forEach(tipo => {
        atencionFaltante[tipo] = (atencionFaltante[tipo] || 0) + 1;
      });
    });
    
    // Agrupar por fecha
    const novedadesPorFecha = {};
    novedades.forEach(novedad => {
      const fecha = new Date(novedad.fecha_hora_ocurrencia).toISOString().split("T")[0];
      novedadesPorFecha[fecha] = (novedadesPorFecha[fecha] || 0) + 1;
    });

    return {
      success: true,
      data: {
        total_novedades_no_atendidas: totalNovedades,
        novedades_por_tipo: Object.entries(novedadesPorTipo).map(([tipo, cantidad]) => ({
          tipo,
          cantidad,
          porcentaje: ((cantidad / totalNovedades) * 100).toFixed(2)
        })),
        novedades_por_prioridad: Object.entries(novedadesPorPrioridad).map(([prioridad, cantidad]) => ({
          prioridad,
          cantidad,
          porcentaje: ((cantidad / totalNovedades) * 100).toFixed(2)
        })),
        atencion_faltante: Object.entries(atencionFaltante).map(([tipo, cantidad]) => ({
          tipo_atencion_faltante: tipo,
          cantidad,
          porcentaje: ((cantidad / totalNovedades) * 100).toFixed(2)
        })),
        novedades_por_fecha: Object.entries(novedadesPorFecha)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([fecha, cantidad]) => ({
            fecha,
            cantidad
          })),
        query_info: result.query_info
      }
    };

  } catch (error) {
    console.error("❌ Error en getResumenNovedadesNoAtendidas:", error);
    throw new Error(`Error al obtener resumen de novedades no atendidas: ${error.message}`);
  }
};

/**
 * Obtiene reportes combinados de operativos (vehiculares + a pie + no atendidas)
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Datos consolidados de todos los operativos
 */
export const getReportesCombinados = async (queryParams = {}) => {
  try {
    console.log("🔄 Iniciando generación de reportes combinados...");
    
    const filters = buildFilters(queryParams);
    const paginationOptions = buildPaginationOptions(queryParams);

    // Ejecutar todas las consultas en paralelo
    const [
      resultadoVehiculares,
      resultadoPie,
      resultadoNoAtendidas
    ] = await Promise.all([
      getOperativosVehiculares(queryParams),
      getOperativosPie(queryParams),
      getNovedadesNoAtendidas(queryParams)
    ]);

    // Formatear todos los datos (solo se necesita formatear para los que usan Sequelize)
    const vehicularesFormateados = resultadoVehiculares.data; // Ya viene formateado del SQL directo
    const pieFormateados = resultadoPie.data; // Ya viene formateado del SQL directo
    const noAtendidasFormateadas = resultadoNoAtendidas.data; // Ya viene formateado del SQL directo

    // Combinar todos los datos por fecha de ocurrencia
    const todosLosDatos = [
      ...vehicularesFormateados.map(item => ({ ...item, tipo_operativo: "VEHICULAR" })),
      ...pieFormateados.map(item => ({ ...item, tipo_operativo: "PIE" })),
      ...noAtendidasFormateadas.map(item => ({ ...item, tipo_operativo: "NO_ATENDIDA" }))
    ];

    // Ordenar por fecha_hora_ocurrencia descendente
    todosLosDatos.sort((a, b) => 
      new Date(b.fecha_hora_ocurrencia) - new Date(a.fecha_hora_ocurrencia)
    );

    // Aplicar paginación manual al resultado combinado
    const page = parseInt(queryParams.page) || 1;
    const limit = Math.min(parseInt(queryParams.limit) || 50, 1000);
    const offset = (page - 1) * limit;

    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedResults = todosLosDatos.slice(startIndex, endIndex);

    // Actualizar información de paginación
    const pagination = {
      page,
      limit,
      totalPages: Math.ceil(todosLosDatos.length / limit),
      total: todosLosDatos.length
    };

    return {
      success: true,
      data: paginatedResults,
      pagination,
      filters_applied: filters,
      resumen: {
        total_vehiculares: vehicularesFormateados.length,
        total_pie: pieFormateados.length,
        total_no_atendidas: noAtendidasFormateadas.length,
        total_general: todosLosDatos.length,
        porcentaje_atencion: todosLosDatos.length > 0 ? 
          ((vehicularesFormateados.length + pieFormateados.length) / todosLosDatos.length * 100).toFixed(2) : 0
      },
      query_info: {
        tipo: "COMBINADO",
        fuentes: ["VEHICULARES", "PIE", "NO_ATENDIDAS"],
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error("❌ Error en getReportesCombinados:", error);
    throw new Error(`Error al obtener reportes combinados: ${error.message}`);
  }
};

/**
 * Obtiene dashboard con KPIs integrados de todos los operativos
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} KPIs y métricas consolidadas
 */
export const getDashboardOperativos = async (queryParams = {}) => {
  try {
    console.log("📊 Iniciando generación de dashboard operativos...");
    
    const filters = buildFilters(queryParams);

    // Obtener resúmenes de todas las fuentes en paralelo
    const [
      resumenVehicular,
      resumenPie,
      resumenNoAtendidas
    ] = await Promise.all([
      getResumenVehicular(queryParams),
      getResumenPie(queryParams),
      getResumenNovedadesNoAtendidas(queryParams)
    ]);

    // Métricas generales - Acceder correctamente a los datos anidados en propiedad data
    const totalVehiculares = resumenVehicular.data?.total_novedades || 0;
    const totalPie = resumenPie.data?.total_novedades || 0;
    const totalNoAtendidas = resumenNoAtendidas.data?.total_novedades_no_atendidas || 0;
    const totalGeneral = totalVehiculares + totalPie + totalNoAtendidas;

    // KPIs principales
    const kpis = {
      total_novedades: totalGeneral,
      novedades_atendidas: totalVehiculares + totalPie,
      novedades_no_atendidas: totalNoAtendidas,
      tasa_atencion_general: totalGeneral > 0 ? 
        ((totalVehiculares + totalPie) / totalGeneral * 100).toFixed(2) : 0,
      
      // Distribución por tipo
      distribucion_tipo: {
        vehiculares: {
          cantidad: totalVehiculares,
          porcentaje: totalGeneral > 0 ? (totalVehiculares / totalGeneral * 100).toFixed(2) : 0
        },
        pie: {
          cantidad: totalPie,
          porcentaje: totalGeneral > 0 ? (totalPie / totalGeneral * 100).toFixed(2) : 0
        },
        no_atendidas: {
          cantidad: totalNoAtendidas,
          porcentaje: totalGeneral > 0 ? (totalNoAtendidas / totalGeneral * 100).toFixed(2) : 0
        }
      }
    };

    // Obtener métricas de rendimiento detalladas
    const metricas_rendimiento_detalle = await obtenerMetricasRendimiento(queryParams);
    
    // Métricas de rendimiento (si hay datos de tiempo) - Acceder correctamente a datos anidados
    const metricas_rendimiento = {
      tiempo_promedio_respuesta: metricas_rendimiento_detalle.tiempo_promedio_respuesta,
      novedades_atendidas_a_tiempo: metricas_rendimiento_detalle.novedades_atendidas_a_tiempo,
      novedades_atendidas_fuera_tiempo: metricas_rendimiento_detalle.novedades_atendidas_fuera_tiempo,
      eficiencia_operativa: totalGeneral > 0 ? 
        ((totalVehiculares + totalPie) / totalGeneral * 100).toFixed(2) : 0
    };

    // Análisis por turnos (combinado) - Acceder correctamente a datos anidados
    const analisis_turnos = combinarAnalisisTurnos(
      resumenVehicular.data?.novedades_por_turno || [],
      resumenPie.data?.novedades_por_turno || []
    );

    // Análisis por prioridad - Acceder correctamente a datos anidados
    const analisis_prioridad = combinarAnalisisPrioridad(
      resumenVehicular.data?.novedades_por_prioridad || [],
      resumenPie.data?.novedades_por_prioridad || [],
      resumenNoAtendidas.data?.novedades_por_prioridad || []
    );

    // Tendencias (si hay datos por fecha) - Obtener datos reales por fecha
    // Si no hay parámetros, usar las fechas de los filtros aplicados en los resúmenes
    let tendenciasParams = queryParams;
    if (!queryParams.fecha_inicio || !queryParams.fecha_fin) {
      // Intentar obtener fechas de los resúmenes
      const fechasVehiculares = resumenVehicular.data?.filters_applied;
      const fechasPie = resumenPie.data?.filters_applied;
      
      if (fechasVehiculares?.fecha_inicio && fechasVehiculares?.fecha_fin) {
        tendenciasParams = {
          fecha_inicio: fechasVehiculares.fecha_inicio,
          fecha_fin: fechasVehiculares.fecha_fin
        };
      } else if (fechasPie?.fecha_inicio && fechasPie?.fecha_fin) {
        tendenciasParams = {
          fecha_inicio: fechasPie.fecha_inicio,
          fecha_fin: fechasPie.fecha_fin
        };
      }
    }
    
    const tendencias = await combinarTendencias(tendenciasParams);

    return {
      success: true,
      data: {
        kpis_principales: kpis,
        metricas_rendimiento,
        analisis_turnos,
        analisis_prioridad,
        tendencias,
        resumenes_fuentes: {
          vehiculares: resumenVehicular,
          pie: resumenPie,
          no_atendidas: resumenNoAtendidas
        },
        filtros_aplicados: filters,
        generated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error("❌ Error en getDashboardOperativos:", error);
    throw new Error(`Error al generar dashboard operativos: ${error.message}`);
  }
};

/**
 * Calcula tiempo promedio de respuesta
 * @param {Array} datos - Datos con información de tiempo
 * @returns {number} Tiempo promedio en minutos
 */
const calcularTiempoPromedioRespuesta = (datos) => {
  if (!datos || datos.length === 0) return 0;
  
  const tiempos = datos
    .filter(d => d.tiempo_respuesta_min && d.tiempo_respuesta_min > 0)
    .map(d => d.tiempo_respuesta_min);
  
  if (tiempos.length === 0) return 0;
  
  const suma = tiempos.reduce((acc, tiempo) => acc + tiempo, 0);
  return (suma / tiempos.length).toFixed(2);
};

/**
 * Obtiene métricas de rendimiento detalladas de las novedades atendidas
 * @param {Object} queryParams - Parámetros de filtrado
 * @returns {Promise<Object>} Métricas de rendimiento
 */
const obtenerMetricasRendimiento = async (queryParams = {}) => {
  try {
    const { fecha_inicio, fecha_fin } = queryParams;
    const sanitizedFechaInicio = fecha_inicio || "2026-04-01";
    const sanitizedFechaFin = fecha_fin || "2026-04-30";
    
    // Base tiempo mínimo en minutos (configurable)
    const BASE_TIEMPO_MINIMO = 15; // 15 minutos como base
    
    // Obtener todas las novedades atendidas por operativos con sus tiempos de respuesta
    const [novedadesVehiculares, novedadesPie] = await Promise.all([
      // Novedades atendidas por operativos vehiculares
      db.query(`
        SELECT 
          ni.id,
          ni.tiempo_respuesta_min_operativo,
          ni.prioridad_actual,
          'VEHICULAR' as tipo_operativo
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 
          AND ni.deleted_at IS NULL
          AND ni.tiempo_respuesta_min_operativo IS NOT NULL
          AND ni.tiempo_respuesta_min_operativo > 0
      `, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin],
        type: QueryTypes.SELECT
      }),
      
      // Novedades atendidas por operativos a pie
      db.query(`
        SELECT 
          ni.id,
          ni.tiempo_respuesta_min_operativo,
          ni.prioridad_actual,
          'PIE' as tipo_operativo
        FROM novedades_incidentes ni
        INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 
          AND ni.deleted_at IS NULL
          AND ni.tiempo_respuesta_min_operativo IS NOT NULL
          AND ni.tiempo_respuesta_min_operativo > 0
      `, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin],
        type: QueryTypes.SELECT
      })
    ]);
    
    // Combinar todas las novedades atendidas
    const todasNovedades = [...novedadesVehiculares, ...novedadesPie];
    
    if (todasNovedades.length === 0) {
      return {
        tiempo_promedio_respuesta: 0,
        novedades_atendidas_a_tiempo: 0,
        novedades_atendidas_fuera_tiempo: 0,
        total_novedades_con_tiempo: 0
      };
    }
    
    // Calcular tiempo promedio de respuesta
    const tiempos = todasNovedades.map(n => n.tiempo_respuesta_min_operativo);
    const tiempoPromedio = (tiempos.reduce((sum, tiempo) => sum + tiempo, 0) / tiempos.length).toFixed(2);
    
    // Clasificar por tiempo de respuesta
    const atendidasATiempo = todasNovedades.filter(n => n.tiempo_respuesta_min_operativo <= BASE_TIEMPO_MINIMO).length;
    const atendidasFueraTiempo = todasNovedades.filter(n => n.tiempo_respuesta_min_operativo > BASE_TIEMPO_MINIMO).length;
    
    return {
      tiempo_promedio_respuesta: parseFloat(tiempoPromedio),
      novedades_atendidas_a_tiempo: atendidasATiempo,
      novedades_atendidas_fuera_tiempo: atendidasFueraTiempo,
      total_novedades_con_tiempo: todasNovedades.length,
      base_tiempo_minimo: BASE_TIEMPO_MINIMO
    };
    
  } catch (error) {
    console.error("❌ Error en obtenerMetricasRendimiento:", error);
    return {
      tiempo_promedio_respuesta: 0,
      novedades_atendidas_a_tiempo: 0,
      novedades_atendidas_fuera_tiempo: 0,
      total_novedades_con_tiempo: 0
    };
  }
};

/**
 * Combina análisis por turnos de múltiples fuentes
 * @param {Array} datosVehiculares - Datos de operativos vehiculares
 * @param {Array} datosPie - Datos de operativos a pie
 * @returns {Array} Análisis combinado por turnos
 */
const combinarAnalisisTurnos = (datosVehiculares, datosPie) => {
  const turnosCombinados = {};
  
  // Procesar datos vehiculares
  datosVehiculares.forEach(dato => {
    const turno = dato.turno || "SIN_TURNO";
    turnosCombinados[turno] = (turnosCombinados[turno] || 0) + (dato.total || 0);
  });
  
  // Procesar datos de pie
  datosPie.forEach(dato => {
    const turno = dato.turno || "SIN_TURNO";
    turnosCombinados[turno] = (turnosCombinados[turno] || 0) + (dato.total || 0);
  });
  
  // Calcular total general para porcentajes
  const totalGeneral = Object.values(turnosCombinados).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(turnosCombinados).map(([turno, cantidad]) => ({
    turno,
    cantidad,
    porcentaje: totalGeneral > 0 ? parseFloat((cantidad / totalGeneral * 100).toFixed(2)) : 0
  }));
};

/**
 * Combina análisis por prioridad de múltiples fuentes
 * @param {Array} datosVehiculares - Datos de operativos vehiculares
 * @param {Array} datosPie - Datos de operativos a pie
 * @param {Array} datosNoAtendidas - Datos de novedades no atendidas
 * @returns {Array} Análisis combinado por prioridad
 */
const combinarAnalisisPrioridad = (datosVehiculares, datosPie, datosNoAtendidas) => {
  const prioridadesCombinadas = {};
  
  // Procesar todas las fuentes
  [...datosVehiculares, ...datosPie, ...datosNoAtendidas].forEach(dato => {
    const prioridad = dato.prioridad_actual || dato.prioridad || "SIN_PRIORIDAD";
    prioridadesCombinadas[prioridad] = (prioridadesCombinadas[prioridad] || 0) + (dato.cantidad || dato.total || 0);
  });
  
  // Calcular total general para porcentajes
  const totalGeneral = Object.values(prioridadesCombinadas).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(prioridadesCombinadas).map(([prioridad, cantidad]) => ({
    prioridad,
    cantidad,
    porcentaje: totalGeneral > 0 ? parseFloat((cantidad / totalGeneral * 100).toFixed(2)) : 0
  }));
};

/**
 * Combina tendencias por fecha de múltiples fuentes
 * @param {Array} datosTodasFuentes - Datos de todas las fuentes
 * @returns {Array} Tendencias combinadas por fecha
 */
const combinarTendencias = async (queryParams = {}) => {
  try {
    // Intentar obtener fechas de diferentes formas
    let fecha_inicio = queryParams.fecha_inicio || queryParams.fechaInicio || queryParams.start_date;
    let fecha_fin = queryParams.fecha_fin || queryParams.fechaFin || queryParams.end_date;
    
    // Si aún no hay fechas, intentar desde filters
    if (!fecha_inicio || !fecha_fin) {
      const filters = queryParams.filters || queryParams.filtros || {};
      fecha_inicio = fecha_inicio || filters.fecha_inicio || filters.fechaInicio || filters.start_date;
      fecha_fin = fecha_fin || filters.fecha_fin || filters.fechaFin || filters.end_date;
    }
    
    // Si no hay fechas, retornar array vacío
    if (!fecha_inicio || !fecha_fin) {
      return [];
    }
    
    const sanitizedFechaInicio = fecha_inicio;
    const sanitizedFechaFin = fecha_fin;
    
    // Obtener novedades por fecha de todas las fuentes
    const [tendenciasVehiculares, tendenciasPie, tendenciasNoAtendidas] = await Promise.all([
      // Novedades vehiculares por fecha
      db.query(`
        SELECT 
          DATE(ni.fecha_hora_ocurrencia) as fecha,
          COUNT(DISTINCT ni.id) as cantidad
        FROM novedades_incidentes ni
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 
          AND ni.deleted_at IS NULL
        GROUP BY DATE(ni.fecha_hora_ocurrencia)
        ORDER BY fecha
      `, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin],
        type: QueryTypes.SELECT
      }),
      
      // Novedades a pie por fecha
      db.query(`
        SELECT 
          DATE(ni.fecha_hora_ocurrencia) as fecha,
          COUNT(DISTINCT ni.id) as cantidad
        FROM novedades_incidentes ni
        INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 
          AND ni.deleted_at IS NULL
        GROUP BY DATE(ni.fecha_hora_ocurrencia)
        ORDER BY fecha
      `, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin],
        type: QueryTypes.SELECT
      }),
      
      // Novedades no atendidas por fecha
      db.query(`
        SELECT 
          DATE(ni.fecha_hora_ocurrencia) as fecha,
          COUNT(DISTINCT ni.id) as cantidad
        FROM novedades_incidentes ni
        WHERE DATE(ni.fecha_hora_ocurrencia) BETWEEN ? AND ?
          AND ni.estado = 1 
          AND ni.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM operativos_vehiculos_novedades ovn WHERE ovn.novedad_id = ni.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM operativos_personal_novedades opn WHERE opn.novedad_id = ni.id
          )
        GROUP BY DATE(ni.fecha_hora_ocurrencia)
        ORDER BY fecha
      `, {
        replacements: [sanitizedFechaInicio, sanitizedFechaFin],
        type: QueryTypes.SELECT
      })
    ]);
    
    // Combinar todas las tendencias
    const tendenciasCombinadas = {};
    
    // Procesar datos vehiculares
    tendenciasVehiculares.forEach(item => {
      tendenciasCombinadas[item.fecha] = (tendenciasCombinadas[item.fecha] || 0) + item.cantidad;
    });
    
    // Procesar datos de pie
    tendenciasPie.forEach(item => {
      tendenciasCombinadas[item.fecha] = (tendenciasCombinadas[item.fecha] || 0) + item.cantidad;
    });
    
    // Procesar datos no atendidas
    tendenciasNoAtendidas.forEach(item => {
      tendenciasCombinadas[item.fecha] = (tendenciasCombinadas[item.fecha] || 0) + item.cantidad;
    });
    
    // Generar rango completo de fechas para asegurar que todos los días estén representados
    const fechas = [];
    const fechaInicio = new Date(sanitizedFechaInicio);
    const fechaFin = new Date(sanitizedFechaFin);
    
    for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha.setDate(fecha.getDate() + 1)) {
      const fechaStr = fecha.toISOString().split("T")[0];
      fechas.push(fechaStr);
    }
    
    // Asegurar que todas las fechas del rango estén presentes
    const tendenciasFinales = fechas.map(fecha => ({
      fecha,
      cantidad: tendenciasCombinadas[fecha] || 0,
      tipo: "COMBINADO"
    }));
    
    return tendenciasFinales;
    
  } catch (error) {
    console.error("❌ Error en combinarTendencias:", error);
    return [];
  }
};

export default {
  getOperativosVehiculares,
  getResumenVehicular,
  getEstadisticasVehiculares,
  getOperativosPie,
  getResumenPie,
  formatOperativosPie,
  formatOperativosPieForExport,
  getNovedadesNoAtendidas,
  getResumenNovedadesNoAtendidas,
  formatNovedadesNoAtendidas,
  getReportesCombinados,
  buildFilters,
  buildPaginationOptions,
  getDashboardOperativos
};
