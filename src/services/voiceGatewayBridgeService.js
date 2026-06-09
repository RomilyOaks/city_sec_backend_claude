/**
 * ============================================================================
 * SERVICIO: Voice Gateway Bridge
 * ============================================================================
 * Envía reportes ciudadanos al Voice Gateway para transcripción con Whisper
 * y clasificación con Claude. Usa axios + form-data (NO fetch nativo).
 *
 * Por qué axios y no fetch:
 *   fetch nativo no calcula Content-Length para form-data, multer recibe
 *   el stream truncado → "Unexpected end of form". axios pasa el stream
 *   directamente y respeta los headers con boundary que genera form-data.
 *
 * Port de city_sec_alert/backend VoiceGatewayBridgeClient.ts → ES Modules JS
 * (SPEC-ABSORCION-ALERT-001, Fase 3)
 * ============================================================================
 */

import FormData from "form-data";
import axios from "axios";
import logger from "../utils/logger.js";

const BASE_URL   = process.env.VOICE_GATEWAY_URL ?? "http://localhost:3001";
const TIMEOUT_MS = parseInt(process.env.VOICE_GATEWAY_TIMEOUT_MS ?? "60000", 10);

// Mitigación SSRF: solo se permiten requests al host configurado
function assertTrustedEndpoint(url) {
  if (!url.startsWith(BASE_URL)) {
    throw new Error(`Endpoint no autorizado: ${url}`);
  }
}

/**
 * Envía audio (y metadatos) al Voice Gateway para transcripción y creación
 * de novedad en CitySecure.
 *
 * @param {object} options
 * @param {Buffer}  options.audioBuffer
 * @param {string}  options.audioMimeType
 * @param {string}  [options.audioFilename]
 * @param {string}  options.userId
 * @param {string}  options.incidentType
 * @param {{ lat: number, lng: number, address: string }} options.location
 * @param {string}  [options.telefono]
 * @param {string}  [options.description]
 * @param {string}  [options.fechaHoraOcurrencia]
 * @param {string}  [options.fotoUrl1]
 * @param {string}  [options.fotoUrl2]
 * @param {string}  [options.audioUrl]
 * @param {number}  [options.audioDuracionSeg]
 * @returns {Promise<{ success: boolean, voiceLogId?: number|null, novedadId?: number|null, error?: string }>}
 */
export async function transcribeAudio(options) {
  const endpoint = `${BASE_URL}/bridge/alert/transcribe`;
  assertTrustedEndpoint(endpoint);

  logger.info(`[VoiceGateway] Enviando audio: usuario=${options.userId} tipo=${options.incidentType} bytes=${options.audioBuffer.length}`);

  const formData = new FormData();

  formData.append("userId",       options.userId);
  formData.append("incidentType", options.incidentType);
  formData.append("ubicacion", JSON.stringify({
    lat: options.location.lat,
    lng: options.location.lng,
  }));

  if (options.telefono)            formData.append("telefono",            options.telefono);
  if (options.description)         formData.append("description",         options.description);
  if (options.fechaHoraOcurrencia) formData.append("fechaHoraOcurrencia", options.fechaHoraOcurrencia);
  if (options.fotoUrl1)            formData.append("fotoUrl1",            options.fotoUrl1);
  if (options.fotoUrl2)            formData.append("fotoUrl2",            options.fotoUrl2);
  if (options.audioUrl)            formData.append("audioUrl",            options.audioUrl);
  if (options.audioDuracionSeg !== undefined) {
    formData.append("audioDuracionSeg", String(options.audioDuracionSeg));
  }

  formData.append("audio", options.audioBuffer, {
    filename:    options.audioFilename ?? "reporte.m4a",
    contentType: options.audioMimeType ?? "audio/m4a",
    knownLength: options.audioBuffer.length,
  });

  try {
    const response = await axios.post(endpoint, formData, {
      headers: formData.getHeaders(),
      timeout: TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    logger.info(`[VoiceGateway] Respuesta: status=${response.status}`);

    const d = response.data;
    return {
      success:       d.success,
      transcription: d.transcription ?? d.data?.transcription,
      analysis:      d.analysis      ?? d.data?.analysis,
      voiceLogId:    d.voiceLogId    ?? d.data?.voiceLogId ?? d.data?.log_id ?? d.log_id ?? null,
      novedadId:     d.novedadId     ?? d.data?.novedad?.id ?? d.novedad?.id ?? null,
      error:         d.error,
    };
  } catch (err) {
    return handleAxiosError(err, endpoint);
  }
}

/**
 * Verifica disponibilidad del Voice Gateway.
 * @returns {Promise<{ healthy: boolean, status?: string, message?: string }>}
 */
export async function healthCheck() {
  const endpoint = `${BASE_URL}/health`;
  assertTrustedEndpoint(endpoint);

  try {
    const response = await axios.get(endpoint, { timeout: 5000 });
    return {
      healthy: response.status === 200,
      status:  String(response.status),
      message: response.data?.message ?? "OK",
    };
  } catch {
    return { healthy: false, message: "Voice Gateway no disponible" };
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  const result = await healthCheck();
  return result.healthy;
}

function handleAxiosError(err, endpoint) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const body   = err.response?.data;

    logger.error(`[VoiceGateway] Error HTTP ${status} en ${endpoint}`, { body });

    if (status === 400) {
      return { success: false, error: `Voice Gateway rechazó la solicitud: ${JSON.stringify(body)}` };
    }
    if (err.code === "ECONNABORTED") {
      return { success: false, error: "El Voice Gateway tardó demasiado en responder (timeout). Intente nuevamente." };
    }
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      return { success: false, error: "No se pudo conectar con el Voice Gateway. Verifique que el servicio esté activo." };
    }
    return { success: false, error: `Error en Voice Gateway (${status ?? err.code}): ${err.message}` };
  }

  logger.error("[VoiceGateway] Error inesperado", { err });
  return { success: false, error: "Error interno al comunicarse con el Voice Gateway." };
}
