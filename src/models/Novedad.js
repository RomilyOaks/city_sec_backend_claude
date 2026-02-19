/**
 * ============================================
 * MODELO: NOVEDAD (INCIDENTE)
 * Ruta: src/models/Novedad.js
 * ============================================
 * VERSIÓN CORREGIDA - Alias consistentes con controlador
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Novedad = sequelize.define(
  "Novedad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    novedad_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    // 🔥 IMPORTANTE: Usar fecha_hora_ocurrencia (coincide con BD)
    fecha_hora_ocurrencia: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_hora_reporte: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    tipo_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtipo_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estado_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    direccion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    localizacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referencia_ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    ubigeo_code: {
      type: DataTypes.CHAR(6),
      allowNull: true,
    },
    origen_llamada: {
      type: DataTypes.ENUM(
        "TELEFONO_107",
        "RADIO_TETRA",
        "REDES_SOCIALES",
        "BOTON_EMERGENCIA_ALERTA",
        "BOTON_DENUNCIA_VECINO_ALERTA",
        "INTERVENCION_DIRECTA",
        "VIDEO_CCO",
        "ANALITICA",
        "APP_PODER_JUDICIAL",
        "BOT"
      ),
      allowNull: true,
      defaultValue: "TELEFONO_107",
      comment: "Medio que origina la Novedad/Incidente e inicia el flujo de atención de Seguridad Ciudadana",
    },
    radio_tetra_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reportante_nombre: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    reportante_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    reportante_doc_identidad: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    es_anonimo: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prioridad_actual: {
      type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
      allowNull: false,
      defaultValue: "MEDIA",
    },
    gravedad: {
      type: DataTypes.ENUM("LEVE", "MODERADA", "GRAVE", "MUY_GRAVE"),
      allowNull: true,
    },
    // 🔥 IMPORTANTE: usuario_registro en vez de reportado_por
    usuario_registro: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unidad_oficina_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    personal_cargo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    personal_seguridad2_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    personal_seguridad3_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    personal_seguridad4_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha_despacho: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usuario_despacho: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha_llegada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_cierre: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    km_inicial: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    km_final: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    tiempo_respuesta_min: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    turno: {
      type: DataTypes.ENUM("MAÑANA", "TARDE", "NOCHE"),
      allowNull: true,
    },
    parte_adjuntos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    fotos_adjuntas: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    videos_adjuntos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    requiere_seguimiento: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_proxima_revision: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    num_personas_afectadas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    perdidas_materiales_estimadas: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "novedades_incidentes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false, // NO usar paranoid aquí
    indexes: [
      { name: "uq_novedad_code", fields: ["novedad_code"], unique: true },
      { name: "idx_fecha_hora_ocurrencia", fields: ["fecha_hora_ocurrencia"] },
      { name: "idx_novedad_estado", fields: ["estado_novedad_id"] },
      {
        name: "idx_tipo_subtipo",
        fields: ["tipo_novedad_id", "subtipo_novedad_id"],
      },
      { name: "idx_novedad_usuario", fields: ["usuario_registro"] },
    ],
  }
);

/**
 * 🔥 ASOCIACIONES - Usar alias SIMPLES que coincidan con el controlador
 * IMPORTANTE: NO definir aquí, definir solo en index.js
 */
// NO definir associate aquí para evitar duplicados

export default Novedad;
