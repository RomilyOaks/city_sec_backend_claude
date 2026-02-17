/**
 * ============================================================================
 * ARCHIVO: src/controllers/direccionesController.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Controlador para gestión de direcciones normalizadas
 *              Maneja direcciones con sistema dual (municipal y Mz/Lote)
 * ============================================================================
 *
 * PROPÓSITO:
 * - Gestionar direcciones normalizadas del sistema
 * - Auto-asignar cuadrante y sector basado en calle+número
 * - Soportar geocodificación (coordenadas GPS)
 * - Gestionar estadísticas de uso de direcciones
 * - Validar direcciones antes de registro
 *
 * ENDPOINTS:
 * - GET    /api/direcciones                  - Listar con paginación
 * - GET    /api/direcciones/activas          - Listar solo activas
 * - GET    /api/direcciones/search           - Búsqueda avanzada
 * - GET    /api/direcciones/:id              - Obtener por ID
 * - POST   /api/direcciones                  - Crear dirección
 * - POST   /api/direcciones/validar          - Validar sin guardar
 * - PUT    /api/direcciones/:id              - Actualizar dirección
 * - DELETE /api/direcciones/:id              - Eliminar (soft delete)
 * - PATCH  /api/direcciones/:id/geocodificar - Actualizar coordenadas
 * - GET    /api/direcciones/:id/novedades    - Novedades en dirección
 * - GET    /api/direcciones/stats/mas-usadas - Direcciones más frecuentes
 *
 * REGLAS DE NEGOCIO:
 * 1. Debe tener numero_municipal O (manzana + lote)
 * 2. Código único auto-generado
 * 3. Cuadrante y sector se auto-asignan
 * 4. Estadísticas se actualizan automáticamente
 * 5. No se puede eliminar si tiene novedades activas
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import Direccion from "../models/Direccion.js";
import Calle from "../models/Calle.js";
import TipoVia from "../models/TipoVia.js";
import Cuadrante from "../models/Cuadrante.js";
import Sector from "../models/Sector.js";
import CallesCuadrantes from "../models/CallesCuadrantes.js";
import Ubigeo from "../models/Ubigeo.js";
import Usuario from "../models/Usuario.js";
import Novedad from "../models/Novedad.js";
import { Op } from "sequelize";
import { geocodificarDireccion } from "../services/geocodingService.js";

/**
 * ============================================================================
 * FUNCIONES AUXILIARES
 * ============================================================================
 */

/**
 * Include estándar para incluir usuarios de auditoría
 */
const auditInclude = [
  {
    model: Usuario,
    as: "creadorDireccion",
    attributes: ["id", "username", "email"],
    required: false,
  },
  {
    model: Usuario,
    as: "actualizadorDireccion",
    attributes: ["id", "username", "email"],
    required: false,
  },
  {
    model: Usuario,
    as: "eliminadorDireccion",
    attributes: ["id", "username", "email"],
    required: false,
  },
];

/**
 * Formatea respuesta exitosa
 */
const formatSuccessResponse = (
  data,
  message = "Operación exitosa",
  total = null
) => {
  const response = { success: true, message, data };
  if (total !== null) response.total = total;
  return response;
};

/**
 * Formatea respuesta de error
 */
const formatErrorResponse = (message, error = null) => {
  return {
    success: false,
    message,
    error: error?.message || null,
  };
};

/**
 * Auto-asigna cuadrante y sector basado en calle y número
 * @param {number} calleId - ID de la calle
 * @param {string} numeroMunicipal - Número municipal
 * @returns {Promise<Object>} { cuadrante_id, sector_id }
 */
const autoAsignarCuadranteYSector = async (calleId, numeroMunicipal, manzana = null) => {
  let relacion = null;

  // Prioridad 1: Por número municipal
  if (numeroMunicipal) {
    const numero = parseInt(numeroMunicipal.replace(/[^0-9]/g, ""));
    if (!isNaN(numero)) {
      relacion = await CallesCuadrantes.buscarCuadrantePorNumero(calleId, numero);
    }
  }

  // Prioridad 2: Por manzana (AAHH sin numeración municipal)
  if (!relacion && manzana) {
    relacion = await CallesCuadrantes.buscarCuadrantePorManzana(calleId, manzana);
  }

  if (!relacion) {
    return { cuadrante_id: null, sector_id: null };
  }

  // Obtener sector del cuadrante
  const cuadrante = await Cuadrante.findByPk(relacion.cuadrante_id, {
    attributes: ["id", "sector_id"],
  });

  return {
    cuadrante_id: cuadrante.id,
    sector_id: cuadrante.sector_id,
  };
};

