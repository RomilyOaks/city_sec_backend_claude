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
import { Op } from "sequelize";

/**
 * ============================================================================
 * FUNCIONES AUXILIARES
 * ============================================================================
 */

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
const autoAsignarCuadranteYSector = async (calleId, numeroMunicipal) => {
  // Si no hay número municipal, no se puede auto-asignar
  if (!numeroMunicipal) {
    return { cuadrante_id: null, sector_id: null };
  }

  // Extraer número (eliminar letras como A, B, etc.)
  const numero = parseInt(numeroMunicipal.replace(/[^0-9]/g, ""));

  if (isNaN(numero)) {
    return { cuadrante_id: null, sector_id: null };
  }

  // Buscar cuadrante correspondiente
  const relacion = await CallesCuadrantes.buscarCuadrantePorNumero(
    calleId,
    numero
  );

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
          },
          {
            model: Sector,
            as: "sector",
            attributes: ["id", "sector_code", "nombre"],
          },
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
          },
          {
            model: Sector,
            as: "sector",
          },
          {
            model: Ubigeo,
            as: "ubigeo",
          },
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

      // Generar código único
      const direccion_code = Direccion.generarCodigo();

      // Auto-asignar cuadrante y sector
      const { cuadrante_id, sector_id } = await autoAsignarCuadranteYSector(
        calle_id,
        numero_municipal
      );

      // Determinar si está geocodificada
      const geocodificada = latitud && longitud ? 1 : 0;
      const fuente_geocodificacion = geocodificada ? "Manual" : null;

      // Crear dirección
      const nuevaDireccion = await Direccion.create({
        direccion_code,
        calle_id,
        numero_municipal: numero_municipal?.trim() || null,
        manzana: manzana?.trim() || null,
        lote: lote?.trim() || null,
        urbanizacion: urbanizacion?.trim() || null,
        tipo_complemento: tipo_complemento || null,
        numero_complemento: numero_complemento?.trim() || null,
        referencia: referencia?.trim() || null,
        cuadrante_id,
        sector_id,
        ubigeo_code: ubigeo_code || null,
        latitud: latitud || null,
        longitud: longitud || null,
        geocodificada,
        fuente_geocodificacion,
        verificada: 0,
        veces_usada: 0,
        observaciones: observaciones?.trim() || null,
        estado: 1,
        created_by: userId,
      });

      // Recargar con relaciones
      const direccionCompleta = await Direccion.findByPk(nuevaDireccion.id, {
        include: [
          {
            model: Calle,
            as: "calle",
            include: [{ model: TipoVia, as: "tipoVia" }],
          },
          { model: Cuadrante, as: "cuadrante" },
          { model: Sector, as: "sector" },
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
        numero_municipal
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

      // Si se actualiza calle o número, recalcular cuadrante/sector
      let cuadrante_id = direccion.cuadrante_id;
      let sector_id = direccion.sector_id;

      if (req.body.calle_id || req.body.numero_municipal) {
        const nuevaCalleId = req.body.calle_id || direccion.calle_id;
        const nuevoNumero =
          req.body.numero_municipal || direccion.numero_municipal;

        const asignacion = await autoAsignarCuadranteYSector(
          nuevaCalleId,
          nuevoNumero
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
          { model: Cuadrante, as: "cuadrante" },
          { model: Sector, as: "sector" },
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

      // Verificar si tiene novedades activas (si el modelo existe)
      // const totalNovedades = await Novedad.count({
      //   where: { direccion_id: id, estado: 1 }
      // });
      // if (totalNovedades > 0) {
      //   return res.status(400).json(
      //     formatErrorResponse(`No se puede eliminar. Hay ${totalNovedades} novedad(es) asociada(s)`)
      //   );
      // }

      // Soft delete
      await direccion.destroy();
      await direccion.update({ deleted_by: userId });

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
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================
export default direccionesController;
