/**
 * Ruta: src/models/PersonalSeguridad.js
 * Descripción: Modelo Sequelize para la tabla 'personal_seguridad'
 * Gestiona la información del personal que trabaja en seguridad ciudadana
 * Incluye serenos, supervisores, operadores, etc.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PersonalSeguridad = sequelize.define(
  "PersonalSeguridad",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del personal",
    },

    // Tipo de documento de identidad
    doc_tipo: {
      type: DataTypes.ENUM("DNI", "Carnet Extranjeria", "Pasaporte", "PTP"),
      allowNull: false,
      defaultValue: "DNI",
      comment: "Tipo de documento de identidad",
    },

    // Número de documento
    doc_numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "Número de documento de identidad",
    },

    // Datos personales - Apellidos
    apellido_paterno: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Apellido paterno del personal",
    },

    apellido_materno: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Apellido materno del personal",
    },

    // Nombres
    nombres: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombres del personal",
    },

    // Sexo
    sexo: {
      type: DataTypes.ENUM("Masculino", "Femenino"),
      allowNull: true,
      comment: "Sexo del personal",
    },

    // Fecha de nacimiento
    fecha_nacimiento: {
      type: DataTypes.DATEONLY, // Solo fecha, sin hora
      allowNull: true,
      comment: "Fecha de nacimiento del personal",
    },

    // Nacionalidad
    nacionalidad: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Peruana",
      comment: "Nacionalidad del personal",
    },

    // Dirección de residencia
    direccion: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Dirección de residencia del personal",
    },

    // Ubigeo de residencia (FK)
    ubigeo_code: {
      type: DataTypes.CHAR(6),
      allowNull: true,
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
      comment: "Código de ubigeo de residencia",
    },

    // Cargo que desempeña (FK)
    cargo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "cargos",
        key: "id",
      },
      comment: "ID del cargo que desempeña",
    },

    // Datos laborales
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de ingreso a la institución",
    },

    fecha_baja: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de baja/cese del personal",
    },

    // Estado laboral
    status: {
      type: DataTypes.ENUM("Activo", "Inactivo", "Suspendido", "Retirado"),
      allowNull: true,
      defaultValue: "Activo",
      comment: "Estado laboral del personal",
    },

    // Licencia de conducir
    licencia: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Número de licencia de conducir",
    },

    categoria: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Categoría de licencia de conducir (A-I, A-II-A, etc.)",
    },

    vigencia: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de vigencia de la licencia",
    },

    // Régimen laboral
    regimen: {
      type: DataTypes.ENUM(
        "256",
        "276",
        "728",
        "1057 CAS",
        "Orden Servicio",
        "Practicante"
      ),
      allowNull: true,
      comment: "Régimen laboral del personal",
    },

    // Vehículo asignado (FK) - opcional
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "vehiculos",
        key: "id",
      },
      comment: "ID del vehículo asignado al personal",
    },

    // Código de acceso/credencial
    codigo_acceso: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "Código de acceso o credencial del personal",
    },

    // Foto del personal
    foto: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "URL o ruta de la foto del personal",
    },

    // Estado del registro
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
    },

    // Eliminación lógica
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    // Auditoría
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que creó el registro",
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro",
    },
  },
  {
    tableName: "personal_seguridad",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // Índices
    indexes: [
      {
        // Índice compuesto único: tipo y número de documento
        unique: true,
        fields: ["doc_tipo", "doc_numero"],
      },
      {
        fields: ["cargo_id"],
      },
      {
        fields: ["ubigeo_code"],
      },
      {
        fields: ["vehiculo_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["estado"],
      },
      {
        // Índice compuesto para búsquedas por nombre
        fields: ["apellido_paterno", "apellido_materno", "nombres"],
      },
    ],

    // Validaciones a nivel de modelo
    validate: {
      // Validar que la fecha de baja sea posterior a la de ingreso
      fechasValidas() {
        if (this.fecha_ingreso && this.fecha_baja) {
          if (new Date(this.fecha_baja) < new Date(this.fecha_ingreso)) {
            throw new Error(
              "La fecha de baja no puede ser anterior a la fecha de ingreso"
            );
          }
        }
      },

      // Validar que la fecha de nacimiento sea válida
      fechaNacimientoValida() {
        if (this.fecha_nacimiento) {
          const edad = Math.floor(
            (new Date() - new Date(this.fecha_nacimiento)) /
              (365.25 * 24 * 60 * 60 * 1000)
          );
          if (edad < 18) {
            throw new Error("El personal debe ser mayor de 18 años");
          }
          if (edad > 100) {
            throw new Error("Fecha de nacimiento inválida");
          }
        }
      },
    },

    // Hooks
    hooks: {
      // Antes de guardar, normalizar nombres
      beforeSave: (personal) => {
        // Convertir nombres y apellidos a formato Title Case
        if (personal.nombres) {
          personal.nombres = personal.nombres
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }

        if (personal.apellido_paterno) {
          personal.apellido_paterno = personal.apellido_paterno.toUpperCase();
        }

        if (personal.apellido_materno) {
          personal.apellido_materno = personal.apellido_materno.toUpperCase();
        }

        // Normalizar número de documento
        if (personal.doc_numero) {
          personal.doc_numero = personal.doc_numero.trim().toUpperCase();
        }
      },
    },
  }
);

/**
 * Métodos estáticos
 */

