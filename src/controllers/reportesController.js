import { Op, fn, col } from "sequelize";
import { MantenimientoVehiculo, Vehiculo, Taller, UnidadOficina } from "../models/index.js";

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  // Invalid date -> NaN
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

export const getVehiculosEnMantenimiento = async (req, res) => {
  try {
    const {
      estado_mantenimiento,
      taller_id,
      unidad_oficina_id,
      vehiculo_id,
      fecha_inicio,
      fecha_fin,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {
      estado: 1,
      deleted_at: null,
    };

    // Por defecto, “en mantenimiento” = programado/en taller/en proceso
    if (estado_mantenimiento) {
      where.estado_mantenimiento = estado_mantenimiento;
    } else {
      where.estado_mantenimiento = {
        [Op.in]: ["PROGRAMADO", "EN_TALLER", "EN_PROCESO"],
      };
    }

    if (taller_id) where.taller_id = taller_id;
    if (unidad_oficina_id) where.unidad_oficina_id = unidad_oficina_id;
    if (vehiculo_id) where.vehiculo_id = vehiculo_id;

    const start = parseDate(fecha_inicio);
    const end = parseDate(fecha_fin);

    if (start && end) {
      // Preferimos filtrar por rango de inicio
      where.fecha_inicio = { [Op.between]: [start, end] };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await MantenimientoVehiculo.findAndCountAll({
      where,
      include: [
        {
          model: Vehiculo,
          as: "vehiculo",
        },
        {
          model: Taller,
          as: "taller",
        },
        {
          model: UnidadOficina,
          as: "unidadOficina",
        },
      ],
      order: [["updated_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      message: "Reporte: vehículos en mantenimiento",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error en getVehiculosEnMantenimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar reporte de vehículos en mantenimiento",
      error: error.message,
    });
  }
};

export const getCostosMantenimiento = async (req, res) => {
  try {
    const {
      taller_id,
      unidad_oficina_id,
      vehiculo_id,
      fecha_inicio,
      fecha_fin,
      group_by = "mes",
    } = req.query;

    const where = {
      estado: 1,
      deleted_at: null,
      estado_mantenimiento: "FINALIZADO",
    };

    if (taller_id) where.taller_id = taller_id;
    if (unidad_oficina_id) where.unidad_oficina_id = unidad_oficina_id;
    if (vehiculo_id) where.vehiculo_id = vehiculo_id;

    const start = parseDate(fecha_inicio);
    const end = parseDate(fecha_fin);

    if (start && end) {
      where.fecha_fin = { [Op.between]: [start, end] };
    }

    // Nota: DATE_FORMAT es MySQL/MariaDB. Si se migra a Postgres, se cambia a TO_CHAR.
    const mesExpr = fn("DATE_FORMAT", col("fecha_fin"), "%Y-%m");

    const group = [];
    const attributes = [
      [fn("COUNT", col("MantenimientoVehiculo.id")), "cantidad_mantenimientos"],
      [
        fn(
          "COALESCE",
          fn("SUM", col("MantenimientoVehiculo.costo_total")),
          0
        ),
        "costo_total",
      ],
    ];

    const include = [];

    if (group_by === "mes") {
      attributes.unshift([mesExpr, "mes"]);
      group.push(mesExpr);
    }

    if (group_by === "vehiculo") {
      attributes.unshift([col("MantenimientoVehiculo.vehiculo_id"), "vehiculo_id"]);
      include.push({ model: Vehiculo, as: "vehiculo" });
      group.push(col("MantenimientoVehiculo.vehiculo_id"));
    }

    if (group_by === "taller") {
      attributes.unshift([col("MantenimientoVehiculo.taller_id"), "taller_id"]);
      include.push({ model: Taller, as: "taller" });
      group.push(col("MantenimientoVehiculo.taller_id"));
    }

    if (group_by === "unidad") {
      attributes.unshift([
        col("MantenimientoVehiculo.unidad_oficina_id"),
        "unidad_oficina_id",
      ]);
      include.push({ model: UnidadOficina, as: "unidadOficina" });
      group.push(col("MantenimientoVehiculo.unidad_oficina_id"));
    }

    // Si se desea agrupar también por mes + entidad, se puede extender;
    // por ahora, agrupación única según group_by.

    const order =
      group_by === "mes"
        ? [[mesExpr, "ASC"]]
        : [[fn("SUM", col("MantenimientoVehiculo.costo_total")), "DESC"]];

    const rows = await MantenimientoVehiculo.findAll({
      where,
      attributes,
      include,
      group,
      order,
      raw: false,
    });

    // Totales globales del filtro
    const totales = await MantenimientoVehiculo.findOne({
      where,
      attributes: [
        [fn("COUNT", col("MantenimientoVehiculo.id")), "cantidad_mantenimientos"],
        [
          fn(
            "COALESCE",
            fn("SUM", col("MantenimientoVehiculo.costo_total")),
            0
          ),
          "costo_total",
        ],
      ],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: "Reporte: costos de mantenimiento",
      group_by,
      totales,
      data: rows,
    });
  } catch (error) {
    console.error("❌ Error en getCostosMantenimiento:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar reporte de costos de mantenimiento",
      error: error.message,
    });
  }
};

export default {
  getVehiculosEnMantenimiento,
  getCostosMantenimiento,
};
