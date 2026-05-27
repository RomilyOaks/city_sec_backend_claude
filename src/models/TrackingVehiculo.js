/**
 * ===================================================
 * MODELO: TrackingVehiculo
 * ===================================================
 *
 * Ruta: src/models/TrackingVehiculo.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-05-27
 *
 * Descripción:
 * Snapshot de la ÚLTIMA POSICIÓN GPS conocida de cada vehículo
 * de patrullaje. Existe UNA SOLA FILA por vehículo (UNIQUE en
 * vehiculo_id) — siempre se hace UPSERT, nunca INSERT múltiple.
 *
 * Para el historial completo de posiciones usar TrackingHistorial.
 *
 * Esta tabla es el "estado vivo" de la flota: siempre refleja
 * dónde está cada unidad en este preciso momento.
 *
 * Relaciones:
 * - belongsTo → Vehiculo        (vehiculo_id — vehículo que transmite)
 * - belongsTo → PersonalSeguridad (personal_id — conductor activo)
 * - belongsTo → OperativosTurno (operativo_id — turno en curso)
 *
 * @module models/TrackingVehiculo
 * @requires sequelize
 * @version 1.0.0
 * @date 2026-05-27
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class TrackingVehiculo extends Model {
  // Asociaciones definidas en src/models/index.js (sección TRACKING GPS v2.2.3)
}

TrackingVehiculo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del registro de tracking",
    },

    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        name: "uq_tracking_vehiculo_id",
        msg: "Ya existe un registro de tracking para este vehículo",
      },
      references: {
        model: "vehiculos",
        key: "id",
      },
      comment: "FK a vehiculos.id — UNIQUE: una sola posición activa por unidad",
    },

    personal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
      comment: "FK a personal_seguridad.id — conductor activo (NULL si no asignado)",
    },

    operativo_id: {
      type: DataTypes.BIGINT.UNSIGNED, // operativos_turno.id es BIGINT UNSIGNED
      allowNull: true,
      references: {
        model: "operativos_turno",
        key: "id",
      },
      comment: "FK a operativos_turno.id — turno activo (NULL fuera de turno). BIGINT UNSIGNED para coincidir con PK de operativos_turno",
    },

    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: "Latitud GPS — rango válido: -90 a 90",
    },

    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: "Longitud GPS — rango válido: -180 a 180",
    },

    velocidad: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: "Velocidad en km/h reportada por el dispositivo",
    },

    precision_gps: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: "Precisión del GPS en metros (menor valor = más preciso)",
    },

    bateria_dispositivo: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: "Porcentaje de batería del dispositivo móvil (0–100)",
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "true = vehículo en servicio activo y enviando GPS",
    },

    // Nota: updated_at y created_at los gestiona Sequelize automáticamente
    // via timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at'
  },
  {
    sequelize,
    modelName: "TrackingVehiculo",
    tableName: "tracking_vehiculos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        name: "uq_tracking_vehiculo_id",
        fields: ["vehiculo_id"],
      },
      {
        name: "idx_tracking_operativo",
        fields: ["operativo_id"],
      },
      {
        name: "idx_tracking_activo",
        fields: ["activo"],
      },
      {
        // Usado en el filtro: updated_at > NOW() - INTERVAL 10 MINUTE
        name: "idx_tracking_updated_at",
        fields: ["updated_at"],
      },
    ],
  }
);

export default TrackingVehiculo;
