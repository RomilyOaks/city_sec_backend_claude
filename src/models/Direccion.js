/**
 * ============================================================================
 * ARCHIVO: src/models/Direccion.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Modelo Sequelize para la tabla direcciones
 *              Direcciones normalizadas con soporte dual:
 *              - Sistema de numeración municipal (números de puerta)
 *              - Sistema Manzana/Lote (AAHH y urbanizaciones informales)
 * ============================================================================
 *
 * PROPÓSITO:
 * - Normalizar y centralizar todas las direcciones del sistema
 * - Auto-asignar sector y cuadrante basado en la calle y número
 * - Soportar geocodificación (coordenadas GPS)
 * - Llevar estadísticas de uso (direcciones más frecuentes)
 * - Facilitar análisis de puntos calientes (hot spots)
 *
 * RELACIONES:
 * - Muchos a Uno con Calle (una dirección pertenece a una calle)
 * - Muchos a Uno con Cuadrante (auto-asignado basado en calle+número)
 * - Muchos a Uno con Sector (derivado del cuadrante)
 * - Muchos a Uno con Ubigeo (distrito)
 * - Uno a Muchos con Novedad (una dirección puede tener múltiples incidentes)
 *
 * SISTEMAS DE DIRECCIONAMIENTO SOPORTADOS:
 *
 * 1. NUMERACIÓN MUNICIPAL (Calles formales):
 *    - numero_municipal: "450", "250-A", "S/N"
 *    - Ejemplo: "Av. Ejército N° 450 Dpto. 201"
 *
 * 2. SISTEMA MANZANA/LOTE (AAHH, urbanizaciones informales):
 *    - manzana: "A", "B", "C", "01", "02"
 *    - lote: "1", "2", "15", "A"
 *    - Ejemplo: "Jr. Los Pinos Mz. B Lt. 15 - AAHH Villa El Salvador"
 *
 * 3. SISTEMA HÍBRIDO (Ambos):
 *    - Puede tener número municipal Y manzana/lote
 *    - Ejemplo: "Ca. Principal N° 100 Mz. C Lt. 8"
 *
 * VALIDACIÓN:
 * Debe tener AL MENOS uno de los dos sistemas:
 * - numero_municipal IS NOT NULL, O
 * - (manzana IS NOT NULL AND lote IS NOT NULL)
 *
 * CAMPO GENERADO:
 * - direccion_completa: Se genera automáticamente por trigger en BD
 *   Combina todos los componentes en formato legible
 *
 * AUTO-ASIGNACIÓN:
 * - cuadrante_id: Se asigna automáticamente basado en calle_id + numero_municipal
 * - sector_id: Se deriva del cuadrante (cuadrantes.sector_id)
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * @typedef {Object} Direccion
 * @property {number} id - ID único de la dirección
 * @property {string} direccion_code - Código único
 * @property {number} calle_id - FK a calles
 * @property {string} numero_municipal - Número de puerta
 * @property {string} manzana - Manzana (A, B, C)
 * @property {string} lote - Lote (1, 2, 3)
 * @property {string} direccion_completa - Dirección formateada
 * @property {number} cuadrante_id - Auto-asignado
 * @property {number} sector_id - Derivado del cuadrante
 */

