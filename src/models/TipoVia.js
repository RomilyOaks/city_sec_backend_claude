/**
 * ============================================================================
 * ARCHIVO: src/models/TipoVia.js
 * VERSIÓN: 2.3.0
 * DESCRIPCIÓN: Modelo Sequelize para la tabla tipos_via
 *              Representa el catálogo de tipos de vías urbanas
 *              (Avenida, Jirón, Calle, Pasaje, etc.)
 * ============================================================================
 *
 * CAMBIOS v2.3.0:
 * - ✅ Agregado soporte para soft-delete (paranoid: true)
 * - ✅ Agregados campos deleted_at y deleted_by
 * - ✅ Ahora TipoVia sigue el mismo estándar que las demás tablas del módulo
 *
 * PROPÓSITO:
 * - Definir la estructura de datos para tipos de vías
 * - Gestionar el catálogo de clasificaciones de vías urbanas
 * - Proveer referencias para el modelo Calle
 *
 * RELACIONES:
 * - Uno a Muchos con Calle (un tipo de vía tiene muchas calles)
 *
 * CAMPOS PRINCIPALES:
 * - codigo: Código único (AV, JR, CA, PJ)
 * - nombre: Nombre completo (Avenida, Jirón, Calle)
 * - abreviatura: Abreviatura oficial (Av., Jr., Ca.)
 *
 * EJEMPLOS DE DATOS:
 * - AV | Avenida | Av.
 * - JR | Jirón | Jr.
 * - CA | Calle | Ca.
 *
 * @author Claude AI
 * @date 2025-12-27
 * ============================================================================
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * @typedef {Object} TipoVia
 * @property {number} id - ID único del tipo de vía
 * @property {string} codigo - Código único (AV, JR, CA, PJ, etc.)
 * @property {string} nombre - Nombre completo (Avenida, Jirón, Calle)
 * @property {string} abreviatura - Abreviatura oficial (Av., Jr., Ca.)
 * @property {string|null} descripcion - Descripción del tipo de vía
 * @property {number} orden - Orden de visualización en listas
 * @property {number} estado - Estado del registro (1=Activo, 0=Inactivo)
 */

/**
 * Modelo TipoVia
 *
 * @description
 * Define el esquema de la tabla tipos_via que almacena el catálogo
 * de tipos de vías urbanas según la nomenclatura oficial peruana.
 *
 * @swagger
 * components:
 *   schemas:
 *     TipoVia:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *         - abreviatura
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del tipo de vía
 *           example: 1
 *         codigo:
 *           type: string
 *           maxLength: 10
 *           description: Código único del tipo de vía
 *           example: "AV"
 *         nombre:
 *           type: string
 *           maxLength: 50
 *           description: Nombre completo del tipo de vía
 *           example: "Avenida"
 *         abreviatura:
 *           type: string
 *           maxLength: 10
 *           description: Abreviatura oficial
 *           example: "Av."
 *         descripcion:
 *           type: string
 *           description: Descripción del tipo de vía
 *           example: "Vía urbana principal de gran amplitud"
 *         orden:
 *           type: integer
 *           description: Orden de visualización
 *           example: 1
 *         estado:
 *           type: integer
 *           description: Estado del registro
 *           example: 1
 */
