import { Taller, MantenimientoVehiculo } from "../models/index.js";
import { Op } from "sequelize";

export const getAllTalleres = async (req, res) => {
  try {
    const { estado, search, limit = 50 } = req.query;

    const where = { deleted_at: null };

    if (estado !== undefined) {
      if (estado === "true" || estado === "1" || estado === 1 || estado === true) {
        where.estado = 1;
      } else if (estado === "false" || estado === "0" || estado === 0 || estado === false) {
        where.estado = 0;
      }
    }

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { ruc: { [Op.like]: `%${search}%` } },
      ];
    }

    const items = await Taller.findAll({
      where,
      limit: parseInt(limit),
      order: [["nombre", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error) {
    console.error("Error en getAllTalleres:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener talleres",
      error: error.message,
    });
  }
};

export const getTallerById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Taller.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Taller no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error en getTallerById:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el taller",
      error: error.message,
    });
  }
};

export const createTaller = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.ruc) payload.ruc = String(payload.ruc).trim();
    if (payload.nombre) payload.nombre = String(payload.nombre).trim();

    const existenteRuc = await Taller.findOne({
      where: { ruc: payload.ruc, deleted_at: null },
    });

    if (existenteRuc) {
      return res.status(409).json({
        success: false,
        message: "RUC de taller ya existe",
      });
    }

    const nuevo = await Taller.create({
      ...payload,
      estado: payload.estado ?? 1,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Taller creado exitosamente",
      data: nuevo,
    });
  } catch (error) {
    console.error("Error en createTaller:", error);

    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message: "RUC de taller ya existe",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al crear taller",
      error: error.message,
    });
  }
};

export const updateTaller = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    const item = await Taller.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Taller no encontrado",
      });
    }

    if (payload.ruc && String(payload.ruc).trim() !== item.ruc) {
      const rucExiste = await Taller.findOne({
        where: {
          ruc: String(payload.ruc).trim(),
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (rucExiste) {
        return res.status(409).json({
          success: false,
          message: "RUC de taller ya existe",
        });
      }
    }

    await item.update({
      ...payload,
      updated_by: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Taller actualizado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("Error en updateTaller:", error);

    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message: "RUC de taller ya existe",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al actualizar taller",
      error: error.message,
    });
  }
};

export const deleteTaller = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Taller.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Taller no encontrado",
      });
    }

    const enUso = await MantenimientoVehiculo.count({
      where: {
        taller_id: id,
        deleted_at: null,
        estado: 1,
        estado_mantenimiento: { [Op.in]: ["PROGRAMADO", "EN_TALLER", "EN_PROCESO"] },
      },
    });

    if (enUso > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar. Existen mantenimientos activos asociados a este taller",
      });
    }

    await item.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Taller eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteTaller:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar taller",
      error: error.message,
    });
  }
};

export default {
  getAllTalleres,
  getTallerById,
  createTaller,
  updateTaller,
  deleteTaller,
};
