/**
 * ===================================================
 * VALIDADORES: Radios TETRA
 * ===================================================
 *
 * Ruta: src/middlewares/validators/radio-tetra.validator.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-06
 *
 * Descripción:
 * Validadores para las operaciones CRUD de radios TETRA.
 * Valida datos de entrada antes de llegar al controlador.
 *
 * @module middlewares/validators/radio-tetra
 * @requires express-validator
 * @version 1.0.0
 * @date 2026-01-06
 */

import { body, param, query, validationResult } from "express-validator";
import { formatErrorResponse } from "../../utils/responseFormatter.js";

/**
 * Maneja los errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      formatErrorResponse("Errores de validación", {
        errors: errors.array().map((error) => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value,
        })),
      })
    );
  }
  next();
};

/**
 * =====================================================
 * Validar ID de radio
 * =====================================================
 */
export const validateRadioId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El ID del radio debe ser un número entero positivo"),
  handleValidationErrors,
];

/**
 * =====================================================
 * Validar creación de radio
 * =====================================================
 */
export const validateCreateRadio = [
  body("radio_tetra_code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("El código debe tener entre 1 y 10 caracteres")
    .matches(/^[A-Z0-9-]+$/i)
    .withMessage("El código solo puede contener letras, números y guiones"),

  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("La descripción no puede exceder 50 caracteres"),

  body("personal_seguridad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "El ID del personal debe ser un número entero positivo"
    ),

  body("fecha_fabricacion")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fabricación debe ser una fecha válida (YYYY-MM-DD)")
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      if (fecha > hoy) {
        throw new Error("La fecha de fabricación no puede ser futura");
      }
      return true;
    }),

  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser true o false"),

  handleValidationErrors,
];

/**
 * =====================================================
 * Validar actualización de radio
 * =====================================================
 */
export const validateUpdateRadio = [
  body("radio_tetra_code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("El código debe tener entre 1 y 10 caracteres")
    .matches(/^[A-Z0-9-]+$/i)
    .withMessage("El código solo puede contener letras, números y guiones"),

  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("La descripción no puede exceder 50 caracteres"),

  body("personal_seguridad_id")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (Number.isInteger(value) && value > 0) return true;
      throw new Error("El ID del personal debe ser un número entero positivo o null");
    }),

  body("fecha_fabricacion")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      const fecha = new Date(value);
      if (isNaN(fecha.getTime())) {
        throw new Error("La fecha de fabricación debe ser una fecha válida");
      }
      const hoy = new Date();
      if (fecha > hoy) {
        throw new Error("La fecha de fabricación no puede ser futura");
      }
      return true;
    }),

  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser true o false"),

  handleValidationErrors,
];

/**
 * =====================================================
 * Validar asignación a personal
 * =====================================================
 */
export const validateAsignarPersonal = [
  body("personal_seguridad_id")
    .notEmpty()
    .withMessage("El ID del personal de seguridad es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del personal debe ser un número entero positivo"),

  handleValidationErrors,
];

/**
 * =====================================================
 * Validar query params para listar radios
 * =====================================================
 */
export const validateQueryRadios = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero positivo"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),

  query("estado")
    .optional()
    .isIn(["true", "false", ""])
    .withMessage("El estado debe ser 'true' o 'false'"),

  query("asignado")
    .optional()
    .isIn(["true", "false", "all", ""])
    .withMessage("El filtro de asignación debe ser 'true', 'false' o 'all'"),

  query("personal_seguridad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID del personal debe ser un número entero positivo"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("La búsqueda no puede exceder 50 caracteres"),

  handleValidationErrors,
];

export default {
  validateRadioId,
  validateCreateRadio,
  validateUpdateRadio,
  validateAsignarPersonal,
  validateQueryRadios,
};
