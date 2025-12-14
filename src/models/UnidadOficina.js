/**
 * ===================================================
 * MODELO: Unidad de Oficina
 * ===================================================
 *
 * Ruta: src/models/UnidadOficina.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Documentación JSDoc completa
 * ✅ Headers profesionales con versionado
 * ✅ Comentarios mejorados en métodos
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'unidades_oficina'.
 * Define unidades operativas que atienden novedades.
 *
 * Ejemplos de unidades:
 * - Comisarías PNP
 * - Estaciones de Bomberos
 * - Centros de Salud
 * - Bases de Serenazgo
 * - Unidades de Tránsito
 *
 * Características:
 * - Código único de unidad
 * - Tipo de unidad (ENUM)
 * - Ubicación geográfica (lat/lng)
 * - Radio de cobertura
 * - Horarios de operación
 * - Validaciones de negocio
 *
 * Tipos de Unidad:
 * - SERENAZGO
 * - PNP
 * - BOMBEROS
 * - AMBULANCIA
 * - DEFENSA_CIVIL
 * - TRANSITO
 * - OTROS
 *
 * Métodos Estáticos:
 * - findActivas() - Obtener unidades activas
 * - findByTipo() - Filtrar por tipo
 * - findByCode() - Buscar por código
 * - findCercanas() - Buscar cercanas a coordenadas
 * - findOperativasAhora() - Unidades operando ahora
 * - getEstadisticasPorTipo() - Estadísticas agrupadas
 *
 * Métodos de Instancia:
 * - activar() - Activar unidad
 * - desactivar() - Desactivar unidad
 * - softDelete() - Eliminación lógica
 * - estaOperativaEn() - Verificar si opera en horario
 * - estaOperativaAhora() - Verificar si opera ahora
 * - tieneCoordenadas() - Verificar coordenadas
 * - calcularDistanciaA() - Calcular distancia a punto
 * - getResumen() - Obtener info resumida
 *
 * @module models/UnidadOficina
 * @requires sequelize
 * @version 2.0.0
 * @date 2025-12-14
 */

import { DataTypes } from "sequelize";

import sequelize from "../config/database.js";

const UnidadOficina = sequelize.define(
  "UnidadOficina",
  {
    // ID principal
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único de la unidad",
    },

    // Código de la unidad
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      comment: "Código de la unidad (ej: CIA-SAGITARIO, PNP-SURCO)",
    },

    // Nombre de la unidad
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre de la unidad operativa",
    },

    // Tipo de unidad
    tipo_unidad: {
      type: DataTypes.ENUM(
        "SERENAZGO",
        "PNP",
        "BOMBEROS",
        "AMBULANCIA",
        "DEFENSA_CIVIL",
        "TRANSITO",
        "OTROS"
      ),
      allowNull: false,
      comment: "Tipo de unidad operativa",
    },

    // Datos de contacto
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Teléfono de contacto de la unidad",
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
      comment: "Email de contacto de la unidad",
    },

    // Dirección
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Dirección física de la unidad",
    },

    // Ubigeo (FK)
    ubigeo: {
      type: DataTypes.CHAR(6),
      allowNull: true,
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
      comment: "Código de ubigeo de la ubicación",
    },

    // Coordenadas de ubicación
    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: "Latitud de la ubicación de la unidad",
    },

    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: "Longitud de la ubicación de la unidad",
    },

    // Radio de cobertura
    radio_cobertura_km: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: "Radio de cobertura en kilómetros",
    },

    // Horario de operación
    activo_24h: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: "1=Opera 24 horas | 0=Horario limitado",
    },

    horario_inicio: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: "Hora de inicio de operaciones (si no es 24h)",
    },

    horario_fin: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: "Hora de fin de operaciones (si no es 24h)",
    },

    // Estado de la unidad
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activa | 0=Inactiva",
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
    tableName: "unidades_oficina",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // Índices
    indexes: [
      {
        unique: true,
        fields: ["codigo"],
      },
      {
        fields: ["tipo_unidad"],
      },
      {
        fields: ["ubigeo"],
      },
      {
        fields: ["latitud", "longitud"],
      },
      {
        fields: ["estado"],
      },
    ],

    // Validaciones a nivel de modelo
    validate: {
      // Validar coordenadas
      coordenadasValidas() {
        if (
          (this.latitud && !this.longitud) ||
          (!this.latitud && this.longitud)
        ) {
          throw new Error("Debe proporcionar tanto latitud como longitud");
        }
      },

      // Validar horario
      horarioValido() {
        if (!this.activo_24h && (!this.horario_inicio || !this.horario_fin)) {
          throw new Error(
            "Debe especificar horario de inicio y fin si no opera 24 horas"
          );
        }

        if (this.horario_inicio && this.horario_fin) {
          if (this.horario_inicio >= this.horario_fin) {
            throw new Error(
              "El horario de inicio debe ser anterior al horario de fin"
            );
          }
        }
      },

      // Validar radio de cobertura
      radioValido() {
        if (this.radio_cobertura_km && this.radio_cobertura_km <= 0) {
          throw new Error("El radio de cobertura debe ser un valor positivo");
        }
      },
    },

    // Hooks
    hooks: {
      // Antes de guardar, normalizar código
      beforeSave: (unidad) => {
        if (unidad.codigo) {
          unidad.codigo = unidad.codigo.toUpperCase().trim();
        }

        // Si es 24h, limpiar horarios
        if (unidad.activo_24h) {
          unidad.horario_inicio = null;
          unidad.horario_fin = null;
        }
      },
    },
  }
);

