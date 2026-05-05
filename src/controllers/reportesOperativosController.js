/**
 * ===================================================
 * CONTROLADOR: Reportes Operativos
 * ===================================================
 *
 * Ruta: src/controllers/reportesOperativosController.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-04-23
 *
 * Descripción:
 * Controlador para gestión de reportes de operativos de patrullaje.
 * Implementa endpoints para consultas, resúmenes y estadísticas
 * basados en los queries SQL proporcionados.
 *
 * Funciones:
 * - getOperativosVehiculares() - GET /reportes-operativos/vehiculares
 * - getResumenVehicular() - GET /reportes-operativos/vehiculares/resumen
 * - exportarOperativosVehiculares() - GET /reportes-operativos/vehiculares/exportar
 *
 * @author Windsurf AI
 * @supervisor Romily Oaks
 * @version 1.0.0
 */

import reportesOperativosService from "../services/reportesOperativosService.js";
import ExcelJS from "exceljs";

/**
 * Manejo centralizado de errores
 * @param {Object} res - Response object
 * @param {Error} error - Error object
 * @param {string} message - Mensaje personalizado
 */
const handleError = (res, error, message = "Error interno del servidor") => {
  console.error(`❌ ${message}:`, error);
  
  res.status(500).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
};

/**
 * Construye objeto de respuesta estandarizado
 * @param {boolean} success - Éxito de la operación
 * @param {string} message - Mensaje de respuesta
 * @param {*} data - Datos a retornar
 * @param {Object} additional - Campos adicionales
 * @returns {Object} Objeto de respuesta
 */
const buildResponse = (success, message, data = null, additional = {}) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...additional
  };
};

// ==========================================
// ENDPOINT 1: OPERATIVOS VEHICULARES
// ==========================================

/**
 * Obtener operativos vehiculares con novedades atendidas
 * GET /api/v1/reportes-operativos/vehiculares
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Lista de operativos vehiculares
 */
export const getOperativosVehiculares = async (req, res) => {
  try {
    const result = await reportesOperativosService.getOperativosVehiculares(req.query);
    
    // Los datos ya vienen formateados del SQL directo
    const response = buildResponse(
      true,
      "Operativos vehiculares obtenidos exitosamente",
      result.data,
      {
        pagination: result.pagination,
        estadisticas_prioridades: result.estadisticas_prioridades,
        filters_applied: result.filters_applied,
        total_records: result.pagination.total
      }
    );
    
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al obtener operativos vehiculares");
  }
};

// ==========================================
// ENDPOINT 2: RESUMEN VEHICULAR
// ==========================================

/**
 * Obtener resumen estadístico de operativos vehiculares
 * GET /api/v1/reportes-operativos/vehiculares/resumen
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export const getResumenVehicular = async (req, res) => {
  try {
    const result = await reportesOperativosService.getResumenVehicular(req.query);
    
    const response = buildResponse(
      true,
      "Resumen vehicular generado exitosamente",
      result.data,
      {
        filters_applied: req.query,
        generated_at: new Date().toISOString()
      }
    );
    
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al generar resumen vehicular");
  }
};

// ==========================================
// ENDPOINT 3: EXPORTAR OPERATIVOS VEHICULARES
// ==========================================

/**
 * Exportar operativos vehiculares a Excel/CSV
 * GET /api/v1/reportes-operativos/vehiculares/exportar
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>} Archivo de exportación
 */
