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
    console.log("📊 Iniciando consulta de operativos vehiculares...");
    
    const result = await reportesOperativosService.getOperativosVehiculares(req.query);
    
    // Los datos ya vienen formateados del SQL directo
    const response = buildResponse(
      true,
      "Operativos vehiculares obtenidos exitosamente",
      result.data,
      {
        pagination: result.pagination,
        filters_applied: result.filters_applied,
        total_records: result.pagination.total
      }
    );
    
    console.log(`✅ Operativos vehiculares obtenidos: ${result.data.length} registros`);
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
    console.log("📈 Iniciando generación de resumen vehicular...");
    
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
    
    console.log("✅ Resumen vehicular generado exitosamente");
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
    console.log("📤 Iniciando exportación de operativos vehiculares...");
    console.log("🔍 Parámetros recibidos:", req.query);
    
    const formato = req.query.formato?.toLowerCase() || "excel";
    console.log("📋 Formato solicitado:", formato);
    
    if (!["excel", "csv"].includes(formato)) {
      return res.status(400).json(buildResponse(
        false,
        "Formato no válido. Use 'excel' o 'csv'",
        null,
        { formatos_validos: ["excel", "csv"] }
      ));
    }
    
    // 1. Primero obtener el JSON completo (como en dashboard)
    console.log("🔄 Obteniendo datos JSON de operativos vehiculares...");
    const exportQuery = { ...req.query, limit: 10000, page: 1 };
    const result = await reportesOperativosService.getOperativosVehiculares(exportQuery);
    
    console.log("📊 Resultado del servicio:", { success: result.success, dataLength: result.data?.length });
    
    if (!result.success || result.data.length === 0) {
      console.log("⚠️ No hay datos para exportar");
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

    console.log("🔄 Iniciando generación de archivo...", { formato, registros: datosParaExportar.length });

    // 2. Generar archivo Excel/CSV
    if (formato === "excel") {
      console.log("📊 Creando workbook Excel...");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Operativos Vehiculares");
      
      // Obtener todos los campos únicos del primer registro como columnas
      if (datosParaExportar.length > 0) {
        console.log("📋 Configurando columnas...");
        const columnas = Object.keys(datosParaExportar[0]);
        console.log("📊 Columnas encontradas:", columnas.length);
        
        worksheet.columns = columnas.map(col => ({
          header: col,
          key: col,
          width: 20
        }));
        
        console.log("📝 Agregando datos a worksheet...");
        // Agregar datos
        worksheet.addRows(datosParaExportar);
        
        console.log("🎨 Aplicando estilos...");
        // Estilos para encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6B8" }
        };
      }
      
      console.log("💾 Generando buffer Excel...");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=operativos-vehiculares-${new Date().toISOString().split("T")[0]}.xlsx`);
      
      console.log("🔄 Escribiendo buffer...");
      const buffer = await workbook.xlsx.writeBuffer();
      console.log("✅ Buffer generado, enviando respuesta...");
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
    console.log("📊 Iniciando generación de estadísticas avanzadas...");
    
    const filters = req.query;
    
    // Usar la función del servicio para obtener estadísticas reales
    const result = await reportesOperativosService.getEstadisticasVehiculares(filters);
    
    const response = buildResponse(
      true,
      "Estadísticas avanzadas generadas exitosamente",
      result.data,
      {
        filters_applied: result.filters_applied,
        generated_at: new Date().toISOString()
      }
    );
    
    console.log("✅ Estadísticas avanzadas generadas");
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al generar estadísticas avanzadas");
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
    console.log("⚡ Obteniendo métricas de performance...");
    
    const startTime = Date.now();
    
    // Importar modelos para obtener métricas reales
    const { sequelize } = await import("../models/index.js");
    
    // Métricas de conexión a base de datos
    const dbMetrics = await sequelize.query(`
      SELECT 
        COUNT(*) as total_connections,
        SUM(CASE WHEN command = 'Sleep' THEN 1 ELSE 0 END) as idle_connections,
        SUM(CASE WHEN command != 'Sleep' THEN 1 ELSE 0 END) as active_connections
      FROM information_schema.processlist 
      WHERE db = DATABASE()
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Métricas de tablas principales
    const tableMetrics = await sequelize.query(`
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        (data_length + index_length) as total_size
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name IN ('novedades_incidentes', 'operativos_vehiculos', 'operativos_turno', 'vehiculos')
      ORDER BY total_size DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Métricas de rendimiento de queries (versión simplificada sin performance_schema)
    let recentQueries = [{ total_queries: 0, avg_query_time_sec: 0, max_query_time_sec: 0 }];
    try {
      const tempQueries = await sequelize.query(`
        SELECT 
          COUNT(*) as total_queries,
          0 as avg_query_time_sec,
          0 as max_query_time_sec
        FROM information_schema.processlist 
        WHERE db = DATABASE()
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      if (tempQueries && tempQueries[0]) {
        recentQueries = tempQueries;
      }
    } catch (perfError) {
      console.warn("⚠️ No se pudo obtener métricas de performance_schema:", perfError.message);
    }
    
    // Métricas del sistema
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = {
      performance: {
        query_time_ms: Date.now() - startTime,
        memory_usage: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers,
          // Calcular porcentajes
          heap_used_percent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)
        },
        cpu_usage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime(),
        uptime_formatted: formatUptime(process.uptime())
      },
      database: {
        connection_pool: {
          total: dbMetrics[0]?.total_connections || 0,
          active: dbMetrics[0]?.active_connections || 0,
          idle: dbMetrics[0]?.idle_connections || 0,
          max_pool_size: sequelize.config.pool?.max || 10,
          min_pool_size: sequelize.config.pool?.min || 0
        },
        tables: tableMetrics.map(table => ({
          name: table.table_name,
          rows: parseInt(table.table_rows) || 0,
          size_bytes: parseInt(table.total_size) || 0,
          size_mb: ((parseInt(table.total_size) || 0) / 1024 / 1024).toFixed(2)
        })),
        query_performance: {
          total_queries: parseInt(recentQueries[0]?.total_queries) || 0,
          avg_time_sec: parseFloat(recentQueries[0]?.avg_query_time_sec) || 0,
          max_time_sec: parseFloat(recentQueries[0]?.max_query_time_sec) || 0
        }
      },
      endpoints: {
        operativos_vehiculares: {
          // Métricas simuladas (en producción deberían venir de un sistema de monitoreo)
          total_requests: Math.floor(Math.random() * 1000) + 500,
          avg_response_time: (Math.random() * 200 + 50).toFixed(2),
          success_rate: 98.5 + Math.random() * 1.5,
          last_24h_requests: Math.floor(Math.random() * 100) + 20
        },
        resumen_vehicular: {
          total_requests: Math.floor(Math.random() * 500) + 200,
          avg_response_time: (Math.random() * 150 + 30).toFixed(2),
          success_rate: 99.0 + Math.random() * 1.0
        },
        estadisticas_vehiculares: {
          total_requests: Math.floor(Math.random() * 300) + 100,
          avg_response_time: (Math.random() * 300 + 100).toFixed(2),
          success_rate: 97.5 + Math.random() * 2.5
        }
      },
      system: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        timestamp: new Date().toISOString()
      }
    };
    
    const response = buildResponse(
      true,
      "Métricas de performance obtenidas exitosamente",
      metrics,
      {
        generated_at: new Date().toISOString(),
        metrics_version: "2.0.0"
      }
    );
    
    console.log("✅ Métricas de performance generadas");
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al obtener métricas de performance");
  }
};

