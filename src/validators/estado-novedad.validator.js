/**
 * ===================================================
 * VALIDADORES: Estados de Novedad
 * ===================================================
 *
 * Ruta: src/validators/estado-novedad.validator.js
 *
 * VERSIÓN: 1.0.1 (CORREGIDO)
 * FECHA: 2025-12-14
 *
 * CAMBIOS:
 * - estado_code (en vez de codigo)
 * - color_hex (en vez de color)
 * - Nombres consistentes con la BD
 *
 * @module validators/estado-novedad.validator
 * @version 1.0.1
 */

import { body, param, query, validationResult } from "express-validator";
import { LIMITES_TEXTO } from "../constants/validations.js";

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

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

// ==========================================
// VALIDADORES ATÓMICOS
// ==========================================

export const validarEstadoNovedadId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de estado de novedad debe ser un número positivo");

export const validarNombre = (opcional = false) => {
  const validator = body("nombre")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("El nombre debe tener entre 3 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El nombre es requerido");
};

export const validarDescripcion = () =>
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.DESCRIPCION_MAX })
    .withMessage(
      `La descripción no puede exceder ${LIMITES_TEXTO.DESCRIPCION_MAX} caracteres`
    );

export const validarEstadoCode = (opcional = true) => {
  const validator = body("estado_code")
    .trim()
    .toUpperCase()
    .isLength({ min: 2, max: 10 })
    .withMessage("El código debe tener entre 2 y 10 caracteres")
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage(
      "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos"
    );

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El código es requerido");
};

export const validarColorHex = () =>
  body("color_hex")
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("El color debe estar en formato hexadecimal (#RRGGBB)");

export const validarIcono = () =>
  body("icono")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("El icono no puede exceder 50 caracteres");

export const validarEstadoFinal = () =>
  body("es_estado_final")
    .optional()
    .isBoolean()
    .withMessage("es_estado_final debe ser true o false");

export const validarEstadoInicial = () =>
  body("es_estado_inicial")
    .optional()
    .isBoolean()
    .withMessage("es_estado_inicial debe ser true o false");

export const validarPermiteEdicion = () =>
  body("permite_edicion")
    .optional()
    .isBoolean()
    .withMessage("permite_edicion debe ser true o false");

export const validarEstado = () =>
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser true o false");

export const validarOrden = () =>
  body("orden")
    .optional()
    .isInt({ min: 0, max: 999 })
    .withMessage("El orden debe ser un número entre 0 y 999");

// ==========================================
// VALIDADORES DE QUERY
// ==========================================

export const validarEstadoQuery = () =>
  query("estado")
    .optional()
    .isIn(["0", "1", "true", "false"])
    .withMessage("El estado debe ser 0, 1, true o false");

export const validarEstadoFinalQuery = () =>
  query("es_estado_final")
    .optional()
    .isIn(["true", "false"])
    .withMessage("es_estado_final debe ser true o false");

export const validarSearch = () =>
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La búsqueda no puede exceder 100 caracteres");

// ==========================================
// VALIDADORES COMPUESTOS
// ==========================================

/**
 * POST /api/v1/estados-novedad
 */
export const validateCreate = [
  validarNombre(false),
  validarDescripcion(),
  validarEstadoCode(true),
  validarColorHex(),
  validarIcono(),
  validarEstadoFinal(),
  validarEstadoInicial(),
  validarPermiteEdicion(),
  validarOrden(),
  handleValidationErrors,
];

/**
 * PUT /api/v1/estados-novedad/:id
 */
export const validateUpdate = [
  validarEstadoNovedadId(),
  validarNombre(true),
  validarDescripcion(),
  validarEstadoCode(true),
  validarColorHex(),
  validarIcono(),
  validarEstadoFinal(),
  validarEstadoInicial(),
  validarPermiteEdicion(),
  validarOrden(),
  validarEstado(),
  handleValidationErrors,
];

/**
 * GET/DELETE /api/v1/estados-novedad/:id
 */
export const validateId = [validarEstadoNovedadId(), handleValidationErrors];

/**
 * GET /api/v1/estados-novedad
 */
export const validateQuery = [
  validarEstadoQuery(),
  validarEstadoFinalQuery(),
  validarSearch(),
  handleValidationErrors,
];

export default {
  validateCreate,
  validateUpdate,
  validateId,
  validateQuery,
  handleValidationErrors,
};
