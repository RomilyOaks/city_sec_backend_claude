/**
 * ===================================================
 * CONTROLADOR: Radios TETRA
 * ===================================================
 *
 * Ruta: src/controllers/radioTetraController.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-06
 *
 * Descripción:
 * Controlador para gestionar el CRUD de radios TETRA
 * del sistema de seguridad ciudadana.
 *
 * Funcionalidades:
 * - Listar radios con filtros (estado, asignación, búsqueda)
 * - Crear, actualizar y eliminar radios (soft delete)
 * - Asignar y desasignar radios a personal
 * - Listar radios disponibles para dropdowns
 * - Activar/desactivar radios
 *
 * @module controllers/radioTetraController
 * @requires models/RadioTetra
 * @requires models/PersonalSeguridad
 * @version 1.0.0
 * @date 2026-01-06
 */

import RadioTetra from "../models/RadioTetra.js";
import PersonalSeguridad from "../models/PersonalSeguridad.js";
import { Op } from "sequelize";
import { IS_POSTGRES } from "../config/database.js";
import {
  formatResponse,
  formatErrorResponse,
} from "../utils/responseFormatter.js";

const radioTetraController = {
  /**
   * =====================================================
   * GET /api/radios-tetra
   * =====================================================
   * Listar todos los radios con filtros y paginación
   *
   * Query params:
   * - page: número de página (default: 1)
   * - limit: registros por página (default: 10)
   * - search: búsqueda por código o descripción
   * - estado: filtrar por estado (true/false)
   * - asignado: filtrar por asignación (true/false/all)
   * - personal_seguridad_id: filtrar por personal específico
   */
  getAllRadios: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        estado,
        asignado,
        personal_seguridad_id,
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Construir condiciones de búsqueda
      const whereConditions = {};

      // Filtro por búsqueda (código o descripción)
      if (search) {
        whereConditions[Op.or] = [
          { radio_tetra_code: { [IS_POSTGRES ? Op.iLike : Op.like]: `%${search}%` } },
          { descripcion: { [IS_POSTGRES ? Op.iLike : Op.like]: `%${search}%` } },
        ];
      }

      // Filtro por estado
      if (estado !== undefined && estado !== "") {
        whereConditions.estado = estado === "true";
      }

      // Filtro por asignación
      if (asignado === "true") {
        whereConditions.personal_seguridad_id = { [Op.ne]: null };
      } else if (asignado === "false") {
        whereConditions.personal_seguridad_id = null;
      }

      // Filtro por personal específico
      if (personal_seguridad_id) {
        whereConditions.personal_seguridad_id = personal_seguridad_id;
      }

      // Consultar radios con información del personal asignado
      const { count, rows: radios } = await RadioTetra.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: PersonalSeguridad,
            as: "personalAsignado",
            attributes: [
              "id",
              "doc_tipo",
              "doc_numero",
              "nombres",
              "apellido_paterno",
              "apellido_materno",
            ],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["radio_tetra_code", "ASC"]],
        distinct: true,
      });

      return res.status(200).json(
        formatResponse(
          true,
          "Radios TETRA obtenidos exitosamente",
          {
            radios,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(count / parseInt(limit)),
              totalItems: count,
              itemsPerPage: parseInt(limit),
            },
          }
        )
      );
    } catch (error) {
      console.error("Error al obtener radios TETRA:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener radios TETRA", error));
    }
  },

  /**
   * =====================================================
   * GET /api/radios-tetra/disponibles
   * =====================================================
   * Listar radios disponibles (sin asignar y activos)
   * Para usar en dropdowns del frontend
   */
  getRadiosDisponibles: async (req, res) => {
    try {
      const radios = await RadioTetra.findDisponibles();

      return res.status(200).json(
        formatResponse(
          true,
          "Radios disponibles obtenidos exitosamente",
          {
            radios,
            total: radios.length,
          }
        )
      );
    } catch (error) {
      return res
        .status(500)
        .json(
          formatErrorResponse("Error al obtener radios disponibles", error)
        );
    }
  },

  /**
   * =====================================================
   * GET /api/radios-tetra/para-dropdown
   * =====================================================
   * Listar todos los radios activos para dropdown con precarga
   * Incluye personal_seguridad_id para identificar radios ya asignados
   *
   * Uso en Frontend:
   * - Cargar este endpoint al abrir panel de edición
   * - Buscar en la lista si conductor_id o copiloto_id coincide con personal_seguridad_id
   * - Si coincide, preseleccionar ese radio en el dropdown
   */
  getRadiosParaDropdown: async (req, res) => {
    try {
      const radios = await RadioTetra.findAll({
        where: {
          estado: true,
          deleted_at: null,
        },
        include: [
          {
            model: PersonalSeguridad,
            as: "personalAsignado",
            attributes: [
              "id",
              "doc_tipo",
              "doc_numero",
              "nombres",
              "apellido_paterno",
              "apellido_materno",
            ],
            required: false,
          },
        ],
        attributes: ["id", "radio_tetra_code", "descripcion", "personal_seguridad_id", "estado"],
        order: [["radio_tetra_code", "ASC"]],
      });

      // Separar en disponibles y asignados para facilitar al frontend
      const disponibles = radios.filter(r => !r.personal_seguridad_id);
      const asignados = radios.filter(r => r.personal_seguridad_id);

      return res.status(200).json(
        formatResponse(
          true,
          "Radios para dropdown obtenidos exitosamente",
          {
            radios,
            resumen: {
              total: radios.length,
              disponibles: disponibles.length,
              asignados: asignados.length,
            },
            // Helper para frontend: buscar radio por personal_id
            // Frontend puede usar: radios.find(r => r.personal_seguridad_id === conductorId)
          }
        )
      );
    } catch (error) {
      console.error("Error al obtener radios para dropdown:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener radios para dropdown", error));
    }
  },

  /**
   * =====================================================
   * GET /api/radios-tetra/:id
   * =====================================================
   * Obtener un radio por su ID
   */
  getRadioById: async (req, res) => {
    try {
      const { id } = req.params;

      const radio = await RadioTetra.findByPk(id, {
        include: [
          {
            model: PersonalSeguridad,
            as: "personalAsignado",
            attributes: [
              "id",
              "doc_tipo",
              "doc_numero",
              "nombres",
              "apellido_paterno",
              "apellido_materno",
            ],
          },
        ],
      });

      if (!radio) {
        return res
          .status(404)
          .json(formatErrorResponse("Radio TETRA no encontrado"));
      }

      return res.status(200).json(
        formatResponse(
          true,
          "Radio TETRA obtenido exitosamente",
          { radio }
        )
      );
    } catch (error) {
      console.error("Error al obtener radio TETRA:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al obtener radio TETRA", error));
    }
  },

  /**
   * =====================================================
   * POST /api/radios-tetra
   * =====================================================
   * Crear un nuevo radio TETRA
   *
   * Body:
   * - radio_tetra_code: string (10 chars)
   * - descripcion: string (50 chars, opcional)
   * - personal_seguridad_id: integer (opcional)
   * - fecha_fabricacion: date (opcional)
   * - estado: boolean (default: true)
   */
  createRadio: async (req, res) => {
    try {
      const {
        radio_tetra_code,
        descripcion,
        personal_seguridad_id,
        fecha_fabricacion,
        estado = true,
      } = req.body;

      // Verificar que el código no exista
      if (radio_tetra_code) {
        const existente = await RadioTetra.findByCode(radio_tetra_code);
        if (existente) {
          return res
            .status(400)
            .json(
              formatErrorResponse(
                `Ya existe un radio con el código ${radio_tetra_code}`
              )
            );
        }
      }

      // Verificar que el personal existe (si se proporciona)
      if (personal_seguridad_id) {
        const personal = await PersonalSeguridad.findByPk(
          personal_seguridad_id
        );
        if (!personal) {
          return res
            .status(404)
            .json(formatErrorResponse("Personal de seguridad no encontrado"));
        }
      }

      // Crear el radio
      const nuevoRadio = await RadioTetra.create({
        radio_tetra_code,
        descripcion,
        personal_seguridad_id,
        fecha_fabricacion,
        estado,
        created_by: req.user?.id || null,
        updated_by: req.user?.id || null,
      });

      // Cargar con relaciones para la respuesta
      const radioCreado = await RadioTetra.findByPk(nuevoRadio.id, {
        include: [
          {
            model: PersonalSeguridad,
            as: "personalAsignado",
            attributes: [
              "id",
              "doc_tipo",
              "doc_numero",
              "nombres",
              "apellido_paterno",
              "apellido_materno",
            ],
          },
        ],
      });

      console.log(`✅ Radio TETRA creado: ${radio_tetra_code}`);

      return res.status(201).json(
        formatResponse(
          true,
          "Radio TETRA creado exitosamente",
          {
            radio: radioCreado,
          }
        )
      );
    } catch (error) {
      console.error("Error al crear radio TETRA:", error);

      // Manejar errores de validación de Sequelize
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json(
          formatErrorResponse("Error de validación", {
            errors: error.errors.map((e) => ({
              field: e.path,
              message: e.message,
            })),
          })
        );
      }

      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json(formatErrorResponse("El código de radio ya existe"));
      }

      return res
        .status(500)
        .json(formatErrorResponse("Error al crear radio TETRA", error));
    }
  },

  /**
   * =====================================================
   * PUT /api/radios-tetra/:id
   * =====================================================
   * Actualizar un radio TETRA existente
   */
  updateRadio: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        radio_tetra_code,
        descripcion,
        personal_seguridad_id,
        fecha_fabricacion,
        estado,
      } = req.body;

      const radio = await RadioTetra.findByPk(id);

      if (!radio) {
        return res
          .status(404)
          .json(formatErrorResponse("Radio TETRA no encontrado"));
      }

      // Verificar código único (si se está cambiando)
      if (radio_tetra_code && radio_tetra_code !== radio.radio_tetra_code) {
        const existente = await RadioTetra.findByCode(radio_tetra_code);
        if (existente) {
          return res
            .status(400)
            .json(
              formatErrorResponse(
                `Ya existe un radio con el código ${radio_tetra_code}`
              )
            );
        }
      }

      // Verificar que el personal existe (si se proporciona)
      if (
        personal_seguridad_id !== undefined &&
        personal_seguridad_id !== null
      ) {
        const personal = await PersonalSeguridad.findByPk(
          personal_seguridad_id
        );
        if (!personal) {
          return res
            .status(404)
            .json(formatErrorResponse("Personal de seguridad no encontrado"));
        }
      }

      // Actualizar campos
      await radio.update({
        ...(radio_tetra_code !== undefined && { radio_tetra_code }),
        ...(descripcion !== undefined && { descripcion }),
        ...(personal_seguridad_id !== undefined && { personal_seguridad_id }),
        ...(fecha_fabricacion !== undefined && { fecha_fabricacion }),
        ...(estado !== undefined && { estado }),
        updated_by: req.user?.id || null,
      });

      // Cargar con relaciones para la respuesta
      const radioActualizado = await RadioTetra.findByPk(id, {
        include: [
          {
            model: PersonalSeguridad,
            as: "personalAsignado",
            attributes: [
              "id",
              "doc_tipo",
              "doc_numero",
              "nombres",
              "apellido_paterno",
              "apellido_materno",
            ],
          },
        ],
      });

      console.log(`✅ Radio TETRA actualizado: ${radio.radio_tetra_code}`);

      return res.status(200).json(
        formatResponse(
          true,
          "Radio TETRA actualizado exitosamente",
          {
            radio: radioActualizado,
          }
        )
      );
    } catch (error) {
      console.error("Error al actualizar radio TETRA:", error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json(
          formatErrorResponse("Error de validación", {
            errors: error.errors.map((e) => ({
              field: e.path,
              message: e.message,
            })),
          })
        );
      }

      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json(formatErrorResponse("El código de radio ya existe"));
      }

      return res
        .status(500)
        .json(formatErrorResponse("Error al actualizar radio TETRA", error));
    }
  },

  /**
   * =====================================================
   * DELETE /api/radios-tetra/:id
   * =====================================================
   * Eliminar un radio TETRA (soft delete)
   */
  deleteRadio: async (req, res) => {
    try {
      const { id } = req.params;

      const radio = await RadioTetra.findByPk(id);

      if (!radio) {
        return res
          .status(404)
          .json(formatErrorResponse("Radio TETRA no encontrado"));
      }

      // Soft delete con auditoría
      await radio.softDelete(req.user?.id || null);

      console.log(`🗑️ Radio TETRA eliminado: ${radio.radio_tetra_code}`);

      return res
        .status(200)
        .json(formatResponse(true, "Radio TETRA eliminado exitosamente"));
    } catch (error) {
      console.error("Error al eliminar radio TETRA:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al eliminar radio TETRA", error));
    }
  },

  /**
   * =====================================================
   * PATCH /api/radios-tetra/:id/asignar
   * =====================================================
   * Asignar un radio a personal de seguridad
   *
   * Body:
   * - personal_seguridad_id: integer (required)
   */
  asignarAPersonal: async (req, res) => {
    try {
      const { id } = req.params;
      const { personal_seguridad_id } = req.body;

      if (!personal_seguridad_id) {
        return res
          .status(400)
          .json(
            formatErrorResponse("Se requiere el ID del personal de seguridad")
          );
      }

      const radio = await RadioTetra.findByPk(id);

      if (!radio) {
        return res
          .status(404)
          .json(formatErrorResponse("Radio TETRA no encontrado"));
      }

      // Verificar que el personal existe
      const personal = await PersonalSeguridad.findByPk(personal_seguridad_id);
      if (!personal) {
        return res
          .status(404)
          .json(formatErrorResponse("Personal de seguridad no encontrado"));
      }

      // Verificar que el radio esté disponible
      if (radio.personal_seguridad_id) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "El radio ya está asignado a otro personal. Desasígnelo primero."
            )
          );
      }

      // Verificar que el radio esté activo
      if (!radio.estado) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "No se puede asignar un radio inactivo. Actívelo primero."
            )
          );
      }

      // Asignar
      await radio.asignarAPersonal(personal_seguridad_id, req.user?.id || null);

      // Cargar con relaciones para la respuesta
      const radioActualizado = await RadioTetra.findByPk(id, {
        include: [
          {
            model: PersonalSeguridad,
            as: "personalAsignado",
            attributes: [
              "id",
              "doc_tipo",
              "doc_numero",
              "nombres",
              "apellido_paterno",
              "apellido_materno",
            ],
          },
        ],
      });

      console.log(
        `📻 Radio ${radio.radio_tetra_code} asignado a ${personal.nombres} ${personal.apellido_paterno}`
      );

      return res.status(200).json(
        formatResponse(
          true,
          "Radio asignado exitosamente",
          {
            radio: radioActualizado,
          }
        )
      );
    } catch (error) {
      console.error("Error al asignar radio:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al asignar radio", error));
    }
  },

  /**
   * =====================================================
   * PATCH /api/radios-tetra/:id/desasignar
   * =====================================================
   * Desasignar un radio (liberar para reasignación)
   */
  desasignarRadio: async (req, res) => {
    try {
      const { id } = req.params;

      const radio = await RadioTetra.findByPk(id);

      if (!radio) {
        return res
          .status(404)
          .json(formatErrorResponse("Radio TETRA no encontrado"));
      }

      // Verificar que el radio esté asignado
      if (!radio.personal_seguridad_id) {
        return res
          .status(400)
          .json(
            formatErrorResponse("El radio no está asignado a ningún personal")
          );
      }

      // Desasignar
      await radio.desasignar(req.user?.id || null);

      // Cargar para la respuesta
      const radioActualizado = await RadioTetra.findByPk(id);

      console.log(`📻 Radio ${radio.radio_tetra_code} desasignado`);

      return res.status(200).json(
        formatResponse(
          true,
          "Radio desasignado exitosamente",
          {
            radio: radioActualizado,
          }
        )
      );
    } catch (error) {
      console.error("Error al desasignar radio:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al desasignar radio", error));
    }
  },

  /**
   * =====================================================
   * PATCH /api/radios-tetra/:id/activar
   * =====================================================
   * Activar un radio
   */
  activarRadio: async (req, res) => {
    try {
      const { id } = req.params;

      const radio = await RadioTetra.findByPk(id);

      if (!radio) {
        return res
          .status(404)
          .json(formatErrorResponse("Radio TETRA no encontrado"));
      }

      if (radio.estado) {
        return res
          .status(400)
          .json(formatErrorResponse("El radio ya está activo"));
      }

      await radio.activar(req.user?.id || null);

      console.log(`✅ Radio ${radio.radio_tetra_code} activado`);

      return res.status(200).json(
        formatResponse(
          true,
          "Radio activado exitosamente",
          {
            radio: await RadioTetra.findByPk(id),
          }
        )
      );
    } catch (error) {
      console.error("Error al activar radio:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al activar radio", error));
    }
  },

  /**
   * =====================================================
   * PATCH /api/radios-tetra/:id/desactivar
   * =====================================================
   * Desactivar un radio
   */
  desactivarRadio: async (req, res) => {
    try {
      const { id } = req.params;

      const radio = await RadioTetra.findByPk(id);

      if (!radio) {
        return res
          .status(404)
          .json(formatErrorResponse("Radio TETRA no encontrado"));
      }

      if (!radio.estado) {
        return res
          .status(400)
          .json(formatErrorResponse("El radio ya está inactivo"));
      }

      // Verificar que no esté asignado
      if (radio.personal_seguridad_id) {
        return res
          .status(400)
          .json(
            formatErrorResponse(
              "No se puede desactivar un radio asignado. Desasígnelo primero."
            )
          );
      }

      await radio.desactivar(req.user?.id || null);

      console.log(`⏸️ Radio ${radio.radio_tetra_code} desactivado`);

      return res.status(200).json(
        formatResponse(
          true,
          "Radio desactivado exitosamente",
          {
            radio: await RadioTetra.findByPk(id),
          }
        )
      );
    } catch (error) {
      console.error("Error al desactivar radio:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error al desactivar radio", error));
    }
  },
};

export default radioTetraController;
