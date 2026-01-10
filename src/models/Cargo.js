/**
 * ===================================================
 * MODELO SEQUELIZE: Cargo
 * ===================================================
 *
 * Ruta: src/models/Cargo.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'cargos' del sistema de
 * Seguridad Ciudadana. Define los diferentes cargos/puestos
 * de trabajo que puede ocupar el personal.
 *
 * VERSIÓN: 1.0.0
 * - ✅ CRUD completo
 * - ✅ Validaciones robustas
 * - ✅ Métodos estáticos y de instancia
 * - ✅ Scopes predefinidos
 * - ✅ Soft delete
 *
 * Relaciones:
 * - hasMany → PersonalSeguridad (personal con este cargo)
 *
 * @module models/Cargo
 * @requires sequelize
 * @author Sistema de Seguridad Ciudadana
 * @version 1.0.0
 * @date 2025-12-12
 */

import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

const Cargo = sequelize.define(
  "Cargo",
  {
    // ==========================================
    // IDENTIFICADOR PRINCIPAL
    // ==========================================
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del cargo",
    },

    // ==========================================
    // INFORMACIÓN DEL CARGO
    // ==========================================

    /**
     * Nombre del cargo
     * Ejemplos: "Sereno", "Supervisor", "Jefe de Operaciones"
     */
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: "uq_cargo_nombre",
        msg: "Ya existe un cargo con este nombre",
      },
      comment: "Nombre del cargo",
      validate: {
        notNull: {
          msg: "El nombre del cargo es obligatorio",
        },
        notEmpty: {
          msg: "El nombre del cargo no puede estar vacío",
        },
        len: {
          args: [2, 100],
          msg: "El nombre debe tener entre 2 y 100 caracteres",
        },
      },
    },

    /**
     * Descripción detallada del cargo
     * Funciones, responsabilidades, etc.
     */
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada del cargo y sus funciones",
      validate: {
        len: {
          args: [0, 1000],
          msg: "La descripción no puede exceder 1000 caracteres",
        },
      },
    },

    /**
     * Nivel jerárquico del cargo
     * 1 = Más alto (Jefe), 10 = Más bajo (Operativo)
     */
    nivel_jerarquico: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: "Nivel jerárquico (1=más alto, 10=más bajo)",
      validate: {
        isInt: {
          msg: "El nivel jerárquico debe ser un número entero",
        },
        min: {
          args: [1],
          msg: "El nivel jerárquico mínimo es 1",
        },
        max: {
          args: [10],
          msg: "El nivel jerárquico máximo es 10",
        },
      },
    },

    /**
     * Categoría del cargo
     * Agrupa cargos similares
     */
    categoria: {
      type: DataTypes.ENUM(
        "Alcalde",
        "Gerente",
        "Directivo",
        "Jefatura",
        "Supervisión",
        "Operativo",
        "Administrativo",
        "Apoyo"
      ),
      allowNull: false,
      defaultValue: "Operativo",
      comment: "Categoría del cargo",
      validate: {
        isIn: {
          args: [
            [
              "Alcalde",
              "Gerente",
              "Directivo",
              "Jefatura",
              "Supervisión",
              "Operativo",
              "Administrativo",
              "Apoyo",
            ],
          ],
          msg: "Categoría no válida",
        },
      },
    },

    /**
     * Indica si el cargo requiere licencia de conducir
     */
    requiere_licencia: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica si el cargo requiere licencia de conducir",
    },

    /**
     * Salario base del cargo (opcional)
     * En soles peruanos
     */
    salario_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Salario base en soles (opcional)",
      validate: {
        min: {
          args: [0],
          msg: "El salario base no puede ser negativo",
        },
      },
    },

    /**
     * Código interno del cargo
     * Para uso administrativo
     */
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: {
        name: "uq_cargo_codigo",
        msg: "Ya existe un cargo con este código",
      },
      comment: "Código interno del cargo",
      validate: {
        len: {
          args: [2, 20],
          msg: "El código debe tener entre 2 y 20 caracteres",
        },
      },
    },

    /**
     * Color asignado al cargo (para UI)
     * Formato hexadecimal: #RRGGBB
     */
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#6B7280",
      comment: "Color para representación visual (hex)",
      validate: {
        is: {
          args: /^#[0-9A-Fa-f]{6}$/,
          msg: "El color debe estar en formato hexadecimal (#RRGGBB)",
        },
      },
    },

    // ==========================================
    // ESTADO Y SOFT DELETE
    // ==========================================

    /**
     * Estado del cargo
     * true = Activo, false = Inactivo
     */
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
    },

    /**
     * Fecha de eliminación lógica (soft delete)
     */
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    // ==========================================
    // AUDITORÍA
    // ==========================================

    /**
     * Usuario que creó el registro
     */
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que creó el registro",
    },

    /**
     * Usuario que actualizó el registro
     */
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro",
    },
  },
  {
    // ==========================================
    // CONFIGURACIÓN DEL MODELO
    // ==========================================

    tableName: "cargos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,

    // ==========================================
    // ÍNDICES
    // ==========================================
    indexes: [
      {
        name: "idx_cargo_nombre",
        unique: true,
        fields: ["nombre"],
      },
      {
        name: "idx_cargo_codigo",
        unique: true,
        fields: ["codigo"],
      },
      {
        name: "idx_cargo_categoria",
        fields: ["categoria"],
      },
      {
        name: "idx_cargo_nivel",
        fields: ["nivel_jerarquico"],
      },
      {
        name: "idx_cargo_estado",
        fields: ["estado", "deleted_at"],
      },
    ],

    // ==========================================
    // HOOKS
    // ==========================================
    hooks: {
      /**
       * Antes de guardar, normalizar nombre
       */
      beforeSave: (cargo) => {
        if (cargo.nombre) {
          // Normalizar nombre a Title Case
          cargo.nombre = cargo.nombre
            .trim()
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }

        if (cargo.codigo) {
          cargo.codigo = cargo.codigo.trim().toUpperCase();
        }
      },
    },

    // ==========================================
    // SCOPES
    // ==========================================
    scopes: {
      /**
       * Solo cargos activos
       */
      activos: {
        where: {
          estado: true,
          deleted_at: null,
        },
      },

      /**
       * Cargos operativos (requieren licencia)
       */
      operativos: {
        where: {
          categoria: "Operativo",
          estado: true,
          deleted_at: null,
        },
      },

      /**
       * Cargos que requieren licencia
       */
      conLicencia: {
        where: {
          requiere_licencia: true,
          estado: true,
          deleted_at: null,
        },
      },

      /**
       * Por categoría
       */
      porCategoria: (categoria) => ({
        where: {
          categoria,
          estado: true,
          deleted_at: null,
        },
      }),
    },
  }
);

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar cargos activos
 * @returns {Promise<Array>} Array de cargos activos
 */
