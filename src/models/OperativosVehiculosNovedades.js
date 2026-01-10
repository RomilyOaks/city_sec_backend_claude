import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OperativosVehiculosNovedades = sequelize.define(
  "OperativosVehiculosNovedades",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    operativo_vehiculo_cuadrante_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "operativos_vehiculos_cuadrantes",
        key: "id",
      },
    },
    novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "novedades",
        key: "id",
      },
    },
    reportado: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "operativos_vehiculos_novedades",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    // Evitar que Sequelize infiera columnas adicionales
    underscored: false,
    // No sincronizar con la base de datos
    sync: { force: false, alter: false },
  }
);

export default OperativosVehiculosNovedades;

OperativosVehiculosNovedades.associate = (models) => {
  // Asociación principal con el cuadrante operativo
  OperativosVehiculosNovedades.belongsTo(models.OperativosVehiculosCuadrantes, {
    foreignKey: "operativo_vehiculo_cuadrante_id",
    as: "cuadranteOperativo",
  });

  // Asociación con la novedad
  OperativosVehiculosNovedades.belongsTo(models.Novedad, {
    foreignKey: "novedad_id",
    as: "novedad",
  });

  // Asociaciones de auditoría
  OperativosVehiculosNovedades.belongsTo(models.Usuario, {
    foreignKey: "created_by",
    as: "creadoPor",
  });
  OperativosVehiculosNovedades.belongsTo(models.Usuario, {
    foreignKey: "updated_by",
    as: "actualizadoPor",
  });
  OperativosVehiculosNovedades.belongsTo(models.Usuario, {
    foreignKey: "deleted_by",
    as: "eliminadoPor",
  });
};
