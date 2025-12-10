/**
 * ============================================
 * MODELO: NOVEDAD (INCIDENTE)
 * Ruta: src/models/Novedad.js
 * ============================================
 *
 * Modelo principal para gestión de novedades/incidentes de seguridad
 *
 * Relaciones:
 * - Pertenece a TipoNovedad
 * - Pertenece a SubtipoNovedad
 * - Pertenece a EstadoNovedad
 * - Pertenece a Usuario (reportado_por)
 * - Pertenece a UnidadOficina (unidad_asignada)
 * - Pertenece a Vehiculo (vehiculo_asignado)
 * - Pertenece a Ubigeo (ubicación)
 * - Tiene muchos HistorialEstadoNovedad
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
      comment: "ID único de la novedad",
    },

    novedad_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Código único de la novedad (ej: NOV-2024-00001)",
    },
    // ============================================
    // INFORMACIÓN TEMPORAL
    // ============================================
    fecha_hora_ocurrencia: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Fecha y hora en que ocurrió el incidente",
    },

    fecha_hora_reporte: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora en que se reportó",
    },

    fecha_hora_cierre: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora de cierre del caso",
    },

    // ============================================
    // CLASIFICACIÓN
    // ============================================
    tipo_novedad_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "ID del tipo de novedad",
      references: {
        model: "tipos_novedad",
        key: "id",
      },
    },

    subtipo_novedad_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "ID del subtipo de novedad",
      references: {
        model: "subtipos_novedad",
        key: "id",
      },
    },
    estado_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // Estado inicial: "NUEVO" Recién creado
      comment: "ID del estado actual de la novedad",
      references: {
        model: "estados_novedad",
        key: "id",
      },
    },

    // ============================================
    // UBICACIÓN
    // ============================================
    sector_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Sector donde ocurrió",
      references: {
        model: "sectores",
        key: "id",
      },
    },
    cuadrante_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Cuadrante donde ocurrió",
      references: {
        model: "cuadrantes",
        key: "id",
      },
    },

    localizacion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción textual del lugar del incidente",
    },

    referencia_ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Referencia adicional de ubicación",
    },

    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: "Latitud GPS",
    },

    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: "Longitud GPS",
    },

    ubigeo_code: {
      type: DataTypes.CHAR(6),
      allowNull: true,
      comment: "Código de ubigeo (departamento-provincia-distrito)",
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
    },

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
      comment: "Gravedad del incidente",
    },
    // ============================================
    // PERSONAS INVOLUCRADAS
    // ============================================
    reportante_nombre: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Nombre del reportante (si no es anónimo)",
    },

    reportante_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Teléfono del reportante",
    },

    reportante_doc_identidad: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: "DNI o documento de identidad del reportante",
    },

    es_anonimo: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: "Indica si el reporte es anónimo",
    },

    // ============================================
    // DESCRIPCIÓN Y OBSERVACIONES
    // ============================================
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Descripción detallada del incidente",
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones adicionales",
    },

    // ============================================
    // PRIORIDAD Y GRAVEDAD
    // ============================================
    prioridad_actual: {
      type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
      allowNull: false,
      defaultValue: "media",
      comment: "Nivel de prioridad del incidente",
    },

    gravedad: {
      type: DataTypes.ENUM("LEVE", "MODERADA", "GRAVE", "MUY_GRAVE"),
      allowNull: true,
      comment: "Gravedad del incidente",
    },

    // ============================================
    // ASIGNACIÓN DE RECURSOS
    // ============================================
    usuario_registro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Usuario que registró la novedad",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    unidad_oficina_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Unidad/Oficina asignada",
      references: {
        model: "unidades_oficinas",
        key: "id",
      },
    },

    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Vehículo asignado",
      references: {
        model: "vehiculos",
        key: "id",
      },
    },

    personal_cargo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment:
        "Personal Seguridad #1 responsable asistió operativo,incidente. Hay otros 3 campos mas similares",
    },
    personal_seguridad2_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Personal Seguridad que asistió al Operativo,Incidente",
    },
    personal_seguridad3_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Personal Seguridad que asistió al Operativo,Incidente",
    },
    personal_seguridad4_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Personal Seguridad que asistió al Operativo,Incidente",
    },
    // ============================================
    // SEGUIMIENTO
    // ============================================
    requiere_seguimiento: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica si requiere seguimiento",
    },

    tiempo_respuesta_minutos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Tiempo de respuesta en minutos",
    },

    tiempo_resolucion_horas: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Tiempo total de resolución en horas",
    },

    fecha_proxima_revision: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha programada para próxima revisión",
    },

    // ============================================
    // ARCHIVOS ADJUNTOS
    // ============================================
    parte_adjuntos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array de rutas de archivos adjuntos",
    },

    fotos_adjuntas: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array de URLs de fotos",
    },

    videos_adjuntos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array de URLs de videos",
    },
    // ============================================
    // ESTADÍSTICAS Y MÉTRICAS
    // ============================================
    num_personas_afectadas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Número de personas afectadas",
    },

    perdidas_materiales_estimadas: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Estimación de pérdidas en soles",
    },

    // ============================================
    // AUDITORÍA
    // ============================================
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Usuario que creó el registro",
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Último usuario que modificó",
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Usuario que eliminó",
    },
  },
  {
    tableName: "novedades_incidentes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // Habilita soft delete
    deletedAt: "deleted_at",
    indexes: [
      {
        name: "uq_novedad_code",
        fields: ["novedad_code"],
      },
      {
        name: "idx_fecha_hora_ocurrencia",
        fields: ["fecha_hora_ocurrencia"],
      },
      {
        name: "idx_novedad_estado",
        fields: ["estado_novedad_id"],
      },
      {
        name: "idx_tipo_subtipo",
        fields: ["tipo_novedad_id", "subtipo_novedad_id"],
      },
      {
        name: "idx_sector_cuadrante",
        fields: ["sector_id", "cuadrante_id"],
      },
      {
        name: "idx_ubicacion",
        fields: ["latitud", "longitud"],
      },
      {
        name: "idx_fecha_estado",
        fields: ["fecha_hora_ocurrencia", "estado_novedad_id"],
      },
      {
        name: "idx_novedad_ubigeo",
        fields: ["ubigeo_code"],
      },

      {
        name: "idx_novedad_sector",
        fields: ["sector_id"],
      },
      {
        name: "idx_novedad_cuadrante",
        fields: ["cuadrante_id"],
      },
      {
        name: "idx_novedad_unidad",
        fields: ["unidad_oficina_id"],
      },
      {
        name: "idx_novedad_vehiculo",
        fields: ["vehiculo_id"],
      },
      {
        name: "idx_novedad_personal",
        fields: ["personal_cargo_id"],
      },
      {
        name: "idx_novedad_personal2",
        fields: ["personal_seguridad2_id"],
      },
      {
        name: "idx_novedad_personal3",
        fields: ["personal_seguridad3_id"],
      },
      {
        name: "idx_novedad_personal4",
        fields: ["personal_seguridad4_id"],
      },
      {
        name: "idx_novedad_usuario",
        fields: ["usuario_registro"],
      },
    ],
    comment: "Tabla de novedades/incidentes de seguridad ciudadana",
  }
);

/**
 * ============================================
 * ASOCIACIONES DEL MODELO NOVEDAD
 * Agregar este método static al modelo Novedad
 * ============================================
 */

