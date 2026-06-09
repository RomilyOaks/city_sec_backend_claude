/**
 * ============================================
 * MODELO: REPORTE CIUDADANO
 * Ruta: src/models/ReporteCiudadano.js
 * ============================================
 * Reportes de incidentes enviados por ciudadanos desde la app móvil.
 * Tabla renombrada de citysecure.reportes → citysecure.reportes_ciudadano
 * (SPEC-ABSORCION-ALERT-001, Fase 2).
 *
 * novedad_sync_status: pending | linked | failed
 * voice_log_id: FK lógica a citysecure.api_call_log (sin constraint formal)
 */

import { DataTypes } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

const ReporteCiudadano = sequelize.define(
  "ReporteCiudadano",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tipo_reporte: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitud: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    longitud: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    audio_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    foto_1_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    foto_2_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    novedad_linked_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    novedad_linked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    novedad_sync_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "pending",
    },
    novedad_sync_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    novedad_priority_override: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    novedad_operator_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    voice_log_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "reportes_ciudadano",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,
  }
);

// Asociaciones definidas en src/models/index.js

export default ReporteCiudadano;
