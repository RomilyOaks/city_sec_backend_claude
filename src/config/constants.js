/**
 * ===================================================
 * CONFIGURACIÓN: Constantes de la Aplicación
 * ===================================================
 * Ruta: src/config/constants.js
 *
 * Constantes globales y valores por defecto
 */

// ==========================================
// UBIGEO POR DEFECTO
// ==========================================
// Código UBIGEO por defecto
// Formato: DDPPDD (Departamento - Provincia - Distrito)
// Referencia: INEI - Sistema de Ubigeos del Perú
export const DEFAULT_UBIGEO_CODE = process.env.DEFAULT_UBIGEO_CODE || "150101";

// Nombre completo del ubigeo por defecto
// Lee desde variables de entorno o usa valores por defecto
export const DEFAULT_UBIGEO_INFO = {
  code: DEFAULT_UBIGEO_CODE,
  departamento: process.env.DEFAULT_UBIGEO_DEPARTMENT || "Arequipa",
  provincia: process.env.DEFAULT_UBIGEO_PROVINCE || "Arequipa",
  distrito: process.env.DEFAULT_UBIGEO_DISTRICT || "Arequipa",
  departamento_code: DEFAULT_UBIGEO_CODE.substring(0, 2),
  provincia_code: DEFAULT_UBIGEO_CODE.substring(2, 4),
  distrito_code: DEFAULT_UBIGEO_CODE.substring(4, 6)
};

// ==========================================
// LÍMITES DE TEXTO
// ==========================================
export const LIMITES_TEXTO = {
  DESCRIPCION_MIN: 20,
  DESCRIPCION_MAX: 1000,
  OBSERVACIONES_MAX: 1000,
  NOMBRE_MIN: 3,
  NOMBRE_MAX: 150,
  CODIGO_MAX: 50
};

// ==========================================
// ESTADOS INICIALES
// ==========================================
export const ESTADOS_SISTEMA = {
  ACTIVO: 1,
  INACTIVO: 0
};

// ==========================================
// TURNOS
// ==========================================
export const TURNOS = {
  MANANA: "MAÑANA",
  TARDE: "TARDE",
  NOCHE: "NOCHE"
};

// Horarios de turnos
export const HORARIOS_TURNOS = {
  MANANA_INICIO: 6,
  MANANA_FIN: 14,
  TARDE_INICIO: 14,
  TARDE_FIN: 22,
  NOCHE_INICIO: 22,
  NOCHE_FIN: 6
};

// ==========================================
// PRIORIDADES
// ==========================================
export const PRIORIDADES = {
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAJA: "BAJA"
};

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================
export default {
  DEFAULT_UBIGEO_CODE,
  DEFAULT_UBIGEO_INFO,
  LIMITES_TEXTO,
  ESTADOS_SISTEMA,
  TURNOS,
  HORARIOS_TURNOS,
  PRIORIDADES
};
