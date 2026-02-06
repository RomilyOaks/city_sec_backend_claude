/**
 * ============================================================================
 * SERVICIO: Geocodificación de Direcciones
 * ============================================================================
 *
 * Obtiene latitud/longitud para una dirección usando dos estrategias:
 *   Prioridad A: Búsqueda aproximada en base de datos (misma cuadra)
 *   Prioridad B: API Nominatim (OpenStreetMap) como fallback
 *
 * Características:
 * - Parser de direcciones peruanas (Ca., Av., Jr., Mz/Lt)
 * - Búsqueda en BD solo en misma cuadra (misma centena numérica)
 * - Excluye direcciones aproximadas de BD para evitar cascada de imprecisiones
 * - Nominatim con búsqueda estructurada + variaciones de nombre
 * - Normalización de abreviaturas (Ca.→Calle, Santa→Sta., etc.)
 *
 * @module services/geocodingService
 * ============================================================================
 */

import Direccion from "../models/Direccion.js";
import Calle from "../models/Calle.js";
import { Op } from "sequelize";
import {
  DEFAULT_UBIGEO_INFO,
  DEFAULT_COUNTRY,
  DEFAULT_COUNTRY_NAME,
} from "../config/constants.js";

// ============================================================================
// PARSER DE DIRECCIÓN
// ============================================================================

/**
 * Parsea un string de dirección en componentes
 *
 * Ejemplos de entrada:
 *   "Ca. Santa Teresa 115"
 *   "Av. Ejército 450-A"
 *   "Jr. Los Olivos Mz B Lt 15"
 *
 * @param {string} direccionStr - Texto libre de dirección
 * @returns {Object} { streetPrefix, streetName, fullStreet, numero, manzana, lote }
 */
