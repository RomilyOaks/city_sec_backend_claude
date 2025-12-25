/**
 * ============================================================================
 * ARCHIVO: src/models/Calle.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Modelo Sequelize para la tabla calles
 *              Maestro principal de todas las calles del distrito
 * ============================================================================
 *
 * PROPÓSITO:
 * - Almacenar información completa de todas las calles del distrito
 * - Gestionar características físicas y técnicas de las vías
 * - Relacionar calles con tipos de vía, ubicación geográfica y cuadrantes
 * - Soportar tanto calles con numeración municipal como AAHH
 *
 * RELACIONES:
 * - Muchos a Uno con TipoVia (una calle pertenece a un tipo de vía)
 * - Muchos a Uno con Ubigeo (una calle pertenece a un distrito)
 * - Muchos a Muchos con Cuadrante (a través de CallesCuadrantes)
 * - Uno a Muchos con Direccion (una calle tiene muchas direcciones)
 *
 * CAMPOS IMPORTANTES:
 * - nombre_completo: Se genera automáticamente por trigger BD
 *   Ejemplo: tipo_via="Av" + nombre_via="Ejército" → "Av. Ejército"
 * - urbanizacion: Permite diferenciar calles con mismo nombre en distintas zonas
 *   Ejemplo: "Calle 1" en "AAHH Villa El Salvador" vs "Calle 1" en "Urb. Los Rosales"
 * - calle_code: Código único interno para identificación rápida (C001, C002, etc.)
 *
 * CASOS DE USO:
 * 1. Registro de calle formal: Av. Arequipa (con numeración municipal)
 * 2. Registro de calle en AAHH: Calle Principal AAHH Villa María
 * 3. Búsqueda de calles por nombre (autocomplete en frontend)
 * 4. Asignación de cuadrantes a tramos de calles
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * @typedef {Object} Calle
 * @property {number} id - ID único de la calle
 * @property {string} calle_code - Código único (C001, C002)
 * @property {number} tipo_via_id - FK a tipos_via
 * @property {string} nombre_via - Nombre de la vía
 * @property {string} nombre_completo - Nombre completo generado
 * @property {string} urbanizacion - Urbanización, AAHH
 * @property {string} categoria_via - ARTERIAL, COLECTORA, LOCAL, RESIDENCIAL
 */

/**
 * Modelo Calle
 *
 * @description
 * Define el esquema de la tabla calles que almacena el maestro
 * de todas las calles del distrito, incluyendo características
 * físicas, ubicación y referencias geográficas.
 *
 * @swagger
 * components:
 *   schemas:
 *     Calle:
 *       type: object
 *       required:
 *         - calle_code
 *         - tipo_via_id
 *         - nombre_via
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la calle
 *           example: 1
 *         calle_code:
 *           type: string
 *           maxLength: 20
 *           description: Código único de la calle
 *           example: "C001"
 *         tipo_via_id:
 *           type: integer
 *           description: ID del tipo de vía (FK)
 *           example: 1
 *         nombre_via:
 *           type: string
 *           maxLength: 200
 *           description: Nombre de la vía
 *           example: "Ejército"
 *         nombre_completo:
 *           type: string
 *           maxLength: 250
 *           description: Nombre completo (generado automáticamente)
 *           example: "Av. Ejército"
 *         urbanizacion:
 *           type: string
 *           maxLength: 150
 *           description: Urbanización, AAHH, Vecindario
 *           example: "AAHH Villa El Salvador"
 *         categoria_via:
 *           type: string
 *           enum: [ARTERIAL, COLECTORA, LOCAL, RESIDENCIAL]
 *           description: Categoría de la vía
 *           example: "ARTERIAL"
 *         es_principal:
 *           type: integer
 *           description: Indica si es vía principal (1=Sí, 0=No)
 *           example: 1
 *         tipo_pavimento:
 *           type: string
 *           enum: [ASFALTO, CONCRETO, AFIRMADO, TROCHA, ADOQUIN, SIN_PAVIMENTO]
 *         longitud_metros:
 *           type: number
 *           description: Longitud aproximada en metros
 *         estado:
 *           type: integer
 *           description: Estado del registro (1=Activo, 0=Inactivo)
 */
