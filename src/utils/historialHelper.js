/**
 * File: src/utils/historialHelper.js
 * @version 1.0.0
 * @description Helper para crear registros de historial de estados de novedades
 * 
 * Este helper centraliza la lógica para crear entradas en historial_estado_novedades
 * desde diferentes puntos del sistema (operativos, novedades, etc.)
 */

import { HistorialEstadoNovedad, Novedad, EstadoNovedad } from "../models/index.js";
import { getNowInTimezone, rawDate } from "./dateHelper.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";

/**
 * Crea un registro en historial_estado_novedades
 * 
 * @param {Object} options - Opciones para crear el historial
 * @param {number} options.novedadId - ID de la novedad
 * @param {number} options.usuarioId - ID del usuario que realiza el cambio
 * @param {string} options.observaciones - Observaciones/descripción del cambio
 * @param {number|null} options.estadoNuevoId - ID del nuevo estado (opcional)
 * @param {string|null} options.fechaCambio - Fecha del cambio (opcional, usa actual si no se especifica)
 * @param {Object|null} options.metadata - Metadatos adicionales (opcional)
 * @param {Object} options.transaction - Transacción de Sequelize (opcional)
 * @returns {Promise<Object>} - Registro de historial creado
 */
export async function crearHistorialNovedad({
  novedadId,
  usuarioId,
  observaciones,
  estadoNuevoId = null,
  fechaCambio = null,
  metadata = null,
  transaction = null
}) {
  try {
    // Validaciones básicas
    if (!novedadId || !usuarioId || !observaciones || observaciones.trim() === "") {
      throw new Error("novedadId, usuarioId y observaciones son requeridos");
    }

    // Obtener la novedad actual
    const novedad = await Novedad.findOne({
      where: { id: novedadId, estado: 1, deleted_at: null },
      transaction,
    });

    if (!novedad) {
      throw new Error("Novedad no encontrada");
    }

    const estadoAnteriorId = novedad.estado_novedad_id;

    // Determinar el estado nuevo (si no se especifica, mantener el actual)
    const estadoFinalId = estadoNuevoId || estadoAnteriorId;

    // Si se especifica un estado diferente, verificar que exista
    if (estadoNuevoId && estadoNuevoId !== estadoAnteriorId) {
      const estadoNuevo = await EstadoNovedad.findByPk(estadoNuevoId, { transaction });
      if (!estadoNuevo) {
        throw new Error("Estado nuevo no encontrado");
      }
    }

    // Verificar si ya existe un historial IDÉNTICO en el último minuto para evitar duplicados
    // Permitir diferentes tipos de operativo (PERSONAL vs VEHICULO) en el mismo minuto
    const fechaLimite = new Date(Date.now() - 30000); // 30 segundos atrás (más preciso)
    const existente = await HistorialEstadoNovedad.findOne({
      where: {
        novedad_id: novedadId,
        estado_anterior_id: estadoAnteriorId,
        estado_nuevo_id: estadoFinalId,
        usuario_id: usuarioId,
        created_at: {
          [Op.gte]: fechaLimite
        },
        // Solo considerar duplicado si las observaciones son exactamente iguales
        observaciones: observaciones.trim()
      },
      order: [["created_at", "DESC"]],
      transaction
    });

    // Si ya existe un registro IDÉNTICO (misma observación), retornarlo
    if (existente) {
      return existente;
    }

    // Crear registro en historial
    const nuevoHistorial = await HistorialEstadoNovedad.create({
      novedad_id: novedadId,
      estado_anterior_id: estadoAnteriorId,
      estado_nuevo_id: estadoFinalId,
      usuario_id: usuarioId,
      tiempo_en_estado_min: null, // El trigger calculará automáticamente
      observaciones: observaciones.trim(),
      metadata: metadata || null,
      fecha_cambio: fechaCambio ? rawDate(fechaCambio, sequelize) : rawDate(getNowInTimezone(), sequelize),
      created_by: usuarioId,
      updated_by: usuarioId,
    }, { transaction });

    // Actualizar estado de la novedad si realmente cambió
    if (estadoFinalId !== estadoAnteriorId) {
      await novedad.update({
        estado_novedad_id: estadoFinalId,
        updated_by: usuarioId,
      }, { transaction });
    }

    return nuevoHistorial;

  } catch (error) {
    console.error("Error en crearHistorialNovedad:", error);
    throw error;
  }
}

