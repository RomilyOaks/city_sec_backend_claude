/**
 * ============================================
 * CONTROLADOR: src/controllers/auditoriaController.js
 * ============================================
 *
 * Controlador de Auditoría
 * Gestiona consultas y reportes de auditoría
 * Actualizado para usar AuditoriaAccion
 */

import { AuditoriaAccion, Usuario } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Obtener registros de auditoría con filtros
 * @route GET /api/auditoria
 */
const getAuditorias = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      usuario_id,
      accion,
      entidad_tipo,
      modulo,
      severidad,
      resultado,
      page = 1,
      limit = 50,
    } = req.query;

    // Construir filtros
    const whereClause = {};

    if (fecha_inicio && fecha_fin) {
      whereClause.created_at = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    if (usuario_id) {
      whereClause.usuario_id = usuario_id;
    }

    if (accion) {
      whereClause.accion = accion;
    }

    if (entidad_tipo) {
      whereClause.entidad_tipo = entidad_tipo;
    }

    if (modulo) {
      whereClause.modulo = modulo;
    }

    if (severidad) {
      whereClause.severidad = severidad;
    }

    if (resultado) {
      whereClause.resultado = resultado;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditoriaAccion.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "username", "email", "nombres", "apellidos"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener auditorías:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener registros de auditoría",
      error: error.message,
    });
  }
};

/**
 * Obtener un registro de auditoría por ID
 * @route GET /api/auditoria/:id
 */
const getAuditoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditoria = await AuditoriaAccion.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "username", "email", "nombres", "apellidos"],
        },
      ],
    });

    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: "Registro de auditoría no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: auditoria,
    });
  } catch (error) {
    console.error("Error al obtener auditoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el registro de auditoría",
      error: error.message,
    });
  }
};

/**
 * Obtener historial de auditoría de una entidad específica
 * @route GET /api/auditoria/entidad/:entidad_tipo/:id
 */
const getHistorialEntidad = async (req, res) => {
  try {
    const { entidad_tipo, id } = req.params;

    const historial = await AuditoriaAccion.findAll({
      where: {
        entidad_tipo,
        entidad_id: id,
      },
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: historial,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial de la entidad",
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de auditoría
 * @route GET /api/auditoria/stats
 */
const getEstadisticas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const whereClause = {};

    if (fecha_inicio && fecha_fin) {
      whereClause.created_at = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    } else {
      // Por defecto, últimos 30 días
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      whereClause.created_at = {
        [Op.gte]: hace30Dias,
      };
    }

    // Acciones por tipo
    const accionesPorTipo = await AuditoriaAccion.findAll({
      where: whereClause,
      attributes: [
        "accion",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["accion"],
      raw: true,
    });

    // Acciones por severidad
    const accionesPorSeveridad = await AuditoriaAccion.findAll({
      where: whereClause,
      attributes: [
        "severidad",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["severidad"],
      raw: true,
    });

    // Acciones por resultado
    const accionesPorResultado = await AuditoriaAccion.findAll({
      where: whereClause,
      attributes: [
        "resultado",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["resultado"],
      raw: true,
    });

    // Usuarios más activos
    const usuariosMasActivos = await AuditoriaAccion.findAll({
      where: whereClause,
      attributes: [
        "usuario_id",
        [
          sequelize.fn("COUNT", sequelize.col("AuditoriaAccion.id")),
          "cantidad",
        ],
      ],
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["username", "email", "nombres", "apellidos"],
        },
      ],
      group: ["usuario_id", "usuario.id"],
      order: [
        [sequelize.fn("COUNT", sequelize.col("AuditoriaAccion.id")), "DESC"],
      ],
      limit: 10,
      raw: false,
    });

    // Módulos más utilizados
    const modulosMasUtilizados = await AuditoriaAccion.findAll({
      where: whereClause,
      attributes: [
        "modulo",
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["modulo"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 10,
      raw: true,
    });

    // Total de acciones
    const totalAcciones = await AuditoriaAccion.count({ where: whereClause });

    // Acciones fallidas
    const accionesFallidas = await AuditoriaAccion.count({
      where: {
        ...whereClause,
        resultado: "FALLO",
      },
    });

    // Acciones denegadas
    const accionesDenegadas = await AuditoriaAccion.count({
      where: {
        ...whereClause,
        resultado: "DENEGADO",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalAcciones,
        accionesFallidas,
        accionesDenegadas,
        tasaExito:
          totalAcciones > 0
            ? (
                ((totalAcciones - accionesFallidas - accionesDenegadas) /
                  totalAcciones) *
                100
              ).toFixed(2)
            : 0,
        accionesPorTipo,
        accionesPorSeveridad,
        accionesPorResultado,
        usuariosMasActivos,
        modulosMasUtilizados,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de auditoría",
      error: error.message,
    });
  }
};

/**
 * Obtener actividad reciente del usuario actual
 * @route GET /api/auditoria/mi-actividad
 */
const getMiActividad = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const actividad = await AuditoriaAccion.findAll({
      where: {
        usuario_id: req.user.id,
      },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: actividad,
    });
  } catch (error) {
    console.error("Error al obtener mi actividad:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tu actividad",
      error: error.message,
    });
  }
};

/**
 * Exportar auditoría a CSV
 * @route GET /api/auditoria/export/csv
 */
const exportarCSV = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, usuario_id, accion } = req.query;

    const whereClause = {};

    if (fecha_inicio && fecha_fin) {
      whereClause.created_at = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    if (usuario_id) whereClause.usuario_id = usuario_id;
    if (accion) whereClause.accion = accion;

    const auditorias = await AuditoriaAccion.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["username", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 10000, // Límite de seguridad
    });

    // Generar CSV
    let csv =
      "ID,Fecha,Usuario,Acción,Módulo,Entidad,Descripción,Severidad,Resultado,IP\n";

    auditorias.forEach((audit) => {
      csv += `${audit.id},"${audit.created_at}","${
        audit.usuario?.username || "Sistema"
      }","${audit.accion}","${audit.modulo || ""}","${audit.entidad_tipo}","${
        audit.descripcion || ""
      }","${audit.severidad}","${audit.resultado}","${
        audit.ip_address || ""
      }"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=auditoria_${Date.now()}.csv`
    );
    res.status(200).send("\uFEFF" + csv); // BOM para Excel
  } catch (error) {
    console.error("Error al exportar auditoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al exportar auditoría",
      error: error.message,
    });
  }
};

export default {
  getAuditorias,
  getAuditoriaById,
  getHistorialEntidad,
  getEstadisticas,
  getMiActividad,
  exportarCSV,
};