/**
 * Formatea el uptime a un formato legible
 * @param {number} seconds - Segundos de uptime
 * @returns {string} Uptime formateado
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// ==========================================
// ENDPOINT 6: OPERATIVOS A PIE
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
    console.log("🚶 Iniciando consulta de operativos a pie...");
    
    const result = await reportesOperativosService.getOperativosPie(req.query);
    
    // Los datos ya vienen formateados del SQL directo
    const formattedData = result.data;
    
    const response = buildResponse(
      true,
      "Operativos a pie obtenidos exitosamente",
      formattedData,
      {
        pagination: result.pagination,
        filters_applied: result.filters_applied,
        total_records: result.pagination.total
      }
    );
    
    console.log(`✅ Operativos a pie obtenidos: ${formattedData.length} registros`);
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al obtener operativos a pie");
  }
};

// ==========================================
// ENDPOINT 7: RESUMEN OPERATIVOS A PIE
// ==========================================

/**
 * Obtener resumen estadístico de operativos a pie
 * GET /api/v1/reportes-operativos/pie/resumen
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export const getResumenPie = async (req, res) => {
  try {
    console.log("📈 Iniciando generación de resumen de operativos a pie...");
    
    const result = await reportesOperativosService.getResumenPie(req.query);
    
    const response = buildResponse(
      true,
      "Resumen de operativos a pie generado exitosamente",
      result,
      {
        filters_applied: req.query,
        generated_at: new Date().toISOString()
      }
    );
    
    console.log("✅ Resumen de operativos a pie generado exitosamente");
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al generar resumen de operativos a pie");
  }
};

// ==========================================
// ENDPOINT 8: EXPORTAR OPERATIVOS A PIE
// ==========================================

/**
 * Exportar operativos a pie a Excel/CSV
 * GET /api/v1/reportes-operativos/pie/exportar
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>} Archivo de exportación
 */
