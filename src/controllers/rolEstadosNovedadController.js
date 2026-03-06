/**
 * Controlador: RolEstadosNovedad
 * CRUD para la tabla rol_estados_novedad + endpoint especial por rol
 */

import {
  RolEstadoNovedad,
  Rol,
  EstadoNovedad,
  Usuario,
} from "../models/index.js";

const auditoriaIncludes = [
  {
    model: Usuario,
    as: "creadorRolEstadoNovedad",
    attributes: ["id", "username", "nombres", "apellidos"],
  },
  {
    model: Usuario,
    as: "actualizadorRolEstadoNovedad",
    attributes: ["id", "username", "nombres", "apellidos"],
  },
];

const baseIncludes = [
  {
    model: Rol,
    as: "rolRolEstadoNovedad",
    attributes: ["id", "nombre", "descripcion"],
  },
  {
    model: EstadoNovedad,
    as: "estadoNovedadRolEstadoNovedad",
    attributes: ["id", "nombre", "color_hex", "es_final", "es_inicial", "requiere_unidad"],
  },
  ...auditoriaIncludes,
];

/**
 * GET /rol-estados-novedad
 * Lista todos los registros activos con paginación y filtros opcionales
 */
export const getRolEstadosNovedad = async (req, res) => {
  try {
    const { rol_id, estado_novedad_id, estado, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { deleted_at: null };
    if (rol_id) where.rol_id = parseInt(rol_id);
    if (estado_novedad_id) where.estado_novedad_id = parseInt(estado_novedad_id);
    if (estado !== undefined) where.estado = parseInt(estado);

    const { count, rows } = await RolEstadoNovedad.findAndCountAll({
      where,
      include: baseIncludes,
      order: [["rol_id", "ASC"], ["estado_novedad_id", "ASC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener configuraciones de estados por rol",
      error: error.message,
    });
  }
};

/**
 * GET /rol-estados-novedad/:id
 * Obtiene un registro por ID
 */
export const getRolEstadoNovedadById = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await RolEstadoNovedad.findOne({
      where: { id, deleted_at: null },
      include: baseIncludes,
    });

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    return res.status(200).json({ success: true, data: registro });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener el registro",
      error: error.message,
    });
  }
};

/**
 * GET /rol-estados-novedad/rol/:rolId/estados
 * Retorna los estados disponibles para un rol específico (solo activos)
 * Endpoint especial para consumo del frontend en el flujo de novedades
 */
export const getEstadosByRol = async (req, res) => {
  try {
    const { rolId } = req.params;

    const rol = await Rol.findOne({ where: { id: rolId, estado: 1 } });
    if (!rol) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado o inactivo",
      });
    }

    const registros = await RolEstadoNovedad.findAll({
      where: { rol_id: rolId, estado: 1, deleted_at: null },
      include: [
        {
          model: EstadoNovedad,
          as: "estadoNovedadRolEstadoNovedad",
          attributes: ["id", "nombre", "color_hex", "es_final", "es_inicial", "requiere_unidad"],
          where: { estado: 1 },
        },
      ],
      order: [
        [{ model: EstadoNovedad, as: "estadoNovedadRolEstadoNovedad" }, "nombre", "ASC"],
      ],
    });

    const estados = registros.map((r) => ({
      ...r.estadoNovedadRolEstadoNovedad.toJSON(),
      descripcion_acceso: r.descripcion,
    }));

    return res.status(200).json({
      success: true,
      rol: { id: rol.id, nombre: rol.nombre },
      data: estados,
      total: estados.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener estados disponibles para el rol",
      error: error.message,
    });
  }
};

/**
 * POST /rol-estados-novedad
 * Crea una nueva configuración rol-estado
 */
export const createRolEstadoNovedad = async (req, res) => {
  try {
    const { rol_id, estado_novedad_id, descripcion, observaciones } = req.body;

    // Verificar que no exista ya (incluidos soft-deleted para mayor control)
    const existente = await RolEstadoNovedad.findOne({
      where: { rol_id, estado_novedad_id, deleted_at: null },
    });
    if (existente) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una configuración para este rol y estado de novedad",
      });
    }

    const nuevo = await RolEstadoNovedad.create({
      rol_id,
      estado_novedad_id,
      descripcion: descripcion || null,
      observaciones: observaciones || null,
      estado: 1,
      created_by: req.user.id,
      updated_by: req.user.id,
    });

    const registro = await RolEstadoNovedad.findOne({
      where: { id: nuevo.id },
      include: baseIncludes,
    });

    return res.status(201).json({
      success: true,
      message: "Configuración creada exitosamente",
      data: registro,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Ya existe una configuración para este rol y estado de novedad",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Error al crear la configuración",
      error: error.message,
    });
  }
};

/**
 * PUT /rol-estados-novedad/:id
 * Actualiza descripción, observaciones o estado de un registro
 */
export const updateRolEstadoNovedad = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, observaciones, estado } = req.body;

    const registro = await RolEstadoNovedad.findOne({
      where: { id, deleted_at: null },
    });
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    const datos = { updated_by: req.user.id };
    if (descripcion !== undefined) datos.descripcion = descripcion;
    if (observaciones !== undefined) datos.observaciones = observaciones;
    if (estado !== undefined) datos.estado = estado ? 1 : 0;

    await registro.update(datos);

    const actualizado = await RolEstadoNovedad.findOne({
      where: { id },
      include: baseIncludes,
    });

    return res.status(200).json({
      success: true,
      message: "Configuración actualizada exitosamente",
      data: actualizado,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la configuración",
      error: error.message,
    });
  }
};

/**
 * PATCH /rol-estados-novedad/:id/estado
 * Activa o desactiva un registro
 */
export const cambiarEstadoRolEstadoNovedad = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const registro = await RolEstadoNovedad.findOne({
      where: { id, deleted_at: null },
    });
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    await registro.update({ estado: estado ? 1 : 0, updated_by: req.user.id });

    return res.status(200).json({
      success: true,
      message: `Configuración ${estado ? "activada" : "desactivada"} exitosamente`,
      data: { id: registro.id, estado: registro.estado },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al cambiar el estado",
      error: error.message,
    });
  }
};

/**
 * DELETE /rol-estados-novedad/:id
 * Soft-delete del registro
 */
export const deleteRolEstadoNovedad = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await RolEstadoNovedad.findOne({
      where: { id, deleted_at: null },
    });
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    await registro.update({
      deleted_at: new Date(),
      deleted_by: req.user.id,
      estado: 0,
    });

    return res.status(200).json({
      success: true,
      message: "Configuración eliminada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al eliminar la configuración",
      error: error.message,
    });
  }
};
