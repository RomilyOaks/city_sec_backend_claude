/**
 * ===================================================
 * MODELO: OperativosVehiculosCuadrantes
 * ===================================================
 *
 * Ruta: src/models/OperativosVehiculosCuadrantes.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'operativos_vehiculos_cuadrantes' de la base de datos.
 * Gestiona los cuadrantes que los vehículos realizan el patrullaje dentro de un turno.
 *
 * Relaciones:
 * - Pertenece a un OperativosVehiculos (Many-to-One)
 * - Pertenece a un Cuadrante (Many-to-One)
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class OperativosVehiculosCuadrantes extends Model {
  static associate(models) {
    OperativosVehiculosCuadrantes.belongsTo(models.OperativosVehiculos, {
      foreignKey: "operativo_vehiculo_id",
      as: "operativoVehiculo",
    });

    OperativosVehiculosCuadrantes.belongsTo(models.Cuadrante, {
      foreignKey: "cuadrante_id",
      as: "datosCuadrante",
    });

    // Asociaciones de auditoría
    OperativosVehiculosCuadrantes.belongsTo(models.Usuario, {
      foreignKey: "created_by",
      as: "creador",
    });
    OperativosVehiculosCuadrantes.belongsTo(models.Usuario, {
      foreignKey: "updated_by",
      as: "actualizador",
    });
    OperativosVehiculosCuadrantes.belongsTo(models.Usuario, {
      foreignKey: "deleted_by",
      as: "eliminador",
    });
  }
}

OperativosVehiculosCuadrantes.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    operativo_vehiculo_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "operativos_vehiculos",
        key: "id",
      },
    },
    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cuadrantes",
        key: "id",
      },
    },
    hora_ingreso: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    hora_salida: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    incidentes_reportados: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tiempo_minutos: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.hora_salida && this.hora_ingreso) {
          const diff =
            new Date(this.hora_salida).getTime() -
            new Date(this.hora_ingreso).getTime();
          return Math.floor(diff / (1000 * 60));
        }
        return null;
      },
    },
    estado_registro: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "OperativosVehiculosCuadrantes",
    tableName: "operativos_vehiculos_cuadrantes",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      {
        unique: true,
        fields: ["operativo_vehiculo_id", "cuadrante_id", "hora_ingreso"],
        name: "uq_vehiculo_cuadrante_hora",
      },
      {
        fields: ["operativo_vehiculo_id"],
        name: "idx_operativo_vehiculo",
      },
      {
        fields: ["cuadrante_id"],
        name: "idx_cuadrante",
      },
      {
        fields: ["hora_ingreso"],
        name: "idx_hora_ingreso",
      },
    ],
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_at = new Date();
      },
    },
  }
);

export default OperativosVehiculosCuadrantes;
