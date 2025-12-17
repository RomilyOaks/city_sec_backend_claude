import { body, param, query, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      value: err.value,
      message: err.msg,
      location: err.location,
    }));

    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: formattedErrors,
      _meta: {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  next();
};

const TIPO_MANTENIMIENTO_ARRAY = [
  "PREVENTIVO",
  "CORRECTIVO",
  "INSPECCION",
  "OTRO",
];

const PRIORIDAD_ARRAY = ["BAJA", "MEDIA", "ALTA", "CRITICA"];

const TIPO_DOCUMENTO_ARRAY = [
  "ORDEN_TRABAJO",
  "ORDEN_SERVICIO",
  "FACTURA",
  "BOLETA_VENTAS",
  "OTROS",
];

const ESTADO_MANTENIMIENTO_ARRAY = [
  "PROGRAMADO",
  "EN_TALLER",
  "EN_PROCESO",
  "FINALIZADO",
  "CANCELADO",
];

const NUMERO_DOCUMENTO_REGEX = /^[0-9]{1,12}(-[A-Z0-9]{1,10})?$/;

export const validateMantenimientoId = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  handleValidationErrors,
];

export const validateQueryMantenimientos = [
  query("vehiculo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("vehiculo_id debe ser un número positivo"),
  query("estado_mantenimiento")
    .optional()
    .isIn(ESTADO_MANTENIMIENTO_ARRAY)
    .withMessage(
      `estado_mantenimiento debe ser: ${ESTADO_MANTENIMIENTO_ARRAY.join(
        ", "
      )}`
    ),
  query("taller_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("taller_id debe ser un número positivo"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe estar entre 1 y 100"),
  handleValidationErrors,
];

export const validateCreateMantenimiento = [
  body("vehiculo_id")
    .notEmpty()
    .withMessage("vehiculo_id es requerido")
    .isInt({ min: 1 })
    .withMessage("vehiculo_id debe ser un número positivo"),

  body("unidad_oficina_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("unidad_oficina_id debe ser un número positivo"),

  body("taller_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("taller_id debe ser un número positivo"),

  body("tipo_mantenimiento")
    .optional()
    .isIn(TIPO_MANTENIMIENTO_ARRAY)
    .withMessage(
      `tipo_mantenimiento debe ser: ${TIPO_MANTENIMIENTO_ARRAY.join(", ")}`
    ),

  body("prioridad")
    .optional()
    .isIn(PRIORIDAD_ARRAY)
    .withMessage(`prioridad debe ser: ${PRIORIDAD_ARRAY.join(", ")}`),

  body("tipo_documento")
    .notEmpty()
    .withMessage("tipo_documento es requerido")
    .isIn(TIPO_DOCUMENTO_ARRAY)
    .withMessage(
      `tipo_documento debe ser: ${TIPO_DOCUMENTO_ARRAY.join(", ")}`
    ),

  body("numero_documento")
    .notEmpty()
    .withMessage("numero_documento es requerido")
    .trim()
    .customSanitizer((v) => String(v).toUpperCase().trim())
    .matches(NUMERO_DOCUMENTO_REGEX)
    .withMessage(
      "numero_documento debe tener solo dígitos (con ceros) y opcionalmente un sufijo - con letras/dígitos en mayúsculas (ej: 000123-A)"
    ),

  body("estado_mantenimiento")
    .optional()
    .isIn(ESTADO_MANTENIMIENTO_ARRAY)
    .withMessage(
      `estado_mantenimiento debe ser: ${ESTADO_MANTENIMIENTO_ARRAY.join(", ")}`
    ),

  body("fecha_programada")
    .optional()
    .isISO8601()
    .withMessage("fecha_programada debe estar en formato ISO8601"),
  body("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage("fecha_inicio debe estar en formato ISO8601"),
  body("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("fecha_fin debe estar en formato ISO8601"),

  body("km_registro")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("km_registro debe ser numérico"),
  body("km_proximo_mantenimiento")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("km_proximo_mantenimiento debe ser numérico"),
  body("km_actual_al_finalizar")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("km_actual_al_finalizar debe ser numérico"),

  body("costo_mano_obra")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("costo_mano_obra debe ser numérico"),
  body("costo_repuestos")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("costo_repuestos debe ser numérico"),
  body("costo_total")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("costo_total debe ser numérico"),

  body("moneda")
    .optional()
    .isIn(["PEN", "USD"])
    .withMessage("moneda debe ser PEN o USD"),

  handleValidationErrors,
];

export const validateUpdateMantenimiento = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),

  body("vehiculo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("vehiculo_id debe ser un número positivo"),

  body("unidad_oficina_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("unidad_oficina_id debe ser un número positivo"),

  body("taller_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("taller_id debe ser un número positivo"),

  body("tipo_mantenimiento")
    .optional()
    .isIn(TIPO_MANTENIMIENTO_ARRAY)
    .withMessage(
      `tipo_mantenimiento debe ser: ${TIPO_MANTENIMIENTO_ARRAY.join(", ")}`
    ),

  body("prioridad")
    .optional()
    .isIn(PRIORIDAD_ARRAY)
    .withMessage(`prioridad debe ser: ${PRIORIDAD_ARRAY.join(", ")}`),

  body("tipo_documento")
    .optional()
    .isIn(TIPO_DOCUMENTO_ARRAY)
    .withMessage(
      `tipo_documento debe ser: ${TIPO_DOCUMENTO_ARRAY.join(", ")}`
    ),

  body("numero_documento")
    .optional()
    .trim()
    .customSanitizer((v) => String(v).toUpperCase().trim())
    .matches(NUMERO_DOCUMENTO_REGEX)
    .withMessage(
      "numero_documento debe tener solo dígitos y opcionalmente un sufijo - con letras/dígitos en mayúsculas (ej: 000123-A)"
    ),

  body("estado_mantenimiento")
    .optional()
    .isIn(ESTADO_MANTENIMIENTO_ARRAY)
    .withMessage(
      `estado_mantenimiento debe ser: ${ESTADO_MANTENIMIENTO_ARRAY.join(", ")}`
    ),

  body("fecha_programada")
    .optional()
    .isISO8601()
    .withMessage("fecha_programada debe estar en formato ISO8601"),
  body("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage("fecha_inicio debe estar en formato ISO8601"),
  body("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("fecha_fin debe estar en formato ISO8601"),

  handleValidationErrors,
];

export const validateCambiarEstadoMantenimiento = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  body("estado_mantenimiento")
    .notEmpty()
    .withMessage("estado_mantenimiento es requerido")
    .isIn(ESTADO_MANTENIMIENTO_ARRAY)
    .withMessage(
      `estado_mantenimiento debe ser: ${ESTADO_MANTENIMIENTO_ARRAY.join(", ")}`
    ),
  body("observaciones")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("observaciones no puede exceder 1000 caracteres"),
  handleValidationErrors,
];

export default {
  validateMantenimientoId,
  validateQueryMantenimientos,
  validateCreateMantenimiento,
  validateUpdateMantenimiento,
  validateCambiarEstadoMantenimiento,
  handleValidationErrors,
};
