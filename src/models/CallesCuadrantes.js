/**
 * ============================================================================
 * ARCHIVO: src/models/CallesCuadrantes.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Modelo Sequelize para la tabla calles_cuadrantes
 *              Relación Many-to-Many entre calles y cuadrantes
 * ============================================================================
 *
 * PROPÓSITO:
 * - Gestionar la relación entre calles y cuadrantes (una calle puede estar en varios cuadrantes)
 * - Definir rangos de numeración específicos por cuadrante
 * - Facilitar la auto-asignación de cuadrante/sector a direcciones
 * - Soportar división de calles largas en múltiples cuadrantes
 *
 * RELACIONES:
 * - Muchos a Uno con Calle (una relación pertenece a una calle)
 * - Muchos a Uno con Cuadrante (una relación pertenece a un cuadrante)
 *
 * CAMPOS CLAVE PARA AUTO-ASIGNACIÓN:
 * - numero_inicio / numero_fin: Define qué números de una calle están en cada cuadrante
 *   Ejemplo: Av. Ejército del 100 al 299 → Cuadrante C001
 *            Av. Ejército del 300 al 599 → Cuadrante C002
 *
 * - prioridad: Resuelve conflictos cuando una dirección podría estar en múltiples cuadrantes
 *   Valor 1 = mayor prioridad, se usa primero
 *
 * CASOS DE USO:
 * 1. Una calle larga atraviesa múltiples cuadrantes (ej: Av. Arequipa)
 * 2. Auto-detectar cuadrante cuando se ingresa "Av. Ejército 450"
 * 3. Mapear todas las calles de un cuadrante específico
 * 4. Validar cobertura: ¿qué cuadrantes tienen pocas calles mapeadas?
 *
 * IMPORTANTE:
 * No existe tabla calles_sectores porque el sector se deriva automáticamente
 * del cuadrante (cuadrantes.sector_id). Esto evita redundancia y conflictos.
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

// ORM COnfiguration
import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";
// App Models
////import Cuadrante from "./Cuadrante.js";
////import Sector from "./Sector.js";
////import Calle from "./Calle.js";

/**
 * @typedef {Object} CallesCuadrantes
 * @property {number} id - ID único de la relación
 * @property {number} calle_id - FK a calles
 * @property {number} cuadrante_id - FK a cuadrantes
 * @property {number} numero_inicio - Número inicial del tramo
 * @property {number} numero_fin - Número final del tramo
 * @property {string} lado - AMBOS, PAR, IMPAR, TODOS
 * @property {number} prioridad - Prioridad para resolver conflictos
 */

/**
 * Modelo CallesCuadrantes
 *
 * @description
 * Tabla intermedia que relaciona calles con cuadrantes.
 * Permite que una calle esté en múltiples cuadrantes y viceversa.
 * Incluye información sobre rangos de numeración para auto-asignación.
 *
 * @swagger
 * components:
 *   schemas:
 *     CallesCuadrantes:
 *       type: object
 *       required:
 *         - calle_id
 *         - cuadrante_id
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la relación
 *           example: 1
 *         calle_id:
 *           type: integer
 *           description: ID de la calle (FK)
 *           example: 5
 *         cuadrante_id:
 *           type: integer
 *           description: ID del cuadrante (FK)
 *           example: 12
 *         numero_inicio:
 *           type: integer
 *           description: Número inicial del tramo en este cuadrante
 *           example: 100
 *         numero_fin:
 *           type: integer
 *           description: Número final del tramo en este cuadrante
 *           example: 299
 *         lado:
 *           type: string
 *           enum: [AMBOS, PAR, IMPAR, TODOS]
 *           description: Lado de la calle que pertenece al cuadrante
 *           example: "AMBOS"
 *         manzana:
 *           type: string
 *           description: Identificador de manzana (Mz) para sistemas de AAHH
 *           example: "A1"
 *         desde_interseccion:
 *           type: string
 *           description: Calle de inicio del tramo
 *           example: "Av. Arequipa"
 *         hasta_interseccion:
 *           type: string
 *           description: Calle de fin del tramo
 *           example: "Jr. Lampa"
 *         prioridad:
 *           type: integer
 *           description: Prioridad (1=mayor prioridad)
 *           example: 1
 *         estado:
 *           type: integer
 *           description: Estado del registro (1=Activo, 0=Inactivo)
 */
