/**
 * ===================================================
 * VALIDADORES: Vehículos
 * ===================================================
 *
 * Ruta: src/validators/vehiculo.validator.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-14
 *
 * Descripción:
 * Validadores centralizados y reutilizables para el módulo de Vehículos.
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
 * @module validators/vehiculo.validator
 * @requires express-validator
 * @version 1.0.0
 * @date 2025-12-14
 */

import { body, param, query, validationResult } from "express-validator";

// ==========================================
// IMPORTAR CONSTANTES CENTRALIZADAS
// ==========================================

import {
  ESTADO_OPERATIVO_VEHICULO_ARRAY,
  TIPO_COMBUSTIBLE_ARRAY,
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
 * Validar ID de vehículo
 */
export const validarVehiculoId = () =>
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID de vehículo debe ser un número positivo");

/**
 * Validar tipo de vehículo
 */
export const validarTipoId = (opcional = false) => {
  const validator = body("tipo_id")
    .isInt({ min: 1 })
    .withMessage("El tipo de vehículo debe ser un ID válido");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El tipo de vehículo es requerido");
};

/**
 * Validar código de vehículo
 */
export const validarCodigoVehiculo = () =>
  body("codigo_vehiculo")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.CODIGO_VEHICULO_MAX })
    .withMessage(
      `El código no puede exceder ${LIMITES_TEXTO.CODIGO_VEHICULO_MAX} caracteres`
    )
    .matches(PATTERNS.CODIGO_VEHICULO)
    .withMessage("Formato de código inválido");

/**
 * Validar nombre del vehículo
 */
export const validarNombreVehiculo = () =>
  body("nombre")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El nombre no puede exceder 100 caracteres");

/**
 * Validar placa
 */
export const validarPlaca = (opcional = false) => {
  const validator = body("placa")
    .trim()
    .isLength({
      min: LIMITES_TEXTO.PLACA_MIN,
      max: LIMITES_TEXTO.PLACA_MAX,
    })
    .withMessage(
      `La placa debe tener entre ${LIMITES_TEXTO.PLACA_MIN} y ${LIMITES_TEXTO.PLACA_MAX} caracteres`
    )
    .matches(PATTERNS.PLACA_VEHICULO)
    .withMessage("Formato de placa inválido (solo letras, números y guiones)");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("La placa es requerida");
};

/**
 * Validar marca
 */
export const validarMarca = () =>
  body("marca")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.MARCA_MAX })
    .withMessage(
      `La marca no puede exceder ${LIMITES_TEXTO.MARCA_MAX} caracteres`
    );

/**
 * Validar modelo del vehículo
 */
export const validarModelo = () =>
  body("modelo_vehiculo")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.MODELO_MAX })
    .withMessage(
      `El modelo no puede exceder ${LIMITES_TEXTO.MODELO_MAX} caracteres`
    );

/**
 * Validar año del vehículo
 */
export const validarAnio = () =>
  body("anio_vehiculo")
    .optional()
    .isInt({
      min: LIMITES_NUMERICOS.ANIO_VEHICULO_MIN,
      max: LIMITES_NUMERICOS.ANIO_VEHICULO_MAX,
    })
    .withMessage(
      `El año debe estar entre ${LIMITES_NUMERICOS.ANIO_VEHICULO_MIN} y ${LIMITES_NUMERICOS.ANIO_VEHICULO_MAX}`
    );

/**
 * Validar color
 */
export const validarColor = () =>
  body("color_vehiculo")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.COLOR_MAX })
    .withMessage(
      `El color no puede exceder ${LIMITES_TEXTO.COLOR_MAX} caracteres`
    );

/**
 * Validar número de motor
 */
export const validarNumeroMotor = () =>
  body("numero_motor")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.NUMERO_MOTOR_MAX })
    .withMessage(
      `El número de motor no puede exceder ${LIMITES_TEXTO.NUMERO_MOTOR_MAX} caracteres`
    )
    .matches(PATTERNS.NUMERO_MOTOR)
    .withMessage("Formato de número de motor inválido");

