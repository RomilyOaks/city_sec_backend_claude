/**
 * ============================================
 * RUTAS: src/routes/usuarios.routes.js
 * ============================================
 *
 * Rutas para gestión administrativa de usuarios
 * Implementa control de acceso RBAC completo con validaciones
 */

import express from "express";
const router = express.Router();
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  resetPassword,
  cambiarEstado,
  restoreUsuario,
} from "../controllers/usuariosController.js";
import {
  verificarToken,
  verificarRoles,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { body, param, query, validationResult } from "express-validator";

// Middleware de validación de errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   GET /api/usuarios
 * @desc    Listar usuarios con filtros y paginación
 * @access  Super Admin, Admin, Supervisor
 * @query   page, limit, estado, rol, search
 */
router.get(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["usuarios.usuarios.read"]),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page debe ser un número positivo"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit debe estar entre 1 y 100"),
    query("estado")
      .optional()
      .isIn([0, 1, "0", "1", "ACTIVO", "INACTIVO", "BLOQUEADO", "PENDIENTE"])
      .withMessage("estado debe ser 0/1 o ACTIVO/INACTIVO/BLOQUEADO/PENDIENTE"),
    query("includeDeleted")
      .optional()
      .isIn([0, 1, "0", "1", true, false, "true", "false"])
      .withMessage("includeDeleted debe ser 0/1"),
    query("onlyDeleted")
      .optional()
      .isIn([0, 1, "0", "1", true, false, "true", "false"])
      .withMessage("onlyDeleted debe ser 0/1"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("search no puede exceder 200 caracteres"),
    handleValidationErrors,
  ],
  (req, res, next) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Listar usuarios'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 10 }
    // #swagger.parameters['estado'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['search'] = { in: 'query', required: false, type: 'string', example: 'admin' }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[401] = { description: 'No autenticado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[403] = { description: 'No autorizado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getUsuarios(req, res, next);
  }
);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario específico por ID
 * @access  Super Admin, Admin, Supervisor
 */
router.get(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["usuarios.usuarios.read"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),
    handleValidationErrors,
  ],
  (req, res, next) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Obtener usuario por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return getUsuarioById(req, res, next);
  }
);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario
 * @access  Super Admin, Admin
 * @body    username, email, password, nombres, apellidos, roles
 */
router.post(
  "/",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["usuarios.usuarios.create"]),
  [
    body("username")
      .notEmpty()
      .withMessage("El username es requerido")
      .isLength({ min: 3, max: 50 })
      .withMessage("El username debe tener entre 3 y 50 caracteres")
      .matches(/^[a-zA-Z0-9_.-]+$/)
      .withMessage(
        "El username solo puede contener letras, números, guiones y puntos"
      ),

    body("email")
      .notEmpty()
      .withMessage("El email es requerido")
      .isEmail()
      .withMessage("Email inválido")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("La contraseña es requerida")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener mínimo 8 caracteres")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "La contraseña debe contener mayúsculas, minúsculas y números"
      ),

    body("nombres")
      .notEmpty()
      .withMessage("Los nombres son requeridos")
      .isLength({ max: 100 })
      .withMessage("Los nombres no pueden exceder 100 caracteres")
      .trim(),

    body("apellidos")
      .notEmpty()
      .withMessage("Los apellidos son requeridos")
      .isLength({ max: 100 })
      .withMessage("Los apellidos no pueden exceder 100 caracteres")
      .trim(),

    body("telefono")
      .optional()
      .matches(/^[0-9]{7,15}$/)
      .withMessage("El teléfono debe tener entre 7 y 15 dígitos"),

    body("roles").optional().isArray().withMessage("roles debe ser un array"),

    body("roles.*")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Cada rol debe ser un ID válido"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Usuario",
    severidad: "ALTA",
    modulo: "Usuarios",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Crear usuario (admin)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UsuarioAdminCreateRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return createUsuario(req, res, next);
  }
);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario existente
 * @access  Super Admin, Admin
 */
