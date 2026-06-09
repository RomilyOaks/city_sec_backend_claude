/**
 * ============================================================================
 * SERVICIO: Supabase Storage
 * ============================================================================
 * Sube fotos y audio de reportes ciudadanos a los buckets existentes del
 * proyecto Supabase (nkjmengotpcantnkziwt).
 *
 * Buckets: reportes-fotos, reportes-audio
 * Seguridad: userId sanitizado antes de usarse como path (evita path traversal)
 *
 * Port de city_sec_alert/backend SupabaseStorageService.ts → ES Modules JS
 * (SPEC-ABSORCION-ALERT-001, Fase 3)
 * ============================================================================
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import path from "path";

// Lazy singleton — inicializado en el primer uso
let _client = null;

function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _client;
}

const MIME_EXT_MAP = {
  "image/jpeg":  ".jpg",
  "image/jpg":   ".jpg",
  "image/png":   ".png",
  "image/webp":  ".webp",
  "audio/mpeg":  ".mp3",
  "audio/mp4":   ".mp4",
  "audio/m4a":   ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/aac":   ".aac",
  "audio/wav":   ".wav",
};

function getExtension(mimetype) {
  return MIME_EXT_MAP[mimetype] ?? path.extname(mimetype) ?? "";
}

function buildSafePath(userId, mimetype) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `${safeUserId}/${randomUUID()}${getExtension(mimetype)}`;
  if (fileName.includes("..")) throw new Error("Nombre de archivo inválido");
  return fileName;
}

/**
 * Sube una foto al bucket reportes-fotos.
 * @param {string} userId UUID del ciudadano (Supabase Auth)
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 * @returns {Promise<string>} URL pública
 */
export async function uploadFoto(userId, fileBuffer, mimetype) {
  const fileName = buildSafePath(userId, mimetype);
  const supabase = getClient();

  const { error } = await supabase.storage
    .from("reportes-fotos")
    .upload(fileName, fileBuffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`Error al subir foto: ${error.message}`);

  const { data } = supabase.storage.from("reportes-fotos").getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Sube un audio al bucket reportes-audio.
 * @param {string} userId UUID del ciudadano (Supabase Auth)
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 * @returns {Promise<string>} URL pública
 */
export async function uploadAudio(userId, fileBuffer, mimetype) {
  const fileName = buildSafePath(userId, mimetype);
  const supabase = getClient();

  const { error } = await supabase.storage
    .from("reportes-audio")
    .upload(fileName, fileBuffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`Error al subir audio: ${error.message}`);

  const { data } = supabase.storage.from("reportes-audio").getPublicUrl(fileName);
  return data.publicUrl;
}
