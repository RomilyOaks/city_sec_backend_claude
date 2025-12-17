/**
 * ===================================================
 * MODELO SEQUELIZE: MantenimientoVehiculo
 * ===================================================
 *
 * Ruta: src/models/MantenimientoVehiculo.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla `mantenimiento_vehiculos`.
 * Registra mantenimientos/OT por vehículo, con estado de flujo y auditoría.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MantenimientoVehiculo = sequelize.define(
  "MantenimientoVehiculo",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "vehiculos", key: "id" },
    },

    unidad_oficina_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "unidades_oficina", key: "id" },
    },

    taller_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "talleres", key: "id" },
    },

    tipo_mantenimiento: {
      type: DataTypes.ENUM("PREVENTIVO", "CORRECTIVO", "INSPECCION", "OTRO"),
      allowNull: false,
      defaultValue: "OTRO",
    },

    prioridad: {
      type: DataTypes.ENUM("BAJA", "MEDIA", "ALTA", "CRITICA"),
      allowNull: false,
      defaultValue: "MEDIA",
    },

    tipo_documento: {
      type: DataTypes.ENUM(
        "ORDEN_TRABAJO",
        "ORDEN_SERVICIO",
        "FACTURA",
        "BOLETA_VENTAS",
        "OTROS"
      ),
      allowNull: false,
      defaultValue: "OTROS",
    },

    numero_documento: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    estado_mantenimiento: {
      type: DataTypes.ENUM(
        "PROGRAMADO",
        "EN_TALLER",
        "EN_PROCESO",
        "FINALIZADO",
        "CANCELADO"
      ),
      allowNull: false,
      defaultValue: "PROGRAMADO",
    },

    fecha_programada: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    km_registro: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    km_proximo_mantenimiento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    km_actual_al_finalizar: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    descripcion_falla: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    detalle_trabajos: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    costo_mano_obra: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    costo_repuestos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    costo_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    moneda: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "PEN",
    },

    adjuntos: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "usuarios", key: "id" },
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "usuarios", key: "id" },
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "usuarios", key: "id" },
    },
  },
  {
    sequelize,
    modelName: "MantenimientoVehiculo",
    tableName: "mantenimiento_vehiculos",
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,
    indexes: [
      {
        name: "uq_mant_doc_por_vehiculo",
        unique: true,
        fields: ["vehiculo_id", "tipo_documento", "numero_documento"],
      },
      { name: "idx_mant_vehiculo", fields: ["vehiculo_id"] },
      { name: "idx_mant_estado", fields: ["estado_mantenimiento"] },
      { name: "idx_mant_deleted_at", fields: ["deleted_at"] },
    ],
    hooks: {
      beforeValidate: (m) => {
        if (m.numero_documento) {
          m.numero_documento = String(m.numero_documento).toUpperCase().trim();
        }
      },
    },
  }
);

export default MantenimientoVehiculo;