/**
 * Modelo Direccion
 *
 * @description
 * Define el esquema de la tabla direcciones que almacena todas las
 * direcciones normalizadas del sistema con soporte para dos sistemas
 * de direccionamiento: numeración municipal y manzana/lote.
 *
 * @swagger
 * components:
 *   schemas:
 *     Direccion:
 *       type: object
 *       required:
 *         - direccion_code
 *         - calle_id
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la dirección
 *           example: 1
 *         direccion_code:
 *           type: string
 *           maxLength: 30
 *           description: Código único de dirección
 *           example: "DIR-20251223150530-001"
 *         calle_id:
 *           type: integer
 *           description: ID de la calle (FK)
 *           example: 5
 *         numero_municipal:
 *           type: string
 *           maxLength: 10
 *           description: Número de puerta (100, 250-A, S/N)
 *           example: "450"
 *         manzana:
 *           type: string
 *           maxLength: 10
 *           description: Manzana (A, B, C, 01, 02)
 *           example: "B"
 *         lote:
 *           type: string
 *           maxLength: 10
 *           description: Lote (1, 2, 3, A, B)
 *           example: "15"
 *         urbanizacion:
 *           type: string
 *           description: Urbanización, AAHH específico
 *           example: "AAHH Villa El Salvador"
 *         tipo_complemento:
 *           type: string
 *           enum: [DEPTO, OFICINA, PISO, INTERIOR, LOTE, MZ, BLOCK, TORRE, CASA]
 *           example: "DEPTO"
 *         numero_complemento:
 *           type: string
 *           description: Número del complemento
 *           example: "201"
 *         direccion_completa:
 *           type: string
 *           description: Dirección formateada (generada automáticamente)
 *           example: "Av. Ejército N° 450 Dpto. 201"
 *         cuadrante_id:
 *           type: integer
 *           description: Cuadrante asignado automáticamente
 *         sector_id:
 *           type: integer
 *           description: Sector derivado del cuadrante
 *         latitud:
 *           type: number
 *           format: float
 *           description: Coordenada de latitud
 *         longitud:
 *           type: number
 *           format: float
 *           description: Coordenada de longitud
 *         geocodificada:
 *           type: integer
 *           description: Indica si tiene coordenadas (1=Sí, 0=No)
 *         veces_usada:
 *           type: integer
 *           description: Contador de veces que se usó
 */
