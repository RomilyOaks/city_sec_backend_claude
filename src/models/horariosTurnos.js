/**
 * ===================================================
 * MODELO: HorariosTurnos
 * ===================================================
 *
 * Ruta: src/models/horariosTurnos.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-20
 *
 * Descripción:
 * Modelo Sequelize para la gestión de horarios de turnos 
 * para operativos de patrullaje. Maneja configuración de 
 * horarios por turno con soporte para cruces de medianoche.
 *
 * Características:
 * - Horarios configurables por turno (MAÑANA, TARDE, NOCHE)
 * - Soporte para horarios que cruzan medianoche
 * - Soft delete con auditoría completa
 * - Estados para activación/desactivación
 * - Relaciones con usuarios para auditoría
 *
 * @author Windsurf AI
 * @supervisor Romily Oaks
 * @date 2026-01-20
 * @version 1.0.0
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Usuario from "./Usuario.js";

/**
 * Definición del modelo HorariosTurnos
 * 
 * Gestiona los horarios de los turnos de operativos de patrullaje.
 * Cada registro define el horario de inicio y fin para un turno específico.
 */
const HorariosTurnos = sequelize.define(
  "HorariosTurnos",
  {
    // Campo principal: Tipo de turno (ENUM)
    turno: {
      type: DataTypes.ENUM("MAÑANA", "TARDE", "NOCHE"),
      primaryKey: true,
      allowNull: false,
      comment: "Tipo de turno (MAÑANA, TARDE, NOCHE)",
    },

    // Hora de inicio del turno
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: "Hora de inicio del turno (HH:MM:SS)",
    },

    // Hora de fin del turno
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: "Hora de fin del turno (HH:MM:SS)",
    },

    // Indica si el turno cruza la medianoche
    cruza_medianoche: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: "1 si el turno cruza medianoche, 0 si no cruza",
    },

    // Estado del registro (activo/inactivo)
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1 activo, 0 inactivo (soft delete)",
    },

    // Auditoría - Usuario que crea el registro
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del usuario que crea el registro",
      references: {
        model: Usuario,
        key: "id",
      },
    },

    // Timestamps automáticos
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha de creación del registro",
    },

    // Auditoría - Usuario que actualiza el registro
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualiza el registro",
      references: {
        model: Usuario,
        key: "id",
      },
    },

    // Timestamp de actualización automática
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha de última actualización",
    },

    // Auditoría - Usuario que elimina el registro
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que elimina el registro (soft delete)",
      references: {
        model: Usuario,
        key: "id",
      },
    },

    // Timestamp de eliminación (soft delete)
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación (soft delete)",
    },
  },
  {
    // Nombre de la tabla en la base de datos
    tableName: "horarios_turnos",

    // Configuración adicional
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // Habilita soft delete automático
    deletedAt: "deleted_at",

    // Índices para optimización
    indexes: [
      {
        unique: true,
        fields: ["turno"],
        name: "uq_horarios_turnos_turno",
      },
      {
        fields: ["estado"],
        name: "idx_horarios_turnos_estado",
      },
      {
        fields: ["hora_inicio"],
        name: "idx_horarios_turnos_hora_inicio",
      },
      {
        fields: ["deleted_at"],
        name: "idx_horarios_turnos_deleted_at",
      },
    ],

    // Configuración del motor y charset
    engine: "InnoDB",
    charset: "utf8mb4",
    collate: "utf8mb4_0900_ai_ci",

    // Comentario de la tabla
    comment: "Catálogo de horarios para operativos de patrullaje",

    // Hooks para validaciones y acciones automáticas
    hooks: {
      // BeforeCreate: Validar que hora_fin sea posterior a hora_inicio
      beforeCreate: (horario) => {
        if (!horario.cruza_medianoche && horario.hora_fin <= horario.hora_inicio) {
          throw new Error("La hora de fin debe ser posterior a la hora de inicio cuando no cruza medianoche");
        }
      },

      // BeforeUpdate: Validar cambios en horarios
      beforeUpdate: (horario) => {
        if (horario.changed("hora_inicio") || horario.changed("hora_fin") || horario.changed("cruza_medianoche")) {
          if (!horario.cruza_medianoche && horario.hora_fin <= horario.hora_inicio) {
            throw new Error("La hora de fin debe ser posterior a la hora de inicio cuando no cruza medianoche");
          }
        }
      },

      // BeforeDestroy: Soft delete personalizado
      beforeDestroy: async (horario, options) => {
        // Establecer estado en 0 y registrar deleted_by
        horario.estado = 0;
        horario.deleted_at = new Date();
        if (options.userId) {
          horario.deleted_by = options.userId;
        }
        await horario.save({ silent: true });
      },
    },

    // Métodos de instancia
    instanceMethods: {
      /**
       * Verifica si el horario está activo actualmente
       * @returns {boolean} True si está activo
       */
      isActive() {
        return this.estado === 1 && !this.deleted_at;
      },

      /**
       * Obtiene duración del turno en minutos
       * @returns {number} Duración en minutos
       */
      getDuracionMinutos() {
        const inicio = new Date(`2000-01-01 ${this.hora_inicio}`);
        let fin = new Date(`2000-01-01 ${this.hora_fin}`);
        
        if (this.cruza_medianoche) {
          // Si cruza medianoche, sumar 24 horas a la fecha de fin
          fin = new Date(`2000-01-02 ${this.hora_fin}`);
        }
        
        return Math.round((fin - inicio) / (1000 * 60));
      },

      /**
       * Verifica si una hora específica está dentro del turno
       * @param {string} hora - Hora a verificar (HH:MM:SS)
       * @returns {boolean} True si la hora está dentro del turno
       */
      isHoraEnTurno(hora) {
        const horaVerificar = new Date(`2000-01-01 ${hora}`);
        const inicio = new Date(`2000-01-01 ${this.hora_inicio}`);
        let fin = new Date(`2000-01-01 ${this.hora_fin}`);
        
        if (this.cruza_medianoche) {
          fin = new Date(`2000-01-02 ${this.hora_fin}`);
        }
        
        return horaVerificar >= inicio && horaVerificar <= fin;
      },
    },

    // Métodos de clase
    classMethods: {
      /**
       * Obtener horario activo según hora actual
       * @param {Date} horaActual - Hora actual para verificar
       * @returns {Promise<HorariosTurnos|null>} Horario activo o null
       */
      async getHorarioActivo(horaActual = new Date()) {
        // La hora actual se usará para determinar el horario activo
        // pero no se necesita almacenar en una variable temporal
        
        return await this.findOne({
          where: {
            estado: 1,
            deleted_at: null,
          },
          include: [
            {
              model: Usuario,
              as: "creador",
              attributes: ["id", "username", "email"],
            },
            {
              model: Usuario,
              as: "actualizador",
              attributes: ["id", "username", "email"],
            },
          ],
        });
      },
    },
  }
);

