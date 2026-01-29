/**
 * ===================================================
 * VALIDADORES: Subtipos de Novedad
 * ===================================================
 *
 * Ruta: src/validators/subtipo-novedad.validator.js
 *
 * VERSIÓN: 1.0.1 (CORREGIDO)
 * FECHA: 2025-12-14
 *
 * CAMBIOS:
 * - subtipo_code (en vez de codigo)
 * - color_hex (en vez de color)
 * - Nombres consistentes con la BD
 *
 * @module validators/subtipo-novedad.validator
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

export const validarSubtipoNovedadId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de subtipo de novedad debe ser un número positivo");

export const validarTipoNovedadId = (opcional = false) => {
  const validator = body("tipo_novedad_id")
    .isInt({ min: 1 })
    .withMessage("El tipo de novedad debe ser un ID válido");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El tipo de novedad es requerido");
};

export const validarNombre = (opcional = false) => {
  const validator = body("nombre")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-/]+$/)
    .withMessage(
      "El nombre solo puede contener letras, espacios, guiones y barras"
    );

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

export const validarSubtipoCode = (opcional = true) => {
  const validator = body("subtipo_code")
    .trim()
    .toUpperCase()
    .isLength({ min: 2, max: 10 })
    .withMessage("El código debe tener entre 2 y 10 caracteres")
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage(
      "El código solo puede contener letras, números, guiones y guiones bajos"
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

export const validarTipoNovedadIdQuery = () =>
  query("tipo_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("tipo_novedad_id debe ser un número positivo");

export const validarEstadoQuery = () =>
  query("estado")
    .optional()
    .isIn(["0", "1", "true", "false"])
    .withMessage("El estado debe ser 0, 1, true o false");

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
 * POST /api/v1/subtipos-novedad
 */
export const validateCreate = [
  validarNombre(false),
  validarTipoNovedadId(false),
  validarDescripcion(),
  validarSubtipoCode(true),
  validarColorHex(),
  validarIcono(),
  validarOrden(),
  handleValidationErrors,
];

/**
 * PUT /api/v1/subtipos-novedad/:id
 */
export const validateUpdate = [
  validarSubtipoNovedadId(),
  validarNombre(true),
  validarTipoNovedadId(true),
  validarDescripcion(),
  validarSubtipoCode(true),
  validarColorHex(),
  validarIcono(),
  validarOrden(),
  validarEstado(),
  handleValidationErrors,
];

/**
 * GET/DELETE /api/v1/subtipos-novedad/:id
 */
export const validateId = [validarSubtipoNovedadId(), handleValidationErrors];

/**
 * GET /api/v1/subtipos-novedad
 */
export const validateQuery = [
  validarTipoNovedadIdQuery(),
  validarEstadoQuery(),
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