const CallesCuadrantes = sequelize.define(
  "CallesCuadrantes",
  {
    // ============================================================================
    // CLAVE PRIMARIA
    // ============================================================================
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID único de la relación - Clave primaria auto-incremental",
    },

    // ============================================================================
    // CLAVES FORÁNEAS (RELACIÓN M:N)
    // ============================================================================
    calle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "calle_id",
      comment: "FK a calles - Define qué calle está relacionada",
      references: {
        model: "calles",
        key: "id",
      },
      validate: {
        isInt: true,
        min: 1,
      },
    },

    cuadrante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cuadrante_id",
      comment: "FK a cuadrantes - Define en qué cuadrante está la calle",
      references: {
        model: "cuadrantes",
        key: "id",
      },
      validate: {
        isInt: true,
        min: 1,
      },
    },

    // ============================================================================
    // RANGO DE NUMERACIÓN (PARA AUTO-ASIGNACIÓN)
    // ============================================================================
    numero_inicio: {
      type: DataTypes.INTEGER,
      allowNull: true, // Puede ser null si no hay numeración definida (ej: AAHH)
      field: "numero_inicio",
      comment: "Número inicial en este cuadrante (ej: 100)",
      validate: {
        min: 0,
      },
    },

    numero_fin: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "numero_fin",
      comment: "Número final en este cuadrante (ej: 299)",
      validate: {
        min: 0,
        // Validación personalizada: numero_fin debe ser mayor que numero_inicio
        isGreaterThanInicio(value) {
          if (value && this.numero_inicio && value < this.numero_inicio) {
            throw new Error(
              "numero_fin debe ser mayor o igual que numero_inicio"
            );
          }
        },
      },
    },

    lado: {
      type: DataTypes.ENUM("AMBOS", "PAR", "IMPAR", "TODOS"),
      defaultValue: "AMBOS",
      comment:
        "Lado de la calle: AMBOS=ambos lados, PAR=números pares, IMPAR=números impares",
      // AMBOS: Se usa cuando ambos lados de la calle están en el cuadrante
      // PAR: Solo números pares (100, 102, 104...) están en este cuadrante
      // IMPAR: Solo números impares (101, 103, 105...) están en este cuadrante
      // TODOS: Similar a AMBOS, para compatibilidad
    },

    // ============================================================================
    // TRAMO ESPECÍFICO (REFERENCIAS)
    // ============================================================================
    desde_interseccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "desde_interseccion",
      comment: "Calle que cruza al inicio del tramo (referencia visual)",
      // Ejemplo: "Desde Av. Arequipa hasta Jr. Lampa"
    },

    hasta_interseccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "hasta_interseccion",
      comment: "Calle que cruza al final del tramo (referencia visual)",
    },

    // ============================================================================
    // PRIORIDAD PARA RESOLUCIÓN DE CONFLICTOS
    // ============================================================================
    prioridad: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment:
        "Prioridad para resolver conflictos (1=mayor prioridad, 10=menor)",
      validate: {
        min: 1,
        max: 10,
      },
      // CASO DE USO:
      // Si una dirección "Av. Ejército 200" coincide con dos cuadrantes
      // (por error o solapamiento), se usa el cuadrante con prioridad=1
    },

    // ============================================================================
    // MANZANA (AAHH / MZ)
    // ============================================================================
    manzana: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "manzana",
      comment: "Manzana (Mz) para sistemas de AAHH - límite 10 caracteres",
      validate: {
        len: {
          args: [1, 10],
          msg: "La manzana no puede exceder 10 caracteres",
        },
      },
      set(value) {
        // Forzar mayúsculas al asignar
        this.setDataValue(
          "manzana",
          value ? value.toString().trim().toUpperCase() : null
        );
      },
    },

    // ============================================================================
    // METADATOS
    // ============================================================================
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones adicionales sobre este tramo",
    },

    // ============================================================================
    // ESTADO Y CONTROL
    // ============================================================================
    estado: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "Estado del registro: 1=Activo | 0=Inactivo",
      validate: {
        isIn: [[0, 1]],
      },
    },

    // ============================================================================
    // CAMPOS DE AUDITORÍA
    // ============================================================================
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
      comment: "Fecha y hora de creación del registro",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by",
      comment: "ID del usuario que creó el registro",
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
      comment: "Fecha y hora de última actualización",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "updated_by",
      comment: "ID del usuario que actualizó el registro",
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
      comment: "Fecha de eliminación lógica (soft delete)",
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "deleted_by",
      comment: "ID del usuario que eliminó el registro",
    },
  },
  {
    // ============================================================================
    // CONFIGURACIÓN DEL MODELO
    // ============================================================================
    sequelize,
    tableName: "calles_cuadrantes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // Habilita soft delete
    deletedAt: "deleted_at",
    comment: "Relación de calles con cuadrantes (M:N)",

    // ============================================================================
    // ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
    // ============================================================================
    indexes: [
      {
        // Índice único compuesto: previene duplicados de calle+cuadrante+numero_inicio+lado
        // Permite múltiples rangos con diferentes lados para la misma calle-cuadrante
        name: "uq_calle_cuadrante_numero_lado",
        unique: true,
        fields: ["calle_id", "cuadrante_id", "numero_inicio", "lado"],
      },
      {
        // Índice para búsquedas por cuadrante (todas las calles de un cuadrante)
        name: "idx_cc_cuadrante",
        fields: ["cuadrante_id"],
      },
      {
        // Índice para filtrar activos/inactivos
        name: "idx_cc_estado",
        fields: ["estado"],
      },
      {
        // Índice compuesto para búsqueda de cuadrante por número (optimizado)
        // Se usa en la auto-asignación: dado calle_id + lado + numero_inicio encontrar rápidamente
        name: "idx_cc_numero_rango",
        fields: ["calle_id", "lado", "numero_inicio"],
      },
      {
        // Índice por calle_id (usado en foreign key)
        name: "idx_calle_id",
        fields: ["calle_id"],
      },
      {
        // Índice único por manzana para evitar duplicados por calle + manzana
        name: "uq_calle_cuadrante_manzana",
        unique: true,
        fields: ["calle_id", "manzana"],
      },
      {
        // Índice por cuadrante_id (usado en foreign key)
        name: "idx_cuadrante_id",
        fields: ["cuadrante_id"],
      },
    ],

    // ============================================================================
    // VALIDACIONES A NIVEL DE MODELO
    // ============================================================================
    validate: {
      // Validación: Si hay numero_inicio, debe haber numero_fin y viceversa
      rangoCompleto() {
        if (
          (this.numero_inicio !== null && this.numero_fin === null) ||
          (this.numero_inicio === null && this.numero_fin !== null)
        ) {
          throw new Error(
            "Si se define numero_inicio, debe definirse numero_fin y viceversa"
          );
        }
      },
    },
  }
);