router.put(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["usuarios.usuarios.update"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),

    body("username")
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage("El username debe tener entre 3 y 50 caracteres")
      .matches(/^[a-zA-Z0-9_.-]+$/)
      .withMessage(
        "El username solo puede contener letras, números, guiones y puntos"
      ),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Email inválido")
      .normalizeEmail(),

    body("nombres")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Los nombres no pueden exceder 100 caracteres")
      .trim(),

    body("apellidos")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Los apellidos no pueden exceder 100 caracteres")
      .trim(),

    body("telefono")
      .optional()
      .matches(/^[0-9]{7,15}$/)
      .withMessage("El teléfono debe tener entre 7 y 15 dígitos"),

    body("roles").optional().isArray().withMessage("roles debe ser un array"),

    body("estado")
      .optional()
      .isIn([0, 1, "0", "1", "ACTIVO", "INACTIVO", "BLOQUEADO", "PENDIENTE"])
      .withMessage("estado debe ser 0/1 o ACTIVO/INACTIVO/BLOQUEADO/PENDIENTE"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Usuario",
    severidad: "MEDIA",
    modulo: "Usuarios",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Actualizar usuario'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UsuarioAdminUpdateRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return updateUsuario(req, res, next);
  }
);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Super Admin
 */
router.delete(
  "/:id",
  verificarToken,
  verificarRoles(["super_admin"]),
  requireAnyPermission(["usuarios.usuarios.delete"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),
    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Usuario",
    severidad: "CRITICA",
    modulo: "Usuarios",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Eliminar usuario (soft delete)'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return deleteUsuario(req, res, next);
  }
);

/**
 * @route   POST /api/usuarios/:id/reset-password
 * @desc    Resetear contraseña de un usuario
 * @access  Super Admin, Admin
 */
router.post(
  "/:id/reset-password",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission([
    "usuarios.usuarios.reset_password",
    "usuarios.usuarios.update",
  ]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),

    body("newPassword")
      .notEmpty()
      .withMessage("La nueva contraseña es requerida")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener mínimo 8 caracteres")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "La contraseña debe contener mayúsculas, minúsculas y números"
      ),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Usuario",
    severidad: "ALTA",
    modulo: "Usuarios",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Reset password de usuario'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UsuarioResetPasswordRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return resetPassword(req, res, next);
  }
);

/**
 * @route   PATCH /api/usuarios/:id/estado
 * @desc    Cambiar estado de un usuario (ACTIVO/INACTIVO/BLOQUEADO)
 * @access  Super Admin, Admin
 */
router.patch(
  "/:id/estado",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission([
    "usuarios.usuarios.update_estado",
    "usuarios.usuarios.update",
  ]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),

    body("estado")
      .notEmpty()
      .withMessage("El estado es requerido")
      .isIn([0, 1, "0", "1", "ACTIVO", "INACTIVO", "BLOQUEADO", "PENDIENTE"])
      .withMessage("estado debe ser 0/1 o ACTIVO/INACTIVO/BLOQUEADO/PENDIENTE"),

    body("motivo")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("El motivo no puede exceder 500 caracteres"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Usuario",
    severidad: "ALTA",
    modulo: "Usuarios",
  }),
  (req, res, next) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Cambiar estado de usuario'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UsuarioCambiarEstadoRequest" } } } }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    return cambiarEstado(req, res, next);
  }
);

/**
 * @route   PATCH /api/usuarios/:id/restore
 * @desc    Reactivar usuario eliminado (soft delete)
 * @access  Super Admin
 */
router.patch(
  "/:id/restore",
  verificarToken,
  verificarRoles(["super_admin"]),
  requireAnyPermission(["usuarios.usuarios.update", "usuarios.usuarios.restore"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),
    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Usuario",
    severidad: "ALTA",
    modulo: "Usuarios",
  }),
  (req, res, next) => {
    return restoreUsuario(req, res, next);
  }
);

/**
 * @route   GET /api/usuarios/:id/roles
 * @desc    Obtener roles del usuario
 * @access  Super Admin, Admin, Supervisor
 */
router.get(
  "/:id/roles",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["usuarios.usuarios.read", "usuarios.roles.read"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),
    handleValidationErrors,
  ],
  async (req, res) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Listar roles de un usuario'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    try {
      const { Usuario, Rol, UsuarioRol } = await import("../models/index.js");

      const usuario = await Usuario.findByPk(req.params.id, {
        include: [
          {
            model: Rol,
            as: "roles",
            through: {
              attributes: [
                "es_principal",
                "fecha_asignacion",
                "fecha_expiracion",
              ],
            },
          },
        ],
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: usuario.roles,
      });
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener roles del usuario",
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/usuarios/:id/roles
 * @desc    Asignar roles al usuario
 * @access  Super Admin, Admin
 */
