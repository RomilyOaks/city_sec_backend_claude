/**
 * Ruta: src/models/Permiso.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'permisos' de la base de datos.
 * Los permisos representan acciones específicas que los usuarios pueden realizar
 * en el sistema. Implementa un sistema de permisos granulares siguiendo el patrón:
 * modulo.recurso.accion (ej: usuarios.usuarios.create)
 *
 * Características:
 * - Estructura jerárquica: módulo → recurso → acción
 * - Slug único generado automáticamente
 * - Permisos del sistema protegidos contra eliminación
 * - Validaciones de formato
 * - Métodos de búsqueda optimizados
 *
 * Relaciones:
 * - Se asocia con Roles (Many-to-Many) a través de 'rol_permisos'
 * - Se asocia con Usuarios (Many-to-Many) a través de 'usuario_permisos'
 *
 * @module models/Permiso
 * @requires sequelize
 * @requires config/database
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
import sequelize from "../config/database.js";

/**
 * Definición del modelo Permiso
 * Representa acciones específicas en el sistema RBAC
 */
const Permiso = sequelize.define(
  "Permiso",
  {
    // ============================================
    // IDENTIFICACIÓN
    // ============================================

    /**
     * ID único del permiso
     * Generado automáticamente por MySQL
     */
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del permiso",
    },

    // ============================================
    // ESTRUCTURA DEL PERMISO
    // ============================================

    /**
     * Módulo del sistema al que pertenece el permiso
     * Ejemplos: 'usuarios', 'novedades', 'vehiculos'
     * Representa la sección principal del sistema
     */
    modulo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Módulo del sistema (ej: novedades, vehiculos)",
    },

    /**
     * Recurso específico dentro del módulo
     * Ejemplos: 'usuarios', 'incidentes', 'combustible'
     * Representa la entidad o funcionalidad específica
     */
    recurso: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Recurso específico (ej: incidentes, personal)",
    },

    /**
     * Acción que se puede realizar sobre el recurso
     * Ejemplos: 'create', 'read', 'update', 'delete', 'export'
     * Representa la operación permitida
     */
    accion: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "Acción permitida (ej: create, read, update, delete)",
    },

    /**
     * Slug único del permiso
     * Formato: modulo.recurso.accion
     * Ejemplo: 'usuarios.usuarios.create'
     * Se genera automáticamente en el hook beforeValidate
     */
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: "Formato: modulo.recurso.accion",
    },

    /**
     * Descripción legible del permiso
     * Ayuda a entender qué permite hacer este permiso
     * Ejemplo: 'Crear nuevos usuarios en el sistema'
     */
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción del permiso",
    },

    // ============================================
    // CONTROL Y ESTADO
    // ============================================

    /**
     * Indica si es un permiso del sistema
     * Los permisos del sistema no pueden ser editados ni eliminados
     * por razones de seguridad e integridad
     */
    es_sistema: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "1=Permiso del sistema no editable | 0=Permiso editable",
    },

    /**
     * Estado del permiso
     * true (1) = Activo, false (0) = Inactivo
     * Los permisos inactivos no se pueden asignar
     */
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
    },

    // ============================================
    // AUDITORÍA
    // ============================================

    /**
     * ID del usuario que actualizó el permiso
     */
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro",
    },
  },
  {
    // ============================================
    // CONFIGURACIÓN DEL MODELO
    // ============================================

    tableName: "permisos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at", // Ahora sí se actualiza para auditoría

    /**
     * Índices para optimizar consultas
     */
    indexes: [
      {
        unique: true,
        fields: ["slug"], // Slug debe ser único
      },
      {
        unique: true,
        fields: ["modulo", "recurso", "accion"], // La combinación también es única
      },
      {
        fields: ["modulo"], // Búsquedas por módulo
      },
      {
        fields: ["recurso"], // Búsquedas por recurso
      },
      {
        fields: ["estado"], // Filtrar activos/inactivos
      },
    ],

    /**
     * Hooks del ciclo de vida
     */
    hooks: {
      /**
       * Antes de validar: genera el slug automáticamente
       * Si no existe el slug, lo construye desde módulo, recurso y acción
       */
      beforeValidate: (permiso) => {
        if (
          permiso.modulo &&
          permiso.recurso &&
          permiso.accion &&
          !permiso.slug
        ) {
          // Generar slug en formato estándar
          permiso.slug = `${permiso.modulo}.${permiso.recurso}.${permiso.accion}`;
        }

        // Normalizar a minúsculas y sin espacios
        if (permiso.slug) {
          permiso.slug = permiso.slug.toLowerCase().trim();
        }
      },
    },

    /**
     * Validaciones a nivel de modelo
     */
    validate: {
      /**
       * Validar formato del slug
       * Debe tener exactamente 3 partes separadas por puntos
       * Solo letras minúsculas y guiones bajos
       */
      validSlug() {
        const slugPattern = /^[a-z_]+\.[a-z_]+\.[a-z_]+$/;
        if (this.slug && !slugPattern.test(this.slug)) {
          throw new Error(
            "El slug debe tener el formato: modulo.recurso.accion (solo minúsculas y guiones bajos)"
          );
        }
      },
    },
  }
);

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Buscar permiso por slug
 * @param {string} slug - Slug del permiso
 * @returns {Promise<Object|null>}
 */
