/**
 * Rutas de Catálogos
 * Endpoints para gestión de catálogos maestros del sistema
 */

import express from "express";
const router = express.Router();
import catalogosController from "../controllers/catalogosController.js";
import {
  verificarToken,
  verificarRoles,
  ROLES,
} from "../middlewares/authMiddleware.js";

// ==================== TIPOS DE NOVEDAD ====================

/**
 * @route   GET /api/catalogos/tipos-novedad
 * @desc    Obtener todos los tipos de novedad
 * @access  Privado
 */
router.get(
  "/tipos-novedad",
  verificarToken,
  catalogosController.getTiposNovedad
);

/**
 * @route   POST /api/catalogos/tipos-novedad
 * @desc    Crear tipo de novedad
 * @access  Administrador
 */
router.post(
  "/tipos-novedad",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  catalogosController.createTipoNovedad
);

// ==================== SUBTIPOS DE NOVEDAD ====================

/**
 * @route   GET /api/catalogos/subtipos-novedad
 * @desc    Obtener subtipos de novedad
 * @access  Privado
 * @query   tipo_id, prioridad
 */
router.get(
  "/subtipos-novedad",
  verificarToken,
  catalogosController.getSubtiposNovedad
);

/**
 * @route   POST /api/catalogos/subtipos-novedad
 * @desc    Crear subtipo de novedad
 * @access  Administrador
 */
router.post(
  "/subtipos-novedad",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  catalogosController.createSubtipoNovedad
);

// ==================== ESTADOS DE NOVEDAD ====================

/**
 * @route   GET /api/catalogos/estados-novedad
 * @desc    Obtener estados de novedad
 * @access  Privado
 */
router.get(
  "/estados-novedad",
  verificarToken,
  catalogosController.getEstadosNovedad
);

/**
 * @route   POST /api/catalogos/estados-novedad
 * @desc    Crear estado de novedad
 * @access  Administrador
 */
router.post(
  "/estados-novedad",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  catalogosController.createEstadoNovedad
);

// ==================== TIPOS DE VEHÍCULO ====================

/**
 * @route   GET /api/catalogos/tipos-vehiculo
 * @desc    Obtener tipos de vehículo
 * @access  Privado
 */
router.get(
  "/tipos-vehiculo",
  verificarToken,
  catalogosController.getTiposVehiculo
);

/**
 * @route   POST /api/catalogos/tipos-vehiculo
 * @desc    Crear tipo de vehículo
 * @access  Administrador
 */
router.post(
  "/tipos-vehiculo",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  catalogosController.createTipoVehiculo
);

// ==================== CARGOS ====================

/**
 * @route   GET /api/catalogos/cargos
 * @desc    Obtener cargos de personal
 * @access  Privado
 */
router.get("/cargos", verificarToken, catalogosController.getCargos);

/**
 * @route   POST /api/catalogos/cargos
 * @desc    Crear cargo
 * @access  Administrador
 */
router.post(
  "/cargos",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  catalogosController.createCargo
);

// ==================== UNIDADES/OFICINAS ====================

/**
 * @route   GET /api/catalogos/unidades
 * @desc    Obtener unidades/oficinas
 * @access  Privado
 * @query   tipo_unidad
 */
router.get("/unidades", verificarToken, catalogosController.getUnidades);

/**
 * @route   POST /api/catalogos/unidades
 * @desc    Crear unidad/oficina
 * @access  Administrador
 */
router.post(
  "/unidades",
  verificarToken,
  verificarRoles([ROLES.ADMINISTRADOR]),
  catalogosController.createUnidad
);

// ==================== UBIGEO ====================

/**
 * @route   GET /api/catalogos/ubigeo
 * @desc    Buscar ubigeos
 * @access  Privado
 * @query   search, departamento, provincia
 */
router.get("/ubigeo", verificarToken, catalogosController.buscarUbigeo);

/**
 * @route   GET /api/catalogos/departamentos
 * @desc    Obtener lista de departamentos
 * @access  Privado
 */
router.get(
  "/departamentos",
  verificarToken,
  catalogosController.getDepartamentos
);

export default router;
