import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HistorialDesperfectosVehiculo = sequelize.define(
  "HistorialDesperfectosVehiculo",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
    desperfecto_id: { type: DataTypes.INTEGER, allowNull: false },
    mantenimiento_id: { type: DataTypes.BIGINT, allowNull: true },
    fecha_reporte: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_resolucion: { type: DataTypes.DATE, allowNull: true },
    estado: {
      type: DataTypes.ENUM("REPORTADO", "EN_REPARACION", "RESUELTO", "CANCELADO"),
      defaultValue: "REPORTADO",
    },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    prioridad_reparacion: {
      type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
      defaultValue: "MEDIA",
    },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    updated_by: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "historial_desperfectos_vehiculo",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default HistorialDesperfectosVehiculo;