/**
 * Validar número de chasis
 */
export const validarNumeroChasis = () =>
  body("numero_chasis")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.NUMERO_CHASIS_MAX })
    .withMessage(
      `El número de chasis no puede exceder ${LIMITES_TEXTO.NUMERO_CHASIS_MAX} caracteres`
    )
    .matches(PATTERNS.NUMERO_CHASIS)
    .withMessage("Formato de número de chasis inválido");

/**
 * Validar kilometraje inicial
 */
export const validarKilometrajeInicial = () =>
  body("kilometraje_inicial")
    .optional()
    .isInt({
      min: LIMITES_NUMERICOS.KM_MIN,
      max: LIMITES_NUMERICOS.KM_MAX,
    })
    .withMessage(
      `El kilometraje debe estar entre ${LIMITES_NUMERICOS.KM_MIN} y ${LIMITES_NUMERICOS.KM_MAX}`
    );

/**
 * Validar kilometraje actual
 */
export const validarKilometrajeActual = () =>
  body("kilometraje_actual")
    .optional()
    .isInt({
      min: LIMITES_NUMERICOS.KM_MIN,
      max: LIMITES_NUMERICOS.KM_MAX,
    })
    .withMessage(
      `El kilometraje debe estar entre ${LIMITES_NUMERICOS.KM_MIN} y ${LIMITES_NUMERICOS.KM_MAX}`
    );

/**
 * Validar kilometraje nuevo (para actualizaciones)
 */
export const validarKilometrajeNuevo = () =>
  body("kilometraje_nuevo")
    .notEmpty()
    .withMessage("El kilometraje nuevo es requerido")
    .isInt({
      min: LIMITES_NUMERICOS.KM_MIN,
      max: LIMITES_NUMERICOS.KM_MAX,
    })
    .withMessage(
      `El kilometraje debe estar entre ${LIMITES_NUMERICOS.KM_MIN} y ${LIMITES_NUMERICOS.KM_MAX}`
    );

/**
 * Validar capacidad de combustible
 */
export const validarCapacidadCombustible = () =>
  body("capacidad_combustible")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("La capacidad debe ser un número decimal válido")
    .custom((value) => {
      const capacidad = parseFloat(value);
      if (
        capacidad < LIMITES_NUMERICOS.CAPACIDAD_COMBUSTIBLE_MIN ||
        capacidad > LIMITES_NUMERICOS.CAPACIDAD_COMBUSTIBLE_MAX
      ) {
        throw new Error(
          `La capacidad debe estar entre ${LIMITES_NUMERICOS.CAPACIDAD_COMBUSTIBLE_MIN} y ${LIMITES_NUMERICOS.CAPACIDAD_COMBUSTIBLE_MAX} galones`
        );
      }
      return true;
    });

/**
 * Validar unidad de oficina
 */
export const validarUnidadOficinaId = (opcional = false) => {
  const validator = body("unidad_oficina_id")
    .isInt({ min: 1 })
    .withMessage("La unidad debe ser un ID válido");

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("La unidad es requerida");
};

/**
 * Validar conductor asignado
 */
export const validarConductorAsignado = () =>
  body("conductor_asignado_id")
    .optional()
    .custom((value) => {
      if (value === null) return true;
      if (Number.isInteger(value) && value > 0) return true;
      throw new Error("El conductor debe ser un ID válido o null");
    });

/**
 * Validar estado operativo
 */
export const validarEstadoOperativo = (opcional = false) => {
  const validator = body("estado_operativo")
    .isIn(ESTADO_OPERATIVO_VEHICULO_ARRAY)
    .withMessage(
      `El estado debe ser uno de: ${ESTADO_OPERATIVO_VEHICULO_ARRAY.join(", ")}`
    );

  return opcional
    ? validator.optional()
    : validator.notEmpty().withMessage("El estado operativo es requerido");
};