const Calle = sequelize.define(
  "Calle",
  {
    // ============================================================================
    // CLAVE PRIMARIA
    // ============================================================================
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID único de la calle - Clave primaria auto-incremental",
    },

    // ============================================================================
    // IDENTIFICACIÓN DE LA CALLE
    // ============================================================================
    calle_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true, // Garantiza códigos únicos
      field: "calle_code",
      comment:
        "Código único de calle (C001, C002) - Para identificación interna",
      validate: {
        notEmpty: true,
        len: [3, 20],
      },
    },

    tipo_via_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "tipo_via_id",
      comment: "FK a tipos_via - Define si es Av., Jr., Ca., etc.",
      references: {
        model: "tipos_via", // Nombre de la tabla referenciada
        key: "id",
      },
      validate: {
        isInt: true,
        min: 1,
      },
    },

    nombre_via: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "nombre_via",
      comment: "Nombre de la vía (Ejército, Garcilaso, Los Pinos)",
      validate: {
        notEmpty: true,
        len: [2, 200],
      },
    },

    nombre_completo: {
      type: DataTypes.STRING(250),
      allowNull: true, // Se genera automáticamente por trigger en BD
      field: "nombre_completo",
      comment: 'Nombre completo (ej: "Av. Ejército") - Generado por trigger BD',
    },

    // ============================================================================
    // UBICACIÓN GEOGRÁFICA
    // ============================================================================
    ubigeo_code: {
      type: DataTypes.CHAR(6),
      allowNull: true, // Opcional
      field: "ubigeo_code",
      comment: "Código UBIGEO del distrito - Para ubicación administrativa",
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
      validate: {
        len: [6, 6], // Exactamente 6 caracteres
      },
    },

    urbanizacion: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment:
        "Urbanización, AAHH, Vecindario - Para diferenciar calles con mismo nombre",
    },

    zona: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Zona general (opcional) - Para clasificación adicional",
    },

    // ============================================================================
    // CARACTERÍSTICAS FÍSICAS DE LA CALLE
    // ============================================================================
    longitud_metros: {
      type: DataTypes.DECIMAL(8, 2), // Hasta 999,999.99 metros
      allowNull: true,
      field: "longitud_metros",
      comment: "Longitud aproximada en metros",
      validate: {
        min: 0,
      },
    },

    ancho_metros: {
      type: DataTypes.DECIMAL(5, 2), // Hasta 999.99 metros
      allowNull: true,
      field: "ancho_metros",
      comment: "Ancho promedio de la vía en metros",
      validate: {
        min: 0,
      },
    },

    tipo_pavimento: {
      type: DataTypes.ENUM(
        "ASFALTO",
        "CONCRETO",
        "AFIRMADO",
        "TROCHA",
        "ADOQUIN",
        "SIN_PAVIMENTO"
      ),
      allowNull: true,
      field: "tipo_pavimento",
      comment: "Tipo de pavimento de la vía",
    },

    sentido_via: {
      type: DataTypes.ENUM("UNA_VIA", "DOBLE_VIA", "VARIABLE"),
      defaultValue: "DOBLE_VIA", // Valor por defecto
      field: "sentido_via",
      comment: "Sentido de circulación de la vía",
    },

    carriles: {
      type: DataTypes.TINYINT, // 0-255
      allowNull: true,
      comment: "Número de carriles de la vía",
      validate: {
        min: 0,
        max: 20, // Límite razonable
      },
    },

    // ============================================================================
    // INTERSECCIONES (REFERENCIAS)
    // ============================================================================
    interseccion_inicio: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "interseccion_inicio",
      comment: "Calle que cruza al inicio - Para referencia de ubicación",
    },

    interseccion_fin: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "interseccion_fin",
      comment: "Calle que cruza al final - Para referencia de ubicación",
    },

    // ============================================================================
    // GEOMETRÍA (OPCIONAL PARA MAPAS AVANZADOS)
    // ============================================================================
    linea_geometria_json: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "linea_geometria_json",
      comment:
        "Coordenadas LineString en formato GeoJSON - Para trazado en mapas",
      // Ejemplo: { "type": "LineString", "coordinates": [[lon1,lat1], [lon2,lat2]] }
    },

    // ============================================================================
    // METADATOS Y CLASIFICACIÓN
    // ============================================================================
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones adicionales sobre la calle",
    },

    es_principal: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: "es_principal",
      comment: "1=Vía principal (arterial) | 0=Vía secundaria",
      validate: {
        isIn: [[0, 1]],
      },
    },

    categoria_via: {
      type: DataTypes.ENUM("ARTERIAL", "COLECTORA", "LOCAL", "RESIDENCIAL"),
      defaultValue: "LOCAL",
      field: "categoria_via",
      comment: "Clasificación vial según importancia",
      // ARTERIAL: Vías principales (Av. Arequipa, Av. Javier Prado)
      // COLECTORA: Vías que conectan arteriales con locales
      // LOCAL: Vías dentro de zonas residenciales/comerciales
      // RESIDENCIAL: Vías exclusivamente residenciales
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
      comment: "Fecha y hora de creación del registro",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by",
      comment: "ID del usuario que creó el registro",
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
      comment: "Fecha y hora de última actualización",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "updated_by",
      comment: "ID del usuario que actualizó el registro",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
      comment: "Fecha de eliminación lógica (soft delete)",
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
    sequelize,
    tableName: "calles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // Habilita soft delete
    deletedAt: "deleted_at",
    comment: "Maestro de calles del distrito",

    // ============================================================================
    // ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
    // ============================================================================
    indexes: [
      {
        name: "uq_calle_code",
        unique: true,
        fields: ["calle_code"],
      },
      {
        // Índice único compuesto: previene duplicados de "Av. Arequipa" en misma urbanización
        name: "uq_tipo_nombre_via",
        unique: true,
        fields: ["tipo_via_id", "nombre_via", "urbanizacion"],
      },
      {
        name: "idx_calles_ubigeo",
        fields: ["ubigeo_code"],
      },
      {
        name: "idx_calles_urbanizacion",
        fields: ["urbanizacion"],
      },
      {
        name: "idx_calles_zona",
        fields: ["zona"],
      },
      {
        name: "idx_calles_estado",
        fields: ["estado"],
      },
      {
        // Índice para búsquedas por nombre (autocomplete)
        name: "idx_calles_nombre",
        fields: ["nombre_via"],
      },
      {
        // Índice para filtrar vías principales
        name: "idx_calles_principal",
        fields: ["es_principal"],
      },
    ],
  }
);

