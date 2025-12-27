/**
 * ============================================================================
 * ARCHIVO: src/controllers/callesCuadrantesController.js
 * VERSIÓN: 2.2.1
 * DESCRIPCIÓN: Controlador para gestión de relaciones calle-cuadrante
 *              Maneja la asignación de calles a cuadrantes con rangos
 * ============================================================================
 *
 * PROPÓSITO:
 * - Gestionar relaciones Many-to-Many entre calles y cuadrantes
 * - Definir rangos de numeración por cuadrante
 * - Facilitar auto-asignación de cuadrantes a direcciones
 * - Validar solapamientos de rangos
 *
 * ENDPOINTS:
 * - GET    /api/calles-cuadrantes              - Listar todas las relaciones
 * - GET    /api/calles-cuadrantes/:id          - Obtener relación por ID
 * - POST   /api/calles-cuadrantes              - Crear relación
 * - PUT    /api/calles-cuadrantes/:id          - Actualizar relación
 * - DELETE /api/calles-cuadrantes/:id          - Eliminar relación
 * - GET    /api/calles-cuadrantes/calle/:id    - Relaciones de una calle
 * - GET    /api/calles-cuadrantes/cuadrante/:id - Relaciones de un cuadrante
 * - POST   /api/calles-cuadrantes/buscar-cuadrante - Buscar cuadrante por número
 *
 * REGLAS DE NEGOCIO:
 * 1. Una calle puede estar en múltiples cuadrantes
 * 2. Los rangos no deben solaparse (mismo lado)
 * 3. Si hay numero_inicio debe haber numero_fin y viceversa
 * 4. La prioridad define cuál usar en caso de conflicto
 * 5. No se puede duplicar calle+cuadrante
 *
 * @author Claude AI
 * @date 2025-12-23
 * ============================================================================
 */

import CallesCuadrantes from "../models/CallesCuadrantes.js";
import Calle from "../models/Calle.js";
import Cuadrante from "../models/Cuadrante.js";
import Sector from "../models/Sector.js";
import TipoVia from "../models/TipoVia.js";
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
 * Valida que los rangos no se solapen con otros rangos existentes
 * @param {number} calleId - ID de la calle
 * @param {number} numeroInicio - Número inicial del rango
 * @param {number} numeroFin - Número final del rango
 * @param {string} lado - Lado (AMBOS, PAR, IMPAR, TODOS)
 * @param {number} excludeId - ID a excluir (para actualización)
 * @returns {Promise<Object|null>} Relación que solapa o null
 */
const validarSolapamiento = async (
  calleId,
  numeroInicio,
  numeroFin,
  lado,
  excludeId = null
) => {
  // Si no hay rango definido, no hay solapamiento
  if (!numeroInicio || !numeroFin) return null;

  const whereCondition = {
    calle_id: calleId,
    estado: 1,
    deleted_at: null,
    numero_inicio: { [Op.ne]: null },
    numero_fin: { [Op.ne]: null },
    [Op.or]: [
      // Caso 1: El nuevo rango está completamente dentro de un rango existente
      {
        numero_inicio: { [Op.lte]: numeroInicio },
        numero_fin: { [Op.gte]: numeroFin },
      },
      // Caso 2: El nuevo rango contiene completamente a un rango existente
      {
        numero_inicio: { [Op.gte]: numeroInicio },
        numero_fin: { [Op.lte]: numeroFin },
      },
      // Caso 3: El inicio del nuevo rango está dentro de un rango existente
      {
        numero_inicio: { [Op.lte]: numeroInicio },
        numero_fin: { [Op.gte]: numeroInicio },
      },
      // Caso 4: El fin del nuevo rango está dentro de un rango existente
      {
        numero_inicio: { [Op.lte]: numeroFin },
        numero_fin: { [Op.gte]: numeroFin },
      },
    ],
  };

  // Excluir el ID actual si es actualización
  if (excludeId) {
    whereCondition.id = { [Op.ne]: excludeId };
  }

  // Solo validar solapamiento si los lados coinciden
  // AMBOS y TODOS se solapan con todo
  // PAR solo se solapa con PAR, AMBOS, TODOS
  // IMPAR solo se solapa con IMPAR, AMBOS, TODOS
  if (lado === "PAR") {
    whereCondition.lado = { [Op.in]: ["PAR", "AMBOS", "TODOS"] };
  } else if (lado === "IMPAR") {
    whereCondition.lado = { [Op.in]: ["IMPAR", "AMBOS", "TODOS"] };
  }

  const solapamiento = await CallesCuadrantes.findOne({
    where: whereCondition,
    include: [
      {
        model: Cuadrante,
        as: "cuadrante",
        attributes: ["id", "cuadrante_code", "nombre"],
      },
    ],
  });

  return solapamiento;
};

