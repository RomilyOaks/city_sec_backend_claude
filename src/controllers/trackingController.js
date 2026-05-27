/**
 * ===================================================
 * CONTROLADOR: Tracking GPS de Vehículos de Patrullaje
 * ===================================================
 *
 * Ruta: src/controllers/trackingController.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-05-27
 *
 * Descripción:
 * Gestiona el tracking GPS en tiempo real de los vehículos
 * de patrullaje del serenazgo. Recibe posiciones desde la
 * app "CitySecure Tracking Patrol Units", las persiste y
 * las difunde al dashboard vía SSE.
 *
 * Endpoints:
 *   POST   /tracking/ubicacion                           — Recibir posición GPS
 *   GET    /tracking/activos                             — Vehículos activos (últimos 10 min)
 *   GET    /tracking/vehiculo/:vehiculoId/ruta           — Historial de ruta por turno
 *   GET    /tracking/novedad/:novedadId/vehiculos-cercanos — Unidades más próximas a una novedad
 *
 * @module controllers/trackingController
 * @version 1.0.0
 * @date 2026-05-27
 */

import models from "../models/index.js";
const {
  TrackingVehiculo,
  TrackingHistorial,
  Vehiculo,
  TipoVehiculo,
  PersonalSeguridad,
  OperativosTurno,
  Novedad,
} = models;

import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { broadcastEvent } from "../utils/sse-manager.js";
import logger from "../utils/logger.js";
import { formatResponse, formatErrorResponse } from "../utils/responseFormatter.js";

// ============================================================
// RATE LIMITER INTERNO — 1 request cada 3 s por vehiculo_id
// ============================================================

const trackingRateLimitStore = new Map();
const TRACKING_WINDOW_MS = 3000; // 3 segundos

/**
 * Verifica si el vehículo puede enviar otra actualización.
 * @param {number} vehiculoId
 * @returns {number} 0 si está permitido, o los segundos de espera restantes
 */
const checkRateLimit = (vehiculoId) => {
  const key = `tv:${vehiculoId}`;
  const now = Date.now();
  const lastRequest = trackingRateLimitStore.get(key);

  if (lastRequest && now - lastRequest < TRACKING_WINDOW_MS) {
    return Math.ceil((TRACKING_WINDOW_MS - (now - lastRequest)) / 1000);
  }

  trackingRateLimitStore.set(key, now);
  return 0;
};

// Limpiar entradas expiradas del store cada minuto para evitar memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of trackingRateLimitStore.entries()) {
    if (now - timestamp > TRACKING_WINDOW_MS * 20) {
      trackingRateLimitStore.delete(key);
    }
  }
}, 60_000);

// ============================================================
// CONSTANTES
// ============================================================

/** Umbral para considerar un vehículo "activo" (minutos) */
const MINUTOS_ACTIVO = 10;

/** Velocidad promedio estimada para cálculo de ETA (km/h) */
const VELOCIDAD_PROMEDIO_KMH = 40;

// ============================================================
// CONTROLADORES
// ============================================================

/**
 * POST /api/v1/tracking/ubicacion
 *
 * Recibe y persiste la posición GPS actual de un vehículo.
 * Hace UPSERT en tracking_vehiculos (snapshot) e INSERT en
 * tracking_historial, luego emite evento SSE al dashboard.
 *
 * Rate limit: 1 request cada 3 segundos por vehiculo_id.
 */