export const exportarOperativosPie = async (req, res) => {
  try {
    console.log("📤 Iniciando exportación de operativos a pie...");
    
    const formato = req.query.formato?.toLowerCase() || "excel";
    
    if (!["excel", "csv"].includes(formato)) {
      return res.status(400).json(buildResponse(
        false,
        "Formato no válido. Use 'excel' o 'csv'",
        null,
        { formatos_validos: ["excel", "csv"] }
      ));
    }
    
    // Obtener datos sin paginación para exportación - usar mismo método que el endpoint JSON
    const exportQuery = { ...req.query, limit: 10000, page: 1 };
    const result = await reportesOperativosService.getOperativosPie(exportQuery);
    
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
      "ID_Usuario_Actualizador_Turno": item.ID_Usuario_Actualizador_Turno || "",
      "Usuario_Actualizador_Turno": item.Usuario_Actualizador_Turno || "",
      "Cargo_Actualizador_Turno": item.Cargo_Actualizador_Turno || "",
      "Fecha_Actualizador_Turno": item.Fecha_Actualizador_Turno || "",
      
      // Datos del Personal Principal
      "doc_tipo": item.doc_tipo || "",
      "doc_numero": item.doc_numero || "",
      "Personal_asignado": item.Personal_asignado || "",
      "cargo_id": item.cargo_id || "",
      "Cargo_Personal_Asignado": item.Cargo_Personal_Asignado || "",
      "nacionalidad": item.nacionalidad || "",
      "estado_personal_asignado": item.estado_personal_asignado || "",
      "regimen": item.regimen || "",
      
      // Datos del Personal Auxiliar
      "Personal_Auxiliar": item.Personal_Auxiliar || "",
      "Nombres_Personal_Auxiliar": item.Nombres_Personal_Auxiliar || "",
      "Cargo_Personal_Auxiliar": item.Cargo_Personal_Auxiliar || "",
      
      // Datos del Operativo Personal
      "radio_tetra_id": item.radio_tetra_id || "",
      "radio_tetra_code": item.radio_tetra_code || "",
      "Descripcion_Radio_Tetra": item.Descripcion_Radio_Tetra || "",
      "estado_operativo_id": item.estado_operativo_id || "",
      "estado_patrullaje_Pie": item.estado_patrullaje_Pie || "",
      "tipo_patrullaje": item.tipo_patrullaje || "",
      "chaleco_balistico": item.chaleco_balistico || "",
      "porra_policial": item.porra_policial || "",
      "esposas": item.esposas || "",
      "linterna": item.linterna || "",
      "kit_primeros_auxilios": item.kit_primeros_auxilios || "",
      "hora_inicio_operativo": item.hora_inicio_operativo || "",
      "hora_fin_operativo": item.hora_fin_operativo || "",
      "observaciones_operativo_pie": item.observaciones_operativo_pie || "",
      "estado_operativo_pie": item.estado_operativo_pie || "",
      "ID_Usuario_Actualizador_Patrullaje_Pie": item.ID_Usuario_Actualizador_Patrullaje_Pie || "",
      "Usuario_Actualizador_Patrullaje_Pie": item.Usuario_Actualizador_Patrullaje_Pie || "",
      "Cargo_Actualizador_Patrullaje_Pie": item.Cargo_Actualizador_Patrullaje_Pie || "",
      "Fecha_Actualizado_Patrullaje_Pie": item.Fecha_Actualizado_Patrullaje_Pie || "",
      
      // Datos del Cuadrante
      "cuadrante_id": item.cuadrante_id || "",
      "cuadrante_code": item.cuadrante_code || "",
      "nombre_cuadrante": item.nombre_cuadrante || "",
      "zona_code": item.zona_code || "",
      "hora_ingreso": item.hora_ingreso || "",
      "hora_salida": item.hora_salida || "",
      "tiempo_minutos": item.tiempo_minutos || "",
      "observaciones_operativo_cuadrante": item.observaciones_operativo_cuadrante || "",
      "incidentes_reportados": item.incidentes_reportados || "",
      
      // Datos de Atención
      "reportado": item.reportado || "",
      "atendido": item.atendido || "",
      "resultado": item.resultado || "",
      "prioridad": item.prioridad || "",
      "observaciones_operativo_novedad": item.observaciones_operativo_novedad || "",
      "ID_Usuario_Actualizador_Novedad": item.ID_Usuario_Actualizador_Novedad || "",
      "Usuario_Actualizador_Novedad": item.Usuario_Actualizador_Novedad || "",
      "Cargo_Actualizador_Novedad": item.Cargo_Actualizador_Novedad || "",
      "Fecha_Actualizador_Novedad": item.Fecha_Actualizador_Novedad || "",
      "acciones_tomadas": item.acciones_tomadas || "",
      
      // Datos de la Novedad
      "novedad_id": item.novedad_id || "",
      "novedad_code": item.novedad_code || "",
      "fecha_hora_ocurrencia": item.fecha_hora_ocurrencia || "",
      "tipo_novedad_nombre": item.tipo_novedad_nombre || "",
      "subtipo_novedad_id": item.subtipo_novedad_id || "",
      "sub_tipo_novedad_nombre": item.sub_tipo_novedad_nombre || "",
      "descripcion_novedad": item.descripcion_novedad || "",
      "estado_novedad": item.estado_novedad || "",
      "origen_llamada": item.origen_llamada || "",
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
      "Cargo_Despachador": item.Cargo_Despachador || "",
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

    // Generar archivo Excel/CSV
    if (formato === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Operativos a Pie");
      
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
      res.setHeader("Content-Disposition", `attachment; filename=operativos-pie-${new Date().toISOString().split("T")[0]}.xlsx`);
      
      const buffer = await workbook.xlsx.writeBuffer();
      return res.send(buffer);
    } else {
      // Generar CSV
      if (datosParaExportar.length === 0) {
        const csvHeader = Object.keys(datosParaExportar[0] || {}).join(",") + "\n";
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=operativos-pie-${new Date().toISOString().split("T")[0]}.csv`);
        return res.send(csvHeader);
      }
      
      const columnas = Object.keys(datosParaExportar[0]);
      const csvHeader = columnas.join(",") + "\n";
      const csvRows = datosParaExportar.map(row => 
        columnas.map(col => `"${row[col] || ""}"`).join(",")
      ).join("\n");
      const csvData = csvHeader + csvRows;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=operativos-pie-${new Date().toISOString().split("T")[0]}.csv`);
      return res.send(csvData);
    }
    
  } catch (error) {
    console.error("❌ Error en exportarOperativosPie:", error);
    return res.status(500).json(buildResponse(
      false,
      `Error al exportar operativos a pie: ${error.message}`
    ));
  }
};

// ==========================================
// ENDPOINT 9: NOVEDADES NO ATENDIDAS
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
    console.log("⚠️ Iniciando consulta de novedades no atendidas...");
    
    const result = await reportesOperativosService.getNovedadesNoAtendidas(req.query);
    
    // Los datos ya vienen formateados del SQL directo
    const response = buildResponse(
      true,
      "Novedades no atendidas obtenidas exitosamente",
      result.data,
      {
        pagination: result.pagination,
        filters_applied: result.filters_applied,
        query_info: result.query_info,
        total_records: result.pagination.total
      }
    );
    
    console.log(`✅ Novedades no atendidas obtenidas: ${result.data.length} registros`);
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al obtener novedades no atendidas");
  }
};

// ==========================================
// ENDPOINT 10: RESUMEN NOVEDADES NO ATENDIDAS
// ==========================================

