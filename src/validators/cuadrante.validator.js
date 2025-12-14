/**
 * ===================================================
 * VALIDADORES: Cuadrantes
 * ===================================================
 *
 * Ruta: src/validators/cuadrante.validator.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-14
 *
 * Descripción:
 * Validadores centralizados y reutilizables para el módulo de Cuadrantes.
 * Utiliza express-validator para validaciones robustas y mensajes claros.
 *
 * Características:
 * - Validadores atómicos reutilizables
 * - Validadores compuestos por endpoint
 * - Validaciones geoespaciales
 * - Mensajes de error descriptivos
 * - Validaciones de negocio
 * - Manejo centralizado de errores
 * - Importa constantes desde constants/validations.js ✅
 *
 * @module validators/cuadrante.validator
 * @requires express-validator
 * @version 1.0.0
 * @date 2025-12-14
 */

import { body, param, query, validationResult } from "express-validator";

// ==========================================
// IMPORTAR CONSTANTES CENTRALIZADAS
// ==========================================

import {
  LIMITES_TEXTO,
  LIMITES_NUMERICOS,
  PATTERNS,
  COLORES_MAPA_ARRAY,
} from "../constants/validations.js";

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

/**
 * Manejo centralizado de errores de validación
 * Formatea los errores en un formato consistente
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
// VALIDADORES ATÓMICOS (REUTILIZABLES)
// ==========================================

/**
 * Validar ID de cuadrante
 */
export const validarCuadranteId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de cuadrante debe ser un número positivo");

/**
 * Validar código de cuadrante
 */
export const validarCodigoCuadrante = (opcional = true) => {
  const validator = body("cuadrante_code")
    .trim()
    .isLength({ max: LIMITES_TEXTO.CUADRANTE_CODE_MAX })
    .withMessage(
      `El código no puede exceder ${LIMITES_TEXTO.CUADRANTE_CODE_MAX} caracteres`
    )
    .matches(PATTERNS.CUADRANTE_CODE)
    .withMessage("Formato de código inválido (solo letras, números y guiones)");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El código del cuadrante es requerido");
};

/**
 * Validar nombre del cuadrante
 */
export const validarNombreCuadrante = (opcional = false) => {
  const validator = body("nombre")
    .trim()
    .isLength({
      min: LIMITES_TEXTO.CUADRANTE_NOMBRE_MIN,
      max: LIMITES_TEXTO.CUADRANTE_NOMBRE_MAX,
    })
    .withMessage(
      `El nombre debe tener entre ${LIMITES_TEXTO.CUADRANTE_NOMBRE_MIN} y ${LIMITES_TEXTO.CUADRANTE_NOMBRE_MAX} caracteres`
    );

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El nombre del cuadrante es requerido");
};

/**
 * Validar ID del sector (requerido para cuadrantes)
 */
export const validarSectorId = (opcional = false) => {
  const validator = body("sector_id")
    .isInt({ min: 1 })
    .withMessage("El sector debe ser un ID válido");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El sector es requerido");
};

/**
 * Validar código de zona
 */
export const validarZonaCode = () =>
  body("zona_code")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.ZONA_CODE_MAX })
    .withMessage(
      `El código de zona no puede exceder ${LIMITES_TEXTO.ZONA_CODE_MAX} caracteres`
    )
    .matches(PATTERNS.ZONA_CODE)
    .withMessage("Formato de código de zona inválido");

/**
 * Validar latitud
 */
export const validarLatitud = () =>
  body("latitud")
    .optional()
    .isFloat({
      min: LIMITES_NUMERICOS.LATITUD_MIN,
      max: LIMITES_NUMERICOS.LATITUD_MAX,
    })
    .withMessage(
      `La latitud debe estar entre ${LIMITES_NUMERICOS.LATITUD_MIN} y ${LIMITES_NUMERICOS.LATITUD_MAX}`
    );

