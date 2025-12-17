/**
 * ===================================================
 * VALIDADORES: Estados de Novedad
 * ===================================================
 *
 * Ruta: src/validators/estado-novedad.validator.js
 *
 * VERSIÓN: 1.0.2 (FINAL - SIN estado_code)
 * FECHA: 2025-12-14
 *
 * CAMBIOS:
 * - ❌ Eliminado estado_code (no existe en la BD)
 * - ✅ Solo nombre, descripcion, color_hex, icono
 *
 * @module validators/estado-novedad.validator
 * @version 1.0.2
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
    .isLength({ max: 255 })
    .withMessage("La descripción no puede exceder 255 caracteres");

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

export const validarRequiereUnidad = () =>
  body("requiere_unidad")
    .optional()
    .isBoolean()
    .withMessage("requiere_unidad debe ser true o false");

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
  validarColorHex(),
  validarIcono(),
  validarEstadoFinal(),
  validarEstadoInicial(),
  validarPermiteEdicion(),
  validarRequiereUnidad(),
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
  validarColorHex(),
  validarIcono(),
  validarEstadoFinal(),
  validarEstadoInicial(),
  validarPermiteEdicion(),
  validarRequiereUnidad(),
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
