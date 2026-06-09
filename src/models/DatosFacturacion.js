import { DataTypes } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

const DatosFacturacion = sequelize.define(
  "DatosFacturacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    razon_social: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    ruc: {
      type: DataTypes.STRING(11),
      allowNull: false,
    },
    direccion_fiscal: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    ubigeo: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    email_facturacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    representante_legal: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    cargo_representante: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "datos_facturacion",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default DatosFacturacion;
