/**
 * ===================================================
 * RUTAS: Reportes Operativos
 * ===================================================
 *
 * Ruta: src/routes/reportes-operativos.routes.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-04-23
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Creación inicial de rutas para reportes
 * ✅ Validaciones centralizadas
 * ✅ Headers profesionales
 * ✅ Documentación completa
 * ✅ Middleware de autenticación y permisos
 *
 * Descripción:
 * Define endpoints REST para gestión de reportes de operativos de patrullaje.
 * Implementa endpoints para operativos vehiculares, a pie y novedades.
 *
 * Endpoints (Fase 1 - Operativos Vehiculares):
 * - GET    /reportes-operativos/vehiculares - Listar operativos vehiculares
 * - GET    /reportes-operativos/vehiculares/resumen - Resumen estadístico
 * - GET    /reportes-operativos/vehiculares/exportar - Exportar datos
 * - GET    /reportes-operativos/vehiculares/estadisticas - Estadísticas avanzadas
 * - GET    /reportes-operativos/vehiculares/metrics - Métricas de performance
 *
 * @module routes/reportes-operativos
 * @version 1.0.0
 * @date 2026-04-23
 */

import express from "express";
const router = express.Router();
import reportesOperativosController from "../controllers/reportesOperativosController.js";
import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

import {
  validateReportesOperativosVehiculares,
  validateResumenVehicular,
  validateExportarVehicular,
  validateEstadisticasVehiculares,
  validateMetricsVehiculares,
  validateReportesOperativosPie,
  validateNovedadesNoAtendidas,
} from "../validators/reportesOperativos.validator.js";

// ==========================================
// ENDPOINTS FASE 1: OPERATIVOS VEHICULARES
// ==========================================

/**
 * GET /api/v1/reportes-operativos/vehiculares
 * Obtener todos los operativos vehiculares con novedades atendidas
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} vehiculo_id - ID del vehículo [opcional]
 * @query {number} conductor_id - ID del conductor [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {number} page - Número de página (default: 1, min: 1) [opcional]
 * @query {number} limit - Límite de resultados (default: 50, max: 1000) [opcional]
 * @query {string} sort - Campo de ordenamiento [opcional]
 * @query {string} order - Dirección ASC/DESC (default: DESC) [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read
 */
router.get(
  "/vehiculares",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta"],
    ["reportes.operativos_vehiculares.read"]
  ),
  validateReportesOperativosVehiculares,
  reportesOperativosController.getOperativosVehiculares
);

/**
 * GET /api/v1/reportes-operativos/vehiculares/resumen
 * Obtener resumen estadístico de operativos vehiculares
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read, operativos.vehiculares.read
 */
router.get(
  "/vehiculares/resumen",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta"],
    ["reportes.operativos_vehiculares.read"]
  ),
  validateResumenVehicular,
  reportesOperativosController.getResumenVehicular
);

/**
 * GET /api/v1/reportes-operativos/vehiculares/exportar
 * Exportar operativos vehiculares a Excel o CSV
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} vehiculo_id - ID del vehículo [opcional]
 * @query {number} conductor_id - ID del conductor [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {string} formato - Formato de exportación (excel, csv) [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor
 * @permissions reportes.operativos_vehiculares.export
 */
router.get(
  "/vehiculares/exportar",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor"],
    ["reportes.operativos_vehiculares.export"]
  ),
  validateExportarVehicular,
  reportesOperativosController.exportarOperativosVehiculares
);

/**
 * GET /api/v1/reportes-operativos/vehiculares/estadisticas
 * Obtener estadísticas avanzadas de operativos vehiculares
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read, operativos.vehiculares.read
 */
router.get(
  "/vehiculares/estadisticas",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta"],
    ["reportes.operativos_vehiculares.read"]
  ),
  validateEstadisticasVehiculares,
  reportesOperativosController.getEstadisticasVehiculares
);

/**
 * GET /api/v1/reportes-operativos/vehiculares/metrics
 * Obtener métricas de performance del sistema
 * 
 * @access Private
 * @roles super_admin, admin, supervisor
 * @permissions system.metrics.read
 */
router.get(
  "/vehiculares/metrics",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor"],
    ["system.metrics.read"]
  ),
  validateMetricsVehiculares,
  reportesOperativosController.getMetricsVehiculares
);

// ==========================================
// ENDPOINTS FASE 2: OPERATIVOS A PIE (PREPARACIÓN)
// ==========================================

