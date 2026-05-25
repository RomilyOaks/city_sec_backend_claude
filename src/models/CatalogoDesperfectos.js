import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const CatalogoDesperfectos = sequelize.define(
  "CatalogoDesperfectos",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    categoria: { type: DataTypes.STRING(50), allowNull: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "catalogo_desperfectos",
    timestamps: false,
  }
);

export default CatalogoDesperfectos;
