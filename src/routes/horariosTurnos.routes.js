/**
 * ===================================================
 * RUTAS: Horarios Turnos
 * ===================================================
 *
 * Ruta: src/routes/horariosTurnos.routes.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-20
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Creación inicial de rutas CRUD
 * ✅ Validaciones centralizadas
 * ✅ Headers profesionales
 * ✅ Documentación completa
 *
 * Descripción:
 * Define endpoints REST para gestión de horarios de turnos
 * para operativos de patrullaje.
 *
 * Endpoints (7):
 * - GET    /horarios-turnos - Listar horarios con filtros
 * - GET    /horarios-turnos/:turno - Obtener horario específico
 * - POST   /horarios-turnos - Crear nuevo horario
 * - PUT    /horarios-turnos/:turno - Actualizar horario
 * - DELETE /horarios-turnos/:turno - Eliminar horario (soft delete)
 * - POST   /horarios-turnos/:turno/reactivar - Reactivar horario
 * - GET    /horarios-turnos/activo - Obtener horario activo actual
 *
 * @module routes/horariosTurnos
 * @version 1.0.0
 * @date 2026-01-20
 */

import express from "express";
const router = express.Router();
import horariosTurnosController from "../controllers/horariosTurnosController.js";
import {
  verificarToken,
  verificarRolesOPermisos,
} from "../middlewares/authMiddleware.js";

import {
  validateGetHorariosTurnos,
  validateGetHorarioTurnoById,
  validateCreateHorarioTurno,
  validateUpdateHorarioTurno,
  validateDeleteHorarioTurno,
  validateReactivarHorarioTurno,
  validateGetHorarioActivo,
} from "../validators/horariosTurnos.validator.js";

// ==========================================
// ENDPOINTS CRUD COMPLETO
// ==========================================

/**
 * GET /api/v1/horarios-turnos
 * Obtener todos los horarios de turnos con filtros opcionales
 * 
 * @query {number} page - Número de página (default: 1)
 * @query {number} limit - Límite de resultados (default: 20, max: 100)
 * @query {string} estado - Filtrar por estado (0, 1, true, false)
 * @query {string} includeDeleted - Incluir eliminados (true, false)
 * 
 * @access Private
 * @roles super_admin ,admin, supervisor
 */
router.get(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["operativos.horarios.read"]),
  validateGetHorariosTurnos,
  horariosTurnosController.getAllHorariosTurnos
);

/**
 * GET /api/v1/horarios-turnos/activo
 * Obtener el horario activo según la hora actual del servidor
 * 
 * @query {string} timestamp - Timestamp ISO8601 para pruebas [opcional]
 * 
 * @access Private
 * @roles admin, supervisor, operador, usuario_basico
 */
router.get(
  "/activo",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["operativos.horarios.read"]),
  validateGetHorarioActivo,
  horariosTurnosController.getHorarioActivo
);

/**
 * GET /api/v1/horarios-turnos/:turno
 * Obtener un horario de turno específico por su ID
 * 
 * @param {string} turno - ID del turno (MAÑANA, TARDE, NOCHE)
 * 
 * @access Private
 * @roles admin, supervisor, operador
 */
router.get(
  "/:turno",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["operativos.horarios.read"]),
  validateGetHorarioTurnoById,
  horariosTurnosController.getHorarioTurnoById
);

/**
 * POST /api/v1/horarios-turnos
 * Crear un nuevo horario de turno
 * 
 * @body {string} turno - Tipo de turno (MAÑANA, TARDE, NOCHE)
 * @body {string} hora_inicio - Hora de inicio (HH:MM:SS)
 * @body {string} hora_fin - Hora de fin (HH:MM:SS)
 * @body {boolean} cruza_medianoche - Si cruza medianoche (default: false)
 * 
 * @access Private
 * @roles super_admin ,admin, supervisor
 */
router.post(
  "/",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["operativos.horarios.create"]),
  validateCreateHorarioTurno,
  horariosTurnosController.createHorarioTurno
);

/**
 * PUT /api/v1/horarios-turnos/:turno
 * Actualizar un horario de turno existente
 * 
 * @param {string} turno - ID del turno (MAÑANA, TARDE, NOCHE)
 * @body {string} hora_inicio - Hora de inicio (HH:MM:SS) [opcional]
 * @body {string} hora_fin - Hora de fin (HH:MM:SS) [opcional]
 * @body {boolean} cruza_medianoche - Si cruza medianoche [opcional]
 * @body {boolean} estado - Estado del horario [opcional]
 * 
 * @access Private
 * @roles super_admin ,admin, supervisor
 */
router.put(
  "/:turno",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["operativos.horarios.update"]),
  validateUpdateHorarioTurno,
  horariosTurnosController.updateHorarioTurno
);

/**
 * DELETE /api/v1/horarios-turnos/:turno
 * Eliminar un horario de turno (soft delete)
 * 
 * @param {string} turno - ID del turno (MAÑANA, TARDE, NOCHE)
 * 
 * @access Private
 * @roles super_admin, admin, supervisor
 */
router.delete(
  "/:turno",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["operativos.horarios.delete"]),
  validateDeleteHorarioTurno,
  horariosTurnosController.deleteHorarioTurno
);

// ==========================================
// ENDPOINTS ESPECIALES
// ==========================================

/**
 * POST /api/v1/horarios-turnos/:turno/reactivar
 * Reactivar un horario de turno eliminado
 * 
 * @param {string} turno - ID del turno (MAÑANA, TARDE, NOCHE)
 * 
 * @access Private
 * @roles admin, supervisor
 */
router.post(
  "/:turno/reactivar",
  verificarToken,
  verificarRolesOPermisos(["super_admin", "admin", "supervisor"], ["operativos.horarios.update"]),
  validateReactivarHorarioTurno,
  horariosTurnosController.reactivarHorarioTurno
);

// ==========================================
// EXPORTACIÓN
// ==========================================

export default router;
