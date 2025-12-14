/**
 * ===================================================
 * VALIDATORS - PERSONAL
 * ===================================================
 *
 * Archivo: src/validators/personal.validator.js
 *
 * Validadores centralizados para el módulo de Personal.
 * Importa constantes desde el archivo único de verdad.
 *
 * Ventajas:
 * - Reutilización de validaciones
 * - Consistencia garantizada
 * - Fácil mantenimiento
 * - Separación de responsabilidades
 *
 * @module validators/personalValidator
 * @version 1.0.0
 */

import { body, param, query } from "express-validator";
import {
  TIPOS_DOCUMENTO_ARRAY,
  STATUS_LABORAL_ARRAY,
  SEXO_ARRAY,
  REGIMEN_LABORAL_ARRAY,
  CATEGORIAS_LICENCIA_ARRAY,
  CATEGORIAS_LICENCIA_ERROR_MESSAGE,
  LICENCIA_REGEX,
  LICENCIA_FORMATO_MENSAJE,
  DOCUMENTO_PATTERNS,
  DOCUMENTO_MENSAJES,
  UBIGEO_REGEX,
  UBIGEO_MENSAJE,
  LIMITES_TEXTO,
  TEXTO_SOLO_LETRAS_REGEX,
  TEXTO_SOLO_LETRAS_MENSAJE,
  EDAD_MINIMA,
  EDAD_MAXIMA,
  PAGINACION,
} from "../constants/validations.js";

// ==========================================
// HELPER: Manejo de errores de validación
// ==========================================

import { validationResult } from "express-validator";

/**
 * Middleware mejorado para manejar errores de validación
 * Formatea respuestas según el tipo de error
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Formatear errores
    const formattedErrors = errors.array().map((err) => {
      const baseError = {
        field: err.path || err.param,
        value: err.value,
        message: err.msg,
      };

      // ✅ CASO ESPECIAL: Categoría de licencia
      if (
        err.path === "categoria" &&
        !CATEGORIAS_LICENCIA_ARRAY.includes(err.value?.toUpperCase())
      ) {
        return {
          ...baseError,
          details: {
            codigo_error: "INVALID_CATEGORIA",
            valor_recibido: err.value,
            categorias_validas: {
              clase_a: {
                nombre: "CLASE A - Motocicletas y vehículos menores",
                opciones: [
                  { codigo: "A-I", descripcion: "Motocicletas hasta 125cc" },
                  { codigo: "A-IIA", descripcion: "Motocicletas hasta 400cc" },
                  { codigo: "A-IIB", descripcion: "Motocicletas sin límite" },
                  { codigo: "A-IIIA", descripcion: "Mototaxis" },
                  { codigo: "A-IIIB", descripcion: "Trimotos de carga" },
                  {
                    codigo: "A-IIIC",
                    descripcion: "Vehículos especiales motorizados",
                  },
                ],
              },
              clase_b: {
                nombre: "CLASE B - Automóviles y transporte",
                opciones: [
                  { codigo: "B-I", descripcion: "Automóviles particulares" },
                  { codigo: "B-IIA", descripcion: "Taxis y colectivos" },
                  { codigo: "B-IIB", descripcion: "Camiones y buses" },
                  {
                    codigo: "B-IIC",
                    descripcion: "Vehículos pesados especiales",
                  },
                ],
              },
            },
            formato_requerido: "CLASE-SUBCLASE (ej: A-IIB)",
            nota: "Debe usar mayúsculas y guion medio",
          },
        };
      }

      // ✅ CASO ESPECIAL: Tipo de documento
      if (
        err.path === "doc_tipo" &&
        !TIPOS_DOCUMENTO_ARRAY.includes(err.value)
      ) {
        return {
          ...baseError,
          details: {
            codigo_error: "INVALID_DOC_TIPO",
            valor_recibido: err.value,
            tipos_validos: TIPOS_DOCUMENTO_ARRAY,
            ejemplos: {
              DNI: "Documento Nacional de Identidad (8 dígitos)",
              "Carnet Extranjeria": "Carnet de Extranjería (9 caracteres)",
              Pasaporte: "Pasaporte (6-12 caracteres)",
              PTP: "Permiso Temporal de Permanencia",
            },
          },
        };
      }

      // ✅ CASO ESPECIAL: Status laboral
      if (err.path === "status" && !STATUS_LABORAL_ARRAY.includes(err.value)) {
        return {
          ...baseError,
          details: {
            codigo_error: "INVALID_STATUS",
            valor_recibido: err.value,
            status_validos: STATUS_LABORAL_ARRAY,
            descripciones: {
              Activo: "Personal trabajando actualmente",
              Inactivo: "Personal temporalmente sin actividad",
              Suspendido: "Personal sancionado temporalmente",
              Retirado: "Personal que ya no trabaja en la institución",
            },
          },
        };
      }

      // Error genérico
      return baseError;
    });

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
// VALIDADORES REUTILIZABLES - CAMPOS
// ==========================================

/**
 * Validar tipo de documento
 */
