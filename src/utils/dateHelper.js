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
 * Obtiene la fecha/hora actual en el timezone especificado
 * Retorna un objeto Date que representa la hora local de Perú
 *
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {Date} Fecha con hora local de Perú
 *
 * @example
 * // En Railway (UTC 04:50) retorna Date con hora 23:50 del día anterior
 * const ahora = getNowInTimezone();
 */
export const getNowInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const now = new Date();

  // Obtener la hora en la timezone especificada
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

  // Formatear a string en la timezone local
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(now);

  // Extraer las partes
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");

  // Crear string ISO sin timezone (será interpretado como hora local por MySQL)
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  // Retornar como Date (MySQL lo guardará como está)
  return new Date(isoString);
};

/**
 * Convierte una fecha UTC a la timezone especificada
 *
 * @param {Date|string} date - Fecha a convertir
 * @param {string} timezone - Timezone IANA (default: America/Lima)
 * @returns {Date} Fecha convertida
 */
export const convertToTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
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

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(dateObj);

  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
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
  getTimeInTimezone,
  getDateInTimezone,
  formatDateInTimezone,
  getTimezoneDebugInfo,
  DEFAULT_TIMEZONE,
};
