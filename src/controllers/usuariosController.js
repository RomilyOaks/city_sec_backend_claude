/**
 * Ruta: src/controllers/usuariosController.js
 * Descripción: Controlador para gestión administrativa de usuarios
 * Incluye CRUD completo de usuarios, asignación de roles, gestión de estados
 * y consultas especializadas. Utiliza modelos Sequelize.
 */

import bcrypt from "bcryptjs";
import {
  Usuario,
  Rol,
  Permiso,
  PersonalSeguridad,
  HistorialUsuario,
  UsuarioRol,
} from "../models/index.js";
import { sequelize } from "../models/index.js";
import { Op } from "sequelize";

/**
 * GET /api/usuarios
 * Obtiene lista de usuarios con filtros y paginación
 * @query {page, limit, estado, rol, search}
 */
export const getUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, rol, search, includeDeleted, onlyDeleted } = req.query;

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Construir filtros WHERE
    const whereConditions = {};

    const includeDeletedBool =
      includeDeleted === true ||
      includeDeleted === "true" ||
      includeDeleted === 1 ||
      includeDeleted === "1";
    const onlyDeletedBool =
      onlyDeleted === true ||
      onlyDeleted === "true" ||
      onlyDeleted === 1 ||
      onlyDeleted === "1";

    if (onlyDeletedBool) {
      whereConditions.deleted_at = { [Op.ne]: null };
    } else if (!includeDeletedBool) {
      whereConditions.deleted_at = null;
    }

    // Filtro por estado
    if (estado) {
      if (estado === 1 || estado === "1") whereConditions.estado = "ACTIVO";
      else if (estado === 0 || estado === "0") whereConditions.estado = "INACTIVO";
      else whereConditions.estado = estado;
    }

    // Filtro por búsqueda (username, email, nombres, apellidos)
    if (search) {
      whereConditions[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { nombres: { [Op.like]: `%${search}%` } },
        { apellidos: { [Op.like]: `%${search}%` } },
      ];
    }

    // Construir include para roles
    const include = [
      {
        model: Rol,
        as: "roles",
        attributes: ["id", "nombre", "slug", "color"],
        through: { attributes: [] }, // No incluir campos de usuario_roles
      },
    ];

    // Si hay filtro por rol, agregar condición
    if (rol) {
      include[0].where = { slug: rol };
      include[0].required = true; // INNER JOIN
    }

    // Consulta con paginación
    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where: whereConditions,
      include,
      attributes: {
        exclude: [
          "password_hash",
          "two_factor_secret",
          "oauth_token",
          "oauth_refresh_token",
        ],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      distinct: true, // Para contar correctamente con joins
    });

    res.json({
      success: true,
      data: {
        usuarios,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error en getUsuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
};

/**
 * GET /api/usuarios/:id
 * Obtiene un usuario específico por ID con sus relaciones
 */
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: {
        exclude: [
          "password_hash",
          "two_factor_secret",
          "oauth_token",
          "oauth_refresh_token",
        ],
      },
      include: [
        {
          model: Rol,
          as: "roles",
          attributes: ["id", "nombre", "slug", "color", "descripcion"],
          include: [
            {
              model: Permiso,
              as: "permisos",
              attributes: [
                "id",
                "slug",
                "modulo",
                "recurso",
                "accion",
                "descripcion",
              ],
            },
          ],
        },
        {
          model: PersonalSeguridad,
          as: "usuarioPersonalSeguridad",
          attributes: [
            "id",
            "nombres",
            "apellido_paterno",
            "apellido_materno",
            "doc_numero",
            "cargo_id",
          ],
        },
      ],
    });

    if (!usuario || usuario.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Consolidar permisos únicos de todos los roles
    const permisos = [];
    if (usuario.roles) {
      usuario.roles.forEach((rol) => {
        if (rol.permisos) {
          rol.permisos.forEach((permiso) => {
            if (!permisos.find((p) => p.slug === permiso.slug)) {
              permisos.push({
                id: permiso.id,
                slug: permiso.slug,
                modulo: permiso.modulo,
                recurso: permiso.recurso,
                accion: permiso.accion,
                descripcion: permiso.descripcion,
              });
            }
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...usuario.toJSON(),
        permisos,
      },
    });
  } catch (error) {
    console.error("Error en getUsuarioById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuario",
      error: error.message,
    });
  }
};

/**
 * POST /api/usuarios
 * Crea un nuevo usuario (solo para administradores)
 * @body {username, email, password, nombres, apellidos, roles, estado, ip}
 */
export const createUsuario = async (req, res) => {
  // OBTENER DATOS DE CONTEXTO DE AUDITORÍA
  const created_by = req?.user?.id || req?.usuario?.userId || req?.usuario?.id || null;
  const auditOptions = {
    currentUser: created_by,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const t = await sequelize.transaction(); // Iniciar transacción para atomicidad
  try {
    const {
      username,
      email,
      password,
      nombres,
      apellidos,
      telefono,
      roles = [],
      personal_seguridad_id,
      estado: estadoRecibido,
    } = req.body;
    
    // Estado por defecto: PENDIENTE si no tiene personal_seguridad_id, ACTIVO si lo tiene
    const estado = estadoRecibido || (personal_seguridad_id ? "ACTIVO" : "PENDIENTE");

    const created_by = req?.user?.id || req?.usuario?.userId || req?.usuario?.id || null;

    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email y password son requeridos",
      });
    }

    // Verificar si el usuario ya existe (incluyendo soft-deleted)
    // Los usuarios INACTIVOS/soft-deleted NO deben ser reutilizados
    const usuarioExistente = await Usuario.findOne({
      where: {
        [Op.or]: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() },
        ],
      },
      transaction: t,
    });

    if (usuarioExistente) {
      await t.rollback();
      // Si está soft-deleted, indicar que debe usar otro username/email
      if (usuarioExistente.deleted_at !== null || usuarioExistente.estado === "INACTIVO") {
        return res.status(400).json({
          success: false,
          message: "El username o email ya fueron utilizados anteriormente. Por favor use otros datos.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "El username o email ya están registrados",
      });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear usuario
    const nuevoUsuario = await Usuario.create(
      {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password_hash,
        nombres,
        apellidos,
        telefono,
        personal_seguridad_id,
        estado,
        email_verified_at: new Date(), // Auto-verificado por admin
        created_by,
      },
      { transaction: t, auditOptions }
    );
    // Asignar roles si se especificaron
    if (roles && roles.length > 0) {
      const rolesEncontrados = await Rol.findAll({
        where: {
          id: { [Op.in]: roles },
        },
        transaction: t,
      });

      if (rolesEncontrados.length > 0) {
        // Crear relaciones manualmente con auditoría
        const usuarioRolesData = rolesEncontrados.map((rol) => ({
          usuario_id: nuevoUsuario.id,
          rol_id: rol.id,
          created_by: created_by,
          updated_by: created_by,
          fecha_asignacion: new Date(),
        }));
        await UsuarioRol.bulkCreate(usuarioRolesData, { transaction: t });
      }
    }

    await t.commit(); // Confirmar transacción

    // Recargar usuario con roles
    const usuarioCreado = await Usuario.findByPk(nuevoUsuario.id, {
      attributes: {
        exclude: [
          "password_hash",
          "two_factor_secret",
          "oauth_token",
          "oauth_refresh_token",
        ],
      },
      include: [
        {
          model: Rol,
          as: "roles",
          attributes: ["id", "nombre", "slug"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: usuarioCreado,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error en createUsuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear usuario",
      error: error.message,
    });
  }
};

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario existente
 * @body {nombres, apellidos, telefono, estado, roles}
 */
export const updateUsuario = async (req, res) => {
  // OBTENER DATOS DE CONTEXTO DE AUDITORÍA
  const updated_by = req?.user?.id || req?.usuario?.userId || req?.usuario?.id || null;
  const auditOptions = {
    currentUser: updated_by,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    individualHooks: true, // IMPORTANTE: Asegura que el afterUpdate se dispare
  };

  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      nombres,
      apellidos,
      telefono,
      email,
      estado,
      roles,
      personal_seguridad_id,
    } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findByPk(id, { transaction: t });

    if (!usuario || usuario.deleted_at !== null) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (email && email.toLowerCase() !== usuario.email) {
      const emailExistente = await Usuario.findOne({
        where: {
          email: email.toLowerCase(),
          id: { [Op.ne]: id },
        },
        transaction: t,
      });

      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado",
        });
      }
    }

    // Actualizar datos básicos
    const datosActualizar = {
      updated_by,
    };

    if (nombres !== undefined) datosActualizar.nombres = nombres;
    if (apellidos !== undefined) datosActualizar.apellidos = apellidos;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (email !== undefined) datosActualizar.email = email.toLowerCase();
    if (estado !== undefined) {
      // Normalizar estado: convertir 0/1 a strings ENUM
      const estadoNormalizado =
        estado === 1 || estado === "1"
          ? "ACTIVO"
          : estado === 0 || estado === "0"
            ? "INACTIVO"
            : estado;
      datosActualizar.estado = estadoNormalizado;
    }
    if (personal_seguridad_id !== undefined) {
      // Si se está asignando un personal, verificar que no esté asignado a otro usuario ACTIVO
      if (personal_seguridad_id) {
        const usuarioConEstePersonal = await Usuario.findOne({
          where: {
            personal_seguridad_id,
            id: { [Op.ne]: id }, // Excluir el usuario actual
            deleted_at: null, // Solo usuarios no eliminados
            estado: { [Op.ne]: "INACTIVO" }, // Excluir usuarios INACTIVOS
          },
          transaction: t,
        });

        if (usuarioConEstePersonal) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `Este personal ya está asignado al usuario "${usuarioConEstePersonal.username}"`,
          });
        }
      }
      datosActualizar.personal_seguridad_id = personal_seguridad_id;
    }

    await usuario.update(datosActualizar, { transaction: t, auditOptions });

    // Actualizar roles si se especificaron
    if (roles !== undefined && Array.isArray(roles)) {
      const rolesEncontrados = await Rol.findAll({
        where: {
          id: { [Op.in]: roles },
        },
        transaction: t,
      });

      // Eliminar roles existentes y crear nuevos con auditoría
      await UsuarioRol.destroy({ where: { usuario_id: id }, transaction: t });

      const usuarioRolesData = rolesEncontrados.map((rol) => ({
        usuario_id: id,
        rol_id: rol.id,
        created_by: updated_by,
        updated_by: updated_by,
        fecha_asignacion: new Date(),
      }));
      await UsuarioRol.bulkCreate(usuarioRolesData, { transaction: t });
    }

    await t.commit();

    // Recargar usuario con relaciones
    const usuarioActualizado = await Usuario.findByPk(id, {
      attributes: {
        exclude: [
          "password_hash",
          "two_factor_secret",
          "oauth_token",
          "oauth_refresh_token",
        ],
      },
      include: [
        {
          model: Rol,
          as: "roles",
          attributes: ["id", "nombre", "slug", "color"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: usuarioActualizado,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error en updateUsuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar usuario",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/usuarios/:id
 * Elimina (soft delete) un usuario
 */
export const deleteUsuario = async (req, res) => {
  // OBTENER DATOS DE CONTEXTO DE AUDITORÍA
  const deleted_by = req?.user?.id || req?.usuario?.userId || req?.usuario?.id || null;
  const auditOptions = {
    currentUser: deleted_by,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    individualHooks: true,
  };

  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // No permitir auto-eliminación
    if (deleted_by && parseInt(id) === deleted_by) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No puedes eliminar tu propia cuenta",
      });
    }

    const usuario = await Usuario.findByPk(id, { transaction: t });

    if (!usuario || usuario.deleted_at !== null) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Soft delete (la actualización disparará el hook afterUpdate para 'eliminacion')
    await usuario.update(
      {
        deleted_at: new Date(),
        deleted_by,
        estado: "INACTIVO", // Cambiar estado al eliminar
        updated_by: deleted_by, // Registrar quién ejecutó la acción
      },
      {
        transaction: t,
        auditOptions, // Pasa el contexto y habilita hooks
      }
    );

    await t.commit();

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error en deleteUsuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuario",
      error: error.message,
    });
  }
};