export const validarTipoDocumento = () =>
  body("doc_tipo")
    .notEmpty()
    .withMessage("El tipo de documento es requerido")
    .isIn(TIPOS_DOCUMENTO_ARRAY)
    .withMessage(
      `Tipo de documento no válido. Válidos: ${TIPOS_DOCUMENTO_ARRAY.join(
        ", "
      )}`
    );

/**
 * Validar número de documento
 */
export const validarNumeroDocumento = () =>
  body("doc_numero")
    .notEmpty()
    .withMessage("El número de documento es requerido")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("El número de documento debe tener entre 3 y 20 caracteres")
    .custom((value, { req }) => {
      const tipo = req.body.doc_tipo;
      const pattern = DOCUMENTO_PATTERNS[tipo];

      if (!pattern) {
        throw new Error("Tipo de documento no reconocido");
      }

      if (!pattern.test(value.toUpperCase())) {
        throw new Error(DOCUMENTO_MENSAJES[tipo]);
      }

      return true;
    });

/**
 * Validar apellido paterno
 */
export const validarApellidoPaterno = (opcional = false) => {
  let validator = body("apellido_paterno");

  if (opcional) {
    validator = validator.optional();
  } else {
    validator = validator
      .notEmpty()
      .withMessage("El apellido paterno es requerido");
  }

  return validator
    .trim()
    .isLength(LIMITES_TEXTO.APELLIDO)
    .withMessage(
      `El apellido paterno debe tener entre ${LIMITES_TEXTO.APELLIDO.min} y ${LIMITES_TEXTO.APELLIDO.max} caracteres`
    )
    .matches(TEXTO_SOLO_LETRAS_REGEX)
    .withMessage(TEXTO_SOLO_LETRAS_MENSAJE);
};

/**
 * Validar apellido materno
 */
export const validarApellidoMaterno = (opcional = false) => {
  let validator = body("apellido_materno");

  if (opcional) {
    validator = validator.optional();
  } else {
    validator = validator
      .notEmpty()
      .withMessage("El apellido materno es requerido");
  }

  return validator
    .trim()
    .isLength(LIMITES_TEXTO.APELLIDO)
    .withMessage(
      `El apellido materno debe tener entre ${LIMITES_TEXTO.APELLIDO.min} y ${LIMITES_TEXTO.APELLIDO.max} caracteres`
    )
    .matches(TEXTO_SOLO_LETRAS_REGEX)
    .withMessage(TEXTO_SOLO_LETRAS_MENSAJE);
};

/**
 * Validar nombres
 */
export const validarNombres = (opcional = false) => {
  let validator = body("nombres");

  if (opcional) {
    validator = validator.optional();
  } else {
    validator = validator.notEmpty().withMessage("Los nombres son requeridos");
  }

  return validator
    .trim()
    .isLength(LIMITES_TEXTO.NOMBRE)
    .withMessage(
      `Los nombres deben tener entre ${LIMITES_TEXTO.NOMBRE.min} y ${LIMITES_TEXTO.NOMBRE.max} caracteres`
    )
    .matches(TEXTO_SOLO_LETRAS_REGEX)
    .withMessage(TEXTO_SOLO_LETRAS_MENSAJE);
};

/**
 * Validar sexo
 */
export const validarSexo = () =>
  body("sexo")
    .optional()
    .isIn(SEXO_ARRAY)
    .withMessage(`El sexo debe ser: ${SEXO_ARRAY.join(" o ")}`);

/**
 * Validar fecha de nacimiento
 */
export const validarFechaNacimiento = () =>
  body("fecha_nacimiento")
    .optional()
    .isISO8601()
    .withMessage("Fecha de nacimiento inválida")
    .custom((value) => {
      if (value) {
        const edad = Math.floor(
          (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000)
        );

        if (edad < EDAD_MINIMA) {
          throw new Error(`El personal debe ser mayor de ${EDAD_MINIMA} años`);
        }

        if (edad > EDAD_MAXIMA) {
          throw new Error("Fecha de nacimiento inválida");
        }

        if (new Date(value) > new Date()) {
          throw new Error("La fecha de nacimiento no puede ser futura");
        }
      }
      return true;
    });

