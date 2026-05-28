#!/usr/bin/env node
/**
 * ============================================================
 * simulate-tracking.js
 * ============================================================
 *
 * Simulador de ruta GPS para vehículos de patrullaje.
 * Recorre 10 puntos reales dentro del distrito de Chorrillos,
 * partiendo de la Comisaría de Chorrillos, y envía cada posición
 * al endpoint POST /api/v1/tracking/ubicacion cada 5 segundos.
 *
 * Ruta simulada:
 *   Comisaría Chorrillos → Av. Huaylas → Av. San Pedro →
 *   Av. El Sol → La Herradura → Av. Defensores del Morro →
 *   Av. Guardia Civil → regreso a zona Comisaría
 *
 * Uso:
 *   node scripts/simulate-tracking.js --vehiculo=1
 *   node scripts/simulate-tracking.js --vehiculo=3 --loop
 *
 * Variables de entorno (en .env o exportadas al shell):
 *   TRACKING_BASE_URL=http://localhost:3000    (default)
 *   TRACKING_JWT=eyJ...                        (requerido)
 *
 * Sin dependencias externas — usa fetch nativo de Node.js 20+
 *
 * @version 1.0.0
 * @date    2026-05-27
 */

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Helpers de ruta ES Modules ────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Colores ANSI para la consola ──────────────────────────────────────────────
const C = {
  reset  : "\x1b[0m",
  bold   : "\x1b[1m",
  dim    : "\x1b[2m",
  green  : "\x1b[32m",
  yellow : "\x1b[33m",
  blue   : "\x1b[34m",
  cyan   : "\x1b[36m",
  red    : "\x1b[31m",
  magenta: "\x1b[35m",
  white  : "\x1b[37m",
  bgGreen: "\x1b[42m",
  bgRed  : "\x1b[41m",
};

const ok    = (msg) => console.log(`${C.green}✓${C.reset} ${msg}`);
const info  = (msg) => console.log(`${C.cyan}ℹ${C.reset} ${msg}`);
const warn  = (msg) => console.log(`${C.yellow}⚠${C.reset} ${msg}`);
const error = (msg) => console.error(`${C.red}✗${C.reset} ${msg}`);
const sep   = ()    => console.log(`${C.dim}${"─".repeat(60)}${C.reset}`);

// ── Cargar .env manualmente (sin dotenv) ─────────────────────────────────────
function loadEnvFile() {
  const envPath = path.resolve(__dirname, "../.env");
  try {
    const content = fs.readFileSync(envPath, "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val   = line.slice(eqIdx + 1).trim();
      // Quitar comillas envolventes si existen
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      // No sobreescribir si ya fue definida como env var del shell
      if (key && !(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env no encontrado — se usan las variables del entorno del shell
  }
}

// ── Parsear argumentos CLI ────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val !== undefined ? val : true;
    }
  }
  return args;
}

// ── Haversine: distancia en km entre dos coordenadas ─────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Añadir ruido GPS realista (±0.00008° ≈ ±9 metros) ──────────────────────
function addGpsNoise(coord, maxDelta = 0.00008) {
  return coord + (Math.random() - 0.5) * 2 * maxDelta;
}

// ── Generar velocidad realista entre dos puntos ───────────────────────────────
// km/h en zona urbana de Chorrillos (15–55 km/h según tramo)
function estimateSpeed(distKm, intervalSeg = 5, noiseFactor = 0.15) {
  const baseKmh = (distKm / (intervalSeg / 3600));
  const clamped = Math.min(55, Math.max(5, baseKmh));
  const noise   = clamped * noiseFactor * (Math.random() - 0.5) * 2;
  return Math.round((clamped + noise) * 10) / 10;
}

