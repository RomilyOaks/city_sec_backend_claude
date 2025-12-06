/**
 * Ruta: src/models/Usuario.js
 * Descripción: Modelo Sequelize para la tabla 'usuarios'
 * Define la estructura y relaciones del modelo Usuario con soporte para
 * autenticación OAuth2, 2FA y gestión de roles mediante RBAC
 */

import { DataTypes } from "sequelize";

// Importar el modelo de historial para usar en los hooks
import HistorialUsuario from "./HistorialUsuario.js";

import sequelize from "../config/database.js";

// ===============================================
// FUNCIONES DE UTILIDAD PARA AUDITORÍA
// ===============================================

/**
 * Obtiene el ID del usuario que realiza la acción, la IP y el User Agent
 * desde las opciones de la transacción (options).
 * @param {object} options - Opciones pasadas a la operación de Sequelize.
 * @returns {object} Datos de auditoría.
 */
function getAuditData(options) {
  // Estas variables deben ser pasadas desde el controlador/servicio
  const userId = options.currentUser || null;
  const ipAddress = options.ipAddress || null;
  const userAgent = options.userAgent || null;

  return {
    realizado_por: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
  };
}

/**
 * Compara los valores previos y nuevos de una instancia para registrar cambios específicos.
 * Se excluyen campos de metadatos de actualización automática.
 * @param {object} instance - Instancia del modelo.
 * @returns {Array<object>} Lista de objetos de cambio.
 */
function getChanges(instance) {
  const changes = [];
  const fieldsToExclude = [
    "updated_at",
    "updated_by",
    "last_login_at",
    "last_login_ip",
    "last_activity_at",
    "failed_login_attempts",
    "locked_until",
  ];

  for (const field of instance.changed()) {
    if (fieldsToExclude.includes(field)) {
      continue;
    }

    let valorAnterior = instance._previousDataValues[field];
    let valorNuevo = instance.dataValues[field];
    let accion = "actualizacion";

    // Casos especiales
    if (field === "password_hash") {
      accion = "cambio_password";
      valorAnterior = "***"; // No registrar el hash anterior
      valorNuevo = "***"; // No registrar el hash nuevo
    } else if (field === "estado") {
      accion = "cambio_estado";
    }

    changes.push({
      usuario_id: instance.id,
      accion: accion,
      campo_modificado: field,
      valor_anterior: JSON.stringify(valorAnterior),
      valor_nuevo: JSON.stringify(valorNuevo),
      descripcion: `Cambio en el campo '${field}'`,
    });
  }

  return changes;
}

// ===============================================
// DEFINICIÓN DEL MODELO
// ===============================================

const Usuario = sequelize.define(
  "Usuario",
  {
    // Columnas de identificación principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID único del usuario",
    }, // Credenciales de acceso

    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Nombre de usuario único",
    }, // ... [Resto de atributos del modelo sin cambios] ...

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
    }, // Relación con personal de seguridad

    personal_seguridad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "FK a personal_seguridad si es usuario interno",
    }, // Datos personales

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
    }, // Configuración OAuth2

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
    }, // Control de acceso y seguridad

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
    }, // Autenticación de dos factores (2FA)

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
    }, // Estado del usuario

    estado: {
      type: DataTypes.ENUM("ACTIVO", "INACTIVO", "BLOQUEADO", "PENDIENTE"),
      defaultValue: "PENDIENTE",
      comment: "Estado actual del usuario",
    }, // Auditoría y eliminación lógica

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
    paranoid: false, // No usar paranoid porque usamos deleted_at manual // Índices adicionales (los principales ya están en la BD)

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
    ], // Hooks del modelo

    hooks: {
      // Antes de crear, validar datos
      beforeCreate: (usuario) => {
        // Asegurar que el email esté en minúsculas
        if (usuario.email) {
          usuario.email = usuario.email.toLowerCase();
        } // Asegurar que el username esté en minúsculas
        if (usuario.username) {
          usuario.username = usuario.username.toLowerCase();
        }
      }, // Antes de actualizar

      beforeUpdate: (usuario) => {
        if (usuario.changed("email")) {
          usuario.email = usuario.email.toLowerCase();
        }
        if (usuario.changed("username")) {
          usuario.username = usuario.username.toLowerCase();
        }
      },

      // ============================================
      // HOOKS DE AUDITORÍA (POST-OPERACIÓN)
      // ============================================

      /**
       * Registra la creación del usuario en el historial.
       * Se ejecuta después de que el registro se ha guardado exitosamente.
       */
      afterCreate: async (usuario, options) => {
        try {
          const auditData = getAuditData(options);

          await HistorialUsuario.create(
            {
              usuario_id: usuario.id,
              accion: "creacion",
              descripcion: `Usuario creado: ${usuario.username} (${usuario.email})`,
              ...auditData,
            },
            { transaction: options.transaction }
          );
        } catch (error) {
          console.error("Error en afterCreate hook de Usuario:", error);
          // NOTA: Si este hook falla, se puede revertir la creación del usuario
          // si la operación se envuelve en una transacción.
        }
      },

      /**
       * Registra los cambios de campos en el usuario en el historial.
       * Se ejecuta después de que la actualización se ha guardado exitosamente.
       */
      afterUpdate: async (usuario, options) => {
        try {
          // Obtener el ID del usuario que realizó el cambio y la información de la petición
          const auditData = getAuditData(options);

          // Obtener todos los campos que fueron modificados
          const changes = getChanges(usuario);

          if (changes.length > 0) {
            // Mapear los cambios para incluir los datos de auditoría
            const auditRecords = changes.map((change) => ({
              ...change,
              ...auditData,
            }));

            // Crear múltiples registros de historial en una sola operación
            await HistorialUsuario.bulkCreate(auditRecords, {
              transaction: options.transaction,
            });
          }

          // Manejo de la eliminación lógica si se usa soft-delete manual
          if (usuario.changed("deleted_at") && usuario.deleted_at !== null) {
            await HistorialUsuario.create(
              {
                usuario_id: usuario.id,
                accion: "eliminacion",
                descripcion: `Usuario eliminado lógicamente. Eliminado por ID: ${usuario.deleted_by}`,
                ...auditData,
              },
              { transaction: options.transaction }
            );
          }
        } catch (error) {
          console.error("Error en afterUpdate hook de Usuario:", error);
          // NOTA: Si este hook falla, se puede revertir la actualización del usuario
          // si la operación se envuelve en una transacción.
        }
      },

      /**
       * Hook para registrar la restauración (si implementas una ruta de 'restaurar')
       * NOTA: Requiere que tengas un método para actualizar deleted_at a NULL
       */
      afterDestroy: async (usuario, options) => {
        // Este hook se dispara después de una ELIMINACIÓN PERMANENTE o SOFT DELETE
        // Como tu usas 'deleted_at' manual, el afterUpdate superior ya maneja la 'eliminacion' lógica.
        // Si usaras `paranoid: true` o una eliminación física, este hook sería más apropiado.
      },
    }, // Métodos de instancia

    instanceMethods: {
      // Método para obtener datos públicos del usuario (sin info sensible)
      toJSON: function () {
        const values = Object.assign({}, this.get()); // Eliminar campos sensibles antes de enviar al cliente

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
