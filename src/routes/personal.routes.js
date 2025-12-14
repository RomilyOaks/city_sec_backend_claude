/**
 * ===================================================
 * RUTAS: PersonalSeguridad - VERSIÓN FINAL CORREGIDA
 * ===================================================
 *
 * Ruta: src/routes/personal.routes.js
 *
 * CORRECCIONES:
 * ✅ Categorías en MAYÚSCULAS
 * ✅ handleValidationErrors mejorado con detalles JSON
 *
 * @version 1.0.2
 * @date 2025-12-14
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
// ✅ MIDDLEWARE DE VALIDACIÓN MEJORADO
// ==========================================

/**
 * Middleware mejorado para manejar errores de validación
 * Formatea respuestas con detalles estructurados para errores específicos
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Formatear errores con detalles contextuales
    const formattedErrors = errors.array().map((err) => {
      const baseError = {
        field: err.path || err.param,
        value: err.value,
        message: err.msg,
      };

      // ✅ CASO ESPECIAL: Categoría de licencia
      if (err.path === "categoria") {
        const categorias = [
          "A-I",
          "A-IIA",
          "A-IIB",
          "A-IIIA",
          "A-IIIB",
          "A-IIIC",
          "B-I",
          "B-IIA",
          "B-IIB",
          "B-IIC",
        ];

        // Solo agregar detalles si el valor NO es válido
        const valorNormalizado =
          err.value?.toString().trim().toUpperCase() || "";
        if (!categorias.includes(valorNormalizado)) {
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
                    {
                      codigo: "A-IIA",
                      descripcion: "Motocicletas hasta 400cc",
                    },
                    {
                      codigo: "A-IIB",
                      descripcion: "Motocicletas sin límite de cilindrada",
                    },
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
              nota: "Debe usar mayúsculas y guion medio (-)",
            },
          };
        }
      }

      // ✅ CASO ESPECIAL: Tipo de documento
      if (err.path === "doc_tipo") {
        const tiposValidos = ["DNI", "Carnet Extranjeria", "Pasaporte", "PTP"];
        if (!tiposValidos.includes(err.value)) {
          return {
            ...baseError,
            details: {
              codigo_error: "INVALID_DOC_TIPO",
              valor_recibido: err.value,
              tipos_validos: tiposValidos,
              ejemplos: {
                DNI: "Documento Nacional de Identidad (8 dígitos)",
                "Carnet Extranjeria": "Carnet de Extranjería (9 caracteres)",
                Pasaporte: "Pasaporte (6-12 caracteres alfanuméricos)",
                PTP: "Permiso Temporal de Permanencia",
              },
            },
          };
        }
      }

      // ✅ CASO ESPECIAL: Status laboral
      if (err.path === "status") {
        const statusValidos = ["Activo", "Inactivo", "Suspendido", "Retirado"];
        if (!statusValidos.includes(err.value)) {
          return {
            ...baseError,
            details: {
              codigo_error: "INVALID_STATUS",
              valor_recibido: err.value,
              status_validos: statusValidos,
              descripciones: {
                Activo: "Personal trabajando actualmente",
                Inactivo: "Personal temporalmente sin actividad",
                Suspendido: "Personal sancionado temporalmente",
                Retirado: "Personal que ya no trabaja en la institución",
              },
            },
          };
        }
      }

      // Error genérico (sin detalles adicionales)
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

      if (tipo === "DNI" && !/^\d{8}$/.test(value)) {
        throw new Error("El DNI debe tener exactamente 8 dígitos");
      }

      if (tipo === "Carnet Extranjeria" && !/^[A-Z0-9]{9}$/i.test(value)) {
        throw new Error(
          "El Carnet de Extranjería debe tener 9 caracteres alfanuméricos"
        );
      }

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
      "A-IIA",
      "A-IIB",
      "A-IIIA",
      "A-IIIB",
      "A-IIIC",
      "B-I",
      "B-IIA",
      "B-IIB",
      "B-IIC",
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

const validateUpdatePersonal = [
  body("doc_tipo")
    .not()
    .exists()
    .withMessage("No se permite cambiar el tipo de documento"),

  body("doc_numero")
    .not()
    .exists()
    .withMessage("No se permite cambiar el número de documento"),

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

const validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El ID debe ser un número entero positivo"),
  handleValidationErrors,
];

const validateCargoId = [
  param("cargoId")
    .isInt({ min: 1 })
    .withMessage("El cargoId debe ser un número entero positivo"),
  handleValidationErrors,
];

const validateStatusParam = [
  param("status")
    .isIn(["Activo", "Inactivo", "Suspendido", "Retirado"])
    .withMessage("Status no válido"),
  handleValidationErrors,
];

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

const validateAsignarVehiculo = [
  ...validateId,
  body("vehiculo_id")
    .notEmpty()
    .withMessage("El vehiculo_id es requerido")
    .isInt({ min: 1 })
    .withMessage("El vehiculo_id debe ser un número positivo"),

  handleValidationErrors,
];

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
      "A-IIA",
      "A-IIB",
      "A-IIIA",
      "A-IIIB",
      "A-IIIC",
      "B-I",
      "B-IIA",
      "B-IIB",
      "B-IIC",
    ])
    .withMessage("Categoría no válida"),

  body("vigencia")
    .optional()
    .isISO8601()
    .withMessage("Fecha de vigencia inválida"),

  handleValidationErrors,
];

// ==========================================
// RUTAS
// ==========================================

router.get(
  "/stats",
  verificarToken,
  personalController.getEstadisticasPersonal
);

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

router.get(
  "/disponibles",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  requireAnyPermission(["personal.personal.read"]),
  personalController.getPersonalDisponible
);

router.get(
  "/cargo/:cargoId",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateCargoId,
  personalController.getPersonalPorCargo
);

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

router.post(
  "/:id/generar-codigo",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["personal.personal.update"]),
  validateId,
  personalController.generarCodigoAcceso
);

router.get(
  "/:id/verificar-licencia",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateId,
  personalController.verificarLicenciaVigente
);

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

router.get(
  "/licencias-por-vencer",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  [
    query("dias")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("dias debe ser un número entre 1 y 365"),
    handleValidationErrors,
  ],
  personalController.getLicenciasPorVencer
);

router.get(
  "/:id",
  verificarToken,
  requireAnyPermission(["personal.personal.read"]),
  validateId,
  personalController.getPersonalById
);

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

export default router;
