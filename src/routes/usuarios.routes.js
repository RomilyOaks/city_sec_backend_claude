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
      .isIn([0, 1, "0", "1"])
      .withMessage("estado debe ser 0 o 1"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("search no puede exceder 200 caracteres"),
    handleValidationErrors,
  ],
  getUsuarios
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
  getUsuarioById
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
  createUsuario
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

    body("estado").optional().isIn([0, 1]).withMessage("estado debe ser 0 o 1"),

    handleValidationErrors,
  ],
  registrarAuditoria({
    entidad: "Usuario",
    severidad: "MEDIA",
    modulo: "Usuarios",
  }),
  updateUsuario
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
  deleteUsuario
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
  resetPassword
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
      .isIn([0, 1])
      .withMessage("estado debe ser 0 (inactivo) o 1 (activo)"),

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
  cambiarEstado
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
      const asignaciones = await Promise.all(
        roles.map(async (rol_id) => {
          return await UsuarioRol.create({
            usuario_id: id,
            rol_id,
            es_principal: es_principal === rol_id ? 1 : 0,
            fecha_asignacion: new Date(),
            estado: 1,
            asignado_por: req.user.id,
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
