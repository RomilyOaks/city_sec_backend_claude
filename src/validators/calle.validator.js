/**
 * ============================================================================
 * ARCHIVO: src/validators/calle.validator.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Validadores para calles
 *              Validación de datos de entrada usando express-validator
 * ============================================================================
 *
 * PROPÓSITO:
 * - Validar datos de entrada para operaciones CRUD de calles
 * - Sanitizar y normalizar datos antes de procesarlos
 * - Validar tipos de datos complejos (ENUM, decimales)
 * - Retornar errores descriptivos y consistentes
 *
 * VALIDADORES EXPORTADOS:
 * - validateCreateCalle: Validación para crear calle
 * - validateUpdateCalle: Validación para actualizar calle
 * - validateCalleId: Validación de ID en parámetros de ruta
 *
 * REGLAS DE VALIDACIÓN:
 * - tipo_via_id: Integer, obligatorio, >= 1
 * - nombre_via: String 2-200 caracteres, obligatorio
 * - ubigeo_code: String 6 caracteres, opcional
 * - urbanizacion: String opcional, máximo 150 caracteres
 * - longitud_metros: Decimal positivo, opcional
 * - tipo_pavimento: ENUM, opcional
 * - categoria_via: ENUM, opcional
 * - es_principal: Integer 0 o 1, opcional
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

const TIPOS_PAVIMENTO = [
  "ASFALTO",
  "CONCRETO",
  "AFIRMADO",
  "TROCHA",
  "ADOQUIN",
  "SIN_PAVIMENTO",
];
const SENTIDOS_VIA = ["UNA_VIA", "DOBLE_VIA", "VARIABLE"];
const CATEGORIAS_VIA = ["ARTERIAL", "COLECTORA", "LOCAL", "RESIDENCIAL"];

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
 * VALIDADORES PARA CREAR CALLE
 * ============================================================================
 */

/**
 * Validación para crear una nueva calle
 * Campos requeridos: tipo_via_id, nombre_via
 * Campos opcionales: ubigeo_code, urbanizacion, longitud_metros, etc.
 *
 * @example
 * POST /api/calles
 * Body: {
 *   "tipo_via_id": 1,
 *   "nombre_via": "Ejército",
 *   "urbanizacion": "AAHH Villa El Salvador",
 *   "categoria_via": "ARTERIAL",
 *   "es_principal": 1
 * }
 */
