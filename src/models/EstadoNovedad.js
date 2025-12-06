/**
 * Ruta: src/models/EstadoNovedad.js
 * Descripción: Modelo Sequelize para la tabla 'estados_novedad'
 * Define los estados del ciclo de vida de las novedades/incidentes
 * Ejemplos: Registrado, En Atención, Despachado, Resuelto, Cerrado
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
const sequelize = require("../../config/database.js");

const EstadoNovedad = sequelize.define(
  "EstadoNovedad",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del estado",
    },

    // Nombre del estado
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Nombre del estado (ej: Registrado, En Atención, Resuelto)",
    },

    // Descripción del estado
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Descripción detallada del estado",
    },

    // Color para UI (hexadecimal)
    color_hex: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#6B7280", // Gris por defecto
      comment: "Color hexadecimal para visualización en UI",
    },

    // Icono del estado (nombre del icono de la librería UI)
    icono: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment:
        "Nombre del icono para UI (ej: clock, check-circle, alert-triangle)",
    },

    // Orden en el flujo de estados
    orden: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Orden en el flujo de estados (menor = más temprano)",
    },

    // Indica si es el estado inicial
    es_inicial: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "1=Estado inicial al crear novedad | 0=No es inicial",
    },

    // Indica si es un estado final/cerrado
    es_final: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "1=Estado final/cerrado | 0=No es final",
    },

    // Indica si requiere asignación de unidad
    requiere_unidad: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "1=Requiere asignación de unidad | 0=No requiere",
    },

    // Estado activo/inactivo
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
    tableName: "estados_novedad",
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
        fields: ["orden"],
      },
      {
        fields: ["es_inicial"],
      },
      {
        fields: ["es_final"],
      },
      {
        fields: ["estado"],
      },
    ],

    // Validaciones a nivel de modelo
    validate: {
      // Validar formato del color hexadecimal
      colorValido() {
        if (this.color_hex && !/^#[0-9A-F]{6}$/i.test(this.color_hex)) {
          throw new Error(
            "El color debe ser un código hexadecimal válido (#RRGGBB)"
          );
        }
      },

      // Validar que el orden sea positivo
      ordenValido() {
        if (this.orden !== null && this.orden < 0) {
          throw new Error("El orden debe ser un valor positivo o cero");
        }
      },
    },

    // Hooks
    hooks: {
      // Antes de crear/actualizar, normalizar el nombre
      beforeSave: (estadoNovedad) => {
        if (estadoNovedad.nombre) {
          // Convertir a mayúsculas la primera letra de cada palabra
          estadoNovedad.nombre = estadoNovedad.nombre
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      },

      // Antes de crear, validar que solo haya un estado inicial
      beforeCreate: async (estadoNovedad) => {
        if (estadoNovedad.es_inicial) {
          const estadoInicialExistente = await EstadoNovedad.findOne({
            where: {
              es_inicial: true,
              estado: true,
              deleted_at: null,
            },
          });

          if (estadoInicialExistente) {
            throw new Error(
              "Ya existe un estado inicial. Solo puede haber uno."
            );
          }
        }
      },

      // Antes de actualizar, validar que solo haya un estado inicial
      beforeUpdate: async (estadoNovedad) => {
        if (estadoNovedad.changed("es_inicial") && estadoNovedad.es_inicial) {
          const estadoInicialExistente = await EstadoNovedad.findOne({
            where: {
              es_inicial: true,
              estado: true,
              deleted_at: null,
              id: { [sequelize.Sequelize.Op.ne]: estadoNovedad.id },
            },
          });

          if (estadoInicialExistente) {
            throw new Error(
              "Ya existe un estado inicial. Solo puede haber uno."
            );
          }
        }
      },
    },
  }
);

/**
 * Métodos estáticos
 */

// Obtener el estado inicial
EstadoNovedad.findEstadoInicial = async function () {
  return await EstadoNovedad.findOne({
    where: {
      es_inicial: true,
      estado: true,
      deleted_at: null,
    },
  });
};

// Obtener estados finales
EstadoNovedad.findEstadosFinales = async function () {
  return await EstadoNovedad.findAll({
    where: {
      es_final: true,
      estado: true,
      deleted_at: null,
    },
    order: [["orden", "ASC"]],
  });
};

// Obtener estados activos ordenados por flujo
EstadoNovedad.findEstadosPorFlujo = async function () {
  return await EstadoNovedad.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    order: [
      ["orden", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

// Obtener estados que requieren unidad
EstadoNovedad.findEstadosConUnidad = async function () {
  return await EstadoNovedad.findAll({
    where: {
      requiere_unidad: true,
      estado: true,
      deleted_at: null,
    },
    order: [["orden", "ASC"]],
  });
};

// Buscar estado por nombre
EstadoNovedad.findByNombre = async function (nombre) {
  return await EstadoNovedad.findOne({
    where: {
      nombre: nombre,
      estado: true,
      deleted_at: null,
    },
  });
};

// Obtener siguiente estado en el flujo
EstadoNovedad.findSiguienteEstado = async function (ordenActual) {
  return await EstadoNovedad.findOne({
    where: {
      orden: {
        [sequelize.Sequelize.Op.gt]: ordenActual,
      },
      estado: true,
      deleted_at: null,
    },
    order: [["orden", "ASC"]],
  });
};

// Obtener estado anterior en el flujo
EstadoNovedad.findEstadoAnterior = async function (ordenActual) {
  return await EstadoNovedad.findOne({
    where: {
      orden: {
        [sequelize.Sequelize.Op.lt]: ordenActual,
      },
      estado: true,
      deleted_at: null,
    },
    order: [["orden", "DESC"]],
  });
};

// Contar novedades por estado
EstadoNovedad.contarNovedadesPorEstado = async function () {
  return await EstadoNovedad.findAll({
    attributes: [
      "id",
      "nombre",
      "color_hex",
      "icono",
      [sequelize.fn("COUNT", sequelize.col("novedades.id")), "cantidad"],
    ],
    include: [
      {
        association: "novedades",
        attributes: [],
        where: {
          estado: 1,
          deleted_at: null,
        },
        required: false,
      },
    ],
    where: {
      estado: true,
      deleted_at: null,
    },
    group: ["EstadoNovedad.id"],
    order: [["orden", "ASC"]],
    raw: true,
  });
};

/**
 * Métodos de instancia
 */

// Verificar si es estado inicial
EstadoNovedad.prototype.esInicial = function () {
  return this.es_inicial === true;
};

// Verificar si es estado final
EstadoNovedad.prototype.esFinal = function () {
  return this.es_final === true;
};

// Verificar si requiere unidad
EstadoNovedad.prototype.requiereUnidad = function () {
  return this.requiere_unidad === true;
};

// Activar estado
EstadoNovedad.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

// Desactivar estado
EstadoNovedad.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

// Soft delete
EstadoNovedad.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

// Obtener objeto con información básica para UI
EstadoNovedad.prototype.getUIInfo = function () {
  return {
    id: this.id,
    nombre: this.nombre,
    color: this.color_hex,
    icono: this.icono,
    orden: this.orden,
    esInicial: this.es_inicial,
    esFinal: this.es_final,
    requiereUnidad: this.requiere_unidad,
  };
};

export default EstadoNovedad;
