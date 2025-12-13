/**
 * ===================================================
 * RUTAS: PersonalSeguridad
 * ===================================================
 *
 * Ruta: src/routes/personal.routes.js
 *
 * Descripción:
 * Define todos los endpoints REST para el módulo de Personal.
 * Incluye control de acceso basado en roles (RBAC) y validaciones
 * con express-validator.
 *
 * Características:
 * - Autenticación JWT obligatoria en todas las rutas
 * - Control de permisos granular por rol
 * - Validaciones robustas de entrada
 * - Auditoría de acciones críticas
 * - Documentación inline de cada endpoint
 *
 * Estructura de permisos:
 * - personal.personal.create: Crear personal
 * - personal.personal.read: Leer personal
 * - personal.personal.update: Actualizar personal
 * - personal.personal.delete: Eliminar personal
 * - personal.personal.restore: Restaurar personal eliminado
 * - personal.vehiculo.assign: Asignar vehículo
 * - personal.status.update: Cambiar status laboral
 *
 * @module routes/personalRoutes
 * @requires express
 * @requires express-validator
 * @author Sistema de Seguridad Ciudadana
 * @version 1.0.0
 * @date 2025-12-10
 */

import express from "express";
const router = express.Router();

// Importar controlador
import * as personalController from "../controllers/personalController.js";

// Importar middlewares de autenticación y autorización
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// Importar middleware de auditoría
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

// Importar validadores
import { body, param, query, validationResult } from "express-validator";

// ==========================================
// MIDDLEWARE DE VALIDACIÓN
// ==========================================

/**
 * Middleware para manejar errores de validación
 * Intercepta errores de express-validator y devuelve respuesta formateada
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// ==========================================
// VALIDADORES REUTILIZABLES
// ==========================================

/**
 * Validadores para creación de personal
 */
const validateCreatePersonal = [
  // Documento de identidad
  body("doc_tipo")
    .notEmpty()
    .withMessage("El tipo de documento es requerido")
    .isIn(["DNI", "Carnet Extranjeria", "Pasaporte", "PTP"])
    .withMessage("Tipo de documento no válido"),

  body("doc_numero")
    .notEmpty()
    .withMessage("El número de documento es requerido")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("El número de documento debe tener entre 3 y 20 caracteres")
    .custom((value, { req }) => {
      const tipo = req.body.doc_tipo;

      // DNI: exactamente 8 dígitos
      if (tipo === "DNI" && !/^\d{8}$/.test(value)) {
        throw new Error("El DNI debe tener exactamente 8 dígitos");
      }

      // Carnet Extranjería: 9 caracteres alfanuméricos
      if (tipo === "Carnet Extranjeria" && !/^[A-Z0-9]{9}$/i.test(value)) {
        throw new Error(
          "El Carnet de Extranjería debe tener 9 caracteres alfanuméricos"
        );
      }

      // Pasaporte: 6-12 caracteres alfanuméricos
      if (tipo === "Pasaporte" && !/^[A-Z0-9]{6,12}$/i.test(value)) {
        throw new Error(
          "El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos"
        );
      }

      return true;
    }),

  // Nombres y apellidos
  body("apellido_paterno")
    .notEmpty()
    .withMessage("El apellido paterno es requerido")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido paterno debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido paterno solo puede contener letras"),

  body("apellido_materno")
    .notEmpty()
    .withMessage("El apellido materno es requerido")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido materno debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido materno solo puede contener letras"),

  body("nombres")
    .notEmpty()
    .withMessage("Los nombres son requeridos")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Los nombres deben tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Los nombres solo pueden contener letras"),

  // Datos opcionales
  body("sexo")
    .optional()
    .isIn(["Masculino", "Femenino"])
    .withMessage("El sexo debe ser 'Masculino' o 'Femenino'"),

  body("fecha_nacimiento")
    .optional()
    .isISO8601()
    .withMessage("Fecha de nacimiento inválida")
    .custom((value) => {
      if (value) {
        const edad = Math.floor(
          (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000)
        );
        if (edad < 18) {
          throw new Error("El personal debe ser mayor de 18 años");
        }
        if (edad > 100) {
          throw new Error("Fecha de nacimiento inválida");
        }
      }
      return true;
    }),

  body("nacionalidad")
    .optional()
    .trim()
    .isLength({ min: 4, max: 50 })
    .withMessage("La nacionalidad debe tener entre 4 y 50 caracteres"),

  body("direccion")
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage("La dirección debe tener entre 5 y 150 caracteres"),

  body("ubigeo_code")
    .optional()
    .matches(/^\d{6}$/)
    .withMessage("El código de ubigeo debe tener exactamente 6 dígitos"),

  // Información laboral
  body("cargo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El cargo_id debe ser un número positivo"),

  body("fecha_ingreso")
    .optional()
    .isISO8601()
    .withMessage("Fecha de ingreso inválida")
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("La fecha de ingreso no puede ser futura");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["Activo", "Inactivo", "Suspendido", "Retirado"])
    .withMessage("Status laboral no válido"),

  body("regimen")
    .optional()
    .isIn(["256", "276", "728", "1057 CAS", "Orden Servicio", "Practicante"])
    .withMessage("Régimen laboral no válido"),

  // Licencia de conducir
  body("licencia")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("La licencia debe tener entre 5 y 20 caracteres")
    .matches(/^[A-Z]\d{8}$/i)
    .withMessage(
      "Formato de licencia inválido (debe ser: letra + 8 dígitos, ej: Q12345678)"
    ),

  body("categoria")
    .optional()
    .isIn([
      "A-I",
      "A-IIa",
      "A-IIb",
      "A-IIIa",
      "A-IIIb",
      "A-IIIc",
      "B-I",
      "B-IIa",
      "B-IIb",
      "B-IIc",
    ])
    .withMessage("Categoría de licencia no válida"),

  body("vigencia")
    .optional()
    .isISO8601()
    .withMessage("Fecha de vigencia inválida"),

  body("vehiculo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El vehiculo_id debe ser un número positivo"),

  body("codigo_acceso")
    .optional()
    .trim()
    .isLength({ min: 4, max: 45 })
    .withMessage("El código de acceso debe tener entre 4 y 45 caracteres"),

  body("foto")
    .optional()
    .trim()
    .isURL()
    .withMessage("La URL de la foto no es válida"),

  handleValidationErrors,
];

