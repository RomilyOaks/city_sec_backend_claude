import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OperativosVehiculosNovedades = sequelize.define(
  "OperativosVehiculosNovedades",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    operativo_vehiculo_cuadrante_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "operativos_vehiculos_cuadrantes",
        key: "id",
      },
    },
    novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "novedades",
        key: "id",
      },
    },
    reportado: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    atendido: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora de atención (DATETIME en BD)",
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
      comment: "1: Activo, 0: Inactivo, 2: Atendido",
    },
    prioridad: {
      type: DataTypes.ENUM("BAJA", "MEDIA", "ALTA", "URGENTE"),
      allowNull: false,
      defaultValue: "MEDIA",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    acciones_tomadas: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción de las acciones realizadas para atender la novedad",
    },
    resultado: {
      type: DataTypes.ENUM("PENDIENTE", "RESUELTO", "ESCALADO", "CANCELADO"),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "operativos_vehiculos_novedades",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    underscored: false,
    sync: { force: false, alter: false },
  }
);

export default OperativosVehiculosNovedades;

// NOTA: Las asociaciones se definen en src/models/index.js para evitar
// duplicación y errores de alias. La asociación equivalentePersonal se agregó allí.
