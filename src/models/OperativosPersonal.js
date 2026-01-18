/**
 * ===================================================
 * MODELO: OperativosPersonal
 * ===================================================
 *
 * Ruta: src/models/OperativosPersonal.js
 *
 * VERSIÓN: 2.2.2
 * ÚLTIMA ACTUALIZACIÓN: 2026-01-17
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'operativos_personal' de la base de datos.
 * Gestiona el personal de seguridad asignado a patrullaje a pie dentro de
 * un turno operativo. Permite registrar equipamiento, horarios y estado
 * operativo del personal durante su servicio.
 *
 * Jerarquía de datos:
 * OperativosTurno (padre)
 *   └─ OperativosPersonal (este modelo)
 *       └─ OperativosPersonalCuadrantes (hijo)
 *           └─ OperativosPersonalNovedades (nieto)
 *
 * Relaciones:
 * - Pertenece a un OperativosTurno (Many-to-One)
 * - Pertenece a un PersonalSeguridad como personal principal (Many-to-One)
 * - Pertenece a un PersonalSeguridad como compañero/sereno (Many-to-One, opcional)
 * - Pertenece a un RadioTetra (Many-to-One, opcional)
 * - Pertenece a un EstadoOperativoRecurso (Many-to-One)
 * - Tiene muchos OperativosPersonalCuadrantes (One-to-Many)
 *
 * @module models/OperativosPersonal
 * @requires sequelize
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-17
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Clase OperativosPersonal
 * @extends Model
 * @description Modelo para gestionar personal asignado a patrullaje a pie
 *
 * NOTA: Las asociaciones se definen en src/models/index.js para evitar
 * duplicación y errores de alias. No usar método associate() aquí.
 *
 * Alias definidos en index.js:
 * - turno (OperativosTurno)
 * - personal (PersonalSeguridad)
 * - sereno (PersonalSeguridad)
 * - radio_tetra (RadioTetra)
 * - estado_operativo (EstadoOperativoRecurso)
 * - cuadrantesAsignados (OperativosPersonalCuadrantes)
 * - creadorOperativosPersonal (Usuario)
 * - actualizadorOperativosPersonal (Usuario)
 * - eliminadorOperativosPersonal (Usuario)
 */
class OperativosPersonal extends Model {}

/**
 * Inicialización del modelo con sus campos y configuración
 */
OperativosPersonal.init(
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
    // CAMPO: operativo_turno_id (FK)
    // =========================================
    operativo_turno_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "operativos_turno",
        key: "id",
      },
      comment: "Turno operativo al que pertenece esta asignación",
    },

    // =========================================
    // CAMPO: tipo_patrullaje (ENUM)
    // =========================================
    tipo_patrullaje: {
      type: DataTypes.ENUM("SERENAZGO", "PPFF", "GUARDIA", "VIGILANTE", "OTRO"),
      allowNull: false,
      defaultValue: "SERENAZGO",
      comment: "Tipo de patrullaje: SERENAZGO, PPFF (Policía), GUARDIA, VIGILANTE, OTRO",
    },

    // =========================================
    // CAMPO: personal_id (FK)
    // =========================================
    personal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
      comment: "Personal de seguridad principal asignado",
    },

    // =========================================
    // CAMPO: sereno_id (FK, opcional)
    // =========================================
    sereno_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
      comment: "Compañero de patrullaje (opcional)",
    },

    // =========================================
    // CAMPO: radio_tetra_id (FK, opcional)
    // =========================================
    radio_tetra_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "radios_tetra",
        key: "id",
      },
      comment: "Radio TETRA asignado para comunicación",
    },

    // =========================================
    // CAMPO: estado_operativo_id (FK)
    // =========================================
    estado_operativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "estados_operativo_recurso",
        key: "id",
      },
      comment: "Estado operativo actual del personal (ej: DISPONIBLE, EN_SERVICIO)",
    },

    // =========================================
    // CAMPOS DE EQUIPAMIENTO (BOOLEANOS)
    // =========================================
    chaleco_balistico: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si porta chaleco balístico",
    },
    porra_policial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si porta porra policial",
    },
    esposas: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si porta esposas",
    },
    linterna: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si porta linterna",
    },
    kit_primeros_auxilios: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si porta kit de primeros auxilios",
    },

    // =========================================
    // CAMPOS DE HORARIO
    // =========================================
    hora_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Hora de inicio del servicio",
    },
    hora_fin: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Hora de fin del servicio (NULL si aún está activo)",
    },

    // =========================================
    // CAMPO: observaciones
    // =========================================
    observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Observaciones adicionales del servicio",
    },

    // =========================================
    // CAMPO: estado_registro (soft delete helper)
    // =========================================
    estado_registro: {
      type: DataTypes.TINYINT,
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

    // =========================================
    // CAMPO VIRTUAL: duracion_servicio
    // =========================================
    // Calcula la duración del servicio en minutos
    duracion_servicio: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.hora_fin && this.hora_inicio) {
          const diff =
            new Date(this.hora_fin).getTime() -
            new Date(this.hora_inicio).getTime();
          return Math.floor(diff / (1000 * 60)); // Retorna minutos
        }
        return null;
      },
      comment: "Duración del servicio en minutos (calculado)",
    },
  },
  {
    // =========================================
    // CONFIGURACIÓN DEL MODELO
    // =========================================
    sequelize,
    modelName: "OperativosPersonal",
    tableName: "operativos_personal",
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
        // Un personal solo puede estar en un turno activo a la vez
        unique: true,
        fields: ["operativo_turno_id", "personal_id"],
        name: "uq_turno_personal",
        where: { estado_registro: 1 },
        comment: "Un personal solo puede estar en una fecha y turno por sector en Operativos",
      },
      {
        fields: ["operativo_turno_id"],
        name: "idx_operativo_turno",
      },
      {
        fields: ["personal_id"],
        name: "idx_personal",
      },
      {
        fields: ["sereno_id"],
        name: "idx_sereno",
      },
      {
        fields: ["tipo_patrullaje"],
        name: "idx_tipo_patrullaje",
      },
      {
        fields: ["estado_operativo_id"],
        name: "idx_estado_operativo",
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
      beforeDestroy: async (personal, options) => {
        if (options.userId) {
          personal.deleted_by = options.userId;
        }
        personal.estado_registro = 0;
      },
    },

    // =========================================
    // VALIDACIONES
    // =========================================
    validate: {
      // Valida que hora_fin sea posterior a hora_inicio
      horasValidas() {
        if (this.hora_fin && this.hora_inicio) {
          if (new Date(this.hora_fin) < new Date(this.hora_inicio)) {
            throw new Error("La hora de fin debe ser posterior a la hora de inicio");
          }
        }
      },
      // Valida que el sereno sea diferente al personal principal
      serenoDiferente() {
        if (this.sereno_id && this.personal_id === this.sereno_id) {
          throw new Error("El compañero de patrullaje debe ser diferente al personal principal");
        }
      },
    },
  }
);

export default OperativosPersonal;
