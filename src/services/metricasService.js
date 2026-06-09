import { Op } from "sequelize";
import models from "../models/index.js";
import logger from "../utils/logger.js";

const { Suscripcion, Plan, MetricasUso, TokenAcceso } = models;

function periodoToRango(periodo) {
  const [year, month] = periodo.split("-").map(Number);
  const inicio = new Date(Date.UTC(year, month - 1, 1));
  const fin = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { inicio, fin };
}

export async function calcularMetricasPeriodo(suscripcionId, periodo) {
  const sus = await Suscripcion.findByPk(suscripcionId, {
    include: [{ model: Plan, as: "plan" }],
  });
  if (!sus) throw new Error(`Suscripción ${suscripcionId} no encontrada`);

  const plan = sus.plan;
  const { inicio, fin } = periodoToRango(periodo);

  // usuarios_activos: logins distintos en el período (tokens_acceso como proxy)
  const usuariosActivos = await TokenAcceso.count({
    distinct: true,
    col: "usuario_id",
    where: {
      token_type: "REFRESH",
      created_at: { [Op.between]: [inicio, fin] },
    },
  });

  // novedades_creadas: novedades creadas en el período
  const { sequelize } = models;
  const [[{ total: novedadesRaw }]] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM novedades_incidentes
     WHERE created_at BETWEEN ? AND ?`,
    { replacements: [inicio, fin] }
  );
  const novedades = parseInt(novedadesRaw, 10) || 0;

  const costoBase = parseFloat(plan.precio_base_mensual);
  const moneda = plan.moneda;

  // excedente usuarios (solo si el plan tiene límite)
  let excedUsuarios = 0;
  if (plan.max_usuarios !== null && plan.max_usuarios !== undefined) {
    const extra = Math.max(0, usuariosActivos - plan.max_usuarios);
    excedUsuarios = extra * parseFloat(plan.precio_usuario_extra || 0);
  }

  // excedente novedades (solo si el plan tiene límite)
  let excedNovedades = 0;
  if (plan.max_novedades_mes !== null && plan.max_novedades_mes !== undefined) {
    const bloques = Math.max(
      0,
      Math.floor((novedades - plan.max_novedades_mes) / 100)
    );
    excedNovedades = bloques * parseFloat(plan.precio_novedad_extra_100 || 0);
  }

  const costoTotal = costoBase + excedUsuarios + excedNovedades;
  const periodoDate = `${periodo}-01`;

  const [metrica] = await MetricasUso.upsert(
    {
      suscripcion_id: suscripcionId,
      periodo: periodoDate,
      usuarios_activos: usuariosActivos,
      novedades_creadas: novedades,
      costo_base: costoBase.toFixed(2),
      costo_excedente_usuarios: excedUsuarios.toFixed(2),
      costo_excedente_novedades: excedNovedades.toFixed(2),
      costo_total: costoTotal.toFixed(2),
      moneda,
      calculado_at: new Date(),
    },
    { returning: true }
  );

  logger.info(`metricasService: calculado período ${periodo} — total ${costoTotal.toFixed(2)} ${moneda}`);
  return metrica;
}
