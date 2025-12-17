/**
 * ===================================================
 * CONTROLADOR: Unidades/Oficinas
 * ===================================================
 *
 * Ruta: src/controllers/unidadOficinaController.js
 *
 * VERSIÓN: 1.0.1 (CORREGIDO - ALINEADO CON BD)
 * FECHA: 2025-12-15
 *
 * Descripción:
 * Controlador para gestión de unidades operativas que atienden novedades
 * (Serenazgo, PNP, Bomberos, Ambulancia, Defensa Civil, Tránsito, Otros)
 *
 * @module controllers/unidadOficinaController
 * @version 1.0.1
 */

import { UnidadOficina, Ubigeo } from "../models/index.js";
import { Op } from "sequelize";

// ==========================================
// LISTAR UNIDADES (GET /)
// ==========================================

const getAll = async (req, res) => {
  try {
    const { tipo_unidad, estado, activo_24h, ubigeo, search } = req.query;

    const whereClause = { deleted_at: null };

    // Filtro por tipo de unidad
    if (tipo_unidad) {
      whereClause.tipo_unidad = tipo_unidad;
    }

    // Filtro por estado activo/inactivo
    if (estado !== undefined) {
      whereClause.estado = estado === "true" || estado === "1";
    }

    // Filtro por operación 24h
    if (activo_24h !== undefined) {
      whereClause.activo_24h = activo_24h === "true" || activo_24h === "1";
    }

    // Filtro por ubigeo
    if (ubigeo) {
      whereClause.ubigeo = ubigeo;
    }

    // Búsqueda por nombre o código
    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { codigo: { [Op.like]: `%${search}%` } },
      ];
    }

    const items = await UnidadOficina.findAll({
      where: whereClause,
      include: [
        {
          model: Ubigeo,
          as: "unidadOficinaUbigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
      ],
      order: [
        ["tipo_unidad", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error en getAll unidades:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener unidades/oficinas",
      error: error.message,
    });
  }
};

// ==========================================
// OBTENER POR ID (GET /:id)
// ==========================================

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await UnidadOficina.findOne({
      where: { id, deleted_at: null },
      include: [
        {
          model: Ubigeo,
          as: "unidadOficinaUbigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Unidad/oficina no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error en getById unidad:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener unidad/oficina",
      error: error.message,
    });
  }
};

// ==========================================
// CREAR (POST /)
// ==========================================

const create = async (req, res) => {
  try {
    const {
      nombre,
      tipo_unidad,
      codigo,
      ubigeo,
      direccion,
      telefono,
      email,
      latitud,
      longitud,
      radio_cobertura_km,
      activo_24h,
      horario_inicio,
      horario_fin,
    } = req.body;

    // Validar nombre duplicado
    const nombreExistente = await UnidadOficina.findOne({
      where: { nombre: nombre, deleted_at: null },
    });

    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una unidad con el nombre "${nombre}"`,
      });
    }

    // Validar código duplicado (si se proporciona)
    if (codigo) {
      const codigoExistente = await UnidadOficina.findOne({
        where: { codigo: codigo, deleted_at: null },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una unidad con el código "${codigo}"`,
        });
      }
    }

    // Validar ubigeo (si se proporciona)
    if (ubigeo) {
      const ubigeoExiste = await Ubigeo.findOne({
        where: { ubigeo_code: ubigeo },
      });

      if (!ubigeoExiste) {
        return res.status(404).json({
          success: false,
          message: `El código de ubigeo "${ubigeo}" no existe`,
        });
      }
    }

    // Validar horarios si no opera 24h
    if (activo_24h === false && (!horario_inicio || !horario_fin)) {
      return res.status(400).json({
        success: false,
        message:
          "Si la unidad no opera 24h, debe especificar horario_inicio y horario_fin",
      });
    }

    // Crear unidad
    const nuevo = await UnidadOficina.create({
      nombre,
      tipo_unidad,
      codigo: codigo ? codigo.toUpperCase() : null,
      ubigeo,
      direccion,
      telefono,
      email,
      latitud,
      longitud,
      radio_cobertura_km,
      activo_24h: activo_24h !== undefined ? activo_24h : true,
      horario_inicio,
      horario_fin,
      created_by: req.user.id,
    });

    // Obtener unidad completa con relación
    const unidadCompleta = await UnidadOficina.findByPk(nuevo.id, {
      include: [
        {
          model: Ubigeo,
          as: "unidadOficinaUbigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Unidad/oficina creada exitosamente",
      data: unidadCompleta,
    });
  } catch (error) {
    console.error("Error en create unidad:", error);

    // Manejar error de unique constraint de Sequelize
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path || "campo";
      const value = error.errors[0]?.value || "";
      return res.status(400).json({
        success: false,
        message: `Ya existe una unidad con este ${field}: "${value}"`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear unidad/oficina",
      error: error.message,
    });
  }
};

