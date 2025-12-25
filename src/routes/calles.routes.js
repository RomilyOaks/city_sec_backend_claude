/**
 * ============================================================================
 * ARCHIVO: src/routes/calles.routes.js
 * VERSIÓN: 2.2.2 (Actualizado con slugs correctos de permisos)
 * DESCRIPCIÓN: Rutas para gestión de calles
 *              Define endpoints RESTful con control de acceso basado en permisos
 * ============================================================================
 *
 * PROPÓSITO:
 * - Definir rutas del API para calles
 * - Aplicar middleware de autenticación y autorización por permisos
 * - Documentar endpoints para Swagger
 * - Organizar rutas siguiendo convenciones REST
 *
 * ENDPOINTS DEFINIDOS:
 * - GET    /api/calles                      - Listar todas
 * - GET    /api/calles/activas              - Listar activas
 * - GET    /api/calles/autocomplete         - Búsqueda autocomplete
 * - GET    /api/calles/urbanizacion/:nombre - Calles por urbanización
 * - GET    /api/calles/:id                  - Obtener por ID
 * - GET    /api/calles/:id/cuadrantes       - Cuadrantes de la calle
 * - GET    /api/calles/:id/direcciones      - Direcciones de la calle
 * - POST   /api/calles                      - Crear
 * - PUT    /api/calles/:id                  - Actualizar
 * - DELETE /api/calles/:id                  - Eliminar
 *
 * PERMISOS UTILIZADOS (según seedRBAC.js):
 * - calles.calles.read: Ver calles
 * - calles.calles.create: Crear calles
 * - calles.calles.update: Actualizar calles
 * - calles.calles.delete: Eliminar calles
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import express from "express";
const router = express.Router();

// ============================================================================
// IMPORTAR CONTROLADORES
// ============================================================================
import callesController from "../controllers/callesController.js";

// ============================================================================
// IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
// ============================================================================
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// ============================================================================
// IMPORTAR VALIDADORES
// ============================================================================
import {
  validateCreateCalle,
  validateUpdateCalle,
  validateCalleId,
} from "../validators/calle.validator.js";

// ============================================================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ============================================================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: Calles
 *   description: Gestión del maestro de calles del distrito
 */

// ============================================================================
// RUTAS ESPECIALES (ANTES DE /:id PARA EVITAR CONFLICTOS)
// ============================================================================

/**
 * @route   GET /api/calles/activas
 * @desc    Obtener calles activas para selects/combos
 * @access  Todos los usuarios autenticados
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get(
  "/activas",
  verificarToken,
  requireAnyPermission(["calles.calles.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Listar calles activas (para selects)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autenticado' }
    return callesController.listarActivas(req, res, next);
  }
);

/**
 * @route   GET /api/calles/autocomplete
 * @desc    Búsqueda de calles para autocomplete (mínimo 2 caracteres)
 * @access  Todos los usuarios autenticados
 * @query   q (string requerido), limit (integer opcional)
 */
