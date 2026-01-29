/**
 * ===================================================
 * VALIDADORES: Unidades/Oficinas
 * ===================================================
 *
 * Ruta: src/validators/unidad-oficina.validator.js
 *
 * VERSIÓN: 1.0.1 (CORREGIDO - ALINEADO CON BD)
 * FECHA: 2025-12-15
 *
 * Descripción:
 * Validadores centralizados para el catálogo de Unidades/Oficinas.
 * Unidades operativas que atienden novedades (Serenazgo, PNP, Bomberos, etc.)
 *
 * @module validators/unidad-oficina.validator
 * @version 1.0.1
 */

import { body, param, query, validationResult } from "express-validator";

// ==========================================
// CONSTANTES
// ==========================================

const TIPOS_UNIDAD = [
  "SERENAZGO",
  "PNP",
  "BOMBEROS",
  "AMBULANCIA",
  "DEFENSA_CIVIL",
  "TRANSITO",
  "OTROS",
];

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

export const validarUnidadOficinaId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de unidad debe ser un número positivo");

export const validarNombre = (opcional = false) => {
  const validator = body("nombre")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El nombre es requerido");
};

export const validarCodigo = (opcional = true) => {
  const validator = body("codigo")
    .trim()
    .toUpperCase()
    .isLength({ min: 2, max: 20 })
    .withMessage("El código debe tener entre 2 y 20 caracteres")
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage(
      "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos"
    );

  return opcional ? validator.optional() : validator.notEmpty();
};

export const validarTipoUnidad = (opcional = false) => {
  const validator = body("tipo_unidad")
    .trim()
    .isIn(TIPOS_UNIDAD)
    .withMessage(`El tipo de unidad debe ser: ${TIPOS_UNIDAD.join(", ")}`);

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El tipo de unidad es requerido");
};

export const validarUbigeo = (opcional = true) => {
  const validator = body("ubigeo")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("El código de ubigeo debe tener 6 caracteres")
    .matches(/^\d{6}$/)
    .withMessage("El código de ubigeo debe contener solo números");

  return opcional ? validator.optional() : validator.notEmpty();
};

export const validarDireccion = () =>
  body("direccion")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("La dirección no puede exceder 255 caracteres");

export const validarTelefono = () =>
  body("telefono")
    .optional()
    .trim()
    .matches(/^[0-9\s\-+()]+$/)
    .withMessage("El teléfono contiene caracteres inválidos")
    .isLength({ max: 20 })
    .withMessage("El teléfono no puede exceder 20 caracteres");

export const validarEmail = () =>
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("El email no tiene un formato válido")
    .isLength({ max: 100 })
    .withMessage("El email no puede exceder 100 caracteres");

export const validarLatitud = () =>
  body("latitud")
    .optional()
    .isDecimal()
    .withMessage("La latitud debe ser un número decimal")
    .custom((value) => {
      const lat = parseFloat(value);
      if (lat < -90 || lat > 90) {
        throw new Error("La latitud debe estar entre -90 y 90");
      }
      return true;
    });

export const validarLongitud = () =>
  body("longitud")
    .optional()
    .isDecimal()
    .withMessage("La longitud debe ser un número decimal")
    .custom((value) => {
      const lng = parseFloat(value);
      if (lng < -180 || lng > 180) {
        throw new Error("La longitud debe estar entre -180 y 180");
      }
      return true;
    });

export const validarRadioCobertura = () =>
  body("radio_cobertura_km")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El radio de cobertura debe ser un número decimal")
    .custom((value) => {
      const radio = parseFloat(value);
      if (radio < 0 || radio > 999.99) {
        throw new Error("El radio debe estar entre 0 y 999.99 km");
      }
      return true;
    });

export const validarActivo24h = () =>
  body("activo_24h")
    .optional()
    .isBoolean()
    .withMessage("activo_24h debe ser true o false");

export const validarHorarioInicio = () =>
  body("horario_inicio")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage("El horario de inicio debe estar en formato HH:MM:SS");

export const validarHorarioFin = () =>
  body("horario_fin")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage("El horario de fin debe estar en formato HH:MM:SS");

export const validarEstado = () =>
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser true o false");

// ==========================================
// VALIDADORES DE QUERY
// ==========================================

export const validarTipoUnidadQuery = () =>
  query("tipo_unidad")
    .optional({ checkFalsy: true })
    .isIn(TIPOS_UNIDAD)
    .withMessage(`El tipo debe ser: ${TIPOS_UNIDAD.join(", ")}`);

export const validarEstadoQuery = () =>
  query("estado")
    .optional({ checkFalsy: true })
    .isIn(["0", "1", "true", "false"])
    .withMessage("El estado debe ser 0, 1, true o false");

export const validarActivo24hQuery = () =>
  query("activo_24h")
    .optional({ checkFalsy: true })
    .isIn(["0", "1", "true", "false"])
    .withMessage("activo_24h debe ser 0, 1, true o false");

export const validarSearch = () =>
  query("search")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("La búsqueda no puede exceder 100 caracteres");

export const validarUbigeoQuery = () =>
  query("ubigeo")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("El código de ubigeo debe tener 6 dígitos");

// ==========================================
// VALIDADORES COMPUESTOS
// ==========================================

/**
 * POST /api/v1/unidades-oficina
 */
export const validateCreate = [
  validarNombre(false),
  validarTipoUnidad(false),
  validarCodigo(true),
  validarUbigeo(true),
  validarDireccion(),
  validarTelefono(),
  validarEmail(),
  validarLatitud(),
  validarLongitud(),
  validarRadioCobertura(),
  validarActivo24h(),
  validarHorarioInicio(),
  validarHorarioFin(),
  handleValidationErrors,
];

/**
 * PUT /api/v1/unidades-oficina/:id
 */
export const validateUpdate = [
  validarUnidadOficinaId(),
  validarNombre(true),
  validarTipoUnidad(true),
  validarCodigo(true),
  validarUbigeo(true),
  validarDireccion(),
  validarTelefono(),
  validarEmail(),
  validarLatitud(),
  validarLongitud(),
  validarRadioCobertura(),
  validarActivo24h(),
  validarHorarioInicio(),
  validarHorarioFin(),
  validarEstado(),
  handleValidationErrors,
];

/**
 * GET/DELETE /api/v1/unidades-oficina/:id
 */
export const validateId = [validarUnidadOficinaId(), handleValidationErrors];

/**
 * GET /api/v1/unidades-oficina
 */
export const validateQuery = [
  validarTipoUnidadQuery(),
  validarEstadoQuery(),
  validarActivo24hQuery(),
  validarUbigeoQuery(),
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
  TIPOS_UNIDAD, // Exportar para uso en otros módulos
};
