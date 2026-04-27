/**
 * ===================================================
 * VALIDADORES: Reportes Operativos
 * ===================================================
 *
 * Ruta: src/validators/reportesOperativos.validator.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-04-23
 *
 * Descripción:
 * Validadores centralizados y reutilizables para el módulo de Reportes Operativos.
 * Utiliza express-validator para validaciones robustas y mensajes claros.
 *
 * Características:
 * - Validadores atómicos reutilizables
 * - Validadores compuestos por endpoint
 * - Mensajes de error descriptivos
 * - Validaciones de negocio específicas
 * - Manejo centralizado de errores
 *
 * @author Windsurf AI
 * @supervisor Romily Oaks
 * @version 1.0.0
 */

import { body, param, query, validationResult } from "express-validator";

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

/**
 * Manejo centralizado de errores de validación
 * Formatea los errores en un formato consistente
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      campo: error.path || error.param,
      mensaje: error.msg,
      valor: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// ==========================================
// VALIDADORES ATÓMICOS REUTILIZABLES
// ==========================================

/**
 * Validador para parámetro de turno
 */
export const validateTurno = query("turno")
  .optional()
  .isIn(["MAÑANA", "TARDE", "NOCHE"])
  .withMessage("El turno debe ser uno de: MAÑANA, TARDE, NOCHE");

/**
 * Validador para fecha de inicio
 */
export const validateFechaInicio = query("fecha_inicio")
  .optional()
  .isISO8601()
  .withMessage("La fecha de inicio debe tener formato ISO8601 (YYYY-MM-DD)")
  .custom((value) => {
    const fecha = new Date(value);
    const hoy = new Date();
    if (fecha > hoy) {
      throw new Error("La fecha de inicio no puede ser futura");
    }
    return true;
  });

/**
 * Validador para fecha de fin
 */
export const validateFechaFin = query("fecha_fin")
  .optional()
  .isISO8601()
  .withMessage("La fecha de fin debe tener formato ISO8601 (YYYY-MM-DD)")
  .custom((value, { req }) => {
    if (req.query.fecha_inicio) {
      const fechaInicio = new Date(req.query.fecha_inicio);
      const fechaFin = new Date(value);
      
      if (fechaFin < fechaInicio) {
        throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
      }
      
      // Validar que el rango no sea mayor a 90 días
      const diffDays = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        throw new Error("El rango de fechas no puede superar los 90 días");
      }
    }
    return true;
  });

/**
 * Validador para sector_id
 */
