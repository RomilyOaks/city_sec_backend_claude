/**
 * ===================================================
 * MODELO: Cuadrante
 * ===================================================
 *
 * Ruta: src/models/Cuadrante.js
 *
 * VERSIÓN: 2.0.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Documentación JSDoc completa
 * ✅ Headers profesionales con versionado
 * ✅ Sin cambios funcionales
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'cuadrantes'.
 * Los cuadrantes son subdivisiones de los sectores que permiten
 * un control territorial más granular para patrullaje.
 *
 * Características:
 * - Código único de identificación
 * - Pertenece a un sector específico
 * - Coordenadas geográficas (lat/lng)
 * - Polígonos GeoJSON para límites
 * - Radio de cobertura configurable
 * - Color personalizable para mapas
 * - Soft delete con auditoría
 *
 * Relaciones:
 * - Pertenece a un Sector (Many-to-One)
 * - Tiene muchas Novedades (One-to-Many)
 *
 * Métodos Estáticos:
 * - findBySector() - Cuadrantes de un sector
 * - findByCode() - Buscar por código
 * - findNearby() - Búsqueda geoespacial
 *
 * Métodos de Instancia:
 * - activar() - Activar cuadrante
 * - desactivar() - Desactivar cuadrante
 * - softDelete() - Eliminación lógica
 * - tieneCoordenadas() - Verificar coordenadas
 * - tienePoligono() - Verificar polígono
 * - getResumen() - Info resumida
 *
 * @module models/Cuadrante
 * @requires sequelize
 * @version 2.0.0
 * @date 2025-12-14
 */

import { DataTypes } from "sequelize";

//import sequelize from "../config/database.js";
import sequelize from "../config/database.js";

/**
 * Definición del modelo Cuadrante
 * Representa las áreas de patrullaje dentro de un sector
 */
