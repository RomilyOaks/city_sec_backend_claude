/**
 * ============================================================================
 * ARCHIVO: src/controllers/callesController.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Controlador para gestión de calles
 *              Maneja operaciones CRUD, búsquedas y relaciones
 * ============================================================================
 *
 * PROPÓSITO:
 * - Gestionar el maestro de calles del distrito
 * - Proveer búsqueda avanzada (autocomplete)
 * - Manejar relaciones con tipos de vía, cuadrantes y ubicación
 * - Generar códigos únicos automáticos
 *
 * ENDPOINTS:
 * - GET    /api/calles                    - Listar con paginación
 * - GET    /api/calles/activas            - Listar solo activas
 * - GET    /api/calles/autocomplete       - Búsqueda para autocomplete
 * - GET    /api/calles/urbanizacion/:nombre - Calles de urbanización
 * - GET    /api/calles/:id                - Obtener por ID
 * - POST   /api/calles                    - Crear calle
 * - PUT    /api/calles/:id                - Actualizar calle
 * - DELETE /api/calles/:id                - Eliminar (soft delete)
 * - GET    /api/calles/:id/cuadrantes     - Cuadrantes de una calle
 * - GET    /api/calles/:id/direcciones    - Direcciones de una calle
 *
 * REGLAS DE NEGOCIO:
 * 1. Código de calle único y auto-generado
 * 2. Nombre completo se genera automáticamente en BD
 * 3. No se puede eliminar si tiene direcciones activas
 * 4. Combinación tipo_via + nombre_via + urbanización debe ser única
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import Calle from "../models/Calle.js";
import TipoVia from "../models/TipoVia.js";
import Ubigeo from "../models/Ubigeo.js";
import CallesCuadrantes from "../models/CallesCuadrantes.js";
import Cuadrante from "../models/Cuadrante.js";
import Sector from "../models/Sector.js";
import Direccion from "../models/Direccion.js";
import { Op } from "sequelize";

/**
 * ============================================================================
 * FUNCIONES AUXILIARES
 * ============================================================================
 */

/**
 * Genera código único de calle
 * @returns {Promise<string>} Código en formato C0001, C0002, etc.
 */
