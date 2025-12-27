/**
 * Ruta: src/models/SubtipoNovedad.js
 * Descripción: Modelo Sequelize para la tabla 'subtipos_novedad'
 * Define subtipos específicos de novedades/incidentes dentro de cada tipo
 * Ejemplos: Robo de Vehículo, Robo a Persona, Violencia Familiar, etc.
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
import sequelize from "../config/database.js";

const SubtipoNovedad = sequelize.define(
  "SubtipoNovedad",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del subtipo",
    },

    // Tipo de novedad al que pertenece (FK)
    tipo_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tipos_novedad",
        key: "id",
      },
      comment: "ID del tipo de novedad al que pertenece",
    },

    // Código único del subtipo (ST001, ST002, etc.)
    subtipo_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: "Código único del subtipo (ej: ST001, ST002)",
    },

    // Nombre del subtipo
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      comment: "Nombre descriptivo del subtipo",
    },

    // Descripción
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada del subtipo",
    },

    // Nivel de prioridad
    prioridad: {
      type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
      allowNull: false,
      defaultValue: "MEDIA",
      comment: "Nivel de prioridad del incidente",
    },

    // Tiempo de respuesta esperado en minutos
    tiempo_respuesta_min: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Tiempo de respuesta esperado en minutos",
    },

    // Indicadores de apoyo requerido
    requiere_ambulancia: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "1=Requiere ambulancia | 0=No requiere",
    },

    requiere_bomberos: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "1=Requiere bomberos | 0=No requiere",
    },

    requiere_pnp: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "1=Requiere PNP | 0=No requiere",
    },

    // Orden de visualización
    orden: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Orden de visualización dentro del tipo",
    },

    // Estado del subtipo
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

    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que eliminó el registro",
    },
  },
  {
    tableName: "subtipos_novedad",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",

    // Índices
    indexes: [
      {
        unique: true,
        fields: ["subtipo_code"],
      },
      {
        fields: ["tipo_novedad_id"],
      },
      {
        fields: ["prioridad"],
      },
      {
        fields: ["estado", "orden"],
      },
    ],

    // Validaciones a nivel de modelo
    validate: {
      // Validar que el tiempo de respuesta sea positivo
      tiempoRespuestaValido() {
        if (
          this.tiempo_respuesta_min !== null &&
          this.tiempo_respuesta_min <= 0
        ) {
          throw new Error("El tiempo de respuesta debe ser un valor positivo");
        }
      },

      // Validar que el orden sea positivo
      ordenValido() {
        if (this.orden !== null && this.orden < 0) {
          throw new Error("El orden debe ser un valor positivo o cero");
        }
      },
    },

    // Hooks
    hooks: {
      // Antes de crear, generar código automático si no se proporciona
      beforeCreate: async (subtipoNovedad) => {
        if (!subtipoNovedad.subtipo_code) {
          const ultimoSubtipo = await SubtipoNovedad.findOne({
            order: [["subtipo_code", "DESC"]],
            attributes: ["subtipo_code"],
          });

          if (ultimoSubtipo && /^ST\d+$/.test(ultimoSubtipo.subtipo_code)) {
            const numeroActual = parseInt(
              ultimoSubtipo.subtipo_code.replace("ST", "")
            );
            subtipoNovedad.subtipo_code = `ST${String(
              numeroActual + 1
            ).padStart(3, "0")}`;
          } else {
            subtipoNovedad.subtipo_code = "ST001";
          }
        }

        subtipoNovedad.subtipo_code = subtipoNovedad.subtipo_code.toUpperCase();
      },
    },
  }
);

/**
 * Métodos estáticos
 */

