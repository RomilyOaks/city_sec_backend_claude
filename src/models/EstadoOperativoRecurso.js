/**
 * ===================================================
 * MODELO: EstadoOperativoRecurso
 * ===================================================
 *
 * Ruta: src/models/EstadoOperativoRecurso.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'estados_operativo_recurso'.
 * Define los estados operativos de los recursos (vehículos, personal).
 * Ejemplos: DISPONIBLE, EN_PATRULLA, EN_MANTENIMIENTO, FUERA_DE_SERVICIO
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EstadoOperativoRecurso = sequelize.define(
  "EstadoOperativoRecurso",
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
      comment: "Código único del estado (ej: DISP, PATR, MANT)",
    },
    descripcion: {
      type: DataTypes.STRING(35),
      allowNull: false,
      comment: "Descripción del estado operativo",
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: true,
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
    tableName: "estados_operativo_recurso",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    hooks: {
      beforeDestroy: async (estadoOperativo, options) => {
        if (options.userId) {
          estadoOperativo.deleted_by = options.userId;
        }
        estadoOperativo.estado = 0;
      },
    },
  }
);

export default EstadoOperativoRecurso;