/**
 * Validadores para actualización de personal
 * Similar a create pero todos los campos son opcionales
 */
const validateUpdatePersonal = [
  // No permitir cambiar documento
  body("doc_tipo")
    .not()
    .exists()
    .withMessage("No se permite cambiar el tipo de documento"),

  body("doc_numero")
    .not()
    .exists()
    .withMessage("No se permite cambiar el número de documento"),

  // Resto de campos opcionales (mismo as create pero optional)
  body("apellido_paterno")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido paterno debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido paterno solo puede contener letras"),

  body("apellido_materno")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido materno debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido materno solo puede contener letras"),

  body("nombres")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Los nombres deben tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Los nombres solo pueden contener letras"),

  body("sexo")
    .optional()
    .isIn(["Masculino", "Femenino"])
    .withMessage("El sexo debe ser 'Masculino' o 'Femenino'"),

  body("fecha_nacimiento")
    .optional()
    .isISO8601()
    .withMessage("Fecha de nacimiento inválida"),

  body("cargo_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El cargo_id debe ser un número positivo"),

  body("status")
    .optional()
    .isIn(["Activo", "Inactivo", "Suspendido", "Retirado"])
    .withMessage("Status laboral no válido"),

  handleValidationErrors,
];

/**
 * Validador de ID en parámetros
 */
const validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El ID debe ser un número entero positivo"),
  handleValidationErrors,
];

/**
 * Validador de cargoId en parámetros
 */
const validateCargoId = [
  param("cargoId")
    .isInt({ min: 1 })
    .withMessage("El cargoId debe ser un número entero positivo"),
  handleValidationErrors,
];

/**
 * Validador de status en parámetros
 */
const validateStatusParam = [
  param("status")
    .isIn(["Activo", "Inactivo", "Suspendido", "Retirado"])
    .withMessage("Status no válido"),
  handleValidationErrors,
];

/**
 * Validador para cambio de status
 */
const validateCambiarStatus = [
  ...validateId,
  body("status")
    .notEmpty()
    .withMessage("El status es requerido")
    .isIn(["Activo", "Inactivo", "Suspendido", "Retirado"])
    .withMessage("Status no válido"),

  body("observaciones")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Las observaciones no pueden exceder 500 caracteres"),

  handleValidationErrors,
];

/**
 * Validador para asignar vehículo
 */
