/**
 * ===================================================
 * MODELO: OperativosVehiculosNovedades
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2026-01-09
 *
 * Descripcion:
 * Modelo para la tabla 'operativos_vehiculos_novedades', que registra las novedades
 * reportadas en cuadrantes específicos por vehículos operativos.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OperativosVehiculosNovedades = sequelize.define(
  "OperativosVehiculosNovedades",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    operativo_vehiculo_cuadrante_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: "Detalle de Operativos-Vehiculos-Cuadrantes",
    },
    novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Enlace con Novedades-Incidentes",
    },
    reportado: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
      comment: "1=ACTIVO, 0=INACTIVO",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
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
      onUpdate: DataTypes.NOW,
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
    tableName: "operativos_vehiculos_novedades",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // Habilitar soft delete
    deletedAt: "deleted_at",
    indexes: [
      {
        name: "uq_cuadrante_novedad",
        fields: ["operativo_vehiculo_cuadrante_id", "novedad_id"],
        unique: true,
      },
      {
        name: "idx_operativo_vehiculo_cuadrante",
        fields: ["operativo_vehiculo_cuadrante_id"],
      },
      { name: "idx_operativo_vehiculo_novedad", fields: ["novedad_id"] },
    ],
  }
);

export default OperativosVehiculosNovedades;