Permiso.findBySlug = async function (slug) {
  return await Permiso.findOne({
    where: { slug: slug.toLowerCase(), estado: true },
  });
};

/**
 * Obtener todos los permisos de un módulo
 * @param {string} modulo - Nombre del módulo
 * @returns {Promise<Array>}
 */
Permiso.findByModulo = async function (modulo) {
  return await Permiso.findAll({
    where: {
      modulo: modulo.toLowerCase(),
      estado: true,
    },
    order: [
      ["recurso", "ASC"],
      ["accion", "ASC"],
    ],
  });
};

/**
 * Obtener todos los permisos de un recurso
 * @param {string} recurso - Nombre del recurso
 * @returns {Promise<Array>}
 */
Permiso.findByRecurso = async function (recurso) {
  return await Permiso.findAll({
    where: {
      recurso: recurso.toLowerCase(),
      estado: true,
    },
    order: [
      ["modulo", "ASC"],
      ["accion", "ASC"],
    ],
  });
};

/**
 * Crear permiso con slug automático
 * @param {string} modulo - Módulo
 * @param {string} recurso - Recurso
 * @param {string} accion - Acción
 * @param {string} descripcion - Descripción opcional
 * @returns {Promise<Object>}
 */
Permiso.createWithSlug = async function (
  modulo,
  recurso,
  accion,
  descripcion = null
) {
  const slug = `${modulo}.${recurso}.${accion}`;

  return await Permiso.create({
    modulo: modulo.toLowerCase(),
    recurso: recurso.toLowerCase(),
    accion: accion.toLowerCase(),
    slug,
    descripcion,
  });
};

/**
 * Verificar si un permiso existe
 * @param {string} slug - Slug del permiso
 * @returns {Promise<boolean>}
 */
Permiso.existe = async function (slug) {
  const permiso = await Permiso.findBySlug(slug);
  return permiso !== null;
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Verificar si el permiso es del sistema
 * @returns {boolean}
 */
Permiso.prototype.esSistema = function () {
  return this.es_sistema === true;
};

/**
 * Verificar si está activo
 * @returns {boolean}
 */
Permiso.prototype.estaActivo = function () {
  return this.estado === true;
};

/**
 * Activar permiso
 * @returns {Promise<void>}
 */
Permiso.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

/**
 * Desactivar permiso
 * @returns {Promise<void>}
 */
Permiso.prototype.desactivar = async function () {
  if (this.es_sistema) {
    throw new Error("No se puede desactivar un permiso del sistema");
  }
  this.estado = false;
  await this.save();
};

export default Permiso;
