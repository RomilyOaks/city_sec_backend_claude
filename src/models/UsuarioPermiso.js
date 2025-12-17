import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UsuarioPermiso = sequelize.define(
  "UsuarioPermiso",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permiso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("CONCEDER", "DENEGAR"),
      allowNull: true,
      defaultValue: "CONCEDER",
    },
    fecha_asignacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_expiracion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    asignado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "usuario_permisos",
    timestamps: false,
    underscored: true,
  }
);

export default UsuarioPermiso;
