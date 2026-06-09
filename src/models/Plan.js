import { DataTypes } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

const Plan = sequelize.define(
  "Plan",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio_base_mensual: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    moneda: {
      type: DataTypes.ENUM("PEN", "USD"),
      allowNull: false,
      defaultValue: "PEN",
    },
    max_usuarios: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "NULL = ilimitado",
    },
    max_novedades_mes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "NULL = ilimitado",
    },
    precio_usuario_extra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    precio_novedad_extra_100: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue("features");
        return raw ? JSON.parse(raw) : null;
      },
      set(val) {
        this.setDataValue("features", val ? JSON.stringify(val) : null);
      },
    },
    activo: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1=Activo | 0=Inactivo",
    },
  },
  {
    tableName: "planes",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Plan;