const Direccion = sequelize.define(
  "Direccion",
  {
    // ============================================================================
    // CLAVE PRIMARIA
    // ============================================================================
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID único de la dirección - Clave primaria auto-incremental",
    },

    // ============================================================================
    // IDENTIFICACIÓN DE LA DIRECCIÓN
    // ============================================================================
    direccion_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: {
        msg: "El código de dirección ya existe",
      },
      field: "direccion_code",
      comment: "Código único de dirección (D-XXXXXX)",
      validate: {
        notEmpty: {
          msg: "El código de dirección es requerido",
        },
        is: {
          args: /^D-\d{6}$/,
          msg: "El código debe tener el formato D-XXXXXX (6 dígitos)",
        },
      },
    },

    // ============================================================================
    // COMPONENTES BÁSICOS DE LA DIRECCIÓN
    // ============================================================================
    calle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "calle_id",
      comment: "FK a calles - Calle principal de la dirección",
      references: {
        model: "calles",
        key: "id",
      },
      validate: {
        isInt: true,
        min: 1,
      },
    },

    // ============================================================================
    // SISTEMA 1: NUMERACIÓN MUNICIPAL (Calles formales)
    // ============================================================================
    numero_municipal: {
      type: DataTypes.STRING(10),
      allowNull: true, // Puede ser null si usa sistema Mz/Lote
      field: "numero_municipal",
      comment: "Número de puerta (100, 250-A, S/N) - Sistema municipal",
      validate: {
        len: [1, 10],
      },
      // Ejemplos válidos: "450", "250-A", "1250", "S/N"
    },

    // ============================================================================
    // SISTEMA 2: MANZANA/LOTE (AAHH, urbanizaciones informales)
    // ============================================================================
    manzana: {
      type: DataTypes.STRING(10),
      allowNull: true, // Puede ser null si usa numeración municipal
      comment: "Manzana (A, B, C, 01, 02) - Sistema Mz/Lote",
      validate: {
        len: [1, 10],
      },
      // Ejemplos: "A", "B", "C", "01", "02", "MZ-A"
    },

    lote: {
      type: DataTypes.STRING(10),
      allowNull: true, // Puede ser null si usa numeración municipal
      comment: "Lote (1, 2, 3, A, B) - Sistema Mz/Lote",
      validate: {
        len: [1, 10],
      },
      // Ejemplos: "1", "2", "15", "A", "B", "LT-15"
    },

    // ============================================================================
    // COMPLEMENTOS ADICIONALES
    // ============================================================================
    urbanizacion: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Urbanización, AAHH, Vecindario específico",
      // Ejemplos: "AAHH Villa El Salvador", "Urbanización Los Rosales"
      // Se usa cuando la calle principal no tiene urbanización definida
    },

    tipo_complemento: {
      type: DataTypes.ENUM(
        "DEPTO",
        "OFICINA",
        "PISO",
        "INTERIOR",
        "LOTE",
        "MZ",
        "BLOCK",
        "TORRE",
        "CASA"
      ),
      allowNull: true,
      field: "tipo_complemento",
      comment: "Tipo de complemento de la dirección",
      // DEPTO: Departamento
      // OFICINA: Oficina
      // PISO: Piso
      // INTERIOR: Interior (casa interior)
      // LOTE: Lote específico
      // MZ: Manzana (cuando se usa como complemento)
      // BLOCK: Block o conjunto
      // TORRE: Torre de edificio
      // CASA: Casa específica en conjunto
    },

    numero_complemento: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "numero_complemento",
      comment: "Número del complemento (Dpto 201, Of. 5B, Piso 3)",
      validate: {
        len: [1, 20],
      },
      // Ejemplos: "201", "5B", "3", "A-102"
    },

    referencia: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Referencia adicional para ubicación",
      // Ejemplos: "Frente al parque", "Al costado de la bodega", "Segunda cuadra"
    },

    // ============================================================================
    // DIRECCIÓN COMPLETA (GENERADA AUTOMÁTICAMENTE)
    // ============================================================================
    direccion_completa: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "direccion_completa",
      comment: "Dirección legible completa - Generada por trigger en BD",
      // Se genera automáticamente combinando todos los componentes
      // Ejemplo: "Av. Ejército N° 450 Dpto. 201 (Frente al parque)"
      // Ejemplo: "Jr. Los Pinos Mz. B Lt. 15 - AAHH Villa El Salvador"
    },

    // ============================================================================
    // RELACIONES GEOGRÁFICAS (AUTO-ASIGNADAS)
    // ============================================================================
    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Se asigna automáticamente, puede ser null inicialmente
      field: "cuadrante_id",
      comment: "Cuadrante asignado automáticamente basado en calle+número",
      references: {
        model: "cuadrantes",
        key: "id",
      },
      // Se asigna automáticamente al crear/actualizar usando CallesCuadrantes
    },

    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Se deriva del cuadrante, puede ser null inicialmente
      field: "sector_id",
      comment: "Sector derivado del cuadrante (cuadrantes.sector_id)",
      references: {
        model: "sectores",
        key: "id",
      },
      // Se asigna automáticamente desde cuadrantes.sector_id
    },

    ubigeo_code: {
      type: DataTypes.CHAR(6),
      allowNull: true,
      field: "ubigeo_code",
      comment: "Código UBIGEO del distrito",
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
      validate: {
        len: [6, 6],
      },
    },

    // ============================================================================
    // GEOCODIFICACIÓN (COORDENADAS GPS)
    // ============================================================================
    latitud: {
      type: DataTypes.DECIMAL(10, 8), // Precisión: -90.00000000 a 90.00000000
      allowNull: true,
      comment: "Coordenada de latitud (GPS)",
      validate: {
        min: -90,
        max: 90,
      },
      // Ejemplo: -12.04637800 (Lima, Perú)
    },

    longitud: {
      type: DataTypes.DECIMAL(11, 8), // Precisión: -180.00000000 a 180.00000000
      allowNull: true,
      comment: "Coordenada de longitud (GPS)",
      validate: {
        min: -180,
        max: 180,
      },
      // Ejemplo: -77.03066400 (Lima, Perú)
    },

    geocodificada: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment:
        "1=Geocodificada (tiene coordenadas) | 0=Pendiente de geocodificar",
      validate: {
        isIn: [[0, 1]],
      },
    },

    fuente_geocodificacion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "fuente_geocodificacion",
      comment: "Fuente de las coordenadas (Google Maps, Manual, etc.)",
      // Ejemplos: "Google Maps API", "Manual", "GPS Device", "OpenStreetMap"
    },

    // ============================================================================
    // VALIDACIÓN EN CAMPO
    // ============================================================================
    verificada: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment:
        "1=Verificada en campo (confirmada físicamente) | 0=No verificada",
      validate: {
        isIn: [[0, 1]],
      },
    },

    fecha_verificacion: {
      type: DataTypes.DATEONLY, // Solo fecha, sin hora
      allowNull: true,
      field: "fecha_verificacion",
      comment: "Fecha de verificación en campo",
    },

    // ============================================================================
    // USO Y ESTADÍSTICAS
    // ============================================================================
    veces_usada: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "veces_usada",
      comment: "Contador de veces que se usó esta dirección en novedades",
      validate: {
        min: 0,
      },
      // Se incrementa automáticamente por trigger cuando se registra una novedad
    },

    ultima_vez_usada: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "ultima_vez_usada",
      comment: "Fecha y hora de último uso de la dirección",
      // Se actualiza automáticamente por trigger
    },

    // ============================================================================
    // METADATOS
    // ============================================================================
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones adicionales sobre la dirección",
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
        isIn: [[0, 1]],
      },
    },

    // ============================================================================
    // CAMPOS DE AUDITORÍA
    // ============================================================================
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
      comment: "Fecha y hora de creación",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by",
      comment: "ID del usuario que creó",
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
      comment: "Fecha y hora de actualización",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "updated_by",
      comment: "ID del usuario que actualizó",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
      comment: "Fecha de soft delete",
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "deleted_by",
      comment: "ID del usuario que eliminó",
    },
  },
  {
    // ============================================================================
    // CONFIGURACIÓN DEL MODELO
    // ============================================================================
    sequelize,
    tableName: "direcciones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
    comment:
      "Direcciones normalizadas con geocodificación (numeración municipal y Mz/Lote)",

    // ============================================================================
    // ÍNDICES
    // ============================================================================
    indexes: [
      { name: "uq_direccion_code", unique: true, fields: ["direccion_code"] },
      { name: "idx_dir_calle", fields: ["calle_id"] },
      { name: "idx_dir_cuadrante", fields: ["cuadrante_id"] },
      { name: "idx_dir_sector", fields: ["sector_id"] },
      { name: "idx_dir_ubigeo", fields: ["ubigeo_code"] },
      { name: "idx_dir_urbanizacion", fields: ["urbanizacion"] },
      { name: "idx_dir_geocodificada", fields: ["geocodificada"] },
      { name: "idx_dir_verificada", fields: ["verificada"] },
      { name: "idx_dir_coords", fields: ["latitud", "longitud"] },
      { name: "idx_dir_manzana_lote", fields: ["manzana", "lote"] },
    ],
  }
);

