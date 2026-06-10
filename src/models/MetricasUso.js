import { DataTypes } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

// La tabla metricas_uso no tiene created_at — solo updated_at con ON UPDATE CURRENT_TIMESTAMP.
const MetricasUso = sequelize.define(
  "MetricasUso",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    suscripcion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    periodo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Primer día del mes: 2026-06-01",
    },
    usuarios_activos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    novedades_creadas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    costo_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    costo_excedente_usuarios: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    costo_excedente_novedades: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    costo_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    moneda: {
      type: DataTypes.ENUM("PEN", "USD"),
      allowNull: false,
      defaultValue: "PEN",
    },
    calculado_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "metricas_uso",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: false,        // la tabla no tiene columna created_at
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["suscripcion_id", "periodo"], name: "uq_metrica_periodo" },
    ],
  }
);

export default MetricasUso;
