/**
 * ===================================================
 * VALIDADORES: Abastecimiento de Combustible
 * ===================================================
 *
 * Ruta: src/validators/abastecimiento.validator.js
 *
 * Descripción:
 * Validaciones centralizadas (express-validator) para el módulo de
 * abastecimiento de combustible.
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-17
 *
 * Objetivo de aprendizaje:
 * - Mostrar cómo centralizar reglas de validación
 * - Mantener consistencia entre rutas/controladores
 * - Aplicar "fail fast" antes de llegar a la capa de BD
 *
 * @module validators/abastecimiento.validator
 * @requires express-validator
 */

import { body, param, query, validationResult } from "express-validator";
import {
  TIPO_COMBUSTIBLE_ARRAY,
  UNIDAD_COMBUSTIBLE_ARRAY,
  LIMITES_NUMERICOS,
  LIMITES_TEXTO,
} from "../constants/validations.js";

// ==========================================
// MIDDLEWARE GENÉRICO DE ERRORES
// ==========================================

/**
 * Maneja y formatea los errores de validación de express-validator
 *
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Function} next - Next
 */
export const handleValidationErrors = (req, res, next) => {
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

// ==========================================
// VALIDADORES ATÓMICOS (REUTILIZABLES)
// ==========================================

/**
 * Valida el ID del abastecimiento
 */
export const validarAbastecimientoId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de abastecimiento inválido");

/**
 * Valida el ID del vehículo
 */
export const validarVehiculoId = () =>
  param("vehiculoId")
    .isInt({ min: 1 })
    .withMessage("vehiculoId debe ser un número entero positivo");

/**
 * Valida fecha y hora
 */
export const validarFechaHora = () =>
  body("fecha_hora")
    .notEmpty()
    .withMessage("La fecha_hora es requerida")
    .isISO8601()
    .withMessage("fecha_hora debe estar en formato ISO 8601")
    .custom((value) => {
      // Evitar registros con fecha futura
      const fecha = new Date(value);
      const hoy = new Date();
      if (fecha > hoy) {
        throw new Error("La fecha_hora no puede ser futura");
      }
      return true;
    });

/**
 * Valida tipo de combustible
 */
export const validarTipoCombustible = () =>
  body("tipo_combustible")
    .notEmpty()
    .withMessage("El tipo_combustible es requerido")
    .isIn(TIPO_COMBUSTIBLE_ARRAY)
    .withMessage(
      `El tipo_combustible debe ser uno de: ${TIPO_COMBUSTIBLE_ARRAY.join(
        ", "
      )}`
    );

/**
 * Valida kilometraje actual
 */
export const validarKmActual = () =>
  body("km_actual")
    .notEmpty()
    .withMessage("El km_actual es requerido")
    .isFloat({ min: LIMITES_NUMERICOS.KM_MIN, max: LIMITES_NUMERICOS.KM_MAX })
    .withMessage(
      `El km_actual debe estar entre ${LIMITES_NUMERICOS.KM_MIN} y ${LIMITES_NUMERICOS.KM_MAX}`
    );

/**
 * Valida cantidad
 *
 * Nota:
 * - Para compatibilidad con el endpoint existente de vehículos,
 *   aceptamos el campo cantidad_galones.
 */
export const validarCantidad = () =>
  body(["cantidad", "cantidad_galones"])
    .custom((value, { req }) => {
      // Si enviaron cantidad_galones, se usa ese valor.
      const cantidad = req.body.cantidad ?? req.body.cantidad_galones;

      if (cantidad === undefined || cantidad === null || cantidad === "") {
        throw new Error("La cantidad (o cantidad_galones) es requerida");
      }

      const num = parseFloat(cantidad);
      if (Number.isNaN(num)) {
        throw new Error("La cantidad debe ser numérica");
      }

      if (num < LIMITES_NUMERICOS.CANTIDAD_GALONES_MIN) {
        throw new Error(
          `La cantidad debe ser >= ${LIMITES_NUMERICOS.CANTIDAD_GALONES_MIN}`
        );
      }

      if (num > LIMITES_NUMERICOS.CANTIDAD_GALONES_MAX) {
        throw new Error(
          `La cantidad no puede exceder ${LIMITES_NUMERICOS.CANTIDAD_GALONES_MAX}`
        );
      }

      return true;
    })
    .withMessage("Cantidad inválida");

/**
 * Valida unidad (LITROS / GALONES)
 *
 * Nota:
 * - Si el cliente envía cantidad_galones, por defecto el controlador
 *   almacenará unidad=GALONES.
 */
export const validarUnidad = () =>
  body("unidad")
    .optional()
    .isIn(UNIDAD_COMBUSTIBLE_ARRAY)
    .withMessage(
      `unidad debe ser una de: ${UNIDAD_COMBUSTIBLE_ARRAY.join(", ")}`
    );

/**
 * Valida precio unitario (precio por litro/galón)
 *
 * Nota:
 * - Por compatibilidad, aceptamos precio_galon.
 */
export const validarPrecioUnitario = () =>
  body(["precio_unitario", "precio_galon"])
    .optional()
    .custom((value, { req }) => {
      const precio = req.body.precio_unitario ?? req.body.precio_galon;
      if (precio === undefined || precio === null || precio === "") return true;

      const num = parseFloat(precio);
      if (Number.isNaN(num)) {
        throw new Error("El precio_unitario (o precio_galon) debe ser numérico");
      }

      if (num < LIMITES_NUMERICOS.PRECIO_GALON_MIN) {
        throw new Error(
          `El precio debe ser >= ${LIMITES_NUMERICOS.PRECIO_GALON_MIN}`
        );
      }

      if (num > LIMITES_NUMERICOS.PRECIO_GALON_MAX) {
        throw new Error(
          `El precio no puede exceder ${LIMITES_NUMERICOS.PRECIO_GALON_MAX}`
        );
      }

      return true;
    });

/**
 * Valida el nombre del grifo
 */
export const validarGrifoNombre = () =>
  body(["grifo_nombre", "grifo"]).custom((value, { req }) => {
    // Tomamos uno u otro (prioridad: grifo_nombre)
    const grifoValor = req.body.grifo_nombre ?? req.body.grifo;

    if (grifoValor === undefined || grifoValor === null || grifoValor === "") {
      throw new Error("El grifo_nombre (o grifo) es requerido");
    }

    if (typeof grifoValor !== "string") {
      throw new Error("El grifo debe ser texto");
    }

    const limpio = grifoValor.trim();
    if (limpio.length === 0) {
      throw new Error("El grifo_nombre (o grifo) es requerido");
    }

    if (limpio.length > 100) {
      throw new Error("El nombre del grifo no puede exceder 100 caracteres");
    }

    return true;
  });

/**
 * Validar observaciones
 */
export const validarObservaciones = () =>
  body("observaciones")
    .optional()
    .isString()
    .withMessage("observaciones debe ser texto")
    .trim()
    .isLength({ max: LIMITES_TEXTO.OBSERVACIONES_MAX })
    .withMessage(
      `Las observaciones no pueden exceder ${LIMITES_TEXTO.OBSERVACIONES_MAX} caracteres`
    );

/**
 * Filtros de consulta para listado
 */
export const validarQueryAbastecimientos = () => [
  query("vehiculo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("vehiculo_id debe ser un número positivo"),

  query("personal_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("personal_id debe ser un número positivo"),

  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage("fecha_inicio debe ser ISO8601"),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("fecha_fin debe ser ISO8601"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("limit debe estar entre 1 y 200"),
];

// ==========================================
// VALIDADORES POR ENDPOINT
// ==========================================

/**
 * POST /api/v1/abastecimientos
 */
export const validateCreateAbastecimiento = [
  body("vehiculo_id")
    .notEmpty()
    .withMessage("vehiculo_id es requerido")
    .isInt({ min: 1 })
    .withMessage("vehiculo_id debe ser un número positivo"),
  body("personal_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("personal_id debe ser un número positivo"),
  validarFechaHora(),
  validarTipoCombustible(),
  validarKmActual(),
  validarCantidad(),
  validarUnidad(),
  validarPrecioUnitario(),
  validarGrifoNombre(),
  validarObservaciones(),
  handleValidationErrors,
];

/**
 * GET /api/v1/abastecimientos
 */
export const validateQueryAbastecimientos = [
  ...validarQueryAbastecimientos(),
  handleValidationErrors,
];

/**
 * GET /api/v1/abastecimientos/:id
 * PATCH/PUT/DELETE /api/v1/abastecimientos/:id
 */
export const validateAbastecimientoId = [
  validarAbastecimientoId(),
  handleValidationErrors,
];

/**
 * GET /api/v1/vehiculos/:id/abastecimientos
 */
export const validateVehiculoIdParam = [
  param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),
  handleValidationErrors,
];