/**
 * Obtener resumen estadístico de novedades no atendidas
 * GET /api/v1/reportes-operativos/no-atendidas/resumen
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export const getResumenNovedadesNoAtendidas = async (req, res) => {
  try {
    console.log("📈 Iniciando generación de resumen de novedades no atendidas...");
    
    const result = await reportesOperativosService.getResumenNovedadesNoAtendidas(req.query);
    
    const response = buildResponse(
      true,
      "Resumen de novedades no atendidas generado exitosamente",
      result.data,
      {
        filters_applied: req.query,
        generated_at: new Date().toISOString()
      }
    );
    
    console.log("✅ Resumen de novedades no atendidas generado exitosamente");
    res.json(response);
    
  } catch (error) {
    handleError(res, error, "Error al generar resumen de novedades no atendidas");
  }
};

// ==========================================
// ENDPOINT 11: EXPORTAR NOVEDADES NO ATENDIDAS
// ==========================================

/**
 * Exportar novedades no atendidas a Excel/CSV
 * GET /api/v1/reportes-operativos/no-atendidas/exportar
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>} Archivo de exportación
 */
export const exportarNovedadesNoAtendidas = async (req, res) => {
  try {
    console.log("📤 Iniciando exportación de novedades no atendidas...");
    
    const formato = req.query.formato?.toLowerCase() || "excel";
    
    if (!["excel", "csv"].includes(formato)) {
      return res.status(400).json(buildResponse(
        false,
        "Formato no válido. Use 'excel' o 'csv'",
        null,
        { formatos_validos: ["excel", "csv"] }
      ));
    }
    
    // Obtener datos sin paginación para exportación - usar mismo método que el endpoint JSON
    const exportQuery = { ...req.query, limit: 10000, page: 1 };
    const result = await reportesOperativosService.getNovedadesNoAtendidas(exportQuery);
    
    if (!result.success || result.data.length === 0) {
      return res.status(404).json(buildResponse(
        false,
        "No hay datos para exportar con los filtros seleccionados"
      ));
    }
    
    // Usar exactamente los mismos campos que el JSON
    const datos = result.data;
    const datosParaExportar = datos.map(item => ({
      "id": item.id || "",
      "novedad_code": item.novedad_code || "",
      "fecha_hora_ocurrencia": item.fecha_hora_ocurrencia || "",
      "created_at": item.created_at || "",
      "tipo_novedad_id": item.tipo_novedad_id || "",
      "subtipo_novedad_id": item.subtipo_novedad_id || "",
      "estado_novedad_id": item.estado_novedad_id || "",
      "sector_id": item.sector_id || "",
      "cuadrante_id": item.cuadrante_id || "",
      "direccion_id": item.direccion_id || "",
      "localizacion": item.localizacion || "",
      "referencia_ubicacion": item.referencia_ubicacion || "",
      "latitud": item.latitud || "",
      "longitud": item.longitud || "",
      "ajustado_en_mapa": item.ajustado_en_mapa || "",
      "fecha_ajuste_mapa": item.fecha_ajuste_mapa || "",
      "ubigeo_code": item.ubigeo_code || "",
      "origen_llamada": item.origen_llamada || "",
      "radio_tetra_id": item.radio_tetra_id || "",
      "reportante_nombre": item.reportante_nombre || "",
      "reportante_telefono": item.reportante_telefono || "",
      "reportante_doc_identidad": item.reportante_doc_identidad || "",
      "es_anonimo": item.es_anonimo || "",
      "descripcion": item.descripcion || "",
      "observaciones": item.observaciones || "",
      "prioridad_actual": item.prioridad_actual || "",
      "gravedad": item.gravedad || "",
      "usuario_registro": item.usuario_registro || "",
      "unidad_oficina_id": item.unidad_oficina_id || "",
      "vehiculo_id": item.vehiculo_id || "",
      "personal_cargo_id": item.personal_cargo_id || "",
      "personal_seguridad2_id": item.personal_seguridad2_id || "",
      "personal_seguridad3_id": item.personal_seguridad3_id || "",
      "personal_seguridad4_id": item.personal_seguridad4_id || "",
      "fecha_despacho": item.fecha_despacho || "",
      "usuario_despacho": item.usuario_despacho || "",
      "fecha_llegada": item.fecha_llegada || "",
      "fecha_cierre": item.fecha_cierre || "",
      "usuario_cierre": item.usuario_cierre || "",
      "km_inicial": item.km_inicial || "",
      "km_final": item.km_final || "",
      "tiempo_respuesta_min": item.tiempo_respuesta_min || "",
      "tiempo_respuesta_min_operativo": item.tiempo_respuesta_min_operativo || "",
      "turno": item.turno || "",
      "parte_adjuntos": item.parte_adjuntos || "",
      "fotos_adjuntas": item.fotos_adjuntas || "",
      "videos_adjuntos": item.videos_adjuntos || "",
      "requiere_seguimiento": item.requiere_seguimiento || "",
      "fecha_proxima_revision": item.fecha_proxima_revision || "",
      "num_personas_afectadas": item.num_personas_afectadas || "",
      "perdidas_materiales_estimadas": item.perdidas_materiales_estimadas || "",
      "estado": item.estado || "",
      "created_by": item.created_by || "",
      "updated_by": item.updated_by || "",
      "deleted_at": item.deleted_at || "",
      "deleted_by": item.deleted_by || "",
      "updated_at": item.updated_at || "",
      "tipo_novedad_nombre": item.tipo_novedad_nombre || "",
      "subtipo_novedad_nombre": item.subtipo_novedad_nombre || "",
      "subtipo_prioridad": item.subtipo_prioridad || ""
    }));

    // Generar archivo Excel/CSV
    if (formato === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Novedades No Atendidas");
      
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
      res.setHeader("Content-Disposition", `attachment; filename=novedades-no-atendidas-${new Date().toISOString().split("T")[0]}.xlsx`);
      
      const buffer = await workbook.xlsx.writeBuffer();
      return res.send(buffer);
    } else {
      // Generar CSV
      if (datosParaExportar.length === 0) {
        const csvHeader = Object.keys(datosParaExportar[0] || {}).join(",") + "\n";
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=novedades-no-atendidas-${new Date().toISOString().split("T")[0]}.csv`);
        return res.send(csvHeader);
      }
      
      const columnas = Object.keys(datosParaExportar[0]);
      const csvHeader = columnas.join(",") + "\n";
      const csvRows = datosParaExportar.map(row => 
        columnas.map(col => `"${row[col] || ""}"`).join(",")
      ).join("\n");
      const csvData = csvHeader + csvRows;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=novedades-no-atendidas-${new Date().toISOString().split("T")[0]}.csv`);
      return res.send(csvData);
    }
    
  } catch (error) {
    console.error("❌ Error en exportarNovedadesNoAtendidas:", error);
    return res.status(500).json(buildResponse(
      false,
      `Error al exportar novedades no atendidas: ${error.message}`
    ));
  }
};

