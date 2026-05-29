/**
 * ===================================================
 * MODELO: TrackingHistorial
 * ===================================================
 *
 * Ruta: src/models/TrackingHistorial.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-05-27
 *
 * Descripción:
 * Historial completo de posiciones GPS de los vehículos de
 * patrullaje. Cada fila representa un punto en la ruta recorrida,
 * lo que permite reconstruir el trayecto de un turno completo.
 *
 * VOLUMEN ESTIMADO:
 * - Envío cada 10s en movimiento + cada 30s detenido.
 * - ~5.760 registros/día por vehículo (estimado conservador).
 * - Con 10 unidades: ~57.600 reg/día → ~1.7M en 30 días.
 *
 * POLÍTICA DE RETENCIÓN:
 * Purgar registros con registrado_at > 30 días.
 * Ver script de purga en migrations/003_tracking_tables_mysql.sql.
 *
 * Diferencia de timestamps:
 * - registrado_at: timestamp del DISPOSITIVO (puede llegar con retraso)
 * - created_at:    timestamp del SERVIDOR (cuando se recibió el dato)
 *
 * Relaciones:
 * - belongsTo → Vehiculo (vehiculo_id)
 *
 * @module models/TrackingHistorial
 * @requires sequelize
 * @version 1.0.0
 * @date 2026-05-27
 */

import { DataTypes, Model } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

class TrackingHistorial extends Model {
  // Asociaciones definidas en src/models/index.js (sección TRACKING GPS v2.2.3)
}

TrackingHistorial.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: "PK BIGINT — tabla de alto volumen de inserción",
    },

    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "vehiculos",
        key: "id",
      },
      comment: "FK a vehiculos.id",
    },

    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: "Latitud GPS en este punto de la ruta",
    },

    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: "Longitud GPS en este punto de la ruta",
    },

    velocidad: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: "Velocidad en km/h en este punto de la ruta",
    },

    registrado_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Timestamp del DISPOSITIVO — puede diferir del servidor por latencia de red",
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Timestamp del SERVIDOR — cuando se recibió y procesó el dato",
    },
  },
  {
    sequelize,
    modelName: "TrackingHistorial",
    tableName: "tracking_historial",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // Solo INSERT — los registros históricos nunca se modifican
    indexes: [
      {
        // Consulta principal: GET /tracking/vehiculo/:id/ruta
        // WHERE vehiculo_id = ? AND registrado_at BETWEEN ? AND ? ORDER BY registrado_at ASC
        name: "idx_historial_vehiculo_tiempo",
        fields: ["vehiculo_id", "registrado_at"],
      },
      {
        // Purga eficiente: DELETE WHERE registrado_at < NOW() - INTERVAL 30 DAY
        name: "idx_historial_registrado_at",
        fields: ["registrado_at"],
      },
    ],
  }
);

export default TrackingHistorial;
