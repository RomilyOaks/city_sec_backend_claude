/**
 * ============================================
 * MODELO: INTENTOS DE LOGIN
 * ============================================
 *
 * Registra todos los intentos de inicio de sesión (exitosos y fallidos)
 * para seguridad y análisis
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// CORRECCIÓN: Usar el nombre de modelo singularizado
const LoginIntento = sequelize.define(
  "LoginIntento",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    username_or_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Username o email usado en el intento",
    },

    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
      comment: "Dirección IP del intento",
    },

    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "User agent del navegador",
    },

    intento_exitoso: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
      comment: "Indica si el login fue exitoso",
    },

    razon_fallo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment:
        "Razón del fallo (credenciales incorrectas, usuario bloqueado, etc.)",
    },
  },
  {
    tableName: "login_intentos",

    timestamps: true,
    updatedAt: false,
    createdAt: "created_at",
    underscored: true,

    indexes: [
      { name: "idx_username", fields: ["username_or_email"] },
      { name: "idx_ip", fields: ["ip_address"] },
      { name: "idx_exitoso", fields: ["intento_exitoso"] },
      { name: "idx_created_at", fields: ["created_at"] },
    ],
    comment: "Registro de intentos de inicio de sesión para seguridad",
  }
);

export default LoginIntento;
