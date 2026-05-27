/**
 * ===================================================
 * VALIDATORS: Tracking GPS de Vehículos
 * ===================================================
 *
 * Archivo: src/validators/tracking.validators.js
 *
 * Validadores express-validator para el módulo de tracking
 * GPS de vehículos de patrullaje.
 *
 * @module validators/trackingValidators
 * @version 1.0.0
 * @date 2026-05-27
 */

import { body, param, query } from "express-validator";
import { validationResult } from "express-validator";

// ============================================================
// HELPER: Manejo de errores de validación
// ============================================================

/**
 * Middleware para procesar y responder errores de validación.
 * Formato consistente con el resto del proyecto.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// ============================================================
// VALIDADORES: POST /tracking/ubicacion
// ============================================================

/**
 * Valida el body de la actualización de posición GPS.
 * vehiculo_id, lat y lng son obligatorios.
 * velocidad, precision_gps y bateria_dispositivo son opcionales.
 */
export const validarUbicacion = [
  body("vehiculo_id")
    .notEmpty()
    .withMessage("El vehiculo_id es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El vehiculo_id debe ser un número entero positivo"),

  body("lat")
    .notEmpty()
    .withMessage("La latitud (lat) es obligatoria")
    .isFloat({ min: -90, max: 90 })
    .withMessage("La latitud debe estar entre -90 y 90"),

  body("lng")
    .notEmpty()
    .withMessage("La longitud (lng) es obligatoria")
    .isFloat({ min: -180, max: 180 })
    .withMessage("La longitud debe estar entre -180 y 180"),

  body("velocidad")
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 300 })
    .withMessage("La velocidad debe ser un número entre 0 y 300 km/h"),

  body("precision_gps")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("La precisión GPS debe ser un número positivo (metros)"),

  body("bateria_dispositivo")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 100 })
    .withMessage("La batería del dispositivo debe ser un entero entre 0 y 100"),
];

// ============================================================
// VALIDADORES: GET /tracking/vehiculo/:vehiculoId/ruta
// ============================================================

/**
 * Valida el param vehiculoId en rutas de historial.
 */
export const validarVehiculoIdParam = [
  param("vehiculoId")
    .isInt({ min: 1 })
    .withMessage("El vehiculoId debe ser un número entero positivo"),
];

/**
 * Valida query params para el endpoint de ruta histórica.
 * fecha_inicio y fecha_fin son obligatorios; limit es opcional (máx 500).
 */
export const validarRangoDeFechas = [
  query("fecha_inicio")
    .notEmpty()
    .withMessage("La fecha_inicio es obligatoria")
    .isISO8601()
    .withMessage("La fecha_inicio debe ser una fecha válida (ISO 8601, ej: 2026-05-27T00:00:00Z)"),

  query("fecha_fin")
    .notEmpty()
    .withMessage("La fecha_fin es obligatoria")
    .isISO8601()
    .withMessage("La fecha_fin debe ser una fecha válida (ISO 8601, ej: 2026-05-27T23:59:59Z)"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("El limit debe ser un entero entre 1 y 500"),
];

// ============================================================
// VALIDADORES: GET /tracking/novedad/:novedadId/vehiculos-cercanos
// ============================================================

/**
 * Valida el param novedadId en el endpoint de vehículos cercanos.
 */
export const validarNovedadIdParam = [
  param("novedadId")
    .isInt({ min: 1 })
    .withMessage("El novedadId debe ser un número entero positivo"),
];