// ============================================================================
// MÉTODOS DE INSTANCIA
// ============================================================================

/**
 * Verifica si un número está dentro del rango de este tramo
 * @param {number} numero - Número a verificar
 * @returns {boolean} true si está dentro del rango
 */
CallesCuadrantes.prototype.contieneNumero = function (numero) {
  // Si no hay rango definido, se asume que sí contiene
  if (!this.numero_inicio || !this.numero_fin) {
    return true;
  }

  return numero >= this.numero_inicio && numero <= this.numero_fin;
};

/**
 * Verifica si el lado del número coincide con el lado del tramo
 * @param {number} numero - Número a verificar
 * @returns {boolean} true si coincide el lado
 */
CallesCuadrantes.prototype.coincideLado = function (numero) {
  if (this.lado === "AMBOS" || this.lado === "TODOS") {
    return true;
  }

  const esPar = numero % 2 === 0;

  if (this.lado === "PAR" && esPar) return true;
  if (this.lado === "IMPAR" && !esPar) return true;

  return false;
};

/**
 * Obtiene información completa del tramo en formato legible
 * @returns {string} Descripción del tramo
 */
CallesCuadrantes.prototype.getDescripcionTramo = function () {
  let desc = "";

  if (this.numero_inicio && this.numero_fin) {
    desc += `Números ${this.numero_inicio}-${this.numero_fin}`;
  }

  if (this.lado && this.lado !== "AMBOS") {
    desc += ` (${this.lado})`;
  }

  if (this.desde_interseccion || this.hasta_interseccion) {
    desc += " | ";
    if (this.desde_interseccion) desc += `Desde ${this.desde_interseccion}`;
    if (this.hasta_interseccion) desc += ` hasta ${this.hasta_interseccion}`;
  }

  return desc || "Tramo completo";
};

