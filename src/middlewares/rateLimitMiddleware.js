/**
 * Middleware temporal de Rate Limiting para detener bucles infinitos
 * @module middlewares/rateLimitMiddleware
 */

const rateLimitStore = new Map();

/**
 * Rate limiting por IP y endpoint
 * Máximo 10 solicitudes por minuto por endpoint por IP
 */
export const rateLimitMiddleware = (maxRequests = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.method}:${req.originalUrl}`;
    const now = Date.now();
    
    // Limpiar registros expirados
    if (rateLimitStore.has(key)) {
      const requests = rateLimitStore.get(key).filter(timestamp => 
        now - timestamp < windowMs
      );
      rateLimitStore.set(key, requests);
    } else {
      rateLimitStore.set(key, []);
    }
    
    // Verificar límite
    const requests = rateLimitStore.get(key);
    if (requests.length >= maxRequests) {
      console.log(`🚨 RATE LIMIT: IP ${req.ip} excedió límite de ${maxRequests} solicitudes/min para ${req.originalUrl}`);
      return res.status(429).json({
        success: false,
        message: "Too Many Requests - Posible bucle infinito detectado",
        retryAfter: Math.ceil(windowMs / 1000),
        debug: {
          ip: req.ip,
          endpoint: req.originalUrl,
          requestCount: requests.length,
          windowMs: windowMs
        }
      });
    }
    
    // Agregar solicitud actual
    requests.push(now);
    rateLimitStore.set(key, requests);
    
    next();
  };
};

/**
 * Rate limiting específico para endpoints de catálogos (más restrictivo)
 */
export const catalogRateLimit = rateLimitMiddleware(5, 60000); // 5 solicitudes por minuto

/**
 * Rate limiting general
 */
export const generalRateLimit = rateLimitMiddleware(20, 60000); // 20 solicitudes por minuto