/**
 * GET /api/v1/reportes-operativos/pie
 * Obtener operativos a pie con novedades atendidas
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} personal_id - ID del personal [opcional]
 * @query {number} cuadrante_id - ID del cuadrante [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {number} page - Número de página (default: 1, min: 1) [opcional]
 * @query {number} limit - Límite de resultados (default: 50, max: 1000) [opcional]
 * @query {string} sort - Campo de ordenamiento [opcional]
 * @query {string} order - Dirección ASC/DESC (default: DESC) [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read, operativos.personal.read
 */
router.get(
  "/pie",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta"],
    ["reportes.operativos_personales.read"]
  ),
  validateReportesOperativosPie,
  reportesOperativosController.getOperativosPie
);

/**
 * GET /api/v1/reportes-operativos/pie/resumen
 * Obtener resumen estadístico de operativos a pie
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read, operativos.personal.read
 */

// ==========================================
// ENDPOINTS FASE 3: NOVEDADES NO ATENDIDAS (PREPARACIÓN)
// ==========================================

/**
 * GET /api/v1/reportes-operativos/no-atendidas
 * Obtener novedades no atendidas por ningún operativo (vehicular o a pie)
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} page - Número de página (default: 1, min: 1) [opcional]
 * @query {number} limit - Límite de resultados (default: 50, max: 1000) [opcional]
 * @query {string} sort - Campo de ordenamiento [opcional]
 * @query {string} order - Dirección ASC/DESC (default: DESC) [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read, novedades.read
 */
router.get(
  "/no-atendidas",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta"],
    ["reportes.novedades_no_atendidas.read"]
  ),
  validateNovedadesNoAtendidas,
  reportesOperativosController.getNovedadesNoAtendidas
);

/**
 * GET /api/v1/reportes-operativos/no-atendidas/resumen
 * Obtener resumen estadístico de novedades no atendidas
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read, novedades.read
 */

// ==========================================
// ENDPOINTS FASE 4: REPORTES COMBINADOS (PREPARACIÓN)
// ==========================================

/**
 * GET /api/v1/reportes-operativos/combinados
 * Obtener reportes combinados de operativos (vehiculares + a pie + no atendidas)
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} vehiculo_id - ID del vehículo [opcional]
 * @query {number} personal_id - ID del personal [opcional]
 * @query {number} cuadrante_id - ID del cuadrante [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {number} page - Número de página (default: 1, min: 1) [opcional]
 * @query {number} limit - Límite de resultados (default: 50, max: 1000) [opcional]
 * @query {string} sort - Campo de ordenamiento [opcional]
 * @query {string} order - Dirección ASC/DESC (default: DESC) [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read
 */
router.get(
  "/combinados",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta"],
    ["reportes.operativos_dashboard.read"]
  ),
  validateReportesOperativosVehiculares, // Reutilizamos validadores completos
  reportesOperativosController.getDashboardOperativos
);

/**
 * GET /api/v1/reportes-operativos/dashboard
 * Obtener dashboard con KPIs integrados de todos los operativos
 * 
 * @query {string} fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD) [opcional]
 * @query {string} fecha_fin - Fecha de fin del rango (YYYY-MM-DD) [opcional]
 * @query {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE) [opcional]
 * @query {number} sector_id - ID del sector [opcional]
 * @query {number} estado_novedad - Estado de la novedad (0,1) [opcional]
 * @query {string} prioridad - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA) [opcional]
 * @query {number} tipo_novedad_id - ID del tipo de novedad [opcional]
 * @query {boolean} include_deleted - Incluir eliminados (default: false) [opcional]
 * 
 * @access Private
 * @roles super_admin, admin, supervisor, operador, consulta
 * @permissions operativos.reportes.read
 */
router.get(
  "/dashboard",
  verificarToken,
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta"],
    ["reportes.operativos_dashboard.read"]
  ),
  validateResumenVehicular, // Reutilizamos validadores básicos
  reportesOperativosController.getDashboardOperativos
);

// ==========================================
// ENDPOINTS DE SALUD Y ESTADO
// ==========================================

/**
 * GET /api/v1/reportes-operativos/health
 * Verificar estado del servicio de reportes
 * 
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Servicio de reportes operativos funcionando correctamente",
    service: "reportes-operativos",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints_implemented: {
      vehiculares: "active",
      vehiculares_resumen: "active",
      vehiculares_exportar: "active",
      vehiculares_estadisticas: "active",
      vehiculares_metrics: "active",
      pie: "active",
      no_atendidas: "active",
      dashboard: "active"
    }
  });
});

// ==========================================
// EXPORTACIÓN
// ==========================================

export default router;
