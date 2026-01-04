/**
 * ===================================================
 * VALIDADORES: Novedades/Incidentes
 * ===================================================
 *
 * Ruta: src/validators/novedad.validator.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * Descripción:
 * Validadores centralizados y reutilizables para el módulo de Novedades.
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
 * @module validators/novedad.validator
 * @requires express-validator
 * @version 2.0.0
 * @date 2025-12-14
 */

import { body, param, query, validationResult } from "express-validator";

// ==========================================
// IMPORTAR CONSTANTES CENTRALIZADAS
// ==========================================

import {
  ORIGEN_LLAMADA_ARRAY,
  PRIORIDAD_ARRAY,
  GRAVEDAD_ARRAY,
  TURNO_ARRAY,
  LIMITES_TEXTO,
  LIMITES_NUMERICOS,
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
 * Validar ID de novedad
 */
export const validarNovedadId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de novedad debe ser un número positivo");

/**
 * Validar tipo de novedad
 */
export const validarTipoNovedad = (opcional = false) => {
  const validator = body("tipo_novedad_id")
    .isInt({ min: 1 })
    .withMessage("El tipo de novedad debe ser un ID válido");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El tipo de novedad es requerido");
};

/**
 * Validar subtipo de novedad
 */
export const validarSubtipoNovedad = (opcional = false) => {
  const validator = body("subtipo_novedad_id")
    .isInt({ min: 1 })
    .withMessage("El subtipo debe ser un ID válido");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El subtipo de novedad es requerido");
};

/**
 * Validar estado de novedad
 */
export const validarEstadoNovedad = () =>
  body("estado_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El estado debe ser un ID válido");

/**
 * Validar fecha y hora de ocurrencia
 */
export const validarFechaHoraOcurrencia = (opcional = false) => {
  const validator = body("fecha_hora_ocurrencia")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601")
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();

      // No permitir fechas muy futuras (más de 1 día)
      const unDiaFuturo = new Date();
      unDiaFuturo.setDate(unDiaFuturo.getDate() + 1);

      if (fecha > unDiaFuturo) {
        throw new Error(
          "La fecha de ocurrencia no puede ser más de un día en el futuro"
        );
      }

      return true;
    });

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("La fecha y hora son requeridas");
};

/**
 * Validar descripción
 */
export const validarDescripcion = (opcional = false) => {
  const validator = body("descripcion")
    .trim()
    .isLength({
      min: LIMITES_TEXTO.DESCRIPCION_MIN,
      max: LIMITES_TEXTO.DESCRIPCION_MAX,
    })
    .withMessage(
      `La descripción debe tener entre ${LIMITES_TEXTO.DESCRIPCION_MIN} y ${LIMITES_TEXTO.DESCRIPCION_MAX} caracteres`
    );

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("La descripción es requerida");
};

/**
 * Validar localización
 */
export const validarLocalizacion = () =>
  body("localizacion")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.LOCALIZACION_MAX })
    .withMessage(
      `La localización no puede exceder ${LIMITES_TEXTO.LOCALIZACION_MAX} caracteres`
    );

/**
 * Validar referencia de ubicación
 */
export const validarReferenciaUbicacion = () =>
  body("referencia_ubicacion")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.REFERENCIA_MAX })
    .withMessage(
      `La referencia no puede exceder ${LIMITES_TEXTO.REFERENCIA_MAX} caracteres`
    );

/**
 * Validar coordenadas geográficas
 */