export const validateCreateCalle = [
  // ============================================
  // VALIDACIÓN: tipo_via_id (OBLIGATORIO)
  // ============================================
  body("tipo_via_id")
    .notEmpty()
    .withMessage("El tipo de vía es obligatorio")
    .isInt({ min: 1 })
    .withMessage(
      "El tipo de vía debe ser un ID válido (número entero positivo)"
    )
    .toInt(),

  // ============================================
  // VALIDACIÓN: nombre_via (OBLIGATORIO)
  // ============================================
  body("nombre_via")
    .notEmpty()
    .withMessage("El nombre de la vía es obligatorio")
    .isString()
    .withMessage("El nombre de la vía debe ser texto")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre de la vía debe tener entre 2 y 200 caracteres")
    .customSanitizer((value) => {
      // Capitalizar primera letra de cada palabra
      return value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }),

  // ============================================
  // VALIDACIÓN: ubigeo_code (OPCIONAL)
  // ============================================
  body("ubigeo_code")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El código UBIGEO debe ser texto")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("El código UBIGEO debe tener exactamente 6 caracteres")
    .matches(/^\d{6}$/)
    .withMessage("El código UBIGEO debe contener solo números"),

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
  // VALIDACIÓN: zona (OPCIONAL)
  // ============================================
  body("zona")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La zona debe ser texto")
    .trim()
    .isLength({ max: 100 })
    .withMessage("La zona no puede exceder 100 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: longitud_metros (OPCIONAL)
  // ============================================
  body("longitud_metros")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("La longitud debe ser un número positivo")
    .toFloat(),

  // ============================================
  // VALIDACIÓN: ancho_metros (OPCIONAL)
  // ============================================
  body("ancho_metros")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("El ancho debe ser un número positivo")
    .toFloat(),

  // ============================================
  // VALIDACIÓN: tipo_pavimento (OPCIONAL - ENUM)
  // ============================================
  body("tipo_pavimento")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El tipo de pavimento debe ser texto")
    .isIn(TIPOS_PAVIMENTO)
    .withMessage(
      `El tipo de pavimento debe ser uno de: ${TIPOS_PAVIMENTO.join(", ")}`
    ),

  // ============================================
  // VALIDACIÓN: sentido_via (OPCIONAL - ENUM)
  // ============================================
  body("sentido_via")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El sentido de vía debe ser texto")
    .isIn(SENTIDOS_VIA)
    .withMessage(
      `El sentido de vía debe ser uno de: ${SENTIDOS_VIA.join(", ")}`
    ),

  // ============================================
  // VALIDACIÓN: carriles (OPCIONAL)
  // ============================================
  body("carriles")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 20 })
    .withMessage("El número de carriles debe ser un entero entre 0 y 20")
    .toInt(),

  // ============================================
  // VALIDACIÓN: interseccion_inicio (OPCIONAL)
  // ============================================
  body("interseccion_inicio")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La intersección de inicio debe ser texto")
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de inicio no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: interseccion_fin (OPCIONAL)
  // ============================================
  body("interseccion_fin")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La intersección de fin debe ser texto")
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de fin no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: observaciones (OPCIONAL)
  // ============================================
  body("observaciones")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("Las observaciones deben ser texto")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones no pueden exceder 1000 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: es_principal (OPCIONAL)
  // ============================================
  body("es_principal")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 1 })
    .withMessage("es_principal debe ser 0 (no) o 1 (sí)")
    .toInt(),

  // ============================================
  // VALIDACIÓN: categoria_via (OPCIONAL - ENUM)
  // ============================================
  body("categoria_via")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La categoría de vía debe ser texto")
    .isIn(CATEGORIAS_VIA)
    .withMessage(
      `La categoría de vía debe ser una de: ${CATEGORIAS_VIA.join(", ")}`
    ),

  // ============================================
  // VALIDACIÓN: linea_geometria_json (OPCIONAL - JSON)
  // ============================================
  body("linea_geometria_json")
    .optional({ nullable: true })
    .custom((value) => {
      // Validar que sea un objeto JSON válido
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          throw new Error("linea_geometria_json debe ser un JSON válido");
        }
      }
      // Si ya es un objeto, está bien
      if (typeof value === "object") {
        return true;
      }
      throw new Error("linea_geometria_json debe ser un JSON válido");
    }),

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * VALIDADORES PARA ACTUALIZAR CALLE
 * ============================================================================
 */

/**
 * Validación para actualizar una calle existente
 * Todos los campos son opcionales (solo se actualiza lo que se envía)
 *
 * @example
 * PUT /api/calles/1
 * Body: {
 *   "nombre_via": "Ejército Principal",
 *   "categoria_via": "ARTERIAL",
 *   "longitud_metros": 1500.50
 * }
 */
