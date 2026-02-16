/**
 * ===================================================
 * CONSTANTES DE VALIDACIÓN - SISTEMA COMPLETO
 * ===================================================
 *
 * Ruta: src/constants/validations.js
 *
 * VERSIÓN: 3.1.0
 * FECHA: 2025-12-14
 *
 * CAMBIOS EN ESTA VERSIÓN:
 * ✅ Agregadas constantes de sectores y cuadrantes
 * ✅ Agregados patterns de validación geográfica
 * ✅ Agregados helpers de normalización territorial
 *
 * Descripción:
 * Single Source of Truth para todas las constantes de validación
 * del sistema. Incluye enums, patrones, límites y helpers.
 *
 * MÓDULOS:
 * - Personal Seguridad ✅
 * - Novedades/Incidentes ✅
 * - Vehículos ✅
 * - Unidades/Oficinas ✅
 * - Sectores/Cuadrantes ✅ NEW
 *
 * @module constants/validations
 * @version 3.1.0
 * @date 2025-12-14
 */

// ==========================================
// PERSONAL SEGURIDAD
// ==========================================

export const CATEGORIAS_LICENCIA = {
  A_I: "A-I",
  A_IIA: "A-IIA",
  A_IIB: "A-IIB",
  A_IIIA: "A-IIIA",
  A_IIIB: "A-IIIB",
  A_IIIC: "A-IIIC",
  B_I: "B-I",
  B_IIA: "B-IIA",
  B_IIB: "B-IIB",
  B_IIC: "B-IIC",
};

export const CATEGORIAS_LICENCIA_ARRAY = Object.values(CATEGORIAS_LICENCIA);

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

export const TIPOS_DOCUMENTO = {
  DNI: "DNI",
  CARNET_EXTRANJERIA: "Carnet Extranjeria",
  PASAPORTE: "Pasaporte",
  PTP: "PTP",
};

export const TIPOS_DOCUMENTO_ARRAY = Object.values(TIPOS_DOCUMENTO);

export const STATUS_LABORAL = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  SUSPENDIDO: "Suspendido",
  RETIRADO: "Retirado",
};

export const STATUS_LABORAL_ARRAY = Object.values(STATUS_LABORAL);

export const REGIMEN_LABORAL = {
  D256: "256",
  D276: "276",
  D728: "728",
  CAS_1057: "1057 CAS",
  ORDEN_SERVICIO: "Orden Servicio",
  PRACTICANTE: "Practicante",
};

export const REGIMEN_LABORAL_ARRAY = Object.values(REGIMEN_LABORAL);

export const SEXO = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
};

export const SEXO_ARRAY = Object.values(SEXO);

// ==========================================
// NOVEDADES/INCIDENTES
// ==========================================

export const ORIGEN_LLAMADA = {
  TELEFONO_107: "TELEFONO_107",
  RADIO_TETRA: "RADIO_TETRA",
  REDES_SOCIALES: "REDES_SOCIALES",
  BOTON_EMERGENCIA_ALERTA: "BOTON_EMERGENCIA_ALERTA",
  BOTON_DENUNCIA_VECINO_ALERTA: "BOTON_DENUNCIA_VECINO_ALERTA",
  INTERVENCION_DIRECTA: "INTERVENCION_DIRECTA",
  VIDEO_CCO: "VIDEO_CCO",
  ANALITICA: "ANALITICA",
  APP_PODER_JUDICIAL: "APP_PODER_JUDICIAL",
  BOT: "BOT",
};

export const ORIGEN_LLAMADA_ARRAY = Object.values(ORIGEN_LLAMADA);

export const PRIORIDAD = {
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAJA: "BAJA",
};

export const PRIORIDAD_ARRAY = Object.values(PRIORIDAD);

export const GRAVEDAD = {
  LEVE: "LEVE",
  MODERADA: "MODERADA",
  GRAVE: "GRAVE",
  MUY_GRAVE: "MUY_GRAVE",
};

export const GRAVEDAD_ARRAY = Object.values(GRAVEDAD);