// ============================================================================
// MÉTODOS DE CLASE (ESTÁTICOS)
// ============================================================================

/**
 * Busca el cuadrante correspondiente para una calle y número específico
 * @param {number} calleId - ID de la calle
 * @param {number} numero - Número de la dirección
 * @returns {Promise<Object|null>} Cuadrante encontrado o null
 */
CallesCuadrantes.buscarCuadrantePorNumero = async function (calleId, numero) {
  ////const { Op } = require("sequelize");
  try {
    // ✅ Importar modelos dinámicamente para evitar dependencias circulares
    ////    const { default: Cuadrante } = await import("./Cuadrante.js");
    ////    const { default: Sector } = await import("./Sector.js");
    ////    const { default: Calle } = await import("./Calle.js");

    const Cuadrante = this.sequelize.models.Cuadrante;
    const Sector = this.sequelize.models.Sector;
    const Calle = this.sequelize.models.Calle;

    // Buscar relaciones que contengan este número
    const relaciones = await this.findAll({
      where: {
        calle_id: calleId,
        estado: 1,
        deleted_at: null,
        [Op.or]: [
          // Caso 1: Número dentro del rango
          {
            numero_inicio: { [Op.lte]: numero },
            numero_fin: { [Op.gte]: numero },
          },
          // Caso 2: Sin rango definido (aplica a todos)
          {
            numero_inicio: null,
            numero_fin: null,
          },
        ],
      },
      include: [
        {
          model: sequelize.models.Cuadrante,
          as: "cuadrante",
          where: { estado: 1 },
        },
      ],
      order: [["prioridad", "ASC"]], // Ordenar por prioridad
    });

    // Filtrar por lado (par/impar) si aplica
    const relacionValida = relaciones.find((rel) => rel.coincideLado(numero));

    return relacionValida || null;
  } catch (error) {
    console.error("Error en buscarCuadrantePorNumero:", error);
    throw error;
  }
};

/**
 * Obtiene todas las calles de un cuadrante específico
 * @param {number} cuadranteId - ID del cuadrante
 * @returns {Promise<Array>} Lista de relaciones con información de calles
 */
CallesCuadrantes.porCuadrante = async function (cuadranteId) {
  return await this.findAll({
    where: {
      cuadrante_id: cuadranteId,
      estado: 1,
      deleted_at: null,
    },
    include: [
      {
        model: sequelize.models.Calle,
        as: "calle",
        where: { estado: 1 },
        include: [
          {
            model: sequelize.models.TipoVia,
            as: "tipoVia",
          },
        ],
      },
    ],
    order: [
      [{ model: sequelize.models.Calle, as: "calle" }, "es_principal", "DESC"],
      [{ model: sequelize.models.Calle, as: "calle" }, "nombre_via", "ASC"],
    ],
  });
};

/**
 * ============================================================================
 * FIX #3: Agregar método buscarCuadrantePorNumero al modelo CallesCuadrantes
 * ============================================================================
 *
 * PROBLEMA:
 * El controlador de direcciones y calles-cuadrantes llama a:
 *   CallesCuadrantes.buscarCuadrantePorNumero(calleId, numero)
 *
 * Pero este método estático NO existe en el modelo CallesCuadrantes.js
 *
 * SOLUCIÓN:
 * Agregar el método estático al modelo CallesCuadrantes.js
 *
 * UBICACIÓN:
 * src/models/CallesCuadrantes.js
 * Agregar ANTES del export default CallesCuadrantes;
 *
 * ============================================================================
 */

// Agregar ANTES del: export default CallesCuadrantes;

/**
 * ============================================================================
 * MÉTODO ESTÁTICO: buscarCuadrantePorNumero
 * ============================================================================
 *
 * Busca el cuadrante correspondiente a una calle y número específico.
 * Utiliza los rangos de numeración (numero_inicio, numero_fin) para encontrar
 * la relación correcta.
 *
 * @param {number} calleId - ID de la calle
 * @param {number} numero - Número municipal a buscar
 * @returns {Promise<Object|null>} Relación CallesCuadrantes con Cuadrante incluido
 *
 * @example
 * const relacion = await CallesCuadrantes.buscarCuadrantePorNumero(1, 450);
 * // Retorna: { id: 5, cuadrante_id: 12, numero_inicio: 400, numero_fin: 499, ... }
 */