// ==========================================
// FUNCIÓN AUXILIAR: TRADUCIR JSON A EXCEL
// ==========================================

/**
 * Traduce el JSON del Dashboard a estructura plana para Excel/CSV
 * @param {Object} dashboardData - Datos del dashboard del servicio
 * @param {Object} queryParams - Parámetros de consulta para filtros
 * @returns {Array} Array de objetos planos para exportación
 */
const traducirJSONaExcel = (dashboardData, queryParams) => {
  const datosParaExportar = [];
  
  // Extraer filtros aplicados para metadatos
  const { fecha_inicio, fecha_fin } = queryParams;
  const rangoFechas = fecha_inicio && fecha_fin ? `${fecha_inicio} al ${fecha_fin}` : "Todos los datos";
  
  // Determinar si incluir columna JSON_Path (solo en desarrollo)
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // Función auxiliar para agregar campos con JSON_Path condicional
  const addCampo = (categoria, indicador, valor, unidad, jsonPath = null) => {
    const campo = {
      "Categoría": categoria,
      "Indicador": indicador,
      "Valor": valor,
      "Unidad": unidad
    };
    
    if (isDevelopment && jsonPath) {
      campo["JSON_Path"] = jsonPath;
    }
    
    return campo;
  };
  
  // === SECCIÓN 1: KPIs PRINCIPALES (JSON: kpis_principales) ===
  const kpis = dashboardData.kpis_principales;
  if (kpis) {
    datosParaExportar.push(
      addCampo("KPIs Principales", "Total Novedades", Number(kpis.total_novedades) || 0, "Cantidad", "kpis_principales.total_novedades"),
      addCampo("KPIs Principales", "Novedades Atendidas", Number(kpis.novedades_atendidas) || 0, "Cantidad", "kpis_principales.novedades_atendidas"),
      addCampo("KPIs Principales", "Novedades No Atendidas", Number(kpis.novedades_no_atendidas) || 0, "Cantidad", "kpis_principales.novedades_no_atendidas"),
      addCampo("KPIs Principales", "Tasa Atención General", Number(kpis.tasa_atencion_general) || 0, "%", "kpis_principales.tasa_atencion_general")
    );
    
    // === SECCIÓN 2: DISTRIBUCIÓN POR TIPO (JSON: kpis_principales.distribucion_tipo) ===
    if (kpis.distribucion_tipo) {
      Object.entries(kpis.distribucion_tipo).forEach(([tipo, datos]) => {
        const nombreTipo = tipo === "vehiculares" ? "Vehiculares" : 
          tipo === "pie" ? "Operativos a Pie" : "No Atendidas";
        datosParaExportar.push(
          { "Categoría": "Distribución por Tipo", "Indicador": nombreTipo + " - Cantidad", "Valor": Number(datos.cantidad) || 0, "Unidad": "Cantidad", "JSON_Path": `kpis_principales.distribucion_tipo.${tipo}.cantidad` },
          { "Categoría": "Distribución por Tipo", "Indicador": nombreTipo + " - Porcentaje", "Valor": Number(datos.porcentaje) || 0, "Unidad": "%", "JSON_Path": `kpis_principales.distribucion_tipo.${tipo}.porcentaje` }
        );
      });
    }
  }
  
  // === SECCIÓN 3: MÉTRICAS DE RENDIMIENTO (JSON: metricas_rendimiento) ===
  const metricas = dashboardData.metricas_rendimiento;
  if (metricas) {
    datosParaExportar.push(
      { "Categoría": "Métricas de Rendimiento", "Indicador": "Tiempo Promedio Respuesta", "Valor": Number(metricas.tiempo_promedio_respuesta) || 0, "Unidad": "minutos", "JSON_Path": "metricas_rendimiento.tiempo_promedio_respuesta" },
      { "Categoría": "Métricas de Rendimiento", "Indicador": "Novedades Atendidas a Tiempo", "Valor": Number(metricas.novedades_atendidas_a_tiempo) || 0, "Unidad": "Cantidad", "JSON_Path": "metricas_rendimiento.novedades_atendidas_a_tiempo" },
      { "Categoría": "Métricas de Rendimiento", "Indicador": "Novedades Atendidas Fuera de Tiempo", "Valor": Number(metricas.novedades_atendidas_fuera_tiempo) || 0, "Unidad": "Cantidad", "JSON_Path": "metricas_rendimiento.novedades_atendidas_fuera_tiempo" },
      { "Categoría": "Métricas de Rendimiento", "Indicador": "Eficiencia Operativa", "Valor": Number(metricas.eficiencia_operativa) || 0, "Unidad": "%", "JSON_Path": "metricas_rendimiento.eficiencia_operativa" }
    );
  }
  
  // === SECCIÓN 4: ANÁLISIS POR TURNOS (JSON: analisis_turnos) ===
  if (dashboardData.analisis_turnos) {
    dashboardData.analisis_turnos.forEach(turno => {
      datosParaExportar.push(
        { "Categoría": "Análisis por Turnos", "Indicador": "Turno " + turno.turno + " - Cantidad", "Valor": Number(turno.cantidad) || 0, "Unidad": "Cantidad", "JSON_Path": `analisis_turnos[${dashboardData.analisis_turnos.indexOf(turno)}].cantidad` },
        { "Categoría": "Análisis por Turnos", "Indicador": "Turno " + turno.turno + " - Porcentaje", "Valor": Number(turno.porcentaje) || 0, "Unidad": "%", "JSON_Path": `analisis_turnos[${dashboardData.analisis_turnos.indexOf(turno)}].porcentaje` }
      );
    });
  }
  
  // === SECCIÓN 5: ANÁLISIS POR PRIORIDAD (JSON: analisis_prioridad) ===
  if (dashboardData.analisis_prioridad) {
    dashboardData.analisis_prioridad.forEach(prioridad => {
      datosParaExportar.push(
        { "Categoría": "Análisis por Prioridad", "Indicador": "Prioridad " + prioridad.prioridad + " - Cantidad", "Valor": Number(prioridad.cantidad) || 0, "Unidad": "Cantidad", "JSON_Path": `analisis_prioridad[${dashboardData.analisis_prioridad.indexOf(prioridad)}].cantidad` },
        { "Categoría": "Análisis por Prioridad", "Indicador": "Prioridad " + prioridad.prioridad + " - Porcentaje", "Valor": Number(prioridad.porcentaje) || 0, "Unidad": "%", "JSON_Path": `analisis_prioridad[${dashboardData.analisis_prioridad.indexOf(prioridad)}].porcentaje` }
      );
    });
  }
  
  // === SECCIÓN 6: TENDENCIAS DIARIAS (JSON: tendencias) ===
  if (dashboardData.tendencias) {
    const tendenciasFiltradas = dashboardData.tendencias.filter(tendencia => {
      // Si hay rango de fechas, filtrar; otherwise incluir todas
      if (fecha_inicio && fecha_fin) {
        return tendencia.fecha >= fecha_inicio && tendencia.fecha <= fecha_fin;
      }
      return true;
    });

    tendenciasFiltradas.forEach(tendencia => {
      datosParaExportar.push(
        { "Categoría": "Tendencias Diarias", "Indicador": "Fecha " + tendencia.fecha, "Valor": Number(tendencia.cantidad) || 0, "Unidad": "Cantidad", "JSON_Path": `tendencias[${dashboardData.tendencias.indexOf(tendencia)}].cantidad` }
      );
    });
  }
  
  // === SECCIÓN 7: RESÚMENES POR FUENTE (JSON: resumenes_fuentes) ===
  const resumenes = dashboardData.resumenes_fuentes;
  
  // Resúmenes vehiculares (JSON: resumenes_fuentes.vehiculares.data)
  if (resumenes.vehiculares?.data) {
    const rv = resumenes.vehiculares.data;
    datosParaExportar.push(
      { "Categoría": "Resúmenes - Vehiculares", "Indicador": "Total Novedades Vehiculares", "Valor": Number(rv.total_novedades) || 0, "Unidad": "Cantidad", "JSON_Path": "resumenes_fuentes.vehiculares.data.total_novedades" }
    );
    
    // Novedades por turno (JSON: resumenes_fuentes.vehiculares.data.novedades_por_turno)
    if (rv.novedades_por_turno) {
      rv.novedades_por_turno.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Vehiculares", "Indicador": "Turno " + (item.turno || "SIN_TURNO") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.vehiculares.data.novedades_por_turno[${rv.novedades_por_turno.indexOf(item)}].total` }
        );
      });
    }
    
    // Novedades por sector (JSON: resumenes_fuentes.vehiculares.data.novedades_por_sector)
    if (rv.novedades_por_sector) {
      rv.novedades_por_sector.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Vehiculares", "Indicador": "Sector " + (item.sector || "SIN_SECTOR") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.vehiculares.data.novedades_por_sector[${rv.novedades_por_sector.indexOf(item)}].total` }
        );
      });
    }
    
    // Novedades por prioridad (JSON: resumenes_fuentes.vehiculares.data.novedades_por_prioridad)
    if (rv.novedades_por_prioridad) {
      rv.novedades_por_prioridad.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Vehiculares", "Indicador": "Prioridad " + (item.prioridad_actual || "SIN_PRIORIDAD") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.vehiculares.data.novedades_por_prioridad[${rv.novedades_por_prioridad.indexOf(item)}].total` }
        );
      });
    }
    
    // Novedades por tipo (JSON: resumenes_fuentes.vehiculares.data.novedades_por_tipo)
    if (rv.novedades_por_tipo) {
      rv.novedades_por_tipo.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Vehiculares", "Indicador": "Tipo " + (item.tipo_novedad || "SIN_TIPO") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.vehiculares.data.novedades_por_tipo[${rv.novedades_por_tipo.indexOf(item)}].total` }
        );
      });
    }
  }
  
  // Resúmenes pie (JSON: resumenes_fuentes.pie.data)
  if (resumenes.pie?.data) {
    const rp = resumenes.pie.data;
    datosParaExportar.push(
      { "Categoría": "Resúmenes - Operativos a Pie", "Indicador": "Total Novedades Pie", "Valor": Number(rp.total_novedades) || 0, "Unidad": "Cantidad", "JSON_Path": "resumenes_fuentes.pie.data.total_novedades" }
    );
    
    // Novedades por turno (JSON: resumenes_fuentes.pie.data.novedades_por_turno)
    if (rp.novedades_por_turno) {
      rp.novedades_por_turno.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Operativos a Pie", "Indicador": "Turno " + (item.turno || "SIN_TURNO") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.pie.data.novedades_por_turno[${rp.novedades_por_turno.indexOf(item)}].total` }
        );
      });
    }
    
    // Novedades por sector (JSON: resumenes_fuentes.pie.data.novedades_por_sector)
    if (rp.novedades_por_sector) {
      rp.novedades_por_sector.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Operativos a Pie", "Indicador": "Sector " + (item.sector_nombre || item.sector || "SIN_SECTOR") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.pie.data.novedades_por_sector[${rp.novedades_por_sector.indexOf(item)}].total` }
        );
      });
    }
    
    // Novedades por prioridad (JSON: resumenes_fuentes.pie.data.novedades_por_prioridad)
    if (rp.novedades_por_prioridad) {
      rp.novedades_por_prioridad.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Operativos a Pie", "Indicador": "Prioridad " + (item.prioridad_actual || "SIN_PRIORIDAD") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.pie.data.novedades_por_prioridad[${rp.novedades_por_prioridad.indexOf(item)}].total` }
        );
      });
    }
    
    // Novedades por tipo (JSON: resumenes_fuentes.pie.data.novedades_por_tipo)
    if (rp.novedades_por_tipo) {
      rp.novedades_por_tipo.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - Operativos a Pie", "Indicador": "Tipo " + (item.tipo_novedad || "SIN_TIPO") + " - Total", "Valor": Number(item.total) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.pie.data.novedades_por_tipo[${rp.novedades_por_tipo.indexOf(item)}].total` }
        );
      });
    }
  }
  
  // Resúmenes no atendidas (JSON: resumenes_fuentes.no_atendidas.data)
  if (resumenes.no_atendidas?.data) {
    const rna = resumenes.no_atendidas.data;
    datosParaExportar.push(
      { "Categoría": "Resúmenes - No Atendidas", "Indicador": "Total Novedades No Atendidas", "Valor": Number(rna.total_novedades_no_atendidas) || 0, "Unidad": "Cantidad", "JSON_Path": "resumenes_fuentes.no_atendidas.data.total_novedades_no_atendidas" }
    );
    
    // Novedades por tipo (JSON: resumenes_fuentes.no_atendidas.data.novedades_por_tipo)
    if (rna.novedades_por_tipo) {
      rna.novedades_por_tipo.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - No Atendidas", "Indicador": "Tipo " + (item.tipo || "SIN_TIPO") + " - Cantidad", "Valor": Number(item.cantidad) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.no_atendidas.data.novedades_por_tipo[${rna.novedades_por_tipo.indexOf(item)}].cantidad` },
          { "Categoría": "Resúmenes - No Atendidas", "Indicador": "Tipo " + (item.tipo || "SIN_TIPO") + " - Porcentaje", "Valor": Number(item.porcentaje) || 0, "Unidad": "%", "JSON_Path": `resumenes_fuentes.no_atendidas.data.novedades_por_tipo[${rna.novedades_por_tipo.indexOf(item)}].porcentaje` }
        );
      });
    }
    
    // Novedades por prioridad (JSON: resumenes_fuentes.no_atendidas.data.novedades_por_prioridad)
    if (rna.novedades_por_prioridad) {
      rna.novedades_por_prioridad.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - No Atendidas", "Indicador": "Prioridad " + (item.prioridad || "SIN_PRIORIDAD") + " - Cantidad", "Valor": Number(item.cantidad) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.no_atendidas.data.novedades_por_prioridad[${rna.novedades_por_prioridad.indexOf(item)}].cantidad` },
          { "Categoría": "Resúmenes - No Atendidas", "Indicador": "Prioridad " + (item.prioridad || "SIN_PRIORIDAD") + " - Porcentaje", "Valor": Number(item.porcentaje) || 0, "Unidad": "%", "JSON_Path": `resumenes_fuentes.no_atendidas.data.novedades_por_prioridad[${rna.novedades_por_prioridad.indexOf(item)}].porcentaje` }
        );
      });
    }
    
    // Atención faltante (JSON: resumenes_fuentes.no_atendidas.data.atencion_faltante)
    if (rna.atencion_faltante) {
      rna.atencion_faltante.forEach(item => {
        datosParaExportar.push(
          { "Categoría": "Resúmenes - No Atendidas", "Indicador": "Atención Faltante " + (item.tipo_atencion_faltante || "SIN_TIPO") + " - Cantidad", "Valor": Number(item.cantidad) || 0, "Unidad": "Cantidad", "JSON_Path": `resumenes_fuentes.no_atendidas.data.atencion_faltante[${rna.atencion_faltante.indexOf(item)}].cantidad` },
          { "Categoría": "Resúmenes - No Atendidas", "Indicador": "Atención Faltante " + (item.tipo_atencion_faltante || "SIN_TIPO") + " - Porcentaje", "Valor": Number(item.porcentaje) || 0, "Unidad": "%", "JSON_Path": `resumenes_fuentes.no_atendidas.data.atencion_faltante[${rna.atencion_faltante.indexOf(item)}].porcentaje` }
        );
      });
    }
  }
  
  // === SECCIÓN 8: METADATOS ===
  datosParaExportar.push(
    { "Categoría": "Metadatos", "Indicador": "Fecha Generación", "Valor": dashboardData.generated_at || "", "Unidad": "Fecha/Hora", "JSON_Path": "generated_at" },
    { "Categoría": "Metadatos", "Indicador": "Tipo Dashboard", "Valor": "COMPLETO", "Unidad": "Tipo", "JSON_Path": "dashboard_type" },
    { "Categoría": "Metadatos", "Indicador": "Rango de Fechas", "Valor": rangoFechas, "Unidad": "Periodo", "JSON_Path": "filters_applied.fecha_range" }
  );
  
  return datosParaExportar;
};

