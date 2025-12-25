/**
 * ============================================================================
 * ARCHIVO: src/validators/direccion.validator.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Validadores para direcciones normalizadas
 *              Validación de datos de entrada usando express-validator
 * ============================================================================
 *
 * PROPÓSITO:
 * - Validar datos de entrada para direcciones normalizadas
 * - Validar sistema dual (numeración municipal O Mz/Lote)
 * - Validar coordenadas GPS (latitud, longitud)
 * - Validar tipos de complemento (DEPTO, OFICINA, etc.)
 * - Retornar errores descriptivos y consistentes
 *
 * VALIDADORES EXPORTADOS:
 * - validateCreateDireccion: Validación para crear dirección
 * - validateUpdateDireccion: Validación para actualizar dirección
 * - validateDireccionId: Validación de ID en parámetros
 * - validateGeocodificar: Validación para actualizar coordenadas GPS
 * - validateValidarDireccion: Validación para validar sin guardar
 *
 * REGLAS DE VALIDACIÓN:
 * - calle_id: Integer, obligatorio, >= 1
 * - numero_municipal O (manzana + lote): Al menos uno es obligatorio
 * - tipo_complemento: ENUM, opcional
 * - latitud: Decimal -90 a 90, opcional
 * - longitud: Decimal -180 a 180, opcional
 *
 * VALIDACIONES ESPECIALES:
 * - Debe tener numero_municipal O (manzana + lote)
 * - Si tiene coordenadas, deben estar en rangos válidos
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import { body, param, validationResult } from "express-validator";

/**
 * ============================================================================
 * CONSTANTES - ENUMS VÁLIDOS
 * ============================================================================
 */

const TIPOS_COMPLEMENTO = [
  "DEPTO",
  "OFICINA",
  "PISO",
  "INTERIOR",
  "LOTE",
  "MZ",
  "BLOCK",
  "TORRE",
  "CASA",
];

/**
 * ============================================================================
 * MIDDLEWARE PARA MANEJAR ERRORES DE VALIDACIÓN
 * ============================================================================
 */

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * ============================================================================
 * VALIDADORES PARA CREAR DIRECCIÓN
 * ============================================================================
 */

/**
 * Validación para crear nueva dirección
 * Campos requeridos: calle_id, (numero_municipal O manzana+lote)
 * Campos opcionales: urbanizacion, tipo_complemento, latitud, longitud, etc.
 *
 * @example
 * POST /api/direcciones
 * Body: {
 *   "calle_id": 5,
 *   "numero_municipal": "450-A",
 *   "urbanizacion": "AAHH Villa El Salvador",
 *   "tipo_complemento": "DEPTO",
 *   "numero_complemento": "201"
 * }
 */