router.get(
  "/autocomplete",
  verificarToken,
  requireAnyPermission(["calles.calles.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Búsqueda autocomplete de calles'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['q'] = { in: 'query', required: true, type: 'string', example: 'ejerc' }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 20 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación (mínimo 2 caracteres)' }
    return callesController.autocomplete(req, res, next);
  }
);

/**
 * @route   GET /api/calles/urbanizacion/:nombre
 * @desc    Obtener calles de una urbanización específica
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/urbanizacion/:nombre",
  verificarToken,
  requireAnyPermission(["calles.calles.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Calles por urbanización'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['nombre'] = { in: 'path', required: true, type: 'string', example: 'AAHH Villa El Salvador' }
    // #swagger.responses[200] = { description: 'OK' }
    return callesController.porUrbanizacion(req, res, next);
  }
);

/**
 * @route   GET /api/calles/:id/cuadrantes
 * @desc    Obtener cuadrantes asociados a una calle
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id/cuadrantes",
  verificarToken,
  requireAnyPermission(["calles.calles.read", "ubicacion.cuadrantes.read"]),
  validateCalleId,
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Cuadrantes de una calle'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Calle no encontrada' }
    return callesController.obtenerCuadrantes(req, res, next);
  }
);

/**
 * @route   GET /api/calles/:id/direcciones
 * @desc    Obtener direcciones de una calle
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id/direcciones",
  verificarToken,
  requireAnyPermission(["calles.calles.read", "calles.direcciones.read"]),
  validateCalleId,
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Direcciones de una calle'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Calle no encontrada' }
    return callesController.obtenerDirecciones(req, res, next);
  }
);

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
// ============================================================================
// Todas las rutas siguientes requieren autenticación
router.use(verificarToken);

// ============================================================================
// RUTAS CRUD PRINCIPALES
// ============================================================================

/**
 * @route   GET /api/calles
 * @desc    Obtener todas las calles con filtros y paginación
 * @access  Todos los usuarios autenticados
 * @query   page, limit, search, tipo_via_id, es_principal, categoria_via
 */
router.get(
  "/",
  requireAnyPermission(["calles.calles.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Listar calles con filtros'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 20 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'ejercito' }
    // #swagger.parameters['tipo_via_id'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['es_principal'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['categoria_via'] = { in: 'query', required: false, type: 'string', example: 'ARTERIAL' }
    // #swagger.responses[200] = { description: 'OK' }
    return callesController.listarTodas(req, res, next);
  }
);

/**
 * @route   GET /api/calles/:id
 * @desc    Obtener una calle específica por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  requireAnyPermission(["calles.calles.read"]),
  validateCalleId,
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Obtener calle por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Calle no encontrada' }
    return callesController.obtenerPorId(req, res, next);
  }
);

/**
 * @route   POST /api/calles
 * @desc    Crear una nueva calle
 * @access  Operador, Supervisor, Administrador
 * @body    tipo_via_id, nombre_via, ubigeo_code, urbanizacion, etc.
 */
router.post(
  "/",
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission(["calles.calles.create"]),
  validateCreateCalle,
  registrarAuditoria({
    entidad: "Calle",
    severidad: "MEDIA",
    modulo: "Calles",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Crear nueva calle'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CalleCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación (nombre duplicado en tipo de vía)' }
    // #swagger.responses[401] = { description: 'No autenticado' }
    // #swagger.responses[403] = { description: 'No autorizado' }
    return callesController.crear(req, res, next);
  }
);

/**
 * @route   PUT /api/calles/:id
 * @desc    Actualizar una calle existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["calles.calles.update"]),
  validateUpdateCalle,
  registrarAuditoria({
    entidad: "Calle",
    severidad: "MEDIA",
    modulo: "Calles",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Actualizar calle'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CalleUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación' }
    // #swagger.responses[404] = { description: 'Calle no encontrada' }
    return callesController.actualizar(req, res, next);
  }
);

/**
 * @route   DELETE /api/calles/:id
 * @desc    Eliminar una calle (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarRoles(["super_admin"]),
  requireAnyPermission(["calles.calles.delete"]),
  validateCalleId,
  registrarAuditoria({
    entidad: "Calle",
    severidad: "ALTA",
    modulo: "Calles",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Calles']
    // #swagger.summary = 'Eliminar calle (soft delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'No se puede eliminar (tiene direcciones activas)' }
    // #swagger.responses[404] = { description: 'Calle no encontrada' }
    return callesController.eliminar(req, res, next);
  }
);

// ============================================================================
// EXPORTACIÓN
// ============================================================================
export default router;

/**
 * CAMBIOS EN v2.2.2:
 *
 * ✅ PERMISOS ACTUALIZADOS CON SLUGS CORRECTOS:
 * - calles.view      → calles.calles.read
 * - calles.create    → calles.calles.create
 * - calles.update    → calles.calles.update
 * - calles.delete    → calles.calles.delete
 *
 * ✅ PERMISOS ADICIONALES REFERENCIADOS:
 * - ubicacion.cuadrantes.read (para /:id/cuadrantes)
 * - calles.direcciones.read (para /:id/direcciones)
 *
 * Los slugs ahora coinciden exactamente con los generados por seedRBAC.js:
 * - Módulo: "calles"
 * - Recurso: "calles"
 * - Acciones: read, create, update, delete
 *
 * NOTAS DE INTEGRACIÓN:
 *
 * 1. PERMISOS EN BD:
 *    - calles.calles.read
 *    - calles.calles.create
 *    - calles.calles.update
 *    - calles.calles.delete
 *    - ubicacion.cuadrantes.read (debe existir en módulo ubicación)
 *    - calles.direcciones.read
 *
 * 2. ROLES CON ACCESO:
 *    - Lectura: Todos los usuarios autenticados
 *    - Crear: operador, supervisor, super_admin
 *    - Actualizar: supervisor, super_admin
 *    - Eliminar: super_admin
 *
 * 3. VALIDACIONES ESPECIALES:
 *    - No se puede eliminar si tiene direcciones activas
 *    - Autocomplete requiere mínimo 2 caracteres
 *    - Nombre de calle único por tipo de vía
 */
