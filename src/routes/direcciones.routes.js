/**
 * ============================================================================
 * ARCHIVO: src/routes/direcciones.routes.js
 * VERSIÓN: 2.2.2 (Actualizado con slugs correctos de permisos)
 * DESCRIPCIÓN: Rutas para gestión de direcciones normalizadas
 *              Define endpoints RESTful con control de acceso basado en permisos
 * ============================================================================
 *
 * PROPÓSITO:
 * - Definir rutas del API para direcciones normalizadas
 * - Soportar sistema dual (numeración municipal y Mz/Lote)
 * - Auto-asignación de cuadrante y sector
 * - Aplicar middleware de autenticación y autorización por permisos
 * - Documentar endpoints para Swagger
 *
 * ENDPOINTS DEFINIDOS:
 * - GET    /api/direcciones                    - Listar todas
 * - GET    /api/direcciones/activas            - Listar activas
 * - GET    /api/direcciones/search             - Búsqueda avanzada
 * - GET    /api/direcciones/stats/mas-usadas   - Direcciones más frecuentes
 * - GET    /api/direcciones/:id                - Obtener por ID
 * - POST   /api/direcciones                    - Crear dirección
 * - POST   /api/direcciones/validar            - Validar sin guardar
 * - PUT    /api/direcciones/:id                - Actualizar
 * - PATCH  /api/direcciones/:id/geocodificar   - Actualizar coordenadas
 * - DELETE /api/direcciones/:id                - Eliminar
 *
 * PERMISOS UTILIZADOS (según seedRBAC.js):
 * - calles.direcciones.read: Ver direcciones
 * - calles.direcciones.create: Crear direcciones
 * - calles.direcciones.update: Actualizar direcciones
 * - calles.direcciones.delete: Eliminar direcciones
 * - calles.direcciones.geocodificar: Actualizar coordenadas GPS
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
import direccionesController from "../controllers/direccionesController.js";

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
  validateCreateDireccion,
  validateUpdateDireccion,
  validateDireccionId,
  validateGeocodificar,
  validateValidarDireccion,
} from "../validators/direccion.validator.js";

// ============================================================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ============================================================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: Direcciones
 *   description: Gestión de direcciones normalizadas (numeración municipal y Mz/Lote)
 */

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
// ============================================================================
// Todas las rutas requieren autenticación
router.use(verificarToken);

// ============================================================================
// RUTAS ESPECIALES (ANTES DE /:id PARA EVITAR CONFLICTOS)
// ============================================================================

/**
 * @route   GET /api/direcciones/activas
 * @desc    Obtener direcciones activas para selects/combos (limitado a 100)
 * @access  Todos los usuarios autenticados
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get(
  "/activas",
  requireAnyPermission(["calles.direcciones.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Listar direcciones activas (para selects)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.responses[200] = { description: 'OK' }
    return direccionesController.listarActivas(req, res, next);
  }
);

/**
 * @route   GET /api/direcciones/search
 * @desc    Búsqueda avanzada de direcciones
 * @access  Todos los usuarios autenticados
 * @query   calle, numero, urbanizacion
 */
router.get(
  "/search",
  requireAnyPermission(["calles.direcciones.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Búsqueda avanzada de direcciones'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['calle'] = { in: 'query', required: false, type: 'string', example: 'ejercito' }
    // #swagger.parameters['numero'] = { in: 'query', required: false, type: 'string', example: '450' }
    // #swagger.parameters['urbanizacion'] = { in: 'query', required: false, type: 'string', example: 'Villa' }
    // #swagger.responses[200] = { description: 'OK' }
    return direccionesController.busquedaAvanzada(req, res, next);
  }
);

/**
 * @route   GET /api/direcciones/stats/mas-usadas
 * @desc    Obtener direcciones más usadas (hot spots)
 * @access  Supervisor, Administrador
 * @query   limit (default 20)
 */
router.get(
  "/stats/mas-usadas",
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["calles.direcciones.read", "novedades.novedades.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Direcciones más usadas (estadísticas)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 20 }
    // #swagger.responses[200] = { description: 'OK' }
    return direccionesController.masUsadas(req, res, next);
  }
);

/**
 * @route   POST /api/direcciones/validar
 * @desc    Validar dirección sin guardar (retorna cuadrante/sector auto-asignado)
 * @access  Todos los usuarios autenticados
 * @body    calle_id, numero_municipal, manzana, lote
 */
router.post(
  "/validar",
  requireAnyPermission([
    "calles.direcciones.create",
    "calles.direcciones.read",
  ]),
  validateValidarDireccion,
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Validar dirección sin guardar'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: 'object', properties: { calle_id: { type: 'integer' }, numero_municipal: { type: 'string' }, manzana: { type: 'string' }, lote: { type: 'string' } } } } } }
    // #swagger.responses[200] = { description: 'Dirección válida con cuadrante/sector asignado' }
    // #swagger.responses[400] = { description: 'Validación (calle no encontrada, falta sistema de direccionamiento)' }
    return direccionesController.validar(req, res, next);
  }
);