/**
 * Validar longitud
 */
export const validarLongitud = () =>
  body("longitud")
    .optional()
    .isFloat({
      min: LIMITES_NUMERICOS.LONGITUD_MIN,
      max: LIMITES_NUMERICOS.LONGITUD_MAX,
    })
    .withMessage(
      `La longitud debe estar entre ${LIMITES_NUMERICOS.LONGITUD_MIN} y ${LIMITES_NUMERICOS.LONGITUD_MAX}`
    );

/**
 * Validar polígono GeoJSON
 */
export const validarPoligonoJSON = () =>
  body("poligono_json")
    .optional()
    .custom((value) => {
      if (!value) return true;

      // Verificar que sea un objeto
      if (typeof value !== "object") {
        throw new Error("El polígono debe ser un objeto JSON válido");
      }

      // Validación básica de estructura GeoJSON
      if (
        value.type &&
        value.type !== "Polygon" &&
        value.type !== "MultiPolygon"
      ) {
        throw new Error(
          "El tipo de polígono debe ser 'Polygon' o 'MultiPolygon'"
        );
      }

      if (value.coordinates && !Array.isArray(value.coordinates)) {
        throw new Error("Las coordenadas deben ser un array");
      }

      return true;
    });

/**
 * Validar radio en metros
 */
export const validarRadioMetros = () =>
  body("radio_metros")
    .optional()
    .isInt({
      min: LIMITES_NUMERICOS.RADIO_METROS_MIN,
      max: LIMITES_NUMERICOS.RADIO_METROS_MAX,
    })
    .withMessage(
      `El radio debe estar entre ${LIMITES_NUMERICOS.RADIO_METROS_MIN} y ${LIMITES_NUMERICOS.RADIO_METROS_MAX} metros`
    );

/**
 * Validar color hexadecimal para mapa
 */
export const validarColorMapa = () =>
  body("color_mapa")
    .optional()
    .trim()
    .matches(PATTERNS.COLOR_HEX)
    .withMessage("El color debe estar en formato hexadecimal (#RRGGBB)");

/**
 * Validar estado booleano
 */
export const validarEstado = () =>
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser true o false");

// ==========================================
// VALIDADORES DE QUERY PARAMS
// ==========================================

/**
 * Validar sector_id en query
 */
export const validarSectorIdQuery = () =>
  query("sector_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sector_id debe ser un número positivo");

/**
 * Validar estado en query
 */
export const validarEstadoQuery = () =>
  query("estado")
    .optional()
    .isIn(["0", "1", "true", "false"])
    .withMessage("El estado debe ser 0, 1, true o false");

/**
 * Validar activos en query
 */
export const validarActivosQuery = () =>
  query("activos")
    .optional()
    .isIn(["true", "false"])
    .withMessage("activos debe ser true o false");

/**
 * Validar página (paginación)
 */
export const validarPage = () =>
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número positivo");

/**
 * Validar límite (paginación)
 */
export const validarLimit = () =>
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe estar entre 1 y 100");

/**
 * Validar búsqueda (search)
 */
export const validarSearch = () =>
  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La búsqueda no puede exceder 200 caracteres");

/**
 * Validar latitud en query (búsqueda geoespacial)
 */
export const validarLatitudQuery = () =>
  query("lat")
    .isFloat({
      min: LIMITES_NUMERICOS.LATITUD_MIN,
      max: LIMITES_NUMERICOS.LATITUD_MAX,
    })
    .withMessage(
      `La latitud debe estar entre ${LIMITES_NUMERICOS.LATITUD_MIN} y ${LIMITES_NUMERICOS.LATITUD_MAX}`
    );

/**
 * Validar longitud en query (búsqueda geoespacial)
 */
