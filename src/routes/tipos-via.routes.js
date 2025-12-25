/**
 * ============================================================================
 * ARCHIVO: src/routes/tipos-via.routes.js
 * VERSIÓN: 2.2.2 (Actualizado con slugs correctos de permisos)
 * DESCRIPCIÓN: Rutas para gestión de tipos de vía
 *              Define endpoints RESTful con control de acceso basado en permisos
 * ============================================================================
 *
 * PROPÓSITO:
 * - Definir rutas del API para tipos de vía
 * - Aplicar middleware de autenticación y autorización por permisos
 * - Documentar endpoints para Swagger
 * - Organizar rutas siguiendo convenciones REST
 *
 * ENDPOINTS DEFINIDOS:
 * - GET    /api/tipos-via              - Listar todos
 * - GET    /api/tipos-via/activos      - Listar activos
 * - GET    /api/tipos-via/:id          - Obtener por ID
 * - POST   /api/tipos-via              - Crear
 * - PUT    /api/tipos-via/:id          - Actualizar
 * - DELETE /api/tipos-via/:id          - Eliminar
 * - PATCH  /api/tipos-via/:id/activar  - Activar
 * - PATCH  /api/tipos-via/:id/desactivar - Desactivar
 *
 * PERMISOS UTILIZADOS (según seedRBAC.js):
 * - calles.tipos_via.read: Ver tipos de vía
 * - calles.tipos_via.create: Crear tipos de vía
 * - calles.tipos_via.update: Actualizar tipos de vía
 * - calles.tipos_via.delete: Eliminar tipos de vía
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
import tiposViaController from "../controllers/tiposViaController.js";

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
  validateCreateTipoVia,
  validateUpdateTipoVia,
  validateTipoViaId,
} from "../validators/tipo-via.validator.js";

// ============================================================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ============================================================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: Tipos de Vía
 *   description: Gestión del catálogo de tipos de vía (Av, Jr, Ca, etc.)
 */

// ============================================================================
// RUTAS ESPECIALES (ANTES DE /:id PARA EVITAR CONFLICTOS)
// ============================================================================

/**
 * @route   GET /api/tipos-via/activos
 * @desc    Obtener tipos de vía activos para selects/combos
 * @access  Público (usado en formularios)
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get("/activos", (req, res, next) => {
  // #swagger.tags = ['Tipos de Vía']
  // #swagger.summary = 'Listar tipos de vía activos (para selects)'
  // #swagger.responses[200] = { description: 'OK' }
  return tiposViaController.listarActivos(req, res, next);
});
// NOTA: Esta ruta está pública porque se usa en formularios sin login

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================================================
// Todas las rutas siguientes requieren autenticación
router.use(verificarToken);

// ============================================================================
// RUTAS CRUD PRINCIPALES
// ============================================================================

/**
 * @route   GET /api/tipos-via
 * @desc    Obtener todos los tipos de vía con filtros y paginación
 * @access  Todos los usuarios autenticados
 * @query   page, limit, search, estado
 */
