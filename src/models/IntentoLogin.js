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

const IntentoLogin = sequelize.define(
  "IntentoLogin",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "ID del usuario (null si el usuario no existe)",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    username_intento: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Username o email usado en el intento",
    },

    exitoso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica si el login fue exitoso",
    },

    motivo_fallo: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment:
        "Razón del fallo (credenciales incorrectas, usuario bloqueado, etc.)",
    },

    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
      comment: "Dirección IP del intento",
    },

    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "User agent del navegador",
    },

    ubicacion_geografica: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Ubicación geográfica estimada (ciudad, país)",
    },

    dispositivo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Tipo de dispositivo (PC, móvil, tablet)",
    },

    navegador: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Navegador usado",
    },

    sistema_operativo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Sistema operativo",
    },

    metodo_autenticacion: {
      type: DataTypes.ENUM(
        "password",
        "oauth_google",
        "oauth_microsoft",
        "2fa"
      ),
      allowNull: false,
      defaultValue: "password",
      comment: "Método de autenticación usado",
    },

    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora del intento",
    },
  },
  {
    tableName: "intentos_login",
    timestamps: false,
    indexes: [
      {
        name: "idx_usuario",
        fields: ["usuario_id"],
      },
      {
        name: "idx_ip",
        fields: ["ip_address"],
      },
      {
        name: "idx_exitoso",
        fields: ["exitoso"],
      },
      {
        name: "idx_fecha",
        fields: ["fecha_hora"],
      },
    ],
    comment: "Registro de intentos de inicio de sesión para seguridad",
  }
);

export default IntentoLogin;