// ── Formatear hora local Lima ─────────────────────────────────────────────────
function ahoraLima() {
  return new Date().toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Barra de batería visual ───────────────────────────────────────────────────
function batteryBar(pct) {
  const filled = Math.round(pct / 10);
  const bar    = "█".repeat(filled) + "░".repeat(10 - filled);
  const color  = pct > 50 ? C.green : pct > 20 ? C.yellow : C.red;
  return `${color}[${bar}]${C.reset} ${pct}%`;
}

// ── 10 waypoints reales en Chorrillos, Lima ───────────────────────────────────
//
// Ruta de patrullaje:
//  1. Comisaría Chorrillos (Av. Huaylas 970)          ← INICIO
//  2. Av. Huaylas / Jr. Dos de Mayo
//  3. Av. Huaylas / Av. San Pedro
//  4. Av. San Pedro heading west / Av. Los Laureles
//  5. Av. El Sol / Bajada a La Herradura
//  6. La Herradura (punto de giro)                    ← PUNTO MÁS AL SUR
//  7. Av. Defensores del Morro heading north
//  8. Av. Defensores del Morro / Av. Guardia Civil
//  9. Av. Guardia Civil heading east
// 10. Zona Comisaría (regreso)                        ← FIN DEL LOOP
//
const WAYPOINTS = [
  {
    nombre : "Comisaría de Chorrillos (Av. Huaylas 970) — INICIO",
    lat    : -12.170186520506988,
    lng    : -77.02321389053337,
    velRef : 0,     // arranca desde parado
  },
  {
    nombre : "Av. Huaylas / Jr. Dos de Mayo",
    lat    : -12.172431,
    lng    : -77.022857,
    velRef : 32,
  },
  {
    nombre : "Av. Huaylas / Av. San Pedro",
    lat    : -12.175210,
    lng    : -77.022189,
    velRef : 38,
  },
  {
    nombre : "Av. San Pedro / Av. Los Laureles",
    lat    : -12.175891,
    lng    : -77.024673,
    velRef : 35,
  },
  {
    nombre : "Av. El Sol (bajando hacia La Herradura)",
    lat    : -12.177234,
    lng    : -77.026891,
    velRef : 42,
  },
  {
    nombre : "La Herradura — Punto de giro",
    lat    : -12.179012,
    lng    : -77.028934,
    velRef : 20,    // reducción de velocidad en curva costera
  },
  {
    nombre : "Av. Defensores del Morro (subiendo al norte)",
    lat    : -12.177456,
    lng    : -77.030123,
    velRef : 40,
  },
  {
    nombre : "Av. Defensores del Morro / Av. Guardia Civil",
    lat    : -12.174321,
    lng    : -77.029876,
    velRef : 30,    // cruce con semáforo
  },
  {
    nombre : "Av. Guardia Civil (regresando al este)",
    lat    : -12.173145,
    lng    : -77.027234,
    velRef : 44,
  },
  {
    nombre : "Zona Comisaría — Fin de vuelta",
    lat    : -12.171023,
    lng    : -77.025012,
    velRef : 15,    // llegada, reduciendo velocidad
  },
];

// ── Enviar posición al backend ────────────────────────────────────────────────
async function sendPosition({
  baseUrl,
  jwt,
  vehiculoId,
  lat,
  lng,
  velocidad,
  precisionGps,
  bateria,
}) {
  const url  = `${baseUrl}/api/v1/tracking/ubicacion`;
  const body = {
    vehiculo_id         : vehiculoId,
    lat,
    lng,
    velocidad,
    precision_gps       : precisionGps,
    bateria_dispositivo : bateria,
  };

  const response = await fetch(url, {
    method  : "POST",
    headers : {
      "Content-Type"  : "application/json",
      Authorization   : `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

// ── Espera ms sin bloquear el event loop ─────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnvFile();
  const args = parseArgs(process.argv);

  // ── Parámetros ─────────────────────────────────────────────────────────────
  const vehiculoId = parseInt(args.vehiculo ?? args.v, 10);
  const loop       = Boolean(args.loop);
  const intervalMs = parseInt(args.interval ?? "5000", 10);

  const BASE_URL = process.env.TRACKING_BASE_URL || "http://localhost:3000";
  const JWT      = process.env.TRACKING_JWT      || "";

  // ── Validaciones básicas ───────────────────────────────────────────────────
  console.clear();
  console.log();
  console.log(
    `${C.bold}${C.bgGreen}                                          ${C.reset}`
  );
  console.log(
    `${C.bold}${C.bgGreen}   🚐 CitySecure · Simulador de Patrulla  ${C.reset}`
  );
  console.log(
    `${C.bold}${C.bgGreen}                                          ${C.reset}`
  );
  console.log();

  if (isNaN(vehiculoId) || vehiculoId < 1) {
    error("Debe indicar un vehiculo_id válido con --vehiculo=N");
    console.log(`${C.dim}  Ejemplo: node scripts/simulate-tracking.js --vehiculo=1${C.reset}`);
    process.exit(1);
  }

  if (!JWT) {
    error("La variable de entorno TRACKING_JWT no está definida.");
    console.log(
      `${C.dim}  Defínela en .env o exporta: export TRACKING_JWT=eyJ...${C.reset}`
    );
    process.exit(1);
  }

  // ── Cabecera de configuración ──────────────────────────────────────────────
  info(`Backend   : ${C.bold}${BASE_URL}${C.reset}`);
  info(`Vehículo  : ${C.bold}#${vehiculoId}${C.reset}`);
  info(`Waypoints : ${C.bold}${WAYPOINTS.length}${C.reset} puntos en Chorrillos`);
  info(`Intervalo : ${C.bold}${intervalMs / 1000}s${C.reset} entre envíos`);
  info(`Modo loop : ${loop ? `${C.green}activado${C.reset}` : `${C.dim}desactivado${C.reset}`}`);
  console.log();
  info(`JWT       : ${C.dim}${JWT.slice(0, 24)}...${JWT.slice(-6)}${C.reset}`);
  console.log();

  // ── Estadísticas globales ──────────────────────────────────────────────────
  let stats = {
    totalEnviados  : 0,
    totalOk        : 0,
    totalError     : 0,
    distanciaTotal : 0,
    vuelta         : 0,
  };

  // ── Batería simulada (85% → descarga lenta) ────────────────────────────────
  let bateria = 85;

  // ── Manejo de Ctrl+C ───────────────────────────────────────────────────────
  let detenido = false;
  process.on("SIGINT", () => {
    detenido = true;
    console.log();
    sep();
    console.log(`${C.bold}${C.yellow}Simulación interrumpida por el usuario.${C.reset}`);
    printStats(stats);
    process.exit(0);
  });

  // ── Bucle principal ────────────────────────────────────────────────────────
  do {
    stats.vuelta++;
    if (loop || stats.vuelta === 1) {
      sep();
      console.log(
        `${C.bold}${C.magenta}  🔄 Vuelta #${stats.vuelta}${C.reset}` +
          (loop ? `  ${C.dim}(Ctrl+C para detener)${C.reset}` : "")
      );
      sep();
    }

    for (let i = 0; i < WAYPOINTS.length && !detenido; i++) {
      const wp   = WAYPOINTS[i];
      const prev = WAYPOINTS[i - 1] ?? WAYPOINTS[WAYPOINTS.length - 1];

      // Calcular distancia y velocidad entre waypoints consecutivos
      const distKm = haversineKm(prev.lat, prev.lng, wp.lat, wp.lng);
      stats.distanciaTotal += distKm;

      // Aplicar ruido GPS y calcular velocidad con variación
      const latNoise = addGpsNoise(wp.lat);
      const lngNoise = addGpsNoise(wp.lng);

      // Velocidad: mezcla entre referencia del waypoint y la calculada
      const velCalculada = estimateSpeed(distKm, intervalMs / 1000);
      const velocidad    = Math.round(
        ((wp.velRef > 0 ? wp.velRef : velCalculada) * 0.7 +
          velCalculada * 0.3) *
          10
      ) / 10;

      // GPS precision: mejor en zona abierta, peor en curvas
      const precisionGps = Math.round(3 + Math.random() * 8); // 3-11 metros

      // Batería: descarga 0.5% por envío con variación
      bateria = Math.max(5, bateria - 0.3 - Math.random() * 0.4);
      const bateriaInt = Math.round(bateria);

      // Timestamp ISO 8601 (Lima = UTC-5)
      const timestamp = new Date().toISOString();

      // ── Mostrar punto actual ──────────────────────────────────────────────
      console.log();
      console.log(
        `${C.bold}${C.blue}[${ahoraLima()}]${C.reset} ` +
          `Punto ${C.bold}${i + 1}/${WAYPOINTS.length}${C.reset}`
      );
      console.log(`  📍 ${C.bold}${wp.nombre}${C.reset}`);
      console.log(
        `  ${C.dim}lat: ${latNoise.toFixed(7)}  lng: ${lngNoise.toFixed(7)}${C.reset}`
      );
      console.log(
        `  🚗 Velocidad: ${C.bold}${C.yellow}${velocidad} km/h${C.reset}` +
          `  📡 GPS: ±${precisionGps}m` +
          `  🔋 ${batteryBar(bateriaInt)}`
      );
      console.log(
        `  📏 Distancia al punto anterior: ${C.dim}${(distKm * 1000).toFixed(0)} m${C.reset}`
      );

      // ── Enviar al backend ─────────────────────────────────────────────────
      let resultado;
      try {
        resultado = await sendPosition({
          baseUrl    : BASE_URL,
          jwt        : JWT,
          vehiculoId,
          lat        : latNoise,
          lng        : lngNoise,
          velocidad,
          precisionGps,
          bateria    : bateriaInt,
        });
        stats.totalEnviados++;

        if (resultado.ok) {
          stats.totalOk++;
          const d = resultado.data?.data ?? {};
          ok(
            `HTTP ${resultado.status} · placa: ${C.bold}${d.placa ?? "—"}${C.reset}` +
              `  vehiculo_id: ${d.vehiculo_id ?? vehiculoId}`
          );
        } else {
          stats.totalError++;
          const msg =
            resultado.data?.message ||
            resultado.data?.error ||
            `HTTP ${resultado.status}`;
          warn(`HTTP ${resultado.status} · ${msg}`);
          if (resultado.data?.errors) {
            for (const e of resultado.data.errors) {
              console.log(`    ${C.dim}• [${e.field}] ${e.message}${C.reset}`);
            }
          }
        }
      } catch (err) {
        stats.totalError++;
        stats.totalEnviados++;
        error(`Fetch falló: ${err.message}`);
        warn("¿El servidor está corriendo? Verifique TRACKING_BASE_URL.");
      }

      // ── Esperar antes del siguiente punto (salvo el último en no-loop) ────
      const esUltimoPunto = i === WAYPOINTS.length - 1;
      if (!esUltimoPunto || loop) {
        if (!detenido) {
          process.stdout.write(
            `  ${C.dim}Próximo envío en ${intervalMs / 1000}s...${C.reset}\r`
          );
          await sleep(intervalMs);
        }
      }
    }

    if (!loop) break;
    console.log();
    info(`Vuelta #${stats.vuelta} completada. Iniciando siguiente vuelta...`);
    await sleep(intervalMs);
  } while (!detenido);

  // ── Resumen final ──────────────────────────────────────────────────────────
  console.log();
  sep();
  printStats(stats);
}

function printStats(stats) {
  console.log(`${C.bold}${C.cyan}  📊 Resumen de la simulación${C.reset}`);
  console.log();
  console.log(
    `  Vueltas completadas : ${C.bold}${stats.vuelta}${C.reset}`
  );
  console.log(
    `  Total enviados      : ${C.bold}${stats.totalEnviados}${C.reset}`
  );
  console.log(
    `  Exitosos            : ${C.bold}${C.green}${stats.totalOk}${C.reset}`
  );
  if (stats.totalError > 0) {
    console.log(
      `  Con error           : ${C.bold}${C.red}${stats.totalError}${C.reset}`
    );
  }
  console.log(
    `  Distancia total     : ${C.bold}${stats.distanciaTotal.toFixed(2)} km${C.reset}`
  );
  console.log();
}

main().catch((err) => {
  error(`Error fatal: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
