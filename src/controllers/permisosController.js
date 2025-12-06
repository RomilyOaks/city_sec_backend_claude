/**
 * Ruta: src/controllers/permisosController.js
 *
 * Descripción:
 * Controlador para la gestión de permisos del sistema RBAC.
 * Los permisos definen acciones específicas que los usuarios pueden realizar.
 * Estructura: modulo.recurso.accion (ej: usuarios.usuarios.create)
 *
 * Endpoints:
 * - GET    /api/v1/permisos             - Listar todos
 * - GET    /api/v1/permisos/:id         - Obtener por ID
 * - GET    /api/v1/permisos/slug/:slug  - Obtener por slug
 * - GET    /api/v1/permisos/modulo/:modulo - Por módulo
 * - POST   /api/v1/permisos             - Crear nuevo
 * - PUT    /api/v1/permisos/:id         - Actualizar
 * - DELETE /api/v1/permisos/:id         - Eliminar
 * - PATCH  /api/v1/permisos/:id/estado  - Activar/desactivar
 */

import { Permiso, Rol } from "../models/index.js";
import { Op } from "sequelize";

/**
 * GET /api/v1/permisos
 * Listar permisos con filtros y paginación
 */
export const getPermisos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      modulo,
      recurso,
      activos = "true",
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir condiciones WHERE
    const whereConditions = {};

    if (modulo) {
      whereConditions.modulo = modulo.toLowerCase();
    }

    if (recurso) {
      whereConditions.recurso = recurso.toLowerCase();
    }

    if (activos === "true") {
      whereConditions.estado = true;
    }

    if (search) {
      whereConditions[Op.or] = [
        { slug: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    // Consultar permisos
    const { count, rows: permisos } = await Permiso.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ["modulo", "ASC"],
        ["recurso", "ASC"],
        ["accion", "ASC"],
      ],
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        permisos,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error en getPermisos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener permisos",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/permisos/:id
 * Obtener permiso por ID
 */
export const getPermisoById = async (req, res) => {
  try {
    const { id } = req.params;

    const permiso = await Permiso.findByPk(id);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: "Permiso no encontrado",
      });
    }

    res.json({
      success: true,
      data: permiso,
    });
  } catch (error) {
    console.error("Error en getPermisoById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener permiso",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/permisos/slug/:slug
 * Buscar permiso por slug
 */
export const getPermisoBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const permiso = await Permiso.findBySlug(slug);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: "Permiso no encontrado con ese slug",
      });
    }

    res.json({
      success: true,
      data: permiso,
    });
  } catch (error) {
    console.error("Error en getPermisoBySlug:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar permiso",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/permisos/modulo/:modulo
 * Obtener permisos de un módulo
 */
export const getPermisosByModulo = async (req, res) => {
  try {
    const { modulo } = req.params;

    const permisos = await Permiso.findByModulo(modulo);

    res.json({
      success: true,
      data: {
        modulo: modulo.toLowerCase(),
        permisos,
        total: permisos.length,
      },
    });
  } catch (error) {
    console.error("Error en getPermisosByModulo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener permisos del módulo",
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/permisos
 * Crear nuevo permiso
 */
export const createPermiso = async (req, res) => {
  try {
    const { modulo, recurso, accion, descripcion } = req.body;

    // Validar campos requeridos
    if (!modulo || !recurso || !accion) {
      return res.status(400).json({
        success: false,
        message: "Módulo, recurso y acción son requeridos",
      });
    }

    // Crear permiso (el slug se genera automáticamente)
    const nuevoPermiso = await Permiso.create({
      modulo: modulo.toLowerCase(),
      recurso: recurso.toLowerCase(),
      accion: accion.toLowerCase(),
      descripcion,
    });

    res.status(201).json({
      success: true,
      message: "Permiso creado exitosamente",
      data: nuevoPermiso,
    });
  } catch (error) {
    // Manejar error de slug duplicado
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message:
          "Ya existe un permiso con esa combinación de módulo, recurso y acción",
      });
    }

    console.error("Error en createPermiso:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear permiso",
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/permisos/:id
 * Actualizar permiso
 */
export const updatePermiso = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;

    const permiso = await Permiso.findByPk(id);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: "Permiso no encontrado",
      });
    }

    // Verificar si es permiso del sistema
    if (permiso.es_sistema) {
      return res.status(403).json({
        success: false,
        message: "No se puede editar un permiso del sistema",
      });
    }

    // Solo permitir actualizar la descripción
    if (descripcion !== undefined) {
      permiso.descripcion = descripcion;
    }

    await permiso.save();

    res.json({
      success: true,
      message: "Permiso actualizado exitosamente",
      data: permiso,
    });
  } catch (error) {
    console.error("Error en updatePermiso:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar permiso",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/v1/permisos/:id
 * Eliminar permiso
 */
export const deletePermiso = async (req, res) => {
  try {
    const { id } = req.params;

    const permiso = await Permiso.findByPk(id);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: "Permiso no encontrado",
      });
    }

    if (permiso.es_sistema) {
      return res.status(403).json({
        success: false,
        message: "No se puede eliminar un permiso del sistema",
      });
    }

    await permiso.destroy();

    res.json({
      success: true,
      message: "Permiso eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deletePermiso:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar permiso",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/v1/permisos/:id/estado
 * Activar/desactivar permiso
 */
export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "El parámetro estado debe ser true o false",
      });
    }

    const permiso = await Permiso.findByPk(id);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: "Permiso no encontrado",
      });
    }

    if (permiso.es_sistema) {
      return res.status(403).json({
        success: false,
        message: "No se puede cambiar el estado de un permiso del sistema",
      });
    }

    permiso.estado = estado;
    await permiso.save();

    res.json({
      success: true,
      message: `Permiso ${estado ? "activado" : "desactivado"} exitosamente`,
      data: permiso,
    });
  } catch (error) {
    console.error("Error en cambiarEstado:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado",
      error: error.message,
    });
  }
};

export default {
  getPermisos,
  getPermisoById,
  getPermisoBySlug,
  getPermisosByModulo,
  createPermiso,
  updatePermiso,
  deletePermiso,
  cambiarEstado,
};