const Cuadrante = sequelize.define(
  "Cuadrante",
  {
    // ============================================
    // IDENTIFICACIÓN PRINCIPAL
    // ============================================

    /**
     * ID único del cuadrante
     * Generado automáticamente por MySQL
     */
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del cuadrante",
    },

    /**
     * Código alfanumérico único del cuadrante
     * Formato sugerido: C001, C002, C-NORTE-01, etc.
     * Usado para referencias rápidas en reportes y comunicaciones
     */
    cuadrante_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: "Código único del cuadrante (ej: C001, C002)",
    },

    /**
     * Nombre descriptivo del cuadrante
     * Ejemplo: "Centro Comercial", "Zona Residencial Norte"
     */
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre descriptivo del cuadrante",
    },

    // ============================================
    // RELACIÓN CON SECTOR
    // ============================================

    /**
     * Foreign Key al sector al que pertenece este cuadrante
     * Un cuadrante siempre debe pertenecer a un sector
     */
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sectores", // Nombre de la tabla en la BD
        key: "id",
      },
      comment: "ID del sector al que pertenece el cuadrante",
    },

    /**
     * Código de zona opcional para clasificación adicional
     * Permite agrupar cuadrantes por zonas dentro de un sector
     */
    zona_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Código de zona asociada al cuadrante",
    },

    // ============================================
    // UBICACIÓN GEOGRÁFICA
    // ============================================

    /**
     * Latitud del punto central del cuadrante
     * Formato: Decimal con hasta 8 dígitos decimales (precisión ~1.1mm)
     * Rango válido: -90 a 90
     */
    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90,
      },
      comment: "Latitud del punto central del cuadrante",
    },

    /**
     * Longitud del punto central del cuadrante
     * Formato: Decimal con hasta 8 dígitos decimales
     * Rango válido: -180 a 180
     */
    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180,
      },
      comment: "Longitud del punto central del cuadrante",
    },

    /**
     * Polígono del cuadrante en formato GeoJSON
     * Permite definir límites irregulares del cuadrante
     * Estructura esperada:
     * {
     *   type: "Polygon",
     *   coordinates: [
     *     [[lng1, lat1], [lng2, lat2], [lng3, lat3], [lng1, lat1]]
     *   ]
     * }
     */
    poligono_json: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Coordenadas del polígono del cuadrante en formato GeoJSON",
    },

    /**
     * Radio de cobertura en metros (para cuadrantes circulares)
     * Útil cuando el cuadrante se define como un círculo desde el punto central
     * en lugar de un polígono
     */
    radio_metros: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
      comment: "Radio de cobertura en metros (para cuadrantes circulares)",
    },

    // ============================================
    // VISUALIZACIÓN
    // ============================================

    /**
     * Color hexadecimal para visualización en mapas
     * Formato: #RRGGBB (ej: #10B981, #EF4444)
     * Permite diferenciar visualmente los cuadrantes en mapas
     */
    color_mapa: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#10B981", // Verde esmeralda por defecto
      validate: {
        is: /^#[0-9A-F]{6}$/i, // Regex para validar formato hexadecimal
      },
      comment: "Color hexadecimal para visualización en mapa",
    },

    // ============================================
    // ESTADO Y CONTROL
    // ============================================

    /**
     * Estado del cuadrante
     * true (1) = Activo, false (0) = Inactivo
     * Los cuadrantes inactivos no se consideran en asignaciones
     */
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
    },

    /**
     * Fecha de eliminación lógica (soft delete)
     * Si tiene valor, el cuadrante se considera eliminado
     * pero se mantiene en la BD para auditoría
     */
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    // ============================================
    // AUDITORÍA
    // ============================================

    /**
     * ID del usuario que creó el registro
     * Referencia a la tabla usuarios
     */
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
      comment: "ID del usuario que creó el registro",
    },

    /**
     * ID del usuario que realizó la última actualización
     * Referencia a la tabla usuarios
     */
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
      comment: "ID del usuario que actualizó el registro",
    },
  },
  {
    // ============================================
    // CONFIGURACIÓN DEL MODELO
    // ============================================

    tableName: "cuadrantes", // Nombre de la tabla en la BD
    timestamps: true, // Habilita created_at y updated_at
    createdAt: "created_at", // Personalizar nombre de la columna
    updatedAt: "updated_at", // Personalizar nombre de la columna

    /**
     * Índices de la tabla para optimizar consultas
     * Los índices mejoran la velocidad de búsqueda
     * pero aumentan el tiempo de escritura
     */
    indexes: [
      {
        // Índice único en el código del cuadrante
        // Previene códigos duplicados
        unique: true,
        fields: ["cuadrante_code"],
      },
      {
        // Índice en sector_id para búsquedas por sector
        // Acelera consultas del tipo "cuadrantes del sector X"
        fields: ["sector_id"],
      },
      {
        // Índice en zona_code para agrupar por zonas
        fields: ["zona_code"],
      },
      {
        // Índice simple en estado para filtrar activos/inactivos
        fields: ["estado"],
      },
      {
        // Índice compuesto en coordenadas
        // Útil para búsquedas geoespaciales básicas
        fields: ["latitud", "longitud"],
      },
      {
        // Índice compuesto para filtrar activos no eliminados
        // Optimiza la consulta más común: WHERE estado=1 AND deleted_at IS NULL
        fields: ["estado", "deleted_at"],
      },
    ],

    /**
     * Validaciones a nivel de modelo
     * Se ejecutan antes de guardar en la BD
     */
    validate: {
      /**
       * Validación custom: Si hay latitud, debe haber longitud y viceversa
       * No tiene sentido tener solo una coordenada
       */
      coordenadasCompletas() {
        if (
          (this.latitud && !this.longitud) ||
          (!this.latitud && this.longitud)
        ) {
          throw new Error(
            "Debe proporcionar tanto latitud como longitud, o ninguna"
          );
        }
      },

      /**
       * Validación custom: El radio debe ser positivo si se proporciona
       */
      radioValido() {
        if (this.radio_metros && this.radio_metros <= 0) {
          throw new Error("El radio debe ser un valor positivo mayor a 0");
        }
      },
    },

    /**
     * Hooks (ganchos) del ciclo de vida del modelo
     * Permiten ejecutar código antes/después de ciertas operaciones
     */
    hooks: {
      /**
       * Hook: Antes de crear un registro
       * Genera código automático si no se proporcionó
       *
       * @param {Object} cuadrante - Instancia del cuadrante a crear
       */
      beforeCreate: async (cuadrante) => {
        // Si no se proporcionó código, generarlo automáticamente
        if (!cuadrante.cuadrante_code) {
          // Obtener el último cuadrante del mismo sector
          const ultimoCuadrante = await Cuadrante.findOne({
            where: { sector_id: cuadrante.sector_id },
            order: [["cuadrante_code", "DESC"]],
            attributes: ["cuadrante_code"],
          });

          if (ultimoCuadrante) {
            // Extraer número del código y sumar 1
            const numeroActual = parseInt(
              ultimoCuadrante.cuadrante_code.replace(/\D/g, "")
            );
            cuadrante.cuadrante_code = `C${String(numeroActual + 1).padStart(
              3,
              "0"
            )}`;
          } else {
            // Primer cuadrante del sector
            cuadrante.cuadrante_code = "C001";
          }
        }

        // Normalizar código a mayúsculas
        cuadrante.cuadrante_code = cuadrante.cuadrante_code.toUpperCase();
      },

      /**
       * Hook: Antes de actualizar un registro
       * Normaliza el código si cambió
       *
       * @param {Object} cuadrante - Instancia del cuadrante a actualizar
       */
      beforeUpdate: (cuadrante) => {
        if (cuadrante.changed("cuadrante_code")) {
          cuadrante.cuadrante_code = cuadrante.cuadrante_code.toUpperCase();
        }
      },
    },
  }
);

