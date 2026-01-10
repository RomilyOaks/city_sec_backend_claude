import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OperativosTurno = sequelize.define(
  "OperativosTurno",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    operador_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "PersonalSeguridad",
        key: "id",
      },
    },
    turno: {
      type: DataTypes.ENUM("MAÑANA", "TARDE", "NOCHE"),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_hora_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_hora_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "PersonalSeguridad",
        key: "id",
      },
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sectores", // Asumo que la tabla se llama 'sectores'
        key: "id",
      },
    },
    estado: {
      type: DataTypes.ENUM("ACTIVO", "CERRADO", "ANULADO"),
      allowNull: false,
      defaultValue: "ACTIVO",
    },
    observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Usuario",
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Usuario",
        key: "id",
      },
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Usuario",
        key: "id",
      },
    },
  },
  {
    tableName: "operativos_turno",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    hooks: {
      beforeDestroy: async (turno, options) => {
        // Asegúrate de que `options.userId` se pase desde el controlador
        if (options.userId) {
          turno.deleted_by = options.userId;
        }
        turno.estado = "ANULADO";
      },
    },
  }
);

export default OperativosTurno;