const TipoVia = sequelize.define(
  "TipoVia",
  {
    // ============================================================================
    // CLAVE PRIMARIA
    // ============================================================================
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID único del tipo de vía - Clave primaria auto-incremental",
    },

    // ============================================================================
    // IDENTIFICACIÓN DEL TIPO DE VÍA
    // ============================================================================
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true, // Garantiza que no haya códigos duplicados
      comment:
        "Código único (AV, JR, CA, PJ, etc.) - Usado para identificación rápida",
      validate: {
        // Validación: solo letras mayúsculas y números
        is: /^[A-Z0-9]+$/i,
        // Longitud mínima de 2 caracteres
        len: [2, 10],
      },
    },

    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombre completo (Avenida, Jirón, Calle) - Para visualización",
      validate: {
        // Validación: no puede estar vacío
        notEmpty: true,
        // Longitud mínima de 3 caracteres
        len: [3, 50],
      },
    },

    abreviatura: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment:
        "Abreviatura oficial (Av., Jr., Ca.) - Para nombre completo de calles",
      validate: {
        notEmpty: true,
        len: [2, 10],
      },
    },

    // ============================================================================
    // INFORMACIÓN ADICIONAL
    // ============================================================================
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true, // Campo opcional
      comment: "Descripción detallada del tipo de vía",
    },

    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Valor por defecto si no se especifica
      comment:
        "Orden de visualización en listas (menor número = mayor prioridad)",
      validate: {
        // Validación: debe ser un número positivo
        min: 0,
      },
    },

    // ============================================================================
    // ESTADO Y CONTROL
    // ============================================================================
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "Estado del registro: 1=Activo | 0=Inactivo",
      validate: {
        // Validación: solo puede ser 0 o 1
        isIn: [[0, 1]],
      },
    },

    // ============================================================================
    // CAMPOS DE AUDITORÍA
    // ============================================================================
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Se establece automáticamente al crear
      field: "created_at",
      comment: "Fecha y hora de creación del registro",
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true, // Puede ser null si el registro se crea automáticamente
      field: "created_by",
      comment: "ID del usuario que creó el registro",
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Se actualiza automáticamente al modificar
      field: "updated_at",
      comment: "Fecha y hora de última actualización del registro",
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "updated_by",
      comment: "ID del usuario que realizó la última actualización",
    },

    // ============================================================================
    // CAMPOS DE SOFT DELETE
    // ============================================================================
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
      comment: "Fecha y hora de eliminación lógica (soft delete)",
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "deleted_by",
      comment: "ID del usuario que eliminó el registro",
    },
  },
  {
    // ============================================================================
    // CONFIGURACIÓN DEL MODELO
    // ============================================================================
    sequelize, // Instancia de Sequelize
    tableName: "tipos_via", // Nombre exacto de la tabla en la base de datos
    timestamps: true, // Habilita manejo automático de created_at y updated_at
    paranoid: true, // Habilita soft-delete (no elimina físicamente los registros)
    createdAt: "created_at", // Mapeo del campo createdAt
    updatedAt: "updated_at", // Mapeo del campo updatedAt
    deletedAt: "deleted_at", // Mapeo del campo deletedAt para soft-delete
    comment: "Catálogo de tipos de vías urbanas (Av, Jr, Ca, Psje, etc.)",

    // ============================================================================
    // ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
    // ============================================================================
    indexes: [
      {
        // Índice único para garantizar códigos únicos
        name: "uq_tipos_via_codigo",
        unique: true,
        fields: ["codigo"],
      },
      {
        // Índice para búsquedas por estado (filtrando activos/inactivos)
        name: "idx_tipos_via_estado",
        fields: ["estado"],
      },
    ],
  }
);

// ============================================================================
// MÉTODOS DE INSTANCIA
// ============================================================================

/**
 * Verifica si el tipo de vía está activo
 * @returns {boolean} true si está activo, false si está inactivo
 */
TipoVia.prototype.isActivo = function () {
  return this.estado === 1;
};

// ============================================================================
// MÉTODOS DE CLASE (ESTÁTICOS)
// ============================================================================

/**
 * Obtiene todos los tipos de vía activos ordenados
 * @returns {Promise<Array>} Lista de tipos de vía activos
 */
TipoVia.getActivos = async function () {
  return await this.findAll({
    where: { estado: 1 },
    order: [
      ["orden", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

/**
 * Busca un tipo de vía por su código
 * @param {string} codigo - Código del tipo de vía
 * @returns {Promise<Object|null>} Tipo de vía encontrado o null
 */
TipoVia.findByCodigo = async function (codigo) {
  return await this.findOne({
    where: {
      codigo: codigo.toUpperCase(),
      estado: 1,
    },
  });
};

// ============================================================================
// EXPORTACIÓN DEL MODELO
// ============================================================================
export default TipoVia;
