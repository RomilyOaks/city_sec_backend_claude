/**
 * ===================================================
 * CONSTANTS - VALIDACIONES CENTRALIZADAS
 * ===================================================
 *
 * Archivo: src/constants/validations.js
 *
 * FUENTE ÚNICA DE VERDAD para todas las validaciones del sistema.
 *
 * Principios:
 * - DRY (Don't Repeat Yourself)
 * - Single Source of Truth
 * - Fácil mantenimiento
 * - Consistencia garantizada
 *
 * @module constants/validations
 * @version 1.0.0
 */

// ==========================================
// PERSONAL - TIPOS DE DOCUMENTO
// ==========================================

export const TIPOS_DOCUMENTO = {
  DNI: "DNI",
  CARNET_EXTRANJERIA: "Carnet Extranjeria",
  PASAPORTE: "Pasaporte",
  PTP: "PTP",
};

export const TIPOS_DOCUMENTO_ARRAY = Object.values(TIPOS_DOCUMENTO);

// ==========================================
// PERSONAL - STATUS LABORAL
// ==========================================

export const STATUS_LABORAL = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  SUSPENDIDO: "Suspendido",
  RETIRADO: "Retirado",
};

export const STATUS_LABORAL_ARRAY = Object.values(STATUS_LABORAL);

// ==========================================
// PERSONAL - SEXO
// ==========================================

export const SEXO = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
};

export const SEXO_ARRAY = Object.values(SEXO);

// ==========================================
// PERSONAL - RÉGIMEN LABORAL
// ==========================================

export const REGIMEN_LABORAL = {
  R256: "256",
  R276: "276",
  R728: "728",
  CAS: "1057 CAS",
  ORDEN_SERVICIO: "Orden Servicio",
  PRACTICANTE: "Practicante",
};

export const REGIMEN_LABORAL_ARRAY = Object.values(REGIMEN_LABORAL);

// ==========================================
// LICENCIAS DE CONDUCIR - CATEGORÍAS
// ==========================================

/**
 * Categorías de licencia de conducir según Reglamento Nacional (Perú)
 *
 * CLASE A: Motocicletas y vehículos menores
 * CLASE B: Automóviles y vehículos de transporte
 *
 * IMPORTANTE: Todas en MAYÚSCULAS para consistencia
 */
export const CATEGORIAS_LICENCIA = {
  // CLASE A - Motocicletas
  A_I: "A-I", // Motocicletas hasta 125cc
  A_IIA: "A-IIA", // Motocicletas hasta 400cc
  A_IIB: "A-IIB", // Motocicletas sin límite
  A_IIIA: "A-IIIA", // Mototaxis
  A_IIIB: "A-IIIB", // Trimotos de carga
  A_IIIC: "A-IIIC", // Vehículos especiales

  // CLASE B - Automóviles
  B_I: "B-I", // Automóviles particulares
  B_IIA: "B-IIA", // Taxis, colectivos
  B_IIB: "B-IIB", // Camiones, buses
  B_IIC: "B-IIC", // Vehículos pesados especiales
};

export const CATEGORIAS_LICENCIA_ARRAY = Object.values(CATEGORIAS_LICENCIA);

/**
 * Descripción detallada de cada categoría
 * Para mostrar en interfaces o mensajes de error
 */
export const CATEGORIAS_LICENCIA_DESCRIPCION = {
  "A-I": "Motocicletas hasta 125cc",
  "A-IIA": "Motocicletas hasta 400cc",
  "A-IIB": "Motocicletas sin límite de cilindrada",
  "A-IIIA": "Mototaxis",
  "A-IIIB": "Trimotos de carga",
  "A-IIIC": "Vehículos especiales motorizados",
  "B-I": "Automóviles particulares",
  "B-IIA": "Taxis y colectivos",
  "B-IIB": "Camiones y buses",
  "B-IIC": "Vehículos pesados especiales",
};

