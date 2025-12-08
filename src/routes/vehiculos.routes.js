/**
 * ============================================
 * RUTAS: src/routes/vehiculos.routes.js
 * ============================================
 *
 * Rutas de Vehículos - COMPLETO
 * Define los endpoints REST para gestión de vehículos con control RBAC
 * Incluye todas las funciones: CRUD, estadísticas, historial y abastecimientos
 */

import express from "express";
const router = express.Router();
import * as vehiculosController from "../controllers/vehiculosController.js";
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { body, param, query, validationResult } from "express-validator";

// Middleware de validación de errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   GET /api/vehiculos/stats
 * @desc    Obtener estadísticas de vehículos
 * @access  Todos los usuarios autenticados
 * IMPORTANTE: Esta ruta debe ir ANTES de /api/vehiculos/disponibles y /:id
 */
router.get(
  "/stats",
  verificarToken,
  vehiculosController.getEstadisticasVehiculos
);

/**
 * @route   GET /api/vehiculos/disponibles
 * @desc    Obtener vehículos disponibles (no asignados a novedades activas)
 * @access  Operador, Supervisor, Administrador
 * @query   tipo_id
 */
router.get(
  "/disponibles",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor", "operador"]),
  [
    query("tipo_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("tipo_id debe ser un número positivo"),
    handleValidationErrors,
  ],
  vehiculosController.getVehiculosDisponibles
);

/**
 * @route   GET /api/vehiculos
 * @desc    Obtener todos los vehículos con filtros opcionales
 * @access  Todos los usuarios autenticados
 * @query   tipo, tipo_id, estado_operativo, unidad_id, search, page, limit
 */
router.get(
  "/",
  verificarToken,
  [
    query("tipo").optional().isString().trim(),
    query("tipo_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("tipo_id debe ser un número positivo"),
    query("estado_operativo")
      .optional()
      .isIn([
        "DISPONIBLE",
        "EN_SERVICIO",
        "MANTENIMIENTO",
        "REPARACION",
        "FUERA_DE_SERVICIO",
        "INACTIVO",
      ])
      .withMessage("Estado operativo no válido"),
    query("unidad_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("unidad_id debe ser un número positivo"),
    query("search").optional().isString().trim(),
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
  vehiculosController.getAllVehiculos
);

/**
 * @route   GET /api/vehiculos/:id/historial
 * @desc    Obtener historial de uso del vehículo (novedades)
 * @access  Todos los usuarios autenticados
 * @query   limit
 */
router.get(
  "/:id/historial",
  verificarToken,
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    handleValidationErrors,
  ],
  vehiculosController.getHistorialVehiculo
);

/**
 * @route   GET /api/vehiculos/:id/abastecimientos
 * @desc    Obtener historial de abastecimientos de un vehículo
 * @access  Todos los usuarios autenticados
 * @query   fecha_inicio, fecha_fin, limit
 */
router.get(
  "/:id/abastecimientos",
  verificarToken,
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage("Fecha inicio inválida"),
    query("fecha_fin").optional().isISO8601().withMessage("Fecha fin inválida"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    handleValidationErrors,
  ],
  vehiculosController.getHistorialAbastecimientos
);

/**
 * @route   GET /api/vehiculos/:id
 * @desc    Obtener un vehículo específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  verificarToken,
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),
    handleValidationErrors,
  ],
  vehiculosController.getVehiculoById
);

/**
 * @route   POST /api/vehiculos
 * @desc    Crear un nuevo vehículo
 * @access  Supervisor, Administrador
 * @body    tipo_id, placa, marca, nombre, etc.
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["vehiculos.vehiculos.create"]),
  [
    body("tipo_id")
      .notEmpty()
      .withMessage("El tipo de vehículo es requerido")
      .isInt({ min: 1 })
      .withMessage("tipo_id debe ser un número válido"),

    body("placa")
      .notEmpty()
      .withMessage("La placa es requerida")
      .matches(/^[A-Z0-9-]{6,10}$/i)
      .withMessage("Formato de placa inválido (6-10 caracteres alfanuméricos)"),

    body("codigo_vehiculo")
      .optional()
      .isLength({ max: 10 })
      .withMessage("El código no puede exceder 10 caracteres"),

    body("nombre")
      .optional()
      .isLength({ max: 100 })
      .withMessage("El nombre no puede exceder 100 caracteres"),

    body("marca")
      .optional()
      .isLength({ max: 50 })
      .withMessage("La marca no puede exceder 50 caracteres"),

    body("modelo")
      .optional()
      .isLength({ max: 50 })
      .withMessage("El modelo no puede exceder 50 caracteres"),

    body("anio")
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Año inválido"),

    body("kilometraje_inicial")
      .optional()
      .isInt({ min: 0 })
      .withMessage("El kilometraje inicial debe ser un número positivo"),

    body("fec_soat")
      .optional()
      .isISO8601()
      .withMessage("Fecha de SOAT inválida"),

    body("fec_manten")
      .optional()
      .isISO8601()
      .withMessage("Fecha de mantenimiento inválida"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  vehiculosController.createVehiculo
);

/**
 * @route   PUT /api/vehiculos/:id
 * @desc    Actualizar un vehículo existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["vehiculos.vehiculos.update"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),

    body("placa")
      .optional()
      .matches(/^[A-Z0-9-]{6,10}$/i)
      .withMessage("Formato de placa inválido"),

    body("codigo_vehiculo")
      .optional()
      .isLength({ max: 10 })
      .withMessage("El código no puede exceder 10 caracteres"),

    body("marca")
      .optional()
      .isLength({ max: 50 })
      .withMessage("La marca no puede exceder 50 caracteres"),

    body("anio")
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Año inválido"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  vehiculosController.updateVehiculo
);

/**
 * @route   PATCH /api/vehiculos/:id/kilometraje
 * @desc    Actualizar kilometraje del vehículo
 * @access  Operador, Supervisor, Administrador
 */
router.patch(
  "/:id/kilometraje",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin", "super_admin"]),
  requireAnyPermission([
    "vehiculos.kilometraje.update",
    "vehiculos.vehiculos.update",
  ]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),

    body("kilometraje_nuevo")
      .notEmpty()
      .withMessage("El kilometraje nuevo es requerido")
      .isInt({ min: 0 })
      .withMessage("El kilometraje debe ser un número positivo"),

    body("observaciones")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Las observaciones no pueden exceder 500 caracteres"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "BAJA",
    modulo: "Vehiculos",
  }),
  vehiculosController.actualizarKilometraje
);

/**
 * @route   PATCH /api/vehiculos/:id/estado
 * @desc    Cambiar estado operativo del vehículo
 * @access  Operador, Supervisor, Administrador
 */
router.patch(
  "/:id/estado",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin", "super_admin"]),
  requireAnyPermission([
    "vehiculos.estado.update",
    "vehiculos.vehiculos.update",
  ]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),

    body("estado_operativo")
      .notEmpty()
      .withMessage("El estado operativo es requerido")
      .isIn([
        "DISPONIBLE",
        "EN_SERVICIO",
        "MANTENIMIENTO",
        "REPARACION",
        "FUERA_DE_SERVICIO",
        "INACTIVO",
      ])
      .withMessage("Estado operativo no válido"),

    body("observaciones")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Las observaciones no pueden exceder 500 caracteres"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "MEDIA",
    modulo: "Vehiculos",
  }),
  vehiculosController.cambiarEstadoOperativo
);