// Buscar personal activo
PersonalSeguridad.findActivos = async function () {
  return await PersonalSeguridad.findAll({
    where: {
      status: "Activo",
      estado: true,
      deleted_at: null,
    },
    include: [
      { association: "cargo", attributes: ["id", "nombre"] },
      {
        association: "ubicacion",
        attributes: ["distrito", "provincia", "departamento"],
      },
    ],
    order: [
      ["apellido_paterno", "ASC"],
      ["apellido_materno", "ASC"],
    ],
  });
};

// Buscar por documento
PersonalSeguridad.findByDocumento = async function (tipoDoc, numeroDoc) {
  return await PersonalSeguridad.findOne({
    where: {
      doc_tipo: tipoDoc,
      doc_numero: numeroDoc,
    },
    include: [
      { association: "cargo" },
      { association: "ubicacion" },
      { association: "vehiculoAsignado" },
    ],
  });
};

// Buscar por cargo
PersonalSeguridad.findByCargo = async function (cargoId) {
  return await PersonalSeguridad.findAll({
    where: {
      cargo_id: cargoId,
      status: "Activo",
      estado: true,
      deleted_at: null,
    },
    order: [["apellido_paterno", "ASC"]],
  });
};

// Obtener personal con licencia de conducir vigente
PersonalSeguridad.findConLicenciaVigente = async function () {
  const hoy = new Date();

  return await PersonalSeguridad.findAll({
    where: {
      licencia: { [sequelize.Sequelize.Op.ne]: null },
      vigencia: { [sequelize.Sequelize.Op.gte]: hoy },
      status: "Activo",
      estado: true,
      deleted_at: null,
    },
    order: [["apellido_paterno", "ASC"]],
  });
};

// Obtener personal disponible (activo sin vehículo asignado)
PersonalSeguridad.findDisponibles = async function () {
  return await PersonalSeguridad.findAll({
    where: {
      vehiculo_id: null,
      status: "Activo",
      estado: true,
      deleted_at: null,
    },
    include: [{ association: "cargo", attributes: ["id", "nombre"] }],
    order: [["apellido_paterno", "ASC"]],
  });
};

/**
 * Métodos de instancia
 */

// Obtener nombre completo
PersonalSeguridad.prototype.getNombreCompleto = function () {
  return `${this.nombres} ${this.apellido_paterno} ${this.apellido_materno}`;
};

// Obtener apellidos completos
PersonalSeguridad.prototype.getApellidos = function () {
  return `${this.apellido_paterno} ${this.apellido_materno}`;
};

// Calcular edad
PersonalSeguridad.prototype.getEdad = function () {
  if (!this.fecha_nacimiento) return null;

  const hoy = new Date();
  const nacimiento = new Date(this.fecha_nacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
};

// Verificar si tiene licencia vigente
PersonalSeguridad.prototype.tieneLicenciaVigente = function () {
  if (!this.licencia || !this.vigencia) return false;
  return new Date(this.vigencia) >= new Date();
};

// Verificar si está activo
PersonalSeguridad.prototype.estaActivo = function () {
  return (
    this.status === "Activo" && this.estado === true && this.deleted_at === null
  );
};

// Dar de baja
PersonalSeguridad.prototype.darDeBaja = async function (fecha = null) {
  this.fecha_baja = fecha || new Date();
  this.status = "Retirado";
  await this.save();
};

// Soft delete
PersonalSeguridad.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  this.status = "Inactivo";
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

export default PersonalSeguridad;