export const validarLatitud = () =>
  body("latitud")
    .optional()
    .isDecimal()
    .withMessage("La latitud debe ser un número decimal")
    .custom((value) => {
      const lat = parseFloat(value);
      if (
        lat < LIMITES_NUMERICOS.LATITUD_MIN ||
        lat > LIMITES_NUMERICOS.LATITUD_MAX
      ) {
        throw new Error(
          `La latitud debe estar entre ${LIMITES_NUMERICOS.LATITUD_MIN} y ${LIMITES_NUMERICOS.LATITUD_MAX}`
        );
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
      if (
        lng < LIMITES_NUMERICOS.LONGITUD_MIN ||
        lng > LIMITES_NUMERICOS.LONGITUD_MAX
      ) {
        throw new Error(
          `La longitud debe estar entre ${LIMITES_NUMERICOS.LONGITUD_MIN} y ${LIMITES_NUMERICOS.LONGITUD_MAX}`
        );
      }
      return true;
    });

/**
 * Validar código ubigeo
 */
export const validarUbigeoCode = () =>
  body("ubigeo_code")
    .optional()
    .isString()
    .isLength({
      min: LIMITES_NUMERICOS.UBIGEO_LENGTH,
      max: LIMITES_NUMERICOS.UBIGEO_LENGTH,
    })
    .withMessage(
      `El código ubigeo debe tener exactamente ${LIMITES_NUMERICOS.UBIGEO_LENGTH} caracteres`
    );

/**
 * Validar origen de llamada
 */
export const validarOrigenLlamada = () =>
  body("origen_llamada")
    .optional()
    .isIn(ORIGEN_LLAMADA_ARRAY)
    .withMessage(
      `Origen de llamada debe ser uno de: ${ORIGEN_LLAMADA_ARRAY.join(", ")}`
    );

/**
 * Validar datos del reportante
 */
export const validarReportanteNombre = () =>
  body("reportante_nombre")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("El nombre del reportante no puede exceder 150 caracteres");

export const validarReportanteTelefono = () =>
  body("reportante_telefono")
    .optional()
    .matches(PATTERNS.TELEFONO)
    .withMessage(
      `El teléfono debe tener entre ${LIMITES_TEXTO.TELEFONO_MIN} y ${LIMITES_TEXTO.TELEFONO_MAX} dígitos`
    );

export const validarReportanteDocIdentidad = () =>
  body("reportante_doc_identidad")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("El documento de identidad no puede exceder 30 caracteres");

export const validarEsAnonimo = () =>
  body("es_anonimo")
    .optional()
    .isInt({ min: 0, max: 1 })
    .withMessage("es_anonimo debe ser 0 o 1");

/**
 * Validar observaciones
 */
export const validarObservaciones = () =>
  body("observaciones")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.OBSERVACIONES_MAX })
    .withMessage(
      `Las observaciones no pueden exceder ${LIMITES_TEXTO.OBSERVACIONES_MAX} caracteres`
    );

export const validarObservacionesCambioEstado = () =>
  body("observaciones_cambio_estado")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Las observaciones de cambio de estado no pueden exceder 1000 caracteres"
    );

/**
 * Validar IDs de relaciones
 */
export const validarSectorId = () =>
  body("sector_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El sector debe ser un ID válido");

export const validarCuadranteId = () =>
  body("cuadrante_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El cuadrante debe ser un ID válido");

export const validarDireccionId = () =>
  body("direccion_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La dirección debe ser un ID válido");

export const validarUnidadOficinaId = () =>
  body("unidad_oficina_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID de unidad debe ser válido");

export const validarVehiculoId = () =>
  body("vehiculo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID de vehículo debe ser válido");

export const validarPersonalCargoId = () =>
  body("personal_cargo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El ID de personal debe ser válido");

/**
 * Validar prioridad
 */
export const validarPrioridad = () =>
  body("prioridad_actual")
    .optional()
    .isIn(PRIORIDAD_ARRAY)
    .withMessage(`La prioridad debe ser: ${PRIORIDAD_ARRAY.join(", ")}`);

/**
 * Validar gravedad
 */
export const validarGravedad = () =>
  body("gravedad")
    .optional()
    .isIn(GRAVEDAD_ARRAY)
    .withMessage(`La gravedad debe ser: ${GRAVEDAD_ARRAY.join(", ")}`);