/**
 * Crea un historial para cambios en operativos (personal/vehículos)
 * 
 * @param {Object} options - Opciones para crear el historial
 * @param {number} options.novedadId - ID de la novedad
 * @param {number} options.usuarioId - ID del usuario
 * @param {Object} options.datosActualizacion - Datos actualizados (acciones_tomadas, resultado, observaciones)
 * @param {string} options.tipoOperativo - Tipo de operativo ('PERSONAL' o 'VEHICULO')
 * @param {Object} options.datosAdicionales - Datos adicionales (vehículo, personal, etc.)
 * @param {Object} options.transaction - Transacción (opcional)
 * @returns {Promise<Object>} - Registro de historial creado
 */
export async function crearHistorialOperativo({
  novedadId,
  usuarioId,
  datosActualizacion,
  tipoOperativo,
  datosAdicionales = {},
  transaction = null
}) {
  try {
    const { acciones_tomadas, resultado, observaciones, fecha_llegada } = datosActualizacion;
    
    // Construir mensaje de historial según tipo operativo
    let mensajeHistorial = "";
    
    if (tipoOperativo === "VEHICULO") {
      // Formato para vehículos: "{Tipo de vehiculo} {placa} {piloto} llegó a las {fecha_llegada} y se realizaron {acciones_tomadas}. {observaciones}"
      const { tipo_vehiculo, placa, piloto_nombres, piloto_apellido_paterno } = datosAdicionales;
      
      mensajeHistorial = `${tipo_vehiculo || "Vehículo"} ${placa || "Sin placa"}`;
      
      if (piloto_nombres || piloto_apellido_paterno) {
        const nombrePiloto = `${piloto_nombres || ""} ${piloto_apellido_paterno || ""}`.trim();
        mensajeHistorial += ` ${nombrePiloto ? `piloto: ${nombrePiloto}` : ""}`;
      }
      
      if (fecha_llegada) {
        mensajeHistorial += ` llegó a las ${fecha_llegada}`;
      }
      
      if (acciones_tomadas && acciones_tomadas.trim()) {
        mensajeHistorial += ` y se realizaron las acciones: ${acciones_tomadas.trim()}`;
      }
      
      if (observaciones && observaciones.trim()) {
        // Eliminar acciones duplicadas de observaciones (evitar redundancia)
        let observacionesLimpias = observaciones.trim();
        if (acciones_tomadas && acciones_tomadas.trim()) {
          // Buscar y eliminar patrones como "[fecha - placa] acciones_tomadas"
          const patronAcciones = new RegExp("\\[[^\\]]+\\]\\s*" + acciones_tomadas.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "gi");
          observacionesLimpias = observacionesLimpias.replace(patronAcciones, "").trim();
        }
        mensajeHistorial += `. Observaciones: ${observacionesLimpias}`;
      }
      
    } else {
      // Formato para personal (mantener estilo actual pero más limpio)
      mensajeHistorial = "Actualización desde operativos personal";
      
      if (resultado) {
        mensajeHistorial += ` - Resultado: ${resultado}`;
      }
      
      if (acciones_tomadas && acciones_tomadas.trim()) {
        mensajeHistorial += ` - Acciones: ${acciones_tomadas.trim()}`;
      }
      
      if (observaciones && observaciones.trim()) {
        mensajeHistorial += ` - Observaciones: ${observaciones.trim()}`;
      }
    }

    // Determinar estado según resultado
    let estadoNuevoId = null;
    if (resultado === "RESUELTO") {
      estadoNuevoId = 6; // ID 6 = RESUELTA
    } else if (resultado === "ESCALADO") {
      estadoNuevoId = 5; // ID 5 = EN ATENCION
    } else if (resultado === "CANCELADO") {
      estadoNuevoId = 8; // ID 8 = CANCELADA
    }

    // Metadatos adicionales
    const metadata = {
      tipo_operativo: tipoOperativo,
      datos_actualizados: {
        resultado: resultado || null,
        tiene_acciones: Boolean(acciones_tomadas && acciones_tomadas.trim()),
        tiene_observaciones: Boolean(observaciones && observaciones.trim()),
        fecha_actualizacion: getNowInTimezone()
      }
    };

    return await crearHistorialNovedad({
      novedadId,
      usuarioId,
      observaciones: mensajeHistorial,
      estadoNuevoId,
      metadata,
      transaction
    });

  } catch (error) {
    console.error("Error en crearHistorialOperativo:", error);
    throw error;
  }
}

export default {
  crearHistorialNovedad,
  crearHistorialOperativo,
};