export const validateCreateDireccion = [
  // ============================================
  // VALIDACIÓN: calle_id (OBLIGATORIO)
  // ============================================
  body("calle_id")
    .notEmpty()
    .withMessage("El ID de la calle es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El ID de la calle debe ser un número entero positivo")
    .toInt(),

  // ============================================
  // VALIDACIÓN: numero_municipal (OPCIONAL pero debe cumplir con sistema dual)
  // ============================================
  body("numero_municipal")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El número municipal debe ser texto")
    .trim()
    .isLength({ max: 20 })
    .withMessage("El número municipal no puede exceder 20 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN: manzana (OPCIONAL pero debe cumplir con sistema dual)
  // ============================================
  body("manzana")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La manzana debe ser texto")
    .trim()
    .isLength({ max: 10 })
    .withMessage("La manzana no puede exceder 10 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN: lote (OPCIONAL pero debe cumplir con sistema dual)
  // ============================================
  body("lote")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El lote debe ser texto")
    .trim()
    .isLength({ max: 10 })
    .withMessage("El lote no puede exceder 10 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN PERSONALIZADA: Sistema dual
  // Debe tener numero_municipal O (manzana + lote)
  // ============================================
  body("numero_municipal").custom((value, { req }) => {
    const tieneNumeroMunicipal = value && value.trim() !== "";
    const tieneManzana = req.body.manzana && req.body.manzana.trim() !== "";
    const tieneLote = req.body.lote && req.body.lote.trim() !== "";
    const tieneManzanaLote = tieneManzana && tieneLote;

    if (!tieneNumeroMunicipal && !tieneManzanaLote) {
      throw new Error("Debe proporcionar numero_municipal O (manzana + lote)");
    }

    return true;
  }),

  // Validación cruzada para manzana
  body("manzana").custom((value, { req }) => {
    const tieneManzana = value && value.trim() !== "";
    const tieneLote = req.body.lote && req.body.lote.trim() !== "";

    // Si tiene manzana, debe tener lote (a menos que tenga numero_municipal)
    if (tieneManzana && !tieneLote) {
      const tieneNumeroMunicipal =
        req.body.numero_municipal && req.body.numero_municipal.trim() !== "";
      if (!tieneNumeroMunicipal) {
        throw new Error(
          "Si especifica manzana, debe especificar también lote (o numero_municipal)"
        );
      }
    }

    return true;
  }),

  // Validación cruzada para lote
  body("lote").custom((value, { req }) => {
    const tieneLote = value && value.trim() !== "";
    const tieneManzana = req.body.manzana && req.body.manzana.trim() !== "";

    // Si tiene lote, debe tener manzana (a menos que tenga numero_municipal)
    if (tieneLote && !tieneManzana) {
      const tieneNumeroMunicipal =
        req.body.numero_municipal && req.body.numero_municipal.trim() !== "";
      if (!tieneNumeroMunicipal) {
        throw new Error(
          "Si especifica lote, debe especificar también manzana (o numero_municipal)"
        );
      }
    }

    return true;
  }),

  // ============================================
  // VALIDACIÓN: urbanizacion (OPCIONAL)
  // ============================================
  body("urbanizacion")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La urbanización debe ser texto")
    .trim()
    .isLength({ max: 150 })
    .withMessage("La urbanización no puede exceder 150 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: tipo_complemento (OPCIONAL - ENUM)
  // ============================================
  body("tipo_complemento")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El tipo de complemento debe ser texto")
    .isIn(TIPOS_COMPLEMENTO)
    .withMessage(
      `El tipo de complemento debe ser uno de: ${TIPOS_COMPLEMENTO.join(", ")}`
    )
    .toUpperCase(),

  // ============================================
  // VALIDACIÓN: numero_complemento (OPCIONAL)
  // ============================================
  body("numero_complemento")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El número de complemento debe ser texto")
    .trim()
    .isLength({ max: 20 })
    .withMessage("El número de complemento no puede exceder 20 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN: referencia (OPCIONAL)
  // ============================================
  body("referencia")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La referencia debe ser texto")
    .trim()
    .isLength({ max: 500 })
    .withMessage("La referencia no puede exceder 500 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: ubigeo_code (OPCIONAL)
  // ============================================
  body("ubigeo_code")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("El código UBIGEO debe tener exactamente 6 caracteres")
    .matches(/^\d{6}$/)
    .withMessage("El código UBIGEO debe contener solo números"),

  // ============================================
  // VALIDACIÓN: latitud (OPCIONAL - COORDENADAS GPS)
  // ============================================
  body("latitud")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("La latitud debe ser un número entre -90 y 90")
    .toFloat()
    .customSanitizer((value) => {
      // Limitar a 8 decimales
      return value ? parseFloat(value.toFixed(8)) : null;
    }),

  // ============================================
  // VALIDACIÓN: longitud (OPCIONAL - COORDENADAS GPS)
  // ============================================
  body("longitud")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("La longitud debe ser un número entre -180 y 180")
    .toFloat()
    .customSanitizer((value) => {
      // Limitar a 8 decimales
      return value ? parseFloat(value.toFixed(8)) : null;
    }),

  // ============================================
  // VALIDACIÓN: observaciones (OPCIONAL)
  // ============================================
  body("observaciones")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones no pueden exceder 1000 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * VALIDADORES PARA ACTUALIZAR DIRECCIÓN
 * ============================================================================
 */

/**
 * Validación para actualizar una dirección existente
 * Todos los campos son opcionales (solo se actualiza lo que se envía)
 *
 * @example
 * PUT /api/direcciones/1
 * Body: {
 *   "numero_municipal": "450-B",
 *   "referencia": "Esquina con Av. Principal"
 * }
 */
export const validateUpdateDireccion = [
  // ============================================
  // VALIDACIÓN: calle_id (OPCIONAL)
  // ============================================
  body("calle_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID de la calle debe ser un número entero positivo")
    .toInt(),

  // ============================================
  // VALIDACIÓN: numero_municipal (OPCIONAL)
  // ============================================
  body("numero_municipal")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage("El número municipal no puede exceder 20 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN: manzana (OPCIONAL)
  // ============================================
  body("manzana")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage("La manzana no puede exceder 10 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN: lote (OPCIONAL)
  // ============================================
  body("lote")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage("El lote no puede exceder 10 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN: urbanizacion (OPCIONAL)
  // ============================================
  body("urbanizacion")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 150 })
    .withMessage("La urbanización no puede exceder 150 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: tipo_complemento (OPCIONAL - ENUM)
  // ============================================
  body("tipo_complemento")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(TIPOS_COMPLEMENTO)
    .withMessage(
      `El tipo de complemento debe ser uno de: ${TIPOS_COMPLEMENTO.join(", ")}`
    )
    .toUpperCase(),

  // ============================================
  // VALIDACIÓN: numero_complemento (OPCIONAL)
  // ============================================
  body("numero_complemento")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage("El número de complemento no puede exceder 20 caracteres")
    .customSanitizer((value) => (value ? value.trim().toUpperCase() : null)),

  // ============================================
  // VALIDACIÓN: referencia (OPCIONAL)
  // ============================================
  body("referencia")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La referencia no puede exceder 500 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: latitud (OPCIONAL)
  // ============================================
  body("latitud")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("La latitud debe ser un número entre -90 y 90")
    .toFloat()
    .customSanitizer((value) => (value ? parseFloat(value.toFixed(8)) : null)),

  // ============================================
  // VALIDACIÓN: longitud (OPCIONAL)
  // ============================================
  body("longitud")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("La longitud debe ser un número entre -180 y 180")
    .toFloat()
    .customSanitizer((value) => (value ? parseFloat(value.toFixed(8)) : null)),

  // ============================================
  // VALIDACIÓN: observaciones (OPCIONAL)
  // ============================================
  body("observaciones")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones no pueden exceder 1000 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: verificada (OPCIONAL)
  // ============================================
  body("verificada")
    .optional()
    .isInt({ min: 0, max: 1 })
    .withMessage("verificada debe ser 0 (no) o 1 (sí)")
    .toInt(),

  // ============================================
  // VALIDACIÓN: estado (OPCIONAL)
  // ============================================
  body("estado")
    .optional()
    .isInt({ min: 0, max: 1 })
    .withMessage("El estado debe ser 0 (inactivo) o 1 (activo)")
    .toInt(),

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * VALIDADORES PARA PARÁMETROS DE RUTA
 * ============================================================================
 */

/**
 * Validación de ID en parámetros de ruta
 */
export const validateDireccionId = [
  param("id")
    .notEmpty()
    .withMessage("El ID es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El ID debe ser un número entero positivo")
    .toInt(),

  handleValidationErrors,
];

/**
 * ============================================================================
 * VALIDADOR PARA GEOCODIFICAR
 * ============================================================================
 */

/**
 * Validación para actualizar coordenadas GPS
 * Usado en: PATCH /api/direcciones/:id/geocodificar
 *
 * @example
 * PATCH /api/direcciones/1/geocodificar
 * Body: {
 *   "latitud": -12.04637800,
 *   "longitud": -77.03066400,
 *   "fuente": "Google Maps"
 * }
 */
export const validateGeocodificar = [
  // ============================================
  // VALIDACIÓN: latitud (OBLIGATORIO)
  // ============================================
  body("latitud")
    .notEmpty()
    .withMessage("La latitud es obligatoria")
    .isFloat({ min: -90, max: 90 })
    .withMessage("La latitud debe ser un número entre -90 y 90")
    .toFloat()
    .customSanitizer((value) => parseFloat(value.toFixed(8))),

  // ============================================
  // VALIDACIÓN: longitud (OBLIGATORIO)
  // ============================================
  body("longitud")
    .notEmpty()
    .withMessage("La longitud es obligatoria")
    .isFloat({ min: -180, max: 180 })
    .withMessage("La longitud debe ser un número entre -180 y 180")
    .toFloat()
    .customSanitizer((value) => parseFloat(value.toFixed(8))),

  // ============================================
  // VALIDACIÓN: fuente (OPCIONAL)
  // ============================================
  body("fuente")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("La fuente no puede exceder 50 caracteres")
    .customSanitizer((value) => (value ? value.trim() : "Manual")),

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * VALIDADOR PARA VALIDAR DIRECCIÓN SIN GUARDAR
 * ============================================================================
 */

/**
 * Validación para validar dirección sin guardar
 * Usado en: POST /api/direcciones/validar
 *
 * @example
 * POST /api/direcciones/validar
 * Body: {
 *   "calle_id": 5,
 *   "numero_municipal": "450"
 * }
 */
export const validateValidarDireccion = [
  // ============================================
  // VALIDACIÓN: calle_id (OBLIGATORIO)
  // ============================================
  body("calle_id")
    .notEmpty()
    .withMessage("El ID de la calle es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El ID de la calle debe ser un número entero positivo")
    .toInt(),

  // ============================================
  // VALIDACIÓN: numero_municipal (OPCIONAL)
  // ============================================
  body("numero_municipal")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage("El número municipal no puede exceder 20 caracteres"),

  // ============================================
  // VALIDACIÓN: manzana (OPCIONAL)
  // ============================================
  body("manzana")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage("La manzana no puede exceder 10 caracteres"),

  // ============================================
  // VALIDACIÓN: lote (OPCIONAL)
  // ============================================
  body("lote")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 10 })
    .withMessage("El lote no puede exceder 10 caracteres"),

  // ============================================
  // VALIDACIÓN PERSONALIZADA: Sistema dual
  // ============================================
  body("numero_municipal").custom((value, { req }) => {
    const tieneNumeroMunicipal = value && value.trim() !== "";
    const tieneManzana = req.body.manzana && req.body.manzana.trim() !== "";
    const tieneLote = req.body.lote && req.body.lote.trim() !== "";
    const tieneManzanaLote = tieneManzana && tieneLote;

    if (!tieneNumeroMunicipal && !tieneManzanaLote) {
      throw new Error("Debe proporcionar numero_municipal O (manzana + lote)");
    }

    return true;
  }),

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * EXPORTACIÓN POR DEFECTO
 * ============================================================================
 */

export default {
  validateCreateDireccion,
  validateUpdateDireccion,
  validateDireccionId,
  validateGeocodificar,
  validateValidarDireccion,
};

/**
 * NOTAS DE USO:
 *
 * 1. ENUM VÁLIDO:
 *    - tipo_complemento: DEPTO, OFICINA, PISO, INTERIOR, LOTE, MZ, BLOCK, TORRE, CASA
 *
 * 2. SISTEMA DUAL DE DIRECCIONAMIENTO:
 *    - OPCIÓN 1: numero_municipal (ej: "450", "450-A", "S/N")
 *    - OPCIÓN 2: manzana + lote (ej: manzana="M", lote="15")
 *    - VÁLIDO: Tener ambos sistemas a la vez
 *    - INVÁLIDO: No tener ninguno de los dos
 *
 * 3. COORDENADAS GPS:
 *    - latitud: -90 a 90 (8 decimales)
 *    - longitud: -180 a 180 (8 decimales)
 *    - Perú típicamente: latitud -18 a 0, longitud -81 a -68
 *
 * 4. SANITIZACIÓN AUTOMÁTICA:
 *    - numero_municipal: MAYÚSCULAS + trim
 *    - manzana, lote: MAYÚSCULAS + trim
 *    - numero_complemento: MAYÚSCULAS + trim
 *    - Coordenadas: Limitadas a 8 decimales
 *
 * 5. CASOS DE USO:
 *    - validateCreateDireccion: Para crear nueva dirección
 *    - validateValidarDireccion: Para validar sin guardar (retorna cuadrante/sector)
 *    - validateGeocodificar: Para actualizar solo coordenadas GPS
 *
 * 6. EJEMPLOS VÁLIDOS:
 *    - { calle_id: 5, numero_municipal: "450" }
 *    - { calle_id: 5, manzana: "M", lote: "15" }
 *    - { calle_id: 5, numero_municipal: "450", manzana: "M", lote: "15" }
 *
 * 7. EJEMPLOS INVÁLIDOS:
 *    - { calle_id: 5 } // Falta numero_municipal O manzana+lote
 *    - { calle_id: 5, manzana: "M" } // Falta lote
 *    - { calle_id: 5, lote: "15" } // Falta manzana
 */
