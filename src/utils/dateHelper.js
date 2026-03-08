/**
 * ============================================
 * HELPER: Manejo de Fechas con Timezone
 * ============================================
 *
 * Ruta: src/utils/dateHelper.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-01-21
 *
 * Descripción:
 * Funciones helper para manejar fechas con timezone correcto.
 * Resuelve el problema de que Railway usa UTC mientras que
 * la aplicación debe usar hora de Perú (UTC-5).
 *
 * PROBLEMA:
 * - new Date() en Railway retorna UTC (ej: 04:50)
 * - new Date() en localhost retorna hora local (ej: 23:50)
 * - Los campos como fecha_cambio se grababan con hora incorrecta
 *
 * SOLUCIÓN:
 * - Usar estas funciones en lugar de new Date() directo
 * - El timezone por defecto es "America/Lima" (UTC-5)
 */

// Timezone por defecto: Perú
const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "America/Lima";

/**
 * Formatea un Date a string "YYYY-MM-DD HH:mm:ss" en la timezone especificada.
 * Retornar string evita que mysql2 aplique doble conversión de timezone.
 *
 * @param {Date} dateObj - Fecha a formatear
 * @param {string} timezone - Timezone IANA
 * @returns {string} "YYYY-MM-DD HH:mm:ss"
 */
/**
 * Parsea DB_TIMEZONE (formato "+HH:MM" o "-HH:MM") a milisegundos de offset.
 * Fallback a -5h (Perú/UTC-5) si la variable no está definida o tiene formato inválido.
 */
const parseDbTimezoneOffset = () => {
  const tz = process.env.DB_TIMEZONE || "-05:00";
  const match = tz.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return -5 * 60 * 60 * 1000;
  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes) * 60 * 1000;
};

// Detectar si estamos en producción (Railway) para aplicar conversiones correctas
const isProduction = process.env.NODE_ENV === "production";
const DB_TIMEZONE_OFFSET_MS = isProduction ? 0 : parseDbTimezoneOffset();

const formatDateTimeToString = (dateObj) => {
  // Aplicar offset desde DB_TIMEZONE para evitar dependencia de ICU en Alpine (Railway)
  const localMs = dateObj.getTime() + DB_TIMEZONE_OFFSET_MS;
  const local = new Date(localMs);

  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  const hour = String(local.getUTCHours()).padStart(2, "0");
  const minute = String(local.getUTCMinutes()).padStart(2, "0");
  const second = String(local.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

/**
 * Obtiene la fecha/hora actual en el timezone especificado
 * Retorna un STRING "YYYY-MM-DD HH:mm:ss" para que mysql2 lo pase
 * directo a MySQL sin aplicar conversión de timezone.
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Fecha en formato "YYYY-MM-DD HH:mm:ss" (hora Perú)
 *
 * @example
 * // En Railway (UTC 04:50) retorna "2026-01-21 23:50:00" (hora Perú)
 * const ahora = getNowInTimezone();
 */
export const getNowInTimezone = () => {
  return formatDateTimeToString(new Date());
};

/**
 * Convierte una fecha a string "YYYY-MM-DD HH:mm:ss" en hora Perú.
 * - Si es string SIN timezone (sin Z ni offset): ya es hora Perú, pasa directo.
 * - Si es string CON Z o offset (+/-HH:MM): convierte de UTC a Perú.
 * - Si es objeto Date: convierte a Perú.
 *
 * @param {Date|string} date - Fecha a convertir
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Fecha en formato "YYYY-MM-DD HH:mm:ss" (hora Perú)
 */
export const convertToTimezone = (date) => {
  if (typeof date === "string") {
    // Si NO tiene Z ni offset timezone → ya es hora local (Perú), normalizar formato
    if (!date.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(date)) {
      // Normalizar a "YYYY-MM-DD HH:mm:ss" (quitar T si existe, agregar :ss si falta)
      let normalized = date.replace("T", " ");
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
        normalized += ":00";
      }
      return normalized;
    }
    // Tiene Z o offset → es UTC, aplicar offset de DB_TIMEZONE
    return formatDateTimeToString(new Date(date));
  }
  // Es objeto Date → aplicar offset de DB_TIMEZONE
  return formatDateTimeToString(date);
};

/**
 * Envuelve un string de fecha en sequelize.literal() para que mysql2
 * NO aplique conversión de timezone. Valida formato estricto contra SQL injection.
 *
 * @param {string} dateStr - Fecha en formato "YYYY-MM-DD HH:mm:ss"
 * @param {object} sequelizeInstance - Instancia de Sequelize
 * @returns {object} sequelize.literal() con la fecha
 */
export const rawDate = (dateStr, sequelizeInstance) => {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    throw new Error(`Formato de fecha inválido para rawDate: ${dateStr}`);
  }
  return sequelizeInstance.literal(`'${dateStr}'`);
};

/**
 * Obtiene solo la hora actual en formato HH:MM:SS
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Hora en formato HH:MM:SS
 */
export const getTimeInTimezone = () => {
  const str = formatDateTimeToString(new Date());
  return str.split(" ")[1];
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getDateInTimezone = () => {
  const str = formatDateTimeToString(new Date());
  return str.split(" ")[0];
};

/**
 * Formatea una fecha a string legible en la timezone especificada
 *
 * @param {Date|string} date - Fecha a formatear
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Fecha formateada "DD/MM/YYYY HH:MM:SS"
 */
export const formatDateInTimezone = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const str = formatDateTimeToString(dateObj);
  // Convertir de YYYY-MM-DD HH:mm:ss a DD/MM/YYYY HH:MM:SS
  const [datePart, timePart] = str.split(" ");
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y} ${timePart}`;
};

/**
 * Información de debug sobre la conversión de timezone
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {Object} Información de debug
 */
export const getTimezoneDebugInfo = () => {
  const now = new Date();

  return {
    servidor_utc: now.toISOString(),
    node_env: process.env.NODE_ENV,
    db_timezone_env: process.env.DB_TIMEZONE || "-05:00",
    is_production: isProduction,
    offset_ms_aplicado: DB_TIMEZONE_OFFSET_MS,
    hora_local_calculada: getTimeInTimezone(),
    fecha_local_calculada: getDateInTimezone(),
    fecha_completa_local: formatDateInTimezone(now),
  };
};

// Export default para compatibilidad
export default {
  getNowInTimezone,
  convertToTimezone,
  rawDate,
  formatDateTimeToString,
  getTimeInTimezone,
  getDateInTimezone,
  formatDateInTimezone,
  getTimezoneDebugInfo,
  DEFAULT_TIMEZONE,
};
