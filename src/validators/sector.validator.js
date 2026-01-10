/**
 * ===================================================
 * VALIDADORES: Sectores
 * ===================================================
 *
 * Ruta: src/validators/sector.validator.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-14
 *
 * Descripción:
 * Validadores centralizados y reutilizables para el módulo de Sectores.
 * Utiliza express-validator para validaciones robustas y mensajes claros.
 *
 * Características:
 * - Validadores atómicos reutilizables
 * - Validadores compuestos por endpoint
 * - Mensajes de error descriptivos
 * - Validaciones de negocio
 * - Manejo centralizado de errores
 * - Importa constantes desde constants/validations.js ✅
 *
 * @module validators/sector.validator
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
  PATTERNS,
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
 * Validar ID de sector
 */
export const validarSectorId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de sector debe ser un número positivo");

/**
 * Validar código de sector
 */
export const validarCodigoSector = (opcional = true) => {
  const validator = body("sector_code")
    .trim()
    .isLength({ max: LIMITES_TEXTO.SECTOR_CODE_MAX })
    .withMessage(
      `El código no puede exceder ${LIMITES_TEXTO.SECTOR_CODE_MAX} caracteres`
    )
    .matches(PATTERNS.SECTOR_CODE)
    .withMessage("Formato de código inválido (solo letras, números y guiones)");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El código del sector es requerido");
};

/**
 * Validar nombre del sector
 */
export const validarNombreSector = (opcional = false) => {
  const validator = body("nombre")
    .trim()
    .isLength({
      min: LIMITES_TEXTO.SECTOR_NOMBRE_MIN,
      max: LIMITES_TEXTO.SECTOR_NOMBRE_MAX,
    })
    .withMessage(
      `El nombre debe tener entre ${LIMITES_TEXTO.SECTOR_NOMBRE_MIN} y ${LIMITES_TEXTO.SECTOR_NOMBRE_MAX} caracteres`
    );

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El nombre del sector es requerido");
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
 * Validar código de ubigeo
 */
export const validarUbigeo = () =>
  body("ubigeo")
    .optional()
    .trim()
    .matches(PATTERNS.UBIGEO)
    .withMessage("El ubigeo debe tener exactamente 6 dígitos");

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
 * Validar supervisor_id
 */
export const validarSupervisorId = () =>
  body("supervisor_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID del supervisor debe ser un número positivo");

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
 * Validar color hexadecimal para mapa
 */
export const validarColorMapa = () =>
  body("color_mapa")
    .optional()
    .trim()
    .matches(PATTERNS.COLOR_HEX)
    .withMessage("El color debe estar en formato hexadecimal (#RRGGBB)");

/**
 * Validar estado (query param)
 */
export const validarEstadoQuery = () =>
  query("estado")
    .optional()
    .isIn(["0", "1", "true", "false"])
    .withMessage("El estado debe ser 0, 1, true o false");

/**
 * Validar zona_code (query param)
 */
export const validarZonaCodeQuery = () =>
  query("zona_code")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.ZONA_CODE_MAX })
    .withMessage(
      `El código de zona no puede exceder ${LIMITES_TEXTO.ZONA_CODE_MAX} caracteres`
    );

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

// ==========================================
// VALIDADORES COMPUESTOS (POR ENDPOINT)
// ==========================================

/**
 * Validación completa para crear sector
 * POST /api/v1/sectores
 */
export const validateCreateSector = [
  validarCodigoSector(true), // Opcional porque se puede generar automáticamente
  validarNombreSector(false), // Requerido
  validarDescripcion(),
  validarUbigeo(),
  validarZonaCode(),
  validarSupervisorId(),
  validarPoligonoJSON(),
  validarColorMapa(),
  handleValidationErrors,
];

/**
 * Validación para actualizar sector
 * PUT /api/v1/sectores/:id
 */
export const validateUpdateSector = [
  validarSectorId(),
  validarCodigoSector(true),
  validarNombreSector(true), // Opcional en update
  validarDescripcion(),
  validarUbigeo(),
  validarZonaCode(),
  validarSupervisorId(),
  validarPoligonoJSON(),
  validarColorMapa(),
  handleValidationErrors,
];

/**
 * Validación simple de ID
 * GET /api/v1/sectores/:id
 * DELETE /api/v1/sectores/:id
 */
export const validateSectorId = [validarSectorId(), handleValidationErrors];

/**
 * Validación de query params para listar
 * GET /api/v1/sectores
 */
export const validateQuerySectores = [
  validarEstadoQuery(),
  validarZonaCodeQuery(),
  validarPage(),
  validarLimit(),
  validarSearch(),
  handleValidationErrors,
];

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================

export default {
  validateCreateSector,
  validateUpdateSector,
  validateSectorId,
  validateQuerySectores,
  handleValidationErrors,
};
