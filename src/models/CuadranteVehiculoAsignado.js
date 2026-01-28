/**
 * File: src/models/CuadranteVehiculoAsignado.js
 * @version 1.0.0
 * @description Modelo Sequelize para asignación de vehículos a cuadrantes
 *
 * Relaciones:
 * - CuadranteVehiculoAsignado → Cuadrante (belongsTo)
 * - CuadranteVehiculoAsignado → Vehiculo (belongsTo)
 * - CuadranteVehiculoAsignado → Usuario (auditoría)
 *
 * @module src/models/CuadranteVehiculoAsignado.js
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Cuadrante from "./Cuadrante.js";
import Vehiculo from "./Vehiculo.js";
import Usuario from "./Usuario.js";

/**
 * Modelo CuadranteVehiculoAsignado
 * @class
 */
const CuadranteVehiculoAsignado = sequelize.define(
  "CuadranteVehiculoAsignado",
  {
    // ID primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: "ID único de la asignación",
    },

    // Cuadrante asignado
    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cuadrante_id",
      comment: "ID del cuadrante asignado",
      references: {
        model: "cuadrantes",
        key: "id",
      },
    },

    // Vehículo asignado
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "vehiculo_id",
      comment: "ID del vehículo asignado",
      references: {
        model: "vehiculos",
        key: "id",
      },
    },

    // Observaciones de la asignación
    observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "observaciones",
      comment: "Observaciones de la asignación",
      validate: {
        len: {
          args: [0, 500],
          msg: "Las observaciones no pueden exceder 500 caracteres",
        },
      },
    },

    // Estado de la asignación
    estado: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
      field: "estado",
      comment: "1=ACTIVO, 0=INACTIVO",
      validate: {
        isIn: {
          args: [[0, 1]],
          msg: "El estado debe ser 0 (INACTIVO) o 1 (ACTIVO)",
        },
      },
    },

    // Auditoría - Creación
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
      comment: "ID del usuario que creó la asignación",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    // Auditoría - Actualización
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "updated_by",
      comment: "ID del usuario que actualizó la asignación",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    // Auditoría - Eliminación
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "deleted_by",
      comment: "ID del usuario que eliminó la asignación",
      references: {
        model: "usuarios",
        key: "id",
      },
    },
  },
  {
    tableName: "cuadrantes_vehiculo_asignado",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",

    // Índices
    indexes: [
      {
        unique: true,
        fields: ["cuadrante_id", "vehiculo_id"],
        name: "uq_cuadrante_vehiculo",
      },
      {
        name: "idx_cuadrante",
        fields: ["cuadrante_id"],
      },
      {
        name: "idx_vehiculo",
        fields: ["vehiculo_id"],
      },
      {
        fields: ["estado"],
      },
    ],

    // Configuración adicional
    charset: "utf8mb4",
    collate: "utf8mb4_0900_ai_ci",
    comment: "Asignación de vehículos a cuadrantes específicos",
  }
);

/**
 * Métodos estáticos
 */

/**
 * Buscar asignaciones activas
 */
CuadranteVehiculoAsignado.findActivos = async function () {
  return await CuadranteVehiculoAsignado.findAll({
    where: {
      estado: 1,
      deleted_at: null,
    },
    include: [
      {
        association: "cuadrante",
        attributes: ["id", "nombre", "codigo"],
      },
      {
        association: "vehiculo",
        attributes: ["id", "placa", "marca", "modelo"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/**
 * Buscar asignaciones por cuadrante
 */
CuadranteVehiculoAsignado.findByCuadrante = async function (cuadranteId) {
  return await CuadranteVehiculoAsignado.findAll({
    where: {
      cuadrante_id: cuadranteId,
      deleted_at: null,
    },
    include: [
      {
        association: "cuadrante",
        attributes: ["id", "nombre", "codigo"],
      },
      {
        association: "vehiculo",
        attributes: ["id", "placa", "marca", "modelo"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/**
 * Buscar asignaciones por vehículo
 */
CuadranteVehiculoAsignado.findByVehiculo = async function (vehiculoId) {
  return await CuadranteVehiculoAsignado.findAll({
    where: {
      vehiculo_id: vehiculoId,
      deleted_at: null,
    },
    include: [
      {
        association: "cuadrante",
        attributes: ["id", "nombre", "codigo"],
      },
      {
        association: "vehiculo",
        attributes: ["id", "placa", "marca", "modelo"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/**
 * Verificar si existe asignación (para validación de unique constraint)
 */
CuadranteVehiculoAsignado.existeAsignacion = async function (cuadranteId, vehiculoId, excludeId = null) {
  const whereClause = {
    cuadrante_id: cuadranteId,
    vehiculo_id: vehiculoId,
    deleted_at: null,
  };

  if (excludeId) {
    whereClause.id = { [sequelize.Sequelize.Op.ne]: excludeId };
  }

  const asignacion = await CuadranteVehiculoAsignado.findOne({
    where: whereClause,
  });

  return !!asignacion;
};

/**
 * Métodos de instancia
 */

/**
 * Activar asignación
 */
CuadranteVehiculoAsignado.prototype.activar = async function (userId) {
  this.estado = 1;
  this.updated_by = userId;
  await this.save();
};

/**
 * Desactivar asignación
 */
CuadranteVehiculoAsignado.prototype.desactivar = async function (userId) {
  this.estado = 0;
  this.updated_by = userId;
  await this.save();
};

/**
 * Soft delete
 */
CuadranteVehiculoAsignado.prototype.softDelete = async function (userId) {
  this.deleted_by = userId;
  this.estado = 0;
  await this.save();
  await this.destroy(); // Activa el paranoid
};

/**
 * Reactivar asignación (restaurar soft delete)
 */
CuadranteVehiculoAsignado.prototype.reactivar = async function (userId) {
  // Forzar la restauración del soft delete
  await this.restore(); // Método Sequelize para restaurar paranoid
  
  // Asegurar que todos los campos queden limpios
  this.deleted_at = null;
  this.deleted_by = null;
  this.estado = 1;
  this.updated_by = userId;
  
  await this.save();
  
  console.log(`✅ Asignación ${this.id} reactivada por usuario ${userId}:`, {
    deleted_at: this.deleted_at,
    deleted_by: this.deleted_by,
    estado: this.estado,
    updated_by: this.updated_by
  });
};

export default CuadranteVehiculoAsignado;