export const validateUpdateCalle = [
  // ============================================
  // VALIDACIÓN: tipo_via_id (OPCIONAL)
  // ============================================
  body("tipo_via_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El tipo de vía debe ser un ID válido")
    .toInt(),

  // ============================================
  // VALIDACIÓN: nombre_via (OPCIONAL)
  // ============================================
  body("nombre_via")
    .optional()
    .isString()
    .withMessage("El nombre de la vía debe ser texto")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre de la vía debe tener entre 2 y 200 caracteres")
    .customSanitizer((value) => {
      return value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }),

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
  // VALIDACIÓN: zona (OPCIONAL)
  // ============================================
  body("zona")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La zona no puede exceder 100 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: longitud_metros (OPCIONAL)
  // ============================================
  body("longitud_metros")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("La longitud debe ser un número positivo")
    .toFloat(),

  // ============================================
  // VALIDACIÓN: ancho_metros (OPCIONAL)
  // ============================================
  body("ancho_metros")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("El ancho debe ser un número positivo")
    .toFloat(),

  // ============================================
  // VALIDACIÓN: tipo_pavimento (OPCIONAL - ENUM)
  // ============================================
  body("tipo_pavimento")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(TIPOS_PAVIMENTO)
    .withMessage(
      `El tipo de pavimento debe ser uno de: ${TIPOS_PAVIMENTO.join(", ")}`
    ),

  // ============================================
  // VALIDACIÓN: sentido_via (OPCIONAL - ENUM)
  // ============================================
  body("sentido_via")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(SENTIDOS_VIA)
    .withMessage(
      `El sentido de vía debe ser uno de: ${SENTIDOS_VIA.join(", ")}`
    ),

  // ============================================
  // VALIDACIÓN: carriles (OPCIONAL)
  // ============================================
  body("carriles")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 20 })
    .withMessage("El número de carriles debe estar entre 0 y 20")
    .toInt(),

  // ============================================
  // VALIDACIÓN: interseccion_inicio (OPCIONAL)
  // ============================================
  body("interseccion_inicio")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de inicio no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: interseccion_fin (OPCIONAL)
  // ============================================
  body("interseccion_fin")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de fin no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

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
  // VALIDACIÓN: es_principal (OPCIONAL)
  // ============================================
  body("es_principal")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 1 })
    .withMessage("es_principal debe ser 0 o 1")
    .toInt(),

  // ============================================
  // VALIDACIÓN: categoria_via (OPCIONAL - ENUM)
  // ============================================
  body("categoria_via")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(CATEGORIAS_VIA)
    .withMessage(
      `La categoría de vía debe ser una de: ${CATEGORIAS_VIA.join(", ")}`
    ),

  // ============================================
  // VALIDACIÓN: estado (OPCIONAL)
  // ============================================
  body("estado")
    .optional()
    .isInt({ min: 0, max: 1 })
    .withMessage("El estado debe ser 0 (inactivo) o 1 (activo)")
    .toInt(),

  // ============================================
  // VALIDACIÓN: linea_geometria_json (OPCIONAL - JSON)
  // ============================================
  body("linea_geometria_json")
    .optional({ nullable: true })
    .custom((value) => {
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          throw new Error("linea_geometria_json debe ser un JSON válido");
        }
      }
      if (typeof value === "object") {
        return true;
      }
      throw new Error("linea_geometria_json debe ser un JSON válido");
    }),

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
 * Usado en: GET /api/calles/:id, PUT /api/calles/:id, etc.
 *
 * @example
 * GET /api/calles/5
 * Params: { id: "5" }
 */
export const validateCalleId = [
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
 * EXPORTACIÓN POR DEFECTO
 * ============================================================================
 */

export default {
  validateCreateCalle,
  validateUpdateCalle,
  validateCalleId,
};

/**
 * NOTAS DE USO:
 *
 * 1. ENUMS VÁLIDOS:
 *    - tipo_pavimento: ASFALTO, CONCRETO, AFIRMADO, TROCHA, ADOQUIN, SIN_PAVIMENTO
 *    - sentido_via: UNA_VIA, DOBLE_VIA, VARIABLE
 *    - categoria_via: ARTERIAL, COLECTORA, LOCAL, RESIDENCIAL
 *
 * 2. SANITIZACIÓN AUTOMÁTICA:
 *    - nombre_via: Capitalizado automáticamente
 *    - ubigeo_code: Solo números, 6 dígitos
 *    - urbanizacion, zona: trim o null
 *    - Decimales: convertidos a float
 *
 * 3. VALIDACIÓN JSON:
 *    - linea_geometria_json acepta string JSON o objeto
 *    - Se valida que sea JSON parseabale
 *
 * 4. RANGOS NUMÉRICOS:
 *    - carriles: 0-20
 *    - longitud_metros: >= 0
 *    - es_principal: 0 o 1
 */