// ==========================================
// ACTUALIZAR (PUT /:id)
// ==========================================

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const item = await UnidadOficina.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Unidad/oficina no encontrada",
      });
    }

    // Validar nombre duplicado si cambió
    if (
      datosActualizacion.nombre &&
      datosActualizacion.nombre !== item.nombre
    ) {
      const nombreExistente = await UnidadOficina.findOne({
        where: {
          nombre: datosActualizacion.nombre,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: `Ya existe otra unidad con el nombre "${datosActualizacion.nombre}"`,
        });
      }
    }

    // Validar código duplicado si cambió
    if (
      datosActualizacion.codigo &&
      datosActualizacion.codigo !== item.codigo
    ) {
      const codigoExistente = await UnidadOficina.findOne({
        where: {
          codigo: datosActualizacion.codigo,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: `Ya existe otra unidad con el código "${datosActualizacion.codigo}"`,
        });
      }
    }

    // Validar ubigeo si se está actualizando
    if (
      datosActualizacion.ubigeo &&
      datosActualizacion.ubigeo !== item.ubigeo
    ) {
      const ubigeoExiste = await Ubigeo.findOne({
        where: { ubigeo_code: datosActualizacion.ubigeo },
      });

      if (!ubigeoExiste) {
        return res.status(404).json({
          success: false,
          message: `El código de ubigeo "${datosActualizacion.ubigeo}" no existe`,
        });
      }
    }

    // Validar horarios si se cambia activo_24h a false
    const nuevoActivo24h =
      datosActualizacion.activo_24h !== undefined
        ? datosActualizacion.activo_24h
        : item.activo_24h;

    if (nuevoActivo24h === false) {
      const horarioInicio =
        datosActualizacion.horario_inicio || item.horario_inicio;
      const horarioFin = datosActualizacion.horario_fin || item.horario_fin;

      if (!horarioInicio || !horarioFin) {
        return res.status(400).json({
          success: false,
          message:
            "Si la unidad no opera 24h, debe especificar horario_inicio y horario_fin",
        });
      }
    }

    // Normalizar código a mayúsculas si viene
    if (datosActualizacion.codigo) {
      datosActualizacion.codigo = datosActualizacion.codigo.toUpperCase();
    }

    // Actualizar
    await item.update({
      ...datosActualizacion,
      updated_by: req.user.id,
    });

    // Obtener unidad actualizada con relaciones
    const unidadActualizada = await UnidadOficina.findByPk(id, {
      include: [
        {
          model: Ubigeo,
          as: "unidadOficinaUbigeo",
          attributes: ["ubigeo_code", "departamento", "provincia", "distrito"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Unidad/oficina actualizada exitosamente",
      data: unidadActualizada,
    });
  } catch (error) {
    console.error("Error en update unidad:", error);

    // Manejar error de unique constraint de Sequelize
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path || "campo";
      const value = error.errors[0]?.value || "";
      return res.status(400).json({
        success: false,
        message: `Ya existe una unidad con este ${field}: "${value}"`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar unidad/oficina",
      error: error.message,
    });
  }
};

// ==========================================
// ELIMINAR (DELETE /:id)
// ==========================================

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await UnidadOficina.findOne({
      where: { id, deleted_at: null },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Unidad/oficina no encontrada",
      });
    }

    // Verificar si tiene novedades asociadas
    const { Novedad } = await import("../models/index.js");
    const tieneNovedades = await Novedad.count({
      where: {
        unidad_oficina_id: id,
        deleted_at: null,
      },
    });

    if (tieneNovedades > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar. Tiene novedades asociadas a esta unidad",
      });
    }

    // Soft delete
    await item.update({
      estado: false,
      deleted_at: new Date(),
      deleted_by: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Unidad/oficina eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en remove unidad:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar unidad/oficina",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTAR
// ==========================================

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
