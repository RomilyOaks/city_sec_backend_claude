import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Sesion = sequelize.define(
  "Sesion",
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
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    device_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    device_type: {
      type: DataTypes.ENUM("DESKTOP", "MOBILE", "TABLET", "OTHER"),
      allowNull: true,
      defaultValue: "OTHER",
    },
    browser: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    os: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    location_country: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    location_city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_activity: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_current: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "sesiones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

export default Sesion;