// ============================================================================
// RUTAS CRUD PRINCIPALES
// ============================================================================

/**
 * @route   GET /api/direcciones
 * @desc    Obtener todas las direcciones con filtros y paginación
 * @access  Todos los usuarios autenticados
 * @query   page, limit, search, calle_id, cuadrante_id, sector_id, geocodificada
 */
router.get(
  "/",
  requireAnyPermission(["calles.direcciones.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Listar direcciones con filtros'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 20 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: '450' }
    // #swagger.parameters['calle_id'] = { in: 'query', required: false, type: 'integer', example: 5 }
    // #swagger.parameters['cuadrante_id'] = { in: 'query', required: false, type: 'integer', example: 12 }
    // #swagger.parameters['sector_id'] = { in: 'query', required: false, type: 'integer', example: 3 }
    // #swagger.parameters['geocodificada'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    return direccionesController.listarTodas(req, res, next);
  }
);

/**
 * @route   GET /api/direcciones/:id
 * @desc    Obtener una dirección específica por ID con información completa
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  requireAnyPermission(["calles.direcciones.read"]),
  validateDireccionId,
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Obtener dirección por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Dirección no encontrada' }
    return direccionesController.obtenerPorId(req, res, next);
  }
);

/**
 * @route   POST /api/direcciones
 * @desc    Crear nueva dirección con auto-asignación de cuadrante/sector
 * @access  Operador, Supervisor, Administrador
 * @body    calle_id, numero_municipal, manzana, lote, urbanizacion, tipo_complemento, etc.
 */
router.post(
  "/",
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission(["calles.direcciones.create"]),
  validateCreateDireccion,
  registrarAuditoria({
    entidad: "Direccion",
    severidad: "MEDIA",
    modulo: "Direcciones",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Crear nueva dirección'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DireccionCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado con cuadrante/sector auto-asignado' }
    // #swagger.responses[400] = { description: 'Validación (falta numero_municipal O manzana+lote)' }
    return direccionesController.crear(req, res, next);
  }
);

/**
 * @route   PUT /api/direcciones/:id
 * @desc    Actualizar una dirección existente (recalcula cuadrante/sector si cambia calle o número)
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["calles.direcciones.update"]),
  validateUpdateDireccion,
  registrarAuditoria({
    entidad: "Direccion",
    severidad: "MEDIA",
    modulo: "Direcciones",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Actualizar dirección'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DireccionUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación' }
    // #swagger.responses[404] = { description: 'Dirección no encontrada' }
    return direccionesController.actualizar(req, res, next);
  }
);

/**
 * @route   PATCH /api/direcciones/:id/geocodificar
 * @desc    Actualizar coordenadas GPS de una dirección
 * @access  Operador, Supervisor, Administrador
 * @body    latitud, longitud, fuente
 */
router.patch(
  "/:id/geocodificar",
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission([
    "calles.direcciones.geocodificar",
    "calles.direcciones.update",
  ]),
  validateGeocodificar,
  registrarAuditoria({
    entidad: "Direccion",
    severidad: "BAJA",
    modulo: "Direcciones",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Geocodificar dirección (actualizar coordenadas)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: 'object', properties: { latitud: { type: 'number', example: -12.04637800 }, longitud: { type: 'number', example: -77.03066400 }, fuente: { type: 'string', example: 'Google Maps' } } } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación (latitud y longitud requeridas)' }
    // #swagger.responses[404] = { description: 'Dirección no encontrada' }
    return direccionesController.geocodificar(req, res, next);
  }
);

/**
 * @route   DELETE /api/direcciones/:id
 * @desc    Eliminar una dirección (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarRoles(["super_admin"]),
  requireAnyPermission(["calles.direcciones.delete"]),
  validateDireccionId,
  registrarAuditoria({
    entidad: "Direccion",
    severidad: "ALTA",
    modulo: "Direcciones",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Eliminar dirección (soft delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'No se puede eliminar (tiene novedades asociadas)' }
    // #swagger.responses[404] = { description: 'Dirección no encontrada' }
    return direccionesController.eliminar(req, res, next);
  }
);

/**
 * @route   PATCH /api/direcciones/:id/reactivar
 * @desc    Reactivar dirección eliminada (restaurar soft delete)
 * @access  Administrador
 */
router.patch(
  "/:id/reactivar",
  verificarRoles(["super_admin"]),
  requireAnyPermission(["calles.direcciones.delete", "calles.direcciones.update"]),
  validateDireccionId,
  registrarAuditoria({
    entidad: "Direccion",
    severidad: "ALTA",
    modulo: "Direcciones",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Direcciones']
    // #swagger.summary = 'Reactivar dirección eliminada'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'Dirección reactivada exitosamente' }
    // #swagger.responses[400] = { description: 'La dirección no está eliminada' }
    // #swagger.responses[404] = { description: 'Dirección no encontrada' }
    return direccionesController.reactivar(req, res, next);
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
 * - direcciones.view          → calles.direcciones.read
 * - direcciones.create        → calles.direcciones.create
 * - direcciones.update        → calles.direcciones.update
 * - direcciones.delete        → calles.direcciones.delete
 * - direcciones.geocodificar  → calles.direcciones.geocodificar
 *
 * ✅ PERMISOS ADICIONALES REFERENCIADOS:
 * - novedades.novedades.read (para /stats/mas-usadas)
 *
 * Los slugs ahora coinciden exactamente con los generados por seedRBAC.js:
 * - Módulo: "calles"
 * - Recurso: "direcciones"
 * - Acciones: read, create, update, delete, geocodificar
 *
 * NOTAS DE INTEGRACIÓN:
 *
 * 1. PERMISOS EN BD:
 *    - calles.direcciones.read
 *    - calles.direcciones.create
 *    - calles.direcciones.update
 *    - calles.direcciones.delete
 *    - calles.direcciones.geocodificar
 *    - novedades.novedades.read (debe existir en módulo novedades)
 *
 * 2. ROLES CON ACCESO:
 *    - Lectura: Todos los usuarios autenticados
 *    - Crear: operador, supervisor, super_admin
 *    - Actualizar: supervisor, super_admin
 *    - Geocodificar: operador, supervisor, super_admin
 *    - Eliminar: super_admin
 *    - Stats: supervisor, super_admin
 *
 * 3. VALIDACIONES ESPECIALES:
 *    - Sistema dual: Debe tener numero_municipal O (manzana + lote)
 *    - Auto-asignación: cuadrante_id y sector_id se calculan automáticamente
 *    - Coordenadas GPS: Rango válido -90 a 90 (lat), -180 a 180 (lon)
 *    - No se puede eliminar si tiene novedades asociadas
 *
 * 4. ENDPOINTS ESPECIALES:
 *    - POST /validar: Valida sin guardar, retorna cuadrante/sector
 *    - PATCH /:id/geocodificar: Solo actualiza coordenadas GPS
 *    - GET /stats/mas-usadas: Hot spots de incidentes por dirección
 *
 * 5. SISTEMA DUAL DE DIRECCIONAMIENTO:
 *    - Numeración municipal: "450", "250-A", "S/N"
 *    - Sistema Mz/Lote: manzana="M", lote="15"
 *    - Válido tener ambos sistemas simultáneamente
 */
