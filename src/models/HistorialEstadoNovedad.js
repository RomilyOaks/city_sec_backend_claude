/**
 * ============================================
 * MODELO: src/models/HistorialEstadoNovedad.js
 * ============================================
 * * Modelo de Historial de Estados de Novedades
 */

import { DataTypes } from "sequelize";
// Importar la instancia de Sequelize configurada
import sequelize from "../config/database.js";

const HistorialEstadoNovedad = sequelize.define(
  "HistorialEstadoNovedad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID de la novedad",
    },
    estado_anterior_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Estado anterior de la novedad",
    },
    estado_nuevo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Nuevo estado de la novedad",
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Usuario que realizó el cambio",
    },
    tiempo_en_estado_min: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Tiempo que estuvo en el estado anterior (minutos)",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones del cambio de estado",
    },
    fecha_cambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora del cambio",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment:
        "Datos adicionales del cambio (ubicación, datos complementarios)",
    },
    // NOTA: Se eliminan las 'references' aquí porque las asociaciones se manejan en index.js
    // Esto es estándar en configuraciones centralizadas de Sequelize.
  },
  {
    tableName: "historial_estado_novedades",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
    // ... otros ajustes
  }
);

// NOTA: Se elimina la función HistorialEstadoNovedad.associate = (models) => { ... }
// Si la usas de forma centralizada en index.js.
// Si quisieras mantener la asociación aquí, deberías usar un hook afterDefine o similar.
// Para mantener el index.js limpio, dejaremos las asociaciones en el index.

export default HistorialEstadoNovedad; // Exporta el MODELO, no la FUNCIÓN
