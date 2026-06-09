/**
 * ============================================
 * MODELO: CIUDADANO
 * Ruta: src/models/Ciudadano.js
 * ============================================
 * Representa a los ciudadanos registrados en la app móvil city_sec_alert.
 * Migrado desde citysecure_alert.usuarios (SPEC-ABSORCION-ALERT-001, Fase 2).
 *
 * Tabla: citysecure.ciudadanos
 * Auth: Supabase Auth — user_id es el UUID del usuario en auth.users
 */

import { DataTypes } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

const Ciudadano = sequelize.define(
  "Ciudadano",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "ciudadanos",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,
  }
);

// Asociaciones definidas en src/models/index.js

export default Ciudadano;
