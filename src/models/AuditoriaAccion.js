/**
 * ============================================
 * MODELO: src/models/AuditoriaAccion.js
 * ============================================
 *
 * Modelo de Auditoría de Acciones
 * Registra todas las acciones importantes del sistema
 * Tabla: auditoria_acciones
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AuditoriaAccion = sequelize.define(
  "AuditoriaAccion",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
      comment: "Usuario que realizó la acción",
    },
    accion: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Acción realizada (ej: login, create_novedad)",
    },
    modulo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Módulo del sistema donde ocurrió la acción",
    },
    entidad_tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Tipo de entidad afectada",
    },
    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID de la entidad afectada",
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada de la acción",
    },
    datos_anteriores: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Estado antes del cambio",
    },
    datos_nuevos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Estado después del cambio",
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "Dirección IP del usuario",
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "User agent del navegador",
    },
    resultado: {
      type: DataTypes.ENUM("EXITO", "FALLO", "DENEGADO", "SUCCESS", "ERROR"),
      defaultValue: "EXITO",
      comment: "Resultado de la operación",
    },
    mensaje_error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Mensaje de error si la operación falló",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Información adicional relevante",
    },
    severidad: {
      type: DataTypes.ENUM("BAJA", "MEDIA", "ALTA", "CRITICA"),
      allowNull: false,
      defaultValue: "BAJA",
      comment: "Nivel de importancia de la acción",
    },
    duracion_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Duración de la operación en milisegundos",
    },
  },
  {
    tableName: "auditoria_acciones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // No se actualiza, solo se crea
    indexes: [
      {
        fields: ["usuario_id"],
        name: "idx_auditoria_usuario",
      },
      {
        fields: ["accion"],
        name: "idx_auditoria_accion",
      },
      {
        fields: ["modulo"],
        name: "idx_auditoria_modulo",
      },
      {
        fields: ["created_at"],
        name: "idx_auditoria_fecha",
      },
      {
        fields: ["resultado"],
        name: "idx_auditoria_resultado",
      },
      {
        fields: ["usuario_id", "created_at"],
        name: "idx_auditoria_usuario_fecha",
      },
      {
        fields: ["entidad_tipo", "entidad_id"],
        name: "idx_auditoria_entidad",
      },
      {
        fields: ["severidad"],
        name: "idx_auditoria_severidad",
      },
    ],
  }
);

/**
 * Método helper para registrar auditoría
 * Simplifica el registro de acciones desde cualquier parte del código
 */
AuditoriaAccion.registrar = async function (datos) {
  try {
    return await this.create({
      usuario_id: datos.usuario_id || null,
      accion: datos.accion,
      modulo: datos.modulo || null,
      entidad_tipo: datos.entidad_tipo || datos.entidad, // Compatibilidad
      entidad_id: datos.entidad_id || null,
      descripcion: datos.descripcion || null,
      datos_anteriores: datos.datos_anteriores || null,
      datos_nuevos: datos.datos_nuevos || null,
      ip_address: datos.ip_address || null,
      user_agent: datos.user_agent || null,
      metadata: datos.metadata || null,
      severidad: datos.severidad || "BAJA",
      resultado: datos.resultado || "EXITO",
      mensaje_error: datos.mensaje_error || datos.error_mensaje || null,
      duracion_ms: datos.duracion_ms || null,
    });
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

export default AuditoriaAccion;
