import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const VehiculoCuadrantesAsignados = sequelize.define(
  "VehiculoCuadrantesAsignados",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Vehiculo", // Referencia al modelo Vehiculo
        key: "id",
      },
    },
    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Cuadrante", // Referencia al modelo Cuadrante
        key: "id",
      },
    },
    observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: "1=ACTIVO, 0=INACTIVO",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Usuario", // Referencia al modelo Usuario
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
        model: "Usuario", // Referencia al modelo Usuario
        key: "id",
      },
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Usuario", // Referencia al modelo Usuario
        key: "id",
      },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "vehiculo_cuadrantes_asignados",
    timestamps: true,
    paranoid: true, // Habilita soft delete
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      {
        unique: true,
        fields: ["vehiculo_id", "cuadrante_id"],
        name: "uq_vehiculo_cuadrante",
      },
    ],
  }
);

VehiculoCuadrantesAsignados.associate = (models) => {
  VehiculoCuadrantesAsignados.belongsTo(models.Vehiculo, {
    foreignKey: "vehiculo_id",
    as: "vehiculo",
  });
  VehiculoCuadrantesAsignados.belongsTo(models.Cuadrante, {
    foreignKey: "cuadrante_id",
    as: "cuadrante",
  });
  VehiculoCuadrantesAsignados.belongsTo(models.Usuario, {
    foreignKey: "created_by",
    as: "creadoPor",
  });
  VehiculoCuadrantesAsignados.belongsTo(models.Usuario, {
    foreignKey: "updated_by",
    as: "actualizadoPor",
  });
  VehiculoCuadrantesAsignados.belongsTo(models.Usuario, {
    foreignKey: "deleted_by",
    as: "eliminadoPor",
  });
};

export default VehiculoCuadrantesAsignados;
