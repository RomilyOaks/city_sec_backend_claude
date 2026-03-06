/**
 * Modelo: RolEstadoNovedad
 * Tabla: rol_estados_novedad
 *
 * Control de accesos a estados de novedades por roles.
 * Permite definir qué estados puede usar cada rol en el flujo de novedades.
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class RolEstadoNovedad extends Model {}

RolEstadoNovedad.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
    estado_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "estados_novedad", key: "id" },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "usuarios", key: "id" },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "usuarios", key: "id" },
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "usuarios", key: "id" },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "rol_estados_novedad",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,
    indexes: [
      {
        name: "uq_rol_estados_novedad_rol_estado",
        unique: true,
        fields: ["rol_id", "estado_novedad_id"],
      },
      { name: "idx_rol_estados_novedad_rol_id", fields: ["rol_id"] },
      { name: "idx_rol_estados_novedad_estado_novedad_id", fields: ["estado_novedad_id"] },
      { name: "idx_rol_estados_novedad_created_by", fields: ["created_by"] },
      { name: "idx_rol_estados_novedad_updated_by", fields: ["updated_by"] },
      { name: "idx_rol_estados_novedad_deleted_by", fields: ["deleted_by"] },
    ],
  }
);

export default RolEstadoNovedad;
