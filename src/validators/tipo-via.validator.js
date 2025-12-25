/**
 * ============================================================================
 * ARCHIVO: src/validators/tipo-via.validator.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Validadores para tipos de vía
 *              Validación de datos de entrada usando express-validator
 * ============================================================================
 *
 * PROPÓSITO:
 * - Validar datos de entrada para operaciones CRUD de tipos de vía
 * - Sanitizar y normalizar datos antes de procesarlos
 * - Retornar errores descriptivos y consistentes
 * - Prevenir inyecciones y datos inválidos
 *
 * VALIDADORES EXPORTADOS:
 * - validateCreateTipoVia: Validación para crear tipo de vía
 * - validateUpdateTipoVia: Validación para actualizar tipo de vía
 * - validateTipoViaId: Validación de ID en parámetros de ruta
 *
 * REGLAS DE VALIDACIÓN:
 * - codigo: String 2-10 caracteres, solo letras y números, obligatorio
 * - nombre: String 3-50 caracteres, obligatorio
 * - abreviatura: String 2-10 caracteres, obligatorio
 * - descripcion: String opcional, máximo 500 caracteres
 * - orden: Integer >= 0, opcional
 * - estado: Integer 0 o 1, opcional
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import { body, param, validationResult } from "express-validator";

/**
 * ============================================================================
 * MIDDLEWARE PARA MANEJAR ERRORES DE VALIDACIÓN
 * ============================================================================
 */

/**
 * Middleware que procesa los errores de validación
 * Si hay errores, retorna respuesta 400 con los errores formateados
 * Si no hay errores, continúa con el siguiente middleware
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Formatear errores para respuesta consistente
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
 * VALIDADORES PARA CREAR TIPO DE VÍA
 * ============================================================================
 */

/**
 * Validación para crear un nuevo tipo de vía
 * Campos requeridos: codigo, nombre, abreviatura
 * Campos opcionales: descripcion, orden
 *
 * @example
 * POST /api/tipos-via
 * Body: {
 *   "codigo": "AV",
 *   "nombre": "Avenida",
 *   "abreviatura": "Av.",
 *   "descripcion": "Vía urbana principal",
 *   "orden": 1
 * }
 */
