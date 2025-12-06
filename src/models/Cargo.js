/**
 * Ruta: src/models/Cargo.js
 * Descripción: Modelo Sequelize para la tabla 'cargos'
 * Define los puestos o cargos que puede ocupar el personal de seguridad
 * Ejemplos: Sereno, Supervisor, Jefe de Operaciones, etc.
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
const sequelize = require("../../config/database.js");

const Cargo = sequelize.define(
  "Cargo",
  {
    // ID principal - Autoincremental
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del cargo",
    },

    // Nombre del cargo
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, // No puede haber dos cargos con el mismo nombre
      comment: "Nombre del cargo (ej: Sereno, Supervisor, Jefe de Operaciones)",
    },

    // Estado del cargo (activo/inactivo)
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
    },

    // Campos de auditoría - Usuario que creó el registro
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que creó el registro",
    },

    // Usuario que realizó la última actualización
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro",
    },
  },
  {
    // Configuración del modelo
    tableName: "cargos",
    timestamps: true, // Habilita created_at y updated_at
    createdAt: "created_at", // Nombre personalizado para la columna de creación
    updatedAt: "updated_at", // Nombre personalizado para la columna de actualización

    // Índices adicionales para optimizar consultas
    indexes: [
      {
        // Índice único en nombre para búsquedas rápidas
        unique: true,
        fields: ["nombre"],
      },
      {
        // Índice en estado para filtrar activos/inactivos
        fields: ["estado"],
      },
    ],

    // Hooks (eventos del ciclo de vida del modelo)
    hooks: {
      // Antes de validar, normalizar el nombre
      beforeValidate: (cargo) => {
        if (cargo.nombre) {
          // Convertir a mayúsculas la primera letra de cada palabra
          cargo.nombre = cargo.nombre
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
 * Métodos estáticos del modelo
 * Estos métodos se llaman directamente desde el modelo: Cargo.findActivos()
 */

// Método para obtener solo cargos activos
Cargo.findActivos = async function () {
  return await Cargo.findAll({
    where: { estado: true },
    order: [["nombre", "ASC"]],
  });
};

// Método para buscar cargo por nombre exacto
Cargo.findByNombre = async function (nombre) {
  return await Cargo.findOne({
    where: {
      nombre: nombre,
      estado: true,
    },
  });
};

// Método para contar personal asociado a un cargo
Cargo.countPersonal = async function (cargoId) {
  const cargo = await Cargo.findByPk(cargoId, {
    include: [
      {
        association: "personal",
        where: { estado: 1 },
        required: false,
      },
    ],
  });

  return cargo ? cargo.personal.length : 0;
};

/**
 * Métodos de instancia
 * Estos métodos se llaman desde una instancia: miCargo.activar()
 */

// Método para activar un cargo
Cargo.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

// Método para desactivar un cargo
Cargo.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

// Personalizar toJSON para excluir campos sensibles si es necesario
Cargo.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  // Aquí podrías excluir campos si fuera necesario
  return values;
};

export default Cargo;
