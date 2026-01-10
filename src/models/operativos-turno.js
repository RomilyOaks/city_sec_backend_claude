import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OperativosTurno = sequelize.define(
  "OperativosTurno",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    turno: {
      type: DataTypes.ENUM("MAÑANA", "TARDE", "NOCHE"),
      allowNull: false,
      defaultValue: "MAÑANA",
    },
    fecha_hora_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_hora_fin: {
      type: DataTypes.DATE,
    },
    operador_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    supervisor_id: {
      type: DataTypes.INTEGER,
    },
    observaciones: {
      type: DataTypes.TEXT,
    },
    estado: {
      type: DataTypes.ENUM("ACTIVO", "CERRADO", "ANULADO"),
      allowNull: false,
      defaultValue: "ACTIVO",
    },
    estado_registro: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: "1=Activo, 0=Eliminado",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Usuario que crea el registro",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.INTEGER,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
    },
    deleted_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "operativos_turno",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["fecha", "turno", "sector_id"],
        name: "uq_fecha_turno_sector",
      },
      {
        fields: ["fecha", "turno"],
        name: "idx_fecha_turno",
      },
      {
        fields: ["operador_id"],
        name: "idx_operador",
      },
      {
        fields: ["sector_id"],
        name: "idx_sector",
      },
      {
        fields: ["supervisor_id"],
        name: "idx_supervisor",
      },
      {
        fields: ["estado"],
        name: "idx_estado",
      },
    ],
    comment: "Cabecera de turnos de patrullaje",
  }
);

export default OperativosTurno;