/**
 * @route   POST /api/vehiculos/:id/abastecimiento
 * @desc    Registrar abastecimiento de combustible
 * @access  Operador, Supervisor, Administrador
 * @body    fecha_hora, tipo_combustible, cantidad_galones, km_actual, etc.
 */
router.post(
  "/:id/abastecimiento",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin", "super_admin"]),
  requireAnyPermission([
    "vehiculos.abastecimiento.create",
    "vehiculos.vehiculos.update",
  ]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),

    body("fecha_hora")
      .notEmpty()
      .withMessage("La fecha y hora son requeridas")
      .isISO8601()
      .withMessage("Formato de fecha inválido"),

    body("tipo_combustible")
      .notEmpty()
      .withMessage("El tipo de combustible es requerido")
      .isIn([
        "GASOLINA_84",
        "GASOLINA_90",
        "GASOLINA_95",
        "GASOLINA_97",
        "DIESEL",
        "GLP",
        "GNV",
      ])
      .withMessage("Tipo de combustible no válido"),

    body("cantidad_galones")
      .notEmpty()
      .withMessage("La cantidad es requerida")
      .isFloat({ min: 0.1 })
      .withMessage("La cantidad debe ser mayor a 0"),

    body("precio_galon")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El precio debe ser un número positivo"),

    body("km_actual")
      .optional()
      .isInt({ min: 0 })
      .withMessage("El kilometraje debe ser un número positivo"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Abastecimiento",
    severidad: "BAJA",
    modulo: "Vehiculos",
  }),
  vehiculosController.registrarAbastecimiento
);

/**
 * @route   DELETE /api/vehiculos/:id
 * @desc    Eliminar un vehículo (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["vehiculos.vehiculos.delete"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de vehículo inválido"),
    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Vehiculo",
    severidad: "ALTA",
    modulo: "Vehiculos",
  }),
  vehiculosController.deleteVehiculo
);

export default router;
