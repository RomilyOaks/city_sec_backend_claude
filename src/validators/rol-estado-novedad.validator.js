/**
 * Validador: rol-estado-novedad
 * Validaciones centralizadas para el CRUD de rol_estados_novedad
 */

import { body, param, query } from "express-validator";
import { validationResult } from "express-validator";

/**
 * Middleware centralizador de errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
};

/**
 * Validaciones para crear un registro rol-estado-novedad
 */
export const validarCrear = [
  body("rol_id")
    .notEmpty().withMessage("El rol_id es requerido")
    .isInt({ min: 1 }).withMessage("rol_id debe ser un entero positivo"),
  body("estado_novedad_id")
    .notEmpty().withMessage("El estado_novedad_id es requerido")
    .isInt({ min: 1 }).withMessage("estado_novedad_id debe ser un entero positivo"),
  body("descripcion")
    .optional({ nullable: true })
    .isString().withMessage("La descripción debe ser texto")
    .isLength({ max: 1000 }).withMessage("La descripción no puede superar 1000 caracteres"),
  body("observaciones")
    .optional({ nullable: true })
    .isString().withMessage("Las observaciones deben ser texto")
    .isLength({ max: 1000 }).withMessage("Las observaciones no pueden superar 1000 caracteres"),
  handleValidationErrors,
];

/**
 * Validaciones para actualizar un registro
 */
export const validarActualizar = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un entero positivo"),
  body("descripcion")
    .optional({ nullable: true })
    .isString().withMessage("La descripción debe ser texto")
    .isLength({ max: 1000 }).withMessage("La descripción no puede superar 1000 caracteres"),
  body("observaciones")
    .optional({ nullable: true })
    .isString().withMessage("Las observaciones deben ser texto")
    .isLength({ max: 1000 }).withMessage("Las observaciones no pueden superar 1000 caracteres"),
  body("estado")
    .optional()
    .isBoolean().withMessage("El estado debe ser booleano"),
  handleValidationErrors,
];

/**
 * Validaciones para cambiar estado (PATCH)
 */
export const validarCambiarEstado = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un entero positivo"),
  body("estado")
    .notEmpty().withMessage("El estado es requerido")
    .isBoolean().withMessage("El estado debe ser booleano (true/false)"),
  handleValidationErrors,
];

/**
 * Validación para parámetro :id en GET/DELETE
 */
export const validarId = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un entero positivo"),
  handleValidationErrors,
];

/**
 * Validación para parámetro :rolId en endpoint especial
 */
export const validarRolId = [
  param("rolId")
    .isInt({ min: 1 }).withMessage("El rolId debe ser un entero positivo"),
  handleValidationErrors,
];

/**
 * Validaciones para query params del listado
 */
export const validarListar = [
  query("rol_id")
    .optional()
    .isInt({ min: 1 }).withMessage("rol_id debe ser un entero positivo"),
  query("estado_novedad_id")
    .optional()
    .isInt({ min: 1 }).withMessage("estado_novedad_id debe ser un entero positivo"),
  query("estado")
    .optional()
    .isIn(["0", "1"]).withMessage("estado debe ser 0 o 1"),
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("page debe ser un entero positivo"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage("limit debe estar entre 1 y 200"),
  handleValidationErrors,
];