// Agregar DESPUÉS de la definición del modelo, ANTES del export
Novedad.associate = function (models) {
  // Relación con TipoNovedad (Muchos a Uno)
  Novedad.belongsTo(models.TipoNovedad, {
    foreignKey: "tipo_novedad_id",
    as: "tipo", // 🔥 Usado en los controladores
  });

  // Relación con SubtipoNovedad (Muchos a Uno)
  Novedad.belongsTo(models.SubtipoNovedad, {
    foreignKey: "subtipo_novedad_id",
    as: "subtipo", // 🔥 Usado en los controladores
  });

  // Relación con EstadoNovedad (Muchos a Uno)
  // 🔥 CRÍTICO: El alias debe ser "estadoNovedad" para coincidir con el controlador
  Novedad.belongsTo(models.EstadoNovedad, {
    foreignKey: "estado_novedad_id",
    as: "estadoNovedad", // 🔥 IMPORTANTE: Usar "estadoNovedad", no "estado"
  });

  // Relación con Sector (Muchos a Uno)
  Novedad.belongsTo(models.Sector, {
    foreignKey: "sector_id",
    as: "novedades_sector",
  });

  // Relación con Cuadrante (Muchos a Uno)
  Novedad.belongsTo(models.Cuadrante, {
    foreignKey: "cuadrante_id",
    as: "novedades_cuadrante",
  });

  // Relación con UnidadOficina (Muchos a Uno)
  Novedad.belongsTo(models.UnidadOficina, {
    foreignKey: "unidad_oficina_id",
    as: "novedades_unidad",
  });

  // Relación con Vehiculo (Muchos a Uno)
  Novedad.belongsTo(models.Vehiculo, {
    foreignKey: "vehiculo_id",
    as: "novedades_vehiculo",
  });

  // Relación con PersonalSeguridad - Personal a cargo (Muchos a Uno)
  Novedad.belongsTo(models.PersonalSeguridad, {
    foreignKey: "personal_cargo_id",
    as: "novedades_personal", // 🔥 Alias principal para personal
  });

  // Relación con PersonalSeguridad #2 (Muchos a Uno)
  Novedad.belongsTo(models.PersonalSeguridad, {
    foreignKey: "personal_seguridad2_id",
    as: "novedades_personal2",
  });

  // Relación con PersonalSeguridad #3 (Muchos a Uno)
  Novedad.belongsTo(models.PersonalSeguridad, {
    foreignKey: "personal_seguridad3_id",
    as: "novedades_personal3",
  });

  // Relación con PersonalSeguridad #4 (Muchos a Uno)
  Novedad.belongsTo(models.PersonalSeguridad, {
    foreignKey: "personal_seguridad4_id",
    as: "novedades_personal4",
  });

  // Relación de Usuario con PersonalSeguridad (Muchos a Uno)
  Novedad.belongsTo(models.PersonalSeguridad, {
    foreignKey: "usuario_registro",
    as: "novedades_usuario_registro",
  });

  // Relación con Ubigeo (Muchos a Uno)
  Novedad.belongsTo(models.Ubigeo, {
    foreignKey: "ubigeo_code",
    targetKey: "ubigeo_code",
    as: "novedades_ubigeo",
  });

  // Relación con Usuario - Creador (Muchos a Uno)
  Novedad.belongsTo(models.Usuario, {
    foreignKey: "created_by",
    as: "novedades_creador",
  });

  // Relación con Usuario - Actualizador (Muchos a Uno)
  Novedad.belongsTo(models.Usuario, {
    foreignKey: "updated_by",
    as: "novedades_actualizador",
  });

  // Relación con Usuario - Eliminador (Muchos a Uno)
  Novedad.belongsTo(models.Usuario, {
    foreignKey: "deleted_by",
    as: "novedades_eliminador",
  });

  // Relación con HistorialEstadoNovedad (Uno a Muchos)
  Novedad.hasMany(models.HistorialEstadoNovedad, {
    foreignKey: "novedad_id",
    as: "novedades_historialEstados",
  });
};

// Al final del archivo, antes del export:
export default Novedad;
