/**
 * ============================================
 * MODELO: HISTORIAL DE ESTADOS DE NOVEDAD
 * ============================================
 *
 * Registra todos los cambios de estado de una novedad
 * para tener trazabilidad completa
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HistorialEstadoNovedad = sequelize.define(
  "HistorialEstadoNovedad",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    novedad_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "ID de la novedad",
      references: {
        model: "novedades",
        key: "id",
      },
    },

    estado_anterior_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "ID del estado anterior",
      references: {
        model: "estados_novedad",
        key: "id",
      },
    },

    estado_nuevo_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "ID del nuevo estado",
      references: {
        model: "estados_novedad",
        key: "id",
      },
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Motivo o comentario del cambio de estado",
    },

    cambiado_por: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "Usuario que realizó el cambio",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    fecha_cambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora del cambio",
    },
  },
  {
    tableName: "historial_estados_novedad",
    timestamps: false,
    indexes: [
      {
        name: "idx_novedad",
        fields: ["novedad_id"],
      },
      {
        name: "idx_fecha",
        fields: ["fecha_cambio"],
      },
    ],
    comment: "Historial de cambios de estado de novedades",
  }
);

export default HistorialEstadoNovedad;
