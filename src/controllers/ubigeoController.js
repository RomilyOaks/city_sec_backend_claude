/**
 * Ruta: src/controllers/ubigeoController.js
 * Descripción: Controlador para gestión de ubigeos
 */

import { Op } from "sequelize";
import Ubigeo from "../models/Ubigeo.js";

/**
 * Buscar ubigeos por texto (departamento, provincia o distrito)
 * GET /api/v1/ubigeo
 */
export const getUbigeos = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    const whereConditions = {};

    if (search && search.length >= 2) {
      whereConditions[Op.or] = [
        { departamento: { [Op.like]: `%${search}%` } },
        { provincia: { [Op.like]: `%${search}%` } },
        { distrito: { [Op.like]: `%${search}%` } },
        { ubigeo_code: { [Op.like]: `%${search}%` } },
      ];
    }

    const ubigeos = await Ubigeo.findAll({
      where: whereConditions,
      limit: parseInt(limit),
      order: [["departamento", "ASC"], ["provincia", "ASC"], ["distrito", "ASC"]],
    });

    res.json({
      success: true,
      data: ubigeos,
    });
  } catch (error) {
    console.error("Error en getUbigeos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ubigeos",
      error: error.message,
    });
  }
};

/**
 * Obtener ubigeo por código
 * GET /api/v1/ubigeo/:code
 */
export const getUbigeoByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const ubigeo = await Ubigeo.findByPk(code);

    if (!ubigeo) {
      return res.status(404).json({
        success: false,
        message: "Ubigeo no encontrado",
      });
    }

    res.json({
      success: true,
      data: ubigeo,
    });
  } catch (error) {
    console.error("Error en getUbigeoByCode:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ubigeo",
      error: error.message,
    });
  }
};
