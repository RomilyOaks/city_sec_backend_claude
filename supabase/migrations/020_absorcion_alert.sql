-- Migración 020: Absorción de city_sec_alert — reportes ciudadanos y ciudadanos
-- Fecha: 2026-06-08
-- Spec: SPEC-ABSORCION-ALERT-001 (Fase 1 — solo Pasos 1 al 3, DROP comentado)
--
-- Sintaxis: PostgreSQL (Supabase, proyecto nkjmengotpcantnkziwt)
-- Contexto: todo vive en un único proyecto Supabase. citysecure_alert.usuarios
-- se migra a citysecure.ciudadanos; citysecure.reportes se renombra a
-- citysecure.reportes_ciudadano para evitar ambigüedad con las novedades internas.

-- ============================================================
-- PASO 1: Renombrar citysecure.reportes → citysecure.reportes_ciudadano
-- ============================================================
ALTER TABLE citysecure.reportes RENAME TO reportes_ciudadano;

-- Renombrar índice de PK solo si existe con el nombre esperado (defensivo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'citysecure' AND indexname = 'reportes_pkey'
  ) THEN
    ALTER INDEX citysecure.reportes_pkey RENAME TO reportes_ciudadano_pkey;
  END IF;
END $$;

-- Agregar índices nuevos que no existían
CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_created_by
  ON citysecure.reportes_ciudadano(created_by);

CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_novedad_id
  ON citysecure.reportes_ciudadano(novedad_id);

CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_sync_status
  ON citysecure.reportes_ciudadano(novedad_sync_status);

CREATE INDEX IF NOT EXISTS idx_reportes_ciudadano_created_at
  ON citysecure.reportes_ciudadano(created_at DESC);

-- ============================================================
-- PASO 2: Crear citysecure.ciudadanos
-- ============================================================
CREATE TABLE citysecure.ciudadanos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE NOT NULL,
  username      VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  telefono      VARCHAR(20),            -- centralizado aquí (en alert solo vivía en reportes)
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  deleted_by    UUID
);

CREATE INDEX idx_ciudadanos_user_id ON citysecure.ciudadanos(user_id);
CREATE INDEX idx_ciudadanos_email   ON citysecure.ciudadanos(email);

-- ============================================================
-- PASO 3: Migrar datos de citysecure_alert.usuarios → citysecure.ciudadanos
-- ============================================================
INSERT INTO citysecure.ciudadanos (
  id, user_id, username, email,
  created_at, updated_at, deleted_at, deleted_by
)
SELECT
  id, user_id, username, email,
  created_at, updated_at, deleted_at, deleted_by
FROM citysecure_alert.usuarios;

-- Nota: la columna telefono no existía en citysecure_alert.usuarios.
-- Queda NULL para ciudadanos migrados; se completará cuando vuelvan a iniciar sesión
-- (PhoneSetupModal de la app lo captura automáticamente).

-- ============================================================
-- PASO 4: Eliminar tabla original (ejecutar SOLO después de verificar PASO 3)
-- ============================================================
-- DROP TABLE citysecure_alert.usuarios;
-- (Comentado intencionalmente — ejecutar manualmente tras verificación,
--  ver Fase 7 del SPEC-ABSORCION-ALERT-001)