/**
 * Genera la dirección completa formateada a partir de sus componentes.
 * Respaldo en código porque el trigger MySQL puede no estar activo.
 *
 * Ejemplos de salida:
 *   "Ca. Santa Teresa N° 1052"
 *   "Jr. Los Pinos Mz. B Lt. 15"
 *   "Av. Ejército N° 450 Dpto. 201"
 *
 * @param {Object} calle - Objeto Calle con nombre_completo
 * @param {Object} campos - Campos de la dirección
 * @returns {string} Dirección completa formateada
 */
const generarDireccionCompleta = (calle, campos) => {
  const partes = [];

  // Nombre de la calle (ej: "Ca. Santa Teresa")
  if (calle?.nombre_completo) {
    partes.push(calle.nombre_completo);
  }

  // Número municipal
  if (campos.numero_municipal) {
    partes.push(`N° ${campos.numero_municipal}`);
  }

  // Manzana / Lote
  if (campos.manzana) {
    partes.push(`Mz. ${campos.manzana}`);
    if (campos.lote) {
      partes.push(`Lt. ${campos.lote}`);
    }
  }

  // Complemento (Dpto, Int, Piso, etc.)
  if (campos.tipo_complemento && campos.numero_complemento) {
    partes.push(`${campos.tipo_complemento} ${campos.numero_complemento}`);
  }

  // Urbanización
  if (campos.urbanizacion) {
    partes.push(`- ${campos.urbanizacion}`);
  }

  return partes.join(" ") || null;
};

/**
 * Valida que la dirección tenga al menos un sistema de direccionamiento
 * @param {string} numeroMunicipal - Número municipal
 * @param {string} manzana - Manzana
 * @param {string} lote - Lote
 * @returns {boolean} true si es válida
 */
const validarSistemasDireccionamiento = (numeroMunicipal, manzana, lote) => {
  const tieneNumeroMunicipal = numeroMunicipal && numeroMunicipal.trim() !== "";
  const tieneManzanaLote =
    manzana && lote && manzana.trim() !== "" && lote.trim() !== "";

  return tieneNumeroMunicipal || tieneManzanaLote;
};

/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL
 * ============================================================================
 */

