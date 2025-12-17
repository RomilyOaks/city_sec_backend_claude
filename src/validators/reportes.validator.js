import { query, validationResult } from "express-validator";

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

const ESTADOS_MANTENIMIENTO = [
  "PROGRAMADO",
  "EN_TALLER",
  "EN_PROCESO",
  "FINALIZADO",
  "CANCELADO",
];

export const validateQueryVehiculosEnMantenimiento = [
  query("estado_mantenimiento")
    .optional({ checkFalsy: true })
    .isIn(ESTADOS_MANTENIMIENTO)
    .withMessage("estado_mantenimiento inválido"),

  query("taller_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("taller_id debe ser un entero válido"),

  query("unidad_oficina_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("unidad_oficina_id debe ser un entero válido"),

  query("vehiculo_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("vehiculo_id debe ser un entero válido"),

  query("fecha_inicio")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("fecha_inicio debe ser ISO8601"),

  query("fecha_fin")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("fecha_fin debe ser ISO8601"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page debe ser un número positivo"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe estar entre 1 y 100"),

  handleValidationErrors,
];

export const validateQueryCostosMantenimiento = [
  query("taller_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("taller_id debe ser un entero válido"),

  query("unidad_oficina_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("unidad_oficina_id debe ser un entero válido"),

  query("vehiculo_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("vehiculo_id debe ser un entero válido"),

  query("fecha_inicio")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("fecha_inicio debe ser ISO8601"),

  query("fecha_fin")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("fecha_fin debe ser ISO8601"),

  query("group_by")
    .optional({ checkFalsy: true })
    .isIn(["mes", "vehiculo", "taller", "unidad"])
    .withMessage("group_by inválido (mes|vehiculo|taller|unidad)"),

  handleValidationErrors,
];

export default {
  validateQueryVehiculosEnMantenimiento,
  validateQueryCostosMantenimiento,
  handleValidationErrors,
};
