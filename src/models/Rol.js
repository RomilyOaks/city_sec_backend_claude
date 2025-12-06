/**
 * Ruta: src/models/Rol.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'roles' de la base de datos.
 * Los roles agrupan permisos y representan diferentes niveles de acceso
 * en el sistema (ej: admin, operador, supervisor).
 *
 * Características:
 * - Jerarquía de roles mediante nivel_jerarquia
 * - Slug único para identificación
 * - Color personalizable para UI
 * - Roles del sistema protegidos
 * - Soft delete para auditoría
 *
 * Relaciones:
 * - Se asocia con Usuarios (Many-to-Many) a través de 'usuario_roles'
 * - Se asocia con Permisos (Many-to-Many) a través de 'rol_permisos'
 *
 * @module models/Rol
 * @requires sequelize
 * @requires config/database
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
import sequelize from "../config/database.js";

const Rol = sequelize.define(
  "Rol",
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
     * Nombre legible del rol
     * Ejemplo: 'Super Administrador', 'Operador', 'Supervisor'
     */
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombre del rol",
    },

    /**
     * Identificador único del rol (formato slug)
     * Ejemplo: 'super_admin', 'operador', 'supervisor'
     * Se usa en el código para verificar roles
     */
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Identificador único del rol (ej: super_admin, operador)",
    },

    /**
     * Descripción del rol y sus responsabilidades
     * Ayuda a entender qué hace un usuario con este rol
     */
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción del rol y sus responsabilidades",
    },

    // ============================================
    // JERARQUÍA
    // ============================================

    /**
     * Nivel jerárquico del rol (0 = más alto)
     * Permite establecer una jerarquía de roles
     * Ejemplo:
     * - 0: Super Admin (acceso total)
     * - 1: Admin (mayoría de permisos)
     * - 2: Operador (permisos operativos)
     * - 3: Supervisor (supervisión)
     * - 4: Consulta (solo lectura)
     */
    nivel_jerarquia: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Nivel jerárquico (0=más alto)",
    },

    // ============================================
    // CONTROL
    // ============================================

    /**
     * Indica si es un rol del sistema
     * Los roles del sistema no pueden ser editados ni eliminados
     */
    es_sistema: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "1=Rol del sistema no editable",
    },

    /**
     * Color hexadecimal para la interfaz de usuario
     * Ayuda a identificar visualmente los roles
     * Ejemplo: #DC2626 (rojo), #10B981 (verde)
     */
    color: {
      type: DataTypes.STRING(7),
      defaultValue: "#6B7280", // Gris por defecto
      validate: {
        is: /^#[0-9A-F]{6}$/i, // Validar formato hexadecimal
      },
      comment: "Color hexadecimal para UI",
    },

    /**
     * Estado del rol
     */
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
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
    tableName: "roles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        unique: true,
        fields: ["slug"],
      },
      {
        fields: ["nivel_jerarquia"],
      },
      {
        fields: ["estado"],
      },
    ],

    hooks: {
      /**
       * Normalizar slug antes de guardar
       */
      beforeSave: (rol) => {
        if (rol.slug) {
          rol.slug = rol.slug.toLowerCase().replace(/\s+/g, "_");
        }
      },
    },
  }
);

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener rol con sus permisos
 */
Rol.findWithPermisos = async function (rolId) {
  return await Rol.findByPk(rolId, {
    include: [
      {
        association: "permisos",
        through: { attributes: ["created_at"] },
      },
    ],
  });
};

/**
 * Obtener roles activos ordenados por jerarquía
 */
Rol.findAllActive = async function () {
  return await Rol.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    order: [["nivel_jerarquia", "ASC"]],
  });
};

/**
 * Buscar rol por slug
 */
Rol.findBySlug = async function (slug) {
  return await Rol.findOne({
    where: {
      slug: slug.toLowerCase(),
      estado: true,
      deleted_at: null,
    },
  });
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Verificar si es rol del sistema
 */
Rol.prototype.esSistema = function () {
  return this.es_sistema === true;
};

/**
 * Soft delete
 */
Rol.prototype.softDelete = async function (userId) {
  if (this.es_sistema) {
    throw new Error("No se puede eliminar un rol del sistema");
  }
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

export default Rol;
