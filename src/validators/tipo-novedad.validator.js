/**
 * ===================================================
 * VALIDADORES: Tipos de Novedad
 * ===================================================
 *
 * Ruta: src/validators/tipo-novedad.validator.js
 *
 * VERSIÓN: 1.0.1 (CORREGIDO)
 * FECHA: 2025-12-14
 *
 * CAMBIOS:
 * - tipo_code (en vez de codigo)
 * - color_hex (en vez de color)
 * - Nombres consistentes con la BD
 *
 * Descripción:
 * Validadores centralizados para el catálogo de Tipos de Novedad.
 * Define las categorías principales de incidentes y novedades.
 *
 * @module validators/tipo-novedad.validator
 * @requires express-validator
 * @version 1.0.1
 * @date 2025-12-14
 */

import { body, param, query, validationResult } from "express-validator";

// ==========================================
// IMPORTAR CONSTANTES CENTRALIZADAS
// ==========================================

import { LIMITES_TEXTO } from "../constants/validations.js";

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

/**
 * Manejo centralizado de errores de validación
 */
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

/**
 * Validar ID de tipo de novedad
 */
export const validarTipoNovedadId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de tipo de novedad debe ser un número positivo");

/**
 * Validar nombre del tipo de novedad
 */
export const validarNombre = (opcional = false) => {
  const validator = body("nombre")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\/\-\(\),\.]+$/)
    .withMessage("El nombre solo puede contener letras, números, espacios y los caracteres: / - ( ) , .");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El nombre es requerido");
};

/**
 * Validar descripción
 */
export const validarDescripcion = () =>
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.DESCRIPCION_MAX })
    .withMessage(
      `La descripción no puede exceder ${LIMITES_TEXTO.DESCRIPCION_MAX} caracteres`
    );

/**
 * Validar código del tipo (tipo_code)
 */
export const validarTipoCode = (opcional = true) => {
  const validator = body("tipo_code")
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

/**
 * Validar color hexadecimal (color_hex)
 */
export const validarColorHex = () =>
  body("color_hex")
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("El color debe estar en formato hexadecimal (#RRGGBB)");

/**
 * Validar icono
 */
export const validarIcono = () =>
  body("icono")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("El icono no puede exceder 50 caracteres");

/**
 * Validar si requiere unidad
 */
export const validarRequiereUnidad = () =>
  body("requiere_unidad")
    .optional()
    .isBoolean()
    .withMessage("requiere_unidad debe ser true o false");

/**
 * Validar estado
 */
export const validarEstado = () =>
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser true o false");

/**
 * Validar prioridad/orden
 */
export const validarOrden = () =>
  body("orden")
    .optional()
    .isInt({ min: 0, max: 999 })
    .withMessage("El orden debe ser un número entre 0 y 999");

// ==========================================
// VALIDADORES DE QUERY
// ==========================================

/**
 * Validar estado en query
 */
export const validarEstadoQuery = () =>
  query("estado")
    .optional()
    .isIn(["0", "1", "true", "false"])
    .withMessage("El estado debe ser 0, 1, true o false");

/**
 * Validar búsqueda
 */
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
 * Validación para crear tipo de novedad
 * POST /api/v1/tipos-novedad
 */
export const validateCreate = [
  validarNombre(false),
  validarDescripcion(),
  validarTipoCode(true),
  validarColorHex(),
  validarIcono(),
  validarRequiereUnidad(),
  validarOrden(),
  handleValidationErrors,
];

/**
 * Validación para actualizar tipo de novedad
 * PUT /api/v1/tipos-novedad/:id
 */
export const validateUpdate = [
  validarTipoNovedadId(),
  validarNombre(true),
  validarDescripcion(),
  validarTipoCode(true),
  validarColorHex(),
  validarIcono(),
  validarRequiereUnidad(),
  validarOrden(),
  validarEstado(),
  handleValidationErrors,
];

/**
 * Validación de ID simple
 * GET /api/v1/tipos-novedad/:id
 * DELETE /api/v1/tipos-novedad/:id
 */
export const validateId = [validarTipoNovedadId(), handleValidationErrors];

/**
 * Validación de query params
 * GET /api/v1/tipos-novedad
 */
export const validateQuery = [
  validarEstadoQuery(),
  validarSearch(),
  handleValidationErrors,
];

// ==========================================
// EXPORTACIÓN
// ==========================================

export default {
  validateCreate,
  validateUpdate,
  validateId,
  validateQuery,
  handleValidationErrors,
};
