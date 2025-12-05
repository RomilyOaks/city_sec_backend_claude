/**
 * novedades.routes.js
 * Rutas de Novedades/Incidentes
 * Define los endpoints REST con control de acceso RBAC
 */

const express = require("express");
const router = express.Router();
const novedadesController = require("../controllers/novedadesController");
const {
  verificarToken,
  verificarRoles,
  verificarPermisos,
  registrarAccion,
  ROLES,
  PERMISOS,
} = require("../middlewares/authMiddleware");

/**
 * @route   GET /api/novedades/dashboard/stats
 * @desc    Obtener estadísticas para el dashboard
 * @access  Todos los usuarios autenticados
 */
router.get(
  "/dashboard/stats",
  verificarToken,
  novedadesController.getDashboardStats
);

/**
 * @route   GET /api/novedades
 * @desc    Obtener todas las novedades con filtros
 * @access  Operador, Supervisor, Administrador
 * @query   fecha_inicio, fecha_fin, estado_id, prioridad, sector_id, page, limit
 */
router.get(
  "/",
  verificarToken,
  verificarRoles([ROLES.OPERADOR, ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  novedadesController.getAllNovedades
);

/**
 * @route   GET /api/novedades/:id
 * @desc    Obtener una novedad específica por ID
 * @access  Operador, Supervisor, Administrador
 */
router.get(
  "/:id",
  verificarToken,
  verificarRoles([ROLES.OPERADOR, ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
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
  verificarRoles([ROLES.OPERADOR, ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  verificarPermisos([PERMISOS.CREAR_NOVEDAD]),
  registrarAccion("CREAR_NOVEDAD"),
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
  verificarRoles([ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  verificarPermisos([PERMISOS.EDITAR_NOVEDAD]),
  registrarAccion("ACTUALIZAR_NOVEDAD"),
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
  verificarRoles([ROLES.OPERADOR, ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  verificarPermisos([PERMISOS.ASIGNAR_RECURSOS]),
  registrarAccion("ASIGNAR_RECURSOS"),
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
  verificarRoles([ROLES.ADMINISTRADOR]),
  verificarPermisos([PERMISOS.ELIMINAR_NOVEDAD]),
  registrarAccion("ELIMINAR_NOVEDAD"),
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
  verificarRoles([ROLES.OPERADOR, ROLES.SUPERVISOR, ROLES.ADMINISTRADOR]),
  novedadesController.getHistorialEstados
);

module.exports = router;