/**
 * Validar fechas de flujo
 */
export const validarFechaLlegada = () =>
  body("fecha_llegada")
    .optional()
    .isISO8601()
    .withMessage("La fecha de llegada debe estar en formato ISO 8601");

export const validarFechaCierre = () =>
  body("fecha_cierre")
    .optional()
    .isISO8601()
    .withMessage("La fecha de cierre debe estar en formato ISO 8601");

/**
 * Validar kilometraje
 */
export const validarKmInicial = () =>
  body("km_inicial")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("El kilometraje inicial debe ser un número válido")
    .custom((value) => {
      const km = parseFloat(value);
      if (km < LIMITES_NUMERICOS.KM_MIN || km > LIMITES_NUMERICOS.KM_MAX) {
        throw new Error(
          `El kilometraje debe estar entre ${LIMITES_NUMERICOS.KM_MIN} y ${LIMITES_NUMERICOS.KM_MAX}`
        );
      }
      return true;
    });

// ==========================================
// VALIDADORES COMPUESTOS (POR ENDPOINT)
// ==========================================

/**
 * Validación completa para crear novedad
 * POST /api/v1/novedades
 */
export const validateCreateNovedad = [
  validarTipoNovedad(false),
  validarSubtipoNovedad(false),
  validarFechaHoraOcurrencia(false),
  validarDescripcion(false),
  validarLocalizacion(),
  validarReferenciaUbicacion(),
  validarLatitud(),
  validarLongitud(),
  validarOrigenLlamada(),
  validarReportanteNombre(),
  validarReportanteTelefono(),
  validarReportanteDocIdentidad(),
  validarEsAnonimo(),
  validarObservaciones(),
  validarSectorId(),
  validarCuadranteId(),
  validarDireccionId(),
  validarUbigeoCode(),
  validarPrioridad(),
  validarGravedad(),
  handleValidationErrors,
];

/**
 * Validación para actualizar novedad
 * PUT /api/v1/novedades/:id
 */
export const validateUpdateNovedad = [
  validarNovedadId(),
  validarTipoNovedad(true),
  validarSubtipoNovedad(true),
  validarEstadoNovedad(),
  validarFechaHoraOcurrencia(true),
  validarFechaLlegada(),
  validarFechaCierre(),
  validarDescripcion(true),
  validarObservaciones(),
  validarObservacionesCambioEstado(),
  handleValidationErrors,
];

/**
 * Validación para asignar recursos
 * POST /api/v1/novedades/:id/asignar
 */
export const validateAsignarRecursos = [
  validarNovedadId(),
  validarUnidadOficinaId(),
  validarVehiculoId(),
  validarPersonalCargoId(),
  validarKmInicial(),
  handleValidationErrors,
];

/**
 * Validación de query params para listar
 * GET /api/v1/novedades
 */
export const validateQueryNovedades = [
  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage("fecha_inicio debe estar en formato ISO 8601"),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("fecha_fin debe estar en formato ISO 8601"),

  query("estado_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("estado_novedad_id debe ser un número entero positivo"),

  query("prioridad_actual")
    .optional()
    .isIn(PRIORIDAD_ARRAY)
    .withMessage(`prioridad_actual debe ser: ${PRIORIDAD_ARRAY.join(", ")}`),

  query("sector_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sector_id debe ser un número entero positivo"),

  query("tipo_novedad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("tipo_novedad_id debe ser un número entero positivo"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page debe ser un número entero positivo"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe estar entre 1 y 100"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("search no puede exceder 200 caracteres"),

  handleValidationErrors,
];

/**
 * Validación simple de ID
 * GET /api/v1/novedades/:id
 */
export const validateNovedadId = [validarNovedadId(), handleValidationErrors];

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================

export default {
  validateCreateNovedad,
  validateUpdateNovedad,
  validateAsignarRecursos,
  validateQueryNovedades,
  validateNovedadId,
  handleValidationErrors,
};