// ============================================================================
// MÉTODOS DE INSTANCIA
// ============================================================================

/**
 * Verifica si la dirección usa numeración municipal
 */
Direccion.prototype.usaNumeracionMunicipal = function () {
  return this.numero_municipal !== null && this.numero_municipal !== "";
};

/**
 * Verifica si la dirección usa sistema Mz/Lote
 */
Direccion.prototype.usaSistemaMzLote = function () {
  return (
    this.manzana !== null &&
    this.manzana !== "" &&
    this.lote !== null &&
    this.lote !== ""
  );
};

/**
 * Verifica si está geocodificada
 */
Direccion.prototype.tieneCoordenadas = function () {
  return this.latitud !== null && this.longitud !== null;
};

// ============================================================================
// MÉTODOS DE CLASE
// ============================================================================

/**
 * Genera un código único de dirección
 */
/**
 * Genera el siguiente código de dirección secuencial
 * Formato: D-XXXXXX (6 dígitos con padding de ceros)
 *
 * @returns {Promise<string>} Código en formato D-XXXXXX
 * @example
 * - Primera dirección: D-000001
 * - Dirección #123: D-000123
 * - Dirección #999,999: D-999999
 *
 * Capacidad: Hasta 999,999 direcciones
 */
Direccion.generarCodigo = async function () {
  const { Op } = await import("sequelize");

  try {
    // Buscar la última dirección creada (incluyendo eliminadas para evitar duplicados)
    const ultimaDireccion = await Direccion.findOne({
      where: {
        direccion_code: {
          [Op.like]: 'D-%'
        }
      },
      order: [['direccion_code', 'DESC']],
      paranoid: false // Incluir soft-deleted
    });

    let nuevoSecuencial = 1;

    if (ultimaDireccion && ultimaDireccion.direccion_code) {
      // Extraer el número del código: "D-000123" → "000123" → 123
      const match = ultimaDireccion.direccion_code.match(/D-(\d+)$/);
      if (match) {
        nuevoSecuencial = parseInt(match[1], 10) + 1;
      }
    }

    // Validar que no exceda la capacidad
    if (nuevoSecuencial > 999999) {
      throw new Error('Se ha alcanzado el límite máximo de direcciones (999,999)');
    }

    // Formatear con padding de 6 dígitos
    const codigo = `D-${String(nuevoSecuencial).padStart(6, '0')}`;

    console.log(`📋 Código de dirección generado: ${codigo}`);
    return codigo;

  } catch (error) {
    console.error('❌ Error al generar código de dirección:', error);
    throw error;
  }
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================
export default Direccion;
