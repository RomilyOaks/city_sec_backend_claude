/**
 * Ruta: src/models/TipoVehiculo.js
 * Descripción: Modelo Sequelize para la tabla 'tipos_vehiculo'
 * Define los tipos de vehículos utilizados en seguridad ciudadana
 * Ejemplos: Móvil, Motocicleta, Camioneta, Bicicleta, etc.
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
import sequelize from "../config/database.js";

const TipoVehiculo = sequelize.define(
  "TipoVehiculo",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del tipo de vehículo",
    },

    // Nombre del tipo
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment:
        "Nombre del tipo de vehículo (ej: Móvil, Motocicleta, Camioneta)",
    },

    // Descripción
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Descripción del tipo de vehículo",
    },

    // Estado del tipo
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
    },

    // Eliminación lógica
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    // Auditoría
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que creó el registro",
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro",
    },
  },
  {
    tableName: "tipos_vehiculo",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // Índices
    indexes: [
      {
        unique: true,
        fields: ["nombre"],
      },
      {
        fields: ["estado"],
      },
    ],

    // Hooks
    hooks: {
      // Antes de guardar, normalizar el nombre
      beforeSave: (tipoVehiculo) => {
        if (tipoVehiculo.nombre) {
          // Convertir a Title Case
          tipoVehiculo.nombre = tipoVehiculo.nombre
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      },
    },
  }
);

/**
 * Métodos estáticos
 */

// Obtener tipos activos
TipoVehiculo.findActivos = async function () {
  return await TipoVehiculo.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    order: [["nombre", "ASC"]],
  });
};

// Buscar tipo por nombre
TipoVehiculo.findByNombre = async function (nombre) {
  return await TipoVehiculo.findOne({
    where: {
      nombre: nombre,
      estado: true,
      deleted_at: null,
    },
  });
};

// Contar vehículos por tipo
TipoVehiculo.contarVehiculos = async function (tipoId) {
  const tipo = await TipoVehiculo.findByPk(tipoId, {
    include: [
      {
        association: "vehiculos",
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
      },
    ],
  });

  return tipo ? tipo.vehiculos.length : 0;
};

// Obtener estadísticas de vehículos por tipo
TipoVehiculo.getEstadisticas = async function () {
  return await TipoVehiculo.findAll({
    attributes: [
      "id",
      "nombre",
      [
        sequelize.fn("COUNT", sequelize.col("vehiculos.id")),
        "cantidad_vehiculos",
      ],
    ],
    include: [
      {
        association: "vehiculos",
        attributes: [],
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
      },
    ],
    where: {
      estado: true,
      deleted_at: null,
    },
    group: ["TipoVehiculo.id"],
    order: [[sequelize.literal("cantidad_vehiculos"), "DESC"]],
    raw: false,
  });
};

/**
 * Métodos de instancia
 */

// Activar tipo
TipoVehiculo.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

// Desactivar tipo
TipoVehiculo.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

// Soft delete
TipoVehiculo.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

// Obtener vehículos del tipo
TipoVehiculo.prototype.getVehiculos = async function () {
  return await sequelize.models.Vehiculo.findAll({
    where: {
      tipo_id: this.id,
      estado: true,
      deleted_at: null,
    },
    order: [["codigo_vehiculo", "ASC"]],
  });
};

export default TipoVehiculo;
