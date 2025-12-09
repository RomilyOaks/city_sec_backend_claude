/*
 ============================================
 Ruta: src/models/Vehiculo.js
 ============================================
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'vehiculos' de la base de datos.
 * Gestiona la flota de vehículos del sistema de seguridad ciudadana.
 *
 * Características:
 * - Código único de identificación (M-01, H-01, etc.)
 * - Relación con tipo de vehículo
 * - Datos de SOAT y mantenimiento
 * - Soft delete para auditoría
 * - Generación automática de códigos
 *
 * Relaciones:
 * - Pertenece a un TipoVehiculo (Many-to-One)
 * - Puede estar asignado a PersonalSeguridad (One-to-Many)
 * - Tiene registros de Abastecimiento (One-to-Many)
 * - Incluye relación con UnidadOficina
 *
 */

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Vehiculo extends Model {
  /**
   * Definir asociaciones del modelo
   */
  static associate(models) {
    // Relación con TipoVehiculo (Muchos a Uno)
    Vehiculo.belongsTo(models.TipoVehiculo, {
      foreignKey: "tipo_id",
      as: "tipo",
    });

    // Relación con UnidadOficina (Muchos a Uno)
    Vehiculo.belongsTo(models.UnidadOficina, {
      foreignKey: "unidad_oficina_id",
      as: "unidad",
    });

    // Relación con PersonalSeguridad - Conductor Asignado (Muchos a Uno)
    Vehiculo.belongsTo(models.PersonalSeguridad, {
      foreignKey: "conductor_asignado_id",
      as: "conductorAsignado",
    });

    // Relación con Novedades (Uno a Muchos)
    Vehiculo.hasMany(models.Novedad, {
      foreignKey: "vehiculo_asignado_id",
      as: "novedades",
    });

    // Relación con Usuario - Creador (Muchos a Uno)
    Vehiculo.belongsTo(models.Usuario, {
      foreignKey: "created_by",
      as: "creador",
    });

    // Relación con Usuario - Actualizador (Muchos a Uno)
    Vehiculo.belongsTo(models.Usuario, {
      foreignKey: "updated_by",
      as: "actualizador",
    });
  }
}

Vehiculo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tipos_vehiculo",
        key: "id",
      },
      comment: "Tipo de vehículo (móvil, moto, etc.)",
    },
    codigo_vehiculo: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
      comment:
        "Código identificador del vehículo (ej: M-01, M-02 para móviles, H-01, H-02 para motos)",
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nombre descriptivo del vehículo",
    },
    placa: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: "Placa del vehículo",
    },
    marca: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Marca del vehículo",
    },
    modelo_vehiculo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Modelo del vehículo",
    },
    anio_vehiculo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Año de fabricación",
    },
    color_vehiculo: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: "Color del vehículo",
    },
    numero_motor: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Número de motor",
    },
    numero_chasis: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Número de chasis",
    },
    kilometraje_inicial: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Kilometraje al momento del registro",
    },
    kilometraje_actual: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Kilometraje actual del vehículo",
    },
    capacidad_combustible: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: "Capacidad de tanque en galones",
    },
    unidad_oficina_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "unidades_oficina",
        key: "id",
      },
      comment: "Unidad a la que pertenece el vehículo",
    },
    conductor_asignado_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "personal_seguridad",
        key: "id",
      },
      comment: "Conductor asignado permanentemente",
    },
    estado_operativo: {
      type: DataTypes.ENUM(
        "DISPONIBLE",
        "EN_SERVICIO",
        "MANTENIMIENTO",
        "REPARACION",
        "FUERA_DE_SERVICIO",
        "INACTIVO"
      ),
      allowNull: false,
      defaultValue: "DISPONIBLE",
      comment: "Estado operativo actual del vehículo",
    },
    soat: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Número de póliza SOAT",
    },
    fec_soat: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de vencimiento del SOAT",
    },
    fec_manten: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha del próximo mantenimiento",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones adicionales",
    },
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1=Activo | 0=Inactivo",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación (soft delete)",
    },
    deleted_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Usuario que eliminó",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Vehiculo",
    tableName: "vehiculos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false, // No usar paranoid porque usamos soft delete manual
    hooks: {
      /**
       * Antes de crear: Generar código automático si no se proporciona
       */
      beforeCreate: async (vehiculo, options) => {
        if (!vehiculo.codigo_vehiculo) {
          // Obtener el tipo de vehículo para generar el código
          const TipoVehiculo = sequelize.models.TipoVehiculo;
          const tipo = await TipoVehiculo.findByPk(vehiculo.tipo_id);

          if (tipo) {
            // Generar prefijo según el tipo (primera letra del nombre)
            const prefijo = tipo.nombre.substring(0, 1).toUpperCase();

            // Buscar el último código con ese prefijo
            const ultimoVehiculo = await Vehiculo.findOne({
              where: {
                codigo_vehiculo: {
                  [sequelize.Sequelize.Op.like]: `${prefijo}-%`,
                },
              },
              order: [["codigo_vehiculo", "DESC"]],
              transaction: options.transaction,
            });

            let nuevoNumero = 1;
            if (ultimoVehiculo && ultimoVehiculo.codigo_vehiculo) {
              const partes = ultimoVehiculo.codigo_vehiculo.split("-");
              if (partes.length === 2) {
                const numeroActual = parseInt(partes[1]);
                if (!isNaN(numeroActual)) {
                  nuevoNumero = numeroActual + 1;
                }
              }
            }

            // Generar código: PREFIJO-NUMERO (ej: M-01, M-02, H-01)
            vehiculo.codigo_vehiculo = `${prefijo}-${String(
              nuevoNumero
            ).padStart(2, "0")}`;
          }
        }

        // Convertir placa a mayúsculas
        if (vehiculo.placa) {
          vehiculo.placa = vehiculo.placa.toUpperCase();
        }
      },

      /**
       * Antes de actualizar: Convertir placa a mayúsculas
       */
      beforeUpdate: (vehiculo) => {
        if (vehiculo.changed("placa") && vehiculo.placa) {
          vehiculo.placa = vehiculo.placa.toUpperCase();
        }
      },
    },
  }
);

export default Vehiculo;