export const validateSectorId = query("sector_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("El ID de sector debe ser un entero positivo");

/**
 * Validador para vehículo_id
 */
export const validateVehiculoId = query("vehiculo_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("El ID de vehículo debe ser un entero positivo");

/**
 * Validador para conductor_id
 */
export const validateConductorId = query("conductor_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("El ID de conductor debe ser un entero positivo");

/**
 * Validador para personal_id
 */
export const validatePersonalId = query("personal_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("El ID de personal debe ser un entero positivo");

/**
 * Validador para cuadrante_id
 */
export const validateCuadranteId = query("cuadrante_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("El ID de cuadrante debe ser un entero positivo");

/**
 * Validador para estado de novedad
 */
export const validateEstadoNovedad = query("estado_novedad")
  .optional()
  .isInt({ min: 0, max: 1 })
  .withMessage("El estado de novedad debe ser 0 (inactivo) o 1 (activo)");

/**
 * Validador para prioridad
 */
export const validatePrioridad = query("prioridad")
  .optional()
  .isIn(["BAJA", "MEDIA", "ALTA", "CRÍTICA"])
  .withMessage("La prioridad debe ser una de: BAJA, MEDIA, ALTA, CRÍTICA");

/**
 * Validador para tipo_novedad_id
 */
export const validateTipoNovedadId = query("tipo_novedad_id")
  .optional()
  .isInt({ min: 1 })
  .withMessage("El ID de tipo de novedad debe ser un entero positivo");

/**
 * Validador para página
 */
export const validatePage = query("page")
  .optional()
  .isInt({ min: 1 })
  .withMessage("La página debe ser un entero mayor o igual a 1");

/**
 * Validador para límite
 */
export const validateLimit = query("limit")
  .optional()
  .isInt({ min: 1, max: 1000 })
  .withMessage("El límite debe ser un entero entre 1 y 1000");

/**
 * Validador para campo de ordenamiento
 */
export const validateSort = query("sort")
  .optional()
  .isIn([
    "fecha_hora_ocurrencia",
    "fecha",
    "turno",
    "sector_code",
    "placa_vehiculo",
    "nombres_conductor",
    "novedad_code",
    "tipo_novedad_nombre",
    "prioridad_novedad",
    "tiempo_respuesta_min",
    "updated_at"
  ])
  .withMessage("El campo de ordenamiento no es válido");

/**
 * Validador para dirección de ordenamiento
 */
export const validateOrder = query("order")
  .optional()
  .isIn(["ASC", "DESC"])
  .withMessage("La dirección de ordenamiento debe ser ASC o DESC");

/**
 * Validador para formato de exportación
 */
export const validateFormato = query("formato")
  .optional()
  .isIn(["excel", "csv"])
  .withMessage("El formato debe ser 'excel' o 'csv'");

/**
 * Validador para include_deleted
 */
export const validateIncludeDeleted = query("include_deleted")
  .optional()
  .isBoolean()
  .withMessage("include_deleted debe ser un valor booleano");

// ==========================================
// VALIDADORES COMPUESTOS POR ENDPOINT
// ==========================================

/**
 * Validador principal para endpoints de reportes vehiculares
 */
export const validateReportesOperativosVehiculares = [
  validateFechaInicio,
  validateFechaFin,
  validateTurno,
  validateSectorId,
  validateVehiculoId,
  validateConductorId,
  validateEstadoNovedad,
  validatePrioridad,
  validateTipoNovedadId,
  validatePage,
  validateLimit,
  validateSort,
  validateOrder,
  validateIncludeDeleted,
  
  // Validación de negocio personalizada
  query().custom((value, { req }) => {
    // Validar que si se proporciona conductor_id, también se proporcione vehículo_id
    if (req.query.conductor_id && !req.query.vehiculo_id) {
      throw new Error("Si se especifica conductor_id, también debe especificarse vehículo_id");
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Validador para endpoint de resumen vehicular
 */
export const validateResumenVehicular = [
  validateFechaInicio,
  validateFechaFin,
  validateTurno,
  validateSectorId,
  validateEstadoNovedad,
  validatePrioridad,
  validateTipoNovedadId,
  validateIncludeDeleted,
  handleValidationErrors
];

/**
 * Validador para endpoint de exportación vehicular
 */
export const validateExportarVehicular = [
  validateFechaInicio,
  validateFechaFin,
  validateTurno,
  validateSectorId,
  validateVehiculoId,
  validateConductorId,
  validateEstadoNovedad,
  validatePrioridad,
  validateTipoNovedadId,
  validateFormato,
  validateIncludeDeleted,
  
  // Validación especial para exportación
  query().custom((value, { req }) => {
    // Para exportación, validar que el límite no sea demasiado grande
    const limit = parseInt(req.query.limit) || 1000;
    if (limit > 10000) {
      throw new Error("Para exportación, el límite máximo es de 10,000 registros");
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Validador para endpoint de estadísticas vehiculares
 */
export const validateEstadisticasVehiculares = [
  validateFechaInicio,
  validateFechaFin,
  validateTurno,
  validateSectorId,
  validateEstadoNovedad,
  validateIncludeDeleted,
  handleValidationErrors
];

/**
 * Validador para endpoint de métricas de performance
 */
export const validateMetricsVehiculares = [
  // No requiere filtros específicos, solo validación básica
  handleValidationErrors
];

// ==========================================
// VALIDADORES PARA OPERATIVOS A PIE (PREPARACIÓN FASE 2)
// ==========================================

/**
 * Validador para endpoints de operativos a pie
 */
export const validateReportesOperativosPie = [
  validateFechaInicio,
  validateFechaFin,
  validateTurno,
  validateSectorId,
  validatePersonalId,
  validateCuadranteId,
  validateEstadoNovedad,
  validatePrioridad,
  validateTipoNovedadId,
  validatePage,
  validateLimit,
  validateSort,
  validateOrder,
  validateIncludeDeleted,
  handleValidationErrors
];

/**
 * Validador para resumen de operativos a pie
 */
export const validateResumenPie = [
  validateFechaInicio,
  validateFechaFin,
  validateTurno,
  validateSectorId,
  validateEstadoNovedad,
  validatePrioridad,
  validateTipoNovedadId,
  validateIncludeDeleted,
  handleValidationErrors
];

// ==========================================
// VALIDADORES PARA NOVEDADES NO ATENDIDAS (PREPARACIÓN FASE 3)
// ==========================================

/**
 * Validador para novedades no atendidas
 */
export const validateNovedadesNoAtendidas = [
  validateFechaInicio,
  validateFechaFin,
  validateTipoNovedadId,
  validatePrioridad,
  validateSectorId,
  validatePage,
  validateLimit,
  validateSort,
  validateOrder,
  validateIncludeDeleted,
  handleValidationErrors
];

// ==========================================
// EXPORTACIÓN DE VALIDADORES
// ==========================================

export default {
  // Middleware de errores
  handleValidationErrors,
  
  // Validadores atómicos
  validateTurno,
  validateFechaInicio,
  validateFechaFin,
  validateSectorId,
  validateVehiculoId,
  validateConductorId,
  validatePersonalId,
  validateCuadranteId,
  validateEstadoNovedad,
  validatePrioridad,
  validateTipoNovedadId,
  validatePage,
  validateLimit,
  validateSort,
  validateOrder,
  validateFormato,
  validateIncludeDeleted,
  
  // Validadores compuestos - Vehiculares
  validateReportesOperativosVehiculares,
  validateResumenVehicular,
  validateExportarVehicular,
  validateEstadisticasVehiculares,
  validateMetricsVehiculares,
  
  // Validadores compuestos - Operativos a pie (Fase 2)
  validateReportesOperativosPie,
  validateResumenPie,
  
  // Validadores compuestos - Novedades no atendidas (Fase 3)
  validateNovedadesNoAtendidas
};