Cargo.findActivos = async function () {
  return await Cargo.scope("activos").findAll({
    order: [
      ["nivel_jerarquico", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

/**
 * Buscar cargos por categoría
 * @param {string} categoria - Categoría del cargo
 * @returns {Promise<Array>} Array de cargos
 */
Cargo.findByCategoria = async function (categoria) {
  return await Cargo.findAll({
    where: {
      categoria,
      estado: true,
      deleted_at: null,
    },
    order: [["nivel_jerarquico", "ASC"]],
  });
};

/**
 * Buscar cargos que requieren licencia
 * @returns {Promise<Array>} Array de cargos
 */
Cargo.findConLicencia = async function () {
  return await Cargo.scope("conLicencia").findAll({
    order: [["nombre", "ASC"]],
  });
};

/**
 * Obtener estadísticas de cargos
 * @returns {Promise<Object>} Objeto con estadísticas
 */
Cargo.getEstadisticas = async function () {
  const total = await Cargo.count({
    where: { estado: true, deleted_at: null },
  });

  const porCategoria = await Cargo.findAll({
    attributes: [
      "categoria",
      [sequelize.fn("COUNT", sequelize.col("id")), "total"],
    ],
    where: { estado: true, deleted_at: null },
    group: ["categoria"],
    raw: true,
  });

  const conLicencia = await Cargo.count({
    where: {
      requiere_licencia: true,
      estado: true,
      deleted_at: null,
    },
  });

  return {
    total,
    conLicencia,
    porCategoria: porCategoria.reduce((acc, item) => {
      acc[item.categoria] = parseInt(item.total);
      return acc;
    }, {}),
  };
};

/**
 * Buscar cargo por código
 * @param {string} codigo - Código del cargo
 * @returns {Promise<Object|null>} Cargo encontrado o null
 */
Cargo.findByCodigo = async function (codigo) {
  return await Cargo.findOne({
    where: {
      codigo: codigo.trim().toUpperCase(),
      estado: true,
      deleted_at: null,
    },
  });
};

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Verificar si el cargo está activo
 * @returns {boolean} true si está activo
 */
Cargo.prototype.estaActivo = function () {
  return this.estado === true && this.deleted_at === null;
};

/**
 * Verificar si el cargo requiere licencia
 * @returns {boolean} true si requiere licencia
 */
Cargo.prototype.requiereConducir = function () {
  return this.requiere_licencia === true;
};

/**
 * Contar personal asignado a este cargo
 * @returns {Promise<number>} Cantidad de personal
 */
Cargo.prototype.contarPersonal = async function () {
  const PersonalSeguridad = sequelize.models.PersonalSeguridad;
  return await PersonalSeguridad.count({
    where: {
      cargo_id: this.id,
      estado: true,
      deleted_at: null,
    },
  });
};

/**
 * Soft delete del cargo
 * @param {number} userId - ID del usuario que elimina
 * @returns {Promise<Object>} Cargo actualizado
 */
Cargo.prototype.softDelete = async function (userId = null) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  return await this.save();
};

/**
 * Restaurar cargo eliminado
 * @param {number} userId - ID del usuario que restaura
 * @returns {Promise<Object>} Cargo actualizado
 */
Cargo.prototype.restore = async function (userId = null) {
  this.deleted_at = null;
  this.estado = true;
  if (userId) {
    this.updated_by = userId;
  }
  return await this.save();
};

/**
 * Personalizar JSON para respuestas API
 */
Cargo.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());

  // Agregar campos calculados
  values.esta_activo = this.estaActivo();
  values.requiere_conducir = this.requiereConducir();

  return values;
};

export default Cargo;
