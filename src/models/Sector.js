/**
 * ===================================================
 * MODELO: Sector
 * ===================================================
 *
 * Ruta: src/models/Sector.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Documentación JSDoc completa
 * ✅ Headers profesionales con versionado
 * ✅ Sin cambios funcionales
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'sectores'.
 * Define sectores de vigilancia y patrullaje urbano.
 * Los sectores agrupan cuadrantes y definen zonas de responsabilidad.
 *
 * Características:
 * - Código único de identificación
 * - Polígonos GeoJSON para límites
 * - Color personalizable para mapas
 * - Relación con cuadrantes y ubigeo
 * - Soft delete con auditoría
 *
 * Relaciones:
 * - Tiene muchos Cuadrantes (One-to-Many)
 * - Pertenece a un Ubigeo (Many-to-One)
 * - Tiene muchas Novedades (One-to-Many)
 *
 * @module models/Sector
 * @requires sequelize
 * @version 2.0.0
 * @date 2025-12-14
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
import sequelize from "../config/database.js";

const Sector = sequelize.define(
  "Sector",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del sector",
    },

    // Código único del sector (ej: S001, S002)
    sector_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: "Código único del sector (ej: S001, S002, SEC-NORTE)",
    },

    // Nombre descriptivo del sector
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre descriptivo del sector",
    },

    // Descripción del sector
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada del sector y sus características",
    },

    // Ubicación geográfica (ubigeo) - FK
    ubigeo: {
      type: DataTypes.CHAR(6),
      allowNull: true,
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
      comment: "Código de ubigeo del sector",
    },

    // Código de zona asociada
    zona_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Código de zona asociada al sector",
    },

    // Polígono del sector en formato GeoJSON
    poligono_json: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Coordenadas del polígono del sector en formato GeoJSON",
    },

    // Color para visualización en mapa
    color_mapa: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#3B82F6", // Azul por defecto
      comment: "Color hexadecimal para visualización en mapa",
    },

    // Estado del sector
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
    tableName: "sectores",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // Índices
    indexes: [
      {
        unique: true,
        fields: ["sector_code"],
      },
      {
        fields: ["zona_code"],
      },
      {
        fields: ["estado"],
      },
      {
        fields: ["ubigeo"],
      },
      {
        // Índice compuesto para filtrar sectores activos no eliminados
        fields: ["estado", "deleted_at"],
      },
    ],

    // Validaciones a nivel de modelo
    validate: {
      // Validar formato del color hexadecimal
      colorValido() {
        if (this.color_mapa && !/^#[0-9A-F]{6}$/i.test(this.color_mapa)) {
          throw new Error(
            "El color debe ser un código hexadecimal válido (#RRGGBB)"
          );
        }
      },

      // Validar formato del código de sector
      codigoValido() {
        if (this.sector_code && this.sector_code.length > 10) {
          throw new Error(
            "El código del sector no puede exceder 10 caracteres"
          );
        }
      },
    },

    // Hooks
    hooks: {
      // Antes de crear, generar código automático si no se proporciona
      beforeCreate: async (sector) => {
        if (!sector.sector_code) {
          // Obtener el último código de sector
          const ultimoSector = await Sector.findOne({
            order: [["sector_code", "DESC"]],
            attributes: ["sector_code"],
          });

          if (ultimoSector && /^S\d+$/.test(ultimoSector.sector_code)) {
            // Si el último código tiene formato S### (ej: S001)
            const numeroActual = parseInt(
              ultimoSector.sector_code.replace("S", "")
            );
            sector.sector_code = `S${String(numeroActual + 1).padStart(
              3,
              "0"
            )}`;
          } else {
            // Primer sector o formato diferente
            sector.sector_code = "S001";
          }
        }

        // Normalizar código a mayúsculas
        sector.sector_code = sector.sector_code.toUpperCase();
      },

      // Antes de actualizar, normalizar código
      beforeUpdate: (sector) => {
        if (sector.changed("sector_code")) {
          sector.sector_code = sector.sector_code.toUpperCase();
        }
      },
    },
  }
);

/**
 * Métodos estáticos
 */

// Obtener sectores activos
Sector.findActivos = async function () {
  return await Sector.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "ubicacion",
        attributes: ["distrito", "provincia", "departamento"],
      },
    ],
    order: [["sector_code", "ASC"]],
  });
};

// Buscar sector por código
Sector.findByCode = async function (code) {
  return await Sector.findOne({
    where: {
      sector_code: code.toUpperCase(),
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "ubicacion",
      },
      {
        association: "cuadrantes",
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
      },
    ],
  });
};

// Buscar sectores por ubigeo
Sector.findByUbigeo = async function (ubigeoCode) {
  return await Sector.findAll({
    where: {
      ubigeo: ubigeoCode,
      estado: true,
      deleted_at: null,
    },
    order: [["sector_code", "ASC"]],
  });
};

// Buscar sectores por zona
Sector.findByZona = async function (zonaCode) {
  return await Sector.findAll({
    where: {
      zona_code: zonaCode,
      estado: true,
      deleted_at: null,
    },
    order: [["sector_code", "ASC"]],
  });
};

// Obtener sector con sus cuadrantes
Sector.findWithCuadrantes = async function (sectorId) {
  return await Sector.findByPk(sectorId, {
    include: [
      {
        association: "cuadrantes",
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
        order: [["cuadrante_code", "ASC"]],
      },
      {
        association: "ubicacion",
      },
    ],
  });
};

// Obtener estadísticas de sectores
Sector.getEstadisticas = async function () {
  return await Sector.findAll({
    attributes: [
      "id",
      "sector_code",
      "nombre",
      [
        sequelize.fn("COUNT", sequelize.col("cuadrantes.id")),
        "total_cuadrantes",
      ],
    ],
    include: [
      {
        association: "cuadrantes",
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
    group: ["Sector.id"],
    order: [["sector_code", "ASC"]],
    raw: false,
  });
};

// Contar novedades por sector
Sector.contarNovedades = async function (
  sectorId,
  fechaInicio = null,
  fechaFin = null
) {
  const whereClause = {
    sector_id: sectorId,
    estado: 1,
    deleted_at: null,
  };

  if (fechaInicio && fechaFin) {
    whereClause.fecha_hora = {
      [sequelize.Sequelize.Op.between]: [fechaInicio, fechaFin],
    };
  }

  const Novedad = sequelize.models.NovedadIncidente;
  return await Novedad.count({ where: whereClause });
};

/**
 * Métodos de instancia
 */

// Activar sector
Sector.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

// Desactivar sector
Sector.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

// Soft delete
Sector.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

// Verificar si tiene polígono definido
Sector.prototype.tienePoligono = function () {
  return (
    this.poligono_json !== null && Object.keys(this.poligono_json).length > 0
  );
};

// Obtener cuadrantes del sector
Sector.prototype.getCuadrantes = async function () {
  return await sequelize.models.Cuadrante.findAll({
    where: {
      sector_id: this.id,
      estado: true,
      deleted_at: null,
    },
    order: [["cuadrante_code", "ASC"]],
  });
};

// Contar cuadrantes activos
Sector.prototype.contarCuadrantesActivos = async function () {
  return await sequelize.models.Cuadrante.count({
    where: {
      sector_id: this.id,
      estado: true,
      deleted_at: null,
    },
  });
};

// Obtener información resumida para UI
Sector.prototype.getResumen = function () {
  return {
    id: this.id,
    codigo: this.sector_code,
    nombre: this.nombre,
    zona: this.zona_code,
    color: this.color_mapa,
    activo: this.estado,
    tienePoligono: this.tienePoligono(),
  };
};

export default Sector;
