/**
 * ===================================================
 * CONTROLADOR: Historial de Estados de Novedades
 * ===================================================
 *
 * Ruta: src/controllers/historialEstadoNovedadController.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-21
 *
 * Características:
 * - Obtener historial de estados por novedad
 * - Registrar cambio de estado manual
 *
 * @module controllers/historialEstadoNovedadController
 * @version 1.0.0
 */

import {
  HistorialEstadoNovedad,
  EstadoNovedad,
  Usuario,
  Novedad,
} from "../models/index.js";
import { Op } from "sequelize";
import { getNowInTimezone } from "../utils/dateHelper.js";

/**
 * Obtener historial de estados de una novedad
 * GET /api/v1/novedades/:novedadId/historial
 */
export const getHistorialByNovedad = async (req, res) => {
  try {
    const { novedadId } = req.params;

    // Verificar que la novedad existe
    const novedad = await Novedad.findOne({
      where: { id: novedadId, estado: 1, deleted_at: null },
    });

    if (!novedad) {
      return res.status(404).json({
        success: false,
        message: "Novedad no encontrada",
      });
    }

    const historial = await HistorialEstadoNovedad.findAll({
      where: { novedad_id: novedadId },
      include: [
        {
          model: EstadoNovedad,
          as: "estadoAnterior",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
        {
          model: EstadoNovedad,
          as: "estadoNuevo",
          attributes: ["id", "nombre", "color_hex", "icono"],
        },
        {
          model: Usuario,
          as: "historialEstadoNovedadUsuario",
          attributes: ["id", "username", "nombres", "apellidos"],
        },
      ],
      order: [["fecha_cambio", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Historial obtenido exitosamente",
      data: historial,
    });
  } catch (error) {
    console.error("❌ Error en getHistorialByNovedad:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial",
      error: error.message,
    });
  }
};

/**
 * Registrar cambio de estado manual
 * POST /api/v1/novedades/:novedadId/historial
 */
export const createHistorialEstado = async (req, res) => {
  try {
    const { novedadId } = req.params;
    const { estado_nuevo_id, observaciones } = req.body;

    // Verificar que la novedad existe
    const novedad = await Novedad.findOne({
      where: { id: novedadId, estado: 1, deleted_at: null },
    });

    if (!novedad) {
      return res.status(404).json({
        success: false,
        message: "Novedad no encontrada",
      });
    }

    // Verificar que el estado nuevo existe
    const estadoNuevo = await EstadoNovedad.findByPk(estado_nuevo_id);
    if (!estadoNuevo) {
      return res.status(404).json({
        success: false,
        message: "Estado no encontrado",
      });
    }

    const estadoAnteriorId = novedad.estado_novedad_id;

    // Calcular tiempo en estado anterior
    const tiempoEstado = Math.floor(
      (Date.now() - new Date(novedad.updated_at)) / 60000
    );

    // Crear registro en historial
    const nuevoHistorial = await HistorialEstadoNovedad.create({
      novedad_id: novedadId,
      estado_anterior_id: estadoAnteriorId,
      estado_nuevo_id,
      usuario_id: req.user.id,
      tiempo_en_estado_min: tiempoEstado,
      observaciones,
      fecha_cambio: getNowInTimezone(),
      created_by: req.user.id,
      updated_by: req.user.id,
    });

    // Actualizar estado de la novedad
    await novedad.update({
      estado_novedad_id: estado_nuevo_id,
      updated_by: req.user.id,
    });

    // Obtener el registro con las relaciones
    const historialCompleto = await HistorialEstadoNovedad.findByPk(
      nuevoHistorial.id,
      {
        include: [
          {
            model: EstadoNovedad,
            as: "estadoAnterior",
            attributes: ["id", "nombre", "color_hex", "icono"],
          },
          {
            model: EstadoNovedad,
            as: "estadoNuevo",
            attributes: ["id", "nombre", "color_hex", "icono"],
          },
          {
            model: Usuario,
            as: "usuarioCambio",
            attributes: ["id", "username", "nombres", "apellidos"],
          },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Cambio de estado registrado exitosamente",
      data: historialCompleto,
    });
  } catch (error) {
    console.error("❌ Error en createHistorialEstado:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar el cambio de estado",
      error: error.message,
    });
  }
};
