/**
 * Ruta: src/models/Novedad.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'novedades_incidentes' de la base de datos.
 * Registra las ocurrencias de sucesos dentro del sistema de seguridad ciudadana.
 *
 * Características:
 * - Código único de identificación novedad_code
 * - Relación con tipo y subtipo de novedades
 * - Datos de la ubicación de la ocurrencia (sector, cuadrante)
 * - Soft delete para auditoría
 * - Generación automática de códigos
 *
 * Relaciones:
 * - Pertenece a un TipoNovedad (Many-to-One)
 * - Puede estar asignado a Vehiculo (One-to-Many)
 * - Tiene registros de Abastecimiento (One-to-Many)
 *
 * @module models/Vehiculo
 * @requires sequelize
 * @requires config/database
 */

import { DataTypes } from "sequelize";

import sequelize from "../config/database.js";

const Novedad = sequelize.define(
  "Novedad",
  {
    // ============================================
    // IDENTIFICACIÓN
    // ============================================

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    /**
     * Foreign Key al cuadrante
     * Ejemplo:
     */
    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cuadrantes",
        key: "id",
      },
      comment: "ID del cuadrante",
    },

    /**
     * Foreign Key al estado de la novedad
     * Ejemplo: NUEVO, DESPACHADO, EN RUTA, EN LUGAR, EN ATENCION, RESUELTO, CERRADO, CANCELADO, DERIVADO
     */
    estado_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "estados_novedad",
        key: "id",
      },
      comment: "ID del estado de la novedad",
    },

    personal_cargo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
      comment: "ID del personal de seguridad asignado",
    },

    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sectores",
        key: "id",
      },
      comment: "ID del sector donde ocurrió la novedad",
    },

    subtipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "subtipos_novedad",
        key: "id",
      },
      comment: "ID del subtipo de novedad",
    },
    tipo_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tipos_novedad",
        key: "id",
      },
      comment: "ID del tipo de novedad",
    },

    ubigeo: {
      type: DataTypes.STRING(6),
      allowNull: false,
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
      comment: "Código UBIGEO de la ubicación",
    },

    unidad_oficina_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "unidades_oficina",
        key: "id",
      },
      comment: "ID de la unidad u oficina asignada",
    },

    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "vehiculos",
        key: "id",
      },
      comment: "ID del vehículo asignado",
    },

    /**
     * Código único de la novedad/incidente
     */
    novedad_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      comment: "Código identificador de la novedad/incidente",
    },

    /**
     * Nombre o denominación del vehículo
     * Ejemplo: 'Móvil 01', 'Moto Patrullero'
     */
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Fecha y hora de la novedad",
    },

    /**
     * Ruta donde se guarda la foto o evidencia asociada
     *
     */
    tipo_icono_novedad: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Icono identifica grupo de la novedad",
    },

    /**
     * Texto de la localización o dirección aproximada
     * Ejemplo: Las Totoritas 123, Urb. Los Jardines
     */
    localizacion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Ubicacion textual de la novedad",
    },

    referencia: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Referencia adicional de la ubicación",
    },

    // Latitud donde ocurrió la novedad: decimal(10, 8)
    latitud: {
      // 💡 DataTypes.DECIMAL(Precision, Scale)
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: "Coordenada de latitud",
    },

    // Longitud donde ocurrió la novedad: decimal(11, 8)
    longitud: {
      // 💡 DataTypes.DECIMAL(Precision, Scale)
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: "Coordenada de longitud",
    },

    // Identificar el origen de la llamada o alerta
    origen_llamada: {
      type: DataTypes.ENUM(
        "TELEFONO_107",
        "BOTON_PANICO",
        "CAMARA",
        "PATRULLAJE",
        "CIUDADANO",
        "INTERVENCION_DIRECTA",
        "OTROS"
      ),
      allowNull: true,
      comment: "Origen de la llamada o alerta",
    },

    reportante_nombre: {
      // VARCHAR(150)
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Nombre de la persona que reporta",
    },
    reportante_telefono: {
      // VARCHAR(20)
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Teléfono del reportante",
    },
    reportante_dni: {
      // VARCHAR(20)
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "DNI/Identificación del reportante",
    },

    fecha_despacho: {
      // DATETIME
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora del despacho de la unidad",
    },
    fecha_llegada: {
      // DATETIME
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora de llegada al punto de la novedad",
    },
    fecha_cierre: {
      // DATETIME
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora de cierre y finalización del incidente",
    },

    km_inicial: {
      // DECIMAL(8, 2)
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: "Kilometraje inicial de la unidad al despachar",
    },
    km_final: {
      // DECIMAL(8, 2)
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: "Kilometraje final de la unidad al cerrar",
    },
    tiempo_respuesta_min: {
      // INT
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Tiempo de respuesta en minutos (cálculo)",
    },

    turno: {
      // 💡 DataTypes.ENUM con los valores del turno
      type: DataTypes.ENUM("MAÑANA", "TARDE", "NOCHE"),
      allowNull: true,
      comment: "Turno del operador o del momento del incidente",
    },

    parte_adjunto: {
      // VARCHAR(255)
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Ruta del adjunto principal o documento",
    },
    fotos_adjuntas: {
      // JSON
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Lista o array de rutas de fotos adjuntas",
    },
    videos_adjuntos: {
      // JSON
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Lista o array de rutas de videos adjuntos",
    },

    prioridad_actual: {
      type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
      allowNull: true,
      comment: "Prioridad actual de la novedad",
    },

    /**
     * Eliminación lógica
     */
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ============================================
    // AUDITORÍA
    // ============================================

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "novedades_incidentes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        unique: true,
        fields: ["novedad_code"],
      },
      {
        unique: true,
        fields: ["fecha_hora"],
      },
      {
        fields: ["estado_novedad_id"],
      },
      {
        // Índice compuesto
        fields: ["tipo_novedad_id", "subtipo_novedad_id"],
      },
      {
        // Índice compuesto
        fields: ["sector_id", "cuadrante_id"],
      },
      {
        // Índice compuesto
        fields: ["latitud", "longitud"],
      },
      {
        fields: ["prioridad_actual"],
      },
      {
        fields: ["fecha_hora", "estado_novedad_id"],
      },
      {
        fields: ["ubigeo"],
      },
      {
        fields: ["tipo_novedad_id"],
      },
      {
        fields: ["subtipo_novedad_id"],
      },
      {
        fields: ["estado_novedad_id"],
      },
      {
        fields: ["sector_id"],
      },
      {
        fields: ["cuadrante_id"],
      },
      {
        fields: ["unidad_oficina_id"],
      },
      {
        fields: ["personal_cargo_id"],
      },
    ],

    hooks: {
      /**
       * Antes de crear:
       */
      beforeCreate: async (novedad) => {},

      /**
       * Antes de actualizar:
       */
      beforeUpdate: (novedad) => {},
    },
  }
);

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener novedades activas
 */
Novedad.findActivos = async function () {
  return await Novedad.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "tipo",
        attributes: ["id", "nombre"],
      },
    ],
    order: [["novedad_code", "ASC"]],
  });
};

/**
 * Buscar por Nro. Novedad (novedad_code)
 */
Novedad.findByNovedadCode = async function (novedad_code) {
  return await Novedad.findOne({
    where: {
      novedad_code: novedad_code.toUpperCase(),
      deleted_at: null,
    },
    /*
    include: [
      {
        association: "tipo",
      },
    ],*/
  });
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Soft delete
 */
Novedad.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

export default Novedad;
import sequelize from "../config/database.js";
