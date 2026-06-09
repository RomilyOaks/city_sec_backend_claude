import { DataTypes } from "sequelize";
import sequelize, { DB_SCHEMA } from "../config/database.js";

const Factura = sequelize.define(
  "Factura",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    suscripcion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    metrica_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    numero_factura: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: "Ej: F001-00001",
    },
    periodo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    moneda: {
      type: DataTypes.ENUM("PEN", "USD"),
      allowNull: false,
      defaultValue: "PEN",
    },
    tipo_cambio: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      comment: "Tipo de cambio al momento de emisión (si moneda=USD)",
    },
    monto_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    monto_excedente: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    monto_igv: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "18% IGV sobre subtotal",
    },
    monto_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "pagada", "vencida", "anulada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    fecha_emision: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    pdf_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "URL pública en Supabase Storage",
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "facturas",
    schema: DB_SCHEMA,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Factura;
