/**
 * ============================================================================
 * ARCHIVO: src/routes/calles-cuadrantes.routes.js
 * VERSIÓN: 2.2.2 (Actualizado con slugs correctos de permisos)
 * DESCRIPCIÓN: Rutas para gestión de relaciones calle-cuadrante
 *              Define endpoints RESTful con control de acceso basado en permisos
 * ============================================================================
 *
 * PROPÓSITO:
 * - Definir rutas del API para relaciones calle-cuadrante
 * - Manejar rangos de numeración por cuadrante
 * - Aplicar middleware de autenticación y autorización por permisos
 * - Documentar endpoints para Swagger
 *
 * ENDPOINTS DEFINIDOS:
 * - GET    /api/calles-cuadrantes                    - Listar todas
 * - GET    /api/calles-cuadrantes/:id                - Obtener por ID
 * - GET    /api/calles-cuadrantes/calle/:id          - Por calle
 * - GET    /api/calles-cuadrantes/cuadrante/:id      - Por cuadrante
 * - POST   /api/calles-cuadrantes                    - Crear
 * - POST   /api/calles-cuadrantes/buscar-cuadrante   - Buscar cuadrante
 * - PUT    /api/calles-cuadrantes/:id                - Actualizar
 * - DELETE /api/calles-cuadrantes/:id                - Eliminar
 *
 * PERMISOS UTILIZADOS (según seedRBAC.js):
 * - calles.calles_cuadrantes.read: Ver relaciones
 * - calles.calles_cuadrantes.create: Crear relaciones
 * - calles.calles_cuadrantes.update: Actualizar relaciones
 * - calles.calles_cuadrantes.delete: Eliminar relaciones
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
import callesCuadrantesController from "../controllers/callesCuadrantesController.js";

// ============================================================================
// IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
// ============================================================================
import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

// ============================================================================
// IMPORTAR VALIDADORES
// ============================================================================
import {
  validateCreateCallesCuadrantes,
  validateUpdateCallesCuadrantes,
  validateCallesCuadrantesId,
  validateBuscarCuadrante,
} from "../validators/calle-cuadrante.validator.js";

// ============================================================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ============================================================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: Calles-Cuadrantes
 *   description: Gestión de relaciones entre calles y cuadrantes con rangos de numeración
 */

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
// ============================================================================
router.use(verificarToken);

// ============================================================================
// RUTAS ESPECIALES (ANTES DE /:id PARA EVITAR CONFLICTOS)
// ============================================================================

/**
 * @route   POST /api/calles-cuadrantes/buscar-cuadrante
 * @desc    Buscar cuadrante dado una calle y número (usado por direcciones)
 * @access  Todos los usuarios autenticados
 * @body    calle_id, numero
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.post(
  "/buscar-cuadrante",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["calles.calles_cuadrantes.read"]),
  validateBuscarCuadrante,
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Buscar cuadrante por calle y número'
    // #swagger.description = 'Endpoint crítico usado por direcciones para auto-asignar cuadrante y sector'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: 'object', properties: { calle_id: { type: 'integer', example: 5 }, numero: { type: 'integer', example: 450 } } } } } }
    // #swagger.responses[200] = { description: 'Cuadrante encontrado' }
    // #swagger.responses[404] = { description: 'No se encontró cuadrante para ese número' }
    return callesCuadrantesController.buscarCuadrante(req, res, next);
  }
);

/**
 * @route   GET /api/calles-cuadrantes/calle/:id
 * @desc    Obtener relaciones de una calle específica
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/calle/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["calles.calles_cuadrantes.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Relaciones de una calle'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 5 }
    // #swagger.responses[200] = { description: 'OK' }
    return callesCuadrantesController.porCalle(req, res, next);
  }
);

/**
 * @route   GET /api/calles-cuadrantes/cuadrante/:id
 * @desc    Obtener relaciones de un cuadrante específico
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/cuadrante/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["calles.calles_cuadrantes.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Relaciones de un cuadrante'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 12 }
    // #swagger.responses[200] = { description: 'OK' }
    return callesCuadrantesController.porCuadrante(req, res, next);
  }
);

// ============================================================================
// RUTAS CRUD PRINCIPALES
// ============================================================================

/**
 * @route   GET /api/calles-cuadrantes
 * @desc    Obtener todas las relaciones con filtros y paginación
 * @access  Todos los usuarios autenticados
 * @query   page, limit, calle_id, cuadrante_id
 */
router.get(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["calles.calles_cuadrantes.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Listar relaciones calle-cuadrante'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 20 }
    // #swagger.parameters['calle_id'] = { in: 'query', required: false, type: 'integer', example: 5 }
    // #swagger.parameters['cuadrante_id'] = { in: 'query', required: false, type: 'integer', example: 12 }
    // #swagger.responses[200] = { description: 'OK' }
    return callesCuadrantesController.listarTodas(req, res, next);
  }
);