export const TURNO = {
  MAÑANA: "MAÑANA",
  TARDE: "TARDE",
  NOCHE: "NOCHE",
};

export const TURNO_ARRAY = Object.values(TURNO);

// ==========================================
// VEHÍCULOS
// ==========================================

export const ESTADO_OPERATIVO_VEHICULO = {
  DISPONIBLE: "DISPONIBLE",
  EN_SERVICIO: "EN_SERVICIO",
  MANTENIMIENTO: "MANTENIMIENTO",
  REPARACION: "REPARACION",
  FUERA_DE_SERVICIO: "FUERA_DE_SERVICIO",
  INACTIVO: "INACTIVO",
};

export const ESTADO_OPERATIVO_VEHICULO_ARRAY = Object.values(
  ESTADO_OPERATIVO_VEHICULO
);

export const TIPO_COMBUSTIBLE = {
  GASOLINA_84: "GASOLINA_84",
  GASOLINA_90: "GASOLINA_90",
  GASOLINA_95: "GASOLINA_95",
  GASOLINA_97: "GASOLINA_97",
  DIESEL_B5: "DIESEL_B5",
  DIESEL_B20: "DIESEL_B20",
  GLP: "GLP",
  GNV: "GNV",
};

export const TIPO_COMBUSTIBLE_ARRAY = Object.values(TIPO_COMBUSTIBLE);

export const TIPO_COMBUSTIBLE_DESCRIPCION = {
  GASOLINA_84: "Gasolina 84 octanos",
  GASOLINA_90: "Gasolina 90 octanos",
  GASOLINA_95: "Gasolina 95 octanos",
  GASOLINA_97: "Gasolina 97 octanos (Premium)",
  DIESEL_B5: "Petróleo Diesel B5",
  DIESEL_B20: "Petróleo Diesel B20",
  GLP: "Gas Licuado de Petróleo",
  GNV: "Gas Natural Vehicular",
};

export const UNIDAD_COMBUSTIBLE = {
  LITROS: "LITROS",
  GALONES: "GALONES",
};

export const UNIDAD_COMBUSTIBLE_ARRAY = Object.values(UNIDAD_COMBUSTIBLE);

// ==========================================
// UNIDADES/OFICINAS
// ==========================================

export const TIPO_UNIDAD = {
  SERENAZGO: "SERENAZGO",
  PNP: "PNP",
  BOMBEROS: "BOMBEROS",
  AMBULANCIA: "AMBULANCIA",
  DEFENSA_CIVIL: "DEFENSA_CIVIL",
  TRANSITO: "TRANSITO",
  OTROS: "OTROS",
};

export const TIPO_UNIDAD_ARRAY = Object.values(TIPO_UNIDAD);

// ==========================================
// SECTORES Y CUADRANTES ✅ NEW
// ==========================================

/**
 * Colores predefinidos para visualización en mapas
 * Paleta de colores optimizada para mapas de seguridad
 */
export const COLORES_MAPA = {
  AZUL: "#3B82F6",
  VERDE: "#10B981",
  AMARILLO: "#F59E0B",
  ROJO: "#EF4444",
  MORADO: "#8B5CF6",
  ROSA: "#EC4899",
  CYAN: "#06B6D4",
  NARANJA: "#F97316",
};

export const COLORES_MAPA_ARRAY = Object.values(COLORES_MAPA);

// ==========================================
// PATRONES DE VALIDACIÓN
// ==========================================

export const PATTERNS = {
  // Documentos
  DNI: /^\d{8}$/,
  CARNET_EXTRANJERIA: /^[A-Z0-9]{9}$/,
  PASAPORTE: /^[A-Z0-9]{6,12}$/,
  LICENCIA: /^[A-Z]\d{8}$/,

  // Contacto
  TELEFONO: /^[0-9]{7,15}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Vehículos
  PLACA_VEHICULO: /^[A-Z0-9-]{6,10}$/i,
  CODIGO_VEHICULO: /^[A-Z0-9-]{1,10}$/,
  NUMERO_MOTOR: /^[A-Z0-9]{1,50}$/i,
  NUMERO_CHASIS: /^[A-Z0-9]{1,50}$/i,
  SOAT: /^[A-Z0-9-]{1,50}$/i,

  // Sectores y Cuadrantes
  SECTOR_CODE: /^[A-Z0-9-]{1,10}$/i,
  CUADRANTE_CODE: /^[A-Z0-9-]{1,10}$/i,
  ZONA_CODE: /^[A-Z0-9-]{1,20}$/i,
  COLOR_HEX: /^#[0-9A-F]{6}$/i,
  UBIGEO: /^\d{6}$/,
};

