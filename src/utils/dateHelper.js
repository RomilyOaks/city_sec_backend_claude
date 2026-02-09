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
const formatDateTimeToString = (dateObj, timezone) => {
  const options = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(dateObj);
  const get = (type) => parts.find((p) => p.type === type)?.value || "00";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
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
export const getNowInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  return formatDateTimeToString(new Date(), timezone);
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
export const convertToTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
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
    // Tiene Z o offset → es UTC, convertir a Perú
    return formatDateTimeToString(new Date(date), timezone);
  }
  // Es objeto Date → convertir a Perú
  return formatDateTimeToString(date, timezone);
};

/**
 * Obtiene solo la hora actual en formato HH:MM:SS
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Hora en formato HH:MM:SS
 */
export const getTimeInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const now = new Date();

  const options = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-GB", options);
  return formatter.format(now);
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getDateInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const now = new Date();

  const options = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  return formatter.format(now);
};

/**
 * Formatea una fecha a string legible en la timezone especificada
 *
 * @param {Date|string} date - Fecha a formatear
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {string} Fecha formateada "DD/MM/YYYY HH:MM:SS"
 */
export const formatDateInTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const options = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("es-PE", options);
  return formatter.format(dateObj);
};

/**
 * Información de debug sobre la conversión de timezone
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {Object} Información de debug
 */
export const getTimezoneDebugInfo = (timezone = DEFAULT_TIMEZONE) => {
  const now = new Date();

  return {
    servidor_utc: now.toISOString(),
    timezone_configurada: timezone,
    hora_local_calculada: getTimeInTimezone(timezone),
    fecha_local_calculada: getDateInTimezone(timezone),
    fecha_completa_local: formatDateInTimezone(now, timezone),
  };
};

// Export default para compatibilidad
export default {
  getNowInTimezone,
  convertToTimezone,
  formatDateTimeToString,
  getTimeInTimezone,
  getDateInTimezone,
  formatDateInTimezone,
  getTimezoneDebugInfo,
  DEFAULT_TIMEZONE,
};
