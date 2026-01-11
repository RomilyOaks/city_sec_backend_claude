/**
 * ===================================================
 * MODELO: TipoCopiloto
 * ===================================================
 *
 * Ruta: src/models/TipoCopiloto.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'tipos_copiloto'.
 * Define los tipos de copiloto que pueden acompañar en patrullaje.
 * Ejemplos: SERENO, PNP, BOMBERO, SERENAZGO_PRACTICANTE
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TipoCopiloto = sequelize.define(
  "TipoCopiloto",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: "Código único del tipo (ej: SER, PNP, BOM)",
    },
    descripcion: {
      type: DataTypes.STRING(35),
      allowNull: false,
      comment: "Descripción del tipo de copiloto",
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1 = Activo, 0 = Inactivo",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tipos_copiloto",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    hooks: {
      beforeDestroy: async (tipoCopiloto, options) => {
        if (options.userId) {
          tipoCopiloto.deleted_by = options.userId;
        }
        tipoCopiloto.estado = 0;
      },
    },
  }
);

export default TipoCopiloto;