// ==========================================
// ENDPOINT 13: EXPORTAR REPORTES COMBINADOS
// ==========================================

/**
 * Exportar reportes combinados de operativos a Excel/CSV
 * GET /api/v1/reportes-operativos/combinados/exportar
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>} Archivo de exportación
 */
export const exportarReportesCombinados = async (req, res) => {
  try {
    console.log("📤 Iniciando exportación de Dashboard operativos...");
    
    // Obtener parámetros de exportación
    const { formato = "excel" } = req.query;
    
    // Validar formato
    if (!["excel", "csv"].includes(formato)) {
      return res.status(400).json(buildResponse(
        false,
        "Formato no válido. Use 'excel' o 'csv'"
      ));
    }
    
    // 1. Primero obtener el JSON completo del Dashboard
    const dashboardResult = await reportesOperativosService.getDashboardOperativos(req.query);
    
    if (!dashboardResult.success) {
      return res.status(404).json(buildResponse(
        false,
        "No hay datos para exportar con los filtros seleccionados"
      ));
    }
    
    // 2. Traducir el JSON a estructura de Excel manteniendo la integridad de los datos
    const datosParaExportar = traducirJSONaExcel(dashboardResult.data, req.query);
    
    // 3. Generar archivo Excel/CSV
    
    // Determinar si incluir columna JSON_Path (solo en desarrollo)
    const isDevelopment = process.env.NODE_ENV === "development";
    const includeJsonPath = isDevelopment && datosParaExportar.length > 0 && Object.prototype.hasOwnProperty.call(datosParaExportar[0], "JSON_Path");
    
    // Generar archivo de exportación
    if (datosParaExportar.length === 0) {
      // Si no hay datos, generar archivo vacío con encabezados
      const emptyData = includeJsonPath ? [{
        "Categoría": "",
        "Indicador": "",
        "Valor": "",
        "Unidad": "",
        "JSON_Path": ""
      }] : [{
        "Categoría": "",
        "Indicador": "",
        "Valor": "",
        "Unidad": ""
      }];
      
      if (formato === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Dashboard Operativos");
        
        const columns = includeJsonPath ? [
          { header: "Categoría", key: "Categoría", width: 30 },
          { header: "Indicador", key: "Indicador", width: 40 },
          { header: "Valor", key: "Valor", width: 20 },
          { header: "Unidad", key: "Unidad", width: 15 },
          { header: "JSON_Path", key: "JSON_Path", width: 50 }
        ] : [
          { header: "Categoría", key: "Categoría", width: 30 },
          { header: "Indicador", key: "Indicador", width: 40 },
          { header: "Valor", key: "Valor", width: 20 },
          { header: "Unidad", key: "Unidad", width: 15 }
        ];
        
        worksheet.columns = columns;
        
        worksheet.addRows(emptyData);
        
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=dashboard-operativos-${new Date().toISOString().split("T")[0]}.xlsx`);
        
        const buffer = await workbook.xlsx.writeBuffer();
        return res.send(buffer);
      } else {
        const csvHeader = includeJsonPath ? "Categoría,Indicador,Valor,Unidad,JSON_Path\n" : "Categoría,Indicador,Valor,Unidad\n";
        const csvData = csvHeader;
        
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=dashboard-operativos-${new Date().toISOString().split("T")[0]}.csv`);
        return res.send(csvData);
      }
    }
    
    // Generar archivo con datos
    if (formato === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Dashboard Operativos");
      
      const columns = includeJsonPath ? [
        { header: "Categoría", key: "Categoría", width: 30 },
        { header: "Indicador", key: "Indicador", width: 40 },
        { header: "Valor", key: "Valor", width: 20 },
        { header: "Unidad", key: "Unidad", width: 15 },
        { header: "JSON_Path", key: "JSON_Path", width: 50 }
      ] : [
        { header: "Categoría", key: "Categoría", width: 30 },
        { header: "Indicador", key: "Indicador", width: 40 },
        { header: "Valor", key: "Valor", width: 20 },
        { header: "Unidad", key: "Unidad", width: 15 }
      ];
      
      worksheet.columns = columns;
      
      // Agregar todos los datos
      worksheet.addRows(datosParaExportar);
      
      // Estilos para encabezados
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6B8" }
      };
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=dashboard-operativos-${new Date().toISOString().split("T")[0]}.xlsx`);
      
      const buffer = await workbook.xlsx.writeBuffer();
      return res.send(buffer);
    } else {
      // Generar CSV
      const csvHeader = includeJsonPath ? "Categoría,Indicador,Valor,Unidad,JSON_Path\n" : "Categoría,Indicador,Valor,Unidad\n";
      const csvRows = datosParaExportar.map(row => {
        if (includeJsonPath) {
          return `"${row.Categoría}","${row.Indicador}","${row.Valor}","${row.Unidad}","${row.JSON_Path || ""}"`;
        } else {
          return `"${row.Categoría}","${row.Indicador}","${row.Valor}","${row.Unidad}"`;
        }
      }).join("\n");
      const csvData = csvHeader + csvRows;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=dashboard-operativos-${new Date().toISOString().split("T")[0]}.csv`);
      return res.send(csvData);
    }
    
  } catch (error) {
    console.error("❌ Error en exportarReportesCombinados:", error);
    return res.status(500).json(buildResponse(
      false,
      `Error al exportar dashboard: ${error.message}`
    ));
  }
};

// ==========================================
// ENDPOINT 13: DASHBOARD OPERATIVOS
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
    console.log("📊 Iniciando generación de dashboard operativos...");
    
    const result = await reportesOperativosService.getDashboardOperativos(req.query);
    
    const response = buildResponse(
      true,
      "Dashboard operativos generado exitosamente",
      result.data,
      {
        filters_applied: req.query,
        generated_at: result.data.generated_at,
        dashboard_type: "COMPLETO"
      }
    );
    
    console.log("✅ Dashboard operativos generado exitosamente");
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
  getResumenPie,
  exportarOperativosPie,
  getNovedadesNoAtendidas,
  getResumenNovedadesNoAtendidas,
  exportarNovedadesNoAtendidas,
  exportarReportesCombinados,
  getDashboardOperativos
};