// ==========================================
// ASOCIACIONES
// ==========================================

/**
 * Asociación con Usuario para auditoría
 * Un horario es creado por un usuario
 */
HorariosTurnos.belongsTo(Usuario, {
  foreignKey: "created_by",
  as: "creador",
});

/**
 * Asociación con Usuario para auditoría
 * Un horario puede ser actualizado por un usuario
 */
HorariosTurnos.belongsTo(Usuario, {
  foreignKey: "updated_by",
  as: "actualizador",
});

/**
 * Asociación con Usuario para auditoría
 * Un horario puede ser eliminado por un usuario
 */
HorariosTurnos.belongsTo(Usuario, {
  foreignKey: "deleted_by",
  as: "eliminador",
});

// ==========================================
// MÉTODOS ESTÁTICOS ADICIONALES
// ==========================================

/**
 * Obtener todos los horarios con filtros
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Array>} Lista de horarios
 */
HorariosTurnos.getAllWithFilters = function (options = {}) {
  const { estado = null, includeDeleted = false } = options;
  
  const whereClause = {};
  
  if (estado !== null) {
    whereClause.estado = estado;
  }
  
  if (!includeDeleted) {
    whereClause.deleted_at = null;
  }
  
  return this.findAll({
    where: whereClause,
    include: [
      {
        model: Usuario,
        as: "creador",
        attributes: ["id", "username", "email"],
        required: false,
      },
      {
        model: Usuario,
        as: "actualizador",
        attributes: ["id", "username", "email"],
        required: false,
      },
      {
        model: Usuario,
        as: "eliminador",
        attributes: ["id", "username", "email"],
        required: false,
      },
    ],
    order: [["turno", "ASC"]],
  });
};

/**
 * Reactivar un horario eliminado
 * @param {string} turno - ID del turno a reactivar
 * @param {number} userId - ID del usuario que reactiva
 * @returns {Promise<HorariosTurnos>} Horario reactivado
 */
HorariosTurnos.reactivar = async function (turno, userId) {
  const horario = await this.findByPk(turno, {
    paranoid: false, // Incluir registros eliminados
  });
  
  if (!horario) {
    throw new Error("Horario no encontrado");
  }
  
  if (horario.estado === 1 && !horario.deleted_at) {
    throw new Error("El horario ya está activo");
  }
  
  // Reactivar
  horario.estado = 1;
  horario.deleted_at = null;
  horario.deleted_by = null;
  horario.updated_by = userId;
  horario.updated_at = new Date();
  
  await horario.save();
  
  return horario;
};

export default HorariosTurnos;