/**
 * POST /api/usuarios/:id/reset-password
 * Resetea la contraseña de un usuario (admin)
 * @body {newPassword}
 */
export const resetPassword = async (req, res) => {
  // OBTENER DATOS DE CONTEXTO DE AUDITORÍA
  const updated_by = req?.user?.id || req?.usuario?.userId || req?.usuario?.id || null;
  const auditOptions = {
    currentUser: updated_by,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    individualHooks: true,
  };

  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 8 caracteres",
      });
    }

    const usuario = await Usuario.findByPk(id, { transaction: t });

    if (!usuario || usuario.deleted_at !== null) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña y forzar cambio en próximo login
    await usuario.update(
      {
        password_hash,
        password_changed_at: new Date(),
        require_password_change: true,
        updated_by,
      },
      {
        transaction: t,
        auditOptions, // Pasa el contexto y habilita hooks
      }
    );

    await t.commit();

    res.json({
      success: true,
      message:
        "Contraseña reseteada exitosamente. El usuario deberá cambiarla en su próximo login.",
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error en resetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error al resetear contraseña",
      error: error.message,
    });
  }
};

/**
 * PUT /api/usuarios/:id/estado
 * Cambia el estado de un usuario
 * @body {estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'}
 */
export const cambiarEstado = async (req, res) => {
  // OBTENER DATOS DE CONTEXTO DE AUDITORÍA
  const updated_by = req?.user?.id || req?.usuario?.userId || req?.usuario?.id || null;
  const auditOptions = {
    currentUser: updated_by,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    individualHooks: true,
  };

  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadoNormalizado =
      estado === 1 || estado === "1"
        ? "ACTIVO"
        : estado === 0 || estado === "0"
          ? "INACTIVO"
          : estado;

    if (!["ACTIVO", "INACTIVO", "BLOQUEADO", "PENDIENTE"].includes(estadoNormalizado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
      });
    }

    const usuario = await Usuario.findByPk(id, { transaction: t });

    if (!usuario || usuario.deleted_at !== null) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Actualizar estado (el hook afterUpdate registra el 'cambio_estado')
    await usuario.update(
      {
        estado: estadoNormalizado,
        updated_by,
      },
      { transaction: t, auditOptions }
    );

    await t.commit();

    res.json({
      success: true,
      message: `Estado del usuario cambiado a ${estado}`,
      data: {
        id: usuario.id,
        username: usuario.username,
        estado: usuario.estado,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error en cambiarEstado:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/usuarios/:id/restore
 * Reactiva un usuario eliminado (soft delete)
 */
export const restoreUsuario = async (req, res) => {
  const restored_by = req?.user?.id || req?.usuario?.userId || req?.usuario?.id || null;
  const auditOptions = {
    currentUser: restored_by,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    individualHooks: true,
  };

  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, { transaction: t });

    if (!usuario) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (usuario.deleted_at === null) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "El usuario no está eliminado",
      });
    }

    await usuario.update(
      {
        deleted_at: null,
        deleted_by: null,
        estado: "ACTIVO",
        updated_by: restored_by,
      },
      { transaction: t, auditOptions }
    );

    await t.commit();

    return res.json({
      success: true,
      message: "Usuario reactivado exitosamente",
      data: {
        id: usuario.id,
        username: usuario.username,
        estado: usuario.estado,
        deleted_at: usuario.deleted_at,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error en restoreUsuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al reactivar usuario",
      error: error.message,
    });
  }
};

export default {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  resetPassword,
  cambiarEstado,
  restoreUsuario,
};