/**
 * Validar nacionalidad
 */
export const validarNacionalidad = () =>
  body("nacionalidad")
    .optional()
    .trim()
    .isLength(LIMITES_TEXTO.NACIONALIDAD)
    .withMessage(
      `La nacionalidad debe tener entre ${LIMITES_TEXTO.NACIONALIDAD.min} y ${LIMITES_TEXTO.NACIONALIDAD.max} caracteres`
    );

/**
 * Validar dirección
 */
export const validarDireccion = () =>
  body("direccion")
    .optional()
    .trim()
    .isLength(LIMITES_TEXTO.DIRECCION)
    .withMessage(
      `La dirección debe tener entre ${LIMITES_TEXTO.DIRECCION.min} y ${LIMITES_TEXTO.DIRECCION.max} caracteres`
    );

/**
 * Validar ubigeo
 */
export const validarUbigeo = () =>
  body("ubigeo_code")
    .optional()
    .matches(UBIGEO_REGEX)
    .withMessage(UBIGEO_MENSAJE);

/**
 * Validar cargo_id
 */
export const validarCargoId = (opcional = true) => {
  let validator = body("cargo_id");

  if (!opcional) {
    validator = validator.notEmpty().withMessage("El cargo es requerido");
  } else {
    validator = validator.optional();
  }

  return validator
    .isInt({ min: 1 })
    .withMessage("El cargo_id debe ser un número positivo");
};

/**
 * Validar fecha de ingreso
 */
export const validarFechaIngreso = () =>
  body("fecha_ingreso")
    .optional()
    .isISO8601()
    .withMessage("Fecha de ingreso inválida")
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("La fecha de ingreso no puede ser futura");
      }
      return true;
    });

/**
 * Validar status laboral
 */
export const validarStatus = (opcional = true) => {
  let validator = body("status");

  if (!opcional) {
    validator = validator.notEmpty().withMessage("El status es requerido");
  } else {
    validator = validator.optional();
  }

  return validator
    .isIn(STATUS_LABORAL_ARRAY)
    .withMessage(
      `Status no válido. Válidos: ${STATUS_LABORAL_ARRAY.join(", ")}`
    );
};

/**
 * Validar régimen laboral
 */
export const validarRegimen = () =>
  body("regimen")
    .optional()
    .isIn(REGIMEN_LABORAL_ARRAY)
    .withMessage(
      `Régimen no válido. Válidos: ${REGIMEN_LABORAL_ARRAY.join(", ")}`
    );

/**
 * Validar licencia de conducir
 */
export const validarLicencia = () =>
  body("licencia")
    .optional()
    .trim()
    .isLength(LIMITES_TEXTO.LICENCIA)
    .withMessage(
      `La licencia debe tener entre ${LIMITES_TEXTO.LICENCIA.min} y ${LIMITES_TEXTO.LICENCIA.max} caracteres`
    )
    .matches(LICENCIA_REGEX)
    .withMessage(LICENCIA_FORMATO_MENSAJE);

/**
 * Validar categoría de licencia
 */
export const validarCategoria = () =>
  body("categoria")
    .optional()
    .isIn(CATEGORIAS_LICENCIA_ARRAY)
    .withMessage(CATEGORIAS_LICENCIA_ERROR_MESSAGE);

/**
 * Validar vigencia de licencia
 */
export const validarVigencia = () =>
  body("vigencia")
    .optional()
    .isISO8601()
    .withMessage("Fecha de vigencia inválida");

/**
 * Validar vehiculo_id
 */
export const validarVehiculoId = (opcional = true) => {
  let validator = body("vehiculo_id");

  if (!opcional) {
    validator = validator.notEmpty().withMessage("El vehículo es requerido");
  } else {
    validator = validator.optional();
  }

  return validator
    .isInt({ min: 1 })
    .withMessage("El vehiculo_id debe ser un número positivo");
};

/**
 * Validar observaciones
 */
export const validarObservaciones = () =>
  body("observaciones")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.OBSERVACIONES.max })
    .withMessage(
      `Las observaciones no pueden exceder ${LIMITES_TEXTO.OBSERVACIONES.max} caracteres`
    );