export const updateUbicacion = async (req, res) => {
  try {
    const {
      vehiculo_id,
      lat,
      lng,
      velocidad,
      precision_gps,
      bateria_dispositivo,
    } = req.body;

    // --- Rate limiting por vehiculo_id ---
    const retryAfter = checkRateLimit(vehiculo_id);
    if (retryAfter > 0) {
      return res.status(429).json(
        formatErrorResponse(
          `Demasiadas solicitudes para el vehículo ${vehiculo_id}. Espere ${retryAfter} segundo(s).`,
          { retryAfter }
        )
      );
    }

    // --- Verificar que el vehículo existe y está activo ---
    const vehiculo = await Vehiculo.findOne({
      where: { id: vehiculo_id, estado: 1 },
      attributes: ["id", "placa", "codigo_vehiculo"],
    });

    if (!vehiculo) {
      return res.status(404).json(
        formatErrorResponse(
          `Vehículo con ID ${vehiculo_id} no encontrado o inactivo`
        )
      );
    }

    // --- UPSERT en tracking_vehiculos ---
    // findOrCreate garantiza atomicidad sin sync issues
    const [tracking, created] = await TrackingVehiculo.findOrCreate({
      where: { vehiculo_id },
      defaults: {
        vehiculo_id,
        lat,
        lng,
        velocidad: velocidad ?? null,
        precision_gps: precision_gps ?? null,
        bateria_dispositivo: bateria_dispositivo !== undefined ? bateria_dispositivo : null,
        activo: true,
      },
    });

    if (!created) {
      await tracking.update({
        lat,
        lng,
        velocidad: velocidad ?? null,
        precision_gps: precision_gps ?? null,
        bateria_dispositivo: bateria_dispositivo !== undefined ? bateria_dispositivo : null,
        activo: true,
      });
    }

    // --- INSERT en tracking_historial ---
    await TrackingHistorial.create({
      vehiculo_id,
      lat,
      lng,
      velocidad: velocidad ?? null,
      registrado_at: new Date(),
    });

    // --- Emitir evento SSE al dashboard ---
    broadcastEvent("vehiculo:posicion", {
      vehiculo_id,
      placa: vehiculo.placa,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      velocidad: velocidad !== undefined && velocidad !== null ? parseFloat(velocidad) : null,
      timestamp: new Date().toISOString(),
    });

    logger.info(
      `📍 [TRACKING] Vehículo ${vehiculo.placa} (ID ${vehiculo_id}) → (${lat}, ${lng}). ${created ? "CREADO" : "ACTUALIZADO"}`
    );

    return res.status(200).json(
      formatResponse(true, "Posición actualizada correctamente", {
        vehiculo_id,
        placa: vehiculo.placa,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        updated_at: tracking.updated_at,
      })
    );
  } catch (error) {
    logger.error(`❌ [TRACKING] updateUbicacion: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json(
      formatErrorResponse("Error al actualizar la posición del vehículo", {
        error: error.message,
      })
    );
  }
};

// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tracking/activos
 *
 * Devuelve todos los vehículos con posición actualizada en
 * los últimos 10 minutos, con datos de personal y operativo.
 */
export const getActivos = async (req, res) => {
  try {
    const umbralFecha = new Date(Date.now() - MINUTOS_ACTIVO * 60 * 1000);

    const activos = await TrackingVehiculo.findAll({
      where: {
        activo: true,
        updated_at: { [Op.gte]: umbralFecha },
      },
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
          attributes: ["id", "placa", "codigo_vehiculo"],
          include: [
            {
              model: TipoVehiculo,
              as: "tipoVehiculo",
              attributes: ["id", "nombre"],
            },
          ],
        },
        {
          model: PersonalSeguridad,
          as: "personal",
          attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
          required: false,
        },
        {
          model: OperativosTurno,
          as: "operativo",
          attributes: ["id", "turno", "fecha"],
          required: false,
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    const ahora = Date.now();

    const data = activos.map((tv) => {
      const minutosSinActualizar = Math.floor(
        (ahora - new Date(tv.updated_at).getTime()) / 60_000
      );

      const personal = tv.personal
        ? {
            id: tv.personal.id,
            nombre: `${tv.personal.nombres} ${tv.personal.apellido_paterno}`.trim(),
          }
        : null;

      const operativo = tv.operativo
        ? {
            id: tv.operativo.id,
            turno: tv.operativo.turno,
            fecha: tv.operativo.fecha,
          }
        : null;

      return {
        vehiculo_id: tv.vehiculo_id,
        placa: tv.vehiculo?.placa || null,
        tipo: tv.vehiculo?.tipoVehiculo?.nombre || null,
        lat: parseFloat(tv.lat),
        lng: parseFloat(tv.lng),
        velocidad: tv.velocidad !== null ? parseFloat(tv.velocidad) : null,
        precision_gps: tv.precision_gps !== null ? parseFloat(tv.precision_gps) : null,
        bateria_dispositivo: tv.bateria_dispositivo,
        personal,
        operativo,
        ultima_actualizacion: tv.updated_at,
        minutos_sin_actualizar: minutosSinActualizar,
      };
    });

    return res.status(200).json(
      formatResponse(true, "Vehículos activos obtenidos correctamente", {
        vehiculos: data,
        total: data.length,
      })
    );
  } catch (error) {
    logger.error(`❌ [TRACKING] getActivos: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json(
      formatErrorResponse("Error al obtener los vehículos activos", {
        error: error.message,
      })
    );
  }
};

// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tracking/vehiculo/:vehiculoId/ruta
 *
 * Devuelve el historial de posiciones de un vehículo en un
 * rango de tiempo. Útil para reconstruir la ruta de un turno.
 *
 * Query params: fecha_inicio (ISO 8601), fecha_fin (ISO 8601), limit (máx 500)
 */
export const getRutaVehiculo = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const { fecha_inicio, fecha_fin, limit = 500 } = req.query;

    // Verificar que el vehículo existe
    const vehiculo = await Vehiculo.findByPk(vehiculoId, {
      attributes: ["id", "placa", "codigo_vehiculo"],
    });

    if (!vehiculo) {
      return res.status(404).json(
        formatErrorResponse(`Vehículo con ID ${vehiculoId} no encontrado`)
      );
    }

    const limiteFinal = Math.min(parseInt(limit) || 500, 500);

    const puntos = await TrackingHistorial.findAll({
      where: {
        vehiculo_id: vehiculoId,
        registrado_at: {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
        },
      },
      attributes: ["id", "lat", "lng", "velocidad", "registrado_at", "created_at"],
      order: [["registrado_at", "ASC"]],
      limit: limiteFinal,
    });

    const ruta = puntos.map((p) => ({
      id: Number(p.id), // BIGINT → Number
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      velocidad: p.velocidad !== null ? parseFloat(p.velocidad) : null,
      registrado_at: p.registrado_at,
      created_at: p.created_at,
    }));

    return res.status(200).json(
      formatResponse(true, `Ruta obtenida: ${ruta.length} punto(s)`, {
        vehiculo: { id: vehiculo.id, placa: vehiculo.placa },
        fecha_inicio,
        fecha_fin,
        total_puntos: ruta.length,
        limit_aplicado: limiteFinal,
        ruta,
      })
    );
  } catch (error) {
    logger.error(`❌ [TRACKING] getRutaVehiculo: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json(
      formatErrorResponse("Error al obtener la ruta del vehículo", {
        error: error.message,
      })
    );
  }
};

// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tracking/novedad/:novedadId/vehiculos-cercanos
 *
 * Calcula los vehículos activos más cercanos a una novedad
 * usando la fórmula Haversine en SQL. Devuelve máximo 5
 * unidades ordenadas por distancia, con ETA estimado.
 *
 * Solo incluye vehículos con updated_at en los últimos 10 minutos.
 */
export const getVehiculosCercanos = async (req, res) => {
  try {
    const { novedadId } = req.params;

    // --- Obtener coordenadas de la novedad ---
    const novedad = await Novedad.findByPk(novedadId, {
      attributes: ["id", "latitud", "longitud"],
    });

    if (!novedad) {
      return res.status(404).json(
        formatErrorResponse(`Novedad con ID ${novedadId} no encontrada`)
      );
    }

    if (!novedad.latitud || !novedad.longitud) {
      return res.status(422).json(
        formatErrorResponse(
          "La novedad no tiene coordenadas GPS registradas. No es posible calcular distancias."
        )
      );
    }

    const novedadLat = parseFloat(novedad.latitud);
    const novedadLng = parseFloat(novedad.longitud);

    // --- Haversine via SQL con parámetros seguros ---
    // LEAST(1.0, ...) previene errores de dominio en ACOS cuando la precisión
    // decimal da valores levemente > 1.0 por redondeo en punto flotante.
    const vehiculos = await sequelize.query(
      `
      SELECT
        tv.vehiculo_id,
        v.placa,
        v.codigo_vehiculo,
        tt.nombre                  AS tipo_vehiculo,
        tv.lat,
        tv.lng,
        tv.velocidad,
        tv.updated_at,
        ps.id                      AS personal_id,
        ps.nombres                 AS personal_nombres,
        ps.apellido_paterno        AS personal_apellido,
        (
          6371 * ACOS(
            LEAST(1.0,
              COS(RADIANS(:novedad_lat)) * COS(RADIANS(tv.lat)) *
              COS(RADIANS(tv.lng) - RADIANS(:novedad_lng)) +
              SIN(RADIANS(:novedad_lat)) * SIN(RADIANS(tv.lat))
            )
          )
        ) AS distancia_km
      FROM  tracking_vehiculos tv
      JOIN  vehiculos            v  ON v.id  = tv.vehiculo_id
      LEFT  JOIN tipos_vehiculo  tt ON tt.id = v.tipo_id
      LEFT  JOIN personal_seguridad ps ON ps.id = tv.personal_id
      WHERE tv.updated_at > NOW() - INTERVAL 10 MINUTE
        AND tv.activo = 1
      ORDER BY distancia_km ASC
      LIMIT 5
      `,
      {
        replacements: {
          novedad_lat: novedadLat,
          novedad_lng: novedadLng,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // --- Enriquecer con ETA ---
    const resultado = vehiculos.map((v) => {
      const distanciaKm = Math.round(parseFloat(v.distancia_km) * 100) / 100;
      const tiempoMinutos =
        Math.round((distanciaKm / VELOCIDAD_PROMEDIO_KMH) * 60 * 10) / 10;

      return {
        vehiculo_id: v.vehiculo_id,
        placa: v.placa,
        tipo: v.tipo_vehiculo || null,
        distancia_km: distanciaKm,
        tiempo_estimado_minutos: tiempoMinutos,
        lat: parseFloat(v.lat),
        lng: parseFloat(v.lng),
        velocidad: v.velocidad !== null ? parseFloat(v.velocidad) : null,
        ultima_actualizacion: v.updated_at,
        personal: v.personal_id
          ? {
              id: v.personal_id,
              nombre: `${v.personal_nombres || ""} ${v.personal_apellido || ""}`.trim(),
            }
          : null,
      };
    });

    return res.status(200).json(
      formatResponse(
        true,
        `${resultado.length} vehículo(s) cercano(s) encontrado(s)`,
        {
          novedad_id: parseInt(novedadId),
          coordenadas_novedad: { lat: novedadLat, lng: novedadLng },
          vehiculos_cercanos: resultado,
          total: resultado.length,
        }
      )
    );
  } catch (error) {
    logger.error(`❌ [TRACKING] getVehiculosCercanos: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json(
      formatErrorResponse("Error al calcular los vehículos cercanos", {
        error: error.message,
      })
    );
  }
};
