/**
 * Ruta: src/models/TipoNovedad.js
 * Descripción: Modelo Sequelize para la tabla 'tipos_novedad'
 * Define los tipos principales de novedades/incidentes
 * Ejemplos: Delitos Contra el Patrimonio, Faltas, Accidentes de Tránsito, etc.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TipoNovedad = sequelize.define(
  "TipoNovedad",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del tipo de novedad",
    },

    // Código único del tipo (T001, T002, etc.)
    tipo_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: "Código único del tipo (ej: T001, T002)",
    },

    // Nombre del tipo de novedad
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre del tipo de novedad",
    },

    // Descripción
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada del tipo de novedad",
    },

    // Icono para UI
    icono: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment:
        "Nombre del icono para UI (ej: alert-triangle, car-crash, shield)",
    },

    // Color para visualización
    color_hex: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#6B7280", // Gris por defecto
      comment: "Color hexadecimal para visualización en mapa/dashboard",
    },

    // Orden de visualización
    orden: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Orden de visualización en listados",
    },

    // Indica si requiere envío de unidad
    requiere_unidad: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: "1=Requiere envío de unidad | 0=No requiere",
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
    tableName: "tipos_novedad",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // Índices
    indexes: [
      {
        unique: true,
        fields: ["tipo_code"],
      },
      {
        fields: ["estado", "orden"],
      },
      {
        fields: ["estado"],
      },
    ],

    // Validaciones a nivel de modelo
    validate: {
      // Validar formato del color
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
      // Antes de crear, generar código automático si no se proporciona
      beforeCreate: async (tipoNovedad) => {
        if (!tipoNovedad.tipo_code) {
          const ultimoTipo = await TipoNovedad.findOne({
            order: [["tipo_code", "DESC"]],
            attributes: ["tipo_code"],
          });

          if (ultimoTipo && /^T\d+$/.test(ultimoTipo.tipo_code)) {
            const numeroActual = parseInt(
              ultimoTipo.tipo_code.replace("T", "")
            );
            tipoNovedad.tipo_code = `T${String(numeroActual + 1).padStart(
              3,
              "0"
            )}`;
          } else {
            tipoNovedad.tipo_code = "T001";
          }
        }

        tipoNovedad.tipo_code = tipoNovedad.tipo_code.toUpperCase();
      },
    },
  }
);

/**
 * Métodos estáticos
 */

// Obtener tipos activos ordenados
TipoNovedad.findActivos = async function () {
  return await TipoNovedad.findAll({
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

// Buscar tipo por código
TipoNovedad.findByCode = async function (code) {
  return await TipoNovedad.findOne({
    where: {
      tipo_code: code.toUpperCase(),
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "subtipos",
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
        order: [["orden", "ASC"]],
      },
    ],
  });
};

// Obtener tipos con sus subtipos
TipoNovedad.findAllConSubtipos = async function () {
  return await TipoNovedad.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "subtipos",
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
        order: [["orden", "ASC"]],
      },
    ],
    order: [
      ["orden", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

// Contar subtipos de un tipo
TipoNovedad.contarSubtipos = async function (tipoId) {
  const tipo = await TipoNovedad.findByPk(tipoId, {
    include: [
      {
        association: "subtipos",
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
      },
    ],
  });

  return tipo ? tipo.subtipos.length : 0;
};

// Obtener estadísticas de tipos
TipoNovedad.getEstadisticas = async function () {
  return await TipoNovedad.findAll({
    attributes: [
      "id",
      "tipo_code",
      "nombre",
      "color_hex",
      [
        sequelize.fn("COUNT", sequelize.col("subtipos.id")),
        "cantidad_subtipos",
      ],
    ],
    include: [
      {
        association: "subtipos",
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
    group: ["TipoNovedad.id"],
    order: [["orden", "ASC"]],
    raw: false,
  });
};

/**
 * Métodos de instancia
 */

// Activar tipo
TipoNovedad.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

// Desactivar tipo
TipoNovedad.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

// Soft delete
TipoNovedad.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

// Obtener subtipos del tipo
TipoNovedad.prototype.getSubtipos = async function () {
  return await sequelize.models.SubtipoNovedad.findAll({
    where: {
      tipo_novedad_id: this.id,
      estado: true,
      deleted_at: null,
    },
    order: [
      ["orden", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

// Verificar si requiere unidad
TipoNovedad.prototype.requiereUnidad = function () {
  return this.requiere_unidad === true;
};

// Obtener información para UI
TipoNovedad.prototype.getUIInfo = function () {
  return {
    id: this.id,
    codigo: this.tipo_code,
    nombre: this.nombre,
    icono: this.icono,
    color: this.color_hex,
    orden: this.orden,
    requiereUnidad: this.requiere_unidad,
  };
};

export default TipoNovedad;