export const exportarOperativosVehiculares = async (req, res) => {
  try {
    const formato = req.query.formato?.toLowerCase() || "excel";
    
    if (!["excel", "csv"].includes(formato)) {
      return res.status(400).json(buildResponse(
        false,
        "Formato no válido. Use 'excel' o 'csv'",
        null,
        { formatos_validos: ["excel", "csv"] }
      ));
    }
    
    // 1. Primero obtener el JSON completo (como en dashboard)
    const exportQuery = { ...req.query, limit: 10000, page: 1 };
    const result = await reportesOperativosService.getOperativosVehiculares(exportQuery);
    
    if (!result.success || result.data.length === 0) {
      return res.status(404).json(buildResponse(
        false,
        "No hay datos para exportar con los filtros seleccionados"
      ));
    }
    
    // Usar exactamente los mismos campos que el JSON
    const datos = result.data;
    const datosParaExportar = datos.map(item => ({
      // Datos del Turno
      "fecha_turno": item.fecha_turno || "",
      "nro_orden_turno": item.nro_orden_turno || "",
      "turno": item.turno || "",
      "turno_horario_inicio": item.turno_horario_inicio || "",
      "turno_horario_fin": item.turno_horario_fin || "",
      "inicio_operativo_sector": item.inicio_operativo_sector || "",
      "fin_operativo_sector": item.fin_operativo_sector || "",
      "operador_id": item.operador_id || "",
      "Usuario_Operador_Sistema": item.Usuario_Operador_Sistema || "",
      "Cargo_Usuario_Operador": item.Cargo_Usuario_Operador || "",
      "sector_id": item.sector_id || "",
      "sector_code": item.sector_code || "",
      "nombre_sector": item.nombre_sector || "",
      "supervisor_id": item.supervisor_id || "",
      "Supervisor_Sector": item.Supervisor_Sector || "",
      "Cargo_Supervisor": item.Cargo_Supervisor || "",
      "observaciones_turno": item.observaciones_turno || "",
      "estado_operativo_sector": item.estado_operativo_sector || "",
      "updated_by": item.updated_by || "",
      "Usuario_Actualizador_Turno": item.Usuario_Actualizador_Turno || "",
      "Cargo_Usuario_Actualizador_Turno": item.Cargo_Usuario_Actualizador_Turno || "",
      "Fecha_Turno_Actualizado": item.Fecha_Turno_Actualizado || "",
      
      // Datos del Vehículo
      "vehiculo_id": item.vehiculo_id || "",
      "tipo_vehiculo": item.tipo_vehiculo || "",
      "codigo_vehiculo": item.codigo_vehiculo || "",
      "nombre_vehiculo": item.nombre_vehiculo || "",
      "placa_vehiculo": item.placa_vehiculo || "",
      "marca_vehiculo": item.marca_vehiculo || "",
      "soat_vehiculo": item.soat_vehiculo || "",
      "vencimiento_soat": item.vencimiento_soat || "",
      "proximo_mantenimiento_vehiculo": item.proximo_mantenimiento_vehiculo || "",
      "conductor_id": item.conductor_id || "",
      "Nombres_conductor": item.Nombres_conductor || "",
      "Cargo_Conductor": item.Cargo_Conductor || "",
      "copiloto_id": item.copiloto_id || "",
      "Nombres_copiloto": item.Nombres_copiloto || "",
      "Cargo_Copiloto": item.Cargo_Copiloto || "",
      "tipo_copiloto_id": item.tipo_copiloto_id || "",
      "tipo_copiloto": item.tipo_copiloto || "",
      "radio_tetra_id": item.radio_tetra_id || "",
      "radio_tetra_code": item.radio_tetra_code || "",
      "Descripcion_Radio_Tetra": item.Descripcion_Radio_Tetra || "",
      "estado_operativo_id": item.estado_operativo_id || "",
      "estado_patrullaje_vehiculo": item.estado_patrullaje_vehiculo || "",
      "kilometraje_inicio": item.kilometraje_inicio || "",
      "hora_inicio": item.hora_inicio || "",
      "nivel_combustible_inicio": item.nivel_combustible_inicio || "",
      "kilometraje_recarga": item.kilometraje_recarga || "",
      "hora_recarga": item.hora_recarga || "",
      "combustible_litros": item.combustible_litros || "",
      "importe_recarga": item.importe_recarga || "",
      "nivel_combustible_recarga": item.nivel_combustible_recarga || "",
      "kilometraje_fin": item.kilometraje_fin || "",
      "hora_fin": item.hora_fin || "",
      "nivel_combustible_fin": item.nivel_combustible_fin || "",
      "kilometros_recorridos": item.kilometros_recorridos || "",
      "observaciones_operativo_vehicular": item.observaciones_operativo_vehicular || "",
      "Estado_registro_Operativo_Vehicular": item.Estado_registro_Operativo_Vehicular || "",
      "Usuario_Actualiza_Operativo_Vehiculo": item.Usuario_Actualiza_Operativo_Vehiculo || "",
      "Cargo_Usuario_Actualiza_Operativo_Vehiculo": item.Cargo_Usuario_Actualiza_Operativo_Vehiculo || "",
      "Actualizacion_Operativo_Vehiculo": item.Actualizacion_Operativo_Vehiculo || "",
      
      // Datos del Cuadrante
      "cuadrante_id": item.cuadrante_id || "",
      "cuadrante_code": item.cuadrante_code || "",
      "nombre_cuadrante": item.nombre_cuadrante || "",
      "zona_code": item.zona_code || "",
      "hora_ingreso": item.hora_ingreso || "",
      "hora_salida": item.hora_salida || "",
      "tiempo_minutos": item.tiempo_minutos || "",
      "observaciones_operativo_cuadrante": item.observaciones_operativo_cuadrante || "",
      "incidentes_reportados_cuadrante": item.incidentes_reportados_cuadrante || "",
      
      // Datos de Atención
      "reportado": item.reportado || "",
      "atendido": item.atendido || "",
      "Estado_Operativo_Novedad": item.Estado_Operativo_Novedad || "",
      "prioridad": item.prioridad || "",
      "Observaciones_Operativo_Novedad": item.Observaciones_Operativo_Novedad || "",
      "Usuario_Actualiza_Operativo_Novedad": item.Usuario_Actualiza_Operativo_Novedad || "",
      "cargo_Usuario_Actualiza_Operativo_Novedad": item.cargo_Usuario_Actualiza_Operativo_Novedad || "",
      "Operativo_Novedad_Actualizada": item.Operativo_Novedad_Actualizada || "",
      "acciones_tomadas": item.acciones_tomadas || "",
      
      // Datos de la Novedad
      "novedad_id": item.novedad_id || "",
      "novedad_code": item.novedad_code || "",
      "fecha_hora_ocurrencia": item.fecha_hora_ocurrencia || "",
      "tipo_novedad_nombre": item.tipo_novedad_nombre || "",
      "subtipo_novedad": item.subtipo_novedad || "",
      "Prioridad_Novedad": item.Prioridad_Novedad || "",
      "descripcion_novedad": item.descripcion_novedad || "",
      "estado_novedad": item.estado_novedad || "",
      "origen_llamada": item.origen_llamada || "",
      "ubigeo_code": item.ubigeo_code || "",
      "direccion_id": item.direccion_id || "",
      "localizacion": item.localizacion || "",
      "referencia_ubicacion": item.referencia_ubicacion || "",
      "latitud": item.latitud || "",
      "longitud": item.longitud || "",
      "ajustado_en_mapa": item.ajustado_en_mapa || "",
      "fecha_ajuste_mapa": item.fecha_ajuste_mapa || "",
      "es_anonimo": item.es_anonimo || "",
      "reportante_nombre": item.reportante_nombre || "",
      "reportante_telefono": item.reportante_telefono || "",
      "reportante_doc_identidad": item.reportante_doc_identidad || "",
      "observaciones_novedad": item.observaciones_novedad || "",
      "personal_cargo_id": item.personal_cargo_id || "",
      "Nombres_Personal_a_Cargo": item.Nombres_Personal_a_Cargo || "",
      "Cargo_Personal": item.Cargo_Personal || "",
      "fecha_despacho": item.fecha_despacho || "",
      "usuario_despacho": item.usuario_despacho || "",
      "nombre_usuario_despacho": item.nombre_usuario_despacho || "",
      "Cargo_Usuario_Despacho": item.Cargo_Usuario_Despacho || "",
      "fecha_llegada": item.fecha_llegada || "",
      "fecha_cierre": item.fecha_cierre || "",
      "usuario_cierre": item.usuario_cierre || "",
      "nombre_usuario_cierre": item.nombre_usuario_cierre || "",
      "Cargo_Usuario_Cierre": item.Cargo_Usuario_Cierre || "",
      "km_inicial": item.km_inicial || "",
      "km_final": item.km_final || "",
      "Base_Tiempo_Minimo": item.Base_Tiempo_Minimo || "",
      "tiempo_respuesta_min": item.tiempo_respuesta_min || "",
      "tiempo_respuesta_min_operativo": item.tiempo_respuesta_min_operativo || "",
      "prioridad_actual": item.prioridad_actual || "",
      "requiere_seguimiento": item.requiere_seguimiento || "",
      "fecha_proxima_revision": item.fecha_proxima_revision || "",
      "num_personas_afectadas": item.num_personas_afectadas || "",
      "perdidas_materiales_estimadas": item.perdidas_materiales_estimadas || "",
      "estado_novedad_id": item.estado_novedad_id || "",
      "estado_novedad_actual": item.estado_novedad_actual || ""
    }));

    // 2. Generar archivo Excel/CSV
    if (formato === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Operativos Vehiculares");
      
      // Obtener todos los campos únicos del primer registro como columnas
      if (datosParaExportar.length > 0) {
        const columnas = Object.keys(datosParaExportar[0]);
        
        worksheet.columns = columnas.map(col => ({
          header: col,
          key: col,
          width: 20
        }));
        
        // Agregar datos
        worksheet.addRows(datosParaExportar);
        
        // Estilos para encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6B8" }
        };
      }
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=operativos-vehiculares-${new Date().toISOString().split("T")[0]}.xlsx`);
      
      const buffer = await workbook.xlsx.writeBuffer();
      return res.send(buffer);
    } else {
      // Generar CSV
      if (datosParaExportar.length === 0) {
        const csvHeader = Object.keys(datosParaExportar[0] || {}).join(",") + "\n";
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=operativos-vehiculares-${new Date().toISOString().split("T")[0]}.csv`);
        return res.send(csvHeader);
      }
      
      const columnas = Object.keys(datosParaExportar[0]);
      const csvHeader = columnas.join(",") + "\n";
      const csvRows = datosParaExportar.map(row => 
        columnas.map(col => `"${row[col] || ""}"`).join(",")
      ).join("\n");
      const csvData = csvHeader + csvRows;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=operativos-vehiculares-${new Date().toISOString().split("T")[0]}.csv`);
      return res.send(csvData);
    }
    
  } catch (error) {
    console.error("❌ Error en exportarOperativosVehiculares:", error);
    return res.status(500).json(buildResponse(
      false,
      `Error al exportar operativos vehiculares: ${error.message}`
    ));
  }
};

// ==========================================
// ENDPOINT 4: ESTADÍSTICAS AVANZADAS
// ==========================================

/**
 * Obtener estadísticas avanzadas de operativos vehiculares
 * GET /api/v1/reportes-operativos/vehiculares/estadisticas
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Estadísticas detalladas
 */
export const getEstadisticasVehiculares = async (req, res) => {
  try {
    const filters = req.query;
    
    const result = await reportesOperativosService.getEstadisticasVehiculares(filters);
    
    const response = buildResponse(
      true,
      "Estadísticas vehiculares generadas exitosamente",
      result.data,
      {
        filters_applied: filters,
        generated_at: new Date().toISOString()
      }
    );
    
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al generar estadísticas avanzadas");
  }
};

// ==========================================
// ENDPOINT 4: OPERATIVOS A PIE
// ==========================================

/**
 * Obtener operativos a pie con novedades atendidas
 * GET /api/v1/reportes-operativos/pie
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Lista de operativos a pie
 */
export const getOperativosPie = async (req, res) => {
  try {
    const result = await reportesOperativosService.getOperativosPie(req.query);
    
    const formattedData = result.data.map(item => ({
      ...item,
      fecha_turno: item.fecha_turno || null,
      turno: item.turno || null,
      sector_nombre: item.nombre_sector || null,
      cuadrante_nombre: item.nombre_cuadrante || null,
      personal_nombre: item.nombre_personal || null,
      personal_cargo: item.cargo_personal || null
    }));
    
    const response = buildResponse(
      true,
      "Operativos a pie obtenidos exitosamente",
      formattedData,
      {
        pagination: result.pagination,
        estadisticas_prioridades: result.estadisticas_prioridades,
        filters_applied: req.query,
        total_records: result.pagination.total
      }
    );
    
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al obtener operativos a pie");
  }
};

// ==========================================
// ENDPOINT 5: MÉTRICAS DE PERFORMANCE
// ==========================================

/**
 * Obtener métricas de performance del sistema
 * GET /api/v1/reportes-operativos/vehiculares/metrics
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Métricas de performance
 */
export const getMetricsVehiculares = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const result = await reportesOperativosService.getMetricsVehiculares(req.query);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const response = buildResponse(
      true,
      "Métricas de performance obtenidas exitosamente",
      result.data,
      {
        performance: {
          query_time_ms: duration,
          records_processed: result.data?.length || 0
        },
        generated_at: new Date().toISOString()
      }
    );
    
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al generar resumen de operativos a pie");
  }
};

// ==========================================
// ENDPOINT 6: NOVEDADES NO ATENDIDAS
// ==========================================

/**
 * Obtener novedades no atendidas por ningún operativo
 * GET /api/v1/reportes-operativos/no-atendidas
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Lista de novedades no atendidas
 */
export const getNovedadesNoAtendidas = async (req, res) => {
  try {
    const result = await reportesOperativosService.getNovedadesNoAtendidas(req.query);
    
    const response = buildResponse(
      true,
      "Novedades no atendidas obtenidas exitosamente",
      result.data,
      {
        pagination: result.pagination,
        filters_applied: result.filters_applied,
        query_info: result.query_info,
        total_records: result.pagination.total,
        estadisticas_prioridades: result.estadisticas_prioridades
      }
    );
    
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al obtener novedades no atendidas");
  }
};

// ==========================================
// ENDPOINT 7: DASHBOARD OPERATIVOS
// ==========================================

/**
 * Obtener dashboard con KPIs integrados de todos los operativos
 * GET /api/v1/reportes-operativos/dashboard
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} KPIs y métricas consolidadas
 */
export const getDashboardOperativos = async (req, res) => {
  try {
    const result = await reportesOperativosService.getDashboardOperativos(req.query);
    
    const response = buildResponse(
      true,
      "Dashboard operativos generado exitosamente",
      result.data,
      {
        filters_applied: req.query,
        generated_at: new Date().toISOString()
      }
    );
    
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al generar dashboard operativos");
  }
};

export default {
  getOperativosVehiculares,
  getResumenVehicular,
  exportarOperativosVehiculares,
  getEstadisticasVehiculares,
  getMetricsVehiculares,
  getOperativosPie,
  getNovedadesNoAtendidas,
  getDashboardOperativos
};