CallesCuadrantes.buscarCuadrantePorNumero = async function (calleId, numero) {
  try {
    // ✅ AGREGAR ESTAS 3 LÍNEAS AQUÍ (después de try, antes de const relacion)
    const Cuadrante = this.sequelize.models.Cuadrante;
    const Sector = this.sequelize.models.Sector;
    const Calle = this.sequelize.models.Calle;

    const relacion = await this.findOne({
      where: {
        calle_id: calleId,
        numero_inicio: { [Op.lte]: numero }, // numero_inicio <= numero
        numero_fin: { [Op.gte]: numero }, // numero_fin >= numero
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          required: true,
          include: [
            {
              model: Sector,
              as: "sector",
              attributes: ["id", "sector_code", "nombre"],
            },
          ],
        },
        {
          model: Calle,
          as: "calle",
          attributes: ["id", "calle_code", "nombre_completo"],
        },
      ],
      order: [
        ["prioridad", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    return relacion;
  } catch (error) {
    console.error("Error en buscarCuadrantePorNumero:", error);
    throw error;
  }
};

/**
 * Buscar cuadrante por calle y manzana (para AAHH sin numeración municipal)
 *
 * @param {number} calleId - ID de la calle
 * @param {string} manzana - Identificador de manzana (ej: "J", "A1")
 * @returns {Object|null} Relación CallesCuadrantes con cuadrante y sector
 */
CallesCuadrantes.buscarCuadrantePorManzana = async function (calleId, manzana) {
  try {
    const Cuadrante = this.sequelize.models.Cuadrante;
    const Sector = this.sequelize.models.Sector;
    const Calle = this.sequelize.models.Calle;

    const relacion = await this.findOne({
      where: {
        calle_id: calleId,
        manzana: manzana.toUpperCase(),
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cuadrante,
          as: "cuadrante",
          required: true,
          include: [
            {
              model: Sector,
              as: "sector",
              attributes: ["id", "sector_code", "nombre"],
            },
          ],
        },
        {
          model: Calle,
          as: "calle",
          attributes: ["id", "calle_code", "nombre_completo"],
        },
      ],
    });

    return relacion;
  } catch (error) {
    console.error("Error en buscarCuadrantePorManzana:", error);
    throw error;
  }
};

/**
 * NOTAS DE USO:
 *
 * 1. BUSCAR CUADRANTE PARA AUTO-ASIGNACIÓN:
 *    const relacion = await CallesCuadrantes.buscarCuadrantePorNumero(1, 450);
 *    if (relacion) {
 *      console.log('Cuadrante ID:', relacion.cuadrante_id);
 *      console.log('Sector ID:', relacion.cuadrante.sector_id);
 *    }
 *
 * 2. VALIDAR ANTES DE CREAR DIRECCIÓN:
 *    const relacion = await CallesCuadrantes.buscarCuadrantePorNumero(calleId, numero);
 *    if (!relacion) {
 *      throw new Error('No existe cuadrante para este número en esta calle');
 *    }
 *
 * 3. PRIORIDAD:
 *    Si hay múltiples relaciones que contienen el número (solapamiento),
 *    se retorna la de mayor prioridad.
 */

// Agregar esta línea
////callesCuadrantesController.buscarCuadrante =
////callesCuadrantesController.buscarCuadrantePorNumero;

// ============================================================================
// EXPORTACIÓN DEL MODELO
// ============================================================================
export default CallesCuadrantes;

/**
 * NOTAS DE USO:
 *
 * 1. CREAR RELACIÓN CALLE-CUADRANTE:
 *    const relacion = await CallesCuadrantes.create({
 *      calle_id: 5,
 *      cuadrante_id: 12,
 *      numero_inicio: 100,
 *      numero_fin: 299,
 *      lado: 'AMBOS',
 *      prioridad: 1,
 *      created_by: usuarioId
 *    });
 *
 * 2. BUSCAR CUADRANTE PARA UNA DIRECCIÓN:
 *    const relacion = await CallesCuadrantes.buscarCuadrantePorNumero(5, 450);
 *    const cuadrante = relacion?.cuadrante;
 *
 * 3. LISTAR CALLES DE UN CUADRANTE:
 *    const relaciones = await CallesCuadrantes.porCuadrante(12);
 *
 * 4. VERIFICAR SI NÚMERO ESTÁ EN RANGO:
 *    const contiene = relacion.contieneNumero(250); // true/false
 */
