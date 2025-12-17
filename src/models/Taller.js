/**
 * ===================================================
 * MODELO SEQUELIZE: Taller
 * ===================================================
 *
 * Ruta: src/models/Taller.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla `talleres`.
 * Catálogo de talleres/proveedores de mantenimiento vehicular.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Taller = sequelize.define(
  "Taller",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    ruc: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
    },

    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    contacto_nombre: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Taller",
    tableName: "talleres",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,
    indexes: [
      { name: "uq_taller_ruc", unique: true, fields: ["ruc"] },
      { name: "idx_taller_estado", fields: ["estado"] },
      { name: "idx_taller_deleted_at", fields: ["deleted_at"] },
    ],
  }
);

export default Taller;