// ============================================================================
// MÉTODOS DE INSTANCIA
// ============================================================================

/**
 * Verifica si la calle está activa
 * @returns {boolean} true si está activa
 */
Calle.prototype.isActiva = function () {
  return this.estado === 1 && !this.deleted_at;
};

/**
 * Verifica si es una vía principal
 * @returns {boolean} true si es vía principal
 */
Calle.prototype.isPrincipal = function () {
  return this.es_principal === 1;
};

/**
 * Obtiene el nombre completo con urbanización si existe
 * @returns {string} Nombre completo formateado
 */
Calle.prototype.getNombreConUrbanizacion = function () {
  if (this.urbanizacion) {
    return `${this.nombre_completo} - ${this.urbanizacion}`;
  }
  return this.nombre_completo;
};

// ============================================================================
// MÉTODOS DE CLASE (ESTÁTICOS)
// ============================================================================

/**
 * Busca calles activas por nombre (para autocomplete)
 * @param {string} query - Texto a buscar
 * @param {number} limit - Límite de resultados (default: 20)
 * @returns {Promise<Array>} Lista de calles encontradas
 */
Calle.buscarPorNombre = async function (query, limit = 20) {
  return await this.findAll({
    where: {
      nombre_via: {
        [Op.like]: `%${query}%`,
      },
      estado: 1,
      deleted_at: null,
    },
    include: [
      {
        model: sequelize.models.TipoVia,
        as: "tipoVia",
        attributes: ["abreviatura", "nombre"],
      },
    ],
    order: [
      ["es_principal", "DESC"],
      ["nombre_via", "ASC"],
    ],
    limit: limit,
  });
};

/**
 * Obtiene calles de una urbanización específica
 * @param {string} urbanizacion - Nombre de la urbanización
 * @returns {Promise<Array>} Lista de calles
 */
Calle.porUrbanizacion = async function (urbanizacion) {
  return await this.findAll({
    where: {
      urbanizacion: {
        [Op.like]: `%${urbanizacion}%`, // ✅ Búsqueda flexible
      },
      estado: 1,
      deleted_at: null,
    },
    order: [["nombre_via", "ASC"]],
  });
};

// ============================================================================
// EXPORTACIÓN DEL MODELO
// ============================================================================
export default Calle;

/**
 * NOTAS DE USO:
 *
 * 1. CREAR NUEVA CALLE:
 *    const calle = await Calle.create({
 *      calle_code: 'C001',
 *      tipo_via_id: 1,
 *      nombre_via: 'Ejército',
 *      categoria_via: 'ARTERIAL',
 *      es_principal: 1,
 *      created_by: usuarioId
 *    });
 *
 * 2. BUSCAR CALLES (AUTOCOMPLETE):
 *    const calles = await Calle.buscarPorNombre('ejer');
 *
 * 3. CALLES DE UNA URBANIZACIÓN:
 *    const calles = await Calle.porUrbanizacion('AAHH Villa El Salvador');
 *
 * 4. SOFT DELETE:
 *    await calle.destroy(); // Marca deleted_at
 *    await calle.restore(); // Restaura el registro
 */
