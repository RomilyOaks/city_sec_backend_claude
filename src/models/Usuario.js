/**
 * Ruta: src/models/Usuario.js
 * Descripción: Modelo Sequelize para la tabla 'usuarios'
 * Define la estructura y relaciones del modelo Usuario con soporte para
 * autenticación OAuth2, 2FA y gestión de roles mediante RBAC
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
import sequelize from "../config/database.js";

const Usuario = sequelize.define(
  "Usuario",
  {
    // Columnas de identificación principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID único del usuario",
    },

    // Credenciales de acceso
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Nombre de usuario único",
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      comment: "Email único del usuario",
    },

    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de verificación de email",
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Hash bcrypt del password",
    },

    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Última vez que cambió su password",
    },

    require_password_change: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Debe cambiar password en próximo login",
    },

    // Relación con personal de seguridad
    personal_seguridad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "FK a personal_seguridad si es usuario interno",
    },

    // Datos personales
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    foto_perfil: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // Configuración OAuth2
    oauth_provider: {
      type: DataTypes.ENUM(
        "LOCAL",
        "GOOGLE",
        "MICROSOFT",
        "AZURE_AD",
        "GITHUB"
      ),
      defaultValue: "LOCAL",
      comment: "Proveedor de autenticación OAuth",
    },

    oauth_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "ID del usuario en el proveedor OAuth",
    },

    oauth_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Token de OAuth (encriptado)",
    },

    oauth_refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Refresh token de OAuth (encriptado)",
    },

    // Control de acceso y seguridad
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Intentos fallidos de login",
    },

    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Bloqueo temporal por intentos fallidos",
    },

    // Autenticación de dos factores (2FA)
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si 2FA está habilitado",
    },

    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Secret para TOTP (encriptado)",
    },

    two_factor_recovery_codes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Códigos de recuperación 2FA",
    },

    // Estado del usuario
    estado: {
      type: DataTypes.ENUM("ACTIVO", "INACTIVO", "BLOQUEADO", "PENDIENTE"),
      defaultValue: "PENDIENTE",
      comment: "Estado actual del usuario",
    },

    // Auditoría y eliminación lógica
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

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
    // Configuración del modelo
    tableName: "usuarios",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false, // No usar paranoid porque usamos deleted_at manual

    // Índices adicionales (los principales ya están en la BD)
    indexes: [
      {
        fields: ["email"],
        unique: true,
      },
      {
        fields: ["username"],
        unique: true,
      },
      {
        fields: ["estado", "email_verified_at"],
      },
    ],

    // Hooks del modelo
    hooks: {
      // Antes de crear, validar datos
      beforeCreate: (usuario) => {
        // Asegurar que el email esté en minúsculas
        if (usuario.email) {
          usuario.email = usuario.email.toLowerCase();
        }
        // Asegurar que el username esté en minúsculas
        if (usuario.username) {
          usuario.username = usuario.username.toLowerCase();
        }
      },

      // Antes de actualizar
      beforeUpdate: (usuario) => {
        if (usuario.changed("email")) {
          usuario.email = usuario.email.toLowerCase();
        }
        if (usuario.changed("username")) {
          usuario.username = usuario.username.toLowerCase();
        }
      },
    },

    // Métodos de instancia
    instanceMethods: {
      // Método para obtener datos públicos del usuario (sin info sensible)
      toJSON: function () {
        const values = Object.assign({}, this.get());

        // Eliminar campos sensibles antes de enviar al cliente
        delete values.password_hash;
        delete values.two_factor_secret;
        delete values.two_factor_recovery_codes;
        delete values.oauth_token;
        delete values.oauth_refresh_token;

        return values;
      },
    },
  }
);

/**
 * Métodos de clase estáticos
 */

// Método para verificar si el usuario está bloqueado
Usuario.isLocked = function (usuario) {
  if (!usuario.locked_until) return false;
  return new Date() < new Date(usuario.locked_until);
};

// Método para verificar si debe cambiar contraseña
Usuario.requiresPasswordChange = function (usuario) {
  return usuario.require_password_change === true;
};

// Método para obtener usuario con sus roles
Usuario.findWithRoles = async function (userId) {
  return await Usuario.findByPk(userId, {
    include: [
      {
        association: "roles",
        through: { attributes: [] }, // No incluir campos de la tabla intermedia
      },
    ],
  });
};

export default Usuario;
