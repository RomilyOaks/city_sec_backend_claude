/**
 * Ruta: src/controllers/rolesController.js
 *
 * Descripción:
 * Controlador para la gestión de roles del sistema RBAC.
 * Los roles agrupan permisos y definen niveles de acceso.
 *
 * Endpoints:
 * - GET    /api/v1/roles                - Listar todos
 * - GET    /api/v1/roles/:id            - Obtener por ID
 * - GET    /api/v1/roles/:id/permisos   - Permisos del rol
 * - GET    /api/v1/roles/slug/:slug     - Obtener por slug
 * - POST   /api/v1/roles                - Crear nuevo
 * - PUT    /api/v1/roles/:id            - Actualizar
 * - DELETE /api/v1/roles/:id            - Eliminar (soft delete)
 * - POST   /api/v1/roles/:id/permisos   - Asignar permisos
 * - DELETE /api/v1/roles/:id/permisos/:permisoId - Quitar permiso
 */

import { Rol, Permiso, Usuario, RolPermiso } from "../models/index.js";
import { Op } from "sequelize";

/**
 * GET /api/v1/roles
 * Listar roles con filtros
 */
export const getRoles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      activos = "true",
      incluir_permisos = "false",
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = {
      deleted_at: null,
    };

    if (activos === "true") {
      whereConditions.estado = true;
    }

    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
      ];
    }

    // Include opcional de permisos
    const include = [];
    if (incluir_permisos === "true") {
      include.push({
        model: Permiso,
        as: "permisos",
        attributes: ["id", "slug", "descripcion"],
        through: { attributes: [] },
      });
    }

    const { count, rows: roles } = await Rol.findAndCountAll({
      where: whereConditions,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ["nivel_jerarquia", "ASC"],
        ["nombre", "ASC"],
      ],
      distinct: true,
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        roles,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error en getRoles:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener roles",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/roles/:id
 * Obtener rol por ID con sus permisos
 */
export const getRolById = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findByPk(id, {
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
          through: { attributes: ["created_at"] },
        },
      ],
    });

    if (!rol || rol.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    res.json({
      success: true,
      data: rol,
    });
  } catch (error) {
    console.error("Error en getRolById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener rol",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/roles/:id/permisos
 * Obtener permisos de un rol
 */
export const getPermisosDeRol = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findWithPermisos(id);

    if (!rol || rol.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    res.json({
      success: true,
      data: {
        rol: {
          id: rol.id,
          nombre: rol.nombre,
          slug: rol.slug,
        },
        permisos: rol.permisos || [],
        total: rol.permisos ? rol.permisos.length : 0,
      },
    });
  } catch (error) {
    console.error("Error en getPermisosDeRol:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener permisos del rol",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/roles/slug/:slug
 * Buscar rol por slug
 */
export const getRolBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const rol = await Rol.findBySlug(slug);

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado con ese slug",
      });
    }

    res.json({
      success: true,
      data: rol,
    });
  } catch (error) {
    console.error("Error en getRolBySlug:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar rol",
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/roles
 * Crear nuevo rol
 */
export const createRol = async (req, res) => {
  try {
    const {
      nombre,
      slug,
      descripcion,
      nivel_jerarquia = 5,
      color = "#6B7280",
      permisos = [],
    } = req.body;

    const created_by = req.user?.id || null;

    // Validar campos requeridos
    if (!nombre || !slug) {
      return res.status(400).json({
        success: false,
        message: "Nombre y slug son requeridos",
      });
    }

    // Crear rol
    const nuevoRol = await Rol.create({
      nombre,
      slug: slug.toLowerCase(),
      descripcion,
      nivel_jerarquia,
      color,
      created_by,
      updated_by: created_by,
    });

    // Asignar permisos si se especificaron
    if (permisos && permisos.length > 0) {
      const permisosEncontrados = await Permiso.findAll({
        where: {
          id: { [Op.in]: permisos },
        },
      });

      if (permisosEncontrados.length > 0) {
        // Crear relaciones manualmente con auditoría
        const rolPermisosData = permisosEncontrados.map((permiso) => ({
          rol_id: nuevoRol.id,
          permiso_id: permiso.id,
          created_by,
          updated_by: created_by,
        }));
        await RolPermiso.bulkCreate(rolPermisosData);
      }
    }

    // Recargar con permisos
    const rolCreado = await Rol.findByPk(nuevoRol.id, {
      include: [
        {
          model: Permiso,
          as: "permisos",
          attributes: ["id", "slug", "descripcion"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Rol creado exitosamente",
      data: rolCreado,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Ya existe un rol con ese slug",
      });
    }

    console.error("Error en createRol:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear rol",
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/roles/:id
 * Actualizar rol
 */
export const updateRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, nivel_jerarquia, color } = req.body;

    const updated_by = req.user?.id || null;

    const rol = await Rol.findByPk(id);

    if (!rol || rol.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    if (rol.es_sistema) {
      return res.status(403).json({
        success: false,
        message: "No se puede editar un rol del sistema",
      });
    }

    // Actualizar campos
    const datosActualizar = { updated_by };

    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
    if (nivel_jerarquia !== undefined)
      datosActualizar.nivel_jerarquia = nivel_jerarquia;
    if (color !== undefined) datosActualizar.color = color;

    await rol.update(datosActualizar);

    res.json({
      success: true,
      message: "Rol actualizado exitosamente",
      data: rol,
    });
  } catch (error) {
    console.error("Error en updateRol:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar rol",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/v1/roles/:id
 * Eliminar rol (soft delete)
 */
export const deleteRol = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user?.id || null;

    const rol = await Rol.findByPk(id);

    if (!rol || rol.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    if (rol.es_sistema) {
      return res.status(403).json({
        success: false,
        message: "No se puede eliminar un rol del sistema",
      });
    }

    // Verificar si hay usuarios con este rol
    const usuariosConRol = await Usuario.count({
      include: [
        {
          model: Rol,
          as: "roles",
          where: { id: id },
        },
      ],
    });

    if (usuariosConRol > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el rol porque tiene ${usuariosConRol} usuario(s) asignado(s)`,
      });
    }

    await rol.softDelete(deleted_by);

    res.json({
      success: true,
      message: "Rol eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteRol:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar rol",
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/roles/:id/permisos
 * Asignar permisos a un rol
 */
export const asignarPermisos = async (req, res) => {
  try {
    const { id } = req.params;
    const { permisos } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(permisos) || permisos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de IDs de permisos",
      });
    }

    const rol = await Rol.findByPk(id);

    if (!rol || rol.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    const permisosEncontrados = await Permiso.findAll({
      where: {
        id: { [Op.in]: permisos },
        estado: true,
      },
    });

    if (permisosEncontrados.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron permisos válidos",
      });
    }

    // Eliminar permisos existentes y crear nuevos con auditoría
    await RolPermiso.destroy({ where: { rol_id: id } });

    const rolPermisosData = permisosEncontrados.map((permiso) => ({
      rol_id: id,
      permiso_id: permiso.id,
      created_by: userId,
      updated_by: userId,
    }));
    await RolPermiso.bulkCreate(rolPermisosData);

    // Recargar rol con permisos
    const rolActualizado = await Rol.findByPk(id, {
      include: [
        {
          model: Permiso,
          as: "permisos",
          attributes: ["id", "slug", "descripcion"],
        },
      ],
    });

    res.json({
      success: true,
      message: `${permisosEncontrados.length} permiso(s) asignado(s) al rol`,
      data: rolActualizado,
    });
  } catch (error) {
    console.error("Error en asignarPermisos:", error);
    res.status(500).json({
      success: false,
      message: "Error al asignar permisos",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/v1/roles/:id/permisos/:permisoId
 * Quitar un permiso de un rol
 */
export const quitarPermiso = async (req, res) => {
  try {
    const { id, permisoId } = req.params;

    const rol = await Rol.findByPk(id);

    if (!rol || rol.deleted_at !== null) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    const permiso = await Permiso.findByPk(permisoId);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: "Permiso no encontrado",
      });
    }

    await rol.removePermiso(permiso);

    res.json({
      success: true,
      message: "Permiso quitado del rol exitosamente",
    });
  } catch (error) {
    console.error("Error en quitarPermiso:", error);
    res.status(500).json({
      success: false,
      message: "Error al quitar permiso",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/roles/:id/usuarios
 * Obtener usuarios que tienen asignado un rol específico
 */
export const getUsuariosDeRol = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findOne({
      where: { id, deleted_at: null },
    });

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    // Buscar usuarios con este rol usando la asociación definida en el modelo
    const usuarios = await Usuario.findAll({
      include: [
        {
          model: Rol,
          as: "roles",
          where: { id: rol.id },
          through: { attributes: [] },
          attributes: [],
        },
      ],
      attributes: ["id", "username", "email", "nombres", "apellidos", "estado", "last_login_at", "created_at"],
      order: [["username", "ASC"]],
    });

    res.json({
      success: true,
      data: {
        rol: {
          id: rol.id,
          nombre: rol.nombre,
          slug: rol.slug,
          color: rol.color,
        },
        usuarios,
        total: usuarios.length,
      },
    });
  } catch (error) {
    console.error("Error en getUsuariosDeRol:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios del rol",
      error: error.message,
    });
  }
};

export default {
  getRoles,
  getRolById,
  getPermisosDeRol,
  getRolBySlug,
  createRol,
  updateRol,
  deleteRol,
  asignarPermisos,
  quitarPermiso,
  getUsuariosDeRol,
};