const generarCodigoCalle = async () => {
  const calles = await Calle.findAll({
    attributes: ["calle_code"],
    where: {
      calle_code: {
        [Op.regexp]: "^C[0-9]+$",
      },
      // NO filtrar por estado - debe considerar TODOS los registros
    },
    paranoid: false, // ← Incluir registros soft-deleted
    raw: true,
  });

  let numero = 1;

  if (calles && calles.length > 0) {
    const numeros = calles
      .map((c) => {
        const match = c.calle_code.match(/C(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((n) => n > 0);

    if (numeros.length > 0) {
      numero = Math.max(...numeros) + 1;
    }
  }
  const codigoGenerado = `C${numero.toString().padStart(4, "0")}`;
  console.log("Número generado para código de calle:", codigoGenerado);
  return codigoGenerado;
};

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
 * ============================================================================
 * CONTROLADOR PRINCIPAL
 * ============================================================================
 */

const callesController = {
  /**
   * @swagger
   * /api/calles:
   *   get:
   *     summary: Listar calles con paginación y filtros
   *     tags: [Calles]
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
   *         name: tipo_via_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: urbanizacion
   *         schema:
   *           type: string
   *       - in: query
   *         name: es_principal
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de calles
   */
  listarTodas: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || "";
      const tipo_via_id = req.query.tipo_via_id
        ? parseInt(req.query.tipo_via_id)
        : null;
      const urbanizacion = req.query.urbanizacion || "";
      const es_principal =
        req.query.es_principal !== undefined
          ? parseInt(req.query.es_principal)
          : null;

      const offset = (page - 1) * limit;

      // Construir condiciones WHERE
      const whereConditions = {};

      if (search) {
        whereConditions[Op.or] = [
          { nombre_via: { [Op.like]: `%${search}%` } },
          { nombre_completo: { [Op.like]: `%${search}%` } },
          { calle_code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (tipo_via_id) whereConditions.tipo_via_id = tipo_via_id;
      if (urbanizacion)
        whereConditions.urbanizacion = { [Op.like]: `%${urbanizacion}%` };
      if (es_principal !== null) whereConditions.es_principal = es_principal;

      // Consulta con relaciones
      const { count, rows } = await Calle.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: TipoVia,
            as: "tipoVia",
            attributes: ["id", "codigo", "nombre", "abreviatura"],
          },
          {
            model: Ubigeo,
            as: "ubigeo",
            attributes: [
              "ubigeo_code",
              "departamento",
              "provincia",
              "distrito",
            ],
          },
        ],
        order: [
          ["es_principal", "DESC"],
          ["nombre_via", "ASC"],
        ],
        limit,
        offset,
        distinct: true, // Para contar correctamente con includes
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
          "Calles obtenidas exitosamente",
          count
        )
      );
    } catch (error) {
      console.error("Error al listar calles:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener calles", error));
    }
  },

  /**
   * @swagger
   * /api/calles/activas:
   *   get:
   *     summary: Listar solo calles activas (para selects)
   *     tags: [Calles]
   *     responses:
   *       200:
   *         description: Lista de calles activas
   */
  listarActivas: async (req, res) => {
    try {
      const calles = await Calle.findAll({
        where: {
          estado: 1,
          deleted_at: null,
        },
        include: [
          {
            model: TipoVia,
            as: "tipoVia",
            attributes: ["abreviatura", "nombre"],
          },
        ],
        order: [
          ["es_principal", "DESC"],
          ["nombre_via", "ASC"],
        ],
        attributes: [
          "id",
          "calle_code",
          "nombre_via",
          "nombre_completo",
          "urbanizacion",
        ],
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(calles, "Calles activas obtenidas exitosamente")
        );
    } catch (error) {
      console.error("Error al listar calles activas:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener calles activas", error));
    }
  },

  /**
   * @swagger
   * /api/calles/autocomplete:
   *   get:
   *     summary: Búsqueda de calles para autocomplete
   *     tags: [Calles]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Texto a buscar
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Máximo de resultados (default 20)
   *     responses:
   *       200:
   *         description: Resultados de búsqueda
   */
  autocomplete: async (req, res) => {
    try {
      const query = req.query.q || "";
      const limit = parseInt(req.query.limit) || 20;

      if (!query || query.length < 2) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Debe ingresar al menos 2 caracteres para buscar"
            )
          );
      }

      // Usar método estático del modelo
      const resultados = await Calle.buscarPorNombre(query, limit);

      // Formatear para autocomplete (id, label, value)
      const formateados = resultados.map((calle) => ({
        id: calle.id,
        calle_code: calle.calle_code,
        label: calle.urbanizacion
          ? `${calle.nombre_completo} - ${calle.urbanizacion}`
          : calle.nombre_completo,
        value: calle.nombre_completo,
        tipo_via: calle.tipoVia?.nombre,
        es_principal: calle.es_principal,
        urbanizacion: calle.urbanizacion,
      }));

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            formateados,
            `${formateados.length} resultado(s) encontrado(s)`
          )
        );
    } catch (error) {
      console.error("Error en autocomplete:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error en búsqueda", error));
    }
  },

  /**
   * @swagger
   * /api/calles/urbanizacion/{nombre}:
   *   get:
   *     summary: Obtener calles de una urbanización específica
   *     tags: [Calles]
   *     parameters:
   *       - in: path
   *         name: nombre
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Calles de la urbanización
   */
  porUrbanizacion: async (req, res) => {
    try {
      const { nombre } = req.params;

      const calles = await Calle.porUrbanizacion(nombre);

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            calles,
            `${calles.length} calle(s) encontrada(s) en ${nombre}`
          )
        );
    } catch (error) {
      console.error("Error al buscar calles por urbanización:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al buscar calles", error));
    }
  },

  /**
   * @swagger
   * /api/calles/{id}:
   *   get:
   *     summary: Obtener calle por ID con información completa
   *     tags: [Calles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Calle encontrada
   *       404:
   *         description: Calle no encontrada
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;

      const calle = await Calle.findByPk(id, {
        include: [
          {
            model: TipoVia,
            as: "tipoVia",
            attributes: ["id", "codigo", "nombre", "abreviatura"],
          },
          {
            model: Ubigeo,
            as: "ubigeo",
            attributes: [
              "ubigeo_code",
              "departamento",
              "provincia",
              "distrito",
            ],
          },
        ],
      });

      if (!calle) {
        return res.status(404).json(formatErrorResponse("Calle no encontrada"));
      }

      // Obtener estadísticas
      const [totalCuadrantes, totalDirecciones] = await Promise.all([
        CallesCuadrantes.count({
          where: { calle_id: id, estado: 1 },
        }),
        Direccion.count({
          where: { calle_id: id, estado: 1 },
        }),
      ]);

      return res.status(200).json(
        formatSuccessResponse(
          {
            ...calle.toJSON(),
            estadisticas: {
              total_cuadrantes: totalCuadrantes,
              total_direcciones: totalDirecciones,
            },
          },
          "Calle obtenida exitosamente"
        )
      );
    } catch (error) {
      console.error("Error al obtener calle:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener calle", error));
    }
  },

  /**
   * @swagger
   * /api/calles:
   *   post:
   *     summary: Crear nueva calle
   *     tags: [Calles]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tipo_via_id
   *               - nombre_via
   *     responses:
   *       201:
   *         description: Calle creada exitosamente
   */
  crear: async (req, res) => {
    try {
      const {
        tipo_via_id,
        nombre_via,
        ubigeo_code,
        urbanizacion,
        zona,
        longitud_metros,
        ancho_metros,
        tipo_pavimento,
        sentido_via,
        carriles,
        interseccion_inicio,
        interseccion_fin,
        observaciones,
        es_principal,
        categoria_via,
      } = req.body;

      const userId = req.usuario?.id;

      // Validar tipo de vía existe
      const tipoVia = await TipoVia.findByPk(tipo_via_id);
      if (!tipoVia) {
        return res
          .status(400)
          .json(formatErrorResponse("Tipo de vía no válido"));
      }

      // Validar combinación única (tipo_via + nombre + urbanización)
      const existente = await Calle.findOne({
        where: {
          tipo_via_id,
          nombre_via: nombre_via.trim(),
          urbanizacion: urbanizacion || null,
        },
      });

      if (existente) {
        const nombreCompleto = urbanizacion
          ? `${tipoVia.abreviatura} ${nombre_via} - ${urbanizacion}`
          : `${tipoVia.abreviatura} ${nombre_via}`;

        return res
          .status(400)
          .json(
            formatErrorResponse(
              `La calle '${nombreCompleto}' ya está registrada`
            )
          );
      }

      // Generar código único
      const calle_code = await generarCodigoCalle();

      // Crear calle
      const nuevaCalle = await Calle.create({
        calle_code,
        tipo_via_id,
        nombre_via: nombre_via.trim(),
        ubigeo_code,
        urbanizacion: urbanizacion?.trim() || null,
        zona: zona?.trim() || null,
        longitud_metros,
        ancho_metros,
        tipo_pavimento,
        sentido_via: sentido_via || "DOBLE_VIA",
        carriles,
        interseccion_inicio: interseccion_inicio?.trim() || null,
        interseccion_fin: interseccion_fin?.trim() || null,
        observaciones: observaciones?.trim() || null,
        es_principal: es_principal || 0,
        categoria_via: categoria_via || "LOCAL",
        estado: 1,
        created_by: userId,
      });

      // Cargar con relaciones para respuesta
      const calleCompleta = await Calle.findByPk(nuevaCalle.id, {
        include: [
          {
            model: TipoVia,
            as: "tipoVia",
          },
        ],
      });

      return res
        .status(201)
        .json(
          formatSuccessResponse(calleCompleta, "Calle creada exitosamente")
        );
    } catch (error) {
      console.error("Error al crear calle:", error);

      // Error de validación
      if (error.name === "SequelizeValidationError") {
        return res
          .status(400)
          .json(formatErrorResponse("Datos inválidos", error));
      }

      // ✅ Error de duplicado (AGREGAR ESTO)
      if (error.name === "SequelizeUniqueConstraintError") {
        const field = error.errors[0]?.path || "campo";
        const value = error.errors[0]?.value || "";

        return res.status(400).json({
          success: false,
          message: `Ya existe una calle con ${field}: ${value}`,
          field: field,
          value: value,
        });
      }

      return res
        .status(500)
        .json(formatErrorResponse("Error al crear calle", error));
    }
  },

  /**
   * @swagger
   * /api/calles/{id}:
   *   put:
   *     summary: Actualizar calle
   *     tags: [Calles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Calle actualizada
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.usuario?.id;

      const calle = await Calle.findByPk(id);

      if (!calle) {
        return res.status(404).json(formatErrorResponse("Calle no encontrada"));
      }

      // Validar tipo de vía si se está cambiando
      if (req.body.tipo_via_id && req.body.tipo_via_id !== calle.tipo_via_id) {
        const tipoVia = await TipoVia.findByPk(req.body.tipo_via_id);
        if (!tipoVia) {
          return res
            .status(400)
            .json(formatErrorResponse("Tipo de vía no válido"));
        }
      }

      // Actualizar campos
      await calle.update({
        ...req.body,
        updated_by: userId,
      });

      // Recargar con relaciones
      const calleActualizada = await Calle.findByPk(id, {
        include: [
          {
            model: TipoVia,
            as: "tipoVia",
          },
        ],
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            calleActualizada,
            "Calle actualizada exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al actualizar calle:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al actualizar calle", error));
    }
  },

  /**
   * @swagger
   * /api/calles/{id}:
   *   delete:
   *     summary: Eliminar calle (soft delete)
   *     tags: [Calles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Calle eliminada
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.usuario?.id;

      const calle = await Calle.findByPk(id);

      if (!calle) {
        return res.status(404).json(formatErrorResponse("Calle no encontrada"));
      }

      // Verificar direcciones activas
      const totalDirecciones = await Direccion.count({
        where: { calle_id: id, estado: 1 },
      });

      if (totalDirecciones > 0) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              `No se puede eliminar. Hay ${totalDirecciones} dirección(es) asociada(s)`
            )
          );
      }

      // Soft delete
      await calle.update({
        estado: 0, // ← Marcar como inactivo
        deleted_by: userId, // ← Registrar quién eliminó
      });
      await calle.destroy(); // Marca deleted_at

      return res
        .status(200)
        .json(formatSuccessResponse(null, "Calle eliminada exitosamente"));
    } catch (error) {
      console.error("Error al eliminar calle:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al eliminar calle", error));
    }
  },

  /**
   * Obtener cuadrantes de una calle
   */
  obtenerCuadrantes: async (req, res) => {
    try {
      const { id } = req.params;

      const relaciones = await CallesCuadrantes.findAll({
        where: { calle_id: id, estado: 1 },
        include: [
          {
            model: Cuadrante,
            as: "cuadrante",
            include: [
              {
                model: Sector,
                as: "sector",
              },
            ],
          },
        ],
        order: [["numero_inicio", "ASC"]],
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            relaciones,
            `${relaciones.length} cuadrante(s) encontrado(s)`
          )
        );
    } catch (error) {
      console.error("Error al obtener cuadrantes:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener cuadrantes", error));
    }
  },

  /**
   * Obtener direcciones de una calle
   */
  obtenerDirecciones: async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const direcciones = await Direccion.findAll({
        where: { calle_id: id, estado: 1 },
        order: [
          ["numero_municipal", "ASC"],
          ["manzana", "ASC"],
          ["lote", "ASC"],
        ],
        limit,
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            direcciones,
            `${direcciones.length} dirección(es) encontrada(s)`
          )
        );
    } catch (error) {
      console.error("Error al obtener direcciones:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener direcciones", error));
    }
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================
export default callesController;
