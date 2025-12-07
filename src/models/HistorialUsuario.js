/**
 * ============================================
 * MODELO: HISTORIAL DE USUARIOS
 * Ruta: src/models/HistorialUsuario.js
 * ============================================
 *
 * Registra todos los cambios realizados en usuarios
 * para auditoría y trazabilidad
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HistorialUsuario = sequelize.define(
  "HistorialUsuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del usuario modificado",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    accion: {
      type: DataTypes.ENUM(
        "creacion",
        "actualizacion",
        "cambio_password",
        "cambio_estado",
        "asignacion_rol",
        "revocacion_rol",
        "asignacion_permiso",
        "revocacion_permiso",
        "eliminacion",
        "restauracion"
      ),
      allowNull: false,
      comment: "Tipo de acción realizada",
    },

    campo_modificado: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Campo que fue modificado",
    },

    valor_anterior: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Valor antes del cambio (JSON)",
    },

    valor_nuevo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Valor después del cambio (JSON)",
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada del cambio",
    },

    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "Dirección IP desde donde se realizó el cambio",
    },

    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "User agent del navegador",
    },

    realizado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Usuario que realizó el cambio",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora del cambio",
    },
  },
  {
    tableName: "historial_usuarios",
    timestamps: false,
    indexes: [
      {
        name: "idx_usuario",
        fields: ["usuario_id"],
      },
      {
        name: "idx_accion",
        fields: ["accion"],
      },
      {
        name: "idx_fecha",
        fields: ["fecha_hora"],
      },
      {
        name: "idx_realizado_por",
        fields: ["realizado_por"],
      },
    ],
    comment: "Historial de cambios en usuarios para auditoría",
  }
);

export default HistorialUsuario;
