/**
 * ===================================================
 * MODELO: Radio TETRA
 * ===================================================
 *
 * Ruta: src/models/RadioTetra.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-06
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'radios_tetra'.
 * Gestiona el inventario de radios TETRA de comunicaciones
 * del personal de seguridad ciudadana.
 *
 * Características:
 * - Código único de radio
 * - Asignación a personal de seguridad
 * - Fecha de fabricación
 * - Estado activo/inactivo
 * - Soft delete con auditoría completa
 *
 * @module models/RadioTetra
 * @requires sequelize
 * @version 1.0.0
 * @date 2026-01-06
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RadioTetra = sequelize.define(
  "RadioTetra",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del radio",
    },

    // Código único del radio
    radio_tetra_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: {
        msg: "El código de radio ya existe",
      },
      field: "radio_tetra_code",
      comment: "Código único del radio TETRA",
      validate: {
        len: {
          args: [1, 10],
          msg: "El código debe tener entre 1 y 10 caracteres",
        },
      },
    },

    // Descripción del radio
    descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "descripcion",
      comment: "Descripción o modelo del radio",
      validate: {
        len: {
          args: [0, 50],
          msg: "La descripción no puede exceder 50 caracteres",
        },
      },
    },

    // Personal asignado
    personal_seguridad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "personal_seguridad_id",
      comment: "ID del personal de seguridad asignado",
      references: {
        model: "personal_seguridad",
        key: "id",
      },
    },

    // Fecha de fabricación
    fecha_fabricacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_fabricacion",
      comment: "Fecha de fabricación del radio",
    },

    // Estado del radio
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: "estado",
      comment: "1=Activo | 0=Inactivo",
    },

    // Auditoría
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by",
      comment: "ID del usuario que creó el registro",
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "updated_by",
      comment: "ID del usuario que actualizó el registro",
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "deleted_by",
      comment: "ID del usuario que eliminó el registro",
    },
  },
  {
    tableName: "radios_tetra",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",

    // Índices
    indexes: [
      {
        unique: true,
        fields: ["radio_tetra_code"],
      },
      {
        name: "idx_personal_asignado",
        fields: ["personal_seguridad_id"],
      },
      {
        fields: ["estado"],
      },
    ],
  }
);

/**
 * Métodos estáticos
 */

/**
 * Buscar radios activos
 */
RadioTetra.findActivos = async function () {
  return await RadioTetra.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    order: [["radio_tetra_code", "ASC"]],
  });
};

/**
 * Buscar radios disponibles (sin asignar)
 */
RadioTetra.findDisponibles = async function () {
  return await RadioTetra.findAll({
    where: {
      personal_seguridad_id: null,
      estado: true,
      deleted_at: null,
    },
    order: [["radio_tetra_code", "ASC"]],
  });
};

/**
 * Buscar radios asignados a personal
 */
RadioTetra.findAsignados = async function () {
  return await RadioTetra.findAll({
    where: {
      personal_seguridad_id: {
        [sequelize.Sequelize.Op.ne]: null,
      },
      deleted_at: null,
    },
    include: [
      {
        association: "personalAsignado",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
      },
    ],
    order: [["radio_tetra_code", "ASC"]],
  });
};

/**
 * Buscar por código
 */
RadioTetra.findByCode = async function (code) {
  return await RadioTetra.findOne({
    where: {
      radio_tetra_code: code,
      deleted_at: null,
    },
  });
};

/**
 * Métodos de instancia
 */

/**
 * Asignar radio a personal
 */
RadioTetra.prototype.asignarAPersonal = async function (personalId, userId) {
  this.personal_seguridad_id = personalId;
  this.updated_by = userId;
  await this.save();
};

/**
 * Desasignar radio
 */
RadioTetra.prototype.desasignar = async function (userId) {
  this.personal_seguridad_id = null;
  this.updated_by = userId;
  await this.save();
};

/**
 * Activar radio
 */
RadioTetra.prototype.activar = async function (userId) {
  this.estado = true;
  this.updated_by = userId;
  await this.save();
};

/**
 * Desactivar radio
 */
RadioTetra.prototype.desactivar = async function (userId) {
  this.estado = false;
  this.updated_by = userId;
  await this.save();
};

/**
 * Soft delete
 */
RadioTetra.prototype.softDelete = async function (userId) {
  this.deleted_by = userId;
  this.estado = false;
  await this.save();
  await this.destroy(); // Activa el paranoid
};

export default RadioTetra;
