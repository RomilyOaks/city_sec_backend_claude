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
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1, // Estado inicial: "Registrado"
      comment: "ID del estado actual de la novedad",
      references: {
        model: "estados_novedad",
        key: "id",
      },
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
    // UBICACIÓN
    // ============================================
    ubigeo_code: {
      type: DataTypes.CHAR(6),
      allowNull: true,
      comment: "Código de ubigeo (departamento-provincia-distrito)",
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
    },

    direccion: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: "Dirección exacta del incidente",
    },

    referencia: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Referencia de ubicación",
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

    // ============================================
    // DESCRIPCIÓN
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
    prioridad: {
      type: DataTypes.ENUM("baja", "media", "alta", "critica"),
      allowNull: false,
      defaultValue: "media",
      comment: "Nivel de prioridad del incidente",
    },

    gravedad: {
      type: DataTypes.ENUM("leve", "moderada", "grave", "muy_grave"),
      allowNull: true,
      comment: "Gravedad del incidente",
    },

    // ============================================
    // PERSONAS INVOLUCRADAS
    // ============================================
    nombre_denunciante: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Nombre de quien reporta",
    },

    telefono_denunciante: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Teléfono de contacto del denunciante",
    },

    email_denunciante: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Email del denunciante",
    },

    es_anonimo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica si el reporte es anónimo",
    },

    // ============================================
    // ASIGNACIÓN DE RECURSOS
    // ============================================
    reportado_por: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "Usuario que registró la novedad",
      references: {
        model: "usuarios",
        key: "id",
      },
    },

    unidad_asignada_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Unidad/Oficina asignada",
      references: {
        model: "unidades_oficinas",
        key: "id",
      },
    },

    vehiculo_asignado_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Vehículo asignado",
      references: {
        model: "vehiculos",
        key: "id",
      },
    },

    personal_asignado_id: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array de IDs de personal asignado [1,2,3]",
    },

    // ============================================
    // SEGUIMIENTO
    // ============================================
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

    requiere_seguimiento: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica si requiere seguimiento",
    },

    fecha_proxima_revision: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha programada para próxima revisión",
    },

    // ============================================
    // ARCHIVOS ADJUNTOS
    // ============================================
    archivos_adjuntos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array de rutas de archivos adjuntos",
    },

    fotos_url: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array de URLs de fotos",
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
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Usuario que creó el registro",
    },

    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Último usuario que modificó",
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    deleted_by: {
      type: DataTypes.INTEGER.UNSIGNED,
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
        name: "idx_codigo",
        fields: ["codigo"],
      },
      {
        name: "idx_estado",
        fields: ["estado_novedad_id"],
      },
      {
        name: "idx_prioridad",
        fields: ["prioridad"],
      },
      {
        name: "idx_fecha_ocurrencia",
        fields: ["fecha_hora_ocurrencia"],
      },
      {
        name: "idx_ubicacion",
        fields: ["sector_id", "cuadrante_id"],
      },
      {
        name: "idx_reportado_por",
        fields: ["reportado_por"],
      },
    ],
    comment: "Tabla de novedades/incidentes de seguridad ciudadana",
  }
);

export default Novedad;
