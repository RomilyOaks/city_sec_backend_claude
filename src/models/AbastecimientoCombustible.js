/**
 * ===================================================
 * MODELO SEQUELIZE: AbastecimientoCombustible
 * ===================================================
 *
 * Ruta: src/models/AbastecimientoCombustible.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla `abastecimiento_combustible`.
 * Registra los abastecimientos (cargas) de combustible realizados a los vehículos,
 * incluyendo datos de cantidad, costo, combustible y responsable.
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2025-12-17
 *
 * Características:
 * - Soft delete manual (deleted_at / deleted_by)
 * - Timestamps (created_at / updated_at)
 * - Validaciones básicas a nivel de modelo
 *
 * Relaciones (definidas en src/models/index.js):
 * - belongsTo -> Vehiculo (vehiculo_id)
 * - belongsTo -> PersonalSeguridad (personal_id)
 *
 * @module models/AbastecimientoCombustible
 * @requires sequelize
 * @author Sistema de Seguridad Ciudadana
 * @version 1.0.0
 * @date 2025-12-17
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AbastecimientoCombustible = sequelize.define(
  "AbastecimientoCombustible",
  {
    // ==========================================
    // IDENTIFICADOR PRINCIPAL
    // ==========================================
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del abastecimiento",
    },

    // ==========================================
    // RELACIONES (FOREIGN KEYS)
    // ==========================================
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Vehículo abastecido",
      references: {
        model: "vehiculos",
        key: "id",
      },
    },

    personal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Personal que realizó la carga",
      references: {
        model: "personal_seguridad",
        key: "id",
      },
    },

    // ==========================================
    // DATOS PRINCIPALES DEL ABASTECIMIENTO
    // ==========================================
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Fecha y hora del abastecimiento",
      validate: {
        notNull: { msg: "La fecha_hora es obligatoria" },
        isDate: { msg: "fecha_hora debe ser una fecha válida" },
      },
    },

    tipo_combustible: {
      type: DataTypes.ENUM(
        "GASOLINA_84",
        "GASOLINA_90",
        "GASOLINA_95",
        "GASOLINA_97",
        "DIESEL_B5",
        "DIESEL_B20",
        "GLP",
        "GNV"
      ),
      allowNull: false,
      comment: "Tipo de combustible",
    },

    km_actual: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: "Kilometraje al momento de abastecer",
    },

    cantidad: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      comment: "Cantidad en litros o galones",
    },

    unidad: {
      type: DataTypes.ENUM("LITROS", "GALONES"),
      allowNull: false,
      defaultValue: "LITROS",
      comment: "Unidad de la cantidad",
    },

    importe_total: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: "Costo total",
    },

    precio_unitario: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      comment: "Precio por litro/galón",
    },

    grifo_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre del grifo/estación",
    },

    grifo_ruc: {
      type: DataTypes.STRING(11),
      allowNull: true,
    },

    factura_boleta: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Número de comprobante",
    },

    moneda: {
      type: DataTypes.ENUM("PEN", "USD"),
      allowNull: false,
      defaultValue: "PEN",
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    comprobante_adjunto: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "URL del comprobante escaneado",
    },

    // ==========================================
    // CONTROL DE ESTADO / SOFT DELETE
    // ==========================================
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1=Activo | 0=Inactivo",
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación (soft delete)",
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Usuario que eliminó (soft delete)",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    // ==========================================
    // AUDITORÍA (CREATED/UPDATED BY)
    // ==========================================
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    updated_at: {
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
  },
  {
    sequelize,
    modelName: "AbastecimientoCombustible",
    tableName: "abastecimiento_combustible",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false, // Soft delete manual con deleted_at
    indexes: [
      {
        name: "idx_vehiculo_fecha",
        fields: ["vehiculo_id", "fecha_hora"],
      },
      {
        name: "idx_fecha",
        fields: ["fecha_hora"],
      },
    ],
  }
);

export default AbastecimientoCombustible;