router.post(
  "/:id/roles",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["usuarios.roles.assign"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),

    body("roles")
      .isArray({ min: 1 })
      .withMessage("Se debe proporcionar al menos un rol"),

    body("roles.*")
      .isInt({ min: 1 })
      .withMessage("Cada rol debe ser un ID válido"),

    body("es_principal")
      .optional()
      .isInt()
      .withMessage("es_principal debe ser el ID del rol principal"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "UsuarioRol",
    severidad: "ALTA",
    modulo: "Usuarios",
  }),
  async (req, res) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Asignar roles a usuario'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UsuarioAssignRolesRequest" } } } }
    // #swagger.responses[201] = { description: 'Creado' }
    // #swagger.responses[400] = { description: 'Validación', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    try {
      const { Usuario, Rol, UsuarioRol } = await import("../models/index.js");
      const { roles, es_principal } = req.body;
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Asignar roles
      const userId = req.user.id;
      const asignaciones = await Promise.all(
        roles.map(async (rol_id) => {
          return await UsuarioRol.create({
            usuario_id: id,
            rol_id,
            es_principal: es_principal === rol_id ? 1 : 0,
            fecha_asignacion: new Date(),
            estado: 1,
            asignado_por: userId,
            created_by: userId,
            updated_by: userId,
          });
        })
      );

      res.status(201).json({
        success: true,
        message: "Roles asignados exitosamente",
        data: asignaciones,
      });
    } catch (error) {
      console.error("Error al asignar roles:", error);
      res.status(500).json({
        success: false,
        message: "Error al asignar roles",
        error: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/usuarios/:id/roles/:rolId
 * @desc    Quitar un rol específico del usuario
 * @access  Super Admin, Admin
 */
router.delete(
  "/:id/roles/:rolId",
  verificarToken,
  verificarRoles(["super_admin", "admin"]),
  requireAnyPermission(["usuarios.roles.remove"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),
    param("rolId").isInt({ min: 1 }).withMessage("ID de rol inválido"),
    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "UsuarioRol",
    severidad: "ALTA",
    modulo: "Usuarios",
  }),
  async (req, res) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Remover rol de usuario'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.parameters['rolId'] = { in: 'path', required: true, type: 'integer', example: 2 }
    // #swagger.responses[200] = { description: 'OK' }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    try {
      const { UsuarioRol } = await import("../models/index.js");
      const { id, rolId } = req.params;

      const resultado = await UsuarioRol.destroy({
        where: {
          usuario_id: id,
          rol_id: rolId,
        },
      });

      if (resultado === 0) {
        return res.status(404).json({
          success: false,
          message: "Asignación de rol no encontrada",
        });
      }

      res.status(200).json({
        success: true,
        message: "Rol removido exitosamente",
      });
    } catch (error) {
      console.error("Error al remover rol:", error);
      res.status(500).json({
        success: false,
        message: "Error al remover rol",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/usuarios/:id/permisos
 * @desc    Obtener todos los permisos del usuario (consolidados)
 * @access  Super Admin, Admin, Supervisor
 */
router.get(
  "/:id/permisos",
  verificarToken,
  verificarRoles(["super_admin", "admin", "supervisor"]),
  requireAnyPermission(["usuarios.permisos.read"]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),
    handleValidationErrors,
  ],
  async (req, res) => {
    // #swagger.tags = ['Usuarios']
    // #swagger.summary = 'Permisos consolidados de usuario'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', example: 1 }
    // #swagger.responses[200] = { description: 'OK', schema: { $ref: "#/components/schemas/UsuarioPermisosConsolidadosResponse" } }
    // #swagger.responses[404] = { description: 'No encontrado', schema: { $ref: "#/components/schemas/ErrorResponse" } }
    try {
      const { Usuario, Rol, Permiso, UsuarioRol } = await import(
        "../models/index.js"
      );

      const usuario = await Usuario.findByPk(req.params.id, {
        include: [
          {
            model: Rol,
            as: "roles",
            include: [
              {
                model: Permiso,
                as: "permisos",
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Consolidar permisos únicos
      const permisosUnicos = new Set();
      usuario.roles.forEach((rol) => {
        rol.permisos.forEach((permiso) => {
          permisosUnicos.add(
            JSON.stringify({
              id: permiso.id,
              modulo: permiso.modulo,
              recurso: permiso.recurso,
              accion: permiso.accion,
              slug: permiso.slug,
              descripcion: permiso.descripcion,
            })
          );
        });
      });

      const permisos = Array.from(permisosUnicos).map((p) => JSON.parse(p));

      res.status(200).json({
        success: true,
        data: {
          usuario_id: usuario.id,
          username: usuario.username,
          total_permisos: permisos.length,
          permisos,
        },
      });
    } catch (error) {
      console.error("Error al obtener permisos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener permisos del usuario",
        error: error.message,
      });
    }
  }
);

export default router;