router.get(
  "/",
  requireAnyPermission(["calles.tipos_via.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Tipos de Vía']
    // #swagger.summary = 'Listar tipos de vía con filtros'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 10 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'avenida' }
    // #swagger.parameters['estado'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autenticado' }
    return tiposViaController.listarTodos(req, res, next);
  }
);

/**
 * @route   GET /api/tipos-via/:id
 * @desc    Obtener un tipo de vía específico por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  requireAnyPermission(["calles.tipos_via.read"]),
  validateTipoViaId,
  (req, res, next) => {
    // #swagger.tags = ['Tipos de Vía']
    // #swagger.summary = 'Obtener tipo de vía por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Tipo de vía no encontrado' }
    return tiposViaController.obtenerPorId(req, res, next);
  }
);

/**
 * @route   POST /api/tipos-via
 * @desc    Crear un nuevo tipo de vía
 * @access  Supervisor, Administrador
 * @body    codigo, nombre, abreviatura, descripcion, orden
 */
router.post(
  "/",
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["calles.tipos_via.create"]),
  validateCreateTipoVia,
  registrarAuditoria({
    entidad: "TipoVia",
    severidad: "MEDIA",
    modulo: "Tipos de Vía",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Tipos de Vía']
    // #swagger.summary = 'Crear nuevo tipo de vía'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TipoViaCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación (código duplicado)' }
    // #swagger.responses[401] = { description: 'No autenticado' }
    // #swagger.responses[403] = { description: 'No autorizado' }
    return tiposViaController.crear(req, res, next);
  }
);

/**
 * @route   PUT /api/tipos-via/:id
 * @desc    Actualizar un tipo de vía existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["calles.tipos_via.update"]),
  validateUpdateTipoVia,
  registrarAuditoria({
    entidad: "TipoVia",
    severidad: "MEDIA",
    modulo: "Tipos de Vía",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Tipos de Vía']
    // #swagger.summary = 'Actualizar tipo de vía'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TipoViaUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación' }
    // #swagger.responses[404] = { description: 'Tipo de vía no encontrado' }
    return tiposViaController.actualizar(req, res, next);
  }
);

/**
 * @route   DELETE /api/tipos-via/:id
 * @desc    Eliminar un tipo de vía (desactivar)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarRoles(["super_admin"]),
  requireAnyPermission(["calles.tipos_via.delete"]),
  validateTipoViaId,
  registrarAuditoria({
    entidad: "TipoVia",
    severidad: "ALTA",
    modulo: "Tipos de Vía",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Tipos de Vía']
    // #swagger.summary = 'Eliminar tipo de vía (desactivar)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'No se puede eliminar (tiene calles asociadas)' }
    // #swagger.responses[404] = { description: 'Tipo de vía no encontrado' }
    return tiposViaController.eliminar(req, res, next);
  }
);

// ============================================================================
// RUTAS DE ACCIONES ESPECIALES (PATCH)
// ============================================================================

/**
 * @route   PATCH /api/tipos-via/:id/activar
 * @desc    Activar un tipo de vía
 * @access  Supervisor, Administrador
 */
router.patch(
  "/:id/activar",
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["calles.tipos_via.update"]),
  validateTipoViaId,
  registrarAuditoria({
    entidad: "TipoVia",
    severidad: "BAJA",
    modulo: "Tipos de Vía",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Tipos de Vía']
    // #swagger.summary = 'Activar tipo de vía'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Tipo de vía no encontrado' }
    return tiposViaController.activar(req, res, next);
  }
);

/**
 * @route   PATCH /api/tipos-via/:id/desactivar
 * @desc    Desactivar un tipo de vía
 * @access  Supervisor, Administrador
 */
router.patch(
  "/:id/desactivar",
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["calles.tipos_via.update"]),
  validateTipoViaId,
  registrarAuditoria({
    entidad: "TipoVia",
    severidad: "BAJA",
    modulo: "Tipos de Vía",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Tipos de Vía']
    // #swagger.summary = 'Desactivar tipo de vía'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'No se puede desactivar (tiene calles asociadas)' }
    // #swagger.responses[404] = { description: 'Tipo de vía no encontrado' }
    return tiposViaController.desactivar(req, res, next);
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
 * - tipos_via.view      → calles.tipos_via.read
 * - tipos_via.create    → calles.tipos_via.create
 * - tipos_via.update    → calles.tipos_via.update
 * - tipos_via.delete    → calles.tipos_via.delete
 *
 * Los slugs ahora coinciden exactamente con los generados por seedRBAC.js:
 * - Módulo: "calles"
 * - Recurso: "tipos_via"
 * - Acciones: read, create, update, delete
 *
 * NOTAS DE INTEGRACIÓN:
 *
 * 1. REGISTRAR EN routes/index.routes.js:
 *    import tiposViaRoutes from './tipos-via.routes.js';
 *    app.use('/api/tipos-via', tiposViaRoutes);
 *
 * 2. PERMISOS EN BD:
 *    Los permisos deben existir en tabla 'permisos' con estos slugs:
 *    - calles.tipos_via.read
 *    - calles.tipos_via.create
 *    - calles.tipos_via.update
 *    - calles.tipos_via.delete
 *
 * 3. VERIFICAR MIDDLEWARE requireAnyPermission:
 *    Debe buscar permisos por el slug completo en formato:
 *    modulo.recurso.accion
 *
 * 4. ROLES CON ACCESO:
 *    - Lectura (read): Todos los usuarios autenticados
 *    - Crear/Actualizar (create/update): supervisor, super_admin
 *    - Eliminar (delete): super_admin
 */