export const validateCreateTipoVia = [
  // ============================================
  // VALIDACIÓN: codigo
  // ============================================
  body("codigo")
    .notEmpty()
    .withMessage("El código es obligatorio")
    .isString()
    .withMessage("El código debe ser texto")
    .trim() // Elimina espacios al inicio y final
    .isLength({ min: 2, max: 10 })
    .withMessage("El código debe tener entre 2 y 10 caracteres")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage(
      "El código solo puede contener letras y números (sin espacios ni caracteres especiales)"
    )
    .toUpperCase() // Convierte a mayúsculas automáticamente
    .customSanitizer((value) => value.trim()), // Sanitiza el valor

  // ============================================
  // VALIDACIÓN: nombre
  // ============================================
  body("nombre")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isString()
    .withMessage("El nombre debe ser texto")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("El nombre debe tener entre 3 y 50 caracteres")
    .matches(/^[A-Za-zÀ-ÿ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios")
    .customSanitizer((value) => {
      // Capitalizar primera letra de cada palabra
      return value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }),

  // ============================================
  // VALIDACIÓN: abreviatura
  // ============================================
  body("abreviatura")
    .notEmpty()
    .withMessage("La abreviatura es obligatoria")
    .isString()
    .withMessage("La abreviatura debe ser texto")
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("La abreviatura debe tener entre 2 y 10 caracteres")
    .customSanitizer((value) => value.trim()),

  // ============================================
  // VALIDACIÓN: descripcion (OPCIONAL)
  // ============================================
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true }) // Permite null, undefined, ''
    .isString()
    .withMessage("La descripción debe ser texto")
    .trim()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: orden (OPCIONAL)
  // ============================================
  body("orden")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("El orden debe ser un número entero mayor o igual a 0")
    .toInt(), // Convierte a entero

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * VALIDADORES PARA ACTUALIZAR TIPO DE VÍA
 * ============================================================================
 */

/**
 * Validación para actualizar un tipo de vía existente
 * Todos los campos son opcionales (solo se actualiza lo que se envía)
 *
 * @example
 * PUT /api/tipos-via/1
 * Body: {
 *   "nombre": "Avenida Principal",
 *   "descripcion": "Nueva descripción"
 * }
 */
export const validateUpdateTipoVia = [
  // ============================================
  // VALIDACIÓN: codigo (OPCIONAL)
  // ============================================
  body("codigo")
    .optional()
    .isString()
    .withMessage("El código debe ser texto")
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("El código debe tener entre 2 y 10 caracteres")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("El código solo puede contener letras y números")
    .toUpperCase()
    .customSanitizer((value) => value.trim()),

  // ============================================
  // VALIDACIÓN: nombre (OPCIONAL)
  // ============================================
  body("nombre")
    .optional()
    .isString()
    .withMessage("El nombre debe ser texto")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("El nombre debe tener entre 3 y 50 caracteres")
    .matches(/^[A-Za-zÀ-ÿ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios")
    .customSanitizer((value) => {
      return value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }),

  // ============================================
  // VALIDACIÓN: abreviatura (OPCIONAL)
  // ============================================
  body("abreviatura")
    .optional()
    .isString()
    .withMessage("La abreviatura debe ser texto")
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("La abreviatura debe tener entre 2 y 10 caracteres")
    .customSanitizer((value) => value.trim()),

  // ============================================
  // VALIDACIÓN: descripcion (OPCIONAL)
  // ============================================
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage("La descripción debe ser texto")
    .trim()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres")
    .customSanitizer((value) => (value ? value.trim() : null)),

  // ============================================
  // VALIDACIÓN: orden (OPCIONAL)
  // ============================================
  body("orden")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("El orden debe ser un número entero mayor o igual a 0")
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
 * Usado en: GET /api/tipos-via/:id, PUT /api/tipos-via/:id, etc.
 *
 * @example
 * GET /api/tipos-via/5
 * Params: { id: "5" }
 */
export const validateTipoViaId = [
  // ============================================
  // VALIDACIÓN: id en params
  // ============================================
  param("id")
    .notEmpty()
    .withMessage("El ID es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El ID debe ser un número entero positivo")
    .toInt(), // Convierte a entero

  // Middleware que maneja los errores
  handleValidationErrors,
];

/**
 * ============================================================================
 * EXPORTACIÓN POR DEFECTO (OPCIONAL)
 * ============================================================================
 */

export default {
  validateCreateTipoVia,
  validateUpdateTipoVia,
  validateTipoViaId,
};

/**
 * NOTAS DE USO:
 *
 * 1. IMPORTAR EN RUTAS:
 *    import { validateCreateTipoVia, validateUpdateTipoVia } from '../validators/tipo-via.validator.js';
 *
 * 2. APLICAR EN RUTAS:
 *    router.post('/', validateCreateTipoVia, controller.crear);
 *    router.put('/:id', validateUpdateTipoVia, controller.actualizar);
 *
 * 3. ORDEN DE MIDDLEWARES:
 *    router.post('/',
 *      verificarToken,              // 1. Autenticación
 *      verificarRoles([...]),       // 2. Autorización
 *      requireAnyPermission([...]), // 3. Permisos
 *      validateCreateTipoVia,       // 4. Validación ← AQUÍ
 *      registrarAuditoria({...}),   // 5. Auditoría
 *      controller.crear             // 6. Controlador
 *    );
 *
 * 4. SANITIZACIÓN AUTOMÁTICA:
 *    - codigo: Convertido a MAYÚSCULAS y trim
 *    - nombre: Capitalizado (Primera Letra De Cada Palabra)
 *    - abreviatura: trim
 *    - descripcion: trim o null
 *    - orden: Convertido a int
 *
 * 5. FORMATO DE ERROR:
 *    {
 *      "success": false,
 *      "message": "Error de validación",
 *      "errors": [
 *        {
 *          "field": "codigo",
 *          "message": "El código es obligatorio",
 *          "value": ""
 *        }
 *      ]
 *    }
 *
 * 6. EXPRESIONES REGULARES USADAS:
 *    - /^[A-Za-z0-9]+$/: Solo letras y números (codigo)
 *    - /^[A-Za-zÀ-ÿ\s]+$/: Solo letras con acentos y espacios (nombre)
 */
