/**
 * @file sse-manager.js
 * @description Gestor de conexiones Server-Sent Events para CitySecure.
 * Mantiene un registro de todos los clientes conectados y permite
 * emitir eventos a todos ellos simultáneamente.
 */

import logger from "./logger.js";

// Mapa de clientes conectados: clientId → response object
const clients = new Map();

let clientCounter = 0;

/**
 * Registra un nuevo cliente SSE y devuelve su ID único.
 * Debe llamarse cuando el cliente se conecta al endpoint /stream.
 *
 * @param {import('express').Response} res - Objeto response de Express
 * @returns {number} clientId - ID único del cliente registrado
 */
export function addClient(res) {
  const clientId = ++clientCounter;
  clients.set(clientId, res);
  logger.info(`📡 [SSE] Cliente conectado. ID: ${clientId} | Total: ${clients.size}`);
  return clientId;
}

/**
 * Elimina un cliente del registro cuando se desconecta.
 *
 * @param {number} clientId - ID del cliente a eliminar
 */
export function removeClient(clientId) {
  clients.delete(clientId);
  logger.info(`📡 [SSE] Cliente desconectado. ID: ${clientId} | Total: ${clients.size}`);
}

/**
 * Emite un evento SSE a TODOS los clientes conectados.
 * Formato estándar SSE: "event: nombre\ndata: json\n\n"
 *
 * @param {string} eventName - Nombre del evento (ej: 'nueva_novedad')
 * @param {Object} data - Datos a enviar (se serializan como JSON)
 */
export function broadcastEvent(eventName, data) {
  if (clients.size === 0) {
    logger.debug(`📡 [SSE] No hay clientes conectados para el evento: ${eventName}`);
    return;
  }

  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

  logger.info(`📡 [SSE] Emitiendo "${eventName}" a ${clients.size} cliente(s)`);

  // Iterar sobre todos los clientes y enviar el evento
  for (const [clientId, res] of clients.entries()) {
    try {
      res.write(payload);
    } catch (error) {
      // Si falla la escritura, el cliente se desconectó — lo eliminamos
      logger.warn(`📡 [SSE] Error escribiendo al cliente ${clientId}, eliminando:`, error.message);
      removeClient(clientId);
    }
  }
}

/**
 * Devuelve la cantidad de clientes actualmente conectados.
 * Útil para health checks y métricas.
 *
 * @returns {number}
 */
export function getConnectedClientsCount() {
  return clients.size;
}