/**
 * Validar SOAT
 */
export const validarSOAT = () =>
  body("soat")
    .optional()
    .trim()
    .isLength({ max: LIMITES_TEXTO.SOAT_MAX })
    .withMessage(
      `El SOAT no puede exceder ${LIMITES_TEXTO.SOAT_MAX} caracteres`
    )
    .matches(PATTERNS.SOAT)
    .withMessage("Formato de SOAT inválido");

/**
 * Validar fecha de vencimiento SOAT
 */
export const validarFechaSOAT = () =>
  body("fec_soat")
    .optional()
    .isISO8601()
    .withMessage("La fecha de SOAT debe estar en formato ISO 8601 (YYYY-MM-DD)")
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fecha < hoy) {
        throw new Error("La fecha de vencimiento del SOAT no puede ser pasada");
      }
      return true;
    });

/**
 * Validar fecha de mantenimiento
 */
export const validarFechaMantenimiento = () =>
  body("fec_manten")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha de mantenimiento debe estar en formato ISO 8601 (YYYY-MM-DD)"
    );

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

// ==========================================
// VALIDADORES PARA ABASTECIMIENTO
// ==========================================

/**
 * Validar fecha y hora de abastecimiento
 */
export const validarFechaHoraAbastecimiento = () =>
  body("fecha_hora")
    .notEmpty()
    .withMessage("La fecha y hora son requeridas")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601")
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();

      if (fecha > hoy) {
        throw new Error("La fecha de abastecimiento no puede ser en el futuro");
      }
      return true;
    });

/**
 * Validar tipo de combustible
 */
export const validarTipoCombustible = () =>
  body("tipo_combustible")
    .notEmpty()
    .withMessage("El tipo de combustible es requerido")
    .isIn(TIPO_COMBUSTIBLE_ARRAY)
    .withMessage(
      `El tipo debe ser uno de: ${TIPO_COMBUSTIBLE_ARRAY.join(", ")}`
    );

/**
 * Validar cantidad de galones
 */
export const validarCantidadGalones = () =>
  body("cantidad_galones")
    .notEmpty()
    .withMessage("La cantidad de galones es requerida")
    .isFloat({
      min: LIMITES_NUMERICOS.CANTIDAD_GALONES_MIN,
      max: LIMITES_NUMERICOS.CANTIDAD_GALONES_MAX,
    })
    .withMessage(
      `La cantidad debe estar entre ${LIMITES_NUMERICOS.CANTIDAD_GALONES_MIN} y ${LIMITES_NUMERICOS.CANTIDAD_GALONES_MAX} galones`
    );

/**
 * Validar precio por galón
 */
export const validarPrecioGalon = () =>
  body("precio_galon")
    .optional()
    .isFloat({
      min: LIMITES_NUMERICOS.PRECIO_GALON_MIN,
      max: LIMITES_NUMERICOS.PRECIO_GALON_MAX,
    })
    .withMessage(
      `El precio debe estar entre ${LIMITES_NUMERICOS.PRECIO_GALON_MIN} y ${LIMITES_NUMERICOS.PRECIO_GALON_MAX}`
    );

/**
 * Validar kilometraje en abastecimiento
 */
export const validarKmActual = () =>
  body("km_actual")
    .optional()
    .isInt({
      min: LIMITES_NUMERICOS.KM_MIN,
      max: LIMITES_NUMERICOS.KM_MAX,
    })
    .withMessage(
      `El kilometraje debe estar entre ${LIMITES_NUMERICOS.KM_MIN} y ${LIMITES_NUMERICOS.KM_MAX}`
    );

/**
 * Validar grifo/estación
 */
export const validarGrifo = () =>
  body("grifo")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("El nombre del grifo no puede exceder 200 caracteres");

// ==========================================
// VALIDADORES DE QUERY PARAMS
// ==========================================

/**
 * Validar query para listar vehículos
 */