// ==========================================
// VALIDADORES COMPLETOS - OPERACIONES
// ==========================================

/**
 * Validadores para crear personal
 */
export const validateCreatePersonal = [
  validarTipoDocumento(),
  validarNumeroDocumento(),
  validarApellidoPaterno(false),
  validarApellidoMaterno(false),
  validarNombres(false),
  validarSexo(),
  validarFechaNacimiento(),
  validarNacionalidad(),
  validarDireccion(),
  validarUbigeo(),
  validarCargoId(true),
  validarFechaIngreso(),
  validarStatus(true),
  validarRegimen(),
  validarLicencia(),
  validarCategoria(),
  validarVigencia(),
  validarVehiculoId(true),
  handleValidationErrors,
];

/**
 * Validadores para actualizar personal
 */
export const validateUpdatePersonal = [
  // No permitir cambiar documento
  body("doc_tipo")
    .not()
    .exists()
    .withMessage("No se permite cambiar el tipo de documento"),

  body("doc_numero")
    .not()
    .exists()
    .withMessage("No se permite cambiar el número de documento"),

  validarApellidoPaterno(true),
  validarApellidoMaterno(true),
  validarNombres(true),
  validarSexo(),
  validarFechaNacimiento(),
  validarCargoId(true),
  validarStatus(true),
  handleValidationErrors,
];

/**
 * Validador de ID en parámetros
 */
export const validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El ID debe ser un número entero positivo"),
  handleValidationErrors,
];

/**
 * Validador para cambio de status
 */
export const validateCambiarStatus = [
  ...validateId,
  validarStatus(false),
  validarObservaciones(),
  handleValidationErrors,
];

/**
 * Validador para asignar vehículo
 */
export const validateAsignarVehiculo = [
  ...validateId,
  validarVehiculoId(false),
  handleValidationErrors,
];

/**
 * Validador para actualizar licencia
 */
export const validateActualizarLicencia = [
  ...validateId,
  validarLicencia(),
  validarCategoria(),
  validarVigencia(),
  handleValidationErrors,
];

/**
 * Validadores para query parameters
 */
export const validateQueryParams = [
  query("page")
    .optional()
    .isInt({ min: PAGINACION.PAGE_DEFAULT })
    .withMessage(
      `page debe ser un número positivo (mínimo ${PAGINACION.PAGE_DEFAULT})`
    ),

  query("limit")
    .optional()
    .isInt({ min: PAGINACION.LIMIT_MIN, max: PAGINACION.LIMIT_MAX })
    .withMessage(
      `limit debe estar entre ${PAGINACION.LIMIT_MIN} y ${PAGINACION.LIMIT_MAX}`
    ),

  query("cargo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("cargo_id debe ser un número positivo"),

  query("status")
    .optional()
    .isIn(STATUS_LABORAL_ARRAY)
    .withMessage(
      `Status no válido. Válidos: ${STATUS_LABORAL_ARRAY.join(", ")}`
    ),

  query("doc_tipo")
    .optional()
    .isIn(TIPOS_DOCUMENTO_ARRAY)
    .withMessage(
      `Tipo de documento no válido. Válidos: ${TIPOS_DOCUMENTO_ARRAY.join(
        ", "
      )}`
    ),

  query("tiene_licencia")
    .optional()
    .isIn(["true", "false"])
    .withMessage("tiene_licencia debe ser true o false"),

  query("tiene_vehiculo")
    .optional()
    .isIn(["true", "false"])
    .withMessage("tiene_vehiculo debe ser true o false"),

  handleValidationErrors,
];

// ==========================================
// EXPORTACIÓN
// ==========================================

export default {
  // Validadores individuales
  validarTipoDocumento,
  validarNumeroDocumento,
  validarApellidoPaterno,
  validarApellidoMaterno,
  validarNombres,
  validarSexo,
  validarFechaNacimiento,
  validarNacionalidad,
  validarDireccion,
  validarUbigeo,
  validarCargoId,
  validarFechaIngreso,
  validarStatus,
  validarRegimen,
  validarLicencia,
  validarCategoria,
  validarVigencia,
  validarVehiculoId,
  validarObservaciones,

  // Validadores completos
  validateCreatePersonal,
  validateUpdatePersonal,
  validateId,
  validateCambiarStatus,
  validateAsignarVehiculo,
  validateActualizarLicencia,
  validateQueryParams,

  // Helper
  handleValidationErrors,
};