// ============================================
// MÉTODOS ESTÁTICOS
// Métodos que se llaman desde el modelo: Cuadrante.metodo()
// ============================================

/**
 * Obtener cuadrantes activos de un sector específico
 *
 * @param {number} sectorId - ID del sector
 * @returns {Promise<Array>} Array de cuadrantes activos
 *
 * @example
 * const cuadrantes = await Cuadrante.findBySector(1);
 */
Cuadrante.findBySector = async function (sectorId) {
  return await Cuadrante.findAll({
    where: {
      sector_id: sectorId,
      estado: true,
      deleted_at: null,
    },
    order: [["cuadrante_code", "ASC"]],
  });
};

/**
 * Buscar cuadrante por código único
 *
 * @param {string} code - Código del cuadrante
 * @returns {Promise<Object|null>} Cuadrante encontrado o null
 *
 * @example
 * const cuadrante = await Cuadrante.findByCode('C001');
 */
Cuadrante.findByCode = async function (code) {
  return await Cuadrante.findOne({
    where: {
      cuadrante_code: code.toUpperCase(),
      estado: true,
      deleted_at: null,
    },
    include: [
      {
        association: "sector",
        attributes: ["id", "nombre", "sector_code"],
      },
    ],
  });
};

/**
 * Buscar cuadrantes cercanos a una ubicación
 * Usa cálculo aproximado basado en grados
 *
 * @param {number} lat - Latitud central
 * @param {number} lng - Longitud central
 * @param {number} radiusKm - Radio de búsqueda en kilómetros (default: 5)
 * @returns {Promise<Array>} Array de cuadrantes cercanos
 *
 * @example
 * const cercanos = await Cuadrante.findNearby(-12.0464, -77.0428, 2);
 */
Cuadrante.findNearby = async function (lat, lng, radiusKm = 5) {
  // Conversión aproximada: 1 grado ≈ 111 km en el ecuador
  const deltaLat = radiusKm / 111;
  // La longitud varía con la latitud (más corta cerca de los polos)
  const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return await Cuadrante.findAll({
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
    include: [
      {
        association: "sector",
        attributes: ["id", "nombre", "sector_code"],
      },
    ],
  });
};

// ============================================
// MÉTODOS DE INSTANCIA
// Métodos que se llaman desde un objeto: miCuadrante.metodo()
// ============================================

/**
 * Activar el cuadrante
 * Establece estado en true
 *
 * @returns {Promise<void>}
 *
 * @example
 * await cuadrante.activar();
 */
Cuadrante.prototype.activar = async function () {
  this.estado = true;
  await this.save();
};

/**
 * Desactivar el cuadrante
 * Establece estado en false
 *
 * @returns {Promise<void>}
 *
 * @example
 * await cuadrante.desactivar();
 */
Cuadrante.prototype.desactivar = async function () {
  this.estado = false;
  await this.save();
};

/**
 * Eliminar lógicamente el cuadrante (soft delete)
 * Marca la fecha de eliminación y desactiva
 *
 * @param {number} userId - ID del usuario que elimina
 * @returns {Promise<void>}
 *
 * @example
 * await cuadrante.softDelete(req.usuario.userId);
 */
Cuadrante.prototype.softDelete = async function (userId) {
  this.deleted_at = new Date();
  this.estado = false;
  if (userId) {
    this.updated_by = userId;
  }
  await this.save();
};

/**
 * Verificar si el cuadrante tiene coordenadas definidas
 *
 * @returns {boolean} true si tiene latitud y longitud
 *
 * @example
 * if (cuadrante.tieneCoordenadas()) {
 *   // Mostrar en mapa
 * }
 */
Cuadrante.prototype.tieneCoordenadas = function () {
  return this.latitud !== null && this.longitud !== null;
};

/**
 * Verificar si el cuadrante tiene polígono definido
 *
 * @returns {boolean} true si tiene polígono válido
 *
 * @example
 * if (cuadrante.tienePoligono()) {
 *   // Dibujar polígono en mapa
 * }
 */
Cuadrante.prototype.tienePoligono = function () {
  return (
    this.poligono_json !== null &&
    typeof this.poligono_json === "object" &&
    Object.keys(this.poligono_json).length > 0
  );
};

/**
 * Obtener información resumida para UI
 *
 * @returns {Object} Objeto con datos básicos del cuadrante
 *
 * @example
 * const resumen = cuadrante.getResumen();
 * console.log(resumen.codigo); // "C001"
 */
Cuadrante.prototype.getResumen = function () {
  return {
    id: this.id,
    codigo: this.cuadrante_code,
    nombre: this.nombre,
    sectorId: this.sector_id,
    zona: this.zona_code,
    color: this.color_mapa,
    activo: this.estado,
    tieneCoordenadas: this.tieneCoordenadas(),
    tienePoligono: this.tienePoligono(),
  };
};

// Exportar el modelo para uso en otros archivos
export default Cuadrante;