// ==========================================
// LÍMITES DE TEXTO
// ==========================================

export const LIMITES_TEXTO = {
  // Nombres y apellidos
  NOMBRE_MIN: 2,
  NOMBRE_MAX: 50,
  APELLIDO_MIN: 2,
  APELLIDO_MAX: 50,

  // Descripciones
  DESCRIPCION_MIN: 10,
  DESCRIPCION_MAX: 2000,
  OBSERVACIONES_MAX: 2000,

  // Direcciones
  DIRECCION_MIN: 5,
  DIRECCION_MAX: 150,
  LOCALIZACION_MAX: 500,
  REFERENCIA_MAX: 255,

  // Contacto
  TELEFONO_MIN: 7,
  TELEFONO_MAX: 15,
  EMAIL_MAX: 100,

  // Vehículos
  PLACA_MIN: 6,
  PLACA_MAX: 10,
  CODIGO_VEHICULO_MAX: 10,
  MARCA_MAX: 50,
  MODELO_MAX: 50,
  COLOR_MAX: 30,
  NUMERO_MOTOR_MAX: 50,
  NUMERO_CHASIS_MAX: 50,
  SOAT_MAX: 50,

  // Sectores y Cuadrantes
  SECTOR_CODE_MAX: 10,
  CUADRANTE_CODE_MAX: 10,
  SECTOR_NOMBRE_MIN: 3,
  SECTOR_NOMBRE_MAX: 100,
  CUADRANTE_NOMBRE_MIN: 3,
  CUADRANTE_NOMBRE_MAX: 100,
  ZONA_CODE_MAX: 20,
  COLOR_HEX_LENGTH: 7,
};

// ==========================================
// LÍMITES NUMÉRICOS
// ==========================================

export const LIMITES_NUMERICOS = {
  // Personal
  EDAD_MINIMA: 18,
  EDAD_MAXIMA: 100,

  // Coordenadas
  LATITUD_MIN: -90,
  LATITUD_MAX: 90,
  LONGITUD_MIN: -180,
  LONGITUD_MAX: 180,

  // Ubicación
  UBIGEO_LENGTH: 6,

  // Vehículos
  KM_MIN: 0,
  KM_MAX: 999999.99,
  ANIO_VEHICULO_MIN: 1900,
  ANIO_VEHICULO_MAX: new Date().getFullYear() + 1,
  CAPACIDAD_COMBUSTIBLE_MIN: 0.1,
  CAPACIDAD_COMBUSTIBLE_MAX: 999.99,
  PRECIO_GALON_MIN: 0,
  PRECIO_GALON_MAX: 999.99,
  CANTIDAD_GALONES_MIN: 0.1,
  CANTIDAD_GALONES_MAX: 999.99,

  // Unidades
  RADIO_COBERTURA_MIN: 0.1,
  RADIO_COBERTURA_MAX: 999.99,

  // Sectores y Cuadrantes
  RADIO_METROS_MIN: 10,
  RADIO_METROS_MAX: 50000,
};

// ==========================================
// HELPERS DE NORMALIZACIÓN
// ==========================================

export const normalizarCategoriaLicencia = (categoria) => {
  if (!categoria) return null;
  return categoria
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D−–—]/g, "-")
    .replace(/\s+/g, "");
};

export const normalizarDocumento = (documento) => {
  if (!documento) return null;
  return documento.trim().toUpperCase();
};