/**
 * Métodos estáticos
 */

// Obtener unidades activas
UnidadOficina.findActivas = async function () {
  return await UnidadOficina.findAll({
    where: {
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "ubicacion",
        attributes: ["distrito", "provincia", "departamento"],
      },
    ],
    order: [
      ["tipo_unidad", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

// Buscar por tipo
UnidadOficina.findByTipo = async function (tipo) {
  return await UnidadOficina.findAll({
    where: {
      tipo_unidad: tipo,
      estado: true,
      deleted_at: null,
    },
    order: [["nombre", "ASC"]],
  });
};

// Buscar por código
UnidadOficina.findByCode = async function (codigo) {
  return await UnidadOficina.findOne({
    where: {
      codigo: codigo.toUpperCase(),
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "ubicacion",
      },
    ],
  });
};

// Buscar unidades cercanas a una ubicación
UnidadOficina.findCercanas = async function (lat, lng, radiusKm = 10) {
  // Conversión aproximada: 1 grado ≈ 111 km
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return await UnidadOficina.findAll({
    where: {
      latitud: {
        [sequelize.Sequelize.Op.between]: [lat - deltaLat, lat + deltaLat],
      },
      longitud: {
        [sequelize.Sequelize.Op.between]: [lng - deltaLng, lng + deltaLng],
      },
      estado: true,
      deleted_at: null,
    },
    order: [
      [
        sequelize.literal(`(
        6371 * acos(
          cos(radians(${lat})) 
          * cos(radians(latitud)) 
          * cos(radians(longitud) - radians(${lng})) 
          + sin(radians(${lat})) 
          * sin(radians(latitud))
        )
      )`),
        "ASC",
      ],
    ],
  });
};

// Obtener unidades operativas ahora (según horario)
UnidadOficina.findOperativasAhora = async function () {
  const horaActual = new Date().toTimeString().slice(0, 8);

  return await UnidadOficina.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { activo_24h: true },
        {
          [sequelize.Sequelize.Op.and]: [
            { activo_24h: false },
            { horario_inicio: { [sequelize.Sequelize.Op.lte]: horaActual } },
            { horario_fin: { [sequelize.Sequelize.Op.gte]: horaActual } },
          ],
        },
      ],
      estado: true,
      deleted_at: null,
    },
    order: [
      ["tipo_unidad", "ASC"],
      ["nombre", "ASC"],
    ],
  });
};

// Obtener estadísticas por tipo
UnidadOficina.getEstadisticasPorTipo = async function () {
  return await UnidadOficina.findAll({
    attributes: [
      "tipo_unidad",
      [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal("CASE WHEN activo_24h = 1 THEN 1 ELSE 0 END")
        ),
        "unidades_24h",
      ],
    ],
    where: {
      estado: true,
      deleted_at: null,
    },
    group: ["tipo_unidad"],
    order: [[sequelize.literal("cantidad"), "DESC"]],
    raw: true,
  });
};

/**
 * Métodos de instancia
 */

// Activar unidad
UnidadOficina.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

// Desactivar unidad
UnidadOficina.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

// Soft delete
UnidadOficina.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

// Verificar si está operativa en un horario
UnidadOficina.prototype.estaOperativaEn = function (hora) {
  if (this.activo_24h) return true;

  if (!this.horario_inicio || !this.horario_fin) return false;

  return hora >= this.horario_inicio && hora <= this.horario_fin;
};

// Verificar si está operativa ahora
UnidadOficina.prototype.estaOperativaAhora = function () {
  const horaActual = new Date().toTimeString().slice(0, 8);
  return this.estaOperativaEn(horaActual);
};

// Verificar si tiene coordenadas
UnidadOficina.prototype.tieneCoordenadas = function () {
  return this.latitud !== null && this.longitud !== null;
};

// Calcular distancia a un punto (fórmula de Haversine)
UnidadOficina.prototype.calcularDistanciaA = function (lat, lng) {
  if (!this.tieneCoordenadas()) return null;

  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat - this.latitud) * Math.PI) / 180;
  const dLon = ((lng - this.longitud) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.latitud * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return Math.round(distancia * 100) / 100; // Redondear a 2 decimales
};

// Obtener información resumida
UnidadOficina.prototype.getResumen = function () {
  return {
    id: this.id,
    codigo: this.codigo,
    nombre: this.nombre,
    tipo: this.tipo_unidad,
    telefono: this.telefono,
    activo24h: this.activo_24h,
    operativaAhora: this.estaOperativaAhora(),
    tieneCoordenadas: this.tieneCoordenadas(),
  };
};

export default UnidadOficina;
