import { DataTypes } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

const Suscripcion = sequelize.define(
  "Suscripcion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("trial", "activa", "gracia", "suspendida", "cancelada"),
      allowNull: false,
      defaultValue: "trial",
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "NULL = renovación automática",
    },
    trial_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ciclo_facturacion: {
      type: DataTypes.ENUM("mensual", "anual"),
      allowNull: false,
      defaultValue: "mensual",
    },
    dias_gracia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
    },
  },
  {
    tableName: "suscripciones",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Suscripcion;
