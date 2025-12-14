/**
 * ===================================================
 * RUTAS: Novedades/Incidentes
 * ===================================================
 *
 * Ruta: src/routes/novedades.routes.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Actualizado import de validadores a validators/
 * ✅ Arquitectura consistente con personal.routes.js
 * ✅ Documentación mejorada
 *
 * Descripción:
 * Define los endpoints REST para gestión de novedades e incidentes
 * con control de acceso RBAC y validaciones centralizadas.
 *
 * @module routes/novedades
 * @requires express
 * @version 2.0.0
 * @date 2025-12-14
 */

import express from "express";
const router = express.Router();

// ==========================================
// IMPORTAR CONTROLADOR
// ==========================================
import novedadesController from "../controllers/novedadesController.js";

// ==========================================
// IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
// ==========================================
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

// ==========================================
// IMPORTAR VALIDADORES (NUEVA UBICACIÓN)
// ==========================================
import {
  validateCreateNovedad,
  validateUpdateNovedad,
  validateAsignarRecursos,
  validateQueryNovedades,
  validateNovedadId,
} from "../validators/novedad.validator.js"; // ✅ CAMBIO AQUÍ

// ==========================================
// IMPORTAR MIDDLEWARE DE AUDITORÍA
// ==========================================
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";

// ==========================================
// RUTAS ESPECIALES (ANTES DE /:id)
// ==========================================

/**
 * @route   GET /api/v1/novedades/dashboard/stats
 * @desc    Obtener estadísticas para el dashboard
 * @access  Todos los usuarios autenticados
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get(
  "/dashboard/stats",
  verificarToken,
  novedadesController.getDashboardStats
);

/**
 * @route   GET /api/v1/novedades/:id/historial
 * @desc    Obtener historial de cambios de estado de una novedad
 * @access  Operador, Supervisor, Administrador
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get(
  "/:id/historial",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  validateNovedadId,
  novedadesController.getHistorialEstados
);

// ==========================================
// RUTAS CRUD PRINCIPALES
// ==========================================

/**
 * @route   GET /api/v1/novedades
 * @desc    Obtener todas las novedades con filtros
 * @access  Operador, Supervisor, Administrador
 * @query   fecha_inicio, fecha_fin, estado_id, prioridad, sector_id, tipo_id, search, page, limit
 */
router.get(
  "/",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  validateQueryNovedades,
  novedadesController.getAllNovedades
);

/**
 * @route   GET /api/v1/novedades/:id
 * @desc    Obtener una novedad específica por ID
 * @access  Operador, Supervisor, Administrador
 */
router.get(
  "/:id",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  validateNovedadId,
  novedadesController.getNovedadById
);

/**
 * @route   POST /api/v1/novedades
 * @desc    Crear una nueva novedad
 * @access  Operador, Supervisor, Administrador
 * @body    tipo_novedad_id, subtipo_novedad_id, fecha_hora_ocurrencia, localizacion, descripcion, etc.
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission([
    "novedades.incidentes.create",
    "novedades.novedades.create",
  ]),
  validateCreateNovedad,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "MEDIA",
    modulo: "Novedades",
  }),
  novedadesController.createNovedad
);

/**
 * @route   PUT /api/v1/novedades/:id
 * @desc    Actualizar una novedad existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["supervisor", "super_admin"]),
  requireAnyPermission(["novedades.incidentes.update"]),
  validateUpdateNovedad,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "MEDIA",
    modulo: "Novedades",
  }),
  novedadesController.updateNovedad
);

// ==========================================
// RUTAS DE ACCIONES ESPECIALES
// ==========================================

/**
 * @route   POST /api/v1/novedades/:id/asignar
 * @desc    Asignar recursos (unidad, vehículo, personal) a una novedad
 * @access  Operador, Supervisor, Administrador
 */
router.post(
  "/:id/asignar",
  verificarToken,
  verificarRoles(["operador", "supervisor", "super_admin"]),
  requireAnyPermission(["novedades.asignacion.execute"]),
  validateAsignarRecursos,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "MEDIA",
    modulo: "Novedades",
  }),
  novedadesController.asignarRecursos
);

/**
 * @route   DELETE /api/v1/novedades/:id
 * @desc    Eliminar una novedad (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin"]),
  requireAnyPermission(["novedades.incidentes.delete"]),
  validateNovedadId,
  registrarAuditoria({
    entidad: "Novedad",
    severidad: "ALTA",
    modulo: "Novedades",
  }),
  novedadesController.deleteNovedad
);

export default router;