export const validarQueryVehiculos = () => [
  query("tipo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("tipo_id debe ser un número positivo"),

  query("estado_operativo")
    .optional()
    .isIn(ESTADO_OPERATIVO_VEHICULO_ARRAY)
    .withMessage(
      `estado_operativo debe ser uno de: ${ESTADO_OPERATIVO_VEHICULO_ARRAY.join(
        ", "
      )}`
    ),

  query("unidad_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("unidad_id debe ser un número positivo"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("search no puede exceder 200 caracteres"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page debe ser un número positivo"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe estar entre 1 y 100"),
];

// ==========================================
// VALIDADORES COMPUESTOS (POR ENDPOINT)
// ==========================================

/**
 * Validación completa para crear vehículo
 * POST /api/v1/vehiculos
 */
export const validateCreateVehiculo = [
  validarTipoId(false),
  validarUnidadOficinaId(false),
  validarPlaca(false),
  validarCodigoVehiculo(),
  validarNombreVehiculo(),
  validarMarca(),
  validarModelo(),
  validarAnio(),
  validarColor(),
  validarNumeroMotor(),
  validarNumeroChasis(),
  validarKilometrajeInicial(),
  validarCapacidadCombustible(),
  validarConductorAsignado(),
  validarEstadoOperativo(true),
  validarSOAT(),
  validarFechaSOAT(),
  validarFechaMantenimiento(),
  validarObservaciones(),
  handleValidationErrors,
];

/**
 * Validación para actualizar vehículo
 * PUT /api/v1/vehiculos/:id
 */
export const validateUpdateVehiculo = [
  validarVehiculoId(),
  validarTipoId(true),
  validarUnidadOficinaId(true),
  validarPlaca(true),
  validarCodigoVehiculo(),
  validarNombreVehiculo(),
  validarMarca(),
  validarModelo(),
  validarAnio(),
  validarColor(),
  validarNumeroMotor(),
  validarNumeroChasis(),
  validarConductorAsignado(),
  validarEstadoOperativo(true),
  validarSOAT(),
  validarFechaSOAT(),
  validarFechaMantenimiento(),
  validarObservaciones(),
  handleValidationErrors,
];

/**
 * Validación para actualizar kilometraje
 * PATCH /api/v1/vehiculos/:id/kilometraje
 */
export const validateActualizarKilometraje = [
  validarVehiculoId(),
  validarKilometrajeNuevo(),
  validarObservaciones(),
  handleValidationErrors,
];

/**
 * Validación para cambiar estado operativo
 * PATCH /api/v1/vehiculos/:id/estado
 */
export const validateCambiarEstado = [
  validarVehiculoId(),
  validarEstadoOperativo(false),
  validarObservaciones(),
  handleValidationErrors,
];

/**
 * Validación para registrar abastecimiento
 * POST /api/v1/vehiculos/:id/abastecimiento
 */
export const validateRegistrarAbastecimiento = [
  validarVehiculoId(),
  validarFechaHoraAbastecimiento(),
  validarTipoCombustible(),
  validarCantidadGalones(),
  validarPrecioGalon(),
  validarKmActual(),
  validarGrifo(),
  validarObservaciones(),
  handleValidationErrors,
];

/**
 * Validación simple de ID
 * GET /api/v1/vehiculos/:id
 * DELETE /api/v1/vehiculos/:id
 */
export const validateVehiculoId = [validarVehiculoId(), handleValidationErrors];

/**
 * Validación de query params para listar
 * GET /api/v1/vehiculos
 */
export const validateQueryParams = [
  ...validarQueryVehiculos(),
  handleValidationErrors,
];

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================

export default {
  validateCreateVehiculo,
  validateUpdateVehiculo,
  validateActualizarKilometraje,
  validateCambiarEstado,
  validateRegistrarAbastecimiento,
  validateVehiculoId,
  validateQueryParams,
  handleValidationErrors,
};