/**
 * Mensaje de error formateado para categorías
 */
export const CATEGORIAS_LICENCIA_ERROR_MESSAGE = `Categoría no válida.

Categorías válidas en Perú:

CLASE A (Motocicletas):
  • A-I: Motocicletas hasta 125cc
  • A-IIA: Motocicletas hasta 400cc
  • A-IIB: Motocicletas sin límite
  • A-IIIA: Mototaxis
  • A-IIIB: Trimotos de carga
  • A-IIIC: Vehículos especiales

CLASE B (Automóviles):
  • B-I: Automóviles particulares
  • B-IIA: Taxis, colectivos
  • B-IIB: Camiones, buses
  • B-IIC: Vehículos pesados`;

// ==========================================
// LICENCIAS - PATRONES DE VALIDACIÓN
// ==========================================

/**
 * Patrón para número de licencia de conducir
 * Formato: Una letra seguida de 8 dígitos (ej: Q12345678)
 */
export const LICENCIA_REGEX = /^[A-Z]\d{8}$/;

export const LICENCIA_FORMATO_MENSAJE =
  "Formato de licencia inválido. Debe ser: letra + 8 dígitos (ej: Q12345678)";

// ==========================================
// DOCUMENTOS - PATRONES DE VALIDACIÓN
// ==========================================

export const DOCUMENTO_PATTERNS = {
  DNI: /^\d{8}$/,
  CARNET_EXTRANJERIA: /^[A-Z0-9]{9}$/,
  PASAPORTE: /^[A-Z0-9]{6,12}$/,
};

export const DOCUMENTO_MENSAJES = {
  DNI: "El DNI debe tener exactamente 8 dígitos numéricos",
  CARNET_EXTRANJERIA:
    "El Carnet de Extranjería debe tener 9 caracteres alfanuméricos",
  PASAPORTE: "El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos",
};

// ==========================================
// UBIGEO
// ==========================================

export const UBIGEO_REGEX = /^\d{6}$/;
export const UBIGEO_MENSAJE =
  "El código de ubigeo debe tener exactamente 6 dígitos";

// ==========================================
// CÓDIGO DE ACCESO
// ==========================================

export const CODIGO_ACCESO_REGEX = /^[A-Z]{3}-\d{4}$/;
export const CODIGO_ACCESO_MENSAJE = "Formato: XXX-0000 (ej: SER-0001)";

// ==========================================
// LÍMITES DE EDAD
// ==========================================

export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 100;

// ==========================================
// LÍMITES DE TEXTO
// ==========================================

export const LIMITES_TEXTO = {
  NOMBRE: { min: 2, max: 50 },
  APELLIDO: { min: 2, max: 50 },
  DIRECCION: { min: 5, max: 150 },
  NACIONALIDAD: { min: 4, max: 50 },
  OBSERVACIONES: { max: 500 },
  CODIGO_ACCESO: { min: 4, max: 45 },
  LICENCIA: { min: 5, max: 20 },
  CATEGORIA: { max: 20 },
};

// ==========================================
// PATRONES DE TEXTO
// ==========================================

export const TEXTO_SOLO_LETRAS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
export const TEXTO_SOLO_LETRAS_MENSAJE =
  "Solo puede contener letras y espacios";

// ==========================================
// VEHÍCULOS - ESTADOS OPERATIVOS
// ==========================================

export const ESTADOS_OPERATIVOS_VEHICULO = {
  DISPONIBLE: "DISPONIBLE",
  EN_SERVICIO: "EN_SERVICIO",
  MANTENIMIENTO: "MANTENIMIENTO",
  AVERIADO: "AVERIADO",
  INACTIVO: "INACTIVO",
};

export const ESTADOS_OPERATIVOS_VEHICULO_ARRAY = Object.values(
  ESTADOS_OPERATIVOS_VEHICULO
);

// ==========================================
// AUDITORÍA - RESULTADOS
// ==========================================