function parseDireccionString(direccionStr) {
  const trimmed = direccionStr.trim();

  // Prefijos de vía conocidos
  const prefixRegex =
    /^(Av\.|Avenida|Ca\.|Calle|Jr\.|Jiron|Jirón|Pj\.|Psje\.|Pasaje|Prol\.|Prolongación|Prolongacion|Malecon|Malecón|Alameda)\s+/i;

  let streetPrefix = null;
  let rest = trimmed;

  const prefixMatch = trimmed.match(prefixRegex);
  if (prefixMatch) {
    streetPrefix = prefixMatch[1];
    rest = trimmed.substring(prefixMatch[0].length);
  }

  // Extraer Manzana/Lote: "Mz B Lt 15" o "Mz. B Lote 15"
  const mzLtRegex =
    /\s+(?:Mz\.?|Manzana)\s+(\S+)(?:\s+(?:Lt\.?|Lote)\s+(\S+))?/i;
  let manzana = null;
  let lote = null;
  const mzMatch = rest.match(mzLtRegex);
  if (mzMatch) {
    manzana = mzMatch[1];
    lote = mzMatch[2] || null;
    rest = rest.substring(0, mzMatch.index).trim();
  }

  // Extraer número del final: "Santa Teresa 115" → "115"
  const numRegex = /\s+((?:Nº\s*|N°\s*|#\s*)?\d+[-]?\w*|S\/N)$/i;
  let numero = null;
  const numMatch = rest.match(numRegex);
  if (numMatch) {
    // Limpiar prefijos de número (Nº, N°, #)
    numero = numMatch[1].replace(/^(Nº\s*|N°\s*|#\s*)/i, "").trim();
    rest = rest.substring(0, numMatch.index).trim();
  }

  const streetName = rest.trim();

  return {
    streetPrefix,
    streetName,
    fullStreet: streetPrefix ? `${streetPrefix} ${streetName}` : streetName,
    numero,
    manzana,
    lote,
  };
}

// ============================================================================
// PRIORIDAD A: BÚSQUEDA APROXIMADA EN BASE DE DATOS
// ============================================================================

/**
 * Busca coordenadas aproximadas en la BD basándose en direcciones geocodificadas
 * de la misma calle y número más cercano (misma cuadra únicamente).
 *
 * Excluye direcciones con fuente "Base de datos" para evitar cascada de
 * aproximaciones con coordenadas imprecisas.
 *
 * @param {Object} parsedDir - Dirección parseada
 * @returns {Object|null} Resultado con coordenadas o null
 */
async function buscarEnBaseDatos(parsedDir) {
  const { streetName, numero, manzana } = parsedDir;

  if (!streetName) return null;

  // Paso 1: Buscar calles que coincidan
  const calles = await Calle.findAll({
    where: {
      [Op.or]: [
        { nombre_via: { [Op.like]: `%${streetName}%` } },
        { nombre_completo: { [Op.like]: `%${streetName}%` } },
      ],
      estado: 1,
    },
    attributes: ["id", "nombre_completo"],
    limit: 10,
  });

  if (calles.length === 0) return null;

  const calleIds = calles.map((c) => c.id);

  // Paso 2: Buscar direcciones geocodificadas en esas calles
  // Excluir direcciones geocodificadas por aproximación de BD
  const direcciones = await Direccion.findAll({
    where: {
      calle_id: { [Op.in]: calleIds },
      geocodificada: 1,
      estado: 1,
      latitud: { [Op.ne]: null },
      longitud: { [Op.ne]: null },
      [Op.or]: [
        { fuente_geocodificacion: { [Op.notLike]: "%Base de datos%" } },
        { fuente_geocodificacion: null },
      ],
    },
    include: [
      {
        model: Calle,
        as: "calle",
        attributes: ["nombre_completo"],
      },
    ],
    attributes: [
      "id",
      "numero_municipal",
      "manzana",
      "lote",
      "direccion_completa",
      "latitud",
      "longitud",
      "geocodificada",
      "location_type",
      "fuente_geocodificacion",
    ],
    limit: 200,
  });

  if (direcciones.length === 0) return null;

  // Paso 3: Encontrar la mejor coincidencia (SOLO misma cuadra)

  // 3a. Por número municipal - SOLO misma cuadra
  if (numero) {
    const inputNum = parseInt(numero.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(inputNum)) {
      const inputCuadra = Math.floor(inputNum / 100);
      let bestMatch = null;
      let bestDistance = Infinity;

      for (const dir of direcciones) {
        if (!dir.numero_municipal) continue;
        const dirNum = parseInt(
          dir.numero_municipal.replace(/[^0-9]/g, ""),
          10
        );
        if (isNaN(dirNum)) continue;

        // Solo considerar si está en la misma cuadra (misma centena)
        if (Math.floor(dirNum / 100) !== inputCuadra) continue;

        const distance = Math.abs(inputNum - dirNum);
        if (distance < bestDistance) {
          bestMatch = dir;
          bestDistance = distance;
        }
      }

      if (bestMatch) {
        console.log(`[GEOCODING] BD match cuadra ${inputCuadra}: ${bestMatch.direccion_completa} (distancia=${bestDistance})`);
        return {
          latitud: bestMatch.latitud,
          longitud: bestMatch.longitud,
          geocodificada: 1,
          location_type: "APPROXIMATE",
          fuente_geocodificacion: "Base de datos (dirección aproximada)",
          fuente: "database",
          direccion_referencia: bestMatch.direccion_completa,
          direccion_referencia_id: bestMatch.id,
          distancia_numerica: bestDistance,
          misma_cuadra: true,
        };
      }

      // No hay coincidencia en la misma cuadra → null para usar Nominatim
      return null;
    }
  }

  // 3b. Por manzana
  if (manzana) {
    const mzMatch = direcciones.find(
      (d) => d.manzana && d.manzana.toUpperCase() === manzana.toUpperCase()
    );
    if (mzMatch) {
      return {
        latitud: mzMatch.latitud,
        longitud: mzMatch.longitud,
        geocodificada: 1,
        location_type: "APPROXIMATE",
        fuente_geocodificacion: "Base de datos (manzana aproximada)",
        fuente: "database",
        direccion_referencia: mzMatch.direccion_completa,
        direccion_referencia_id: mzMatch.id,
      };
    }
  }

  // 3c. Sin número ni manzana → null para usar Nominatim
  return null;
}

// ============================================================================
// PRIORIDAD B: API NOMINATIM (OpenStreetMap)
// ============================================================================

/**
 * Mapea el type/class de Nominatim al ENUM location_type
 */
function mapNominatimType(type, clazz) {
  if (
    ["house", "building", "apartments", "house_number"].includes(type)
  ) {
    return "ROOFTOP";
  }
  if (
    [
      "street",
      "road",
      "highway",
      "residential",
      "tertiary",
      "secondary",
      "primary",
      "unclassified",
      "pedestrian",
      "service",
    ].includes(type) ||
    clazz === "highway"
  ) {
    return "GEOMETRIC_CENTER";
  }
  return "APPROXIMATE";
}

/**
 * Normaliza abreviaturas de vía para mejorar resolución en Nominatim
 */
function normalizarPrefijo(prefix) {
  if (!prefix) return "";
  const mapa = {
    "ca.": "Calle", "calle": "Calle",
    "av.": "Avenida", "avenida": "Avenida",
    "jr.": "Jirón", "jiron": "Jirón", "jirón": "Jirón",
    "pj.": "Pasaje", "psje.": "Pasaje", "pasaje": "Pasaje",
    "prol.": "Prolongación", "prolongación": "Prolongación", "prolongacion": "Prolongación",
    "malecon": "Malecón", "malecón": "Malecón",
    "alameda": "Alameda",
  };
  return mapa[prefix.toLowerCase()] || prefix;
}

/**
 * Llama a la API Nominatim con los parámetros dados
 */
async function llamarNominatim(params) {
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "CitySecBackend/1.0 (seguridad-ciudadana-municipal)",
      "Accept-Language": "es",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Nominatim API error: ${response.status} ${response.statusText}`
    );
  }

  const results = await response.json();
  if (!results || results.length === 0) return null;

  const result = results[0];
  const locationType = mapNominatimType(result.type, result.class);

  return {
    latitud: parseFloat(parseFloat(result.lat).toFixed(8)),
    longitud: parseFloat(parseFloat(result.lon).toFixed(8)),
    geocodificada: 1,
    location_type: locationType,
    fuente_geocodificacion: "Nominatim OpenStreetMap API",
    fuente: "nominatim",
    display_name: result.display_name,
  };
}

/**
 * Genera variaciones del nombre de calle para mejorar resultados en Nominatim.
 * OSM puede tener la calle con nombre diferente al local (ej: "Sta. Teresa" vs "Santa Teresa")
 */
function generarVariacionesNombre(streetName) {
  const variaciones = [streetName];
  const lower = streetName.toLowerCase();

  // Santa ↔ Sta.
  if (lower.startsWith("santa ")) {
    variaciones.push("Sta. " + streetName.substring(6));
  } else if (lower.startsWith("sta. ") || lower.startsWith("sta ")) {
    const rest = streetName.replace(/^sta\.?\s*/i, "");
    variaciones.push("Santa " + rest);
  }

  // Santo ↔ Sto.
  if (lower.startsWith("santo ")) {
    variaciones.push("Sto. " + streetName.substring(6));
  } else if (lower.startsWith("sto. ") || lower.startsWith("sto ")) {
    const rest = streetName.replace(/^sto\.?\s*/i, "");
    variaciones.push("Santo " + rest);
  }

  // San ↔ S.
  if (lower.startsWith("san ")) {
    variaciones.push("S. " + streetName.substring(4));
  } else if (lower.startsWith("s. ")) {
    variaciones.push("San " + streetName.substring(3));
  }

  return variaciones;
}

/**
 * Prioridad de location_type (menor = más preciso)
 */
function precisionScore(locationType) {
  const scores = { ROOFTOP: 0, RANGE_INTERPOLATED: 1, GEOMETRIC_CENTER: 2, APPROXIMATE: 3 };
  return scores[locationType] ?? 4;
}

/**
 * Geocodifica una dirección usando la API Nominatim de OpenStreetMap.
 * Intenta múltiples variaciones de búsqueda y retorna el resultado más preciso.
 *
 * Estrategia:
 *  1. Estructurada con prefijo normalizado (ej: "1052 Calle Santa Teresa")
 *  2. Estructurada sin prefijo (ej: "1052 Santa Teresa")
 *  3. Estructurada con variaciones de nombre (ej: "1052 Sta. Teresa")
 *  4. Free-form como último recurso
 *
 * Si algún intento retorna ROOFTOP, se usa inmediatamente.
 * Si no, se usa el mejor resultado disponible.
 *
 * @param {string} direccionStr - Texto de la dirección
 * @param {Object} parsed - Dirección parseada con streetPrefix, streetName, numero, etc.
 * @returns {Object|null} Resultado con coordenadas o null
 */
async function geocodificarConNominatim(direccionStr, parsed) {
  const distrito = DEFAULT_UBIGEO_INFO.distrito;
  const provincia = DEFAULT_UBIGEO_INFO.provincia;
  const pais = DEFAULT_COUNTRY_NAME;
  const countrycodes = DEFAULT_COUNTRY.toLowerCase();

  const baseParams = { city: distrito, county: provincia, country: pais, format: "json", limit: "1", addressdetails: "1", countrycodes };

  let bestResult = null;

  // Helper: intenta una búsqueda estructurada y actualiza bestResult
  const intentarEstructurada = async (streetValue, label) => {
    const params = new URLSearchParams({ street: streetValue, ...baseParams });
    const resultado = await llamarNominatim(params);
    if (resultado) {
      console.log(`[GEOCODING] Nominatim ${label}: type=${resultado.location_type}`);
      if (!bestResult || precisionScore(resultado.location_type) < precisionScore(bestResult.location_type)) {
        bestResult = resultado;
      }
      if (resultado.location_type === "ROOFTOP") return true;
    }
    return false;
  };

  if (parsed && parsed.streetName) {
    const prefijo = normalizarPrefijo(parsed.streetPrefix);
    const numero = parsed.numero || "";

    // Intento 1: Con prefijo normalizado → "1052 Calle Santa Teresa"
    const conPrefijo = prefijo ? `${numero} ${prefijo} ${parsed.streetName}`.trim() : "";
    if (conPrefijo) {
      const esRooftop = await intentarEstructurada(conPrefijo, "con prefijo");
      if (esRooftop) return bestResult;
    }

    // Intento 2: Sin prefijo → "1052 Santa Teresa"
    const sinPrefijo = `${numero} ${parsed.streetName}`.trim();
    if (sinPrefijo !== conPrefijo) {
      const esRooftop = await intentarEstructurada(sinPrefijo, "sin prefijo");
      if (esRooftop) return bestResult;
    }

    // Intento 3: Variaciones de nombre → "1052 Sta. Teresa"
    if (bestResult?.location_type !== "ROOFTOP") {
      const variaciones = generarVariacionesNombre(parsed.streetName);
      for (let i = 1; i < variaciones.length; i++) {
        const variacion = `${numero} ${variaciones[i]}`.trim();
        const esRooftop = await intentarEstructurada(variacion, `variación: ${variaciones[i]}`);
        if (esRooftop) return bestResult;
      }
    }
  }

  // Si ya tenemos un resultado preciso (ROOFTOP o RANGE_INTERPOLATED), retornarlo
  if (bestResult && precisionScore(bestResult.location_type) <= 1) {
    return bestResult;
  }

  // Intento 4: FREE-FORM como último recurso
  const query = [direccionStr, distrito, provincia, pais].filter(Boolean).join(", ");
  const paramsFreeForm = new URLSearchParams({ q: query, format: "json", limit: "1", addressdetails: "1", countrycodes });
  const freeFormResult = await llamarNominatim(paramsFreeForm);

  if (freeFormResult) {
    if (!bestResult || precisionScore(freeFormResult.location_type) < precisionScore(bestResult.location_type)) {
      bestResult = freeFormResult;
    }
  }

  return bestResult;
}

// ============================================================================
// ORQUESTADOR PRINCIPAL
// ============================================================================

/**
 * Geocodifica una dirección usando BD primero, luego Nominatim como fallback.
 *
 * @param {string} direccionStr - Texto libre de dirección
 * @returns {Object} Resultado de geocodificación
 */
export async function geocodificarDireccion(direccionStr) {
  console.log(`[GEOCODING] Geocodificando: "${direccionStr}"`);

  // Paso 1: Parsear la dirección
  const parsed = parseDireccionString(direccionStr);

  // Paso 2: Búsqueda aproximada en BD (Prioridad A)
  try {
    const dbResult = await buscarEnBaseDatos(parsed);
    if (dbResult) {
      console.log(`[GEOCODING] Resultado BD: ${dbResult.direccion_referencia}`);
      return {
        success: true,
        ...dbResult,
        metodo: "base_de_datos",
        parsed,
      };
    }
  } catch (error) {
    console.error("[GEOCODING] Error en búsqueda BD:", error.message);
  }

  // Paso 3: Nominatim API como fallback (Prioridad B)
  try {
    const nominatimResult = await geocodificarConNominatim(direccionStr, parsed);
    if (nominatimResult) {
      console.log(`[GEOCODING] Resultado Nominatim: lat=${nominatimResult.latitud} lng=${nominatimResult.longitud} type=${nominatimResult.location_type}`);
      return {
        success: true,
        ...nominatimResult,
        metodo: "nominatim_api",
        parsed,
      };
    }
  } catch (error) {
    console.error("[GEOCODING] Error en Nominatim:", error.message);
  }

  // Paso 4: Sin resultados
  console.log("[GEOCODING] Sin resultados para:", direccionStr);
  return {
    success: false,
    latitud: null,
    longitud: null,
    geocodificada: 0,
    location_type: null,
    fuente_geocodificacion: null,
    fuente: null,
    metodo: null,
    parsed,
    message: "No se encontraron coordenadas para la dirección proporcionada",
  };
}
