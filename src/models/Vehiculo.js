/**
 * Ruta: src/models/Vehiculo.js
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
 *
 * @module models/Vehiculo
 * @requires sequelize
 * @requires config/database
 */

import { DataTypes } from "sequelize";

import sequelize from "../config/database.js";

const Vehiculo = sequelize.define(
  "Vehiculo",
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
     * Foreign Key al tipo de vehículo
     * Ejemplo: 1=Móvil, 2=Motocicleta, 3=Camioneta
     */
    tipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tipos_vehiculo",
        key: "id",
      },
      comment: "ID del tipo de vehículo",
    },

    /**
     * Código único del vehículo
     * Formato sugerido:
     * - M-01, M-02, M-03... para móviles
     * - H-01, H-02, H-03... para motocicletas (Honda)
     * - C-01, C-02, C-03... para camionetas
     */
    codigo_vehiculo: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
      comment: "Código identificador del vehículo (ej: M-01, H-01)",
    },

    /**
     * Nombre o denominación del vehículo
     * Ejemplo: 'Móvil 01', 'Moto Patrullero'
     */
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Nombre o denominación del vehículo",
    },

    /**
     * Placa del vehículo (ÚNICO en la BD)
     * Formato Perú: ABC-123, A1B-234
     */
    placa: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: "Placa del vehículo (único)",
    },

    /**
     * Marca del vehículo
     * Ejemplo: Toyota, Honda, Nissan, KIA
     */
    marca: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Marca del vehículo",
    },

    // ============================================
    // DOCUMENTACIÓN Y MANTENIMIENTO
    // ============================================

    /**
     * Número de póliza del SOAT
     */
    soat: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Número de póliza del SOAT",
    },

    /**
     * Fecha de vencimiento del SOAT
     * Importante para alertas de renovación
     */
    fec_soat: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de vencimiento del SOAT",
    },

    /**
     * Fecha del próximo mantenimiento
     * Permite programar mantenimientos preventivos
     */
    fec_manten: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha del próximo mantenimiento",
    },

    // ============================================
    // CONTROL
    // ============================================

    /**
     * Estado del vehículo
     * true (1) = Activo/Operativo
     * false (0) = Inactivo/En mantenimiento
     */
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activo/Operativo | 0=Inactivo/Mantenimiento",
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
    tableName: "vehiculos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        unique: true,
        fields: ["placa"],
      },
      {
        unique: true,
        fields: ["codigo_vehiculo"],
      },
      {
        fields: ["tipo_id"],
      },
      {
        fields: ["estado"],
      },
      {
        // Índice compuesto para búsquedas comunes
        fields: ["codigo_vehiculo", "tipo_id"],
      },
    ],

    hooks: {
      /**
       * Antes de crear: normalizar placa y generar código si no existe
       */
      beforeCreate: async (vehiculo) => {
        // Normalizar placa a mayúsculas
        if (vehiculo.placa) {
          vehiculo.placa = vehiculo.placa.toUpperCase().trim();
        }

        // Generar código automático si no se proporcionó
        if (!vehiculo.codigo_vehiculo) {
          // Obtener el tipo de vehículo para determinar el prefijo
          const tipoVehiculo = await sequelize.models.TipoVehiculo.findByPk(
            vehiculo.tipo_id
          );

          if (tipoVehiculo) {
            // Determinar prefijo según el tipo
            let prefijo = "V"; // V=Vehículo genérico

            if (tipoVehiculo.nombre.toLowerCase().includes("móvil")) {
              prefijo = "M";
            } else if (tipoVehiculo.nombre.toLowerCase().includes("moto")) {
              prefijo = "H";
            } else if (
              tipoVehiculo.nombre.toLowerCase().includes("camioneta")
            ) {
              prefijo = "C";
            } else if (
              tipoVehiculo.nombre.toLowerCase().includes("bicicleta")
            ) {
              prefijo = "B";
            }

            // Buscar el último vehículo con ese prefijo
            const ultimoVehiculo = await Vehiculo.findOne({
              where: {
                codigo_vehiculo: {
                  [sequelize.Sequelize.Op.like]: `${prefijo}-%`,
                },
              },
              order: [["codigo_vehiculo", "DESC"]],
              attributes: ["codigo_vehiculo"],
            });

            if (ultimoVehiculo) {
              // Extraer número y sumar 1
              const numeroActual = parseInt(
                ultimoVehiculo.codigo_vehiculo.split("-")[1]
              );
              vehiculo.codigo_vehiculo = `${prefijo}-${String(
                numeroActual + 1
              ).padStart(2, "0")}`;
            } else {
              // Primer vehículo de este tipo
              vehiculo.codigo_vehiculo = `${prefijo}-01`;
            }
          }
        }
      },

      /**
       * Antes de actualizar: normalizar placa si cambió
       */
      beforeUpdate: (vehiculo) => {
        if (vehiculo.changed("placa")) {
          vehiculo.placa = vehiculo.placa.toUpperCase().trim();
        }
      },
    },
  }
);

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener vehículos activos
 */
Vehiculo.findActivos = async function () {
  return await Vehiculo.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "tipo",
        attributes: ["id", "nombre"],
      },
    ],
    order: [["codigo_vehiculo", "ASC"]],
  });
};

/**
 * Buscar por placa
 */
Vehiculo.findByPlaca = async function (placa) {
  return await Vehiculo.findOne({
    where: {
      placa: placa.toUpperCase(),
      deleted_at: null,
    },
    include: [
      {
        association: "tipo",
      },
    ],
  });
};

/**
 * Obtener vehículos con SOAT próximo a vencer
 */
Vehiculo.findSOATProximoVencer = async function (diasAntes = 30) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + diasAntes);

  return await Vehiculo.findAll({
    where: {
      fec_soat: {
        [sequelize.Sequelize.Op.lte]: fechaLimite,
        [sequelize.Sequelize.Op.gte]: new Date(),
      },
      estado: true,
      deleted_at: null,
    },
    order: [["fec_soat", "ASC"]],
  });
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Verificar si el SOAT está vigente
 */
Vehiculo.prototype.tieneSOATVigente = function () {
  if (!this.fec_soat) return false;
  return new Date(this.fec_soat) >= new Date();
};

/**
 * Soft delete
 */
Vehiculo.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

export default Vehiculo;
