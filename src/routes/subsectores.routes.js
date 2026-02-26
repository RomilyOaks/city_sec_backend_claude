/**
 * ===================================================
 * RUTAS: Subsectores
 * ===================================================
 *
 * Ruta: src/routes/subsectores.routes.js
 *
 * VERSION: 1.0.0
 * FECHA: 2026-02-03
 *
 * Descripcion:
 * Define endpoints REST para gestion de subsectores territoriales.
 * Los subsectores son subdivisiones de sectores que agrupan cuadrantes.
 *
 * Endpoints (6):
 * - GET    /subsectores              - Listar subsectores
 * - GET    /subsectores/:id          - Obtener subsector por ID
 * - GET    /subsectores/sector/:sectorId - Obtener subsectores por sector
 * - POST   /subsectores              - Crear subsector
 * - PUT    /subsectores/:id          - Actualizar subsector
 * - DELETE /subsectores/:id          - Eliminar subsector (soft)
 *
 * @module routes/subsectores
 * @version 1.0.0
 * @date 2026-02-03
 */

import express from "express";
const router = express.Router();
import subsectoresController from "../controllers/subsectoresController.js";
import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

// ==========================================
// RUTAS ESPECIALES (ANTES DE /:id)
// ==========================================

/**
 * @route   GET /api/v1/subsectores/sector/:sectorId
 * @desc    Obtener subsectores de un sector especifico
 * @access  Todos los usuarios autenticados
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get(
  "/sector/:sectorId",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.subsectores.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Subsectores']
    // #swagger.summary = 'Obtener subsectores por sector'
    // #swagger.description = 'Retorna todos los subsectores activos de un sector especifico'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['sectorId'] = { in: 'path', required: true, type: 'integer', description: 'ID del sector' }
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 15 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Sector no encontrado' }
    return subsectoresController.getSubsectoresBySector(req, res, next);
  }
);

// ==========================================
// RUTAS CRUD PRINCIPALES
// ==========================================

/**
 * @route   GET /api/v1/subsectores
 * @desc    Listar todos los subsectores con filtros y paginacion
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.subsectores.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Subsectores']
    // #swagger.summary = 'Listar subsectores'
    // #swagger.description = 'Obtiene lista paginada de subsectores con filtros opcionales'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['sector_id'] = { in: 'query', required: false, type: 'integer', description: 'Filtrar por sector' }
    // #swagger.parameters['estado'] = { in: 'query', required: false, type: 'integer', enum: [0, 1], description: '1=Activo, 0=Inactivo' }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', description: 'Buscar por codigo o nombre' }
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 15 }
    // #swagger.responses[200] = { description: 'OK' }
    return subsectoresController.getAllSubsectores(req, res, next);
  }
);

/**
 * @route   GET /api/v1/subsectores/:id
 * @desc    Obtener un subsector por ID
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.subsectores.read"]),
  (req, res, next) => {
    // #swagger.tags = ['Subsectores']
    // #swagger.summary = 'Obtener subsector por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'ID del subsector' }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'Subsector no encontrado' }
    return subsectoresController.getSubsectorById(req, res, next);
  }
);

/**
 * @route   POST /api/v1/subsectores
 * @desc    Crear un nuevo subsector
 * @access  Supervisor, Administrador
 */
router.post(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["catalogos.subsectores.create"]),
  (req, res, next) => {
    // #swagger.tags = ['Subsectores']
    // #swagger.summary = 'Crear subsector'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = {
    //   required: true,
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         required: ["nombre", "sector_id"],
    //         properties: {
    //           subsector_code: { type: "string", example: "1A", description: "Codigo unico (auto-generado si no se proporciona)" },
    //           nombre: { type: "string", example: "Subsector Norte A" },
    //           sector_id: { type: "integer", example: 1 },
    //           personal_supervisor_id: { type: "integer", example: 5, nullable: true },
    //           referencia: { type: "string", example: "Desde Av. Principal hasta Calle 5" },
    //           poligono_json: { type: "object", nullable: true },
    //           radio_metros: { type: "integer", nullable: true },
    //           color_mapa: { type: "string", example: "#10B981" }
    //         }
    //       }
    //     }
    //   }
    // }
    // #swagger.responses[201] = { description: 'Creado exitosamente' }
    // #swagger.responses[400] = { description: 'Datos invalidos' }
    // #swagger.responses[404] = { description: 'Sector no encontrado' }
    return subsectoresController.createSubsector(req, res, next);
  }
);

/**
 * @route   PUT /api/v1/subsectores/:id
 * @desc    Actualizar un subsector
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["catalogos.subsectores.update"]),
  (req, res, next) => {
    // #swagger.tags = ['Subsectores']
    // #swagger.summary = 'Actualizar subsector'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.requestBody = {
    //   required: true,
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         properties: {
    //           subsector_code: { type: "string" },
    //           nombre: { type: "string" },
    //           sector_id: { type: "integer" },
    //           personal_supervisor_id: { type: "integer", nullable: true },
    //           referencia: { type: "string" },
    //           poligono_json: { type: "object" },
    //           radio_metros: { type: "integer" },
    //           color_mapa: { type: "string" },
    //           estado: { type: "integer", enum: [0, 1] }
    //         }
    //       }
    //     }
    //   }
    // }
    // #swagger.responses[200] = { description: 'Actualizado exitosamente' }
    // #swagger.responses[400] = { description: 'Datos invalidos' }
    // #swagger.responses[404] = { description: 'Subsector no encontrado' }
    return subsectoresController.updateSubsector(req, res, next);
  }
);

/**
 * @route   DELETE /api/v1/subsectores/:id
 * @desc    Eliminar un subsector (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin"], ["catalogos.subsectores.delete"]),
  (req, res, next) => {
    // #swagger.tags = ['Subsectores']
    // #swagger.summary = 'Eliminar subsector'
    // #swagger.description = 'Eliminacion logica (soft delete). No se puede eliminar si tiene cuadrantes activos.'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Eliminado exitosamente' }
    // #swagger.responses[400] = { description: 'Tiene cuadrantes activos' }
    // #swagger.responses[404] = { description: 'Subsector no encontrado' }
    return subsectoresController.deleteSubsector(req, res, next);
  }
);

export default router;
