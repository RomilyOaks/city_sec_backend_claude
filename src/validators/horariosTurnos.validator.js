/**
 * ===================================================
 * VALIDADORES: Horarios Turnos
 * ===================================================
 *
 * Ruta: src/validators/horariosTurnos.validator.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-20
 *
 * Descripción:
 * Validadores centralizados y reutilizables para el módulo de Horarios Turnos.
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
 * @date 2026-01-20
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
    }));

    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errores: formattedErrors,
    });
  }

  next();
};

// ==========================================
// VALIDADORES ATÓMICOS REUTILIZABLES
// ==========================================

/**
 * Validación del campo turno (ENUM)
 */
export const validateTurno = () =>
  body("turno")
    .isIn(["MAÑANA", "TARDE", "NOCHE"])
    .withMessage("El turno debe ser MAÑANA, TARDE o NOCHE")
    .notEmpty()
    .withMessage("El turno es obligatorio");

/**
 * Validación del campo hora_inicio (TIME)
 */
export const validateHoraInicio = () =>
  body("hora_inicio")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage("La hora de inicio debe tener formato HH:MM:SS (24 horas)")
    .notEmpty()
    .withMessage("La hora de inicio es obligatoria");

/**
 * Validación del campo hora_fin (TIME)
 */
export const validateHoraFin = () =>
  body("hora_fin")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage("La hora de fin debe tener formato HH:MM:SS (24 horas)")
    .notEmpty()
    .withMessage("La hora de fin es obligatoria");

/**
 * Validación del campo cruza_medianoche (BOOLEAN)
 */
export const validateCruzaMedianoche = () =>
  body("cruza_medianoche")
    .isBoolean()
    .withMessage("El campo cruza_medianoche debe ser true o false")
    .optional();

/**
 * Validación del campo estado (BOOLEAN)
 */
export const validateEstado = () =>
  body("estado")
    .isBoolean()
    .withMessage("El campo estado debe ser true o false")
    .optional();

/**
 * Validación del parámetro ID de turno
 */
export const validateTurnoId = () =>
  param("turno")
    .isIn(["MAÑANA", "TARDE", "NOCHE"])
    .withMessage("El ID de turno debe ser MAÑANA, TARDE o NOCHE");

/**
 * Validación del parámetro de consulta estado
 */
export const validateQueryEstado = () =>
  query("estado")
    .isIn(["0", "1", "true", "false"])
    .withMessage("El estado debe ser 0, 1, true o false")
    .optional();

// ==========================================
// VALIDADORES COMPUESTOS POR ENDPOINT
// ==========================================

/**
 * Validador para crear un nuevo horario de turno
 */
export const validateCreateHorarioTurno = [
  validateTurno(),
  validateHoraInicio(),
  validateHoraFin(),
  validateCruzaMedianoche(),
  
  // Validación de negocio: hora_fin debe ser posterior a hora_inicio si no cruza medianoche
  body().custom((value, { req }) => {
    const { hora_inicio, hora_fin, cruza_medianoche } = req.body;
    
    if (!cruza_medianoche && hora_fin <= hora_inicio) {
      throw new Error("La hora de fin debe ser posterior a la hora de inicio cuando no cruza medianoche");
    }
    
    return true;
  }),
  
  handleValidationErrors,
];

/**
 * Validador para actualizar un horario de turno
 */
export const validateUpdateHorarioTurno = [
  validateTurnoId(),
  validateHoraInicio().optional(),
  validateHoraFin().optional(),
  validateCruzaMedianoche().optional(),
  validateEstado().optional(),
  
  // Validación de negocio: si se actualizan las horas, validar consistencia
  body().custom((value, { req }) => {
    const { hora_inicio, hora_fin, cruza_medianoche } = req.body;
    
    // Solo validar si se proporcionan ambos campos de hora
    if (hora_inicio && hora_fin) {
      const cruza = cruza_medianoche === undefined ? true : cruza_medianoche;
      
      if (!cruza && hora_fin <= hora_inicio) {
        throw new Error("La hora de fin debe ser posterior a la hora de inicio cuando no cruza medianoche");
      }
    }
    
    return true;
  }),
  
  handleValidationErrors,
];

/**
 * Validador para obtener horarios con filtros
 */
export const validateGetHorariosTurnos = [
  validateQueryEstado(),
  
  // Validación de parámetros de paginación
  query("page")
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0")
    .optional(),
    
  query("limit")
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100")
    .optional(),
    
  handleValidationErrors,
];

/**
 * Validador para obtener un horario por ID
 */
export const validateGetHorarioTurnoById = [
  validateTurnoId(),
  handleValidationErrors,
];

/**
 * Validador para eliminar un horario (soft delete)
 */
export const validateDeleteHorarioTurno = [
  validateTurnoId(),
  handleValidationErrors,
];

/**
 * Validador para reactivar un horario eliminado
 */
export const validateReactivarHorarioTurno = [
  validateTurnoId(),
  handleValidationErrors,
];

/**
 * Validador para obtener el horario activo actual
 */
export const validateGetHorarioActivo = [
  // Validación opcional de timestamp para pruebas
  query("timestamp")
    .isISO8601()
    .withMessage("El timestamp debe estar en formato ISO8601")
    .optional(),
    
  handleValidationErrors,
];

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Convierte string de tiempo a minutos desde medianoche
 * @param {string} timeString - Tiempo en formato HH:MM:SS
 * @returns {number} Minutos desde medianoche
 */
export const timeToMinutes = (timeString) => {
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  return hours * 60 + minutes + seconds / 60;
};

/**
 * Verifica si un horario cruza medianoche basado en las horas
 * @param {string} horaInicio - Hora de inicio HH:MM:SS
 * @param {string} horaFin - Hora de fin HH:MM:SS
 * @returns {boolean} True si cruza medianoche
 */
export const cruzaMedianoche = (horaInicio, horaFin) => {
  const inicioMinutos = timeToMinutes(horaInicio);
  const finMinutos = timeToMinutes(horaFin);
  return finMinutos <= inicioMinutos;
};

/**
 * Valida si una hora está dentro de un rango de horario
 * @param {string} horaActual - Hora actual HH:MM:SS
 * @param {string} horaInicio - Hora de inicio HH:MM:SS
 * @param {string} horaFin - Hora de fin HH:MM:SS
 * @param {boolean} cruzaMedianoche - Si el horario cruza medianoche
 * @returns {boolean} True si la hora está en el rango
 */
export const isHoraEnRango = (horaActual, horaInicio, horaFin, cruzaMedianoche) => {
  const actualMinutos = timeToMinutes(horaActual);
  const inicioMinutos = timeToMinutes(horaInicio);
  const finMinutos = timeToMinutes(horaFin);
  
  if (cruzaMedianoche) {
    // Si cruza medianoche, el rango es inicio -> 23:59:59 y 00:00:00 -> fin
    return actualMinutos >= inicioMinutos || actualMinutos <= finMinutos;
  } else {
    // Rango normal
    return actualMinutos >= inicioMinutos && actualMinutos <= finMinutos;
  }
};
