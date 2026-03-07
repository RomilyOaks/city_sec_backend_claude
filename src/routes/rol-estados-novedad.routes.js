/**
 * Rutas: rol-estados-novedad
 * Control de accesos a estados de novedades por roles
 *
 * Endpoints:
 * - GET    /rol-estados-novedad                    - Listar con filtros
 * - GET    /rol-estados-novedad/:id                - Obtener uno
 * - GET    /rol-estados-novedad/rol/:rolId/estados - Estados disponibles por rol (consumo frontend)
 * - POST   /rol-estados-novedad                    - Crear
 * - PUT    /rol-estados-novedad/:id                - Actualizar
 * - PATCH  /rol-estados-novedad/:id/estado         - Activar/desactivar
 * - DELETE /rol-estados-novedad/:id                - Soft-delete
 */

import { Router } from "express";
import { verificarToken, verificarRolesOPermisos } from "../middlewares/authMiddleware.js";
import {
  getRolEstadosNovedad,
  getRolEstadoNovedadById,
  getEstadosByRol,
  createRolEstadoNovedad,
  updateRolEstadoNovedad,
  cambiarEstadoRolEstadoNovedad,
  deleteRolEstadoNovedad,
} from "../controllers/rolEstadosNovedadController.js";
import {
  validarCrear,
  validarActualizar,
  validarCambiarEstado,
  validarId,
  validarRolId,
  validarListar,
} from "../validators/rol-estado-novedad.validator.js";

const router = Router();

router.use(verificarToken);

// ============================================
// ENDPOINT ESPECIAL — accesible a todos los roles autenticados
// Retorna los estados disponibles para un rol dado (uso del frontend en flujo de novedades)
// ============================================

/**
 * @route   GET /rol-estados-novedad/rol/:rolId/estados
 * @desc    Obtener estados de novedad habilitados para un rol
 * @access  Todos los roles autenticados
 */
router.get(
  "/rol/:rolId/estados",
  verificarRolesOPermisos(
    ["super_admin", "admin", "supervisor", "operador", "consulta", "radio_operador"],
    []
  ),
  validarRolId,
  (req, res, next) => {
    // #swagger.tags = ['RolEstadosNovedad']
    // #swagger.summary = 'Estados disponibles para un rol'
    // #swagger.security = [{ bearerAuth: [] }]
    return getEstadosByRol(req, res, next);
  }
);

// ============================================
// RUTAS DE LECTURA — solo super_admin y admin
// ============================================

/**
 * @route   GET /rol-estados-novedad
 * @desc    Listar configuraciones rol-estado con filtros y paginación
 * @access  super_admin, admin
 */
router.get(
  "/",
  verificarRolesOPermisos(["super_admin", "admin"], []),
  validarListar,
  (req, res, next) => {
    // #swagger.tags = ['RolEstadosNovedad']
    // #swagger.summary = 'Listar configuraciones rol-estado'
    // #swagger.security = [{ bearerAuth: [] }]
    return getRolEstadosNovedad(req, res, next);
  }
);

/**
 * @route   GET /rol-estados-novedad/:id
 * @desc    Obtener una configuración por ID
 * @access  super_admin, admin
 */
router.get(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin"], []),
  validarId,
  (req, res, next) => {
    // #swagger.tags = ['RolEstadosNovedad']
    // #swagger.summary = 'Obtener configuración por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    return getRolEstadoNovedadById(req, res, next);
  }
);

// ============================================
// RUTAS DE ESCRITURA — solo super_admin y admin
// ============================================

/**
 * @route   POST /rol-estados-novedad
 * @desc    Crear nueva configuración rol-estado
 * @access  super_admin, admin
 * @body    {number} rol_id           - ID del rol
 * @body    {number} estado_novedad_id - ID del estado de novedad
 * @body    {string} descripcion      - Descripción opcional
 * @body    {string} observaciones    - Observaciones opcionales
 */
router.post(
  "/",
  verificarRolesOPermisos(["super_admin", "admin"], []),
  validarCrear,
  (req, res, next) => {
    // #swagger.tags = ['RolEstadosNovedad']
    // #swagger.summary = 'Crear configuración rol-estado'
    // #swagger.security = [{ bearerAuth: [] }]
    return createRolEstadoNovedad(req, res, next);
  }
);

/**
 * @route   PUT /rol-estados-novedad/:id
 * @desc    Actualizar descripción, observaciones o estado de la configuración
 * @access  super_admin, admin
 */
router.put(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin"], []),
  validarActualizar,
  (req, res, next) => {
    // #swagger.tags = ['RolEstadosNovedad']
    // #swagger.summary = 'Actualizar configuración'
    // #swagger.security = [{ bearerAuth: [] }]
    return updateRolEstadoNovedad(req, res, next);
  }
);

/**
 * @route   PATCH /rol-estados-novedad/:id/estado
 * @desc    Activar o desactivar una configuración
 * @access  super_admin, admin
 * @body    {boolean} estado - true = activo, false = inactivo
 */
router.patch(
  "/:id/estado",
  verificarRolesOPermisos(["super_admin", "admin"], []),
  validarCambiarEstado,
  (req, res, next) => {
    // #swagger.tags = ['RolEstadosNovedad']
    // #swagger.summary = 'Cambiar estado de configuración'
    // #swagger.security = [{ bearerAuth: [] }]
    return cambiarEstadoRolEstadoNovedad(req, res, next);
  }
);

/**
 * @route   DELETE /rol-estados-novedad/:id
 * @desc    Eliminar configuración (soft-delete)
 * @access  super_admin, admin
 */
router.delete(
  "/:id",
  verificarRolesOPermisos(["super_admin", "admin"], []),
  validarId,
  (req, res, next) => {
    // #swagger.tags = ['RolEstadosNovedad']
    // #swagger.summary = 'Eliminar configuración (soft-delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    return deleteRolEstadoNovedad(req, res, next);
  }
);

export default router;