const validateAsignarVehiculo = [
  ...validateId,
  body("vehiculo_id")
    .notEmpty()
    .withMessage("El vehiculo_id es requerido")
    .isInt({ min: 1 })
    .withMessage("El vehiculo_id debe ser un número positivo"),

  handleValidationErrors,
];

/**
 * Validador para actualizar licencia
 */
const validateActualizarLicencia = [
  ...validateId,

  body("licencia")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("La licencia debe tener entre 5 y 20 caracteres")
    .matches(/^[A-Z]\d{8}$/i)
    .withMessage("Formato de licencia inválido"),

  body("categoria")
    .optional()
    .isIn([
      "A-I",
      "A-IIa",
      "A-IIb",
      "A-IIIa",
      "A-IIIb",
      "A-IIIc",
      "B-I",
      "B-IIa",
      "B-IIb",
      "B-IIc",
    ])
    .withMessage("Categoría no válida"),

  body("vigencia")
    .optional()
    .isISO8601()
    .withMessage("Fecha de vigencia inválida"),

  handleValidationErrors,
];

// ==========================================
// RUTAS - ORDEN CRÍTICO
// Las rutas más específicas DEBEN ir ANTES que las genéricas
// ==========================================

// ============================================
// RUTAS ESPECIALES - ESTADÍSTICAS (PRIMERO)
// ============================================

/**
 * @route   GET /api/v1/personal/stats
 * @desc    Obtener estadísticas generales del personal
 * @access  Todos los usuarios autenticados
 * @returns {Object} Estadísticas completas
 */
router.get(
  "/stats",
  verificarToken,
  personalController.getEstadisticasPersonal
);

// ============================================
// RUTAS ESPECIALES - BÚSQUEDAS
// ============================================

/**
 * @route   GET /api/v1/personal/conductores
 * @desc    Obtener solo personal con licencia vigente
 * @access  Operador, Supervisor, Administrador
 * @query   page, limit
 */
router.get(
  "/conductores",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission(["personal.personal.read"]),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page debe ser un número positivo"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    handleValidationErrors,
  ],
  personalController.getConductores
);

/**
 * @route   GET /api/v1/personal/disponibles
 * @desc    Obtener personal disponible (sin vehículo asignado)
 * @access  Operador, Supervisor, Administrador
 */
router.get(
  "/disponibles",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission(["personal.personal.read"]),
  personalController.getPersonalDisponible
);

/**
 * @route   GET /api/v1/personal/cargo/:cargoId
 * @desc    Obtener personal por cargo específico
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/cargo/:cargoId",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateCargoId,
  personalController.getPersonalPorCargo
);

/**
 * @route   GET /api/v1/personal/documento/:doc
 * @desc    Buscar personal por documento
 * @access  Todos los usuarios autenticados
 * @param   doc - Formato: TIPO-NUMERO (ej: DNI-12345678)
 */
router.get(
  "/documento/:doc",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  [
    param("doc")
      .matches(/^(DNI|CE|PASAPORTE|PTP)-[A-Z0-9]+$/i)
      .withMessage("Formato inválido. Use: TIPO-NUMERO (ej: DNI-12345678)"),
    handleValidationErrors,
  ],
  personalController.getPersonalByDocumento
);

/**
 * @route   GET /api/v1/personal/status/:status
 * @desc    Obtener personal por status laboral
 * @access  Todos los usuarios autenticados
 * @param   status - Activo | Inactivo | Suspendido | Retirado
 */
router.get(
  "/status/:status",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateStatusParam,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page debe ser un número positivo"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    handleValidationErrors,
  ],
  personalController.getPersonalPorStatus
);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @route   GET /api/v1/personal
 * @desc    Obtener lista de personal con filtros y paginación
 * @access  Todos los usuarios autenticados
 * @query   page, limit, search, cargo_id, status, doc_tipo, tiene_licencia, etc.
 */
router.get(
  "/",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page debe ser un número positivo"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    query("cargo_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("cargo_id debe ser un número positivo"),
    query("status")
      .optional()
      .isIn(["Activo", "Inactivo", "Suspendido", "Retirado"])
      .withMessage("Status no válido"),
    query("doc_tipo")
      .optional()
      .isIn(["DNI", "Carnet Extranjeria", "Pasaporte", "PTP"])
      .withMessage("Tipo de documento no válido"),
    query("tiene_licencia")
      .optional()
      .isIn(["true", "false"])
      .withMessage("tiene_licencia debe ser true o false"),
    query("tiene_vehiculo")
      .optional()
      .isIn(["true", "false"])
      .withMessage("tiene_vehiculo debe ser true o false"),
    handleValidationErrors,
  ],
  personalController.getAllPersonal
);

