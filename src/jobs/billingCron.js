import cron from "node-cron";
import { Op } from "sequelize";
import models from "../models/index.js";
import logger from "../utils/logger.js";
import { generarFactura } from "../services/facturaService.js";
import { invalidarCacheCheckSuscripcion } from "../middlewares/checkSuscripcion.js";

const { Suscripcion, Factura } = models;

// ─── Helpers de fecha (America/Lima, UTC-5) ───────────────────────────────────
function getHoyLima() {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getPeriodoCerrado() {
  const limaAhora = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const anio = limaAhora.getUTCFullYear();
  const mes = limaAhora.getUTCMonth(); // 0-indexed; mes anterior = mes - 1
  const fecha = new Date(Date.UTC(anio, mes - 1, 1));
  const yyyy = fecha.getUTCFullYear();
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

// ─── Lógica del cierre mensual ─────────────────────────────────────────────────
export async function ejecutarCierreMensual() {
  const sus = await Suscripcion.findOne({ order: [["id", "DESC"]] });
  if (!sus) {
    logger.warn("billingCron: no hay suscripción activa, se omite el cierre");
    return;
  }

  // 1-3. Generar factura del período recién cerrado si no existe
  const periodoCerrado = getPeriodoCerrado();
  const existeFactura = await Factura.findOne({
    where: { suscripcion_id: sus.id, periodo: `${periodoCerrado}-01` },
  });

  if (!existeFactura) {
    try {
      await generarFactura(sus.id, periodoCerrado);
      logger.info(`billingCron: factura generada para el período ${periodoCerrado}`);
    } catch (err) {
      if (err.code === "FACTURA_DUPLICADA") {
        logger.warn(`billingCron: factura ${periodoCerrado} ya existía (race condition)`);
      } else {
        logger.error("billingCron: error al generar factura del período", { stack: err.stack });
      }
    }
  }

  // 4. Marcar facturas vencidas sin pagar
  const hoyLima = getHoyLima();
  const vencidas = await Factura.findAll({
    where: {
      suscripcion_id: sus.id,
      estado: "pendiente",
      fecha_vencimiento: { [Op.lt]: hoyLima },
    },
  });

  let cambioEstado = false;

  if (vencidas.length > 0) {
    for (const factura of vencidas) {
      await factura.update({ estado: "vencida" });
    }
    logger.info(`billingCron: ${vencidas.length} factura(s) marcada(s) como vencida(s)`);

    if (sus.estado === "activa") {
      await sus.update({ estado: "gracia" });
      cambioEstado = true;
      logger.info(`billingCron: suscripción ${sus.id} pasó a estado 'gracia'`);
    }
  }

  // 5. Si lleva más de dias_gracia días en gracia sin pagar → suspendida
  await sus.reload();
  if (sus.estado === "gracia") {
    const facturaVencidaMasAntigua = await Factura.findOne({
      where: { suscripcion_id: sus.id, estado: "vencida" },
      order: [["fecha_vencimiento", "ASC"]],
    });

    if (facturaVencidaMasAntigua) {
      const limite = new Date(facturaVencidaMasAntigua.fecha_vencimiento);
      limite.setDate(limite.getDate() + sus.dias_gracia);
      const limiteStr = limite.toISOString().slice(0, 10);

      if (hoyLima >= limiteStr) {
        await sus.update({ estado: "suspendida" });
        cambioEstado = true;
        logger.warn(`billingCron: suscripción ${sus.id} pasó a estado 'suspendida' (gracia agotada)`);
      }
    }
  }

  // 6. Invalidar caché de checkSuscripcion si cambió el estado
  if (cambioEstado) {
    invalidarCacheCheckSuscripcion();
  }
}

// ─── Inicialización del cron ───────────────────────────────────────────────────
export function iniciarBillingCron() {
  if (process.env.BILLING_CRON_ENABLED !== "true") {
    logger.info("billingCron: deshabilitado (BILLING_CRON_ENABLED != 'true')");
    return;
  }

  const dia = process.env.BILLING_CRON_DIA_CIERRE || "1";
  const expresion = `0 0 ${dia} * *`;

  cron.schedule(
    expresion,
    () => {
      ejecutarCierreMensual().catch((err) => {
        logger.error("billingCron: error en cierre mensual", { stack: err.stack });
      });
    },
    { timezone: "America/Lima" }
  );

  logger.info(`billingCron: programado para el día ${dia} de cada mes a las 00:00 (America/Lima)`);
}
