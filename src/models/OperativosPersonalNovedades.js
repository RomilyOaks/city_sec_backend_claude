/**
 * ===================================================
 * MODELO: OperativosPersonalNovedades
 * ===================================================
 *
 * Ruta: src/models/OperativosPersonalNovedades.js
 *
 * VERSIÓN: 2.2.2
 * ÚLTIMA ACTUALIZACIÓN: 2026-01-17
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'operativos_personal_novedades' de la base de datos.
 * Registra las novedades/incidentes atendidos por el personal de seguridad durante
 * su patrullaje a pie en cuadrantes específicos. Permite trackear prioridad,
 * acciones tomadas y resultado de la atención.
 *
 * Jerarquía de datos:
 * OperativosTurno (bisabuelo)
 *   └─ OperativosPersonal (abuelo)
 *       └─ OperativosPersonalCuadrantes (padre)
 *           └─ OperativosPersonalNovedades (este modelo)
 *
 * Relaciones:
 * - Pertenece a un OperativosPersonalCuadrantes (Many-to-One)
 * - Pertenece a una Novedad (Many-to-One)
 *
 * @module models/OperativosPersonalNovedades
 * @requires sequelize
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-17
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Clase OperativosPersonalNovedades
 * @extends Model
 * @description Modelo para gestionar novedades atendidas por personal a pie
 *
 * NOTA: Las asociaciones se definen en src/models/index.js para evitar
 * duplicación y errores de alias. No usar método associate() aquí.
 *
 * Alias definidos en index.js:
 * - cuadranteOperativo (OperativosPersonalCuadrantes)
 * - novedad (Novedad)
 * - creadorOperativosPersonalNovedades (Usuario)
 * - actualizadorOperativosPersonalNovedades (Usuario)
 * - eliminadorOperativosPersonalNovedades (Usuario)
 */
class OperativosPersonalNovedades extends Model {}

/**
 * Inicialización del modelo con sus campos y configuración
 */
OperativosPersonalNovedades.init(
  {
    // =========================================
    // CAMPO: id (PRIMARY KEY)
    // =========================================
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del registro",
    },

    // =========================================
    // CAMPO: operativo_personal_cuadrante_id (FK)
    // =========================================
    operativo_personal_cuadrante_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "operativos_personal_cuadrantes",
        key: "id",
      },
      comment: "Referencia al cuadrante donde se atendió la novedad",
    },

    // =========================================
    // CAMPO: novedad_id (FK)
    // =========================================
    novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "novedades_incidentes",
        key: "id",
      },
      comment: "Referencia a la novedad/incidente atendido",
    },

    // =========================================
    // CAMPO: estado_novedad_id (FK)
    // =========================================
    estado_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      references: {
        model: "estados_novedad",
        key: "id",
      },
      comment: "Estado actual de la novedad en este registro de atención",
    },

    // =========================================
    // CAMPOS DE SEGUIMIENTO
    // =========================================
    reportado: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora en que se reportó la atención",
    },
    atendido: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha en que se completó la atención (solo fecha)",
    },

    // =========================================
    // CAMPO: prioridad (ENUM)
    // =========================================
    prioridad: {
      type: DataTypes.ENUM("BAJA", "MEDIA", "ALTA", "URGENTE"),
      allowNull: true,
      defaultValue: "MEDIA",
      comment: "Nivel de prioridad de la novedad: BAJA, MEDIA, ALTA, URGENTE",
    },

    // =========================================
    // CAMPO: acciones_tomadas
    // =========================================
    acciones_tomadas: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción de las acciones realizadas para atender la novedad",
    },

    // =========================================
    // CAMPO: resultado (ENUM)
    // =========================================
    resultado: {
      type: DataTypes.ENUM("PENDIENTE", "RESUELTO", "ESCALADO", "CANCELADO"),
      allowNull: true,
      defaultValue: "PENDIENTE",
      comment: "Estado del resultado: PENDIENTE, RESUELTO, ESCALADO, CANCELADO",
    },

    // =========================================
    // CAMPO: observaciones
    // =========================================
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones adicionales sobre la atención",
    },

    // =========================================
    // CAMPO: estado_registro (soft delete helper)
    // =========================================
    estado_registro: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1 = Activo, 0 = Inactivo/Eliminado",
    },

    // =========================================
    // CAMPOS DE AUDITORÍA
    // =========================================
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del usuario que creó el registro",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora de creación",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro",
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora de última actualización",
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que eliminó el registro",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora de eliminación (soft delete)",
    },
  },
  {
    // =========================================
    // CONFIGURACIÓN DEL MODELO
    // =========================================
    sequelize,
    modelName: "OperativosPersonalNovedades",
    tableName: "operativos_personal_novedades",
    timestamps: true, // Habilita created_at y updated_at
    paranoid: true, // Habilita soft delete con deleted_at
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",

    // =========================================
    // ÍNDICES
    // =========================================
    indexes: [
      {
        // Una novedad solo puede estar asociada una vez a un cuadrante (activo)
        unique: true,
        fields: ["operativo_personal_cuadrante_id", "novedad_id"],
        name: "uq_cuadrante_personal_novedad",
        where: { estado_registro: 1 },
        comment: "Una novedad solo puede pertenecer a un cuadrante en una fecha y turno",
      },
      {
        fields: ["operativo_personal_cuadrante_id"],
        name: "idx_operativo_personal_cuadrante",
      },
      {
        fields: ["novedad_id"],
        name: "idx_operativo_personal_novedad",
      },
    ],

    // =========================================
    // HOOKS
    // =========================================
    hooks: {
      // Actualiza updated_at antes de cada update
      beforeUpdate: (instance) => {
        instance.updated_at = new Date();
      },
      // Configura soft delete correctamente
      beforeDestroy: async (novedad, options) => {
        if (options.userId) {
          novedad.deleted_by = options.userId;
        }
        novedad.estado_registro = 0;
      },
    },
  }
);

export default OperativosPersonalNovedades;
