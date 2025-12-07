/**
 * ============================================
 * RUTAS: src/routes/novedades.routes.js
 * ============================================
 *
 * Rutas de Novedades/Incidentes
 * Define los endpoints REST con control de acceso RBAC
 */

import express from "express";
const router = express.Router();
import novedadesController from "../controllers/novedadesController.js";
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";

/**
 * @route   GET /api/novedades/dashboard/stats
 * @desc    Obtener estadísticas para el dashboard
 * @access  Todos los usuarios autenticados
 *
 * COMENTADO: Descomentar cuando exista novedadesController.getDashboardStats
 */
/*
router.get(
  "/dashboard/stats",
  verificarToken,
  novedadesController.getDashboardStats
);
*/

/**
 * @route   GET /api/novedades
 * @desc    Obtener todas las novedades con filtros
 * @access  Operador, Supervisor, Administrador
 * @query   fecha_inicio, fecha_fin, estado_id, prioridad, sector_id, page, limit
 *
 * COMENTADO: Descomentar cuando exista novedadesController.getAllNovedades
 */
/*
router.get(
  "/",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin"]),
  novedadesController.getAllNovedades
);
*/

/**
 * @route   GET /api/novedades/:id
 * @desc    Obtener una novedad específica por ID
 * @access  Operador, Supervisor, Administrador
 */
router.get(
  "/:id",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin"]),
  novedadesController.getNovedadById
);

/**
 * @route   POST /api/novedades
 * @desc    Crear una nueva novedad
 * @access  Operador, Supervisor, Administrador
 * @body    tipo_novedad_id, subtipo_novedad_id, fecha_hora, localizacion, etc.
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin"]),
  requireAnyPermission(["novedades.incidentes.create"]),
  novedadesController.createNovedad
);

/**
 * @route   PUT /api/novedades/:id
 * @desc    Actualizar una novedad existente
 * @access  Supervisor, Administrador
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["supervisor", "admin"]),
  requireAnyPermission(["novedades.incidentes.update"]),
  novedadesController.updateNovedad
);

/**
 * @route   POST /api/novedades/:id/asignar
 * @desc    Asignar recursos (unidad, vehículo, personal) a una novedad
 * @access  Operador, Supervisor, Administrador
 */
router.post(
  "/:id/asignar",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin"]),
  requireAnyPermission(["novedades.asignacion.execute"]),
  novedadesController.asignarRecursos
);

/**
 * @route   DELETE /api/novedades/:id
 * @desc    Eliminar una novedad (soft delete)
 * @access  Administrador
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["admin"]),
  requireAnyPermission(["novedades.incidentes.delete"]),
  novedadesController.deleteNovedad
);

/**
 * @route   GET /api/novedades/:id/historial
 * @desc    Obtener historial de cambios de estado de una novedad
 * @access  Operador, Supervisor, Administrador
 */
router.get(
  "/:id/historial",
  verificarToken,
  verificarRoles(["operador", "supervisor", "admin"]),
  novedadesController.getHistorialEstados
);

export default router;
