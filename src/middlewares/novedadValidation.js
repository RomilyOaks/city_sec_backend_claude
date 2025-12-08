/**
 * ============================================
 * MIDDLEWARE: src/middlewares/novedadValidation.js
 * ============================================
 *
 * Validaciones para operaciones de novedades
 * Implementa validación de datos de entrada
 */

import { body, param, query, validationResult } from "express-validator";

/**
 * Manejo de errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Validación para crear novedad
 */
export const validateCreateNovedad = [
  body("tipo_novedad_id")
    .notEmpty()
    .withMessage("El tipo de novedad es requerido")
    .isInt({ min: 1 })
    .withMessage("El tipo de novedad debe ser un ID válido"),

  body("subtipo_novedad_id")
    .notEmpty()
    .withMessage("El subtipo de novedad es requerido")
    .isInt({ min: 1 })
    .withMessage("El subtipo debe ser un ID válido"),

  body("fecha_hora")
    .notEmpty()
    .withMessage("La fecha y hora son requeridas")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601"),

  body("localizacion")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La localización no puede exceder 500 caracteres"),

  body("referencia")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La referencia no puede exceder 500 caracteres"),

  body("latitud")
    .optional()
    .isDecimal()
    .withMessage("La latitud debe ser un número decimal")
    .custom((value) => {
      const lat = parseFloat(value);
      return lat >= -90 && lat <= 90;
    })
    .withMessage("La latitud debe estar entre -90 y 90"),

  body("longitud")
    .optional()
    .isDecimal()
    .withMessage("La longitud debe ser un número decimal")
    .custom((value) => {
      const lng = parseFloat(value);
      return lng >= -180 && lng <= 180;
    })
    .withMessage("La longitud debe estar entre -180 y 180"),

  body("origen_llamada")
    .optional()
    .isIn([
      "TELEFONO_107",
      "RADIO",
      "PRESENCIAL",
      "APP_MOVIL",
      "EMAIL",
      "REDES_SOCIALES",
      "OTRO",
    ])
    .withMessage("Origen de llamada no válido"),

  body("reportante_nombre")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("El nombre del reportante no puede exceder 200 caracteres"),

  body("reportante_telefono")
    .optional()
    .matches(/^[0-9]{7,15}$/)
    .withMessage("El teléfono debe tener entre 7 y 15 dígitos"),

  body("reportante_dni")
    .optional()
    .matches(/^[0-9]{8}$/)
    .withMessage("El DNI debe tener 8 dígitos"),

  body("descripcion")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La descripción no puede exceder 2000 caracteres"),

  body("observaciones")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Las observaciones no pueden exceder 2000 caracteres"),

  body("sector_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El sector debe ser un ID válido"),

  body("cuadrante_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El cuadrante debe ser un ID válido"),

  handleValidationErrors,
];

/**
 * Validación para actualizar novedad
 */
export const validateUpdateNovedad = [
  param("id").isInt({ min: 1 }).withMessage("ID de novedad inválido"),

  body("tipo_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El tipo de novedad debe ser un ID válido"),

  body("subtipo_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El subtipo debe ser un ID válido"),

  body("estado_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El estado debe ser un ID válido"),

  body("fecha_hora")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601"),

  body("fecha_llegada")
    .optional()
    .isISO8601()
    .withMessage("La fecha de llegada debe estar en formato ISO 8601"),

  body("fecha_cierre")
    .optional()
    .isISO8601()
    .withMessage("La fecha de cierre debe estar en formato ISO 8601"),

  body("localizacion")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La localización no puede exceder 500 caracteres"),

  body("latitud")
    .optional()
    .isDecimal()
    .withMessage("La latitud debe ser un número decimal"),

  body("longitud")
    .optional()
    .isDecimal()
    .withMessage("La longitud debe ser un número decimal"),

  body("descripcion")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La descripción no puede exceder 2000 caracteres"),

  body("observaciones")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Las observaciones no pueden exceder 2000 caracteres"),

  body("observaciones_cambio_estado")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Las observaciones de cambio de estado no pueden exceder 1000 caracteres"
    ),

  handleValidationErrors,
];

/**
 * Validación para asignar recursos
 */
export const validateAsignarRecursos = [
  param("id").isInt({ min: 1 }).withMessage("ID de novedad inválido"),

  body("unidad_oficina_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID de unidad debe ser válido"),

  body("vehiculo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID de vehículo debe ser válido"),

  body("personal_cargo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID de personal debe ser válido"),

  body("km_inicial")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El kilometraje inicial debe ser un número positivo"),

  handleValidationErrors,
];

/**
 * Validación de parámetros de query para listar novedades
 */
export const validateQueryNovedades = [
  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage("fecha_inicio debe estar en formato ISO 8601"),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("fecha_fin debe estar en formato ISO 8601"),

  query("estado_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("estado_id debe ser un número entero positivo"),

  query("prioridad")
    .optional()
    .isIn(["BAJA", "MEDIA", "ALTA", "CRITICA"])
    .withMessage("prioridad debe ser BAJA, MEDIA, ALTA o CRITICA"),

  query("sector_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sector_id debe ser un número entero positivo"),

  query("tipo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("tipo_id debe ser un número entero positivo"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page debe ser un número entero positivo"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe estar entre 1 y 100"),

  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("search no puede exceder 200 caracteres"),

  handleValidationErrors,
];

/**
 * Validación de ID en parámetros
 */
export const validateNovedadId = [
  param("id").isInt({ min: 1 }).withMessage("ID de novedad inválido"),

  handleValidationErrors,
];

export default {
  validateCreateNovedad,
  validateUpdateNovedad,
  validateAsignarRecursos,
  validateQueryNovedades,
  validateNovedadId,
};