const direccionesController = {
  /**
   * @swagger
   * /api/direcciones:
   *   get:
   *     summary: Listar direcciones con paginación y filtros
   *     tags: [Direcciones]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: calle_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: cuadrante_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: sector_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: geocodificada
   *         schema:
   *           type: integer
   *       - in: query
   *         name: paranoid
   *         schema:
   *           type: string
   *           enum: [true, false]
   *           default: 'true'
   *         description: Si es 'false', incluye direcciones eliminadas (soft-deleted)
   *     responses:
   *       200:
   *         description: Lista de direcciones
   */
  listarTodas: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || "";
      const calle_id = req.query.calle_id ? parseInt(req.query.calle_id) : null;
      const cuadrante_id = req.query.cuadrante_id
        ? parseInt(req.query.cuadrante_id)
        : null;
      const sector_id = req.query.sector_id
        ? parseInt(req.query.sector_id)
        : null;
      const geocodificada =
        req.query.geocodificada !== undefined
          ? parseInt(req.query.geocodificada)
          : null;

      // Nuevo parámetro: incluir soft-deleted (default: 'true' = NO incluir eliminados)
      const paranoid = req.query.paranoid !== undefined
        ? req.query.paranoid === "true"
        : true;

      const offset = (page - 1) * limit;

      // Construir condiciones WHERE
      const whereConditions = {};

      if (search) {
        whereConditions[Op.or] = [
          { direccion_completa: { [Op.like]: `%${search}%` } },
          { direccion_code: { [Op.like]: `%${search}%` } },
          { numero_municipal: { [Op.like]: `%${search}%` } },
          { manzana: { [Op.like]: `%${search}%` } },
          { lote: { [Op.like]: `%${search}%` } },
        ];
      }

      if (calle_id) whereConditions.calle_id = calle_id;
      if (cuadrante_id) whereConditions.cuadrante_id = cuadrante_id;
      if (sector_id) whereConditions.sector_id = sector_id;
      if (geocodificada !== null) whereConditions.geocodificada = geocodificada;

      // Consulta con relaciones
      const { count, rows } = await Direccion.findAndCountAll({
        where: whereConditions,
        paranoid, // ← Controla si incluye soft-deleted o no
        include: [
          {
            model: Calle,
            as: "calle",
            include: [
              {
                model: TipoVia,
                as: "tipoVia",
                attributes: ["abreviatura", "nombre"],
              },
            ],
          },
          {
            model: Cuadrante,
            as: "cuadrante",
            attributes: ["id", "cuadrante_code", "nombre"],
            required: false, // LEFT JOIN - incluir direcciones sin cuadrante
          },
          {
            model: Sector,
            as: "sector",
            attributes: ["id", "sector_code", "nombre"],
            required: false, // LEFT JOIN - incluir direcciones sin sector
          },
          ...auditInclude, // Incluir usuarios de auditoría
        ],
        order: [
          [{ model: Calle, as: "calle" }, "nombre_via", "ASC"],
          ["numero_municipal", "ASC"],
          ["manzana", "ASC"],
          ["lote", "ASC"],
        ],
        limit,
        offset,
        distinct: true,
      });

      const totalPages = Math.ceil(count / limit);

      return res.status(200).json(
        formatSuccessResponse(
          {
            items: rows,
            pagination: {
              currentPage: page,
              totalPages,
              totalItems: count,
              itemsPerPage: limit,
            },
          },
          "Direcciones obtenidas exitosamente",
          count
        )
      );
    } catch (error) {
      console.error("Error al listar direcciones:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener direcciones", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones/activas:
   *   get:
   *     summary: Listar solo direcciones activas
   *     tags: [Direcciones]
   *     responses:
   *       200:
   *         description: Lista de direcciones activas
   */
  listarActivas: async (req, res) => {
    try {
      const direcciones = await Direccion.findAll({
        where: {
          estado: 1,
          deleted_at: null,
        },
        include: [
          {
            model: Calle,
            as: "calle",
            include: [
              {
                model: TipoVia,
                as: "tipoVia",
                attributes: ["abreviatura"],
              },
            ],
          },
        ],
        order: [[{ model: Calle, as: "calle" }, "nombre_via", "ASC"]],
        limit: 100, // Limitar resultados
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            direcciones,
            "Direcciones activas obtenidas exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al listar direcciones activas:", error);
      return res
        .status(500)
        .json(
          formatErrorResponse("Error al obtener direcciones activas", error)
        );
    }
  },

  /**
   * @swagger
   * /api/direcciones/search:
   *   get:
   *     summary: Búsqueda avanzada de direcciones
   *     tags: [Direcciones]
   *     parameters:
   *       - in: query
   *         name: calle
   *         schema:
   *           type: string
   *       - in: query
   *         name: numero
   *         schema:
   *           type: string
   *       - in: query
   *         name: urbanizacion
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Resultados de búsqueda
   */
  busquedaAvanzada: async (req, res) => {
    try {
      const { calle, numero, urbanizacion } = req.query;

      const whereConditions = { estado: 1, deleted_at: null };
      const includeConditions = [];

      // Filtrar por calle
      if (calle) {
        includeConditions.push({
          model: Calle,
          as: "calle",
          where: {
            [Op.or]: [
              { nombre_via: { [Op.like]: `%${calle}%` } },
              { nombre_completo: { [Op.like]: `%${calle}%` } },
            ],
          },
          include: [
            {
              model: TipoVia,
              as: "tipoVia",
            },
          ],
        });
      } else {
        includeConditions.push({
          model: Calle,
          as: "calle",
          include: [{ model: TipoVia, as: "tipoVia" }],
        });
      }

      // Filtrar por número
      if (numero) {
        whereConditions[Op.or] = [
          { numero_municipal: { [Op.like]: `%${numero}%` } },
          { lote: { [Op.like]: `%${numero}%` } },
        ];
      }

      // Filtrar por urbanización
      if (urbanizacion) {
        whereConditions.urbanizacion = { [Op.like]: `%${urbanizacion}%` };
      }

      const resultados = await Direccion.findAll({
        where: whereConditions,
        include: includeConditions,
        limit: 50,
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            resultados,
            `${resultados.length} resultado(s) encontrado(s)`
          )
        );
    } catch (error) {
      console.error("Error en búsqueda avanzada:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error en búsqueda", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones/{id}:
   *   get:
   *     summary: Obtener dirección por ID
   *     tags: [Direcciones]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Dirección encontrada
   *       404:
   *         description: Dirección no encontrada
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;

      const direccion = await Direccion.findByPk(id, {
        include: [
          {
            model: Calle,
            as: "calle",
            include: [{ model: TipoVia, as: "tipoVia" }],
          },
          {
            model: Cuadrante,
            as: "cuadrante",
            include: [{ model: Sector, as: "sector" }],
            required: false, // LEFT JOIN - incluir direcciones sin cuadrante
          },
          {
            model: Sector,
            as: "sector",
            required: false, // LEFT JOIN - incluir direcciones sin sector
          },
          {
            model: Ubigeo,
            as: "ubigeo",
          },
          ...auditInclude, // Incluir usuarios de auditoría
        ],
      });

      if (!direccion) {
        return res
          .status(404)
          .json(formatErrorResponse("Dirección no encontrada"));
      }

      return res
        .status(200)
        .json(
          formatSuccessResponse(direccion, "Dirección obtenida exitosamente")
        );
    } catch (error) {
      console.error("Error al obtener dirección:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener dirección", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones:
   *   post:
   *     summary: Crear nueva dirección
   *     tags: [Direcciones]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - calle_id
   *             properties:
   *               calle_id:
   *                 type: integer
   *               numero_municipal:
   *                 type: string
   *               manzana:
   *                 type: string
   *               lote:
   *                 type: string
   *     responses:
   *       201:
   *         description: Dirección creada exitosamente
   */
  crear: async (req, res) => {
    try {
      const {
        calle_id,
        numero_municipal,
        manzana,
        lote,
        urbanizacion,
        tipo_complemento,
        numero_complemento,
        referencia,
        ubigeo_code,
        latitud,
        longitud,
        observaciones,
        cuadrante_id: cuadranteIdFrontend, // ✅ Recibir del frontend
        sector_id: sectorIdFrontend,       // ✅ Recibir del frontend
        fuente_geocodificacion: fuenteGeoFrontend, // ✅ Fuente real de coordenadas
        location_type: locationTypeFrontend,        // ✅ Precisión de geocodificación
      } = req.body;

      const userId = req.user?.id;

      // Validar que la calle existe
      const calle = await Calle.findByPk(calle_id);
      if (!calle) {
        return res.status(400).json(formatErrorResponse("Calle no encontrada"));
      }

      // Validar sistemas de direccionamiento
      if (!validarSistemasDireccionamiento(numero_municipal, manzana, lote)) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Debe proporcionar numero_municipal O (manzana + lote)"
            )
          );
      }

      // Generar código único secuencial
      const direccion_code = await Direccion.generarCodigo();

      // Determinar cuadrante y sector
      // PRIORIDAD: valores del frontend > auto-asignación
      let cuadrante_id = cuadranteIdFrontend || null;
      let sector_id = sectorIdFrontend || null;

      // Solo auto-asignar si NO vienen del frontend
      if (!cuadrante_id && !sector_id && (numero_municipal || manzana)) {
        const autoAsignados = await autoAsignarCuadranteYSector(
          calle_id,
          numero_municipal,
          manzana
        );
        cuadrante_id = autoAsignados.cuadrante_id;
        sector_id = autoAsignados.sector_id;
      }

      // Determinar si está geocodificada
      const geocodificada = latitud && longitud ? 1 : 0;
      // Usar la fuente real del frontend (Nominatim, BD, etc.) o "Manual" como fallback
      const fuente_geocodificacion = geocodificada
        ? (fuenteGeoFrontend || "Manual")
        : null;
      const location_type = geocodificada
        ? (locationTypeFrontend || null)
        : null;

      // Generar direccion_completa (respaldo por si el trigger MySQL no está activo)
      const camposDir = {
        numero_municipal: numero_municipal?.trim() || null,
        manzana: manzana?.trim() || null,
        lote: lote?.trim() || null,
        urbanizacion: urbanizacion?.trim() || null,
        tipo_complemento: tipo_complemento || null,
        numero_complemento: numero_complemento?.trim() || null,
      };
      const direccion_completa = generarDireccionCompleta(calle, camposDir);

      // Crear dirección
      const nuevaDireccion = await Direccion.create({
        direccion_code,
        calle_id,
        numero_municipal: camposDir.numero_municipal,
        manzana: camposDir.manzana,
        lote: camposDir.lote,
        urbanizacion: camposDir.urbanizacion,
        tipo_complemento: camposDir.tipo_complemento,
        numero_complemento: camposDir.numero_complemento,
        direccion_completa,
        referencia: referencia?.trim() || null,
        cuadrante_id,
        sector_id,
        ubigeo_code: ubigeo_code || null,
        latitud: latitud || null,
        longitud: longitud || null,
        geocodificada,
        fuente_geocodificacion,
        location_type,
        verificada: 0,
        veces_usada: 0,
        observaciones: observaciones?.trim() || null,
        estado: 1,
        created_by: userId,
        updated_by: userId,
      });

      // Recargar con relaciones
      const direccionCompleta = await Direccion.findByPk(nuevaDireccion.id, {
        include: [
          {
            model: Calle,
            as: "calle",
            include: [{ model: TipoVia, as: "tipoVia" }],
          },
          { model: Cuadrante, as: "cuadrante", required: false },
          { model: Sector, as: "sector", required: false },
          ...auditInclude, // Incluir usuarios de auditoría
        ],
      });

      return res
        .status(201)
        .json(
          formatSuccessResponse(
            direccionCompleta,
            "Dirección creada exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al crear dirección:", error);

      if (error.name === "SequelizeValidationError") {
        return res
          .status(400)
          .json(formatErrorResponse("Datos inválidos", error));
      }

      return res
        .status(500)
        .json(formatErrorResponse("Error al crear dirección", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones/validar:
   *   post:
   *     summary: Validar dirección sin guardar
   *     tags: [Direcciones]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Dirección válida con cuadrante/sector asignado
   */
  validar: async (req, res) => {
    try {
      const { calle_id, numero_municipal, manzana, lote } = req.body;

      // Validar calle
      const calle = await Calle.findByPk(calle_id, {
        include: [{ model: TipoVia, as: "tipoVia" }],
      });

      if (!calle) {
        return res.status(400).json(formatErrorResponse("Calle no encontrada"));
      }

      // Validar sistemas
      if (!validarSistemasDireccionamiento(numero_municipal, manzana, lote)) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Debe proporcionar numero_municipal O (manzana + lote)"
            )
          );
      }

      // Auto-asignar cuadrante y sector
      const { cuadrante_id, sector_id } = await autoAsignarCuadranteYSector(
        calle_id,
        numero_municipal,
        manzana
      );

      // Cargar cuadrante y sector
      let cuadrante = null;
      let sector = null;

      if (cuadrante_id) {
        cuadrante = await Cuadrante.findByPk(cuadrante_id);
        sector = await Sector.findByPk(sector_id);
      }

      return res.status(200).json(
        formatSuccessResponse(
          {
            valida: true,
            calle: {
              id: calle.id,
              nombre_completo: calle.nombre_completo,
              tipo_via: calle.tipoVia.abreviatura,
            },
            cuadrante: cuadrante
              ? {
                id: cuadrante.id,
                codigo: cuadrante.cuadrante_code,
                nombre: cuadrante.nombre,
              }
              : null,
            sector: sector
              ? {
                id: sector.id,
                codigo: sector.sector_code,
                nombre: sector.nombre,
              }
              : null,
            auto_asignado: cuadrante_id !== null,
          },
          "Dirección válida"
        )
      );
    } catch (error) {
      console.error("Error al validar dirección:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al validar dirección", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones/{id}:
   *   put:
   *     summary: Actualizar dirección
   *     tags: [Direcciones]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Dirección actualizada
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const direccion = await Direccion.findByPk(id);

      if (!direccion) {
        return res
          .status(404)
          .json(formatErrorResponse("Dirección no encontrada"));
      }

      // Determinar cuadrante y sector
      // PRIORIDAD: valores explícitos del frontend > auto-asignación > valores actuales
      let cuadrante_id = direccion.cuadrante_id;
      let sector_id = direccion.sector_id;

      // Si el frontend envía explícitamente cuadrante_id o sector_id, usarlos
      if (req.body.cuadrante_id !== undefined) {
        cuadrante_id = req.body.cuadrante_id;
      }
      if (req.body.sector_id !== undefined) {
        sector_id = req.body.sector_id;
      }

      // Solo auto-asignar si se cambia calle, número o manzana Y no se envían explícitamente
      if (
        (req.body.calle_id || req.body.numero_municipal || req.body.manzana) &&
        req.body.cuadrante_id === undefined &&
        req.body.sector_id === undefined
      ) {
        const nuevaCalleId = req.body.calle_id || direccion.calle_id;
        const nuevoNumero =
          req.body.numero_municipal || direccion.numero_municipal;
        const nuevaManzana = req.body.manzana || direccion.manzana;

        const asignacion = await autoAsignarCuadranteYSector(
          nuevaCalleId,
          nuevoNumero,
          nuevaManzana
        );
        cuadrante_id = asignacion.cuadrante_id;
        sector_id = asignacion.sector_id;
      }

      // Actualizar geocodificada
      const nuevaLat =
        req.body.latitud !== undefined ? req.body.latitud : direccion.latitud;
      const nuevaLon =
        req.body.longitud !== undefined
          ? req.body.longitud
          : direccion.longitud;
      const geocodificada = nuevaLat && nuevaLon ? 1 : 0;

      // Actualizar
      await direccion.update({
        ...req.body,
        cuadrante_id,
        sector_id,
        geocodificada,
        updated_by: userId,
      });

      // Recargar
      const direccionActualizada = await Direccion.findByPk(id, {
        include: [
          {
            model: Calle,
            as: "calle",
            include: [{ model: TipoVia, as: "tipoVia" }],
          },
          { model: Cuadrante, as: "cuadrante", required: false },
          { model: Sector, as: "sector", required: false },
          ...auditInclude, // Incluir usuarios de auditoría
        ],
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            direccionActualizada,
            "Dirección actualizada exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al actualizar dirección:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al actualizar dirección", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones/{id}:
   *   delete:
   *     summary: Eliminar dirección (soft delete)
   *     tags: [Direcciones]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Dirección eliminada
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const direccion = await Direccion.findByPk(id);

      if (!direccion) {
        return res
          .status(404)
          .json(formatErrorResponse("Dirección no encontrada"));
      }

      // Verificar si tiene novedades asociadas
      const totalNovedades = await Novedad.count({
        where: {
          direccion_id: id,
          deleted_at: null, // Solo contar novedades no eliminadas
        },
      });

      if (totalNovedades > 0) {
        return res.status(400).json(
          formatErrorResponse(
            `No se puede eliminar. Hay ${totalNovedades} novedad(es) asociada(s)`
          )
        );
      }

      // Soft delete: cambiar estado a 0, deleted_by y deleted_at
      await direccion.update({
        estado: 0,
        deleted_by: userId,
      });

      // Llamar destroy() para establecer deleted_at
      await direccion.destroy();

      return res
        .status(200)
        .json(formatSuccessResponse(null, "Dirección eliminada exitosamente"));
    } catch (error) {
      console.error("Error al eliminar dirección:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al eliminar dirección", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones/{id}/reactivar:
   *   patch:
   *     summary: Reactivar dirección eliminada (restaurar soft-delete)
   *     tags: [Direcciones]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Dirección reactivada
   */
  reactivar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Buscar dirección incluyendo soft-deleted
      const direccion = await Direccion.findByPk(id, {
        paranoid: false, // Incluir registros eliminados
      });

      if (!direccion) {
        return res
          .status(404)
          .json(formatErrorResponse("Dirección no encontrada"));
      }

      // Verificar que esté eliminada
      if (!direccion.deleted_at) {
        return res
          .status(400)
          .json(formatErrorResponse("La dirección no está eliminada"));
      }

      // Reactivar: cambiar estado a 1 y limpiar deleted_at/deleted_by
      await direccion.update({
        estado: 1,
        deleted_at: null,
        deleted_by: null,
        updated_by: userId,
      });

      // Usar restore() de Sequelize para limpiar el paranoid delete
      await direccion.restore();

      // Recargar con relaciones
      const direccionReactivada = await Direccion.findByPk(id, {
        include: [
          {
            model: Calle,
            as: "calle",
            include: [{ model: TipoVia, as: "tipoVia" }],
          },
          { model: Cuadrante, as: "cuadrante", required: false },
          { model: Sector, as: "sector", required: false },
          ...auditInclude, // Incluir usuarios de auditoría
        ],
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            direccionReactivada,
            "Dirección reactivada exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al reactivar dirección:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al reactivar dirección", error));
    }
  },

  /**
   * Actualizar coordenadas GPS
   */
  geocodificar: async (req, res) => {
    try {
      const { id } = req.params;
      const { latitud, longitud, fuente } = req.body;
      const userId = req.user?.id;

      if (!latitud || !longitud) {
        return res
          .status(400)
          .json(formatErrorResponse("Debe proporcionar latitud y longitud"));
      }

      const direccion = await Direccion.findByPk(id);

      if (!direccion) {
        return res
          .status(404)
          .json(formatErrorResponse("Dirección no encontrada"));
      }

      await direccion.update({
        latitud,
        longitud,
        geocodificada: 1,
        fuente_geocodificacion: fuente || "Manual",
        updated_by: userId,
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            direccion,
            "Coordenadas actualizadas exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al geocodificar:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al actualizar coordenadas", error));
    }
  },

  /**
   * Obtener direcciones más usadas (estadísticas)
   */
  masUsadas: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;

      const direcciones = await Direccion.findAll({
        where: {
          estado: 1,
          deleted_at: null,
          veces_usada: { [Op.gt]: 0 },
        },
        include: [
          {
            model: Calle,
            as: "calle",
            include: [{ model: TipoVia, as: "tipoVia" }],
          },
        ],
        order: [["veces_usada", "DESC"]],
        limit,
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            direcciones,
            "Direcciones más usadas obtenidas exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al obtener direcciones más usadas:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener estadísticas", error));
    }
  },

  /**
   * @swagger
   * /api/direcciones/{id}/can-delete:
   *   get:
   *     summary: Verificar si una dirección puede ser eliminada
   *     tags: [Direcciones]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Información sobre si puede ser eliminada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     canDelete:
   *                       type: boolean
   *                     message:
   *                       type: string
   *                     count:
   *                       type: integer
   */
  canDelete: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que la dirección existe
      const direccion = await Direccion.findByPk(id);

      if (!direccion) {
        return res
          .status(404)
          .json(formatErrorResponse("Dirección no encontrada"));
      }

      // Contar novedades asociadas
      const totalNovedades = await Novedad.count({
        where: {
          direccion_id: id,
          deleted_at: null, // Solo contar novedades no eliminadas
        },
      });

      // Determinar si puede ser eliminada
      const canDelete = totalNovedades === 0;
      const message = canDelete
        ? "La dirección puede ser eliminada"
        : `No se puede eliminar. Hay ${totalNovedades} novedad(es) asociada(s)`;

      return res.status(200).json(
        formatSuccessResponse({
          canDelete,
          message,
          count: totalNovedades,
        })
      );
    } catch (error) {
      console.error("Error al verificar si dirección puede eliminarse:", error);
      return res
        .status(500)
        .json(
          formatErrorResponse(
            "Error al verificar si la dirección puede eliminarse",
            error
          )
        );
    }
  },

  /**
   * Geocodificar una dirección a partir de un texto libre
   * Prioridad A: Búsqueda aproximada en BD
   * Prioridad B: API Nominatim (OpenStreetMap)
   *
   * @route GET /api/direcciones/geocodificar-texto
   * @query {string} direccion - Texto de la dirección
   */
  geocodificarTexto: async (req, res) => {
    try {
      const { direccion } = req.query;

      if (!direccion || direccion.trim().length < 3) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Debe proporcionar una dirección con al menos 3 caracteres"
            )
          );
      }

      const resultado = await geocodificarDireccion(direccion.trim());

      if (!resultado.success) {
        return res
          .status(404)
          .json(
            formatErrorResponse(
              "No se encontraron coordenadas para la dirección proporcionada"
            )
          );
      }

      // Enriquecer con direccion_id, sector_id, cuadrante_id
      let direccion_id = null;
      let sector_id = null;
      let cuadrante_id = null;

      // Estrategia 1: Buscar dirección exacta en BD por calle + número
      if (resultado.parsed?.streetName) {
        const calles = await Calle.findAll({
          where: {
            [Op.or]: [
              { nombre_via: { [Op.like]: `%${resultado.parsed.streetName}%` } },
              { nombre_completo: { [Op.like]: `%${resultado.parsed.streetName}%` } },
            ],
            estado: 1,
          },
          attributes: ["id"],
          limit: 10,
        });

        if (calles.length > 0) {
          const calleIds = calles.map((c) => c.id);

          // Buscar dirección exacta por número
          const whereDireccion = {
            calle_id: { [Op.in]: calleIds },
            estado: 1,
            deleted_at: null,
          };

          if (resultado.parsed.numero) {
            whereDireccion.numero_municipal = resultado.parsed.numero;
          } else if (resultado.parsed.manzana) {
            whereDireccion.manzana = resultado.parsed.manzana;
            if (resultado.parsed.lote) {
              whereDireccion.lote = resultado.parsed.lote;
            }
          }

          const direccionExacta = await Direccion.findOne({
            where: whereDireccion,
            attributes: ["id", "sector_id", "cuadrante_id"],
          });

          if (direccionExacta) {
            direccion_id = direccionExacta.id;
            sector_id = direccionExacta.sector_id;
            cuadrante_id = direccionExacta.cuadrante_id;
          } else if (resultado.parsed.numero) {
            // Fallback: dirección más cercana en misma cuadra
            const inputNum = parseInt(resultado.parsed.numero.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(inputNum)) {
              const inputCuadra = Math.floor(inputNum / 100);
              const direccionesCalle = await Direccion.findAll({
                where: {
                  calle_id: { [Op.in]: calleIds },
                  estado: 1,
                  deleted_at: null,
                  numero_municipal: { [Op.ne]: null },
                },
                attributes: ["id", "numero_municipal", "sector_id", "cuadrante_id"],
              });

              let bestMatch = null;
              let bestDistance = Infinity;

              for (const dir of direccionesCalle) {
                const dirNum = parseInt(dir.numero_municipal.replace(/[^0-9]/g, ""), 10);
                if (isNaN(dirNum)) continue;
                if (Math.floor(dirNum / 100) !== inputCuadra) continue;
                const distance = Math.abs(inputNum - dirNum);
                if (distance < bestDistance) {
                  bestMatch = dir;
                  bestDistance = distance;
                }
              }

              if (bestMatch) {
                direccion_id = bestMatch.id;
                sector_id = bestMatch.sector_id;
                cuadrante_id = bestMatch.cuadrante_id;
              }
            }
          } else if (resultado.parsed.manzana) {
            // Fallback: cualquier lote de la misma manzana en esas calles
            const direccionManzana = await Direccion.findOne({
              where: {
                calle_id: { [Op.in]: calleIds },
                manzana: resultado.parsed.manzana,
                estado: 1,
                deleted_at: null,
              },
              attributes: ["id", "sector_id", "cuadrante_id"],
              order: [["lote", "ASC"]],
            });

            if (direccionManzana) {
              direccion_id = direccionManzana.id;
              sector_id = direccionManzana.sector_id;
              cuadrante_id = direccionManzana.cuadrante_id;
            }
          }

          // Estrategia 2: Auto-asignar cuadrante por CallesCuadrantes
          if (!cuadrante_id && resultado.parsed.numero) {
            const autoAsignados = await autoAsignarCuadranteYSector(
              calleIds[0],
              resultado.parsed.numero
            );
            if (autoAsignados.cuadrante_id) {
              cuadrante_id = autoAsignados.cuadrante_id;
              sector_id = autoAsignados.sector_id;
            }
          }
        }
      }

      // Estrategia 3: Buscar cuadrante más cercano por coordenadas
      if (!cuadrante_id && resultado.latitud && resultado.longitud) {
        const cercanos = await Cuadrante.findNearby(
          parseFloat(resultado.latitud),
          parseFloat(resultado.longitud),
          1 // 1 km de radio
        );
        if (cercanos.length > 0) {
          cuadrante_id = cercanos[0].id;
          sector_id = cercanos[0].sector_id;
        }
      }

      return res.status(200).json(
        formatSuccessResponse(
          {
            latitud: resultado.latitud,
            longitud: resultado.longitud,
            direccion_id,
            sector_id,
            cuadrante_id,
            geocodificada: resultado.geocodificada,
            location_type: resultado.location_type,
            fuente_geocodificacion: resultado.fuente_geocodificacion,
            metodo: resultado.metodo,
            direccion_referencia: resultado.direccion_referencia || null,
            direccion_referencia_id: resultado.direccion_referencia_id || null,
            display_name: resultado.display_name || null,
            misma_cuadra: resultado.misma_cuadra || null,
            distancia_numerica: resultado.distancia_numerica || null,
          },
          `Geocodificación exitosa (${resultado.metodo === "base_de_datos" ? "base de datos" : "Nominatim API"})`
        )
      );
    } catch (error) {
      console.error("Error en geocodificación de texto:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al geocodificar la dirección", error));
    }
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================
export default direccionesController;
