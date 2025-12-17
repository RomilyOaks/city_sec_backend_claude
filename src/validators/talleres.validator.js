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

const RUC_REGEX = /^\d{11}$/;
const TELEFONO_REGEX = /^[0-9\s\-\+\(\)]+$/;

export const validateTallerId = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  handleValidationErrors,
];

export const validateQueryTalleres = [
  query("estado")
    .optional({ checkFalsy: true })
    .isIn(["0", "1", "true", "false"])
    .withMessage("estado debe ser 0, 1, true o false"),
  query("search")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("search no puede exceder 100 caracteres"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe estar entre 1 y 100"),
  handleValidationErrors,
];

export const validateCreateTaller = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("nombre es requerido")
    .isLength({ min: 3, max: 150 })
    .withMessage("nombre debe tener entre 3 y 150 caracteres"),

  body("ruc")
    .trim()
    .notEmpty()
    .withMessage("ruc es requerido")
    .matches(RUC_REGEX)
    .withMessage("ruc debe tener 11 dígitos"),

  body("direccion")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("direccion no puede exceder 255 caracteres"),

  body("telefono")
    .optional()
    .trim()
    .matches(TELEFONO_REGEX)
    .withMessage("telefono contiene caracteres inválidos")
    .isLength({ max: 30 })
    .withMessage("telefono no puede exceder 30 caracteres"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("email no tiene un formato válido")
    .isLength({ max: 150 })
    .withMessage("email no puede exceder 150 caracteres"),

  body("contacto_nombre")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("contacto_nombre no puede exceder 150 caracteres"),

  handleValidationErrors,
];

export const validateUpdateTaller = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),

  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("nombre debe tener entre 3 y 150 caracteres"),

  body("ruc")
    .optional()
    .trim()
    .matches(RUC_REGEX)
    .withMessage("ruc debe tener 11 dígitos"),

  body("direccion")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("direccion no puede exceder 255 caracteres"),

  body("telefono")
    .optional()
    .trim()
    .matches(TELEFONO_REGEX)
    .withMessage("telefono contiene caracteres inválidos")
    .isLength({ max: 30 })
    .withMessage("telefono no puede exceder 30 caracteres"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("email no tiene un formato válido")
    .isLength({ max: 150 })
    .withMessage("email no puede exceder 150 caracteres"),

  body("contacto_nombre")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("contacto_nombre no puede exceder 150 caracteres"),

  body("estado")
    .optional()
    .isIn([0, 1, true, false, "0", "1", "true", "false"])
    .withMessage("estado debe ser 0/1 o true/false"),

  handleValidationErrors,
];

export default {
  validateTallerId,
  validateQueryTalleres,
  validateCreateTaller,
  validateUpdateTaller,
  handleValidationErrors,
};