/**
 * @route   POST /api/v1/personal
 * @desc    Crear un nuevo personal
 * @access  Supervisor, Administrador
 * @body    doc_tipo, doc_numero, apellidos, nombres, etc.
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.personal.create"]),
  validateCreatePersonal,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "MEDIA",
    modulo: "Personal",
  }),
  personalController.createPersonal
);

// ============================================
// RUTAS CON :id - ACCIONES ESPECÍFICAS (ANTES DE GET /:id)
// ============================================

/**
 * @route   POST /api/v1/personal/:id/restore
 * @desc    Restaurar un personal eliminado
 * @access  Administrador
 */
router.post(
  "/:id/restore",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["personal.personal.restore"]),
  validateId,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "MEDIA",
    modulo: "Personal",
  }),
  personalController.restorePersonal
);

/**
 * @route   PATCH /api/v1/personal/:id/status
 * @desc    Cambiar status laboral del personal
 * @access  Supervisor, Administrador
 * @body    { status: "Activo" | "Inactivo" | "Suspendido" | "Retirado" }
 */
router.patch(
  "/:id/status",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.status.update", "personal.personal.update"]),
  validateCambiarStatus,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "ALTA",
    modulo: "Personal",
  }),
  personalController.cambiarStatus
);

/**
 * @route   PATCH /api/v1/personal/:id/asignar-vehiculo
 * @desc    Asignar un vehículo al personal
 * @access  Supervisor, Administrador
 * @body    { vehiculo_id: 5 }
 */
router.patch(
  "/:id/asignar-vehiculo",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission([
    "personal.vehiculo.assign",
    "personal.personal.update",
  ]),
  validateAsignarVehiculo,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "MEDIA",
    modulo: "Personal",
  }),
  personalController.asignarVehiculo
);

/**
 * @route   DELETE /api/v1/personal/:id/desasignar-vehiculo
 * @desc    Desasignar el vehículo del personal
 * @access  Supervisor, Administrador
 */
router.delete(
  "/:id/desasignar-vehiculo",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission([
    "personal.vehiculo.assign",
    "personal.personal.update",
  ]),
  validateId,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "MEDIA",
    modulo: "Personal",
  }),
  personalController.desasignarVehiculo
);

/**
 * @route   PATCH /api/v1/personal/:id/licencia
 * @desc    Actualizar datos de licencia de conducir
 * @access  Supervisor, Administrador
 * @body    { licencia, categoria, vigencia }
 */
router.patch(
  "/:id/licencia",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.personal.update"]),
  validateActualizarLicencia,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "BAJA",
    modulo: "Personal",
  }),
  personalController.actualizarLicencia
);

/**
 * @route   POST /api/v1/personal/:id/generar-codigo
 * @desc    Generar código de acceso automático
 * @access  Supervisor, Administrador
 */
router.post(
  "/:id/generar-codigo",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.personal.update"]),
  validateId,
  personalController.generarCodigoAcceso
);

/**
 * @route   GET /api/v1/personal/:id/verificar-licencia
 * @desc    Verificar vigencia de licencia
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id/verificar-licencia",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateId,
  personalController.verificarLicenciaVigente
);

/**
 * @route   GET /api/v1/personal/:id/historial-novedades
 * @desc    Obtener historial de novedades del personal
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id/historial-novedades",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateId,
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    handleValidationErrors,
  ],
  personalController.getHistorialNovedades
);

// ============================================
// RUTAS CRUD - GET, PUT, DELETE /:id (AL FINAL)
// ============================================

/**
 * @route   GET /api/v1/personal/:id
 * @desc    Obtener un personal específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateId,
  personalController.getPersonalById
);

/**
 * @route   PUT /api/v1/personal/:id
 * @desc    Actualizar un personal existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.personal.update"]),
  validateId,
  validateUpdatePersonal,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "MEDIA",
    modulo: "Personal",
  }),
  personalController.updatePersonal
);

/**
 * @route   DELETE /api/v1/personal/:id
 * @desc    Eliminar un personal (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["personal.personal.delete"]),
  validateId,
  registrarAuditoria({
    entidad: "PersonalSeguridad",
    severidad: "ALTA",
    modulo: "Personal",
  }),
  personalController.deletePersonal
);

// ==========================================
// EXPORTAR ROUTER
// ==========================================

export default router;