export const RESULTADOS_AUDITORIA = {
  EXITO: "EXITO",
  FALLO: "FALLO",
  DENEGADO: "DENEGADO",
};

export const RESULTADOS_AUDITORIA_ARRAY = Object.values(RESULTADOS_AUDITORIA);

// ==========================================
// AUDITORÍA - SEVERIDAD
// ==========================================

export const SEVERIDAD_AUDITORIA = {
  BAJA: "BAJA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  CRITICA: "CRITICA",
};

export const SEVERIDAD_AUDITORIA_ARRAY = Object.values(SEVERIDAD_AUDITORIA);

// ==========================================
// PAGINACIÓN
// ==========================================

export const PAGINACION = {
  PAGE_DEFAULT: 1,
  LIMIT_DEFAULT: 20,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
};

// ==========================================
// HELPERS
// ==========================================

/**
 * Verificar si una categoría de licencia es válida
 * @param {string} categoria - Categoría a verificar
 * @returns {boolean}
 */
export const esCategoriaLicenciaValida = (categoria) => {
  if (!categoria) return false;

  // Normalizar
  const categoriaNormalizada = categoria
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D−–—]/g, "-")
    .replace(/\s+/g, "");

  return CATEGORIAS_LICENCIA_ARRAY.includes(categoriaNormalizada);
};

/**
 * Normalizar categoría de licencia
 * @param {string} categoria - Categoría a normalizar
 * @returns {string}
 */
export const normalizarCategoriaLicencia = (categoria) => {
  if (!categoria) return null;

  return categoria
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D−–—]/g, "-")
    .replace(/\s+/g, "");
};

/**
 * Validar documento según tipo
 * @param {string} tipo - Tipo de documento
 * @param {string} numero - Número de documento
 * @returns {boolean}
 */
export const validarDocumento = (tipo, numero) => {
  const pattern = DOCUMENTO_PATTERNS[tipo];
  if (!pattern) return false;
  return pattern.test(numero.trim().toUpperCase());
};

// ==========================================
// EXPORTACIÓN DEFAULT
// ==========================================

export default {
  // Tipos de documento
  TIPOS_DOCUMENTO,
  TIPOS_DOCUMENTO_ARRAY,

  // Status laboral
  STATUS_LABORAL,
  STATUS_LABORAL_ARRAY,

  // Sexo
  SEXO,
  SEXO_ARRAY,

  // Régimen laboral
  REGIMEN_LABORAL,
  REGIMEN_LABORAL_ARRAY,

  // Licencias
  CATEGORIAS_LICENCIA,
  CATEGORIAS_LICENCIA_ARRAY,
  CATEGORIAS_LICENCIA_DESCRIPCION,
  CATEGORIAS_LICENCIA_ERROR_MESSAGE,
  LICENCIA_REGEX,
  LICENCIA_FORMATO_MENSAJE,

  // Documentos
  DOCUMENTO_PATTERNS,
  DOCUMENTO_MENSAJES,

  // Otros
  UBIGEO_REGEX,
  UBIGEO_MENSAJE,
  CODIGO_ACCESO_REGEX,
  CODIGO_ACCESO_MENSAJE,
  EDAD_MINIMA,
  EDAD_MAXIMA,
  LIMITES_TEXTO,
  TEXTO_SOLO_LETRAS_REGEX,
  TEXTO_SOLO_LETRAS_MENSAJE,

  // Vehículos
  ESTADOS_OPERATIVOS_VEHICULO,
  ESTADOS_OPERATIVOS_VEHICULO_ARRAY,

  // Auditoría
  RESULTADOS_AUDITORIA,
  RESULTADOS_AUDITORIA_ARRAY,
  SEVERIDAD_AUDITORIA,
  SEVERIDAD_AUDITORIA_ARRAY,

  // Paginación
  PAGINACION,

  // Helpers
  esCategoriaLicenciaValida,
  normalizarCategoriaLicencia,
  validarDocumento,
};