export const normalizarNombre = (nombre) => {
  if (!nombre) return null;
  return nombre
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const normalizarApellido = (apellido) => {
  if (!apellido) return null;
  return apellido.trim().toUpperCase();
};

export const normalizarTelefono = (telefono) => {
  if (!telefono) return null;
  return telefono.replace(/\D/g, "");
};

export const normalizarPlaca = (placa) => {
  if (!placa) return null;
  return placa.trim().toUpperCase().replace(/\s+/g, "");
};

export const normalizarCodigoVehiculo = (codigo) => {
  if (!codigo) return null;
  return codigo.trim().toUpperCase();
};

/**
 * Normalizar código de sector (MAYÚSCULAS)
 */
export const normalizarCodigoSector = (codigo) => {
  if (!codigo) return null;
  return codigo.trim().toUpperCase();
};

/**
 * Normalizar código de cuadrante (MAYÚSCULAS)
 */
export const normalizarCodigoCuadrante = (codigo) => {
  if (!codigo) return null;
  return codigo.trim().toUpperCase();
};

/**
 * Normalizar código de zona (MAYÚSCULAS)
 */
export const normalizarCodigoZona = (codigo) => {
  if (!codigo) return null;
  return codigo.trim().toUpperCase();
};

/**
 * Normalizar color hexadecimal
 */
export const normalizarColorHex = (color) => {
  if (!color) return null;
  const hex = color.trim().toUpperCase();
  return hex.startsWith("#") ? hex : `#${hex}`;
};

// ==========================================
// HELPERS DE VALIDACIÓN
// ==========================================

export const validarEdad = (fechaNacimiento) => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edad = Math.floor((hoy - nacimiento) / (365.25 * 24 * 60 * 60 * 1000));

  return {
    valida:
      edad >= LIMITES_NUMERICOS.EDAD_MINIMA &&
      edad <= LIMITES_NUMERICOS.EDAD_MAXIMA,
    edad,
    mensaje:
      edad < LIMITES_NUMERICOS.EDAD_MINIMA
        ? `Debe ser mayor de ${LIMITES_NUMERICOS.EDAD_MINIMA} años`
        : edad > LIMITES_NUMERICOS.EDAD_MAXIMA
          ? "Fecha de nacimiento inválida"
          : null,
  };
};

export const validarCoordenadas = (latitud, longitud) => {
  const lat = parseFloat(latitud);
  const lng = parseFloat(longitud);

  return {
    valida:
      lat >= LIMITES_NUMERICOS.LATITUD_MIN &&
      lat <= LIMITES_NUMERICOS.LATITUD_MAX &&
      lng >= LIMITES_NUMERICOS.LONGITUD_MIN &&
      lng <= LIMITES_NUMERICOS.LONGITUD_MAX,
    mensaje:
      lat < LIMITES_NUMERICOS.LATITUD_MIN || lat > LIMITES_NUMERICOS.LATITUD_MAX
        ? `Latitud debe estar entre ${LIMITES_NUMERICOS.LATITUD_MIN} y ${LIMITES_NUMERICOS.LATITUD_MAX}`
        : `Longitud debe estar entre ${LIMITES_NUMERICOS.LONGITUD_MIN} y ${LIMITES_NUMERICOS.LONGITUD_MAX}`,
  };
};

export const validarFormatoDocumento = (tipo, numero) => {
  const patterns = {
    DNI: PATTERNS.DNI,
    "Carnet Extranjeria": PATTERNS.CARNET_EXTRANJERIA,
    Pasaporte: PATTERNS.PASAPORTE,
  };

  const pattern = patterns[tipo];
  if (!pattern) return { valida: true };

  return {
    valida: pattern.test(numero),
    mensaje: !pattern.test(numero) ? `Formato inválido para ${tipo}` : null,
  };
};

export const validarAnioVehiculo = (anio) => {
  const anioNum = parseInt(anio);
  const anioActual = new Date().getFullYear();

  return {
    valida:
      anioNum >= LIMITES_NUMERICOS.ANIO_VEHICULO_MIN &&
      anioNum <= anioActual + 1,
    mensaje:
      anioNum < LIMITES_NUMERICOS.ANIO_VEHICULO_MIN
        ? `El año no puede ser menor a ${LIMITES_NUMERICOS.ANIO_VEHICULO_MIN}`
        : anioNum > anioActual + 1
          ? `El año no puede ser mayor a ${anioActual + 1}`
          : null,
  };
};

