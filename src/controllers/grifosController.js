/**
 * ===================================================
 * CONTROLADOR: Búsqueda de Grifos
 * ===================================================
 *
 * Ruta: src/controllers/grifosController.js
 *
 * Descripción:
 * Controlador para buscar grifos registrados en abastecimientos.
 * Usa DISTINCT para obtener lista única de grifos.
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-04-18
 *
 * @module controllers/grifosController
 * @requires sequelize
 */

import { AbastecimientoCombustible } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * GET /api/v1/grifos
 * Obtener lista única de grifos registrados
 */
export const getGrifos = async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;

    // Construir WHERE
    const where = {
      deleted_at: null, // Solo registros activos
    };

    // Si hay búsqueda, filtrar por nombre o RUC
    // Convertir búsqueda a mayúsculas para consistencia
    const searchUpper = search ? search.toUpperCase() : null;
    
    if (searchUpper) {
      where[Op.or] = [
        {
          grifo_nombre: {
            [Op.like]: `%${searchUpper}%`
          }
        },
        {
          grifo_ruc: {
            [Op.like]: `%${searchUpper}%`
          }
        }
      ];
    }

    // Buscar grifos distintos usando GROUP BY
    const grifos = await AbastecimientoCombustible.findAll({
      attributes: [
        "grifo_nombre",
        "grifo_ruc",
        [
          // Contar cuántos abastecimientos tiene cada grifo
          sequelize.fn("COUNT", sequelize.col("id")), 
          "total_abastecimientos"
        ]
      ],
      where,
      group: ["grifo_nombre", "grifo_ruc"],
      order: [
        [sequelize.fn("COUNT", sequelize.col("id")), "DESC"], // Más usados primero
        ["grifo_nombre", "ASC"]
      ],
      limit: parseInt(limit),
      raw: true, // Necesario para que funcione GROUP BY con atributos agregados
    });

    // Formatear respuesta
    const grifosFormateados = grifos.map(grifo => ({
      grifo_nombre: grifo.grifo_nombre,
      grifo_ruc: grifo.grifo_ruc,
      total_abastecimientos: parseInt(grifo.total_abastecimientos),
      // Indicar si tiene RUC
      tiene_ruc: !!grifo.grifo_ruc
    }));

    return res.status(200).json({
      success: true,
      message: "Grifos obtenidos exitosamente",
      data: {
        grifos: grifosFormateados,
        total: grifosFormateados.length
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener grifos",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/grifos/sugerencias
 * Obtener sugerencias de grifos basadas en búsqueda parcial
 */
export const getSugerenciasGrifos = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          sugerencias: []
        }
      });
    }

    // Convertir búsqueda a mayúsculas para consistencia
    const qUpper = q ? q.toUpperCase() : null;
    
    // Buscar grifos que coincidan con la búsqueda
    const grifos = await AbastecimientoCombustible.findAll({
      attributes: [
        "grifo_nombre",
        "grifo_ruc"
      ],
      where: {
        deleted_at: null,
        [Op.or]: [
          {
            grifo_nombre: {
              [Op.like]: `%${qUpper}%`
            }
          },
          {
            grifo_ruc: {
              [Op.like]: `%${qUpper}%`
            }
          }
        ]
      },
      group: ["grifo_nombre", "grifo_ruc"],
      order: [
        [sequelize.fn("COUNT", sequelize.col("id")), "DESC"],
        ["grifo_nombre", "ASC"]
      ],
      limit: parseInt(limit),
      raw: true,
    });

    const sugerencias = grifos.map(grifo => ({
      grifo_nombre: grifo.grifo_nombre,
      grifo_ruc: grifo.grifo_ruc,
      tiene_ruc: !!grifo.grifo_ruc
    }));

    return res.status(200).json({
      success: true,
      message: "Sugerencias obtenidas exitosamente",
      data: {
        sugerencias,
        total: sugerencias.length
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener sugerencias de grifos",
      error: error.message,
    });
  }
};
