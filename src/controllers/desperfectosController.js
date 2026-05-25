import HistorialDesperfectosVehiculo from "../models/HistorialDesperfectosVehiculo.js";
import CatalogoDesperfectos from "../models/CatalogoDesperfectos.js";
import MantenimientoVehiculo from "../models/MantenimientoVehiculo.js";
import Vehiculo from "../models/Vehiculo.js";

/**
 * GET /api/v1/vehiculos/:id/desperfectos
 * Lista el historial de desperfectos de un vehículo
 */
export const getDesperfectosByVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, estado } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const vehiculo = await Vehiculo.findByPk(id, { attributes: ["id", "placa", "descripcion"] });
    if (!vehiculo) {
      return res.status(404).json({ success: false, message: "Vehículo no encontrado" });
    }

    const where = { vehiculo_id: id };
    if (estado) where.estado = estado;

    const { count, rows } = await HistorialDesperfectosVehiculo.findAndCountAll({
      where,
      include: [
        { model: CatalogoDesperfectos, as: "desperfecto", attributes: ["id", "nombre", "categoria"] },
        { model: MantenimientoVehiculo, as: "mantenimiento", attributes: ["id", "fecha_inicio", "descripcion"], required: false },
      ],
      order: [["fecha_reporte", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        vehiculo,
        desperfectos: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en getDesperfectosByVehiculo:", error);
    res.status(500).json({ success: false, message: "Error al obtener historial de desperfectos" });
  }
};

/**
 * GET /api/v1/catalogo-desperfectos
 * Lista el catálogo de tipos de desperfectos
 */
export const getCatalogoDesperfectos = async (req, res) => {
  try {
    const items = await CatalogoDesperfectos.findAll({
      where: { activo: true },
      order: [["categoria", "ASC"], ["nombre", "ASC"]],
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("❌ Error en getCatalogoDesperfectos:", error);
    res.status(500).json({ success: false, message: "Error al obtener catálogo de desperfectos" });
  }
};