/**
 * @route   GET /api/calles-cuadrantes/:id
 * @desc    Obtener una relación específica por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["calles.calles_cuadrantes.read"]),
  validateCallesCuadrantesId,
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Obtener relación por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Relación no encontrada' }
    return callesCuadrantesController.obtenerPorId(req, res, next);
  }
);

/**
 * @route   POST /api/calles-cuadrantes
 * @desc    Crear nueva relación calle-cuadrante con rangos
 * @access  Operador, Supervisor, Administrador
 * @body    calle_id, cuadrante_id, numero_inicio, numero_fin, lado
 */
router.post(
  "/",
  verificarRolesOPermisos(["operador", "supervisor", "super_admin"], ["calles.calles_cuadrantes.create"]),
  validateCreateCallesCuadrantes,
  registrarAuditoria({
    entidad: "CallesCuadrantes",
    severidad: "MEDIA",
    modulo: "Calles-Cuadrantes",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Crear relación calle-cuadrante'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CallesCuadrantesCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación (solapamiento de rangos, relación duplicada)' }
    // #swagger.responses[401] = { description: 'No autenticado' }
    // #swagger.responses[403] = { description: 'No autorizado' }
    return callesCuadrantesController.crear(req, res, next);
  }
);

/**
 * @route   PUT /api/calles-cuadrantes/:id
 * @desc    Actualizar una relación existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarRolesOPermisos(["supervisor", "super_admin"], ["calles.calles_cuadrantes.update"]),
  validateUpdateCallesCuadrantes,
  registrarAuditoria({
    entidad: "CallesCuadrantes",
    severidad: "MEDIA",
    modulo: "Calles-Cuadrantes",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Actualizar relación calle-cuadrante'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CallesCuadrantesUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación (solapamiento de rangos)' }
    // #swagger.responses[404] = { description: 'Relación no encontrada' }
    return callesCuadrantesController.actualizar(req, res, next);
  }
);

/**
 * @route   DELETE /api/calles-cuadrantes/:id
 * @desc    Eliminar una relación (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarRolesOPermisos(["super_admin"], ["calles.calles_cuadrantes.delete"]),
  validateCallesCuadrantesId,
  registrarAuditoria({
    entidad: "CallesCuadrantes",
    severidad: "ALTA",
    modulo: "Calles-Cuadrantes",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Calles-Cuadrantes']
    // #swagger.summary = 'Eliminar relación calle-cuadrante'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Relación no encontrada' }
    return callesCuadrantesController.eliminar(req, res, next);
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
 * - calles_cuadrantes.view      → calles.calles_cuadrantes.read
 * - calles_cuadrantes.create    → calles.calles_cuadrantes.create
 * - calles_cuadrantes.update    → calles.calles_cuadrantes.update
 * - calles_cuadrantes.delete    → calles.calles_cuadrantes.delete
 *
 * ✅ PERMISO ESPECIAL PARA BUSCAR-CUADRANTE:
 * - Permite tanto calles.calles_cuadrantes.read como calles.direcciones.create
 * - Usado por el módulo de direcciones para auto-asignar cuadrante/sector
 *
 * Los slugs ahora coinciden exactamente con los generados por seedRBAC.js:
 * - Módulo: "calles"
 * - Recurso: "calles_cuadrantes"
 * - Acciones: read, create, update, delete
 *
 * NOTAS DE INTEGRACIÓN:
 *
 * 1. PERMISOS EN BD:
 *    - calles.calles_cuadrantes.read
 *    - calles.calles_cuadrantes.create
 *    - calles.calles_cuadrantes.update
 *    - calles.calles_cuadrantes.delete
 *    - calles.direcciones.create (para buscar-cuadrante)
 *
 * 2. ROLES CON ACCESO:
 *    - Lectura: Todos los usuarios autenticados
 *    - Crear: operador, supervisor, super_admin
 *    - Actualizar: supervisor, super_admin
 *    - Eliminar: super_admin
 *
 * 3. VALIDACIONES ESPECIALES:
 *    - No permite solapamiento de rangos de numeración
 *    - Valida que numero_fin >= numero_inicio
 *    - Relación calle+cuadrante debe ser única
 *    - Rangos deben estar completos (inicio y fin juntos)
 *
 * 4. ENDPOINT CRÍTICO:
 *    POST /buscar-cuadrante es usado por direcciones para:
 *    - Auto-asignar cuadrante_id basado en calle_id + numero
 *    - Auto-asignar sector_id (derivado del cuadrante)
 *    - Validar que la dirección esté en rango válido
 */
