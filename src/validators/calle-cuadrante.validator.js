/**
 * ============================================================================
 * ARCHIVO: src/validators/calle-cuadrante.validator.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Validadores para relaciones calle-cuadrante
 *              Validación de datos de entrada usando express-validator
 * ============================================================================
 *
 * PROPÓSITO:
 * - Validar datos de entrada para relaciones calle-cuadrante
 * - Validar rangos de numeración (numero_inicio, numero_fin)
 * - Validar lados de vía (PAR, IMPAR, AMBOS, TODOS)
 * - Retornar errores descriptivos y consistentes
 *
 * VALIDADORES EXPORTADOS:
 * - validateCreateCallesCuadrantes: Validación para crear relación
 * - validateUpdateCallesCuadrantes: Validación para actualizar relación
 * - validateCallesCuadrantesId: Validación de ID en parámetros
 * - validateBuscarCuadrante: Validación para buscar cuadrante por número
 *
 * REGLAS DE VALIDACIÓN:
 * - calle_id: Integer, obligatorio, >= 1
 * - cuadrante_id: Integer, obligatorio, >= 1
 * - numero_inicio: Integer, opcional, >= 0
 * - numero_fin: Integer, opcional, >= numero_inicio
 * - lado: ENUM (AMBOS, PAR, IMPAR, TODOS), opcional
 * - prioridad: Integer 1-10, opcional
 *
 * VALIDACIONES ESPECIALES:
 * - Si hay numero_inicio debe haber numero_fin y viceversa
 * - numero_fin debe ser >= numero_inicio
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

const LADOS_VIA = ["AMBOS", "PAR", "IMPAR", "TODOS"];

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
 * VALIDADORES PARA CREAR RELACIÓN CALLE-CUADRANTE
 * ============================================================================
 */

/**
 * Validación para crear nueva relación calle-cuadrante
 * Campos requeridos: calle_id, cuadrante_id
 * Campos opcionales: numero_inicio, numero_fin, lado, prioridad
 *
 * @example
 * POST /api/calles-cuadrantes
 * Body: {
 *   "calle_id": 5,
 *   "cuadrante_id": 12,
 *   "numero_inicio": 100,
 *   "numero_fin": 299,
 *   "lado": "AMBOS",
 *   "prioridad": 1
 * }
 */
export const validateCreateCallesCuadrantes = [
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
  // VALIDACIÓN: cuadrante_id (OBLIGATORIO)
  // ============================================
  body("cuadrante_id")
    .notEmpty()
    .withMessage("El ID del cuadrante es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El ID del cuadrante debe ser un número entero positivo")
    .toInt(),

  // ============================================
  // VALIDACIÓN: numero_inicio (OPCIONAL)
  // ============================================
  body("numero_inicio")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("El número inicial debe ser un entero mayor o igual a 0")
    .toInt(),

  // ============================================
  // VALIDACIÓN: numero_fin (OPCIONAL)
  // ============================================
  body("numero_fin")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("El número final debe ser un entero mayor o igual a 0")
    .toInt()
    .custom((value, { req }) => {
      // Validación: numero_fin debe ser >= numero_inicio
      if (value && req.body.numero_inicio && value < req.body.numero_inicio) {
        throw new Error(
          "El número final debe ser mayor o igual al número inicial"
        );
      }
      return true;
    }),

  // ============================================
  // VALIDACIÓN PERSONALIZADA: Rango completo
  // ============================================
  body("numero_inicio").custom((value, { req }) => {
    // Si hay numero_inicio, debe haber numero_fin
    if (value && !req.body.numero_fin) {
      throw new Error(
        "Si especifica número inicial, debe especificar también número final"
      );
    }
    return true;
  }),

  body("numero_fin").custom((value, { req }) => {
    // Si hay numero_fin, debe haber numero_inicio
    if (value && !req.body.numero_inicio) {
      throw new Error(
        "Si especifica número final, debe especificar también número inicial"
      );
    }
    return true;
  }),

  // ============================================
  // VALIDACIÓN: lado (OPCIONAL - ENUM)
  // ============================================
  body("lado")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("El lado debe ser texto")
    .isIn(LADOS_VIA)
    .withMessage(`El lado debe ser uno de: ${LADOS_VIA.join(", ")}`)
    .toUpperCase(),

  // ============================================
  // VALIDACIÓN: desde_interseccion (OPCIONAL)
  // ============================================
  body("desde_interseccion")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La intersección de inicio debe ser texto")
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de inicio no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: hasta_interseccion (OPCIONAL)
  // ============================================
  body("hasta_interseccion")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La intersección de fin debe ser texto")
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de fin no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: prioridad (OPCIONAL)
  // ============================================
  body("prioridad")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 10 })
    .withMessage("La prioridad debe ser un número entre 1 (mayor) y 10 (menor)")
    .toInt(),

  // ============================================
  // VALIDACIÓN: observaciones (OPCIONAL)
  // ============================================
  body("observaciones")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("Las observaciones deben ser texto")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Las observaciones no pueden exceder 500 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * VALIDADORES PARA ACTUALIZAR RELACIÓN CALLE-CUADRANTE
 * ============================================================================
 */

/**
 * Validación para actualizar una relación existente
 * Todos los campos son opcionales (solo se actualiza lo que se envía)
 *
 * @example
 * PUT /api/calles-cuadrantes/1
 * Body: {
 *   "numero_inicio": 100,
 *   "numero_fin": 399,
 *   "prioridad": 2
 * }
 */