/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL
 * ============================================================================
 */

const callesCuadrantesController = {
  /**
   * @swagger
   * /api/calles-cuadrantes:
   *   get:
   *     summary: Listar todas las relaciones calle-cuadrante
   *     tags: [Calles-Cuadrantes]
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
   *         name: calle_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: cuadrante_id
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de relaciones
   */
  listarTodas: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const calle_id = req.query.calle_id ? parseInt(req.query.calle_id) : null;
      const cuadrante_id = req.query.cuadrante_id
        ? parseInt(req.query.cuadrante_id)
        : null;

      const offset = (page - 1) * limit;

      const whereConditions = {};
      if (calle_id) whereConditions.calle_id = calle_id;
      if (cuadrante_id) whereConditions.cuadrante_id = cuadrante_id;

      const { count, rows } = await CallesCuadrantes.findAndCountAll({
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
            include: [
              {
                model: Sector,
                as: "sector",
                attributes: ["id", "sector_code", "nombre"],
              },
            ],
          },
        ],
        order: [
          [{ model: Calle, as: "calle" }, "nombre_via", "ASC"],
          ["numero_inicio", "ASC"],
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
          "Relaciones obtenidas exitosamente",
          count
        )
      );
    } catch (error) {
      console.error("Error al listar relaciones:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener relaciones", error));
    }
  },

  /**
   * @swagger
   * /api/calles-cuadrantes/{id}:
   *   get:
   *     summary: Obtener relación por ID
   *     tags: [Calles-Cuadrantes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Relación encontrada
   *       404:
   *         description: Relación no encontrada
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;

      const relacion = await CallesCuadrantes.findByPk(id, {
        include: [
          {
            model: Calle,
            as: "calle",
            include: [
              {
                model: TipoVia,
                as: "tipoVia",
              },
            ],
          },
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
      });

      if (!relacion) {
        return res
          .status(404)
          .json(formatErrorResponse("Relación no encontrada"));
      }

      return res
        .status(200)
        .json(
          formatSuccessResponse(relacion, "Relación obtenida exitosamente")
        );
    } catch (error) {
      console.error("Error al obtener relación:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener relación", error));
    }
  },

  /**
   * @swagger
   * /api/calles-cuadrantes:
   *   post:
   *     summary: Crear nueva relación calle-cuadrante
   *     tags: [Calles-Cuadrantes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - calle_id
   *               - cuadrante_id
   *             properties:
   *               calle_id:
   *                 type: integer
   *               cuadrante_id:
   *                 type: integer
   *               numero_inicio:
   *                 type: integer
   *               numero_fin:
   *                 type: integer
   *               lado:
   *                 type: string
   *                 enum: [AMBOS, PAR, IMPAR, TODOS]
   *               prioridad:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Relación creada exitosamente
   *       400:
   *         description: Datos inválidos o relación duplicada
   */
  crear: async (req, res) => {
    try {
      const {
        calle_id,
        cuadrante_id,
        numero_inicio,
        numero_fin,
        lado,
        desde_interseccion,
        hasta_interseccion,
        prioridad,
        observaciones,
      } = req.body;

      const userId = req.usuario?.id;

      // Validar que la calle existe
      const calle = await Calle.findByPk(calle_id);
      if (!calle) {
        return res.status(400).json(formatErrorResponse("Calle no encontrada"));
      }

      // Validar que el cuadrante existe
      const cuadrante = await Cuadrante.findByPk(cuadrante_id);
      if (!cuadrante) {
        return res
          .status(400)
          .json(formatErrorResponse("Cuadrante no encontrado"));
      }

      // Validar que no exista la combinación calle+cuadrante+numero_inicio+lado
      // Coincide con el índice único: uq_calle_cuadrante_numero_lado
      const existente = await CallesCuadrantes.findOne({
        where: {
          calle_id,
          cuadrante_id,
          numero_inicio: numero_inicio || null,
          lado: lado || "AMBOS",
          deleted_at: null,
        },
      });

      if (existente) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              `Ya existe una relación para esta calle en el cuadrante ${cuadrante.cuadrante_code} ` +
              `con inicio ${numero_inicio || 'NULL'} y lado '${lado || "AMBOS"}'`
            )
          );
      }

      // Validar rango completo (si hay inicio debe haber fin)
      if ((numero_inicio && !numero_fin) || (!numero_inicio && numero_fin)) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Debe especificar tanto numero_inicio como numero_fin"
            )
          );
      }

      // Validar que numero_fin > numero_inicio
      if (numero_inicio && numero_fin && numero_fin < numero_inicio) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "numero_fin debe ser mayor o igual que numero_inicio"
            )
          );
      }

      // Validar solapamiento de rangos
      if (numero_inicio && numero_fin) {
        const solapamiento = await validarSolapamiento(
          calle_id,
          numero_inicio,
          numero_fin,
          lado || "AMBOS"
        );

        if (solapamiento) {
          return res
            .status(400)
            .json(
              formatErrorResponse(
                `El rango ${numero_inicio}-${numero_fin} se solapa con el cuadrante ` +
                  `${solapamiento.cuadrante.cuadrante_code} (${solapamiento.numero_inicio}-${solapamiento.numero_fin})`
              )
            );
        }
      }

      // Crear relación
      const nuevaRelacion = await CallesCuadrantes.create({
        calle_id,
        cuadrante_id,
        numero_inicio: numero_inicio || null,
        numero_fin: numero_fin || null,
        lado: lado || "AMBOS",
        desde_interseccion: desde_interseccion?.trim() || null,
        hasta_interseccion: hasta_interseccion?.trim() || null,
        prioridad: prioridad || 1,
        observaciones: observaciones?.trim() || null,
        estado: 1,
        created_by: userId,
      });

      // Recargar con relaciones
      const relacionCompleta = await CallesCuadrantes.findByPk(
        nuevaRelacion.id,
        {
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
          ],
        }
      );

      return res
        .status(201)
        .json(
          formatSuccessResponse(
            relacionCompleta,
            "Relación creada exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al crear relación:", error);

      if (error.name === "SequelizeValidationError") {
        return res
          .status(400)
          .json(formatErrorResponse("Datos inválidos", error));
      }

      return res
        .status(500)
        .json(formatErrorResponse("Error al crear relación", error));
    }
  },

  /**
   * @swagger
   * /api/calles-cuadrantes/{id}:
   *   put:
   *     summary: Actualizar relación calle-cuadrante
   *     tags: [Calles-Cuadrantes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Relación actualizada
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        numero_inicio,
        numero_fin,
        lado,
        desde_interseccion,
        hasta_interseccion,
        prioridad,
        observaciones,
      } = req.body;

      const userId = req.usuario?.id;

      const relacion = await CallesCuadrantes.findByPk(id);

      if (!relacion) {
        return res
          .status(404)
          .json(formatErrorResponse("Relación no encontrada"));
      }

      // Validar rangos si se están actualizando
      const nuevoInicio =
        numero_inicio !== undefined ? numero_inicio : relacion.numero_inicio;
      const nuevoFin =
        numero_fin !== undefined ? numero_fin : relacion.numero_fin;
      const nuevoLado = lado || relacion.lado;

      if ((nuevoInicio && !nuevoFin) || (!nuevoInicio && nuevoFin)) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "Debe especificar tanto numero_inicio como numero_fin"
            )
          );
      }

      if (nuevoInicio && nuevoFin && nuevoFin < nuevoInicio) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "numero_fin debe ser mayor o igual que numero_inicio"
            )
          );
      }

      // Validar solapamiento excluyendo el registro actual
      if (nuevoInicio && nuevoFin) {
        const solapamiento = await validarSolapamiento(
          relacion.calle_id,
          nuevoInicio,
          nuevoFin,
          nuevoLado,
          id // Excluir este ID
        );

        if (solapamiento) {
          return res
            .status(400)
            .json(
              formatErrorResponse(
                `El rango ${nuevoInicio}-${nuevoFin} se solapa con el cuadrante ` +
                  `${solapamiento.cuadrante.cuadrante_code}`
              )
            );
        }
      }

      // Actualizar
      await relacion.update({
        numero_inicio: nuevoInicio,
        numero_fin: nuevoFin,
        lado: nuevoLado,
        desde_interseccion:
          desde_interseccion !== undefined
            ? desde_interseccion?.trim()
            : relacion.desde_interseccion,
        hasta_interseccion:
          hasta_interseccion !== undefined
            ? hasta_interseccion?.trim()
            : relacion.hasta_interseccion,
        prioridad: prioridad !== undefined ? prioridad : relacion.prioridad,
        observaciones:
          observaciones !== undefined
            ? observaciones?.trim()
            : relacion.observaciones,
        updated_by: userId,
      });

      // Recargar con relaciones
      const relacionActualizada = await CallesCuadrantes.findByPk(id, {
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
        ],
      });

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            relacionActualizada,
            "Relación actualizada exitosamente"
          )
        );
    } catch (error) {
      console.error("Error al actualizar relación:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al actualizar relación", error));
    }
  },

  /**
   * @swagger
   * /api/calles-cuadrantes/{id}:
   *   delete:
   *     summary: Eliminar relación (soft delete)
   *     tags: [Calles-Cuadrantes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Relación eliminada
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.usuario?.id;

      const relacion = await CallesCuadrantes.findByPk(id);

      if (!relacion) {
        return res
          .status(404)
          .json(formatErrorResponse("Relación no encontrada"));
      }

      // Soft delete
      await relacion.destroy();
      await relacion.update({ deleted_by: userId });

      return res
        .status(200)
        .json(formatSuccessResponse(null, "Relación eliminada exitosamente"));
    } catch (error) {
      console.error("Error al eliminar relación:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al eliminar relación", error));
    }
  },

  /**
   * Obtener todas las relaciones de una calle específica
   */
  porCalle: async (req, res) => {
    try {
      const { id } = req.params;

      const relaciones = await CallesCuadrantes.findAll({
        where: {
          calle_id: id,
          estado: 1,
          deleted_at: null,
        },
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
        order: [
          ["numero_inicio", "ASC"],
          ["prioridad", "ASC"],
        ],
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
      console.error("Error al obtener relaciones por calle:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener relaciones", error));
    }
  },

  /**
   * Obtener todas las relaciones de un cuadrante específico
   */
  porCuadrante: async (req, res) => {
    try {
      const { id } = req.params;

      const relaciones = await CallesCuadrantes.porCuadrante(id);

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            relaciones,
            `${relaciones.length} calle(s) encontrada(s)`
          )
        );
    } catch (error) {
      console.error("Error al obtener relaciones por cuadrante:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener relaciones", error));
    }
  },

  /**
   * @swagger
   * /api/calles-cuadrantes/buscar-cuadrante:
   *   post:
   *     summary: Buscar cuadrante para una calle y número específico
   *     tags: [Calles-Cuadrantes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - calle_id
   *               - numero
   *             properties:
   *               calle_id:
   *                 type: integer
   *               numero:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Cuadrante encontrado
   *       404:
   *         description: No se encontró cuadrante
   */
  buscarCuadrantePorNumero: async (req, res) => {
    try {
      const { calle_id, numero } = req.body;

      if (!calle_id || !numero) {
        return res
          .status(400)
          .json(formatErrorResponse("Debe proporcionar calle_id y numero"));
      }

      // Usar método estático del modelo
      const relacion = await CallesCuadrantes.buscarCuadrantePorNumero(
        calle_id,
        parseInt(numero)
      );

      if (!relacion) {
        return res
          .status(404)
          .json(
            formatErrorResponse("No se encontró cuadrante para este número")
          );
      }

      return res.status(200).json(
        formatSuccessResponse(
          {
            cuadrante: relacion.cuadrante,
            sector: relacion.cuadrante.sector,
            relacion: {
              numero_inicio: relacion.numero_inicio,
              numero_fin: relacion.numero_fin,
              lado: relacion.lado,
            },
          },
          "Cuadrante encontrado exitosamente"
        )
      );
    } catch (error) {
      console.error("Error al buscar cuadrante:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al buscar cuadrante", error));
    }
  },
};

//============================================================================
// ALIAS PARA COMPATIBILIDAD CON RUTAS
// ============================================================================
callesCuadrantesController.buscarCuadrante =
  callesCuadrantesController.buscarCuadrantePorNumero;

// ============================================================================
// EXPORTACIÓN
// ============================================================================
export default callesCuadrantesController;
