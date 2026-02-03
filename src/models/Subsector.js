/**
 * ===================================================
 * MODELO: Subsector
 * ===================================================
 *
 * Ruta: src/models/Subsector.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-02-03
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'subsectores'.
 * Los subsectores son subdivisiones de sectores que agrupan cuadrantes.
 * Permiten un nivel intermedio de organización territorial.
 *
 * Jerarquía:
 * Sector -> Subsector -> Cuadrante
 *
 * Características:
 * - Código único de identificación
 * - Pertenece a un sector específico
 * - Agrupa múltiples cuadrantes
 * - Polígonos GeoJSON para límites
 * - Color personalizable para mapas
 * - Supervisor asignado opcional
 * - Soft delete con auditoría
 *
 * Relaciones:
 * - Pertenece a un Sector (Many-to-One)
 * - Tiene muchos Cuadrantes (One-to-Many)
 * - Tiene un Supervisor opcional (Many-to-One)
 *
 * @module models/Subsector
 * @requires sequelize
 * @version 1.0.0
 * @date 2026-02-03
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Subsector = sequelize.define(
  "Subsector",
  {
    // ============================================
    // IDENTIFICACIÓN PRINCIPAL
    // ============================================

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del subsector",
    },

    subsector_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: "Código único del subsector (ej: 1A, 1B, 2C)",
    },

    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombre descriptivo del subsector",
    },

    // ============================================
    // RELACIÓN CON SECTOR
    // ============================================

    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sectores",
        key: "id",
      },
      comment: "Sector al que pertenece el subsector",
    },

    // ============================================
    // SUPERVISOR
    // ============================================

    personal_supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
      comment: "ID del supervisor responsable del subsector",
    },

    // ============================================
    // UBICACIÓN GEOGRÁFICA
    // ============================================

    referencia: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment:
        "Referencia de los cruces de vias que conforman el polígono del subsector",
    },

    poligono_json: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Coordenadas del polígono del subsector en formato GeoJSON",
    },

    radio_metros: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
      comment: "Radio de cobertura en metros (para subsectores circulares)",
    },

    // ============================================
    // VISUALIZACIÓN
    // ============================================

    color_mapa: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#10B981",
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
      comment: "Color hexadecimal para visualización en mapa",
    },

    // ============================================
    // ESTADO Y CONTROL
    // ============================================

    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1=Activo | 0=Inactivo (soft-deleted)",
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Usuario que eliminó el registro",
    },

    // ============================================
    // AUDITORÍA
    // ============================================

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
    tableName: "subsectores",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        unique: true,
        fields: ["subsector_code"],
      },
      {
        fields: ["sector_id"],
      },
      {
        fields: ["estado"],
      },
      {
        fields: ["estado", "deleted_at"],
      },
      {
        fields: ["personal_supervisor_id"],
      },
    ],

    validate: {
      colorValido() {
        if (this.color_mapa && !/^#[0-9A-F]{6}$/i.test(this.color_mapa)) {
          throw new Error(
            "El color debe ser un código hexadecimal válido (#RRGGBB)"
          );
        }
      },

      radioValido() {
        if (this.radio_metros && this.radio_metros <= 0) {
          throw new Error("El radio debe ser un valor positivo mayor a 0");
        }
      },
    },

    hooks: {
      beforeCreate: async (subsector) => {
        if (!subsector.subsector_code) {
          const ultimoSubsector = await Subsector.findOne({
            where: { sector_id: subsector.sector_id },
            order: [["subsector_code", "DESC"]],
            attributes: ["subsector_code"],
          });

          if (ultimoSubsector) {
            const match = ultimoSubsector.subsector_code.match(/(\d+)([A-Z]?)$/i);
            if (match) {
              const numero = match[1];
              const letra = match[2] || "";
              if (letra) {
                const nuevaLetra = String.fromCharCode(letra.charCodeAt(0) + 1);
                subsector.subsector_code = `${numero}${nuevaLetra}`;
              } else {
                subsector.subsector_code = `${parseInt(numero) + 1}A`;
              }
            } else {
              subsector.subsector_code = "1A";
            }
          } else {
            subsector.subsector_code = "1A";
          }
        }

        subsector.subsector_code = subsector.subsector_code.toUpperCase();
      },

      beforeUpdate: (subsector) => {
        if (subsector.changed("subsector_code")) {
          subsector.subsector_code = subsector.subsector_code.toUpperCase();
        }
      },
    },
  }
);

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener subsectores activos
 */
Subsector.findActivos = async function () {
  return await Subsector.findAll({
    where: {
      estado: 1,
      deleted_at: null,
    },
    include: [
      {
        association: "sector",
        attributes: ["id", "sector_code", "nombre"],
      },
    ],
    order: [["subsector_code", "ASC"]],
  });
};

/**
 * Obtener subsectores por sector
 */
Subsector.findBySector = async function (sectorId) {
  return await Subsector.findAll({
    where: {
      sector_id: sectorId,
      estado: 1,
      deleted_at: null,
    },
    order: [["subsector_code", "ASC"]],
  });
};

/**
 * Buscar subsector por código
 */
Subsector.findByCode = async function (code) {
  return await Subsector.findOne({
    where: {
      subsector_code: code.toUpperCase(),
      estado: 1,
      deleted_at: null,
    },
    include: [
      {
        association: "sector",
        attributes: ["id", "sector_code", "nombre"],
      },
      {
        association: "cuadrantes",
        where: {
          estado: 1,
          deleted_at: null,
        },
        required: false,
      },
    ],
  });
};

/**
 * Obtener subsector con sus cuadrantes
 */
Subsector.findWithCuadrantes = async function (subsectorId) {
  return await Subsector.findByPk(subsectorId, {
    include: [
      {
        association: "sector",
        attributes: ["id", "sector_code", "nombre"],
      },
      {
        association: "cuadrantes",
        where: {
          estado: 1,
          deleted_at: null,
        },
        required: false,
        order: [["cuadrante_code", "ASC"]],
      },
      {
        association: "supervisor",
        attributes: ["id", "nombres", "apellido_paterno", "apellido_materno"],
      },
    ],
  });
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

Subsector.prototype.activar = async function () {
  this.estado = 1;
  await this.save();
};

Subsector.prototype.desactivar = async function () {
  this.estado = 0;
  await this.save();
};

Subsector.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = 0;
  if (userId) {
    this.deleted_by = userId;
  }
  await this.save();
};

Subsector.prototype.tienePoligono = function () {
  return (
    this.poligono_json !== null &&
    typeof this.poligono_json === "object" &&
    Object.keys(this.poligono_json).length > 0
  );
};

Subsector.prototype.getCuadrantes = async function () {
  return await sequelize.models.Cuadrante.findAll({
    where: {
      subsector_id: this.id,
      estado: 1,
      deleted_at: null,
    },
    order: [["cuadrante_code", "ASC"]],
  });
};

Subsector.prototype.contarCuadrantesActivos = async function () {
  return await sequelize.models.Cuadrante.count({
    where: {
      subsector_id: this.id,
      estado: 1,
      deleted_at: null,
    },
  });
};

Subsector.prototype.getResumen = function () {
  return {
    id: this.id,
    codigo: this.subsector_code,
    nombre: this.nombre,
    sectorId: this.sector_id,
    color: this.color_mapa,
    activo: this.estado === 1,
    tienePoligono: this.tienePoligono(),
  };
};

export default Subsector;