export const validarLongitudQuery = () =>
  query("lng")
    .isFloat({
      min: LIMITES_NUMERICOS.LONGITUD_MIN,
      max: LIMITES_NUMERICOS.LONGITUD_MAX,
    })
    .withMessage(
      `La longitud debe estar entre ${LIMITES_NUMERICOS.LONGITUD_MIN} y ${LIMITES_NUMERICOS.LONGITUD_MAX}`
    );

/**
 * Validar radio en km (búsqueda geoespacial)
 */
export const validarRadiusKm = () =>
  query("radius")
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage("El radio debe estar entre 0.1 y 100 km");

/**
 * Validar código en params
 */
export const validarCodigoParam = () =>
  param("code")
    .trim()
    .notEmpty()
    .withMessage("El código es requerido")
    .isLength({ max: LIMITES_TEXTO.CUADRANTE_CODE_MAX })
    .withMessage("Código inválido");

/**
 * Validar sectorId en params
 */
export const validarSectorIdParam = () =>
  param("sectorId").isInt({ min: 1 }).withMessage("ID de sector inválido");

// ==========================================
// VALIDADORES COMPUESTOS (POR ENDPOINT)
// ==========================================

/**
 * Validación completa para crear cuadrante
 * POST /api/v1/cuadrantes
 */
export const validateCreateCuadrante = [
  validarCodigoCuadrante(true), // Opcional porque se puede generar automáticamente
  validarNombreCuadrante(false), // Requerido
  validarSectorId(false), // Requerido
  validarZonaCode(),
  validarLatitud(),
  validarLongitud(),
  validarPoligonoJSON(),
  validarRadioMetros(),
  validarColorMapa(),
  handleValidationErrors,
];

/**
 * Validación para actualizar cuadrante
 * PUT /api/v1/cuadrantes/:id
 */
export const validateUpdateCuadrante = [
  validarCuadranteId(),
  validarCodigoCuadrante(true),
  validarNombreCuadrante(true), // Opcional en update
  validarSectorId(true), // Opcional en update
  validarZonaCode(),
  validarLatitud(),
  validarLongitud(),
  validarPoligonoJSON(),
  validarRadioMetros(),
  validarColorMapa(),
  handleValidationErrors,
];

/**
 * Validación simple de ID
 * GET /api/v1/cuadrantes/:id
 * DELETE /api/v1/cuadrantes/:id
 */
export const validateCuadranteId = [
  validarCuadranteId(),
  handleValidationErrors,
];

/**
 * Validación de query params para listar
 * GET /api/v1/cuadrantes
 */
export const validateQueryCuadrantes = [
  validarSectorIdQuery(),
  validarEstadoQuery(),
  validarActivosQuery(),
  validarPage(),
  validarLimit(),
  validarSearch(),
  handleValidationErrors,
];

/**
 * Validación para cambiar estado
 * PATCH /api/v1/cuadrantes/:id/estado
 */
export const validateCambiarEstado = [
  validarCuadranteId(),
  validarEstado(),
  handleValidationErrors,
];

/**
 * Validación para búsqueda geoespacial
 * GET /api/v1/cuadrantes/cercanos
 */
export const validateBusquedaGeoespacial = [
  validarLatitudQuery(),
  validarLongitudQuery(),
  validarRadiusKm(),
  handleValidationErrors,
];

/**
 * Validación para buscar por código
 * GET /api/v1/cuadrantes/codigo/:code
 */
export const validateBuscarPorCodigo = [
  validarCodigoParam(),
  handleValidationErrors,
];

/**
 * Validación para buscar por sector
 * GET /api/v1/cuadrantes/sector/:sectorId
 */
export const validateBuscarPorSector = [
  validarSectorIdParam(),
  handleValidationErrors,
];

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================

export default {
  validateCreateCuadrante,
  validateUpdateCuadrante,
  validateCuadranteId,
  validateQueryCuadrantes,
  validateCambiarEstado,
  validateBusquedaGeoespacial,
  validateBuscarPorCodigo,
  validateBuscarPorSector,
  handleValidationErrors,
};