// Obtener subtipos activos de un tipo
SubtipoNovedad.findByTipo = async function (tipoId) {
  return await SubtipoNovedad.findAll({
    where: {
      tipo_novedad_id: tipoId,
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "tipo",
        attributes: ["id", "nombre", "tipo_code", "color_hex"],
      },
    ],
    order: [
      ["orden", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

// Buscar subtipo por código
SubtipoNovedad.findByCode = async function (code) {
  return await SubtipoNovedad.findOne({
    where: {
      subtipo_code: code.toUpperCase(),
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "tipo",
        attributes: ["id", "nombre", "tipo_code"],
      },
    ],
  });
};

// Obtener subtipos por prioridad
SubtipoNovedad.findByPrioridad = async function (prioridad) {
  return await SubtipoNovedad.findAll({
    where: {
      prioridad: prioridad,
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "tipo",
        attributes: ["id", "nombre", "tipo_code"],
      },
    ],
    order: [["tiempo_respuesta_min", "ASC"]],
  });
};

// Obtener subtipos que requieren apoyo específico
SubtipoNovedad.findConRequerimiento = async function (requerimiento) {
  const whereClause = {
    estado: true,
    deleted_at: null,
  };

  switch (requerimiento) {
    case "ambulancia":
      whereClause.requiere_ambulancia = true;
      break;
    case "bomberos":
      whereClause.requiere_bomberos = true;
      break;
    case "pnp":
      whereClause.requiere_pnp = true;
      break;
  }

  return await SubtipoNovedad.findAll({
    where: whereClause,
    include: [
      {
        association: "tipo",
        attributes: ["id", "nombre", "tipo_code"],
      },
    ],
    order: [["prioridad", "DESC"]],
  });
};

// Obtener catálogo completo (tipos con subtipos)
SubtipoNovedad.getCatalogoCompleto = async function () {
  const TipoNovedad = sequelize.models.TipoNovedad;

  return await TipoNovedad.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        model: SubtipoNovedad,
        as: "subtipos",
        where: {
          estado: true,
          deleted_at: null,
        },
        required: false,
      },
    ],
    order: [
      ["orden", "ASC"],
      ["nombre", "ASC"],
      [{ model: SubtipoNovedad, as: "subtipos" }, "orden", "ASC"],
    ],
  });
};

// Obtener estadísticas por prioridad
SubtipoNovedad.getEstadisticasPorPrioridad = async function () {
  return await SubtipoNovedad.findAll({
    attributes: [
      "prioridad",
      [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      [
        sequelize.fn("AVG", sequelize.col("tiempo_respuesta_min")),
        "tiempo_promedio",
      ],
    ],
    where: {
      estado: true,
      deleted_at: null,
    },
    group: ["prioridad"],
    order: [[sequelize.literal("FIELD(prioridad, 'ALTA', 'MEDIA', 'BAJA')")]],
    raw: true,
  });
};

/**
 * Métodos de instancia
 */

// Activar subtipo
SubtipoNovedad.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

// Desactivar subtipo
SubtipoNovedad.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

// Soft delete
SubtipoNovedad.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

// Verificar si es alta prioridad
SubtipoNovedad.prototype.esAltaPrioridad = function () {
  return this.prioridad === "ALTA";
};

// Verificar si requiere apoyo externo
SubtipoNovedad.prototype.requiereApoyoExterno = function () {
  return (
    this.requiere_ambulancia || this.requiere_bomberos || this.requiere_pnp
  );
};

// Obtener color según prioridad
SubtipoNovedad.prototype.getColorPrioridad = function () {
  const colores = {
    ALTA: "#DC2626", // Rojo
    MEDIA: "#F59E0B", // Ámbar
    BAJA: "#10B981", // Verde
  };
  return colores[this.prioridad] || "#6B7280";
};

// Obtener información para UI
SubtipoNovedad.prototype.getUIInfo = function () {
  return {
    id: this.id,
    codigo: this.subtipo_code,
    nombre: this.nombre,
    prioridad: this.prioridad,
    colorPrioridad: this.getColorPrioridad(),
    tiempoRespuesta: this.tiempo_respuesta_min,
    requiereAmbulancia: this.requiere_ambulancia,
    requiereBomberos: this.requiere_bomberos,
    requierePNP: this.requiere_pnp,
    orden: this.orden,
  };
};

export default SubtipoNovedad;
