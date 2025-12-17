import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TokenAcceso = sequelize.define(
  "TokenAcceso",
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
    token_type: {
      type: DataTypes.ENUM("ACCESS", "REFRESH"),
      allowNull: true,
      defaultValue: "ACCESS",
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    jti: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    client_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    scopes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revoked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    revocation_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "tokens_acceso",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

export default TokenAcceso;
