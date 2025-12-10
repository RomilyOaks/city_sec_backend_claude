/**
 * ============================================
 * MIDDLEWARE: src/middlewares/novedadValidation.js
 * ============================================
 * VERSIÓN CORREGIDA - Campos coinciden con BD
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

  // 🔥 CORREGIDO: fecha_hora_ocurrencia (no "fecha_hora")
  body("fecha_hora_ocurrencia")
    .notEmpty()
    .withMessage("La fecha y hora son requeridas")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601"),

  body("descripcion")
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("La descripción debe tener entre 10 y 2000 caracteres"),

  body("localizacion")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La localización no puede exceder 500 caracteres"),

  // 🔥 CORREGIDO: referencia_ubicacion (no "referencia")
  body("referencia_ubicacion")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("La referencia no puede exceder 255 caracteres"),

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

  // 🔥 CORREGIDO: Valores ENUM correctos de la BD
  body("origen_llamada")
    .optional()
    .isIn([
      "TELEFONO_107",
      "BOTON_PANICO",
      "CAMARA",
      "PATRULLAJE",
      "CIUDADANO",
      "INTERVENCION_DIRECTA",
      "OTROS",
    ])
    .withMessage("Origen de llamada no válido"),

  body("reportante_nombre")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 150 })
    .withMessage("El nombre del reportante no puede exceder 150 caracteres"),

  body("reportante_telefono")
    .optional()
    .matches(/^[0-9]{7,15}$/)
    .withMessage("El teléfono debe tener entre 7 y 15 dígitos"),

  // 🔥 CORREGIDO: reportante_doc_identidad (no "reportante_dni")
  body("reportante_doc_identidad")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 30 })
    .withMessage("El documento de identidad no puede exceder 30 caracteres"),

  body("es_anonimo")
    .optional()
    .isInt({ min: 0, max: 1 })
    .withMessage("es_anonimo debe ser 0 o 1"),

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

  // 🔥 CORREGIDO: ubigeo_code (no "ubigeo")
  body("ubigeo_code")
    .optional()
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("El código ubigeo debe tener exactamente 6 caracteres"),

  // 🔥 CORREGIDO: Valores ENUM correctos
  body("prioridad_actual")
    .optional()
    .isIn(["ALTA", "MEDIA", "BAJA"])
    .withMessage("La prioridad debe ser ALTA, MEDIA o BAJA"),

  body("gravedad")
    .optional()
    .isIn(["LEVE", "MODERADA", "GRAVE", "MUY_GRAVE"])
    .withMessage("La gravedad debe ser LEVE, MODERADA, GRAVE o MUY_GRAVE"),

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

  // 🔥 CORREGIDO
  body("fecha_hora_ocurrencia")
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
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El kilometraje inicial debe ser un número válido"),

  handleValidationErrors,
];

/**
 * Validación de query para listar novedades
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

  query("estado_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("estado_novedad_id debe ser un número entero positivo"),

  // 🔥 CORREGIDO: Valores correctos
  query("prioridad_actual")
    .optional()
    .isIn(["ALTA", "MEDIA", "BAJA"])
    .withMessage("prioridad_actual debe ser ALTA, MEDIA o BAJA"),

  query("sector_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sector_id debe ser un número entero positivo"),

  query("tipo_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("tipo_novedad_id debe ser un número entero positivo"),

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
