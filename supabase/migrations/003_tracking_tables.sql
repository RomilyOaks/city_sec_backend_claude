-- =============================================================================
-- MIGRACIÓN 003: Sistema de Tracking GPS de Vehículos de Patrullaje
-- =============================================================================
-- Archivo  : supabase/migrations/003_tracking_tables.sql
-- Proyecto : CitySecure Backend
-- Fecha    : 2026-05-27
-- BD       : PostgreSQL (Supabase) — REFERENCIA FUTURA
--
-- NOTA IMPORTANTE:
--   Este archivo es una referencia para cuando el backend de serenazgo
--   migre a PostgreSQL/Supabase. El backend actual usa MySQL 8.0 en Railway.
--   Para la migración activa ver:
--   migrations/003_tracking_tables_mysql.sql
--
-- Diferencias MySQL → PostgreSQL aplicadas aquí:
--   - TINYINT(1) → SMALLINT
--   - ENGINE=InnoDB, CHARSET → eliminado (N/A en PG)
--   - AUTO_INCREMENT → SERIAL / BIGSERIAL
--   - DATETIME → TIMESTAMPTZ (con zona horaria)
--   - DEFAULT CURRENT_TIMESTAMP → DEFAULT NOW()
--   - ON UPDATE CURRENT_TIMESTAMP → manejado via trigger en PG
--   - COMMENT inline → COMMENT ON COLUMN
-- =============================================================================


-- =============================================================================
-- TABLA 1: tracking_vehiculos
-- =============================================================================

CREATE TABLE IF NOT EXISTS tracking_vehiculos (
  id                  SERIAL          NOT NULL,
  vehiculo_id         INTEGER         NOT NULL,
  personal_id         INTEGER             NULL,
  operativo_id        BIGINT              NULL,  -- BIGINT: equivalente a BIGINT UNSIGNED de MySQL (operativos_turno.id)
  lat                 DECIMAL(10,8)   NOT NULL,
  lng                 DECIMAL(11,8)   NOT NULL,
  velocidad           DECIMAL(5,2)        NULL,
  precision_gps       DECIMAL(6,2)        NULL,
  bateria_dispositivo SMALLINT            NULL,
  activo              BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_tracking_vehiculos         PRIMARY KEY (id),
  CONSTRAINT uq_tracking_vehiculo_id       UNIQUE      (vehiculo_id),
  CONSTRAINT fk_tv_vehiculo                FOREIGN KEY (vehiculo_id)
      REFERENCES vehiculos(id)             ON DELETE RESTRICT  ON UPDATE CASCADE,
  CONSTRAINT fk_tv_personal                FOREIGN KEY (personal_id)
      REFERENCES personal_seguridad(id)    ON DELETE SET NULL  ON UPDATE CASCADE,
  CONSTRAINT fk_tv_operativo               FOREIGN KEY (operativo_id)
      REFERENCES operativos_turno(id)      ON DELETE SET NULL  ON UPDATE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tracking_operativo  ON tracking_vehiculos (operativo_id);
CREATE INDEX IF NOT EXISTS idx_tracking_activo     ON tracking_vehiculos (activo);
CREATE INDEX IF NOT EXISTS idx_tracking_updated_at ON tracking_vehiculos (updated_at);

-- Comentarios
COMMENT ON TABLE  tracking_vehiculos                        IS 'Snapshot de última posición GPS por vehículo. Una fila por unidad — siempre UPSERT.';
COMMENT ON COLUMN tracking_vehiculos.vehiculo_id            IS 'FK a vehiculos.id — UNIQUE: una posición activa por unidad';
COMMENT ON COLUMN tracking_vehiculos.personal_id            IS 'FK a personal_seguridad.id — conductor activo (NULL si no asignado)';
COMMENT ON COLUMN tracking_vehiculos.operativo_id           IS 'FK a operativos_turno.id — turno activo (NULL fuera de turno)';
COMMENT ON COLUMN tracking_vehiculos.lat                    IS 'Latitud GPS — rango válido: -90 a 90';
COMMENT ON COLUMN tracking_vehiculos.lng                    IS 'Longitud GPS — rango válido: -180 a 180';
COMMENT ON COLUMN tracking_vehiculos.velocidad              IS 'Velocidad en km/h reportada por el dispositivo';
COMMENT ON COLUMN tracking_vehiculos.precision_gps          IS 'Precisión del GPS en metros (menor = más preciso)';
COMMENT ON COLUMN tracking_vehiculos.bateria_dispositivo    IS 'Porcentaje de batería del dispositivo móvil (0–100)';
COMMENT ON COLUMN tracking_vehiculos.activo                 IS 'true = en servicio y enviando GPS';
COMMENT ON COLUMN tracking_vehiculos.updated_at             IS 'Timestamp de última actualización de posición GPS';

-- Trigger para actualizar updated_at automáticamente (equivalente a ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tracking_vehiculos_updated_at
  BEFORE UPDATE ON tracking_vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_updated_at();


-- =============================================================================
-- TABLA 2: tracking_historial
-- =============================================================================

CREATE TABLE IF NOT EXISTS tracking_historial (
  id            BIGSERIAL     NOT NULL,
  vehiculo_id   INTEGER       NOT NULL,
  lat           DECIMAL(10,8) NOT NULL,
  lng           DECIMAL(11,8) NOT NULL,
  velocidad     DECIMAL(5,2)      NULL,
  registrado_at TIMESTAMPTZ   NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_tracking_historial  PRIMARY KEY (id),
  CONSTRAINT fk_th_vehiculo         FOREIGN KEY (vehiculo_id)
      REFERENCES vehiculos(id)      ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historial_vehiculo_tiempo
  ON tracking_historial (vehiculo_id, registrado_at);

CREATE INDEX IF NOT EXISTS idx_historial_registrado_at
  ON tracking_historial (registrado_at);

-- Comentarios
COMMENT ON TABLE  tracking_historial              IS 'Historial de posiciones GPS para rutas. PURGAR registros > 30 días.';
COMMENT ON COLUMN tracking_historial.registrado_at IS 'Timestamp del DISPOSITIVO — puede diferir del servidor por latencia';
COMMENT ON COLUMN tracking_historial.created_at    IS 'Timestamp del SERVIDOR — cuando se recibió el dato';


-- =============================================================================
-- PURGA MANUAL EN POSTGRESQL
-- =============================================================================
--
--   DELETE FROM tracking_historial
--   WHERE registrado_at < NOW() - INTERVAL '30 days';
--
-- Con pg_cron (extensión Supabase):
--
--   SELECT cron.schedule(
--     'purga-tracking-historial',
--     '0 3 * * *',  -- Cada día a las 3:00 AM
--     $$DELETE FROM tracking_historial WHERE registrado_at < NOW() - INTERVAL '30 days'$$
--   );
-- =============================================================================
