/**
 * Ruta: src/models/UsuarioRoles.js
 * ============================================
 *
 * Definición del Modelo Sequelize para la tabla 'usuario_roles'
 * Esta tabla es una tabla intermedia (many-to-many) entre Usuarios y Roles.
 */

import { DataTypes } from "sequelize";
// Importamos la conexión a la base de datos configurada
import sequelize from "../config/database.js";

const UsuarioRol = sequelize.define(
  "UsuarioRol",
  {
    // === Atributos de la Tabla ===
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: "ID de la asignación de rol (clave primaria)",
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del usuario al que se asigna el rol (FK a Usuarios)",
      // Definimos la relación a nivel de modelo para claridad, aunque se confirma en index.js
      references: {
        model: "usuarios", // Nombre de la tabla referenciada
        key: "id",
      },
      // CONSTRAINT: ON DELETE CASCADE
    },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del rol asignado (FK a Roles)",
      references: {
        model: "roles", // Nombre de la tabla referenciada
        key: "id",
      },
      // CONSTRAINT: ON DELETE CASCADE
    },
    fecha_asignacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora en que se asignó el rol",
    },
    fecha_expiracion: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de expiración para roles temporales",
    },
    asignado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que realizó la asignación (FK a Usuarios)",
      references: {
        model: "usuarios",
        key: "id",
      },
      // CONSTRAINT: ON DELETE SET NULL
    },

    // === Campos de Auditoría y Control de Estado ===
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "Estado del registro: 1 (Activo) / 0 (Inactivo o eliminado)",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Marca de tiempo de creación del registro",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que creó el registro",
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Marca de tiempo de la última actualización",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro por última vez",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Marca de tiempo de eliminación lógica (soft delete)",
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que eliminó el registro lógicamente",
    },
  },
  {
    // === Opciones del Modelo ===
    tableName: "usuario_roles", // Nombre real de la tabla en la base de datos
    timestamps: false, // Desactivamos los timestamps automáticos de Sequelize,
    // ya que estamos manejando created_at y updated_at manualmente (por las constraints)

    // Agregamos índices y claves únicos
    indexes: [
      {
        unique: true,
        fields: ["usuario_id", "rol_id"],
        name: "uq_usuario_rol", // Mantenemos el nombre de la clave única SQL
      },
      {
        fields: ["usuario_id"],
        name: "idx_usuario",
      },
      {
        fields: ["rol_id"],
        name: "idx_rol",
      },
      {
        fields: ["fecha_expiracion"],
        name: "idx_expiracion",
      },
    ],
    comment: "Asignación de roles a usuarios", // Comentario para la tabla
    paranoid: true, // Habilitamos soft-delete (requiere 'deletedAt' field)
    deletedAt: "deleted_at", // Usamos 'deleted_at' para el soft-delete
  }
);

// Exportamos el modelo para poder usarlo en el resto de la aplicación
export default UsuarioRol;
