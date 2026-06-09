import models from "../models/index.js";
import logger from "../utils/logger.js";

const { Suscripcion } = models;

const CACHE_TTL_MS = 5 * 60 * 1000;
let _cache = null;

function isExcluded(req) {
  const p = req.path;
  if (p === "/health") return true;
  if (p === "/auth/login" || p === "/auth/refresh") return true;
  if (p.startsWith("/ciudadanos")) return true;
  return false;
}

async function leerEstado() {
  if (_cache && Date.now() - _cache.cachedAt < CACHE_TTL_MS) {
    return _cache.estado;
  }
  const sus = await Suscripcion.findOne({
    attributes: ["estado"],
    order: [["id", "DESC"]],
  });
  _cache = { estado: sus?.estado ?? null, cachedAt: Date.now() };
  return _cache.estado;
}

export function invalidarCacheCheckSuscripcion() {
  _cache = null;
}

export default async function checkSuscripcion(req, res, next) {
  try {
    if (isExcluded(req)) return next();

    const estado = await leerEstado();

    if (estado === "suspendida") {
      return res.status(503).json({
        success: false,
        message: "Servicio suspendido por falta de pago. Contacte al administrador.",
        codigo: "SUSCRIPCION_SUSPENDIDA",
      });
    }

    next();
  } catch (err) {
    logger.error("checkSuscripcion error", { stack: err.stack });
    next(); // no bloquear ante error de BD
  }
}
