/**
 * ============================================================================
 * ARCHIVO: src/routes/vehiculo-cuadrantes-asignados.routes.js
 * DESCRIPCIÓN: Rutas para gestión de asignaciones de vehículos a cuadrantes
 *              Define endpoints RESTful con control de acceso basado en permisos
 * ============================================================================
 *
 * PROPÓSITO:
 * - Definir rutas del API para asignaciones de vehículos a cuadrantes
 * - Aplicar middleware de autenticación y autorización por permisos
 * - Documentar endpoints para Swagger
 * - Organizar rutas siguiendo convenciones REST
 *
 * PERMISOS UTILIZADOS:
 * - vehiculos.cuadrantes.asignados.read: Ver asignaciones
 * - vehiculos.cuadrantes.asignados.create: Crear asignaciones
 * - vehiculos.cuadrantes.asignados.update: Actualizar asignaciones
 * - vehiculos.cuadrantes.asignados.delete: Eliminar asignaciones
 *
 * @author Claude AI
 * @date 2024-07-30
 * ============================================================================
 */

import express from "express";
const router = express.Router();

// ============================================================================
// IMPORTAR CONTROLADORES
// ============================================================================
import vehiculoCuadrantesAsignadosController from "../controllers/vehiculoCuadrantesAsignadosController.js";

// ============================================================================
// IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
// ============================================================================
import {
  verificarToken,
  verificarRoles, // Aunque no se usen directamente en todas las rutas, se mantiene por consistencia
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// ============================================================================
// IMPORTAR VALIDADORES (PLACEHOLDER - CREAR EN EL FUTURO)
// ============================================================================
// import {
//   validateCreateVehiculoCuadranteAsignado,
//   validateUpdateVehiculoCuadranteAsignado,
//   validateVehiculoCuadranteAsignadoId,
// } from "../validators/vehiculoCuadranteAsignado.validator.js";

// ============================================================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ============================================================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: VehiculoCuadrantesAsignados
 *   description: Gestión de asignaciones de vehículos a cuadrantes
 */

// Slugs de permisos
const permisos = {
  leer: "vehiculos.cuadrantes.asignados.read",
  crear: "vehiculos.cuadrantes.asignados.create",
  actualizar: "vehiculos.cuadrantes.asignados.update",
  eliminar: "vehiculos.cuadrantes.asignados.delete",
};

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
// Todas las rutas siguientes requieren autenticación
// ============================================================================
router.use(verificarToken);

// ============================================================================
// RUTAS CRUD PRINCIPALES
// ============================================================================

/**
 * @route   GET /api/vehiculo-cuadrantes-asignados
 * @desc    Obtener todas las asignaciones con filtros y paginación
 * @access  Usuarios con permiso de lectura
 */
router.get("/", requireAnyPermission([permisos.leer]), (req, res, next) => {
  // #swagger.tags = ['VehiculoCuadrantesAsignados']
  // #swagger.summary = 'Listar asignaciones de vehículos a cuadrantes'
  // #swagger.security = [{ bearerAuth: [] }]
  // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
  // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 20 }
  // #swagger.responses[200] = { description: 'OK' }
  return vehiculoCuadrantesAsignadosController.listarTodos(req, res, next);
});

/**
 * @route   GET /api/vehiculo-cuadrantes-asignados/:id
 * @desc    Obtener una asignación específica por ID
 * @access  Usuarios con permiso de lectura
 */
router.get(
  "/:id",
  requireAnyPermission([permisos.leer]),
  // validateVehiculoCuadranteAsignadoId, // Habilitar cuando se cree el validador
  (req, res, next) => {
    // #swagger.tags = ['VehiculoCuadrantesAsignados']
    // #swagger.summary = 'Obtener asignación por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Asignación no encontrada' }
    return vehiculoCuadrantesAsignadosController.obtenerPorId(req, res, next);
  }
);

/**
 * @route   POST /api/vehiculo-cuadrantes-asignados
 * @desc    Crear una nueva asignación
 * @access  Usuarios con permiso de creación
 */
router.post(
  "/",
  requireAnyPermission([permisos.crear]),
  // validateCreateVehiculoCuadranteAsignado, // Habilitar cuando se cree el validador
  registrarAuditoria({
    entidad: "VehiculoCuadranteAsignado",
    severidad: "MEDIA",
    modulo: "VehiculosCuadrantesAsignados",
  }),
  (req, res, next) => {
    // #swagger.tags = ['VehiculoCuadrantesAsignados']
    // #swagger.summary = 'Crear nueva asignación'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VehiculoCuadranteAsignadoCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación' }
    return vehiculoCuadrantesAsignadosController.crear(req, res, next);
  }
);

/**
 * @route   PUT /api/vehiculo-cuadrantes-asignados/:id
 * @desc    Actualizar una asignación existente
 * @access  Usuarios con permiso de actualización
 */
router.put(
  "/:id",
  requireAnyPermission([permisos.actualizar]),
  // validateUpdateVehiculoCuadranteAsignado, // Habilitar cuando se cree el validador
  registrarAuditoria({
    entidad: "VehiculoCuadranteAsignado",
    severidad: "MEDIA",
    modulo: "VehiculosCuadrantesAsignados",
  }),
  (req, res, next) => {
    // #swagger.tags = ['VehiculoCuadrantesAsignados']
    // #swagger.summary = 'Actualizar asignación'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VehiculoCuadranteAsignadoUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación' }
    // #swagger.responses[404] = { description: 'Asignación no encontrada' }
    return vehiculoCuadrantesAsignadosController.actualizar(req, res, next);
  }
);

/**
 * @route   DELETE /api/vehiculo-cuadrantes-asignados/:id
 * @desc    Eliminar una asignación (soft delete)
 * @access  Usuarios con permiso de eliminación
 */
router.delete(
  "/:id",
  requireAnyPermission([permisos.eliminar]),
  // validateVehiculoCuadranteAsignadoId, // Habilitar cuando se cree el validador
  registrarAuditoria({
    entidad: "VehiculoCuadranteAsignado",
    severidad: "ALTA",
    modulo: "VehiculosCuadrantesAsignados",
  }),
  (req, res, next) => {
    // #swagger.tags = ['VehiculoCuadrantesAsignados']
    // #swagger.summary = 'Eliminar asignación (soft delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Asignación no encontrada' }
    return vehiculoCuadrantesAsignadosController.eliminar(req, res, next);
  }
);

// ============================================================================
// EXPORTACIÓN
// ============================================================================
export default router;
