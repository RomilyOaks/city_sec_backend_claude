/**
 * ===================================================
 * MODELO: OperativosVehiculos
 * ===================================================
 *
 * Ruta: src/models/operativos-vehiculos.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'operativos_vehiculos' de la base de datos.
 * Gestiona los vehículos asignados a los patrullajes por turno.
 *
 * Relaciones:
 * - Pertenece a un OperativosTurno (Many-to-One)
 * - Pertenece a un Vehiculo (Many-to-One)
 * - Pertenece a un PersonalSeguridad (conductor) (Many-to-One)
 * - Pertenece a un PersonalSeguridad (copiloto) (Many-to-One)
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class OperativosVehiculos extends Model {
  static associate(models) {
    OperativosVehiculos.belongsTo(models.OperativosTurno, {
      foreignKey: "operativo_turno_id",
      as: "turno",
    });

    OperativosVehiculos.belongsTo(models.Vehiculo, {
      foreignKey: "vehiculo_id",
      as: "vehiculo",
    });

    OperativosVehiculos.belongsTo(models.PersonalSeguridad, {
      foreignKey: "conductor_id",
      as: "conductor",
    });

    OperativosVehiculos.belongsTo(models.PersonalSeguridad, {
      foreignKey: "copiloto_id",
      as: "copiloto",
    });

    OperativosVehiculos.hasMany(models.OperativosVehiculosCuadrantes, {
      foreignKey: "operativo_vehiculo_id",
      as: "cuadrantesAsignados",
    });

    // Relaciones de auditoría
    OperativosVehiculos.belongsTo(models.Usuario, {
      foreignKey: "created_by",
      as: "creador",
    });

    OperativosVehiculos.belongsTo(models.Usuario, {
      foreignKey: "updated_by",
      as: "actualizador",
    });

    OperativosVehiculos.belongsTo(models.Usuario, {
      foreignKey: "deleted_by",
      as: "eliminador",
    });

    // Relación con TipoCopiloto
    OperativosVehiculos.belongsTo(models.TipoCopiloto, {
      foreignKey: "tipo_copiloto_id",
      as: "tipo_copiloto",
    });

    // Relación con RadioTetra
    OperativosVehiculos.belongsTo(models.RadioTetra, {
      foreignKey: "radio_tetra_id",
      as: "radio_tetra",
    });

    // Relación con EstadoOperativoRecurso
    OperativosVehiculos.belongsTo(models.EstadoOperativoRecurso, {
      foreignKey: "estado_operativo_id",
      as: "estado_operativo",
    });

    // NOTA: La relación con OperativosVehiculosNovedades es indirecta:
    // OperativosVehiculos → OperativosVehiculosCuadrantes → OperativosVehiculosNovedades
    // No existe una FK directa vehiculo_id en OperativosVehiculosNovedades
  }
}

OperativosVehiculos.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    operativo_turno_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "operativos_turno",
        key: "id",
      },
    },
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "vehiculos",
        key: "id",
      },
    },
    conductor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
      comment: "Puede ser NULL (vehículo sin conductor)",
    },
    copiloto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
    },
    tipo_copiloto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: { model: 'tipos_copiloto', key: 'id' }
    },
    radio_tetra_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: { model: 'radios_tetra', key: 'id' }
    },
    estado_operativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references: { model: 'estados_operativo_recurso', key: 'id' },
      comment: "Ej: DISPONIBLE, EN_PATRULLA, EN_MANTENIMIENTO",
    },
    kilometraje_inicio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    nivel_combustible_inicio: {
      type: DataTypes.ENUM("LLENO", "3/4", "1/2", "1/4", "RESERVA"),
      allowNull: true,
    },
    kilometraje_recarga: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hora_recarga: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    combustible_litros: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    importe_recarga: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    nivel_combustible_recarga: {
      type: DataTypes.ENUM("LLENO", "3/4", "1/2", "1/4", "RESERVA"),
      allowNull: true,
    },
    kilometraje_fin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hora_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nivel_combustible_fin: {
      type: DataTypes.ENUM("LLENO", "3/4", "1/2", "1/4", "RESERVA"),
      allowNull: true,
    },
    kilometros_recorridos: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.kilometraje_fin !== null && this.kilometraje_inicio !== null) {
          return this.kilometraje_fin - this.kilometraje_inicio;
        }
        return null;
      },
    },
    observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    modelName: "OperativosVehiculos",
    tableName: "operativos_vehiculos",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
      {
        unique: true,
        fields: ["operativo_turno_id", "conductor_id"],
        name: "uq_turno_conductor",
        comment: "Un conductor solo puede estar en un vehículo por turno",
      },
    ],
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_at = new Date();
      },
      beforeDestroy: async (vehiculo, options) => {
        if (options.userId) {
          vehiculo.deleted_by = options.userId;
        }
        vehiculo.estado_registro = 0;
      },
    },
  }
);

export default OperativosVehiculos;
