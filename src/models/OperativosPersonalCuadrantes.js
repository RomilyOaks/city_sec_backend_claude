/**
 * ===================================================
 * MODELO: OperativosPersonalCuadrantes
 * ===================================================
 *
 * Ruta: src/models/OperativosPersonalCuadrantes.js
 *
 * VERSIÓN: 2.2.2
 * ÚLTIMA ACTUALIZACIÓN: 2026-01-17
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'operativos_personal_cuadrantes' de la base de datos.
 * Gestiona los cuadrantes que el personal de seguridad cubre durante su patrullaje
 * a pie. Registra horarios de ingreso/salida y observaciones por cuadrante.
 *
 * Jerarquía de datos:
 * OperativosTurno (abuelo)
 *   └─ OperativosPersonal (padre)
 *       └─ OperativosPersonalCuadrantes (este modelo)
 *           └─ OperativosPersonalNovedades (hijo)
 *
 * Relaciones:
 * - Pertenece a un OperativosPersonal (Many-to-One)
 * - Pertenece a un Cuadrante (Many-to-One)
 * - Tiene muchos OperativosPersonalNovedades (One-to-Many)
 *
 * @module models/OperativosPersonalCuadrantes
 * @requires sequelize
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-17
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Clase OperativosPersonalCuadrantes
 * @extends Model
 * @description Modelo para gestionar cuadrantes cubiertos por personal a pie
 *
 * NOTA: Las asociaciones se definen en src/models/index.js para evitar
 * duplicación y errores de alias. No usar método associate() aquí.
 *
 * Alias definidos en index.js:
 * - operativoPersonal (OperativosPersonal)
 * - datosCuadrante (Cuadrante)
 * - novedades (OperativosPersonalNovedades)
 * - creadorOperativosPersonalCuadrantes (Usuario)
 * - actualizadorOperativosPersonalCuadrantes (Usuario)
 * - eliminadorOperativosPersonalCuadrantes (Usuario)
 */
class OperativosPersonalCuadrantes extends Model {}

/**
 * Inicialización del modelo con sus campos y configuración
 */
OperativosPersonalCuadrantes.init(
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
    // CAMPO: operativo_personal_id (FK)
    // =========================================
    operativo_personal_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "operativos_personal",
        key: "id",
      },
      comment: "Referencia a la asignación de personal en el turno",
    },

    // =========================================
    // CAMPO: cuadrante_id (FK)
    // =========================================
    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cuadrantes",
        key: "id",
      },
      comment: "Cuadrante geográfico que se está cubriendo",
    },

    // =========================================
    // CAMPOS DE HORARIO
    // =========================================
    hora_ingreso: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Hora de ingreso al cuadrante",
    },
    hora_salida: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Hora de salida del cuadrante (NULL si aún está en el cuadrante)",
    },

    // =========================================
    // CAMPOS DE INFORMACIÓN
    // =========================================
    observaciones: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Observaciones durante la cobertura del cuadrante",
    },
    incidentes_reportados: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción de incidentes reportados en texto libre",
    },

    // =========================================
    // CAMPO VIRTUAL: tiempo_minutos
    // =========================================
    // Calcula el tiempo de permanencia en el cuadrante
    tiempo_minutos: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.hora_salida && this.hora_ingreso) {
          const diff =
            new Date(this.hora_salida).getTime() -
            new Date(this.hora_ingreso).getTime();
          return Math.floor(diff / (1000 * 60)); // Retorna minutos
        }
        return null;
      },
      comment: "Tiempo de permanencia en minutos (calculado)",
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
    modelName: "OperativosPersonalCuadrantes",
    tableName: "operativos_personal_cuadrantes",
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
        // Un personal solo puede estar en un cuadrante activo a la vez
        unique: true,
        fields: ["operativo_personal_id", "cuadrante_id"],
        name: "uq_personal_cuadrante",
        where: { estado_registro: 1 },
        comment: "Un sereno solo puede estar asignado a un cuadrante para una fecha y turno",
      },
      {
        fields: ["operativo_personal_id"],
        name: "idx_operativo_personal",
      },
      {
        fields: ["cuadrante_id"],
        name: "idx_cuadrante",
      },
      {
        fields: ["hora_ingreso"],
        name: "idx_hora_ingreso",
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
      beforeDestroy: async (cuadrante, options) => {
        if (options.userId) {
          cuadrante.deleted_by = options.userId;
        }
        cuadrante.estado_registro = 0;
      },
    },

    // =========================================
    // VALIDACIONES
    // =========================================
    validate: {
      // Valida que hora_salida sea posterior a hora_ingreso
      horasValidas() {
        if (this.hora_salida && this.hora_ingreso) {
          if (new Date(this.hora_salida) < new Date(this.hora_ingreso)) {
            throw new Error("La hora de salida debe ser posterior a la hora de ingreso");
          }
        }
      },
    },
  }
);

export default OperativosPersonalCuadrantes;