export const validateUpdateCallesCuadrantes = [
  // ============================================
  // VALIDACIÓN: numero_inicio (OPCIONAL)
  // ============================================
  body("numero_inicio")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("El número inicial debe ser un entero mayor o igual a 0")
    .toInt(),

  // ============================================
  // VALIDACIÓN: numero_fin (OPCIONAL)
  // ============================================
  body("numero_fin")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("El número final debe ser un entero mayor o igual a 0")
    .toInt()
    .custom((value, { req }) => {
      // Validación: numero_fin debe ser >= numero_inicio si ambos están presentes
      if (value && req.body.numero_inicio && value < req.body.numero_inicio) {
        throw new Error(
          "El número final debe ser mayor o igual al número inicial"
        );
      }
      return true;
    }),

  // ============================================
  // VALIDACIÓN PERSONALIZADA: Rango completo
  // ============================================
  body("numero_inicio").custom((value, { req }) => {
    // Si hay numero_inicio, debe haber numero_fin
    if (value !== undefined && value !== null && !req.body.numero_fin) {
      throw new Error(
        "Si especifica número inicial, debe especificar también número final"
      );
    }
    return true;
  }),

  body("numero_fin").custom((value, { req }) => {
    // Si hay numero_fin, debe haber numero_inicio
    if (value !== undefined && value !== null && !req.body.numero_inicio) {
      throw new Error(
        "Si especifica número final, debe especificar también número inicial"
      );
    }
    return true;
  }),

  // ============================================
  // VALIDACIÓN: lado (OPCIONAL - ENUM)
  // ============================================
  body("lado")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isIn(LADOS_VIA)
    .withMessage(`El lado debe ser uno de: ${LADOS_VIA.join(", ")}`)
    .toUpperCase(),

  // ============================================
  // VALIDACIÓN: desde_interseccion (OPCIONAL)
  // ============================================
  body("desde_interseccion")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de inicio no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: hasta_interseccion (OPCIONAL)
  // ============================================
  body("hasta_interseccion")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La intersección de fin no puede exceder 200 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: prioridad (OPCIONAL)
  // ============================================
  body("prioridad")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 10 })
    .withMessage("La prioridad debe ser un número entre 1 y 10")
    .toInt(),

  // ============================================
  // VALIDACIÓN: observaciones (OPCIONAL)
  // ============================================
  body("observaciones")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Las observaciones no pueden exceder 500 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

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
 * Usado en: GET /api/calles-cuadrantes/:id, PUT /api/calles-cuadrantes/:id, etc.
 *
 * @example
 * GET /api/calles-cuadrantes/5
 * Params: { id: "5" }
 */
export const validateCallesCuadrantesId = [
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
 * VALIDADOR PARA BUSCAR CUADRANTE POR NÚMERO
 * ============================================================================
 */

/**
 * Validación para buscar cuadrante dado una calle y número
 * Usado en: POST /api/calles-cuadrantes/buscar-cuadrante
 *
 * @example
 * POST /api/calles-cuadrantes/buscar-cuadrante
 * Body: {
 *   "calle_id": 5,
 *   "numero": 450
 * }
 */
export const validateBuscarCuadrante = [
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
  // VALIDACIÓN: numero (OBLIGATORIO)
  // ============================================
  body("numero")
    .notEmpty()
    .withMessage("El número es obligatorio")
    .isInt({ min: 0 })
    .withMessage("El número debe ser un entero mayor o igual a 0")
    .toInt(),

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * EXPORTACIÓN POR DEFECTO
 * ============================================================================
 */

export default {
  validateCreateCallesCuadrantes,
  validateUpdateCallesCuadrantes,
  validateCallesCuadrantesId,
  validateBuscarCuadrante,
};

/**
 * NOTAS DE USO:
 *
 * 1. ENUM VÁLIDO:
 *    - lado: AMBOS, PAR, IMPAR, TODOS
 *    - AMBOS: Ambos lados de la calle
 *    - PAR: Solo números pares
 *    - IMPAR: Solo números impares
 *    - TODOS: Equivalente a AMBOS
 *
 * 2. VALIDACIÓN DE RANGOS:
 *    - Si se especifica numero_inicio, numero_fin es obligatorio
 *    - Si se especifica numero_fin, numero_inicio es obligatorio
 *    - numero_fin debe ser >= numero_inicio
 *
 * 3. PRIORIDAD:
 *    - Rango: 1-10
 *    - 1 = Mayor prioridad (se usa primero en caso de conflicto)
 *    - 10 = Menor prioridad
 *
 * 4. SANITIZACIÓN AUTOMÁTICA:
 *    - lado: Convertido a MAYÚSCULAS
 *    - intersecciones: trim o null
 *    - observaciones: trim o null
 *
 * 5. CASOS DE USO:
 *    - validateCreateCallesCuadrantes: Para crear nueva relación
 *    - validateUpdateCallesCuadrantes: Para actualizar relación existente
 *    - validateBuscarCuadrante: Para auto-asignación en direcciones
 *
 * 6. EJEMPLO DE ERROR DE RANGO:
 *    Body: { numero_inicio: 300, numero_fin: 100 }
 *    Error: "El número final debe ser mayor o igual al número inicial"
 *
 * 7. EJEMPLO DE ERROR DE RANGO INCOMPLETO:
 *    Body: { numero_inicio: 100 }  // Falta numero_fin
 *    Error: "Si especifica número inicial, debe especificar también número final"
 */
