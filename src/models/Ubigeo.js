/**
 * Ruta: src/models/Ubigeo.js
 * Descripción: Modelo Sequelize para la tabla 'ubigeo'
 * Gestiona el catálogo de ubicación geográfica del Perú
 * Contiene departamentos, provincias y distritos según código INEI
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Ubigeo = sequelize.define(
  "Ubigeo",
  {
    // Código de ubigeo (PK) - 6 dígitos según INEI
    ubigeo_code: {
      type: DataTypes.CHAR(6),
      primaryKey: true,
      allowNull: false,
      comment: "Código de ubigeo de 6 dígitos (formato INEI)",
    },

    // Departamento
    departamento: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombre del departamento",
    },

    // Provincia
    provincia: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombre de la provincia",
    },

    // Distrito
    distrito: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombre del distrito",
    },
  },
  {
    tableName: "ubigeo",
    timestamps: false, // Esta tabla no necesita timestamps

    // Índices
    indexes: [
      {
        fields: ["departamento"],
      },
      {
        fields: ["provincia"],
      },
      {
        fields: ["distrito"],
      },
      {
        // Índice compuesto para búsquedas por ubicación completa
        fields: ["departamento", "provincia", "distrito"],
      },
    ],
  }
);

/**
 * Métodos estáticos
 */

// Obtener todos los departamentos únicos
Ubigeo.getDepartamentos = async function () {
  return await Ubigeo.findAll({
    attributes: [
      [sequelize.fn("DISTINCT", sequelize.col("departamento")), "departamento"],
    ],
    order: [["departamento", "ASC"]],
    raw: true,
  });
};

// Obtener provincias de un departamento
Ubigeo.getProvinciasPorDepartamento = async function (departamento) {
  return await Ubigeo.findAll({
    attributes: [
      [sequelize.fn("DISTINCT", sequelize.col("provincia")), "provincia"],
    ],
    where: {
      departamento: departamento,
    },
    order: [["provincia", "ASC"]],
    raw: true,
  });
};

// Obtener distritos de una provincia
Ubigeo.getDistritosPorProvincia = async function (departamento, provincia) {
  return await Ubigeo.findAll({
    attributes: ["ubigeo_code", "distrito"],
    where: {
      departamento: departamento,
      provincia: provincia,
    },
    order: [["distrito", "ASC"]],
  });
};

// Buscar por código
Ubigeo.findByCode = async function (ubigeoCode) {
  return await Ubigeo.findOne({
    where: {
      ubigeo_code: ubigeoCode,
    },
  });
};

// Buscar por ubicación completa
Ubigeo.findByUbicacion = async function (departamento, provincia, distrito) {
  return await Ubigeo.findOne({
    where: {
      departamento: departamento,
      provincia: provincia,
      distrito: distrito,
    },
  });
};

// Buscar distritos por nombre (búsqueda parcial)
Ubigeo.searchDistritos = async function (searchTerm) {
  return await Ubigeo.findAll({
    where: {
      distrito: {
        [sequelize.Sequelize.Op.like]: `%${searchTerm}%`,
      },
    },
    order: [
      ["departamento", "ASC"],
      ["provincia", "ASC"],
      ["distrito", "ASC"],
    ],
    limit: 20,
  });
};

// Obtener estructura jerárquica completa
Ubigeo.getEstructuraJerarquica = async function () {
  const ubigeos = await Ubigeo.findAll({
    order: [
      ["departamento", "ASC"],
      ["provincia", "ASC"],
      ["distrito", "ASC"],
    ],
  });

  // Organizar en estructura jerárquica
  const estructura = {};

  ubigeos.forEach((u) => {
    if (!estructura[u.departamento]) {
      estructura[u.departamento] = {};
    }
    if (!estructura[u.departamento][u.provincia]) {
      estructura[u.departamento][u.provincia] = [];
    }
    estructura[u.departamento][u.provincia].push({
      ubigeo_code: u.ubigeo_code,
      distrito: u.distrito,
    });
  });

  return estructura;
};

// Validar código de ubigeo
Ubigeo.esCodigoValido = async function (ubigeoCode) {
  if (!ubigeoCode || ubigeoCode.length !== 6) {
    return false;
  }

  const ubigeo = await Ubigeo.findByPk(ubigeoCode);
  return ubigeo !== null;
};

/**
 * Métodos de instancia
 */

// Obtener ubicación completa formateada
Ubigeo.prototype.getUbicacionCompleta = function () {
  return `${this.distrito}, ${this.provincia}, ${this.departamento}`;
};

// Obtener código de departamento (primeros 2 dígitos)
Ubigeo.prototype.getCodigoDepartamento = function () {
  return this.ubigeo_code.substring(0, 2);
};

// Obtener código de provincia (primeros 4 dígitos)
Ubigeo.prototype.getCodigoProvincia = function () {
  return this.ubigeo_code.substring(0, 4);
};

// Verificar si es capital de departamento
Ubigeo.prototype.esCapitalDepartamento = function () {
  // La capital del departamento tiene código provincial '01' y distrital '01'
  const codigoProvincia = this.ubigeo_code.substring(2, 4);
  const codigoDistrito = this.ubigeo_code.substring(4, 6);
  return codigoProvincia === "01" && codigoDistrito === "01";
};

// Verificar si es capital de provincia
Ubigeo.prototype.esCapitalProvincia = function () {
  // La capital de provincia tiene código distrital '01'
  const codigoDistrito = this.ubigeo_code.substring(4, 6);
  return codigoDistrito === "01";
};

// Obtener objeto simplificado
Ubigeo.prototype.toSimpleObject = function () {
  return {
    codigo: this.ubigeo_code,
    departamento: this.departamento,
    provincia: this.provincia,
    distrito: this.distrito,
    ubicacionCompleta: this.getUbicacionCompleta(),
  };
};

export default Ubigeo;