export const validarKilometraje = (kmNuevo, kmActual) => {
  const nuevo = parseFloat(kmNuevo);
  const actual = parseFloat(kmActual);

  return {
    valida: nuevo >= actual && nuevo <= LIMITES_NUMERICOS.KM_MAX,
    mensaje:
      nuevo < actual
        ? "El kilometraje nuevo no puede ser menor al actual"
        : nuevo > LIMITES_NUMERICOS.KM_MAX
          ? `El kilometraje no puede exceder ${LIMITES_NUMERICOS.KM_MAX}`
          : null,
  };
};

/**
 * Validar color hexadecimal
 */
export const validarColorHex = (color) => {
  if (!color) return { valida: true };

  const normalizado = normalizarColorHex(color);
  return {
    valida: PATTERNS.COLOR_HEX.test(normalizado),
    mensaje: !PATTERNS.COLOR_HEX.test(normalizado)
      ? "Color debe ser formato hexadecimal (#RRGGBB)"
      : null,
  };
};

/**
 * Validar radio de cobertura
 */
export const validarRadioMetros = (radio) => {
  const radioNum = parseInt(radio);

  return {
    valida:
      radioNum >= LIMITES_NUMERICOS.RADIO_METROS_MIN &&
      radioNum <= LIMITES_NUMERICOS.RADIO_METROS_MAX,
    mensaje:
      radioNum < LIMITES_NUMERICOS.RADIO_METROS_MIN
        ? `El radio debe ser mínimo ${LIMITES_NUMERICOS.RADIO_METROS_MIN} metros`
        : radioNum > LIMITES_NUMERICOS.RADIO_METROS_MAX
          ? `El radio no puede exceder ${LIMITES_NUMERICOS.RADIO_METROS_MAX} metros`
          : null,
  };
};

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================

export default {
  // Personal
  CATEGORIAS_LICENCIA,
  CATEGORIAS_LICENCIA_ARRAY,
  CATEGORIAS_LICENCIA_DESCRIPCION,
  TIPOS_DOCUMENTO,
  TIPOS_DOCUMENTO_ARRAY,
  STATUS_LABORAL,
  STATUS_LABORAL_ARRAY,
  REGIMEN_LABORAL,
  REGIMEN_LABORAL_ARRAY,
  SEXO,
  SEXO_ARRAY,

  // Novedades
  ORIGEN_LLAMADA,
  ORIGEN_LLAMADA_ARRAY,
  PRIORIDAD,
  PRIORIDAD_ARRAY,
  GRAVEDAD,
  GRAVEDAD_ARRAY,
  TURNO,
  TURNO_ARRAY,

  // Vehículos
  ESTADO_OPERATIVO_VEHICULO,
  ESTADO_OPERATIVO_VEHICULO_ARRAY,
  TIPO_COMBUSTIBLE,
  TIPO_COMBUSTIBLE_ARRAY,
  TIPO_COMBUSTIBLE_DESCRIPCION,

  // Unidades
  TIPO_UNIDAD,
  TIPO_UNIDAD_ARRAY,

  // Sectores y Cuadrantes
  COLORES_MAPA,
  COLORES_MAPA_ARRAY,

  // Patrones y límites
  PATTERNS,
  LIMITES_TEXTO,
  LIMITES_NUMERICOS,

  // Helpers
  normalizarCategoriaLicencia,
  normalizarDocumento,
  normalizarNombre,
  normalizarApellido,
  normalizarTelefono,
  normalizarPlaca,
  normalizarCodigoVehiculo,
  normalizarCodigoSector,
  normalizarCodigoCuadrante,
  normalizarCodigoZona,
  normalizarColorHex,
  validarEdad,
  validarCoordenadas,
  validarFormatoDocumento,
  validarAnioVehiculo,
  validarKilometraje,
  validarColorHex,
  validarRadioMetros,
};
